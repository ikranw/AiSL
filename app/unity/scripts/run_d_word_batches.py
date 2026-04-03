#!/usr/bin/env python3
"""
Batch runner for converting unresolved D-word FBX files in Assets/Signs.

Example:
    python3 app/unity/scripts/run_d_word_batches.py --batch-size 5 --dry-run
    python3 app/unity/scripts/run_d_word_batches.py --batch-size 5 --delete-source-on-success
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
UNITY_DIR = SCRIPT_DIR.parent
SIGNS_DIR = UNITY_DIR / "Assets" / "Signs"
CONVERTER = UNITY_DIR / "convert_no_mesh_mixamo.py"
BLENDER = Path("/Applications/Blender.app/Contents/MacOS/Blender")
MESH_SUFFIX = " Mesh.fbx"
OUTPUT_SUFFIX = " No Mesh Mixamo.fbx"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert unresolved D-word mesh FBXs in Assets/Signs in small batches."
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=5,
        help="Maximum number of words to process in one Blender run. Defaults to 5.",
    )
    parser.add_argument(
        "--prefix",
        default="SG ASL D",
        help='Filename prefix to match. Defaults to "SG ASL D".',
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the next batch without invoking Blender.",
    )
    parser.add_argument(
        "--delete-source-on-success",
        action="store_true",
        help="Pass through to the Blender converter.",
    )
    parser.add_argument(
        "--min-free-gb",
        type=float,
        default=1.0,
        help="Warn when available disk space is below this threshold. Defaults to 1.0 GB.",
    )
    args = parser.parse_args()
    if args.batch_size < 1:
        parser.error("--batch-size must be at least 1.")
    return args


def unresolved_words(prefix: str) -> list[str]:
    words: list[str] = []
    pattern = f"{prefix}*.fbx"
    for path in sorted(SIGNS_DIR.glob(pattern)):
        if not path.name.endswith(MESH_SUFFIX):
            continue
        base_name = path.name[: -len(MESH_SUFFIX)]
        output_path = SIGNS_DIR / f"{base_name}{OUTPUT_SUFFIX}"
        if output_path.exists():
            continue
        words.append(base_name)
    return words


def free_gb() -> float:
    usage = shutil.disk_usage(SIGNS_DIR)
    return usage.free / (1024**3)


def blender_command(words: list[str], delete_source_on_success: bool) -> list[str]:
    command = [
        str(BLENDER),
        "--background",
        "--factory-startup",
        "--python",
        str(CONVERTER),
        "--",
        "--input-dir",
        str(SIGNS_DIR),
        "--output-dir",
        str(SIGNS_DIR),
    ]
    if delete_source_on_success:
        command.append("--delete-source-on-success")
    for word in words:
        command.extend(["--word", word])
    return command


def main() -> int:
    args = parse_args()

    if not BLENDER.exists():
        print(f"Blender binary not found: {BLENDER}", file=sys.stderr)
        return 2

    pending = unresolved_words(args.prefix)
    if not pending:
        print("No unresolved mesh FBX files matched.")
        return 0

    batch = pending[: args.batch_size]
    available_gb = free_gb()
    if available_gb < args.min_free_gb:
        print(
            f"Warning: only {available_gb:.2f} GB free in {SIGNS_DIR}. "
            f"Requested minimum is {args.min_free_gb:.2f} GB.",
            file=sys.stderr,
        )

    print("Next batch:")
    for word in batch:
        print(word)

    if args.dry_run:
        return 0

    command = blender_command(batch, args.delete_source_on_success)
    completed = subprocess.run(command)
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
