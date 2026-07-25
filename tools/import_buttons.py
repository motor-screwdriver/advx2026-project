#!/usr/bin/env python3
"""Import the hand-drawn tavern button sprites into the asset manifest.

Reads the full-size PNGs the artist dropped into `assets/buttons/`, writes a
x0.5 LANCZOS copy (RGBA kept for the transparent corners) into
`assets/buttons/gen/` and registers every file in the `buttons` section of
`assets/manifest.data.json`, then regenerates `assets/manifest.ts`.

Run: python3 tools/import_buttons.py
"""

import os

from PIL import Image

import manifest_lib

SCALE = 0.5
SRC_DIR = os.path.join(manifest_lib.REPO_ROOT, 'assets', 'buttons')
GEN_DIR = os.path.join(SRC_DIR, 'gen')


def import_button(data, filename):
    src = os.path.join(SRC_DIR, filename)
    name = os.path.splitext(filename)[0]
    image = Image.open(src).convert('RGBA')
    width = round(image.width * SCALE)
    height = round(image.height * SCALE)
    image = image.resize((width, height), Image.LANCZOS)
    os.makedirs(GEN_DIR, exist_ok=True)
    image.save(os.path.join(GEN_DIR, filename), optimize=True)
    manifest_lib.add_entry(data, 'buttons', name, {
        'path': f'buttons/gen/{filename}',
        'width': width,
        'height': height,
        'frames': 1,
        'frameWidth': width,
        'frameHeight': height,
    })
    print(f'  {name}: {width}x{height}')


def main():
    data = manifest_lib.load_data()
    data['buttons'] = {}
    filenames = sorted(f for f in os.listdir(SRC_DIR) if f.endswith('.png'))
    for filename in filenames:
        import_button(data, filename)
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    print(f'imported {len(filenames)} button sprites')


if __name__ == '__main__':
    main()
