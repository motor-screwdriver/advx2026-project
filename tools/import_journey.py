#!/usr/bin/env python3
"""Import the night-journey (carousel) art set into the asset manifest.

Sources are the artist drops in `FOR_DEV/carousel` and `FOR_DEV/sprites`:
the static night sky, the seamless 5-tile forest strip that scrolls past the
sleeping hero, the top/bottom HUD panels, the dock button sprites
(normal + pressed) and the 7-state XP bar fills.

Processing:
  * everything is downscaled x0.5 (LANCZOS), except the forest strip which is
    fitted to 4000x800 so the whole loop stays under common 4096px GPU
    texture limits;
  * the XP bar sprites ship with dead margins around the gold rails — they
    get cropped to the rail bbox so the UI can overlay them 1:1 onto the
    baked groove of `hud_top`;
  * the gold SLEEP plate is also exported as a *blank* plate
    (`plate` / `plate_pressed`): the engraved "SLEEP" is masked (dark
    engraving + bright bevel, dilated) and inpainted row-by-row so the night
    dock can draw its own "WAKE UP" label with the game font.

Everything lands in `assets/journey/gen/` and is registered in the `journey`
section of `assets/manifest.data.json`; `assets/manifest.ts` is regenerated.

Run: python3 tools/import_journey.py
"""

import os

import numpy as np
from PIL import Image, ImageFilter

import manifest_lib

CAROUSEL_DIR = os.path.join(manifest_lib.REPO_ROOT, 'FOR_DEV', 'carousel')
SPRITES_DIR = os.path.join(manifest_lib.REPO_ROOT, 'FOR_DEV', 'sprites')
GEN_DIR = os.path.join(manifest_lib.REPO_ROOT, 'assets', 'journey', 'gen')

SCALE = 0.5
# 10350x2070 strip -> 4000x800: same 5:1 ratio, safe texture width.
STRIP_SIZE = (4000, 800)

# "SLEEP" engraving window on the 910x570 plate, fractions of the sprite box.
# Kept off the border bevel and corner rivets so inpainting never eats them.
PLATE_TEXT_BOX = (0.10, 0.28, 0.90, 0.78)
# Engraving detection, relative to the median plate luminance: the sunken
# glyph body is dark, its top bevel catches light — both must go.
PLATE_DARK_CUTOFF = 0.80
PLATE_BRIGHT_CUTOFF = 1.22
# MaxFilter kernel that swallows the leftover glyph halo (must be odd).
PLATE_MASK_DILATE_PX = 15


def save_entry(data, name, image, filename=None):
    filename = filename or f'{name}.png'
    os.makedirs(GEN_DIR, exist_ok=True)
    image.save(os.path.join(GEN_DIR, filename), optimize=True)
    manifest_lib.add_entry(data, 'journey', name, {
        'path': f'journey/gen/{filename}',
        'width': image.width,
        'height': image.height,
        'frames': 1,
        'frameWidth': image.width,
        'frameHeight': image.height,
    })
    print(f'  {name}: {image.width}x{image.height}')


def halve(image):
    size = (round(image.width * SCALE), round(image.height * SCALE))
    return image.resize(size, Image.LANCZOS)


def load(directory, filename, mode):
    return Image.open(os.path.join(directory, filename)).convert(mode)


def erase_plate_text(plate):
    """Return the plate with the engraved label inpainted away.

    The mask combines the dark glyph body and its bright bevel highlight
    (thresholds relative to the median plate luminance, so the darker
    pressed variant works too), dilated to catch the anti-aliased halo.
    Fill is per-row linear interpolation between the untouched pixels left
    and right of each masked span — it follows the horizontal brushed-gold
    gradient, so no flat patches or vertical streaks.
    """
    rgba = np.asarray(plate).astype(float)
    lum = rgba[..., :3] @ np.array([0.299, 0.587, 0.114])
    height, width = lum.shape

    x0, y0, x1, y1 = PLATE_TEXT_BOX
    box = (int(width * x0), int(height * y0), int(width * x1), int(height * y1))
    window = np.zeros_like(lum, dtype=bool)
    window[box[1]:box[3], box[0]:box[2]] = True

    median = np.median(lum[window])
    glyphs = (lum < median * PLATE_DARK_CUTOFF) | (lum > median * PLATE_BRIGHT_CUTOFF)
    mask_img = Image.fromarray(((glyphs & window) * 255).astype(np.uint8))
    mask = np.asarray(mask_img.filter(ImageFilter.MaxFilter(PLATE_MASK_DILATE_PX))) > 0
    mask &= window

    out = rgba.copy()
    for y in range(box[1], box[3]):
        row_mask = mask[y]
        if not row_mask.any():
            continue
        xs = np.where(row_mask)[0]
        spans = np.split(xs, np.where(np.diff(xs) > 1)[0] + 1)
        for span in spans:
            left = max(span[0] - 1, 0)
            right = min(span[-1] + 1, width - 1)
            t = (span - left) / max(right - left, 1)
            out[y, span, :3] = (
                out[y, left, :3][None, :] * (1 - t[:, None])
                + out[y, right, :3][None, :] * t[:, None]
            )
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def import_backdrop(data):
    save_entry(data, 'sky', halve(load(CAROUSEL_DIR, 'background.png', 'RGB')))
    strip = load(CAROUSEL_DIR, 'carousel_final_1-2-8-4-5.png', 'RGBA')
    save_entry(data, 'forest_strip', strip.resize(STRIP_SIZE, Image.LANCZOS))


def import_hud_panels(data):
    save_entry(data, 'hud_top', halve(load(CAROUSEL_DIR, 'hud_top.png', 'RGB')))
    save_entry(data, 'hud_bottom', halve(load(CAROUSEL_DIR, 'hud_bottom.png', 'RGB')))


def import_dock_buttons(data):
    for state in ('normal', 'pressed'):
        suffix = '' if state == 'normal' else '_pressed'
        for slot in ('bag', 'settings'):
            image = load(SPRITES_DIR, f'btn_{slot}_{state}.png', 'RGBA')
            save_entry(data, f'btn_{slot}{suffix}', halve(image))
        plate = load(SPRITES_DIR, f'btn_sleep_{state}.png', 'RGBA')
        save_entry(data, f'plate{suffix}', halve(erase_plate_text(plate)))


def xp_rail_bbox(image):
    """Bbox of the gold rails, so the crop drops the sprite's dead margins."""
    rgb = np.asarray(image).astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    gold = (r > 140) & (g > 90) & (b < 110) & (r > b + 60)
    ys, xs = np.where(gold)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def import_xp_bars(data):
    # One shared bbox keeps all 7 fills pixel-aligned with each other.
    images = [load(SPRITES_DIR, f'xp_bar_{i}-7.png', 'RGB') for i in range(1, 8)]
    boxes = [xp_rail_bbox(image) for image in images]
    box = (
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    )
    for i, image in enumerate(images, start=1):
        save_entry(data, f'xp_bar_{i}', halve(image.crop(box)))


def main():
    data = manifest_lib.load_data()
    data['journey'] = {}
    import_backdrop(data)
    import_hud_panels(data)
    import_dock_buttons(data)
    import_xp_bars(data)
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    print(f'imported {len(data["journey"])} journey assets')


if __name__ == '__main__':
    main()
