"""Soul Tether (resurrection minigame UI): bar 256x32, cursor 16x32, zone 256x32.

Run from repo root:  python3 tools/art/tether.py
"""

from canvas import Canvas
from colors import K, W, BG1, P1, G0, G1, G2, GY0
from drawutil import save

OUT = 'assets/_src/icons'


def tether_bar():
    c = Canvas(256, 32)
    c.rect(0, 0, 255, 31, BG1)
    c.rect(2, 2, 13, 29, P1)     # left end-cap
    c.rect(242, 2, 253, 29, P1)  # right end-cap
    for x in range(16, 256, 16):  # segment ticks every 16px
        c.vline(x, 2, 29, GY0)
    c.rect(0, 0, 255, 1, K)      # 2px outer border
    c.rect(0, 30, 255, 31, K)
    c.rect(0, 0, 1, 31, K)
    c.rect(254, 0, 255, 31, K)
    return c


def tether_cursor():
    c = Canvas(16, 32)
    # K silhouette: shaft + arrowhead
    c.rect(4, 0, 11, 17, K)
    c.tri(1, 16, 14, 16, 7, 31, K)
    c.tri(1, 16, 14, 16, 8, 31, K)
    # G2 body
    c.rect(6, 0, 9, 16, G2)
    c.tri(3, 18, 12, 18, 7, 28, G2)
    c.tri(3, 18, 12, 18, 8, 28, G2)
    # G1 right shade
    c.vline(9, 1, 16, G1)
    c.tri(8, 18, 12, 18, 8, 28, G1)
    c.set(6, 1, W)
    c.set(6, 2, W)
    return c


def tether_zone():
    c = Canvas(256, 32)
    c.rect(96, 0, 159, 31, G2)   # centered 64px golden band
    c.rect(94, 0, 95, 31, G0)    # 2px borders
    c.rect(160, 0, 161, 31, G0)
    return c


if __name__ == '__main__':
    save(tether_bar(), f'{OUT}/tether_bar.png')
    save(tether_cursor(), f'{OUT}/tether_cursor.png')
    save(tether_zone(), f'{OUT}/tether_zone.png')
