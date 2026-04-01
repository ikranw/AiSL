from __future__ import annotations

import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent
PROMPT_TEMPLATE_PATH = BASE_DIR / "configs" / "prompt_template.txt"


def _load_prompt_template() -> str:
    with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()


def _format_rules(rules: list[dict[str, Any]]) -> str:
    if not rules:
        return "None"

    lines: list[str] = []
    for idx, rule in enumerate(rules, start=1):
        rule_id = rule.get("rule_id", "")
        description = rule.get("description", "")
        pattern = rule.get("pattern", "")
        examples = rule.get("examples", [])

        lines.append(f"{idx}. rule_id: {rule_id}")
        lines.append(f"   description: {description}")
        lines.append(f"   pattern: {pattern}")

        if examples:
            lines.append("   examples:")
            for ex in examples[:3]:
                lines.append(f"   - {ex}")

    return "\n".join(lines)


def _format_examples(examples: list[dict[str, Any]]) -> str:
    if not examples:
        return "None"

    lines: list[str] = []
    for idx, ex in enumerate(examples[:5], start=1):
        english = ex.get("english", "")
        gloss = ex.get("gloss", [])
        sentence_type = ex.get("sentence_type", "")
        score = ex.get("similarity_score", None)

        if isinstance(gloss, list):
            gloss_text = " ".join(gloss)
        else:
            gloss_text = str(gloss)

        lines.append(f"{idx}. english: {english}")
        lines.append(f"   gloss: {gloss_text}")
        lines.append(f"   sentence_type: {sentence_type}")
        if score is not None:
            lines.append(f"   similarity_score: {score:.4f}")

    return "\n".join(lines)


def build_prompt(
    input_text: str,
    retrieved_rules: list[dict[str, Any]],
    retrieved_examples: list[dict[str, Any]],
    allowed_token_policy: str,
) -> str:
    template = _load_prompt_template()

    formatted_rules = _format_rules(retrieved_rules)
    formatted_examples = _format_examples(retrieved_examples)

    prompt = template.format(
        allowed_token_policy=allowed_token_policy,
        retrieved_rules=formatted_rules,
        retrieved_examples=formatted_examples,
        input_text=input_text.strip(),
    )

    return prompt


if __name__ == "__main__":
    sample_rules = [
        {
            "rule_id": "preserve-x-pronouns",
            "description": "Pronouns may appear in canonical X- forms.",
            "pattern": "Use X- forms when supported by examples.",
            "examples": ["I think it is a misunderstanding -> X-I THINK X-IT BE MISUNDERSTANDING"],
        }
    ]

    sample_examples = [
        {
            "english": "Where are these?",
            "gloss": ["WHERE", "BE", "SE", "?"],
            "sentence_type": "wh_question",
            "similarity_score": 0.8123,
        }
    ]

    sample_policy = (
        "Use only canonical gloss tokens from the allowed list. "
        "Remove X-* and DESC-* token forms exactly when supported by inventory or examples. "
        "Do not invent new tokens or forms that are not supported by the inventory or examples."
        )

    prompt = build_prompt(
        input_text="Where are you going tomorrow?",
        retrieved_rules=sample_rules,
        retrieved_examples=sample_examples,
        allowed_token_policy=sample_policy,
    )

    print(prompt)