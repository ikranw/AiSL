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
CURATED_EXAMPLE_BANK_PATH = DATA_DIR / "example_bank_curated.jsonl"
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
    "please", "let", "remember", "do", "go", "stop", "help", "look", "sit", "tell"
}


def _load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

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
    if tokens & WH_WORDS:
        features.add("question")
        features.add("wh_question")
    elif text.strip().endswith("?"):
        features.add("question")
        features.add("yes_no_question")
    if tokens & NEGATION_WORDS:
        features.add("negation")
    if tokens & CONDITIONAL_WORDS:
        features.add("conditional")

    first_word = _tokenize_text(text[:40])[:1]
    if first_word and first_word[0] in COMMAND_HINT_WORDS:
        features.add("command")

    return features


def _detect_sentence_type_hint(text: str) -> str:
    tokens = set(_tokenize_text(text))
    stripped = text.strip()

    if tokens & CONDITIONAL_WORDS:
        return "conditional"
    if tokens & NEGATION_WORDS:
        return "negation"
    if tokens & WH_WORDS:
        return "wh_question"
    if stripped.endswith("?"):
        return "yes_no_question"

    first_word = _tokenize_text(text[:40])[:1]
    if first_word and first_word[0] in COMMAND_HINT_WORDS:
        return "command"

    return "statement"


def _get_default_rules(grammar_rules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    defaults = []
    for rule in grammar_rules:
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id in {
            "compact-word-order",
            "preserve-x-pronouns",
            "preserve-desc-markers",
            "drop-articles",
        }:
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
        "question": {"question-marking", "yes-no-question", "wh-question"},
        "wh_question": {"wh-question", "question-marking"},
        "yes_no_question": {"yes-no-question", "question-marking", "non-manual-signals"},
        "negation": {"explicit-negation"},
        "conditional": {"conditional"},
        "command": {"compact-word-order"},
    }

    wanted_rule_ids = set()
    for feature in features:
        wanted_rule_ids |= feature_to_rule_ids.get(feature, set())

    # Priority pass: strongly relevant rules first
    for rule in grammar_rules:
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id in wanted_rule_ids:
            selected.append(rule)

    # Then add general defaults
    existing_ids = {str(r.get("rule_id", "")).lower() for r in selected}
    for rule in _get_default_rules(grammar_rules):
        rule_id = str(rule.get("rule_id", "")).lower()
        if rule_id not in existing_ids:
            selected.append(rule)
            existing_ids.add(rule_id)

    return selected[:max_rules]


def _score_examples(query: str, example_bank: list[dict[str, Any]], max_examples: int) -> list[dict[str, Any]]:
    if not example_bank:
        return []

    corpus = [str(row.get("english", "")).strip() for row in example_bank]
    if not any(corpus):
        return example_bank[:max_examples]

    vectorizer = TfidfVectorizer(lowercase=True, ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(corpus + [query.strip()])

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


def _filter_by_sentence_type(
    examples: list[dict[str, Any]],
    sentence_type_hint: str
) -> list[dict[str, Any]]:
    filtered = [ex for ex in examples if ex.get("sentence_type") == sentence_type_hint]
    return filtered if filtered else examples


def _filter_by_feature_bias(
    examples: list[dict[str, Any]],
    features: set[str]
) -> list[dict[str, Any]]:
    if not examples:
        return examples

    wanted_tags = set()
    if "time" in features:
        wanted_tags.add("time")
    if "negation" in features:
        wanted_tags.add("negation")
    if "conditional" in features:
        wanted_tags.add("conditional")
    if "wh_question" in features:
        wanted_tags.add("wh_question")
    if "yes_no_question" in features:
        wanted_tags.add("yes_no_question")
    if "command" in features:
        wanted_tags.add("command")

    if not wanted_tags:
        return examples

    tagged = []
    untagged = []
    for ex in examples:
        tags = set(ex.get("tags", []))
        if tags & wanted_tags:
            tagged.append(ex)
        else:
            untagged.append(ex)

    return tagged + untagged


def _select_similar_examples(
    text: str,
    curated_bank: list[dict[str, Any]],
    full_bank: list[dict[str, Any]],
    sentence_type_hint: str,
    features: set[str],
    max_examples: int = 5
) -> list[dict[str, Any]]:
    # 1) Prefer curated bank
    curated_candidates = _filter_by_sentence_type(curated_bank, sentence_type_hint)
    curated_candidates = _filter_by_feature_bias(curated_candidates, features)
    curated_results = _score_examples(text, curated_candidates, max_examples=max_examples)

    if len(curated_results) >= max_examples:
        return curated_results[:max_examples]

    # 2) Backfill from full bank only if needed
    remaining = max_examples - len(curated_results)
    full_candidates = _filter_by_sentence_type(full_bank, sentence_type_hint)
    full_results = _score_examples(text, full_candidates, max_examples=remaining * 3)

    # Avoid duplicates by English text
    seen_english = {ex.get("english") for ex in curated_results}
    backfill = []
    for ex in full_results:
        if ex.get("english") in seen_english:
            continue
        backfill.append(ex)
        if len(backfill) >= remaining:
            break

    return curated_results + backfill


def _build_allowed_token_policy(sign_inventory: dict[str, Any]) -> str:
    canonical_tokens = sign_inventory.get("canonical_tokens", [])
    token_count = len(canonical_tokens)

    return (
        f"Use only canonical gloss tokens from the allowed list "
        f"(current inventory size: {token_count}). "
        f"Preserve X-* and DESC-* token forms exactly when supported by the inventory "
        f"or retrieved examples. "
        f"Prefer compressed dataset-compatible gloss over English-like phrasing. "
        f"If a needed concept is unavailable, output FINGERSPELL(word)."
    )


def retrieve_context(text: str) -> dict[str, Any]:
    grammar_rules = _load_json(GRAMMAR_RULES_PATH)
    full_bank = _load_jsonl(EXAMPLE_BANK_PATH)
    curated_bank = _load_jsonl(CURATED_EXAMPLE_BANK_PATH)
    sign_inventory = _load_json(SIGN_INVENTORY_PATH)

    features = _detect_features(text)
    sentence_type_hint = _detect_sentence_type_hint(text)

    retrieved_rules = _select_relevant_rules(text, grammar_rules, max_rules=5)
    retrieved_examples = _select_similar_examples(
        text=text,
        curated_bank=curated_bank,
        full_bank=full_bank,
        sentence_type_hint=sentence_type_hint,
        features=features,
        max_examples=5,
    )
    allowed_token_policy = _build_allowed_token_policy(sign_inventory)

    return {
        "retrieved_rules": retrieved_rules,
        "retrieved_examples": retrieved_examples,
        "allowed_token_policy": allowed_token_policy,
        "detected_sentence_type_hint": sentence_type_hint,
        "detected_features": sorted(features),
    }


if __name__ == "__main__":
    sample_text = "Where are you going tomorrow?"
    result = retrieve_context(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))