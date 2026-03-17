from __future__ import annotations

import json
import os
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
                    "You are a precise generator for dataset-compatible ASL gloss. "
                    "Return valid JSON only."
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
- Preserve dataset-style X-* and DESC-* tokens when appropriate.
"""


def parse_and_validate(raw_output: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON:\n{raw_output}") from e

    validated = validate_output(parsed)
    return validated


def generate_once(text: str) -> dict[str, Any]:
    text = text.strip()
    if not text:
        raise ValueError("Input text cannot be empty.")

    # 1. Retrieve context
    context = retrieve_context(text)

    # 2. Build prompt
    prompt = build_prompt(
        input_text=text,
        retrieved_rules=context["retrieved_rules"],
        retrieved_examples=context["retrieved_examples"],
        allowed_token_policy=context["allowed_token_policy"],
    )

    # 3. Call LLM
    raw_output = call_llm(prompt)

    # 4. Parse + validate, with one repair retry
    try:
        validated = parse_and_validate(raw_output)
    except Exception as e:
        repair_prompt = build_repair_prompt(
            original_text=text,
            invalid_output=raw_output,
            error_message=str(e),
        )

        repaired_output = call_llm(repair_prompt)

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

    return mapped


if __name__ == "__main__":
    sample_text = "I want to go to the store."
    result = generate_once(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))