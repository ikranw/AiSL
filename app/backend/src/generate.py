from __future__ import annotations

import json
import os
import re
from time import perf_counter
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from retrieval import retrieve_context
from prompting import build_prompt
from validate import validate_output
from normalize import normalize_output

# Temporary fallback until map_to_signs.py is implemented
try:
    from map_to_signs import map_to_signs
except ImportError:
    def map_to_signs(data: dict[str, Any]) -> dict[str, Any]:
        return data


load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

if not API_KEY:
    raise RuntimeError("OPENAI_API_KEY is missing in .env")

client = OpenAI(api_key=API_KEY)


def call_llm(prompt: str) -> str:
    response = client.responses.create(
        model=MODEL_NAME,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a strict JSON generator for dataset-compatible ASL gloss. "
                    "You must output exactly one valid JSON object and nothing else. "
                    "Do not explain. Do not add commentary. Do not add markdown."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_output_tokens=300,
    )
    return response.output_text


def build_repair_prompt(original_text: str, invalid_output: str, error_message: str) -> str:
    return f"""You are repairing invalid JSON for a dataset-compatible ASL gloss system.

Return corrected JSON only.
Do not return markdown.
Do not explain your reasoning.

Required schema:
{{
  "input_text": "string",
  "sentence_type": "statement | wh_question | yes_no_question | negation | conditional | command",
  "gloss_tokens": ["TOKEN1", "TOKEN2"],
  "non_manual": [],
  "confidence_note": "string"
}}

Original input sentence:
{original_text}

Invalid model output:
{invalid_output}

Validation/parsing error:
{error_message}

Repair instructions:
- Return valid JSON only.
- Keep the meaning aligned with the original input sentence.
- sentence_type must be one of the allowed enum values only.
- gloss_tokens must be an array of strings.
- non_manual must be an array, even if empty.
- confidence_note must be a string.
- Use plain gloss words only.
- Do not include prefixes such as X- or DESC-.
- Do not use wrappers such as FINGERSPELL(...).
"""


def _clean_gloss_token(token: str) -> str:
    token = token.strip()
    if not token:
        return ""

    # Unwrap fingerspelling markers: FINGERSPELL(name) -> NAME
    match = re.fullmatch(r"FINGERSPELL\((.*)\)", token, flags=re.IGNORECASE)
    if match:
        token = match.group(1).strip()

    # Remove known dataset indicator prefixes
    upper = token.upper()
    for prefix in ("X-", "DESC-"):
        if upper.startswith(prefix):
            token = token[len(prefix):]
            break

    token = " ".join(token.split())
    token = token.upper()

    # Never expose POSS in output; normalize it to MY for display gloss.
    if token == "POSS":
        return "MY"

    return token


def _to_sign_token(token: str) -> str:
    # Unity should sign first-person and possessive first-person with the MY sign.
    if token in {"I", "MY", "POSS"}:
        return "MY"
    return token


def _clean_output_markers(data: dict[str, Any]) -> dict[str, Any]:
    result = dict(data)
    cleaned_tokens: list[str] = []
    for token in result.get("gloss_tokens", []):
        if not isinstance(token, str):
            continue
        cleaned = _clean_gloss_token(token)
        if cleaned:
            cleaned_tokens.append(cleaned)

    result["gloss_tokens"] = cleaned_tokens
    cleaned_sequence: list[dict[str, str]] = []
    for item in result.get("sign_sequence", []):
        if not isinstance(item, dict):
            continue

        raw_token = item.get("token", "")
        if not isinstance(raw_token, str):
            continue

        cleaned_token = _clean_gloss_token(raw_token)
        if not cleaned_token:
            continue

        sign_token = _to_sign_token(cleaned_token)
        cleaned_sequence.append({
            "token": sign_token,
            "sign_id": sign_token,
            "type": str(item.get("type", "sign")) or "sign",
        })

    if cleaned_sequence:
        result["sign_sequence"] = cleaned_sequence

    return result


def extract_json_object(raw_text: str) -> str:
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in model output:\n{raw_text}")
    return raw_text[start:end + 1]


def parse_and_validate(raw_output: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError:
        extracted = extract_json_object(raw_output)
        try:
            parsed = json.loads(extracted)
        except json.JSONDecodeError as e:
            raise ValueError(f"Model returned invalid JSON:\n{raw_output}") from e

    validated = validate_output(parsed)
    return validated


def generate_once(text: str) -> dict[str, Any]:
    text = text.strip()
    if not text:
        raise ValueError("Input text cannot be empty.")

    started_at = perf_counter()

    # 1. Retrieve context
    retrieval_started_at = perf_counter()
    context = retrieve_context(text)
    retrieval_ms = round((perf_counter() - retrieval_started_at) * 1000, 1)

    # 2. Build prompt
    prompt = build_prompt(
        input_text=text,
        retrieved_rules=context["retrieved_rules"],
        retrieved_examples=context["retrieved_examples"],
        allowed_token_policy=context["allowed_token_policy"],
    )

    # 3. Call LLM
    llm_started_at = perf_counter()
    raw_output = call_llm(prompt)
    llm_ms = round((perf_counter() - llm_started_at) * 1000, 1)
    used_repair = False
    repair_ms = 0.0

    # 4. Parse + validate, with one repair retry
    try:
        validated = parse_and_validate(raw_output)
    except Exception as e:
        used_repair = True
        repair_prompt = build_repair_prompt(
            original_text=text,
            invalid_output=raw_output,
            error_message=str(e),
        )

        repair_started_at = perf_counter()
        repaired_output = call_llm(repair_prompt)
        repair_ms = round((perf_counter() - repair_started_at) * 1000, 1)

        try:
            validated = parse_and_validate(repaired_output)
        except Exception as repair_error:
            raise ValueError(
                "Initial model output failed, and repair attempt also failed.\n\n"
                f"Original output:\n{raw_output}\n\n"
                f"Repair output:\n{repaired_output}\n\n"
                f"Repair error:\n{repair_error}"
            ) from repair_error

    # 5. Normalize
    normalized = normalize_output(validated)

    # 6. Map to signs
    mapped = map_to_signs(normalized)

    # 7. Ensure output contains plain gloss words only (no X-/DESC-/FINGERSPELL markers)
    cleaned = _clean_output_markers(mapped)
    cleaned["diagnostics"] = {
        "retrieval_ms": retrieval_ms,
        "llm_ms": llm_ms,
        "repair_ms": repair_ms,
        "used_repair": used_repair,
        "total_ms": round((perf_counter() - started_at) * 1000, 1),
    }

    return cleaned


if __name__ == "__main__":
    sample_text = "Where are you going tomorrow?"
    result = generate_once(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))
