#!/usr/bin/env python3
"""One-off slicer: cut onboarding sprites from the design prototype (photo 2)
and the sprite catalog sheet (photo 3). Outputs land in
docs/images_full/8bit-sleep-спрайты/01-онбординг/ and are then imported by
tools/import_design_sprites.py.
"""
import os
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "docs", "images_full", "8bit-sleep-спрайты", "01-онбординг")
CATALOG = os.path.join(ROOT, "docs", "images_full", "onboarding-каталог-крутилок.png")
PROTO = os.path.join(ROOT, "docs", "images_full", "8bit-sleep-прототипы", "01-онбординг.png")


def dist(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def corner_bg(im):
    px = im.load()
    w, h = im.size
    pts = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    return tuple(sum(p[i] for p in pts) // 4 for i in range(3))


def trim_to_content(im, tol=28):
    rgb = im.convert("RGB")
    bg = corner_bg(rgb)
    px = rgb.load()
    w, h = rgb.size
    xs, ys = [], []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if dist(px[x, y], bg) > tol:
                xs.append(x)
                ys.append(y)
    if not xs:
        return rgb
    box = (max(min(xs) - 1, 0), max(min(ys) - 1, 0), min(max(xs) + 3, w), min(max(ys) + 3, h))
    return rgb.crop(box)


def flood_alpha(im, tol=34):
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


def save(im, name):
    path = os.path.join(DIR, name)
    im.save(path)
    print(name, im.size, im.mode)


def interior_geometry(im):
    """Dark opening inside the window frame, as relative fractions."""
    rgb = im.convert("RGB")
    px = rgb.load()
    w, h = rgb.size

    def dark(p):
        return p[0] < 24 and p[1] < 19 and p[2] < 15

    rows = []
    for y in range(h):
        n = sum(1 for x in range(int(w * 0.15), int(w * 0.85)) if dark(px[x, y]))
        rows.append(n / (w * 0.7))
    cols = []
    for x in range(w):
        n = sum(1 for y in range(int(h * 0.3), int(h * 0.95)) if dark(px[x, y]))
        cols.append(n / (h * 0.65))
    ys = [y for y in range(h) if rows[y] > 0.55]
    xs = [x for x in range(w) if cols[x] > 0.55]
    return (min(xs) / w, max(xs) / w, min(ys) / h, max(ys) / h)


def main():
    cat = Image.open(CATALOG)
    proto = Image.open(PROTO)

    # --- wheel windows (tab plaque included), opaque; from the catalog ---
    win_bed = trim_to_content(cat.crop((360, 340, 700, 748)))
    win_wake = trim_to_content(cat.crop((1030, 340, 1380, 748)))
    save(win_bed, "12-picker-window-bedtime.png")
    save(win_wake, "13-picker-window-wakeup.png")

    # --- gold side arrow for the selection band (opaque, sits on dark bg) ---
    save(cat.crop((75, 922, 107, 962)), "14-selection-arrow.png")

    # --- logo (text + stars + moon), alpha-keyed, from the prototype ---
    logo = trim_to_content(proto.crop((200, 100, 2050, 820)), tol=24)
    save(flood_alpha(logo, tol=30), "15-logo-text.png")

    # --- rules panel: tight opaque card, from the prototype ---
    panel = trim_to_content(proto.crop((140, 790, 2030, 1850)), tol=24)
    save(panel, "16-panel-rules-card.png")

    # --- BEGIN button plaque: tight crop, corners keyed ---
    btn = trim_to_content(proto.crop((280, 3130, 1900, 3620)), tol=24)
    save(flood_alpha(btn, tol=26), "17-button-begin-plaque.png")

    # --- "MIN 7 HOURS" caption: alpha-keyed text line ---
    cap = trim_to_content(proto.crop((600, 3620, 1560, 3720)), tol=20)
    save(flood_alpha(cap, tol=26), "18-caption-min-hours.png")

    for name, im in (("bed", win_bed), ("wake", win_wake)):
        x0, x1, y0, y1 = interior_geometry(im)
        print(f"interior {name}: x {x0:.3f}..{x1:.3f} y {y0:.3f}..{y1:.3f} size={im.size}")

    print("proto bg:", corner_bg(proto.convert("RGB")))


if __name__ == "__main__":
    main()
