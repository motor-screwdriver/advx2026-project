#!/usr/bin/env python3
"""import_luma_tavern.py — import the Luma tavern onboarding scenes.

Copies the hand-drawn tavern frames from luma_tavern_icons/ into assets/luma/,
downscaled x0.5 (2160x3840 -> 1080x1920 scenes, buttons likewise) so the app
bundle stays lean, and registers them in the manifest's `luma` section
(export LUMA). Keys: s1_* = question scene, s2_* = result scene, btn_* =
sprite buttons with baked (accept/adjust) or code-drawn (empty) labels.

Idempotent: safe to re-run; files and manifest entries are rebuilt each run.

Usage: python3 tools/import_luma_tavern.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
SRC = os.path.join(ROOT, "luma_tavern_icons")
DST = os.path.join(ROOT, "assets", "luma")

# Full-screen opaque frames, swapped for the ambient/blink/talking animation.
# Note: экран_1 разговор/рот_закрыт.png is byte-identical to the base frame.
SCENES = {
    "s1_base": "экран_1_вопрос/кадр_1_базовый.png",
    "s1_env2": "экран_1_вопрос/окружение/кадр_2.png",
    "s1_env3": "экран_1_вопрос/окружение/кадр_3.png",
    "s1_env4": "экран_1_вопрос/окружение/кадр_4.png",
    "s1_blink": "экран_1_вопрос/моргание/люма_моргание.png",
    "s1_talk_half": "экран_1_вопрос/разговор/рот_приоткрыт.png",
    "s1_talk_open": "экран_1_вопрос/разговор/рот_открыт.png",
    "s2_base": "экран_2_результат/кадр_1_базовый.png",
    "s2_env2": "экран_2_результат/окружение/кадр_2.png",
    "s2_env3": "экран_2_результат/окружение/кадр_3.png",
    "s2_blink": "экран_2_результат/моргание/люма_моргание.png",
}

# Sprite buttons with alpha; *_down is the pressed state.
BUTTONS = {
    "btn_empty": "кнопки/кнопка_пустая.png",
    "btn_empty_down": "кнопки/кнопка_пустая_нажата.png",
    "btn_accept": "кнопки/кнопка_accept.png",
    "btn_accept_down": "кнопки/кнопка_accept_нажата.png",
    "btn_adjust": "кнопки/кнопка_adjust.png",
    "btn_adjust_down": "кнопки/кнопка_adjust_нажата.png",
}

# "Welcome" pose of screen 1 (before the player has said anything) — same
# frame set as s1_*, but the art already lives at final size in assets/luma/
# (no raw source to copy/downscale from).
START = {
    "s1_base_start": "s1_base_start.png",
    "s1_env2_start": "s1_env2_start.png",
    "s1_env3_start": "s1_env3_start.png",
    "s1_env4_start": "s1_env4_start.png",
    "s1_blink_start": "s1_blink_start.png",
    "s1_talk_half_start": "s1_talk_half_start.png",
    "s1_talk_open_start": "s1_talk_open_start.png",
}


def import_one(data, key, rel_src, has_alpha):
    src = os.path.join(SRC, rel_src)
    dst = os.path.join(DST, f"{key}.png")
    with Image.open(src) as im:
        im = im.convert("RGBA" if has_alpha else "RGB")
        w, h = im.size[0] // 2, im.size[1] // 2
        im.resize((w, h), Image.LANCZOS).save(dst, optimize=True)
    manifest_lib.add_entry(data, "luma", key, {
        "path": f"luma/{key}.png",
        "width": w, "height": h, "frames": 1,
        "frameWidth": w, "frameHeight": h,
    })


def register_existing(data, key, filename):
    """Register a file that already lives in assets/luma/ (no raw source)."""
    with Image.open(os.path.join(DST, filename)) as im:
        w, h = im.size
    manifest_lib.add_entry(data, "luma", key, {
        "path": f"luma/{filename}",
        "width": w, "height": h, "frames": 1,
        "frameWidth": w, "frameHeight": h,
    })


def main():
    os.makedirs(DST, exist_ok=True)
    data = manifest_lib.load_data()
    if os.path.isdir(SRC):
        data["luma"] = {}  # rebuild from scratch so dropped frames don't linger
        for key, rel in sorted(SCENES.items()):
            import_one(data, key, rel, has_alpha=False)
        for key, rel in sorted(BUTTONS.items()):
            import_one(data, key, rel, has_alpha=True)
    else:
        print(f"raw source {SRC} not found — keeping existing luma/* manifest entries")
    for key, filename in sorted(START.items()):
        register_existing(data, key, filename)
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    total = sum(os.path.getsize(os.path.join(DST, f)) for f in os.listdir(DST))
    print(f"luma manifest now has {len(data['luma'])} entries -> assets/luma/ ({total // 1024}K)")


if __name__ == "__main__":
    main()
