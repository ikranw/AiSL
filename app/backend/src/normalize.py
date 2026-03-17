from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

SIGN_INVENTORY_PATH = DATA_DIR / "sign_inventory.json"
SYNONYMS_PATH = DATA_DIR / "synonyms.json"

TIME_MARKERS = {
    "TODAY",
    "TOMORROW",
    "YESTERDAY",
    "NOW",
    "TONIGHT",
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "NEXT-WEEK",
    "LAST-WEEK",
    "NEXT-MONTH",
    "LAST-MONTH",
    "NEXT-YEAR",
    "LAST-YEAR",
}

DROP_TOKENS = {"", ".", ",", "!", ";", ":"}

# Optional light normalization for common English-like outputs
DEFAULT_DIRECT_MAP = {
    "ME": "I",
    "MYSELF": "I",
    "YOU'RE": "YOU",
    "I'M": "I",
    "DON'T": "DESC-NOT",
    "DOESN'T": "DESC-NOT",
    "DIDN'T": "DESC-NOT",
    "CAN'T": "DESC-NOT",
    "CANNOT": "DESC-NOT",
    "WON'T": "DESC-NOT",
    "ISN'T": "DESC-NOT",
    "AREN'T": "DESC-NOT",
    "WASN'T": "DESC-NOT",
    "WEREN'T": "DESC-NOT",
}


def _load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_inventory() -> set[str]:
    data = _load_json(SIGN_INVENTORY_PATH)
    return set(data["canonical_tokens"])


def _load_synonyms() -> dict[str, str]:
    if not SYNONYMS_PATH.exists():
        return {}
    data = _load_json(SYNONYMS_PATH)
    return {str(k).upper(): str(v).upper() for k, v in data.items()}


def _strip_outer_punctuation(token: str) -> str:
    # Preserve internal hyphens, e.g. X-I, DESC-NOT, NEW-YORK
    token = token.strip()
    token = re.sub(r"^[^\w?'-]+|[^\w?'-]+$", "", token)
    return token.strip()


def _normalize_phrase_token(token: str) -> list[str]:
    """
    Handles phrase-like outputs from the LLM, e.g. 'new york' -> ['NEW-YORK'].
    """
    cleaned = " ".join(token.strip().split())
    lowered = cleaned.lower()

    if lowered == "new york":
        return ["NEW-YORK"]

    return [cleaned]


def _canonicalize_token(token: str, synonyms: dict[str, str]) -> str:
    token = token.strip()
    token = " ".join(token.split())
    token = token.upper()
    token = _strip_outer_punctuation(token)

    if token in DEFAULT_DIRECT_MAP:
        token = DEFAULT_DIRECT_MAP[token]

    if token in synonyms:
        token = synonyms[token]

    return token


def _fingerspell(token: str) -> str:
    cleaned = token.strip().lower()
    cleaned = re.sub(r"\s+", "-", cleaned)
    return f"FINGERSPELL({cleaned})"


def _collapse_repeated_time_markers(tokens: list[str]) -> list[str]:
    seen_time = set()
    result: list[str] = []

    for token in tokens:
        if token in TIME_MARKERS:
            if token in seen_time:
                continue
            seen_time.add(token)
        result.append(token)

    return result


def normalize_gloss_tokens(gloss_tokens: list[str]) -> list[str]:
    inventory = _load_inventory()
    synonyms = _load_synonyms()

    normalized: list[str] = []

    for raw_token in gloss_tokens:
        if not isinstance(raw_token, str):
            continue

        phrase_chunks = _normalize_phrase_token(raw_token)

        for chunk in phrase_chunks:
            token = _canonicalize_token(chunk, synonyms)

            if not token or token in DROP_TOKENS:
                continue

            # Special preservation for dataset-style tokens
            if token in inventory:
                normalized.append(token)
                continue

            # If token is already a fingerspell directive, preserve a normalized version
            if token.startswith("FINGERSPELL(") and token.endswith(")"):
                inner = token[len("FINGERSPELL("):-1].strip()
                normalized.append(_fingerspell(inner))
                continue

            # If it is a phrase still containing spaces, try hyphenation once
            if " " in token:
                hyphenated = token.replace(" ", "-")
                if hyphenated in inventory:
                    normalized.append(hyphenated)
                    continue

                # If still not allowed, fingerspell the full phrase
                normalized.append(_fingerspell(token))
                continue

            # Unknown token fallback
            normalized.append(_fingerspell(token))

    normalized = _collapse_repeated_time_markers(normalized)
    return normalized


def normalize_output(data: dict[str, Any]) -> dict[str, Any]:
    """
    Expects a validated output dict with:
    - input_text
    - sentence_type
    - gloss_tokens
    - non_manual
    - confidence_note
    """
    result = dict(data)

    result["input_text"] = " ".join(str(result["input_text"]).split()).strip()
    result["gloss_tokens"] = normalize_gloss_tokens(result.get("gloss_tokens", []))
    result["non_manual"] = [
        " ".join(str(item).split()).strip()
        for item in result.get("non_manual", [])
        if str(item).strip()
    ]
    result["confidence_note"] = " ".join(str(result.get("confidence_note", "")).split()).strip()

    return result


if __name__ == "__main__":
    sample = {
        "input_text": "  Tomorrow   go to school me  ",
        "sentence_type": "statement",
        "gloss_tokens": ["Tomorrow", "go", "to", "school", "me", "new york", "columbus", "."],
        "non_manual": [],
        "confidence_note": "  basic   reordering applied  ",
    }

    print(json.dumps(normalize_output(sample), indent=2))