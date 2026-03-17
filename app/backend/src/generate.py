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
                "content": "You are a precise generator for dataset-compatible ASL gloss. Return valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_output_tokens=300,
    )
    return response.output_text


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

    # 4. Parse JSON
    try:
        parsed = json.loads(raw_output)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON:\n{raw_output}") from e

    # 5. Validate schema
    validated = validate_output(parsed)

    # 6. Normalize tokens
    normalized = normalize_output(validated)

    # 7. Map to signs
    mapped = map_to_signs(normalized)

    return mapped


if __name__ == "__main__":
    sample_text = "Where are you going tomorrow?"
    result = generate_once(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))