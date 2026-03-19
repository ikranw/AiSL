from __future__ import annotations

from typing import Iterable


# Coordinates are avatar-local target positions for the signing hand.
# Convention:
# - [x, y, z]
# - x: left/right
# - y: height
# - z: forward/back from torso
#
# These are not bone transforms.
# They are spatial anchors used by the motion solver to determine
# where the wrist/hand should travel in signing space.

SIGN_SPACE_ANCHORS: dict[str, list[float]] = {
    "neutral_front": [0.00, 1.15, 0.35],
    "chest_center": [0.00, 1.10, 0.20],
    "sternum": [0.00, 1.08, 0.18],
    "upper_chest": [0.00, 1.18, 0.20],
    "chin": [0.00, 1.34, 0.16],
    "mouth": [0.00, 1.36, 0.17],
    "nose": [0.00, 1.43, 0.17],
    "forehead": [0.00, 1.48, 0.18],
    "temple": [0.12, 1.45, 0.18],
    "cheek_dominant": [0.10, 1.35, 0.16],
    "cheek_non_dominant": [-0.10, 1.35, 0.16],
    "shoulder_dominant": [0.16, 1.28, 0.15],
    "shoulder_non_dominant": [-0.16, 1.28, 0.15],
    "waist_center": [0.00, 0.95, 0.16],
}


SIDE_MULTIPLIERS: dict[str, float] = {
    "center": 0.0,
    "dominant": 1.0,
    "non_dominant": -1.0,
}


def get_anchor(name: str) -> list[float]:
    """
    Return a copy of the named anchor position.
    """
    if name not in SIGN_SPACE_ANCHORS:
        raise KeyError(f"Unknown sign-space anchor: {name}")
    return list(SIGN_SPACE_ANCHORS[name])


def has_anchor(name: str) -> bool:
    return name in SIGN_SPACE_ANCHORS


def list_anchors() -> list[str]:
    return sorted(SIGN_SPACE_ANCHORS.keys())


def apply_offset(anchor: Iterable[float], offset: Iterable[float]) -> list[float]:
    """
    Add a local xyz offset to an anchor.
    """
    a = list(anchor)
    o = list(offset)

    if len(a) != 3 or len(o) != 3:
        raise ValueError("anchor and offset must both have 3 values")

    return [
        float(a[0]) + float(o[0]),
        float(a[1]) + float(o[1]),
        float(a[2]) + float(o[2]),
    ]


def mirror_x(point: Iterable[float]) -> list[float]:
    """
    Mirror a point across the body centerline.
    """
    p = list(point)
    if len(p) != 3:
        raise ValueError("point must have 3 values")
    return [-float(p[0]), float(p[1]), float(p[2])]


def resolve_anchor(
    anchor_name: str,
    side: str = "center",
    offset: Iterable[float] | None = None,
) -> list[float]:
    """
    Resolve a named anchor plus side and offset to a concrete avatar-local point.

    Rules:
    - If anchor is explicitly side-specific (e.g. cheek_dominant), use it as-is.
    - If side is 'dominant' or 'non_dominant' and anchor is symmetric/centered,
      shift the x-axis slightly toward that side.
    - Then apply the provided offset.
    """
    point = get_anchor(anchor_name)

    if anchor_name.endswith("_dominant") or anchor_name.endswith("_non_dominant"):
        resolved = point
    else:
        multiplier = SIDE_MULTIPLIERS.get(side)
        if multiplier is None:
            raise ValueError(f"Unknown side value: {side}")

        resolved = [
            float(point[0]) + (0.08 * multiplier),
            float(point[1]),
            float(point[2]),
        ]

    if offset is not None:
        resolved = apply_offset(resolved, offset)

    return resolved


def validate_all_anchors() -> None:
    for name, point in SIGN_SPACE_ANCHORS.items():
        if not isinstance(point, list) or len(point) != 3:
            raise ValueError(f"Anchor '{name}' must be a 3-value list.")
        if not all(isinstance(v, (int, float)) for v in point):
            raise ValueError(f"Anchor '{name}' must contain numeric values.")


if __name__ == "__main__":
    validate_all_anchors()
    import json
    print(json.dumps(SIGN_SPACE_ANCHORS, indent=2))