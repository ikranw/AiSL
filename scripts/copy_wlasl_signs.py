"""
Reads WLASL_v0.3.json and copies the first available MP4 for each gloss
into app/frontend/public/signs/<GLOSS>.mp4 (uppercase).

Usage:
    python scripts/copy_wlasl_signs.py
"""

import json
import shutil
from pathlib import Path

WLASL_JSON   = Path.home() / "Desktop/wlasl-processed/WLASL_v0.3.json"
VIDEOS_DIR   = Path.home() / "Desktop/wlasl-processed/videos"
SIGNS_DIR    = Path(__file__).parent.parent / "app/frontend/public/signs"

SIGNS_DIR.mkdir(parents=True, exist_ok=True)

with open(WLASL_JSON) as f:
    data = json.load(f)

copied   = 0
missing  = 0
skipped  = 0

for entry in data:
    gloss = entry["gloss"].upper()          # e.g. "HELLO"
    dest  = SIGNS_DIR / f"{gloss}.mp4"

    if dest.exists():
        skipped += 1
        continue

    # Try each instance until we find a local file
    found = False
    for inst in entry.get("instances", []):
        vid_id = inst["video_id"]           # e.g. "00335" or "69241"
        # Try exact name first, then zero-padded 5-digit
        candidates = [
            VIDEOS_DIR / f"{vid_id}.mp4",
            VIDEOS_DIR / f"{int(vid_id):05d}.mp4",
        ]
        for src in candidates:
            if src.exists():
                shutil.copy2(src, dest)
                print(f"  ✓ {gloss:20s}  ← {src.name}")
                copied += 1
                found = True
                break
        if found:
            break

    if not found:
        missing += 1

print(f"\nDone — copied: {copied}, already existed: {skipped}, no local file: {missing}")
