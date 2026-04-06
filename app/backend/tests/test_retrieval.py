import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from retrieval import retrieve_context


def test_drop_prepositions_rule_is_retrieved():
    result = retrieve_context("Go to school with me at noon.")
    rule_ids = {rule["rule_id"] for rule in result["retrieved_rules"]}

    assert "drop-prepositions" in rule_ids
    assert "compact-word-order" in rule_ids


if __name__ == "__main__":
    test_drop_prepositions_rule_is_retrieved()
    print("PASS retrieval test")
