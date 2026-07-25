"""Slice the Year Mosaic mockup sprite into runtime assets.

Input:  new-assets/year_mosaic_очищенный.png  (2160x3840 cleaned mockup)
Output: assets/design/gen/mosaic/bg.png            full-screen background
        assets/design/gen/mosaic/tile_perfect.png   gold tile (legend donor)
        assets/design/gen/mosaic/tile_good.png      silver tile
        assets/design/gen/mosaic/tile_bad.png       dark tile

Grid/plaque/share geometry consumed by src/screens/MosaicParts.tsx was
measured from this same sprite (see SRC constants there).
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPRITE = ROOT / "new-assets" / "year_mosaic_очищенный.png"
OUT = ROOT / "assets" / "design" / "gen" / "mosaic"

# Legend swatch search windows (source px) and per-tile color predicates.
LEGEND_Y = (2840, 3010)
SWATCHES = {
    # gold fill ~(206,137,33); window stops before the "PERFECT" caption
    "tile_perfect": ((250, 430), lambda r, g, b: r > 140 and g > 90 and b < 120),
    # warm silver fill ~(115,103,89)
    "tile_good": ((950, 1150), lambda r, g, b: r > 90 and g > 80 and b > 70),
    # near-black fill with a faint gray rim ~(18,17,14) vs well bg (8,5,0)
    "tile_bad": ((1540, 1670), lambda r, g, b: r + g + b > 40 and b > 10),
}


def bbox(px, xr, yr, pred):
    x0 = y0 = 10**9
    x1 = y1 = -1
    for y in range(*yr):
        for x in range(*xr):
            r, g, b = px[x, y]
            if pred(r, g, b):
                x0, y0 = min(x0, x), min(y0, y)
                x1, y1 = max(x1, x), max(y1, y)
    if x1 < 0:
        raise SystemExit(f"swatch not found in {xr}x{yr}")
    return x0, y0, x1 + 1, y1 + 1


def main():
    img = Image.open(SPRITE).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    px = img.load()

    img.resize((1080, 1920), Image.LANCZOS).save(OUT / "bg.png", optimize=True)
    print("bg.png 1080x1920")

    for name, (xr, pred) in SWATCHES.items():
        x0, y0, x1, y1 = bbox(px, xr, LEGEND_Y, pred)
        img.crop((x0, y0, x1, y1)).save(OUT / f"{name}.png", optimize=True)
        print(f"{name}.png <- ({x0},{y0})..({x1},{y1}) {x1 - x0}x{y1 - y0}")


if __name__ == "__main__":
    main()
