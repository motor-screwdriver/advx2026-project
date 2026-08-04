#!/usr/bin/env python3
"""Rebuild the journey carousel strip from the square source tiles.

The artist tiles (`godot_assets/journey/tiles/tile_NN.png`, 1024x1024 each)
each carry their own ground: the top of the soil band sits anywhere between
y=844 and y=953, and the soil itself is drawn 14 to 97px thick before fading
into transparency — so three of the five tiles stop ~130px short of the tile
bottom. Pasted side by side that reads as steps in the horizon with holes
underneath.

This script makes the five tiles one continuous walk:
  * every tile is shifted vertically so its soil line lands on a shared
    GROUND_Y — one unbroken ground line across the whole loop;
  * a single soil band, sampled from the tile that has the deepest soil drawn
    (SOIL_SOURCE) and repeated under all five, backs the strip from GROUND_Y
    to the bottom edge. Each tile's own soil still draws on top of it and
    fades into it, so there is no seam and no hole under any tile.

The result is downscaled by exactly 0.5 (an integer ratio, so the pixel art
stays crisp) to 2560x512 — one square tile per 512px, well under the common
4096px GPU texture limit.

Run: python3 tools/rebuild_forest_strip.py
"""

import os

import numpy as np
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TILES_DIR = os.path.join(REPO_ROOT, 'godot_assets', 'journey', 'tiles')
GEN_DIR = os.path.join(REPO_ROOT, 'assets', 'journey', 'gen')

# Loop order, kept from the artist's `carousel_final_1-2-8-4-5` drop.
TILE_ORDER = (1, 2, 8, 4, 5)
TILE_SIZE = 1024
# Shared ground line. Mid-range of the sources, so no tile shifts far enough
# to push its treeline out of frame, and 144px of soil is left under it.
GROUND_Y = 880
# Tile whose soil backs the whole strip — the deepest band on offer (97px).
SOIL_SOURCE = 2
DOWNSCALE = 2


def soil_line(tile):
    """Y of the top of the soil band — the tile's visual ground level."""
    a = np.asarray(tile)
    r, g, b = (a[..., i].astype(int) for i in range(3))
    soil = (a[..., 3] > 16) & (r > g + 6) & (g >= b - 4) & (r > 25)
    return int(np.where(soil.mean(axis=1) > 0.35)[0].min())


def soil_band(tile):
    """The strip's shared soil, GROUND_Y down to the bottom edge.

    Sampled from one tile's own soil rows and repeated vertically, flipping
    every other repeat so the joins read as more rubble rather than banding.
    """
    slab = tile.crop((0, soil_line(tile), TILE_SIZE, TILE_SIZE))
    flipped = slab.transpose(Image.FLIP_TOP_BOTTOM)
    band = Image.new('RGBA', (TILE_SIZE, TILE_SIZE - GROUND_Y))
    for i, y in enumerate(range(0, band.height, slab.height)):
        band.paste(flipped if i % 2 else slab, (0, y))
    return band


def align(tile, band):
    """Tile shifted onto GROUND_Y, over the shared soil band."""
    base = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    base.paste(band, (0, GROUND_Y))
    shifted = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
    shifted.paste(tile, (0, GROUND_Y - soil_line(tile)))
    return Image.alpha_composite(base, shifted)


def main():
    sources = {}
    for number in set(TILE_ORDER) | {SOIL_SOURCE}:
        path = os.path.join(TILES_DIR, f'tile_{number:02d}.png')
        tile = Image.open(path).convert('RGBA')
        if tile.size != (TILE_SIZE, TILE_SIZE):
            raise SystemExit(f'{path}: expected {TILE_SIZE}px square, got {tile.size}')
        sources[number] = tile

    band = soil_band(sources[SOIL_SOURCE])
    strip = Image.new('RGBA', (TILE_SIZE * len(TILE_ORDER), TILE_SIZE), (0, 0, 0, 0))
    for i, number in enumerate(TILE_ORDER):
        tile = sources[number]
        print(f'  tile_{number:02d}: ground {soil_line(tile)} -> {GROUND_Y}')
        strip.paste(align(tile, band), (i * TILE_SIZE, 0))

    size = (strip.width // DOWNSCALE, strip.height // DOWNSCALE)
    strip.resize(size, Image.LANCZOS).save(
        os.path.join(GEN_DIR, 'forest_strip.png'), optimize=True)
    print(f'forest_strip: {size[0]}x{size[1]} '
          f'(ground at {GROUND_Y / TILE_SIZE:.4f} of strip height)')


if __name__ == '__main__':
    main()
