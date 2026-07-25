#!/usr/bin/env python3
"""One-off slicer: cut chest-screen sprites from the three catalog sheets in
docs/chests/ (24 weekly chest, 25 loot reveal, 26 lucky-coin variant).
Outputs land in docs/images_full/8bit-sleep-спрайты/09-сундук/ and are then
imported by tools/import_design_sprites.py.
"""
import os
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "chests")
DIR = os.path.join(ROOT, "docs", "images_full", "8bit-sleep-спрайты", "09-сундук")

# Sheet cell grid (2028x2178 sheets, 3x3 cells, measured on the renders).
COLS = [(11, 654), (675, 1318), (1340, 1983)]
ROWS = [(87, 741), (774, 1427), (1449, 2103)]


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


def cell(sheet, col, row):
    x0, x1 = COLS[col - 1]
    y0, y1 = ROWS[row - 1]
    return sheet.crop((x0, y0, x1, y1))


def main():
    weekly = Image.open(os.path.join(SRC, "_страница-спрайтов.png"))
    loot = Image.open(os.path.join(SRC, "_страница-спрайтов (2).png"))
    lucky = Image.open(os.path.join(SRC, "_страница-спрайтов (1).png"))
    print("sheet bg:", corner_bg(weekly.convert("RGB")))

    # --- 24 weekly chest ---
    save(flood_alpha(trim_to_content(cell(weekly, 1, 1))), "20-title-weekly-chest.png")
    save(flood_alpha(trim_to_content(cell(weekly, 2, 1))), "21-plaque-ready.png")
    save(trim_to_content(cell(weekly, 3, 1)), "22-chest-steel.png")
    save(trim_to_content(cell(weekly, 1, 2)), "23-candle-l.png")
    save(trim_to_content(cell(weekly, 2, 2)), "24-candle-r.png")
    save(flood_alpha(trim_to_content(cell(weekly, 3, 2))), "25-button-open.png")

    # --- 25 loot reveal ---
    save(flood_alpha(trim_to_content(cell(loot, 1, 1))), "26-title-weekly-loot.png")
    card = trim_to_content(cell(loot, 2, 1))
    # Blank the card interior (baked example icon + text) with sampled wood;
    # keep the gold frame so live loot can be composed inside.
    cw, ch = card.size
    rgb = card.convert("RGB")
    samples = [rgb.getpixel((int(cw * 0.16), int(ch * f))) for f in (0.35, 0.5, 0.65, 0.8)]
    wood = tuple(sorted(c[i] for c in samples)[len(samples) // 2] for i in range(3))
    sheet_bg = (24, 17, 12)
    # find the card's top frame edge on the left side (away from the ribbon)
    frame_top = 0
    for y in range(ch):
        r, g, b = rgb.getpixel((int(cw * 0.06), y))
        if r > 90 and g > 60:
            frame_top = y
            break
    blank = rgb.copy()
    bpx = blank.load()
    mx, my = int(cw * 0.085), int(ch * 0.075)
    for y in range(my, ch - my):
        for x in range(mx, cw - mx):
            bpx[x, y] = wood
    # erase the baked RARE ribbon: bg above the frame, wood inside it
    for y in range(0, frame_top + int(ch * 0.13)):
        for x in range(int(cw * 0.20), int(cw * 0.80)):
            bpx[x, y] = sheet_bg if y < frame_top else wood
    save(blank, "28-card-frame.png")
    save(flood_alpha(trim_to_content(cell(loot, 3, 1))), "27-ribbon-rare.png")
    glow = flood_alpha(trim_to_content(cell(loot, 2, 2)), tol=30)
    gw, gh = glow.size
    gpx = glow.load()
    fx, fy = int(gw * 0.08), int(gh * 0.08)  # feather the edges to hide the halo box
    for y in range(gh):
        for x in range(gw):
            r, g, b, a = gpx[x, y]
            if a:
                k = min(x, gw - 1 - x, y, gh - 1 - y)
                if k < fx:
                    gpx[x, y] = (r, g, b, int(a * max(k, 0) / fx))
    save(glow, "29-chest-open-glow.png")
    save(flood_alpha(trim_to_content(cell(loot, 3, 2))), "30-button-claim.png")
    spark = loot.crop((295, 1715, 405, 1865))  # tight box around the sparkle cross
    save(flood_alpha(trim_to_content(spark), tol=16), "31-sparkle-1.png")

    # --- 26 lucky-coin variant ---
    save(flood_alpha(trim_to_content(cell(lucky, 1, 1))), "33-title-weekly-chest-gold.png")
    save(flood_alpha(trim_to_content(cell(lucky, 3, 1))), "34-chest-gold.png")
    save(flood_alpha(trim_to_content(cell(lucky, 1, 2))), "35-ribbon-lucky.png")
    save(flood_alpha(trim_to_content(lucky.crop((10, 1655, 665, 1915)))), "36-button-open-gold.png")


if __name__ == "__main__":
    main()
