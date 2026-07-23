#!/usr/bin/env python3
"""hero_contact.py — review contact sheets for the generated hero sprites.

Assembles (with PIL only, upscale x4 NEAREST for viewing — never shipped):
  contact_color.png  all 9 color heroes side by side on game-dark bg
  contact_gold.png   each base next to its gold skin (2 cols x 9 rows)
  contact_1bit.png   all 9 1-bit heroes on white (e-ink paper simulation)
  contact_icon.png   the 40x40 knight icon at 1x and 4x on white
  contact_grow.png   color heroes after a simulated +2px pipeline outline
                     grow (review only — verifies nothing collapses)

Run from the repo root:  python3 tools/art/hero_contact.py
"""

import os

from PIL import Image

SRC = os.path.join('assets', '_src', 'heroes')
HEROES = ['monk', 'ranger', 'druid', 'rogue', 'knight',
          'paladin', 'ninja', 'mage', 'warlock']
BG_DARK = (22, 16, 43, 255)  # BG0
PAPER = (255, 255, 255, 255)
OUTLINE = (13, 10, 26, 255)  # K
SCALE = 4
CELL = 64


def frame1(name):
    img = Image.open(os.path.join(SRC, name)).convert('RGBA')
    return img.crop((0, 0, CELL, CELL))


def sheet(cells, rows, cols, bg, path):
    w, h = cols * CELL, rows * CELL
    base = Image.new('RGBA', (w, h), bg)
    for i, img in enumerate(cells):
        base.alpha_composite(img, ((i % cols) * CELL, (i // cols) * CELL))
    base.resize((w * SCALE, h * SCALE), Image.NEAREST).save(path)
    print(path)


def grow(img, passes=2):
    """Simulate pixelate.add_outline (dilate silhouette into transparency)."""
    img = img.copy()
    for _ in range(passes):
        src = img.load()
        targets = []
        for y in range(img.height):
            for x in range(img.width):
                if src[x, y][3] != 0:
                    continue
                if any(
                    0 <= x + dx < img.width
                    and 0 <= y + dy < img.height
                    and src[x + dx, y + dy][3] == 255
                    for dy in (-1, 0, 1)
                    for dx in (-1, 0, 1)
                ):
                    targets.append((x, y))
        dst = img.load()
        for x, y in targets:
            dst[x, y] = OUTLINE
    return img


def main():
    # (a) all 9 color heroes side by side
    sheet([frame1(f'hero_{n}.png') for n in HEROES], 1, 9, BG_DARK,
          os.path.join(SRC, 'contact_color.png'))

    # (b) bases next to their gold skins
    cells = []
    for n in HEROES:
        cells.append(frame1(f'hero_{n}.png'))
        cells.append(frame1(f'hero_{n}_gold.png'))
    sheet(cells, 9, 2, BG_DARK, os.path.join(SRC, 'contact_gold.png'))

    # (c) all 9 1-bit heroes on white paper
    sheet([frame1(f'1bit_hero_{n}.png') for n in HEROES], 1, 9, PAPER,
          os.path.join(SRC, 'contact_1bit.png'))

    # (d) the knight icon at 1x and 4x on white
    icon = Image.open(os.path.join(SRC, '1bit_hero_icon_40.png')).convert('RGBA')
    big = icon.resize((160, 160), Image.NEAREST)
    card = Image.new('RGBA', (40 + 16 + 160, 160), PAPER)
    card.alpha_composite(icon, (0, 120))
    card.alpha_composite(big, (56, 0))
    card.save(os.path.join(SRC, 'contact_icon.png'))
    print(os.path.join(SRC, 'contact_icon.png'))

    # (e) grow simulation: the shipped look after the pipeline outline pass
    sheet([grow(frame1(f'hero_{n}.png')) for n in HEROES], 1, 9, BG_DARK,
          os.path.join(SRC, 'contact_grow.png'))


if __name__ == '__main__':
    main()
