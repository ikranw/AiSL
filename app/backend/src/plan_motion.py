from __future__ import annotations

from typing import Any


DEFAULT_RIG_PROFILE = "rocketbox_female_adult_11"
DEFAULT_DOMINANT_HAND = "right"

# Simple starter defaults.
# These are symbolic motion parameters, not raw bone transforms.
TOKEN_MOTION_RULES: dict[str, dict[str, Any]] = {
    "HELLO": {
        "dominant_hand": "right",
        "sign_type": "lexical",
        "handshape": {"dominant": "B", "non_dominant": "relaxed_open"},
        "location": {"anchor": "temple", "side": "dominant", "offset": [0.00, 0.00, 0.00]},
        "orientation": {"palm": "outward", "finger_direction": "up"},
        "path": {
            "type": "arc",
            "points": [
                [0.00, 0.00, 0.00],
                [0.03, 0.01, 0.04],
                [0.07, 0.00, 0.08],
            ],
        },
        "timing": {"prep": 0.12, "stroke": 0.30, "hold": 0.08, "release": 0.12},
        "contact": {"target": "temple", "contact_type": "touch", "duration": 0.04},
        "symmetry": "none",
        "facial": [],
        "notes": "Greeting sign near temple with outward movement.",
    },
    "I": {
        "dominant_hand": "right",
        "sign_type": "pointing",
        "handshape": {"dominant": "index", "non_dominant": "relaxed_open"},
        "location": {"anchor": "chest_center", "side": "center", "offset": [0.00, 0.00, 0.00]},
        "orientation": {"palm": "inward", "finger_direction": "self"},
        "path": {"type": "tap", "points": [[0.00, 0.00, 0.00], [0.00, -0.01, 0.00]]},
        "timing": {"prep": 0.08, "stroke": 0.16, "hold": 0.05, "release": 0.10},
        "contact": {"target": "chest_center", "contact_type": "touch", "duration": 0.03},
        "symmetry": "none",
        "facial": [],
        "notes": "Point to self.",
    },
    "ME": {
        "dominant_hand": "right",
        "sign_type": "pointing",
        "handshape": {"dominant": "index", "non_dominant": "relaxed_open"},
        "location": {"anchor": "chest_center", "side": "center", "offset": [0.00, 0.00, 0.00]},
        "orientation": {"palm": "inward", "finger_direction": "self"},
        "path": {"type": "tap", "points": [[0.00, 0.00, 0.00], [0.00, -0.01, 0.00]]},
        "timing": {"prep": 0.08, "stroke": 0.16, "hold": 0.05, "release": 0.10},
        "contact": {"target": "chest_center", "contact_type": "touch", "duration": 0.03},
        "symmetry": "none",
        "facial": [],
        "notes": "Point to self.",
    },
    "YOU": {
        "dominant_hand": "right",
        "sign_type": "pointing",
        "handshape": {"dominant": "index", "non_dominant": "relaxed_open"},
        "location": {"anchor": "neutral_front", "side": "center", "offset": [0.00, 0.00, 0.12]},
        "orientation": {"palm": "left", "finger_direction": "forward"},
        "path": {"type": "line", "points": [[0.00, 0.00, 0.02], [0.00, 0.00, 0.12]]},
        "timing": {"prep": 0.08, "stroke": 0.18, "hold": 0.05, "release": 0.10},
        "contact": None,
        "symmetry": "none",
        "facial": [],
        "notes": "Forward pointing sign.",
    },
    "TOMORROW": {
        "dominant_hand": "right",
        "sign_type": "lexical",
        "handshape": {"dominant": "A", "non_dominant": "relaxed_open"},
        "location": {"anchor": "cheek_dominant", "side": "dominant", "offset": [0.00, 0.00, 0.00]},
        "orientation": {"palm": "inward", "finger_direction": "up"},
        "path": {"type": "arc", "points": [[0.00, 0.00, 0.00], [0.02, 0.01, 0.05], [0.05, 0.00, 0.10]]},
        "timing": {"prep": 0.12, "stroke": 0.28, "hold": 0.06, "release": 0.10},
        "contact": {"target": "cheek_dominant", "contact_type": "near", "duration": 0.02},
        "symmetry": "none",
        "facial": [],
        "notes": "Temporal sign moving forward from cheek.",
    },
    "WANT": {
        "dominant_hand": "right",
        "sign_type": "lexical",
        "handshape": {"dominant": "5-claw", "non_dominant": "relaxed_open"},
        "location": {"anchor": "neutral_front", "side": "center", "offset": [0.00, 0.02, 0.14]},
        "orientation": {"palm": "up", "finger_direction": "forward"},
        "path": {"type": "line", "points": [[0.00, 0.02, 0.14], [0.00, -0.01, 0.10]]},
        "timing": {"prep": 0.10, "stroke": 0.22, "hold": 0.06, "release": 0.10},
        "contact": None,
        "symmetry": "none",
        "facial": [],
        "notes": "Pulling motion toward signer.",
    },
    "STAY": {
        "dominant_hand": "right",
        "sign_type": "lexical",
        "handshape": {"dominant": "flat_o", "non_dominant": "relaxed_open"},
        "location": {"anchor": "neutral_front", "side": "center", "offset": [0.00, 0.00, 0.12]},
        "orientation": {"palm": "down", "finger_direction": "forward"},
        "path": {"type": "hold", "points": [[0.00, 0.00, 0.12]]},
        "timing": {"prep": 0.10, "stroke": 0.18, "hold": 0.14, "release": 0.10},
        "contact": None,
        "symmetry": "none",
        "facial": [],
        "notes": "Static hold-oriented sign.",
    },
    "WITH-YOU": {
        "dominant_hand": "right",
        "sign_type": "lexical",
        "handshape": {"dominant": "index", "non_dominant": "relaxed_open"},
        "location": {"anchor": "neutral_front", "side": "center", "offset": [0.00, 0.00, 0.10]},
        "orientation": {"palm": "left", "finger_direction": "forward"},
        "path": {"type": "line", "points": [[-0.02, 0.00, 0.06], [0.05, 0.00, 0.12]]},
        "timing": {"prep": 0.10, "stroke": 0.24, "hold": 0.05, "release": 0.10},
        "contact": None,
        "symmetry": "none",
        "facial": [],
        "notes": "Simple forward-comitative motion placeholder.",
    },
}

# Sentence-level defaults by type.
SENTENCE_NON_MANUAL_DEFAULTS: dict[str, list[str]] = {
    "statement": [],
    "wh_question": ["furrowed_brows"],
    "yes_no_question": ["raised_brows"],
    "negation": [],
    "conditional": ["raised_brows"],
    "command": [],
}


def _copy_dict(value: dict[str, Any]) -> dict[str, Any]:
    """Shallow copy nested dict/list structure enough for this starter."""
    out: dict[str, Any] = {}
    for k, v in value.items():
        if isinstance(v, dict):
            out[k] = _copy_dict(v)
        elif isinstance(v, list):
            out[k] = list(v)
        else:
            out[k] = v
    return out


def _default_motion_rule(token: str) -> dict[str, Any]:
    """
    Fallback motion template for unknown lexical tokens.
    This keeps the pipeline running even when the sign is not fully modeled yet.
    """
    return {
        "dominant_hand": DEFAULT_DOMINANT_HAND,
        "sign_type": "lexical",
        "handshape": {"dominant": "relaxed_open", "non_dominant": "relaxed_open"},
        "location": {"anchor": "neutral_front", "side": "center", "offset": [0.00, 0.00, 0.14]},
        "orientation": {"palm": "forward", "finger_direction": "up"},
        "path": {"type": "hold", "points": [[0.00, 0.00, 0.14]]},
        "timing": {"prep": 0.10, "stroke": 0.20, "hold": 0.08, "release": 0.10},
        "contact": None,
        "symmetry": "none",
        "facial": [],
        "notes": f"Fallback motion rule for unmapped token: {token}",
    }


def _motion_rule_for_token(token: str) -> dict[str, Any]:
    rule = TOKEN_MOTION_RULES.get(token)
    if rule is None:
        return _default_motion_rule(token)
    return _copy_dict(rule)


def _build_motion_unit(
    token: str,
    index: int,
    current_start: float,
) -> tuple[dict[str, Any], float]:
    rule = _motion_rule_for_token(token)
    timing = rule["timing"]

    total_duration = (
        float(timing["prep"])
        + float(timing["stroke"])
        + float(timing["hold"])
        + float(timing["release"])
    )

    motion_unit = {
        "id": f"mu_{index:04d}",
        "token": token,
        "dominant_hand": rule["dominant_hand"],
        "sign_type": rule["sign_type"],
        "timing": {
            "start": round(current_start, 4),
            "prep": float(timing["prep"]),
            "stroke": float(timing["stroke"]),
            "hold": float(timing["hold"]),
            "release": float(timing["release"]),
        },
        "handshape": rule["handshape"],
        "location": rule["location"],
        "orientation": rule["orientation"],
        "path": rule["path"],
        "contact": rule["contact"],
        "symmetry": rule["symmetry"],
        "facial": rule["facial"],
        "notes": rule["notes"],
    }

    next_start = current_start + total_duration
    return motion_unit, next_start


def _build_asl_text(gloss_tokens: list[str]) -> str:
    return " ".join(gloss_tokens)


def plan_motion(data: dict[str, Any]) -> dict[str, Any]:
    """
    Convert normalized linguistic output into symbolic motion intent.

    Expected input shape:
    {
      "input_text": "...",
      "sentence_type": "...",
      "gloss_tokens": [...],
      "non_manual": [...],
      "confidence_note": "..."
    }
    """
    input_text = str(data.get("input_text", "")).strip()
    sentence_type = str(data.get("sentence_type", "statement")).strip()
    gloss_tokens = data.get("gloss_tokens", [])
    non_manual = data.get("non_manual", [])

    if not isinstance(gloss_tokens, list) or not all(isinstance(t, str) for t in gloss_tokens):
        raise ValueError("gloss_tokens must be a list of strings.")

    if not isinstance(non_manual, list):
        raise ValueError("non_manual must be a list.")

    sentence_non_manual = list(SENTENCE_NON_MANUAL_DEFAULTS.get(sentence_type, []))
    combined_non_manual = sentence_non_manual + [x for x in non_manual if x not in sentence_non_manual]

    motion_units: list[dict[str, Any]] = []
    current_start = 0.0

    for idx, token in enumerate(gloss_tokens, start=1):
        motion_unit, current_start = _build_motion_unit(
            token=token,
            index=idx,
            current_start=current_start,
        )
        motion_units.append(motion_unit)

    planned = {
        "version": "1.0",
        "rig_profile": DEFAULT_RIG_PROFILE,
        "input_text": input_text,
        "asl_text": _build_asl_text(gloss_tokens),
        "sentence_type": sentence_type,
        "gloss_tokens": gloss_tokens,
        "non_manual": combined_non_manual,
        "motion_units": motion_units,
    }

    return planned


if __name__ == "__main__":
    sample = {
        "input_text": "I would like to stay with you tomorrow.",
        "sentence_type": "statement",
        "gloss_tokens": ["TOMORROW", "I", "STAY", "WITH-YOU", "WANT"],
        "non_manual": [],
        "confidence_note": "Temporal fronting applied."
    }

    import json
    print(json.dumps(plan_motion(sample), indent=2, ensure_ascii=False))