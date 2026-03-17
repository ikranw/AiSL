from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

GRAMMAR_RULES_PATH = DATA_DIR / "grammar_rules.json"
EXAMPLE_BANK_PATH = DATA_DIR / "example_bank.jsonl"
SIGN_INVENTORY_PATH = DATA_DIR / "sign_inventory.json"


TIME_WORDS = {
    "today", "tomorrow", "yesterday", "tonight", "morning", "afternoon",
    "evening", "week", "month", "year", "next", "last", "before", "after",
    "later", "soon", "now"
}

WH_WORDS = {
    "what", "where", "when", "why", "how", "who", "whom", "which"
}

NEGATION_WORDS = {
    "not", "don't", "doesn't", "didn't", "never", "no", "cannot", "can't",
    "won't", "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't"
}

CONDITIONAL_WORDS = {
    "if", "unless", "otherwise", "provided", "assuming"
}

COMMAND_HINT_WORDS = {
    "please", "let", "remember", "do", "go", "stop", "help"
}


def _load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def _tokenize_text(text: str) -> list[str]:
    return re.findall(r"[A-Za-z']+", text.lower())


def _detect_features(text: str) -> set[str]:
    tokens = set(_tokenize_text(text))
    features: set[str] = set()

    if tokens & TIME_WORDS:
        features.add("time")
    if tokens & WH_WORDS or text.strip().endswith("?"):
        features.add("question")
    if tokens & NEGATION_WORDS:
        features.add("negation")
    if tokens & CONDITIONAL_WORDS:
        features.add("conditional")

    # Very rough command hint
    if any(text.lower().startswith(word + " ") for word in COMMAND_HINT_WORDS):
        features.add("command")

    return features


def _get_default_rules(grammar_rules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    defaults = []
    for rule in grammar_rules:
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id in {"compressed-gloss-style", "preserve-x-pronouns", "preserve-desc-markers"}:
            defaults.append(rule)
    return defaults


def _select_relevant_rules(
    text: str,
    grammar_rules: list[dict[str, Any]],
    max_rules: int = 5
) -> list[dict[str, Any]]:
    features = _detect_features(text)
    selected: list[dict[str, Any]] = []

    feature_to_rule_ids = {
        "time": {"time-topic-comment"},
        "question": {"question-marking", "wh-question"},
        "negation": {"explicit-negation", "negation"},
        "conditional": {"conditional"},
        "command": {"command"},
    }

    wanted_rule_ids = set()
    for feature in features:
        wanted_rule_ids |= feature_to_rule_ids.get(feature, set())

    for rule in grammar_rules:
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id in wanted_rule_ids:
            selected.append(rule)

    # Always include a few general-purpose rules
    existing_ids = {str(r.get("rule_id", "")).lower() for r in selected}
    for rule in _get_default_rules(grammar_rules):
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id not in existing_ids:
            selected.append(rule)
            existing_ids.add(rule_id)

    return selected[:max_rules]


def _select_similar_examples(
    text: str,
    example_bank: list[dict[str, Any]],
    max_examples: int = 5
) -> list[dict[str, Any]]:
    if not example_bank:
        return []

    corpus = [str(row.get("english", "")).strip() for row in example_bank]
    query = text.strip()

    # Fallback if all corpus texts are empty
    if not any(corpus):
        return example_bank[:max_examples]

    vectorizer = TfidfVectorizer(lowercase=True, ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(corpus + [query])

    example_matrix = matrix[:-1]
    query_vector = matrix[-1]

    scores = cosine_similarity(query_vector, example_matrix).flatten()
    ranked_indices = scores.argsort()[::-1][:max_examples]

    results = []
    for idx in ranked_indices:
        item = dict(example_bank[idx])
        item["similarity_score"] = float(scores[idx])
        results.append(item)

    return results


def _build_allowed_token_policy(sign_inventory: dict[str, Any]) -> str:
    canonical_tokens = sign_inventory.get("canonical_tokens", [])
    token_count = len(canonical_tokens)

    return (
        f"Use only canonical gloss tokens from the allowed list "
        f"(current inventory size: {token_count}). "
        f"Preserve X-* and DESC-* token forms exactly when supported by the inventory "
        f"or retrieved examples. "
        f"If a needed concept is unavailable, output FINGERSPELL(word)."
    )


def retrieve_context(text: str) -> dict[str, Any]:
    grammar_rules = _load_json(GRAMMAR_RULES_PATH)
    example_bank = _load_jsonl(EXAMPLE_BANK_PATH)
    sign_inventory = _load_json(SIGN_INVENTORY_PATH)

    retrieved_rules = _select_relevant_rules(text, grammar_rules, max_rules=5)
    retrieved_examples = _select_similar_examples(text, example_bank, max_examples=5)
    allowed_token_policy = _build_allowed_token_policy(sign_inventory)

    return {
        "retrieved_rules": retrieved_rules,
        "retrieved_examples": retrieved_examples,
        "allowed_token_policy": allowed_token_policy,
    }


if __name__ == "__main__":
    sample_text = "Where are you going tomorrow?"
    result = retrieve_context(sample_text)

    print(json.dumps(result, indent=2, ensure_ascii=False))