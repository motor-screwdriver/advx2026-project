#!/usr/bin/env python3
"""Contact sheets for visual review of the morning scenes.

Reads the 768x144 strips from assets/_src/scenes/ and writes:
  contact_all.png      — all six scenes' frame 1 stacked (x2 NEAREST)
  contact_<scene>.png  — per-scene 3-frame strip (x2 NEAREST)
Run from repo root:  python3 tools/art/scene_contact.py
"""

import os

from PIL import Image

SRC = 'assets/_src/scenes'
NAMES = ['scene_perfect', 'scene_good', 'scene_bad',
         'scene_terrible', 'scene_death', 'scene_resurrection']
GRID_W, GRID_H, FRAMES, ZOOM = 256, 144, 3, 2


def main():
    thumbs = []
    for name in NAMES:
        strip = Image.open(os.path.join(SRC, f'{name}.png'))
        assert strip.size == (GRID_W * FRAMES, GRID_H), (name, strip.size)
        frame1 = strip.crop((0, 0, GRID_W, GRID_H))
        thumbs.append(frame1.resize((GRID_W * ZOOM, GRID_H * ZOOM), Image.NEAREST))
        big = strip.resize((GRID_W * FRAMES * ZOOM, GRID_H * ZOOM), Image.NEAREST)
        big.save(os.path.join(SRC, f'contact_{name}.png'))
    sheet = Image.new('RGBA', (GRID_W * ZOOM, GRID_H * ZOOM * len(NAMES)))
    for i, im in enumerate(thumbs):
        sheet.paste(im, (0, GRID_H * ZOOM * i))
    sheet.save(os.path.join(SRC, 'contact_all.png'))
    print('contact_all.png +', len(NAMES), 'per-scene strips')


if __name__ == '__main__':
    main()
