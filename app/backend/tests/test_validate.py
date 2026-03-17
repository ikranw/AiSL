import sys
import os

# Ensure src is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from validate import validate_output


def test_valid_output():
    sample = {
        "input_text": "Where are you going tomorrow?",
        "sentence_type": "wh_question",
        "gloss_tokens": ["WHERE", "X-YOU", "GO", "TOMORROW"],
        "non_manual": [],
        "confidence_note": "valid example"
    }

    result = validate_output(sample)
    print("PASS valid test:", result)


def test_invalid_sentence_type():
    sample = {
        "input_text": "Where are you going tomorrow?",
        "sentence_type": "question",  # invalid
        "gloss_tokens": ["WHERE", "X-YOU"],
        "non_manual": [],
        "confidence_note": "invalid"
    }

    try:
        validate_output(sample)
    except Exception as e:
        print("PASS invalid sentence_type:", e)


def test_invalid_gloss_tokens():
    sample = {
        "input_text": "Test",
        "sentence_type": "statement",
        "gloss_tokens": "NOT_A_LIST",  # invalid
        "non_manual": [],
        "confidence_note": "invalid"
    }

    try:
        validate_output(sample)
    except Exception as e:
        print("PASS invalid gloss_tokens:", e)


if __name__ == "__main__":
    test_valid_output()
    test_invalid_sentence_type()
    test_invalid_gloss_tokens()