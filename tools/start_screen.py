"""Publish the start screen (awake home) art.

The designer supplied it as a whole authored phone screen: docs/start_screen/
book_1..4.png (2160x3840) — the storybook on the candle-lit table with the
SLEEP / MOSAIC / BAG / SETTINGS plaques and the empty HP strip already drawn
in. The four frames differ ONLY in the candle flame (0.2% of the pixels), so we
publish one backdrop plus four tiny flame patches instead of four 9:16 frames.

The art sits on a 144x256 pixel grid (one authored pixel == 15 source px), so a
BOX downscale recovers the authored pixels exactly; NEAREST back up 5x keeps
them fat and crisp through any runtime scaling.

The *_base.jpg crops are pixel-identical to their region of book_1, i.e. the
resting buttons come free with the backdrop — only the *_pressed art is
published, as an overlay the UI draws while a plaque is held down. Button rects
were located by template-matching the base crops against book_1 (score 1.000);
they are mirrored as fractions in src/ui/StartScreen.tsx.
"""

import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

REPO_ROOT = manifest_lib.REPO_ROOT
SRC_DIR = os.path.join(REPO_ROOT, "docs", "start_screen")
OUT_DIR = os.path.join(REPO_ROOT, "assets", "start_screen")

CELL = 15  # source px per authored pixel (2160/144, 3840/256)
UPSCALE = 5  # published at 720x1280 so runtime smoothing can't blur the pixels
FRAME_COUNT = 4

# Candle flame patch: the only region that changes between frames (measured
# diff bbox x 79..327, y 403..848), snapped out to whole authored pixels.
CANDLE = (60, 375, 300, 495)

# Where each plaque sits inside the 2160x3840 backdrop: x, y, w, h.
BUTTONS = {
    "sleep": (188, 2608, 1785, 489),
    "mosaic": (95, 3175, 633, 511),
    "bag": (772, 3182, 624, 507),
    "settings": (1446, 3176, 616, 510),
}


def open_source(stem):
    """Designer exported some plaques as png, some as jpg."""
    for ext in ("png", "jpg"):
        path = os.path.join(SRC_DIR, f"{stem}.{ext}")
        if os.path.exists(path):
            return Image.open(path).convert("RGB")
    raise FileNotFoundError(stem)


def crunch(img, cells_w, cells_h):
    """Source art -> authored pixel grid -> fat crisp pixels."""
    small = img.resize((cells_w, cells_h), Image.BOX)
    return small.resize((cells_w * UPSCALE, cells_h * UPSCALE), Image.NEAREST)


def publish(name, img):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"{name}.png")
    img.save(path, optimize=True)
    rel = os.path.relpath(path, os.path.join(REPO_ROOT, "assets")).replace(os.sep, "/")
    manifest_lib.update(
        "scenes",
        f"start_{name}",
        {
            "path": rel,
            "width": img.width,
            "height": img.height,
            "frames": 1,
            "frameWidth": img.width,
            "frameHeight": img.height,
        },
    )
    kb = os.path.getsize(path) // 1024
    print(f"registered scenes.start_{name} ({img.width}x{img.height}, {kb} KB)")


def build():
    frames = [open_source(f"book_{i}") for i in range(1, FRAME_COUNT + 1)]
    base = frames[0]
    publish("book", crunch(base, base.width // CELL, base.height // CELL))

    x, y, w, h = CANDLE
    for i, frame in enumerate(frames, start=1):
        patch = frame.crop((x, y, x + w, y + h))
        publish(f"candle_{i}", crunch(patch, w // CELL, h // CELL))

    # Pressed art is re-fitted to its resting rect so the overlay lands exactly
    # on the plaque baked into the backdrop.
    for name, (_, _, w, h) in BUTTONS.items():
        art = open_source(f"{name}_pressed")
        publish(f"{name}_pressed", crunch(art, round(w / CELL), round(h / CELL)))


if __name__ == "__main__":
    build()
