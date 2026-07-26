"""Slice the death screen sheet from assets/death_screen/death.png.

The 2160x3840 mockup is bundled whole (title, graveyard, "0 HP" panel
with baked empty hearts, SOUL TETHER and LET GO plates); the app overlays
only button hotspots and a breathing glow on the moon (reuses the night
glow sprite). Geometry constants live in src/screens/DeathSheet.tsx.

Usage: python3 tools/death_slice.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "death_screen" / "death.png"
OUT = ROOT / "assets" / "design" / "gen" / "death" / "sheet.png"

OUT_SIZE = (1080, 1920)


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGB")
    img.resize(OUT_SIZE, Image.LANCZOS).save(OUT, optimize=True)
    print(f"{OUT.relative_to(ROOT)}  <-  {SRC.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
