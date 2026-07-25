#!/usr/bin/env python3
"""Publish the bag redesign sprites (desired mockup, photo 1).

Source: assets/design/bag/*.png — the designer's raw crops, tracked in-repo.
Output: assets/design/bag/gen/*.png — runtime sprites, registered in the
manifest as DESIGN.bag_* (design section).

The runtime keeps THREE equip slots (armor/utilities/charm), so instead of
publishing the two authored slots verbatim we publish one reusable empty slot
and one blank-interior slot frame; labels, consumable rows and counts are
rendered live by InventoryScreen (row icons reuse the transparent ICONS.art_*
game sprites) so state changes never go stale.

Rectangular sprites (slots, panel, button) are published opaque — the crops
are already tight and the page background matches the dark tavern backdrop,
so alpha keying would only eat the artwork. Only the BAG title is keyed.

Idempotent: safe to re-run, files and manifest entries are overwritten.
"""
import os
import sys
from collections import deque

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
SRC = os.path.join(ROOT, "assets", "design", "bag")
OUT = os.path.join(SRC, "gen")

PUBLISHED = []


def dist(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def corner_bg(im):
    px = im.load()
    w, h = im.size
    pts = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    return tuple(sum(p[i] for p in pts) // 4 for i in range(3))


def trim_to_content(im, tol=24):
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


def flood_alpha(im, tol=28):
    """Key the surrounding background transparent via flood fill from edges."""
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


def median_color(rgb, points):
    samples = [rgb.getpixel(p) for p in points]
    return tuple(sorted(c[i] for c in samples)[len(samples) // 2] for i in range(3))


def publish(im, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.png")
    im.save(path, optimize=True)
    manifest_lib.update(
        "design",
        f"bag_{name}",
        {
            "path": f"design/bag/gen/{name}.png",
            "width": im.width,
            "height": im.height,
            "frames": 1,
            "frameWidth": im.width,
            "frameHeight": im.height,
        },
    )
    PUBLISHED.append(f"bag_{name}")
    kb = os.path.getsize(path) // 1024
    print(f"registered design.bag_{name} ({im.width}x{im.height}, {kb} KB)")


def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGB")


def prune_stale():
    """Drop bag_* manifest entries (and files) not published by this run."""
    data = manifest_lib.load_data()
    stale = [k for k in data.get("design", {}) if k.startswith("bag_") and k not in PUBLISHED]
    for k in stale:
        entry = data["design"].pop(k)
        path = os.path.join(ROOT, "assets", entry["path"])
        if os.path.exists(path):
            os.remove(path)
        print(f"pruned design.{k}")
    if stale:
        manifest_lib.save_data(data)
        manifest_lib.write_manifest_ts(data)


def main():
    # --- BAG title: gold letters keyed off the dark page background ---
    publish(flood_alpha(trim_to_content(src("01-заголовок-bag.png"))), "title")

    # --- CLOSE button: tight rectangular crop, published as-is ---
    publish(src("15-кнопка-close.png"), "button_close")

    # --- slots: one empty (dashed + plus baked) and one blank interior ---
    empty = src("05-слот-пустой.png")
    publish(empty, "slot_empty")

    w, h = empty.size
    # well color sampled between the dashed border and the plus glyph
    well = median_color(
        empty,
        [(int(w * fx), int(h * fy)) for fx, fy in ((0.3, 0.3), (0.7, 0.3), (0.3, 0.7), (0.7, 0.7))],
    )
    frame = empty.copy()
    fpx = frame.load()
    for y in range(int(h * 0.10), int(h * 0.90)):
        for x in range(int(w * 0.10), int(w * 0.90)):
            fpx[x, y] = well
    publish(frame, "slot_frame")

    # --- consumables panel: keep frame + ribbon plank + rows box border,
    # blank the baked CONSUMABLES ribbon text (title is rendered live per
    # selected category) and the box interior so live rows can be composed.
    # Measured on the 1920x1540 crop: ribbon text x 545-1361, y 90-180;
    # box border x 72-87/1825-1839, y 219-235/1482.
    panel = src("07-панель-consumables.png")
    pw, ph = panel.size
    ppx = panel.load()
    plank = median_color(panel, [(x, 130) for x in (420, 470, 1500, 1560)])
    for y in range(int(ph * 0.045), int(ph * 0.134)):
        for x in range(int(pw * 0.267), int(pw * 0.728)):
            ppx[x, y] = plank
    bx0, bx1 = int(pw * 0.046), int(pw * 0.950)
    by0, by1 = int(ph * 0.154), int(ph * 0.962)
    # wood fill = median over a coarse grid inside the box (text/icons are
    # a minority of samples, so the median lands on the plank tone)
    grid = [(x, y) for y in range(by0 + 20, by1 - 20, 60) for x in range(bx0 + 20, bx1 - 20, 60)]
    wood = median_color(panel, grid)
    for y in range(by0, by1):
        for x in range(bx0, bx1):
            ppx[x, y] = wood
    publish(panel, "panel_consumables")

    prune_stale()


if __name__ == "__main__":
    main()
