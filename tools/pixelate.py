#!/usr/bin/env python3
"""pixelate.py — the 8bit Sleep deterministic art pipeline (PROMPT C §1).

Every shipped asset passes through here, no exceptions:

  1. downscale to the target grid (characters 64x64, scenes 256x144, ...)
  2. quantize to the 32-color project palette (tools/palette.json)
  3. optional 2px dark outline pass for characters (--outline)
  4. nearest-neighbor upscale x4 for crisp rendering
  5. write assets/<category>/<name>.png and register it in assets/manifest.ts

Multi-frame assets are horizontal strips: input width = grid_w * frames.

1-bit mode (--one-bit) quantizes to pure black/white by luminance threshold
with NO dithering (the Dot e-ink push uses ditherType NONE; every pixel is
under our control). Transparent pixels become white (e-ink paper).

Usage:
  python3 tools/pixelate.py assets/_src/hero_monk.png --name hero_monk \
      --section sprites --grid 64x64 --frames 2 --outline
"""

import argparse
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

UPSCALE = 4
PALETTE_PATH = os.path.join(manifest_lib.REPO_ROOT, 'tools', 'palette.json')
OUTLINE_HEX = '#0d0a1a'  # palette index 0 — the universal outline color

SECTION_DIRS = {
    'sprites': 'sprites',
    'sprites_1bit': os.path.join('sprites', '1bit'),
    'scenes': 'scenes',
    'icons': 'icons',
}


def load_palette(path=PALETTE_PATH):
    import json

    with open(path, 'r', encoding='utf-8') as fh:
        hexes = json.load(fh)['colors']
    return [tuple(int(h[i : i + 2], 16) for i in (1, 3, 5)) for h in hexes]


def _nearest(rgb, palette):
    r, g, b = rgb
    best, best_d = 0, 1 << 62
    for i, (pr, pg, pb) in enumerate(palette):
        d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if d < best_d:
            best, best_d = i, d
    return palette[best]


def quantize(img, palette):
    """Snap every pixel to the nearest palette color; alpha <128 -> clear."""
    img = img.convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (0, 0, 0, 0) if a < 128 else (*_nearest((r, g, b), palette), 255)
    return img


def add_outline(img, hex_color=OUTLINE_HEX, passes=2):
    """Grow a `passes`-px dark outline around the opaque silhouette."""
    color = tuple(int(hex_color[i : i + 2], 16) for i in (1, 3, 5)) + (255,)
    img = img.copy()
    for _ in range(passes):
        src = img.load()
        targets = []
        for y in range(img.height):
            for x in range(img.width):
                if src[x, y][3] != 0:
                    continue
                hit = any(
                    0 <= x + dx < img.width
                    and 0 <= y + dy < img.height
                    and src[x + dx, y + dy][3] == 255
                    for dy in (-1, 0, 1)
                    for dx in (-1, 0, 1)
                )
                if hit:
                    targets.append((x, y))
        dst = img.load()
        for x, y in targets:
            dst[x, y] = color
    return img


def to_one_bit(img, threshold=110):
    """Quantize to pure B&W by luminance threshold. No dithering, ever."""
    img = img.convert('RGBA')
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (255, 255, 255, 255)  # e-ink paper
            else:
                lum = (299 * r + 587 * g + 114 * b) // 1000
                v = 255 if lum >= threshold else 0
                px[x, y] = (v, v, v, 255)
    return img


def process(input_path, grid_w, grid_h, frames=1, outline=False,
            one_bit=False, threshold=110):
    """Run the full pipeline and return the upscaled output image."""
    img = Image.open(input_path).convert('RGBA')
    strip_w = grid_w * frames
    if img.size != (strip_w, grid_h):
        img = img.resize((strip_w, grid_h), Image.LANCZOS)
    if one_bit:
        img = to_one_bit(img, threshold)
    else:
        img = quantize(img, load_palette())
        if outline:
            img = add_outline(img)
    return img.resize((strip_w * UPSCALE, grid_h * UPSCALE), Image.NEAREST)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('input')
    ap.add_argument('--name', required=True)
    ap.add_argument('--section', required=True, choices=sorted(SECTION_DIRS))
    ap.add_argument('--grid', required=True, help='WxH of one frame, e.g. 64x64')
    ap.add_argument('--frames', type=int, default=1)
    ap.add_argument('--outline', action='store_true')
    ap.add_argument('--one-bit', action='store_true')
    ap.add_argument('--threshold', type=int, default=110)
    args = ap.parse_args()

    grid_w, grid_h = (int(v) for v in args.grid.lower().split('x'))
    out_img = process(args.input, grid_w, grid_h, args.frames,
                      args.outline, args.one_bit, args.threshold)

    rel_dir = SECTION_DIRS[args.section]
    out_dir = os.path.join(manifest_lib.REPO_ROOT, 'assets', rel_dir)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f'{args.name}.png')
    out_img.save(out_path)

    manifest_lib.update(args.section, args.name, {
        'path': f'{rel_dir}/{args.name}.png'.replace(os.sep, '/'),
        'width': out_img.width,
        'height': out_img.height,
        'frames': args.frames,
        'frameWidth': grid_w * UPSCALE,
        'frameHeight': grid_h * UPSCALE,
    })
    print(f'{out_path} {out_img.width}x{out_img.height} ({args.frames}f)')


if __name__ == '__main__':
    main()
