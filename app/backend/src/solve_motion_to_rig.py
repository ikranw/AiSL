from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from handshape_library import get_handshape
from sign_space import resolve_anchor


CONFIG_PATH = Path(__file__).resolve().parent.parent / "configs" / "rig_config_rocketbox.json"


def _load_rig_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Rig config not found: {CONFIG_PATH}")
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def _deg_to_quat_xyz(x_deg: float, y_deg: float, z_deg: float) -> list[float]:
    """
    Very simple Euler XYZ degrees -> quaternion [x, y, z, w].
    This avoids external dependencies.

    The math is standard intrinsic XYZ composition.
    """
    import math

    x = math.radians(x_deg) * 0.5
    y = math.radians(y_deg) * 0.5
    z = math.radians(z_deg) * 0.5

    cx, sx = math.cos(x), math.sin(x)
    cy, sy = math.cos(y), math.sin(y)
    cz, sz = math.cos(z), math.sin(z)

    qw = cx * cy * cz + sx * sy * sz
    qx = sx * cy * cz - cx * sy * sz
    qy = cx * sy * cz + sx * cy * sz
    qz = cx * cy * sz - sx * sy * cz

    return [round(qx, 6), round(qy, 6), round(qz, 6), round(qw, 6)]


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _lerp_vec3(a: list[float], b: list[float], t: float) -> list[float]:
    return [
        _lerp(float(a[0]), float(b[0]), t),
        _lerp(float(a[1]), float(b[1]), t),
        _lerp(float(a[2]), float(b[2]), t),
    ]


def _ease_in_out(t: float) -> float:
    return t * t * (3.0 - 2.0 * t)


def _sample_path_points(points: list[list[float]], t: float) -> list[float]:
    """
    Piecewise linear path sampling over 1..N points.
    """
    if not points:
        return [0.0, 0.0, 0.0]
    if len(points) == 1:
        return list(points[0])

    t = _clamp(t, 0.0, 1.0)
    segment_count = len(points) - 1
    scaled = t * segment_count
    idx = min(int(scaled), segment_count - 1)
    local_t = scaled - idx

    return _lerp_vec3(points[idx], points[idx + 1], local_t)


def _phase_progress(unit_elapsed: float, timing: dict[str, float]) -> tuple[str, float]:
    prep = float(timing["prep"])
    stroke = float(timing["stroke"])
    hold = float(timing["hold"])
    release = float(timing["release"])

    if unit_elapsed <= prep:
        t = 0.0 if prep <= 0 else unit_elapsed / prep
        return "prep", _ease_in_out(_clamp(t, 0.0, 1.0))

    unit_elapsed -= prep
    if unit_elapsed <= stroke:
        t = 1.0 if stroke <= 0 else unit_elapsed / stroke
        return "stroke", _ease_in_out(_clamp(t, 0.0, 1.0))

    unit_elapsed -= stroke
    if unit_elapsed <= hold:
        return "hold", 1.0

    unit_elapsed -= hold
    if release <= 0:
        return "release", 1.0

    t = unit_elapsed / release
    return "release", _ease_in_out(_clamp(t, 0.0, 1.0))


def _build_absolute_path(location: dict[str, Any], path: dict[str, Any]) -> list[list[float]]:
    anchor_name = location["anchor"]
    side = location.get("side", "center")
    offset = location.get("offset", [0.0, 0.0, 0.0])

    base = resolve_anchor(anchor_name, side=side, offset=offset)

    rel_points = path.get("points", [[0.0, 0.0, 0.0]])
    abs_points: list[list[float]] = []

    for rel in rel_points:
        abs_points.append([
            float(base[0]) + float(rel[0]),
            float(base[1]) + float(rel[1]),
            float(base[2]) + float(rel[2]),
        ])

    return abs_points


def _orientation_to_euler(orientation: dict[str, str]) -> list[float]:
    """
    Symbolic orientation -> rough wrist Euler target in degrees.
    These are placeholders and should be tuned visually.
    """
    palm = orientation.get("palm", "forward")
    finger_direction = orientation.get("finger_direction", "up")

    x = 0.0
    y = 0.0
    z = 0.0

    palm_map = {
        "forward": (0.0, 0.0, 0.0),
        "backward": (0.0, 180.0, 0.0),
        "inward": (0.0, -60.0, 0.0),
        "outward": (0.0, 60.0, 0.0),
        "left": (0.0, -90.0, 0.0),
        "right": (0.0, 90.0, 0.0),
        "up": (-90.0, 0.0, 0.0),
        "down": (90.0, 0.0, 0.0),
    }

    finger_map = {
        "up": (-10.0, 0.0, 0.0),
        "down": (25.0, 0.0, 0.0),
        "forward": (0.0, 0.0, 0.0),
        "self": (0.0, -25.0, 0.0),
    }

    px, py, pz = palm_map.get(palm, (0.0, 0.0, 0.0))
    fx, fy, fz = finger_map.get(finger_direction, (0.0, 0.0, 0.0))

    x += px + fx
    y += py + fy
    z += pz + fz

    return [x, y, z]


def _point_to_arm_euler(point: list[float], handedness: str) -> dict[str, list[float]]:
    """
    Approximate spatial target -> clavicle/upper arm/forearm Euler angles.
    This is not IK. It is a rough procedural mapping meant to get a first
    working live motion pipeline.
    """
    x, y, z = float(point[0]), float(point[1]), float(point[2])

    # Normalize around rough torso reference.
    torso_y = 1.15
    dy = y - torso_y
    dx = x
    dz = z - 0.22

    side_sign = 1.0 if handedness == "right" else -1.0

    clavicle = [
        _clamp(-dy * 20.0, -20.0, 25.0),
        _clamp(dx * 120.0, -25.0, 25.0),
        _clamp(side_sign * dx * 60.0, -20.0, 20.0),
    ]

    upper_arm = [
        _clamp(-dy * 85.0 - dz * 35.0, -85.0, 110.0),
        _clamp(dx * 220.0, -90.0, 90.0),
        _clamp(side_sign * dx * 70.0, -80.0, 80.0),
    ]

    forearm = [
        _clamp(30.0 + dz * 140.0 + abs(dx) * 40.0, -10.0, 135.0),
        _clamp(dx * 70.0, -60.0, 60.0),
        _clamp(side_sign * dx * 45.0, -55.0, 55.0),
    ]

    return {
        "clavicle": clavicle,
        "upper_arm": upper_arm,
        "forearm": forearm,
    }


def _get_joint_limits(rig_config: dict[str, Any], semantic_bone_name: str) -> dict[str, list[float]] | None:
    return rig_config.get("joint_limits_deg", {}).get(semantic_bone_name)


def _clamp_euler_by_limits(euler_xyz: list[float], limits: dict[str, list[float]] | None) -> list[float]:
    if not limits:
        return euler_xyz

    x = _clamp(float(euler_xyz[0]), float(limits["x"][0]), float(limits["x"][1]))
    y = _clamp(float(euler_xyz[1]), float(limits["y"][0]), float(limits["y"][1]))
    z = _clamp(float(euler_xyz[2]), float(limits["z"][0]), float(limits["z"][1]))
    return [x, y, z]


def _handshape_to_finger_eulers(handshape_name: str) -> dict[str, list[float]]:
    """
    Converts symbolic handshape target bends into per-joint local Euler rotations.
    We use simple x-axis curl rotations only for MVP.
    """
    handshape = get_handshape(handshape_name)

    result: dict[str, list[float]] = {}
    for finger_name in ("thumb", "index", "middle", "ring", "pinky"):
        bends = handshape[finger_name]
        result[finger_name] = [float(bends[0]), float(bends[1]), float(bends[2])]
    return result


def _blend_finger_pose(
    relaxed: dict[str, list[float]],
    target: dict[str, list[float]],
    t: float,
) -> dict[str, list[float]]:
    out: dict[str, list[float]] = {}
    for finger_name in target.keys():
        out[finger_name] = [
            _lerp(relaxed[finger_name][0], target[finger_name][0], t),
            _lerp(relaxed[finger_name][1], target[finger_name][1], t),
            _lerp(relaxed[finger_name][2], target[finger_name][2], t),
        ]
    return out


def _build_bone_pose(bone_name: str, euler_xyz: list[float], position: list[float] | None = None) -> dict[str, Any]:
    pose = {
        "boneName": bone_name,
        "rotation": _deg_to_quat_xyz(euler_xyz[0], euler_xyz[1], euler_xyz[2]),
    }
    if position is not None:
        pose["position"] = [round(float(v), 6) for v in position]
    return pose


def _semantic_side_prefix(handedness: str) -> str:
    return "right" if handedness == "right" else "left"


def _unit_total_duration(unit: dict[str, Any]) -> float:
    timing = unit["timing"]
    return float(timing["prep"]) + float(timing["stroke"]) + float(timing["hold"]) + float(timing["release"])


def _frame_times(duration: float, fps: int) -> list[float]:
    if duration <= 0:
        return [0.0]
    dt = 1.0 / fps
    times: list[float] = []
    t = 0.0
    while t < duration:
        times.append(round(t, 4))
        t += dt
    if not times or times[-1] < duration:
        times.append(round(duration, 4))
    return times


def solve_motion_to_rig(motion_plan: dict[str, Any], fps: int = 30) -> dict[str, Any]:
    rig_config = _load_rig_config()

    if motion_plan.get("rig_profile") != rig_config.get("rig_name"):
        # Allow mismatch for now, but surface it clearly.
        pass

    motion_units = motion_plan.get("motion_units", [])
    if not isinstance(motion_units, list):
        raise ValueError("motion_plan.motion_units must be a list")

    relaxed_pose = _handshape_to_finger_eulers("relaxed_open")
    all_frames: list[dict[str, Any]] = []

    total_duration = 0.0
    for unit in motion_units:
        total_duration = max(total_duration, float(unit["timing"]["start"]) + _unit_total_duration(unit))

    frame_times = _frame_times(total_duration, fps)

    for global_time in frame_times:
        frame_bones: list[dict[str, Any]] = []

        for unit in motion_units:
            timing = unit["timing"]
            unit_start = float(timing["start"])
            unit_duration = _unit_total_duration(unit)
            unit_end = unit_start + unit_duration

            if not (unit_start <= global_time <= unit_end):
                continue

            unit_elapsed = global_time - unit_start
            phase, phase_t = _phase_progress(unit_elapsed, timing)

            handedness = unit.get("dominant_hand", "right")
            side_prefix = _semantic_side_prefix(handedness)

            abs_path = _build_absolute_path(unit["location"], unit["path"])

            if phase == "prep":
                path_t = 0.0
                handshape_t = phase_t
            elif phase == "stroke":
                path_t = phase_t
                handshape_t = 1.0
            elif phase == "hold":
                path_t = 1.0
                handshape_t = 1.0
            else:  # release
                path_t = 1.0 - phase_t
                handshape_t = 1.0 - phase_t

            target_point = _sample_path_points(abs_path, path_t)
            arm_eulers = _point_to_arm_euler(target_point, handedness=handedness)

            wrist_target = _orientation_to_euler(unit["orientation"])
            wrist_relaxed = [0.0, 0.0, 0.0]
            wrist_euler = [
                _lerp(wrist_relaxed[0], wrist_target[0], handshape_t),
                _lerp(wrist_relaxed[1], wrist_target[1], handshape_t),
                _lerp(wrist_relaxed[2], wrist_target[2], handshape_t),
            ]

            target_handshape_name = unit["handshape"]["dominant"]
            target_fingers = _handshape_to_finger_eulers(target_handshape_name)
            blended_fingers = _blend_finger_pose(relaxed_pose, target_fingers, handshape_t)

            clavicle_sem = f"{side_prefix}_clavicle"
            upper_arm_sem = f"{side_prefix}_upper_arm"
            forearm_sem = f"{side_prefix}_forearm"
            hand_sem = f"{side_prefix}_hand"

            frame_bones.append(
                _build_bone_pose(
                    rig_config["bones"][clavicle_sem],
                    _clamp_euler_by_limits(arm_eulers["clavicle"], _get_joint_limits(rig_config, clavicle_sem)),
                )
            )
            frame_bones.append(
                _build_bone_pose(
                    rig_config["bones"][upper_arm_sem],
                    _clamp_euler_by_limits(arm_eulers["upper_arm"], _get_joint_limits(rig_config, upper_arm_sem)),
                )
            )
            frame_bones.append(
                _build_bone_pose(
                    rig_config["bones"][forearm_sem],
                    _clamp_euler_by_limits(arm_eulers["forearm"], _get_joint_limits(rig_config, forearm_sem)),
                )
            )
            frame_bones.append(
                _build_bone_pose(
                    rig_config["bones"][hand_sem],
                    _clamp_euler_by_limits(wrist_euler, _get_joint_limits(rig_config, hand_sem)),
                )
            )

            finger_map = rig_config["fingers"]
            for finger_name in ("thumb", "index", "middle", "ring", "pinky"):
                semantic_finger = f"{side_prefix}_{finger_name}"
                finger_bones = finger_map[semantic_finger]
                joint_eulers = blended_fingers[finger_name]

                for bone_name, curl_deg in zip(finger_bones, joint_eulers):
                    frame_bones.append(_build_bone_pose(bone_name, [curl_deg, 0.0, 0.0]))

        # Deduplicate by boneName, later unit wins if overlapping
        deduped: dict[str, dict[str, Any]] = {}
        for pose in frame_bones:
            deduped[pose["boneName"]] = pose

        all_frames.append({
            "time": round(global_time, 4),
            "bones": list(deduped.values()),
        })

    animation = {
        "version": "1.0",
        "rig": rig_config["rig_name"],
        "fps": fps,
        "duration": round(total_duration, 4),
        "translation": {
            "input_text": motion_plan.get("input_text", ""),
            "asl_text": motion_plan.get("asl_text", ""),
            "gloss_tokens": motion_plan.get("gloss_tokens", []),
        },
        "frames": all_frames,
    }

    return animation


if __name__ == "__main__":
    from plan_motion import plan_motion

    sample_translation = {
        "input_text": "Hello",
        "sentence_type": "statement",
        "gloss_tokens": ["HELLO"],
        "non_manual": [],
        "confidence_note": "Direct mapping."
    }

    planned = plan_motion(sample_translation)
    solved = solve_motion_to_rig(planned)

    print(json.dumps(solved, indent=2, ensure_ascii=False))