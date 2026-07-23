"""Hearts (16x16), 1-bit hearts (16x16) and mosaic tiles (8x8).

Run from repo root:  python3 tools/art/hearts.py
"""

from canvas import Canvas
from colors import K, W, R1, R2, G1, G2, GY0, GY1, GY2
from drawutil import dilate, save

OUT = 'assets/_src/icons'

# Interior spans of the 14-wide heart silhouette (rows 2..13).
HEART_SPANS = {
    2: [(3, 5), (10, 12)],
    3: [(2, 6), (9, 13)],
    4: [(1, 6), (9, 14)],
    5: [(1, 14)],
    6: [(1, 14)],
    7: [(1, 14)],
    8: [(2, 13)],
    9: [(3, 12)],
    10: [(4, 11)],
    11: [(5, 10)],
    12: [(6, 9)],
    13: [(7, 8)],
}

SHINE = {(3, 3), (4, 3), (2, 4), (3, 4)}  # top-left lobe highlight


def heart_mask():
    pts = set()
    for y, spans in HEART_SPANS.items():
        for a, b in spans:
            for x in range(a, b + 1):
                pts.add((x, y))
    return pts


def make_heart(fill_fn):
    c = Canvas(16, 16)
    mask = heart_mask()
    for x, y in dilate(mask):
        c.set(x, y, K)
    for x, y in mask:
        c.set(x, y, fill_fn(x, y))
    return c


def heart_full():
    return make_heart(lambda x, y: R2 if (x, y) in SHINE else R1)


def heart_empty():
    return make_heart(lambda x, y: GY0)


def heart_armor():
    rivet_hi = {(7, 6), (8, 6)}
    rivet_lo = {(7, 7), (8, 7)}
    shade = {(13, 5), (13, 6), (13, 7), (12, 8), (7, 12), (8, 12)}

    def fill(x, y):
        p = (x, y)
        if p in SHINE:
            return GY2
        if p in rivet_hi:
            return G2
        if p in rivet_lo:
            return G1
        if p in shade:
            return GY0
        return GY1

    return make_heart(fill)


def bit_heart_full():
    # Solid black heart (1-bit: only K and W are drawn).
    return make_heart(lambda x, y: K)


def bit_heart_empty():
    # Black outline, white interior.
    return make_heart(lambda x, y: W)


def tile_gold():
    c = Canvas(8, 8)
    c.rect(0, 0, 7, 7, G2)
    for x, y in ((6, 7), (7, 6), (7, 7), (5, 7), (7, 5)):
        c.set(x, y, G1)
    c.set(1, 1, W)
    return c


def tile_gray():
    c = Canvas(8, 8)
    c.rect(0, 0, 7, 7, GY1)
    for x, y in ((6, 7), (7, 6), (7, 7), (5, 7), (7, 5)):
        c.set(x, y, GY0)
    return c


def tile_black():
    c = Canvas(8, 8)
    c.rect(0, 0, 7, 7, K)
    for x, y in ((2, 2), (5, 3), (3, 5), (6, 6)):
        c.set(x, y, GY0)
    return c


if __name__ == '__main__':
    save(heart_full(), f'{OUT}/heart_full.png')
    save(heart_empty(), f'{OUT}/heart_empty.png')
    save(heart_armor(), f'{OUT}/heart_armor.png')
    save(bit_heart_full(), f'{OUT}/1bit_heart_full.png')
    save(bit_heart_empty(), f'{OUT}/1bit_heart_empty.png')
    save(tile_gold(), f'{OUT}/tile_gold.png')
    save(tile_gray(), f'{OUT}/tile_gray.png')
    save(tile_black(), f'{OUT}/tile_black.png')
