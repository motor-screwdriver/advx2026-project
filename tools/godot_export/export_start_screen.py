"""Export the start screen (awake home) as background + overlay sprites.

Sources: docs/start_screen/book_1..4.png (2160x3840) and the *_pressed
plaque crops. The art is authored on a 144x256 pixel grid (1 authored px ==
15 source px, verified by tools/start_screen.py) — so a BOX downscale to
the grid IS the lossless native resolution for pixel art; Godot scales it
back up with nearest-neighbour filtering.

Output (godot_assets/start_screen/):
  * background.png       — 144x256, the full authored screen (resting
                           plaques and empty HP strip baked in);
  * candle.png (+.tres)  — the flame, the only animated region across the
                           4 source frames, as a 4-frame strip with its
                           position on the background in the meta;
  * *_pressed.png        — plaque pressed-state overlays, sized/positioned
                           to drop exactly over their baked resting art.

Run: python3 tools/godot_export/export_start_screen.py  (or export_all.py)
"""

import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from godot_export import core  # noqa: E402

SRC_DIR = os.path.join(core.REPO_ROOT, 'docs', 'start_screen')

CELL = 15  # source px per authored pixel (2160/144, 3840/256)
FRAME_COUNT = 4
CANDLE_FPS = 4  # gentle flame flicker

# Candle flame patch and plaque rects in source px (from tools/start_screen.py).
CANDLE = (60, 375, 300, 495)
BUTTONS = {
    'sleep': (188, 2608, 1785, 489),
    'mosaic': (95, 3175, 633, 511),
    'bag': (772, 3182, 624, 507),
    'settings': (1446, 3176, 616, 510),
}


def open_source(stem):
    """Designer exported some plaques as png, some as jpg."""
    for ext in ('png', 'jpg'):
        path = os.path.join(SRC_DIR, f'{stem}.{ext}')
        if os.path.exists(path):
            return Image.open(path).convert('RGB')
    raise FileNotFoundError(stem)


def to_grid(img, cells_w, cells_h):
    """Collapse source art to its authored pixel grid (lossless for this set)."""
    return img.resize((cells_w, cells_h), Image.BOX)


def grid_box(x, y, w, h):
    return (round(x / CELL), round(y / CELL), round(w / CELL), round(h / CELL))


def run():
    print('-- start screen')
    frames = [open_source(f'book_{i}') for i in range(1, FRAME_COUNT + 1)]
    base = frames[0]
    core.save_static(
        'start_screen', 'start_screen', 'background',
        to_grid(base, base.width // CELL, base.height // CELL), 'background',
        meta={'source_cell': CELL, 'note': 'authored pixel grid — scale with nearest'},
    )

    x, y, w, h = CANDLE
    gx, gy, gw, gh = grid_box(x, y, w, h)
    candle_frames = [to_grid(f.crop((x, y, x + w, y + h)), gw, gh) for f in frames]
    core.save_animation(
        'start_screen', 'start_screen', 'candle', candle_frames, CANDLE_FPS,
        meta={'position': [gx, gy]},
    )

    # Pressed art re-fitted to its resting rect: the overlay lands exactly on
    # the plaque baked into the background (resting state comes for free).
    for name, (bx, by, bw, bh) in BUTTONS.items():
        gbx, gby, gbw, gbh = grid_box(bx, by, bw, bh)
        art = to_grid(open_source(f'{name}_pressed'), gbw, gbh)
        core.save_static(
            'start_screen', 'start_screen', f'{name}_pressed', art,
            meta={'position': [gbx, gby], 'note': 'overlay while the plaque is held'},
        )


if __name__ == '__main__':
    run()
    core.write_manifest()
