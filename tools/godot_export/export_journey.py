"""Export the night-journey art set from git history at full resolution.

The raw artist drop (`FOR_DEV/`) was deleted from the working tree, but the
files live on in commit 250c777 — everything here is read straight from
that commit, byte-exact, and exported without the x0.5 downscale the RN
pipeline applied.

Output (godot_assets/journey/):
  * sky.png                  — night-sky backdrop, cropped to the horizon
                               band; the wasted 3/4 of flat gradient below
                               is dropped and reproduced in-engine from the
                               `gradient` fill colors in the meta;
  * tiles/tile_01..05.png    — only the 5 forest tiles the carousel actually
                               loops (1,2,8,4,5), with the baked «AI生成»
                               watermark scrubbed off each;
  * hud_top / hud_bottom     — panel art with pixel anchor boxes in the meta;
  * plate / plate_pressed    — the gold plate (SLEEP engraving inpainted away)
                               cut from the hud_bottom slot, so any label can
                               be typeset over it;
  * btn_* normal/pressed     — dock buttons cut from the opaque hud_bottom
                               slots (the loose FOR_DEV sprites had ragged
                               transparent edges); the pressed art is alpha-
                               composited into the same slot, so every button
                               is a clean, fully opaque, slot-sized tile;
  * xp_bar strip             — the 7 fill states as one strip + .tres.

Run: python3 tools/godot_export/export_journey.py  (or export_all.py)
"""

import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from godot_export import core  # noqa: E402
from import_journey import erase_plate_text, xp_rail_bbox  # noqa: E402

COMMIT = '250c777'
CAROUSEL = 'FOR_DEV/carousel'
SPRITES = 'FOR_DEV/sprites'

# The RN carousel loops these tiles, 10 s per tile (journeyLayout/JourneyScreen).
# Tiles 3, 6, 7 are never shown — they are not exported.
TILE_ORDER = [1, 2, 8, 4, 5]
TILE_SECONDS = 10

# The AI-generation watermark sits in this fixed box (px, on the 1024² tiles).
WATERMARK_BOX = (0, 948, 135, 1012)

# The sky is 2160x2070 but only the top band carries detail; below the horizon
# it is a flat vertical gradient. Keep the band, drop the rest.
SKY_CROP_H = 640

# Pixel anchor boxes on the panels (from src/ui/journey/journeyLayout.ts,
# fractions x panel size 2160x820 / 2160x950).
TOP_ANCHORS = {
    'hearts': [151, 90, 1858, 340],
    'level_badge': [150, 454, 493, 255],
    'xp_groove': [930, 529, 1080, 121],
}
DOCK_ANCHORS = {
    'plate': [136, 204, 910, 570],
    'bag': [1152, 260, 455, 490],
    'settings': [1616, 264, 460, 480],
}


def git(path, mode='RGBA'):
    return core.load_git_image(COMMIT, path, mode)


def strip_watermark(tile):
    """Scrub the «AI生成» watermark out of a forest tile.

    Where the tile is transparent behind the mark (tiles 01/04/08) only the
    grayish text pixels are erased — zeroing the whole box would also wipe
    the faint atmospheric haze and leave a visible rectangle; where it sits
    over opaque ground (tiles 02/05) the box is repainted from the ground
    immediately to its right — same rows, so the grass/soil bands stay
    aligned (copying from above would duplicate the grass edge).
    """
    x0, y0, x1, y1 = WATERMARK_BOX
    arr = np.asarray(tile.convert('RGBA')).copy()
    region = arr[y0:y1, x0:x1]
    if (region[..., 3] > 128).mean() < 0.2:
        rgb = region[..., :3].astype(int)
        text = ((region[..., 3] > 0)
                & (rgb.max(axis=2) - rgb.min(axis=2) < 30)
                & (rgb.min(axis=2) > 60))
        region[text, 3] = 0  # kill just the gray glyphs, keep the haze
    else:
        bw = x1 - x0
        arr[y0:y1, x0:x1] = arr[y0:y1, x1:x1 + bw]  # patch from the right, same rows
    return Image.fromarray(arr)


def export_backdrop():
    sky = git(f'{CAROUSEL}/background.png', 'RGB')
    cropped = sky.crop((0, 0, sky.width, SKY_CROP_H))
    top = tuple(int(v) for v in np.asarray(sky)[SKY_CROP_H - 1].mean(0).round())
    bottom = tuple(int(v) for v in np.asarray(sky)[-1].mean(0).round())
    core.save_static(
        'journey', 'journey', 'sky', cropped, 'background',
        meta={'full_height': sky.height,
              'note': 'below the crop, fill with a vertical gradient',
              'gradient': {'from': list(top), 'to': list(bottom)}},
    )
    for i in TILE_ORDER:
        tile = strip_watermark(git(f'{CAROUSEL}/forest_frame_{i:02d}.png'))
        core.save_static(
            'journey', 'journey/tiles', f'tile_{i:02d}', tile,
            meta={'loop_order': TILE_ORDER, 'seconds_per_tile': TILE_SECONDS},
        )


def export_hud():
    core.save_static('journey', 'journey', 'hud_top',
                     git(f'{CAROUSEL}/hud_top.png', 'RGB'),
                     meta={'anchors': TOP_ANCHORS})
    core.save_static('journey', 'journey', 'hud_bottom',
                     git(f'{CAROUSEL}/hud_bottom.png', 'RGB'),
                     meta={'anchors': DOCK_ANCHORS})


def _slot(hud, slot):
    x, y, w, h = DOCK_ANCHORS[slot]
    return hud.crop((x, y, x + w, y + h)).convert('RGBA')


def _press_into_slot(slot_img, sprite):
    """Overlay the pressed sprite onto the opaque slot (holes stay filled)."""
    out = slot_img.copy()
    out.alpha_composite(sprite)
    return out


def export_buttons():
    hud = git(f'{CAROUSEL}/hud_bottom.png', 'RGBA')
    slot_meta = {'note': 'opaque dock button, slot-sized — drop straight into the dock'}
    for slot, src in (('bag', 'btn_bag'), ('settings', 'btn_settings')):
        base = _slot(hud, slot)
        core.save_static('journey', 'journey', f'btn_{slot}', base, meta=slot_meta)
        pressed = _press_into_slot(base, git(f'{SPRITES}/{src}_pressed.png'))
        core.save_static('journey', 'journey', f'btn_{slot}_pressed', pressed, meta=slot_meta)

    plate_slot = _slot(hud, 'plate')
    plate = erase_plate_text(plate_slot)
    core.save_static('journey', 'journey', 'plate', plate,
                     meta={'note': 'blank gold plate — typeset the label on top'})
    pressed_slot = _press_into_slot(plate_slot, git(f'{SPRITES}/btn_sleep_pressed.png'))
    core.save_static('journey', 'journey', 'plate_pressed', erase_plate_text(pressed_slot),
                     meta={'note': 'blank gold plate (pressed) — typeset the label on top'})


def export_xp_bar():
    # One shared bbox keeps all 7 fills pixel-aligned; ship them as a strip.
    images = [git(f'{SPRITES}/xp_bar_{i}-7.png', 'RGB') for i in range(1, 8)]
    boxes = [xp_rail_bbox(image) for image in images]
    box = (
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    )
    frames = [image.crop(box) for image in images]
    core.save_animation(
        'journey', 'journey', 'xp_bar', frames, fps=0, loop=False,
        meta={'note': 'fill states 1/7..7/7 — pick the frame by XP progress'},
    )


def run():
    print('-- journey (git ' + COMMIT + ')')
    export_backdrop()
    export_hud()
    export_buttons()
    export_xp_bar()


if __name__ == '__main__':
    run()
    core.write_manifest()
