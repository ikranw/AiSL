#!/usr/bin/env python3
"""
Headless Blender converter for StudioGalt ASL Mixamo FBX files.

For each selected source FBX:
- imports the file
- deletes mesh objects only
- keeps armature, bones, empties, and animation
- exports a Unity-friendly FBX named "... No Mesh Mixamo.fbx"

Run with Blender:
    blender --background --factory-startup --python app/unity/convert_no_mesh_mixamo.py -- \
      --source-root "/path/to/Sign-Language-Mocap-Archive" \
      --word "SG ASL Dabble 2025-12-22" \
      --word "SG ASL Dad 2025-12-25" \
      --word "SG ASL Daily 2025-12-25"

Or with individually downloaded FBX files:
    blender --background --factory-startup --python app/unity/convert_no_mesh_mixamo.py -- \
      --input-file "/path/to/SG ASL Dad 2025-12-25 Mixamo.fbx"
"""

from __future__ import annotations

import argparse
import sys
import traceback
from pathlib import Path

import bpy


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "Assets" / "Signs"
DEFAULT_RELATIVE_INPUT_DIR = Path("FBX Files") / "Mixamo"
DEFAULT_UNITY_SIGNS_INPUT_DIR = SCRIPT_DIR / "Assets" / "Signs"
OUTPUT_SUFFIX = " No Mesh Mixamo.fbx"
SUPPORTED_INPUT_SUFFIXES = (
    " Mixamo.fbx",
    " Mesh.fbx",
)


def blender_argv() -> list[str]:
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1 :]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert StudioGalt Mixamo FBXs into mesh-free animation FBXs for Unity."
    )
    parser.add_argument(
        "--source-root",
        default=None,
        help="Path to the Sign-Language-Mocap-Archive checkout.",
    )
    parser.add_argument(
        "--input-dir",
        default=None,
        help=(
            'Optional explicit input folder. Defaults to "<source-root>/FBX Files/Mixamo" '
            f'or "{DEFAULT_UNITY_SIGNS_INPUT_DIR}" when --source-root is not provided.'
        ),
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Destination folder for converted FBXs. Defaults to {DEFAULT_OUTPUT_DIR}.",
    )
    parser.add_argument(
        "--word",
        dest="words",
        action="append",
        default=[],
        help='Selected sign base name without ".fbx", for example "SG ASL Dad 2025-12-25". Repeat per sign.',
    )
    parser.add_argument(
        "--input-file",
        dest="input_files",
        action="append",
        default=[],
        help='Direct path to a downloaded source FBX such as ".../SG ASL Dad 2025-12-25 Mixamo.fbx". Repeat per file.',
    )
    parser.add_argument(
        "--delete-source-on-success",
        action="store_true",
        help="Delete each source FBX after its export succeeds.",
    )
    args = parser.parse_args(blender_argv())
    if not args.words and not args.input_files:
        parser.error("Provide at least one --word or --input-file.")
    return args


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_fbx(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Source FBX does not exist: {path}")
    if not path.is_file():
        raise FileNotFoundError(f"Source FBX is not a file: {path}")
    bpy.ops.import_scene.fbx(
        filepath=str(path),
        automatic_bone_orientation=False,
        use_anim=True,
    )


def delete_mesh_objects() -> None:
    mesh_objects = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not mesh_objects:
        return

    bpy.ops.object.select_all(action="DESELECT")
    for obj in mesh_objects:
        obj.select_set(True)
    bpy.ops.object.delete()


def purge_orphans() -> None:
    for _ in range(3):
        result = bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
        if result != {"FINISHED"}:
            break


def has_animation_data() -> bool:
    if bpy.data.actions:
        return True

    for obj in bpy.data.objects:
        anim = obj.animation_data
        if anim is None:
            continue
        if anim.action is not None:
            return True
        if anim.nla_tracks:
            return True

    return bpy.context.scene.frame_end > bpy.context.scene.frame_start


def validate_scene(source_path: Path) -> None:
    armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if not armatures:
        raise RuntimeError(f"No armature found after importing {source_path.name}")

    if not has_animation_data():
        raise RuntimeError(f"No animation actions found after importing {source_path.name}")


def export_fbx(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=str(path),
        use_selection=False,
        object_types={"ARMATURE", "EMPTY"},
        use_active_collection=False,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_UNITS",
        use_space_transform=True,
        bake_space_transform=False,
        axis_forward="-Z",
        axis_up="Y",
        add_leaf_bones=False,
        primary_bone_axis="Y",
        secondary_bone_axis="X",
        bake_anim=True,
        bake_anim_use_all_bones=True,
        bake_anim_use_nla_strips=False,
        bake_anim_use_all_actions=False,
        bake_anim_force_startend_keying=True,
        bake_anim_step=1.0,
        bake_anim_simplify_factor=0.0,
        path_mode="AUTO",
        embed_textures=False,
    )


def normalize_output_name(input_name: str) -> str:
    for suffix in SUPPORTED_INPUT_SUFFIXES:
        if input_name.endswith(suffix):
            return input_name[: -len(suffix)] + OUTPUT_SUFFIX
    raise ValueError(
        "Input filename must end with one of "
        f"{SUPPORTED_INPUT_SUFFIXES}: {input_name}"
    )


def find_source_file(input_dir: Path, word: str) -> Path:
    target_names = [f"{word}{suffix}" for suffix in SUPPORTED_INPUT_SUFFIXES]
    matches: list[Path] = []
    for target_name in target_names:
        matches.extend(input_dir.rglob(target_name))
    matches = sorted(set(matches))
    if not matches:
        expected = " or ".join(target_names)
        raise FileNotFoundError(f"Could not find {expected} under {input_dir}")
    if len(matches) > 1:
        raise RuntimeError("Found multiple matching source FBXs: " + ", ".join(str(match) for match in matches))
    return matches[0]


def convert_one(
    source_path: Path,
    output_dir: Path,
    delete_source_on_success: bool = False,
) -> tuple[str, str]:
    output_name = normalize_output_name(source_path.name)
    output_path = output_dir / output_name

    if output_path.exists():
        return "SKIPPED", f"{output_name} already exists"

    reset_scene()
    import_fbx(source_path)
    delete_mesh_objects()
    purge_orphans()
    validate_scene(source_path)
    export_fbx(output_path)
    if delete_source_on_success:
        source_path.unlink()
    return "ADDED", str(output_path)


def iter_sources(args: argparse.Namespace, input_dir: Path | None) -> list[tuple[str, Path]]:
    sources: list[tuple[str, Path]] = []

    for input_file in args.input_files:
        expanded_path = Path(input_file).expanduser()
        if not expanded_path.exists():
            raise FileNotFoundError(
                f"--input-file path does not exist: {expanded_path}"
            )
        source_path = expanded_path.resolve()
        sources.append((source_path.stem, source_path))

    if input_dir is not None:
        for word in args.words:
            sources.append((word, find_source_file(input_dir, word)))

    return sources


def main() -> int:
    args = parse_args()
    source_root = Path(args.source_root).expanduser().resolve() if args.source_root else None
    input_dir = None
    if args.input_dir:
        input_dir = Path(args.input_dir).expanduser().resolve()
    elif source_root is not None:
        input_dir = (source_root / DEFAULT_RELATIVE_INPUT_DIR).resolve()
    elif args.words:
        input_dir = DEFAULT_UNITY_SIGNS_INPUT_DIR.resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    if source_root is not None and not source_root.exists():
        print(f"FAILED | setup | source root does not exist: {source_root}")
        return 2
    if input_dir is not None and not input_dir.exists():
        print(f"FAILED | setup | input dir does not exist: {input_dir}")
        return 2

    exit_code = 0
    try:
        sources = iter_sources(args, input_dir)
    except Exception as exc:  # noqa: BLE001
        print(f"FAILED | setup | {exc}")
        return 2

    for label, source_path in sources:
        try:
            status, detail = convert_one(
                source_path,
                output_dir,
                delete_source_on_success=args.delete_source_on_success,
            )
            print(f"{status} | {label} | {detail}")
        except Exception as exc:  # noqa: BLE001
            exit_code = 1
            print(f"FAILED | {label} | {exc}")
            traceback.print_exc()

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
