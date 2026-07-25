"""Publish the candle-flicker book backdrop.

The designer supplied the awake home backdrop as 7 hand-tuned flicker frames
(docs/book_menu/кадр-01..07.png, 2160x3840) — a blank open book page lit by a
candle whose glow breathes between frames. They are far too heavy for the
bundle, so we crunch each frame down to the same pixel grid the 64px hero
sprite lands on (135x240 → one book pixel == one hero pixel on screen), flatten
the photographic noise with a mode filter, clamp the palette hard with no
dithering so the page reads as authored pixel art rather than a downscaled
photo, then blow it back up 4x with NEAREST so the crisp fat pixels survive
any runtime scaling. Registered as scenes.book_menu_1..7. The UI cycles them
as a living background and inks the hero + stats + buttons on top at render
time.
"""

import os
import sys

from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

REPO_ROOT = manifest_lib.REPO_ROOT
DOCS_DIR = os.path.join(REPO_ROOT, "docs", "book_menu")
FRAME_OUT_DIR = os.path.join(REPO_ROOT, "assets", "book_menu")

FRAME_COUNT = 7
PIXEL_W, PIXEL_H = 108, 192  # slightly chunkier than the hero pixel — reads unmistakably 8-bit
UPSCALE = 5  # published at 540x960 so runtime smoothing can't blur the pixels
QUANT_COLORS = 18  # hard clamp: flat authored-looking pixel regions


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
        # double mode filter melts the photographic grain into flat pixel clusters
        img = img.filter(ImageFilter.ModeFilter(3)).filter(ImageFilter.ModeFilter(3))
        img = img.quantize(colors=QUANT_COLORS, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
        img = img.convert("RGB").resize((PIXEL_W * UPSCALE, PIXEL_H * UPSCALE), Image.NEAREST)
        img = img.quantize(colors=QUANT_COLORS, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
        out_path = os.path.join(FRAME_OUT_DIR, f"frame_{i}.png")
        img.save(out_path, optimize=True)
        register("scenes", f"book_menu_{i}", out_path, img)


if __name__ == "__main__":
    build_frames()
