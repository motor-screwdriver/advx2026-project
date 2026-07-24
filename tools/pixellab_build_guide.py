#!/usr/bin/env python3
"""Promote the generated Luma guide assets into the live manifest.

Run after generating `guide_luma_idle_f*.png`, `guide_moon_crest_raw.png`,
and `guide_sleep_book_raw.png` in the gitignored PixelLab source folder.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image  # noqa: E402
import manifest_lib  # noqa: E402
from pixellab_batch import normalize, save_strip, upscale  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "_src", "pixellab")
WALKFIX = os.path.join(RAW, "walkfix")


def load_frames(base):
    frames = []
    index = 0
    while os.path.exists(f"{base}_f{index}.png"):
        frames.append(Image.open(f"{base}_f{index}.png").convert("RGBA"))
        index += 1
    if not frames:
        raise FileNotFoundError(base)
    return frames


def sprite_entry(path, frames, frame_size):
    return {
        "path": path,
        "width": frame_size * frames,
        "height": frame_size,
        "frames": frames,
        "frameWidth": frame_size,
        "frameHeight": frame_size,
    }


def build_sprite():
    source = load_frames(os.path.join(WALKFIX, "guide_luma_idle"))
    frames = [upscale(frame, 4) for frame in normalize(source, 2)]
    save_strip(frames, "sprites/guide_luma.png")


def build_icon(raw_name, live_name):
    image = Image.open(os.path.join(RAW, raw_name)).convert("RGBA")
    save_strip([upscale(image, 2)], f"icons/{live_name}.png")


def update_manifest():
    data = manifest_lib.load_data()
    manifest_lib.add_entry(
        data,
        "sprites",
        "guide_luma",
        sprite_entry("pixellab/sprites/guide_luma.png", 2, 256),
    )
    for name in ("guide_moon_crest", "guide_sleep_book"):
        manifest_lib.add_entry(
            data,
            "icons",
            name,
            sprite_entry(f"pixellab/icons/{name}.png", 1, 64),
        )
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)


def main():
    build_sprite()
    build_icon("guide_moon_crest_raw.png", "guide_moon_crest")
    build_icon("guide_sleep_book_raw.png", "guide_sleep_book")
    update_manifest()


if __name__ == "__main__":
    main()
