#!/usr/bin/env python3
"""Extract single-frame hero sprites for the Android home-screen widgets.

Home-screen widgets render static RemoteViews: the 2-frame idle strips used by
the app would show up doubled. This crops frame 0 of every hero idle strip
into assets/pixellab/sprites/widget/hero_<type>.png.
Rerun after the hero sprites change in the pixel pipeline.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "pixellab" / "sprites"
DST = SRC / "widget"

HERO_TYPES = [
    "monk",
    "ranger",
    "druid",
    "rogue",
    "knight",
    "paladin",
    "ninja",
    "mage",
    "warlock",
]

FRAME = 256  # hero idle strips are 512x256 = 2 frames of 256x256


def crop_first_frame(strip: Path, out: Path) -> None:
    with Image.open(strip) as img:
        if img.width < FRAME * 2 or img.height != FRAME:
            raise ValueError(f"{strip.name}: expected a 2-frame 256x256 strip, got {img.size}")
        frame = img.crop((0, 0, FRAME, FRAME))
        frame.save(out)
        print(f"[widget-frames] {out.relative_to(ROOT)} ({frame.width}x{frame.height})")


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for hero in HERO_TYPES:
        strip = SRC / f"hero_{hero}.png"
        if not strip.exists():
            print(f"[widget-frames] SKIP {strip.name} (missing)")
            continue
        crop_first_frame(strip, DST / f"hero_{hero}.png")


if __name__ == "__main__":
    main()
