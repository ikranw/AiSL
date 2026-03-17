from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

from retrieval import retrieve_context
from prompting import build_prompt
from validate import validate_output

# These two will be implemented in later phases.
# For now, we provide safe fallbacks if the files do not exist yet.
try:
    from normalize import normalize_output
except ImportError:
    def normalize_output(data: Any) -> Any:
        return data

try:
    from map_to_signs import map_to_signs
except ImportError:
    def map_to_signs(data: Any) -> Any:
        return data


load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

if not API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY is missing. Add it to your .env file in app/backend."
    )

client = OpenAI(api_key=API_KEY)


def call_llm(prompt: str) -> str:
    """
    Calls the OpenAI model and returns raw text.
    We explicitly ask for JSON text output only.
    """
    response = client.responses.create(
        model=MODEL_NAME,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a precise generator for dataset-compatible ASL gloss. "
                    "Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        max_output_tokens=300,
    )

    return response.output_text


def generate_once(text: str) -> dict[str, Any]:
    """
    Full Phase 9 flow:
    retrieve → prompt → LLM → parse JSON → validate → normalize → map
    """
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

    # 4. Parse JSON
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Model returned invalid JSON.\n\nRaw output:\n{raw_output}"
        ) from e

    # 5. Validate output schema
    validated = validate_output(parsed)

    # 6. Normalize output
    normalized = normalize_output(validated)

    # 7. Map to signs
    mapped = map_to_signs(normalized)

    # If later phases return Pydantic objects, convert cleanly
    if hasattr(mapped, "model_dump"):
        return mapped.model_dump()

    return mapped


if __name__ == "__main__":
    sample_text = "Where are you going tomorrow?"
    result = generate_once(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))