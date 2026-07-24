"""Publish the candle-flicker book backdrop + ink button ring.

The designer supplied the awake home backdrop as 7 hand-tuned flicker frames
(docs/book_menu/кадр-01..07.png, 2160x3840) — a blank open book page lit by a
candle whose glow breathes between frames. They are far too heavy for the
bundle, so we crunch each frame down to a chunky pixel grid (135x240), clamp
the palette, then blow it back up 4x with NEAREST so the crisp fat pixels
survive any runtime scaling — matching the sprite look of the rest of the
game. Registered as scenes.book_menu_1..7. The UI cycles them as a living
background and inks the hero + stats + buttons on top at render time.

Also publishes the PixelLab hand-drawn ink oval (assets/_src/pixellab/
ink_circle_wide.png, transparent) used to circle the page "buttons" — trimmed
to its alpha bbox and registered as icons.ink_circle.
"""

import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

REPO_ROOT = manifest_lib.REPO_ROOT
DOCS_DIR = os.path.join(REPO_ROOT, "docs", "book_menu")
RAW_DIR = os.path.join(REPO_ROOT, "assets", "_src", "pixellab")
FRAME_OUT_DIR = os.path.join(REPO_ROOT, "assets", "book_menu")
ICON_OUT_DIR = os.path.join(REPO_ROOT, "assets", "pixellab", "icons")

FRAME_COUNT = 7
PIXEL_W, PIXEL_H = 135, 240  # the actual pixel grid
UPSCALE = 4  # published at 540x960 so runtime smoothing can't blur the pixels
QUANT_COLORS = 48


def register(section, name, path, img):
    rel = os.path.relpath(path, os.path.join(REPO_ROOT, "assets"))
    manifest_lib.update(
        section,
        name,
        {
            "path": rel.replace(os.sep, "/"),
            "width": img.width,
            "height": img.height,
            "frames": 1,
            "frameWidth": img.width,
            "frameHeight": img.height,
        },
    )
    kb = os.path.getsize(path) // 1024
    print(f"registered {section}.{name} ({img.width}x{img.height}, {kb} KB)")


def build_frames():
    os.makedirs(FRAME_OUT_DIR, exist_ok=True)
    for i in range(1, FRAME_COUNT + 1):
        src = os.path.join(DOCS_DIR, f"кадр-{i:02d}.png")
        img = Image.open(src).convert("RGB")
        img = img.resize((PIXEL_W, PIXEL_H), Image.LANCZOS)
        img = img.quantize(colors=QUANT_COLORS, method=Image.MEDIANCUT)
        img = img.convert("RGB").resize((PIXEL_W * UPSCALE, PIXEL_H * UPSCALE), Image.NEAREST)
        img = img.quantize(colors=QUANT_COLORS, method=Image.MEDIANCUT)
        out_path = os.path.join(FRAME_OUT_DIR, f"frame_{i}.png")
        img.save(out_path, optimize=True)
        register("scenes", f"book_menu_{i}", out_path, img)


def build_ink_circle():
    os.makedirs(ICON_OUT_DIR, exist_ok=True)
    img = Image.open(os.path.join(RAW_DIR, "ink_circle_wide.png")).convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    out_path = os.path.join(ICON_OUT_DIR, "ink_circle.png")
    img.save(out_path)
    register("icons", "ink_circle", out_path, img)


if __name__ == "__main__":
    build_frames()
    build_ink_circle()
