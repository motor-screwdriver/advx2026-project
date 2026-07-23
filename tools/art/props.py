"""Big props: chest (48x48 x3 frames -> 144x48 strip) and gravestone (48x48).

Run from repo root:  python3 tools/art/props.py
"""

from canvas import Canvas, hconcat
from colors import K, W, BR0, BR1, BR2, G0, G1, G2, GR0, GR1, GR2, GY0, GY1, GY2
from drawutil import save, sparkle

OUT = 'assets/_src/icons'


def _bands(c, y0, y1):
    """Vertical gold bands with dark edges, wrapping the chest body."""
    for bx in (9, 35):
        c.rect(bx, y0, bx + 3, y1, G1)
        c.vline(bx - 1, y0, y1, K)
        c.vline(bx + 4, y0, y1, K)
        c.vline(bx, y0, y1, G2)
        c.vline(bx + 3, y0, y1, G0)


def _lock(c, y_top=30):
    c.rect(20, y_top, 27, y_top + 9, K)
    c.rect(21, y_top + 1, 26, y_top + 8, G1)
    c.set(21, y_top + 1, G2)
    c.set(22, y_top + 1, G2)
    c.hline(21, 26, y_top + 8, G0)
    c.set(23, y_top + 3, K)
    c.set(24, y_top + 3, K)
    c.vline(23, y_top + 4, y_top + 6, K)
    c.vline(24, y_top + 4, y_top + 6, K)


def chest_closed():
    c = Canvas(48, 48)
    c.hline(8, 39, 13, K)
    c.hline(6, 41, 14, K)
    c.rect(4, 15, 43, 43, K)
    # lid
    c.rect(6, 15, 41, 26, BR2)
    c.hline(6, 41, 19, BR1)
    c.hline(6, 41, 23, BR1)
    c.hline(6, 41, 27, K)  # lid/body seam
    # body
    c.rect(6, 28, 41, 41, BR2)
    c.hline(6, 41, 33, BR1)
    c.hline(6, 41, 37, BR1)
    _bands(c, 15, 41)
    _lock(c)
    return c


def chest_opening():
    c = Canvas(48, 48)
    # lid raised ~45 deg: trapezoid leaning back, hinge at the mouth
    for y in range(3, 17):
        t = (y - 3) / 13
        xl = round(14 - 6 * t)
        xr = round(33 + 7 * t)
        c.hline(xl, xr, y, K)
    for y in range(5, 15):
        t = (y - 3) / 13
        xl = round(14 - 6 * t) + 2
        xr = round(33 + 7 * t) - 2
        c.hline(xl, xr, y, BR2)
        w = xr - xl
        b1 = xl + round(w * 0.22)
        b2 = xl + round(w * 0.66)
        c.hline(b1, b1 + 2, y, G1)
        c.hline(b2, b2 + 2, y, G1)
    # body
    c.rect(4, 20, 43, 43, K)
    c.rect(6, 22, 41, 41, BR2)
    c.hline(6, 41, 30, BR1)
    c.hline(6, 41, 36, BR1)
    _bands(c, 22, 41)
    _lock(c)
    # dark mouth with the first gold glow
    c.ellipse_o(24, 19, 16, 4, BR0, K)
    c.ellipse(24, 20, 9, 2, G1)
    c.ellipse(24, 20, 4, 1, G2)
    sparkle(c, 15, 17, 2, G2)
    return c


def chest_open():
    c = Canvas(48, 48)
    # gold light block first; body and lid frame it
    c.rect(6, 17, 41, 25, G2)
    c.ellipse(24, 21, 9, 2, W)
    # body
    c.rect(4, 17, 5, 25, K)
    c.rect(42, 17, 43, 25, K)
    c.rect(4, 24, 43, 43, K)
    c.rect(6, 26, 41, 41, BR2)
    c.hline(6, 41, 33, BR1)
    c.hline(6, 41, 38, BR1)
    _bands(c, 26, 41)
    _lock(c, 30)
    # treasure spilling over the rim
    for x, y in ((7, 26), (8, 27), (7, 27), (40, 26), (39, 27), (40, 27)):
        c.set(x, y, G1)
    # lid fully up (inside face visible)
    c.rect(8, 2, 40, 16, K)
    c.rect(10, 4, 38, 14, BR1)
    c.rect(13, 6, 35, 12, BR0)
    for bx in (15, 29):
        c.rect(bx, 4, bx + 3, 14, G1)
    # light burst rays and sparkles
    c.line(14, 18, 10, 5, G2, 2)
    c.line(24, 18, 24, 3, G2, 2)
    c.line(34, 18, 38, 5, G2, 2)
    sparkle(c, 12, 9, 2, W)
    sparkle(c, 36, 10, 2, W)
    sparkle(c, 19, 5, 1, W)
    sparkle(c, 30, 6, 1, W)
    return c


def gravestone():
    c = Canvas(48, 48)
    # rounded-top slab silhouette
    c.hline(18, 30, 6, K)
    c.hline(15, 33, 7, K)
    c.hline(13, 35, 8, K)
    c.rect(11, 9, 37, 43, K)
    # stone fill
    c.rect(15, 9, 33, 10, GY1)
    c.rect(13, 11, 35, 41, GY1)
    # light from the left
    c.vline(15, 12, 38, GY2)
    c.vline(16, 12, 38, GY2)
    for x in (17, 18, 19):
        c.set(x, 10, GY2)
    # right and bottom shade
    c.vline(33, 12, 41, GY0)
    c.vline(34, 12, 41, GY0)
    c.hline(15, 33, 40, GY0)
    c.hline(15, 33, 41, GY0)
    # "RIP" suggestion: three short dark lines
    c.rect(19, 14, 28, 15, GY0)
    c.rect(20, 18, 27, 19, GY0)
    c.rect(19, 22, 28, 23, GY0)
    # crack
    for x, y in ((29, 28), (30, 29), (30, 30), (31, 31)):
        c.set(x, y, GY0)
    # grass tufts at the base
    c.tri(4, 44, 7, 36, 10, 44, GR1)
    c.tri(8, 44, 11, 39, 14, 44, GR0)
    c.tri(34, 44, 38, 37, 41, 44, GR1)
    c.tri(39, 44, 42, 40, 45, 44, GR0)
    c.set(7, 38, GR2)
    c.set(38, 39, GR2)
    return c


if __name__ == '__main__':
    strip = hconcat([chest_closed(), chest_opening(), chest_open()])
    save(strip, f'{OUT}/chest.png')
    save(gravestone(), f'{OUT}/gravestone.png')
