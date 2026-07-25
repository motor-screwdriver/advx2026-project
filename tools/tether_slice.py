"""Slice the Soul Tether mini-game sheet from assets/soul_tether.

The 1125x1999 mockup is bundled whole (frame, skull crest, title, wraith
scene, bar bezel, parchment, gold plate), but everything that changes at
runtime is wiped from the art and redrawn by the app: the round text, the
three round pips, the bar interior (golden zone + sparkle + ticks), the
parchment hint text and the plate label. A 4-point star sparkle sprite is
generated for the cursor. Geometry constants are mirrored in
src/ui/SoulTetherSheet.tsx.

Usage: python3 tools/tether_slice.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "soul_tether" / "soul_tether.png"
OUT_DIR = ROOT / "assets" / "design" / "gen" / "tether"

STAR_SIZE = 96

# (wipe box, patch source origin): patch is the same-size region of clean
# texture next to the wiped area, tiled over it.
ROUND_TEXT = ((350, 322, 790, 388), "tile_x", (758, 322))
PIPS = [
    ((370, 392, 486, 500), "copy", (760, 392)),
    ((515, 392, 615, 500), "copy", (760, 392)),
    ((645, 392, 748, 500), "copy", (760, 392)),
]
# Bar: interior plus the bezel bands above/below it (zone glow, sparkle
# wedge and the baked tick stubs all bleed onto the bezel).
TRACK = ((91, 1222, 1034, 1357), "tile_x", (160, 1222))
TRACK_TOP = ((91, 1180, 1034, 1222), "tile_x", (150, 1180))
TRACK_BOTTOM = ((91, 1357, 1034, 1420), "tile_x", (160, 1357))
HINT_TEXT = ((215, 1462, 910, 1592), "tile_y", (215, 1594))
TAP_TEXT = ((330, 1662, 820, 1884), "tile_x", (258, 1662))


def wipe(img: Image.Image, box, mode: str, origin) -> None:
    left, top, right, bottom = box
    w, h = right - left, bottom - top
    ox, oy = origin
    if mode == "copy":
        img.paste(img.crop((ox, oy, ox + w, oy + h)), (left, top))
        return
    if mode == "tile_x":
        patch = img.crop((ox, top, min(ox + 40, left) if ox < left else ox + 40, bottom))
        x = left
        while x < right:
            img.paste(patch.crop((0, 0, min(patch.width, right - x), h)), (x, top))
            x += patch.width
        return
    # tile_y: repeat a horizontal band downwards
    patch = img.crop((left, oy, right, oy + 34))
    y = top
    while y < bottom:
        img.paste(patch.crop((0, 0, w, min(patch.height, bottom - y))), (left, y))
        y += patch.height


def build_star() -> None:
    """White 4-point star with a soft warm glow (the bar cursor sparkle)."""
    scale = 4
    size = STAR_SIZE * scale
    c, spike, waist = size / 2, size / 2 - scale, size * 0.09
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    pts = [
        (c, c - spike), (c + waist, c - waist), (c + spike, c),
        (c + waist, c + waist), (c, c + spike), (c - waist, c + waist),
        (c - spike, c), (c - waist, c - waist),
    ]
    d.polygon(pts, fill=(255, 244, 214, 255))
    glow = img.filter(ImageFilter.GaussianBlur(size / 10))
    glow.alpha_composite(img)
    out = OUT_DIR / "star.png"
    glow.resize((STAR_SIZE, STAR_SIZE), Image.LANCZOS).save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  <-  generated sparkle")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGB")
    for box, mode, origin in [ROUND_TEXT, *PIPS, TRACK, TRACK_TOP, TRACK_BOTTOM, HINT_TEXT, TAP_TEXT]:
        wipe(img, box, mode, origin)
    out = OUT_DIR / "sheet.png"
    img.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  <-  {SRC.relative_to(ROOT)}")
    build_star()


if __name__ == "__main__":
    main()
