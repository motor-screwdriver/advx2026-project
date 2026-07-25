#!/usr/bin/env python3
"""import_luma_morning.py — import the Luma morning-chat scene.

Companion to import_luma_tavern.py: same hand-drawn tavern, but the frame set
the hero wakes up to (nameplate + parchment + chat input, no answer slots).
Copies the raw frames into assets/luma/ downscaled x0.5 (2160x3840 ->
1080x1920) and registers them in the manifest's `luma` section as morning_*.

Only the morning_* keys are touched, so the s1_*/s2_*/btn_* entries written by
import_luma_tavern.py survive. Idempotent: safe to re-run.

Usage: python3 tools/import_luma_morning.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
DST = os.path.join(ROOT, "assets", "luma")

# The raw art either sits in the shared drop folder or straight in the repo root.
SRC_CANDIDATES = [
    os.path.join(ROOT, "luma_tavern_icons", "экран_утро_сон"),
    os.path.join(ROOT, "экран_утро_сон"),
]

# Full-screen opaque frames, swapped for the ambient/blink/talking animation.
# Note: разговор/рот_закрыт.png is byte-identical to the base frame.
SCENES = {
    "morning_base": "кадр_1_базовый.png",
    "morning_env2": "окружение/кадр_2.png",
    "morning_env3": "окружение/кадр_3.png",
    "morning_blink": "моргание/люма_моргание.png",
    "morning_talk_half": "разговор/рот_приоткрыт.png",
    "morning_talk_open": "разговор/рот_открыт.png",
}


def find_src():
    for candidate in SRC_CANDIDATES:
        if os.path.isdir(candidate):
            return candidate
    return None


def import_one(data, src, key, rel_src):
    with Image.open(os.path.join(src, rel_src)) as im:
        im = im.convert("RGB")
        w, h = im.size[0] // 2, im.size[1] // 2
        im.resize((w, h), Image.LANCZOS).save(os.path.join(DST, f"{key}.png"), optimize=True)
    manifest_lib.add_entry(data, "luma", key, {
        "path": f"luma/{key}.png",
        "width": w, "height": h, "frames": 1,
        "frameWidth": w, "frameHeight": h,
    })


def main():
    src = find_src()
    if src is None:
        print("raw morning art not found in " + " or ".join(SRC_CANDIDATES))
        return 1
    os.makedirs(DST, exist_ok=True)
    data = manifest_lib.load_data()
    for key, rel in sorted(SCENES.items()):
        import_one(data, src, key, rel)
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    written = sum(os.path.getsize(os.path.join(DST, f"{k}.png")) for k in SCENES)
    print(f"imported {len(SCENES)} morning frames -> assets/luma/ ({written // 1024}K)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
