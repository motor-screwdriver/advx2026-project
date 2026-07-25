#!/usr/bin/env python3
"""slice_settings_sprite.py — cut the settings screen 1:1 from the reference
sprite assets/settings/settings.png into ready-to-render UI assets.

Slices (registered in the manifest under `design` as settings_*):
  header        SETTINGS title + moons + sparkles, transparent bg
  row_window    plank with baked SLEEP WINDOW label, value area wood-cleaned
  row_blank     fully wood-cleaned plank (base for extra rows, e.g. MI FIT)
  row_notif     plank with baked NOTIFICATIONS label, toggle area wood-cleaned
  row_eink      plank with baked E-INK DEVICE + NOT LINKED (untouched)
  row_eink_off  same plank with the NOT LINKED area wood-cleaned (linked state)
  row_change    plank with baked CHANGE WINDOW + 7-DAY COOLDOWN (untouched)
  row_reset     plank with baked RESET PROGRESS (untouched)
  toggle_track  dark toggle well, knob area reconstructed by mirroring
  toggle_knob   gold ON knob, transparent outside
  toggle_knob_blank  knob with the ON letters gold-filled (for OFF overlay)
  version       VERSION 0.1.0 caption, transparent bg

Measured on the 2160x3840 sprite (probe scripts in git history).
Idempotent; reruns overwrite assets/design/settings/ and manifest entries.

Usage: python3 tools/slice_settings_sprite.py
"""

import os
import sys
from collections import deque

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
SRC = os.path.join(ROOT, "assets", "settings", "settings.png")
DST = os.path.join(ROOT, "assets", "design", "settings")

# Tight plank boxes measured on the sprite (probe: brightness > bg).
BOXES = {
    "header": (100, 280, 2060, 620),
    "row1": (66, 768, 2092, 1208),
    "row2": (66, 1296, 2092, 1740),
    "row3": (66, 1830, 2092, 2272),
    "row4": (66, 2362, 2092, 2806),
    "row5": (66, 2894, 2092, 3348),
    "version": (780, 3580, 1390, 3660),
}
# Interior areas to wood-clean, paired with a clean same-plank x-range used
# as the clone source (same y row -> horizontal grain stays continuous).
ROW1_VALUE = ((1290, 865, 1965, 1165), (1140, 1300))  # 23:30 - 07:30
# Row1 label area; cloned from the value band cleaned just before it.
ROW1_LABEL = ((210, 850, 1310, 1180), (1400, 1900))
ROW2_TOGGLE = ((1425, 1405, 1960, 1690), (1220, 1420))  # track + knob
ROW3_VALUE = ((1360, 1935, 1950, 2195), (1140, 1360))  # NOT LINKED
# Toggle parts, in sprite coords (probe 5/6 tight boxes).
TRACK = (1462, 1439, 1923, 1655)  # dark pill incl. black rim
TRACK_CAP = 188  # clean left cap width before the knob intrudes
TRACK_FLAT = (100, 180)  # flat well band inside the cap, track-local x
KNOB = (1650, 1425, 1945, 1670)  # crop window around the gold knob
KNOB_TEXT = (1730, 1490, 1858, 1596)  # ON letters inside the knob
RIM = 16  # dark rim thickness kept around the gold when masking


def dist(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def corner_bg(im):
    px = im.load()
    w, h = im.size
    pts = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    return tuple(sum(p[i] for p in pts) // 4 for i in range(3))


def flood_alpha(im, tol=26):
    """Make the sprite background transparent by flood fill from the edges."""
    rgb = im.convert("RGB")
    bg = corner_bg(rgb)
    w, h = rgb.size
    px = rgb.load()
    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            opx[x, y] = (*px[x, y], 255)
    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            continue
        seen[y][x] = True
        if dist(px[x, y], bg) > tol:
            continue
        r, g, b, _ = opx[x, y]
        opx[x, y] = (r, g, b, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return out


def wood_clean(sheet, spec):
    """Erase baked content by cloning wood from the same plank row.

    Pixels are copied from the same y at a clean x-range, ping-pong tiled
    so the horizontal grain stays continuous and seams don't repeat hard.
    """
    (x0, y0, x1, y1), (sx0, sx1) = spec
    sw = sx1 - sx0
    px = sheet.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            t = (x - x0) % (2 * sw)
            off = t if t < sw else 2 * sw - 1 - t
            px[x, y] = px[sx0 + off, y]


def rebuild_track(sheet):
    """Empty-pill track: clean left cap + tiled flat well + mirrored cap.

    The knob intrudes past the pill midpoint, so mirroring halves is not
    possible; only the first TRACK_CAP px are guaranteed knob-free."""
    track = sheet.crop(TRACK).convert("RGB")
    w, h = track.size
    cap = track.crop((0, 0, TRACK_CAP, h))
    flat = track.crop((TRACK_FLAT[0], 0, TRACK_FLAT[1], h))
    out = Image.new("RGB", (w, h))
    out.paste(cap, (0, 0))
    x = TRACK_CAP
    while x < w - TRACK_CAP:
        out.paste(flat, (x, 0))
        x += flat.width
    out.paste(cap.transpose(Image.FLIP_LEFT_RIGHT), (w - TRACK_CAP, 0))
    return flood_alpha(out, tol=34)


def is_gold(p):
    return p[0] > 170 and p[1] > 110 and p[2] < 150


def knob_mask(knob):
    """Gold pixels dilated by RIM: keeps the dark rim around the octagon
    without leaking into the pill rim it touches."""
    w, h = knob.size
    px = knob.load()
    gold = [(x, y) for y in range(h) for x in range(w) if is_gold(px[x, y])]
    mask = [[False] * w for _ in range(h)]
    for gx, gy in gold:
        for y in range(max(0, gy - RIM), min(h, gy + RIM + 1)):
            row = mask[y]
            for x in range(max(0, gx - RIM), min(w, gx + RIM + 1)):
                row[x] = True
    return mask


def knob_slices(sheet):
    knob = sheet.crop(KNOB).convert("RGB")
    mask = knob_mask(knob)
    w, h = knob.size
    kpx = knob.load()
    on = Image.new("RGBA", (w, h))
    opx = on.load()
    for y in range(h):
        for x in range(w):
            opx[x, y] = (*kpx[x, y], 255) if mask[y][x] else (0, 0, 0, 0)
    # Blank variant: fill the ON letters with the gold sampled around them.
    blank = on.copy()
    bpx = blank.load()
    tx0, ty0 = KNOB_TEXT[0] - KNOB[0], KNOB_TEXT[1] - KNOB[1]
    tx1, ty1 = KNOB_TEXT[2] - KNOB[0], KNOB_TEXT[3] - KNOB[1]
    for y in range(ty0, ty1):
        left = bpx[tx0 - 10, y]
        right = bpx[tx1 + 10, y]
        for x in range(tx0, tx1):
            t = (x - tx0) / max(tx1 - tx0 - 1, 1)
            bpx[x, y] = tuple(
                int(left[i] + (right[i] - left[i]) * t) for i in range(3)
            ) + (255,)
    return on, blank


def save(name, im):
    path = os.path.join(DST, f"{name}.png")
    im.save(path)
    print(f"{name}.png", im.size, im.mode)
    return path


def main():
    os.makedirs(DST, exist_ok=True)
    sheet = Image.open(SRC).convert("RGB")

    slices = {}
    # Transparent-bg pieces
    slices["header"] = flood_alpha(sheet.crop(BOXES["header"]))
    slices["version"] = flood_alpha(sheet.crop(BOXES["version"]))
    # Toggle parts (before the plank is wood-cleaned)
    slices["toggle_track"] = rebuild_track(sheet)
    slices["toggle_knob"], slices["toggle_knob_blank"] = knob_slices(sheet)
    # Untouched planks first (row3 baked NOT LINKED, row4, row5)
    slices["row_eink"] = flood_alpha(sheet.crop(BOXES["row3"]))
    slices["row_change"] = flood_alpha(sheet.crop(BOXES["row4"]))
    slices["row_reset"] = flood_alpha(sheet.crop(BOXES["row5"]))
    # Wood-cleaned variants
    wood_clean(sheet, ROW1_VALUE)
    slices["row_window"] = flood_alpha(sheet.crop(BOXES["row1"]))
    wood_clean(sheet, ROW1_LABEL)
    slices["row_blank"] = flood_alpha(sheet.crop(BOXES["row1"]))
    wood_clean(sheet, ROW2_TOGGLE)
    slices["row_notif"] = flood_alpha(sheet.crop(BOXES["row2"]))
    wood_clean(sheet, ROW3_VALUE)
    slices["row_eink_off"] = flood_alpha(sheet.crop(BOXES["row3"]))

    data = manifest_lib.load_data()
    data["design"] = {
        k: v for k, v in data.get("design", {}).items() if not k.startswith("settings_")
    }
    for name, im in slices.items():
        save(name, im)
        w, h = im.size
        manifest_lib.add_entry(data, "design", f"settings_{name}", {
            "path": f"design/settings/{name}.png",
            "width": w, "height": h, "frames": 1,
            "frameWidth": w, "frameHeight": h,
        })
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    print(f"sliced {len(slices)} settings assets -> {DST}")


if __name__ == "__main__":
    main()
