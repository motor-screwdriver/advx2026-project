"""Slice the morning (night result) screens from assets/night_screens.

Only frame 1 of each outcome is bundled: the *_f2 sheets are full AI
re-renders with shifted title/panel geometry, so cross-fading them made
the whole screen pulse. The "living" effect is instead a soft radial
glow sprite (glow.png) that the app breathes over the sun/lightning.
All geometry (streak plaque, CONTINUE plate, glow anchors) is baked into
the art and mirrored as constants in src/screens/MorningSheet.tsx.

Usage: python3 tools/night_slice.py
"""

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "night_screens"
OUT_DIR = ROOT / "assets" / "design" / "gen" / "night"

OUT_SIZE = (1080, 1920)
GLOW_SIZE = 512  # white radial alpha sprite, tinted per outcome in the app

# "AI生成" watermark in the bottom-left corner of every sheet (same spot on
# all of them); covered with the identical-height patch right next to it.
WM_BOX = (0, 3714, 240, 3822)
WM_SRC_X = 260

SHEETS = {
    "perfect": "1_perfect_night",
    "good": "2_good_night",
    "bad": "3_bad_night",
    "terrible": "4_terrible_night",
    "missed": "5_missed",
}


def build_glow() -> None:
    """White disc with a smooth cosine alpha falloff (soft radial glow)."""
    img = Image.new("RGBA", (GLOW_SIZE, GLOW_SIZE), (255, 255, 255, 0))
    px = img.load()
    center = (GLOW_SIZE - 1) / 2
    for y in range(GLOW_SIZE):
        for x in range(GLOW_SIZE):
            d = math.hypot(x - center, y - center) / center
            if d < 1.0:
                px[x, y] = (255, 255, 255, round(255 * (0.5 + 0.5 * math.cos(math.pi * d)) ** 1.5))
    out = OUT_DIR / "glow.png"
    img.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  <-  generated radial glow")


def strip_watermark(img: Image.Image) -> Image.Image:
    left, top, right, bottom = WM_BOX
    patch = img.crop((WM_SRC_X, top, WM_SRC_X + (right - left), bottom))
    img.paste(patch, (left, top))
    return img


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for key, base in SHEETS.items():
        src = SRC_DIR / f"{base}.png"
        out = OUT_DIR / f"{key}_1.png"
        img = strip_watermark(Image.open(src).convert("RGB"))
        img.resize(OUT_SIZE, Image.LANCZOS).save(out, optimize=True)
        print(f"{out.relative_to(ROOT)}  <-  {src.name}")
    build_glow()


if __name__ == "__main__":
    main()
