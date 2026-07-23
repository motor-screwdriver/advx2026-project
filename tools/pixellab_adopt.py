#!/usr/bin/env python3
"""pixellab_adopt.py — adopt walkfix animation candidates as live sprites.

Takes the cleaned-up idle/walk frames from assets/_src/pixellab/walkfix/
(produced by tools/pixellab_walkfix.py) and rebuilds the live strips in
assets/pixellab/sprites/ — same names and geometry as before, so the
manifest and UI need no changes:

  hero_X_walk_f{0..3} -> 6x256 strip hero_X_walk.png (+ _gold_walk, + 1bit)
  hero_X_idle_f{0..3} -> 2x256 strip hero_X.png     (+ _gold,     + 1bit)
  1bit hero_icon_40 rebuilt from the new knight idle.

Usage: python3 tools/pixellab_adopt.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PIL import Image  # noqa: E402
from pixellab_batch import (  # noqa: E402
    OUT_DIR,
    goldify,
    grid_downscale,
    normalize,
    one_bit,
    save_strip,
    upscale,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WALKFIX = os.path.join(ROOT, "assets", "_src", "pixellab", "walkfix")

HEROES = ["monk", "ranger", "druid", "rogue", "knight", "paladin", "ninja", "mage", "warlock"]


def load_frames(base):
    frames = []
    i = 0
    while os.path.exists(f"{base}_f{i}.png"):
        frames.append(Image.open(f"{base}_f{i}.png").convert("RGBA"))
        i += 1
    if not frames:
        raise FileNotFoundError(base)
    return frames


def main():
    for name in HEROES:
        base = f"hero_{name}"
        try:
            walk = normalize(load_frames(os.path.join(WALKFIX, f"{base}_walk")), 6)
            idle = normalize(load_frames(os.path.join(WALKFIX, f"{base}_idle")), 2)
        except FileNotFoundError as e:
            print("skip", base, e)
            continue
        idle4 = [upscale(f, 4) for f in idle]
        walk4 = [upscale(f, 4) for f in walk]
        save_strip(idle4, f"sprites/{base}.png")
        save_strip(walk4, f"sprites/{base}_walk.png")
        save_strip([goldify(f) for f in idle4], f"sprites/{base}_gold.png")
        save_strip([goldify(f) for f in walk4], f"sprites/{base}_gold_walk.png")
        save_strip([one_bit(f) for f in idle4], f"sprites/1bit/{base}.png")
        save_strip([one_bit(f) for f in walk4], f"sprites/1bit/{base}_walk.png")

    try:
        knight = load_frames(os.path.join(WALKFIX, "hero_knight_idle"))[0]
        save_strip(
            [upscale(one_bit(upscale(grid_downscale(knight, 40), 4)), 1)],
            "sprites/1bit/hero_icon_40.png",
        )
    except FileNotFoundError:
        print("skip hero_icon_40 (no knight idle)")
    print("done ->", os.path.relpath(OUT_DIR, ROOT))


if __name__ == "__main__":
    main()
