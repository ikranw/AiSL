from __future__ import annotations

from typing import Any


# Each handshape maps to symbolic per-finger bend targets.
# Convention:
# - Values are degrees for [proximal, intermediate, distal]
# - These are target curl values, not final rig quaternions
# - The solver will later convert these into actual bone rotations
#
# Finger keys:
# - thumb
# - index
# - middle
# - ring
# - pinky
#
# Optional metadata:
# - spread: separation across fingers
# - thumb_opposition: symbolic thumb placement hint
# - notes: debug description

HANDSHAPES: dict[str, dict[str, Any]] = {
    "relaxed_open": {
        "thumb": [10.0, 5.0, 0.0],
        "index": [5.0, 5.0, 5.0],
        "middle": [5.0, 5.0, 5.0],
        "ring": [5.0, 5.0, 5.0],
        "pinky": [5.0, 5.0, 5.0],
        "spread": 10.0,
        "thumb_opposition": 0.2,
        "notes": "Neutral open resting handshape.",
    },
    "open_5": {
        "thumb": [5.0, 0.0, 0.0],
        "index": [0.0, 0.0, 0.0],
        "middle": [0.0, 0.0, 0.0],
        "ring": [0.0, 0.0, 0.0],
        "pinky": [0.0, 0.0, 0.0],
        "spread": 18.0,
        "thumb_opposition": 0.1,
        "notes": "Fully open five hand.",
    },
    "A": {
        "thumb": [18.0, 10.0, 5.0],
        "index": [80.0, 90.0, 80.0],
        "middle": [80.0, 90.0, 80.0],
        "ring": [80.0, 90.0, 80.0],
        "pinky": [80.0, 90.0, 80.0],
        "spread": 4.0,
        "thumb_opposition": 0.65,
        "notes": "Closed fist-like A handshape.",
    },
    "B": {
        "thumb": [20.0, 10.0, 0.0],
        "index": [0.0, 5.0, 5.0],
        "middle": [0.0, 5.0, 5.0],
        "ring": [0.0, 5.0, 5.0],
        "pinky": [0.0, 5.0, 5.0],
        "spread": 6.0,
        "thumb_opposition": 0.35,
        "notes": "Flat B handshape with mostly extended fingers.",
    },
    "C": {
        "thumb": [25.0, 20.0, 5.0],
        "index": [35.0, 20.0, 10.0],
        "middle": [40.0, 22.0, 10.0],
        "ring": [38.0, 22.0, 10.0],
        "pinky": [34.0, 18.0, 8.0],
        "spread": 8.0,
        "thumb_opposition": 0.75,
        "notes": "Rounded C handshape.",
    },
    "index": {
        "thumb": [15.0, 10.0, 5.0],
        "index": [0.0, 0.0, 0.0],
        "middle": [80.0, 90.0, 80.0],
        "ring": [80.0, 90.0, 80.0],
        "pinky": [80.0, 90.0, 80.0],
        "spread": 3.0,
        "thumb_opposition": 0.45,
        "notes": "Index finger extended, other fingers closed.",
    },
    "flat_o": {
        "thumb": [30.0, 18.0, 5.0],
        "index": [30.0, 18.0, 8.0],
        "middle": [30.0, 18.0, 8.0],
        "ring": [30.0, 18.0, 8.0],
        "pinky": [28.0, 15.0, 6.0],
        "spread": 2.0,
        "thumb_opposition": 0.85,
        "notes": "Flattened O-like closed rounded hand.",
    },
    "5-claw": {
        "thumb": [35.0, 18.0, 8.0],
        "index": [45.0, 30.0, 18.0],
        "middle": [48.0, 32.0, 18.0],
        "ring": [45.0, 30.0, 18.0],
        "pinky": [42.0, 28.0, 15.0],
        "spread": 10.0,
        "thumb_opposition": 0.5,
        "notes": "Curved claw-like 5 handshape.",
    },
    "closed_fist": {
        "thumb": [25.0, 12.0, 6.0],
        "index": [90.0, 95.0, 85.0],
        "middle": [90.0, 95.0, 85.0],
        "ring": [90.0, 95.0, 85.0],
        "pinky": [88.0, 90.0, 82.0],
        "spread": 0.0,
        "thumb_opposition": 0.55,
        "notes": "Tight fist.",
    },
}


FINGER_KEYS = ("thumb", "index", "middle", "ring", "pinky")


def get_handshape(name: str) -> dict[str, Any]:
    """
    Return a handshape definition by name.

    Raises:
        KeyError: if the handshape is unknown.
    """
    if name not in HANDSHAPES:
        raise KeyError(f"Unknown handshape: {name}")
    return HANDSHAPES[name]


def has_handshape(name: str) -> bool:
    return name in HANDSHAPES


def list_handshapes() -> list[str]:
    return sorted(HANDSHAPES.keys())


def validate_handshape_definition(defn: dict[str, Any]) -> None:
    """
    Validates one handshape definition.
    """
    for finger in FINGER_KEYS:
        if finger not in defn:
            raise ValueError(f"Missing finger definition: {finger}")

        values = defn[finger]
        if not isinstance(values, list) or len(values) != 3:
            raise ValueError(f"{finger} must be a 3-value list.")

        if not all(isinstance(v, (int, float)) for v in values):
            raise ValueError(f"{finger} values must be numeric.")

    if "spread" in defn and not isinstance(defn["spread"], (int, float)):
        raise ValueError("spread must be numeric.")

    if "thumb_opposition" in defn and not isinstance(defn["thumb_opposition"], (int, float)):
        raise ValueError("thumb_opposition must be numeric.")


def validate_all_handshapes() -> None:
    for name, defn in HANDSHAPES.items():
        try:
            validate_handshape_definition(defn)
        except Exception as exc:
            raise ValueError(f"Invalid handshape '{name}': {exc}") from exc


if __name__ == "__main__":
    validate_all_handshapes()
    import json
    print(json.dumps(HANDSHAPES, indent=2))