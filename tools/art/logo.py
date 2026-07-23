"""Logo (256x256, transparent) and app icon (256x256, full-bleed).

All letterforms are hand-drawn blocky pixel glyphs — no anti-aliased text.

Run from repo root:  python3 tools/art/logo.py
"""

from canvas import Canvas
from colors import K, W, BG0, P1, PK, SK1, G1, G2
from drawutil import GLYPH_Z, glyph, save, sparkle

OUT = 'assets/_src/icons'


def _crescent(c, cx, cy, r, ox, oy, r2, cut=None):
    """Crescent moon: G2 disc with K outline, cut by an offset disc.

    `cut` is the color of the erased interior (None = transparent for the
    emblem, BG0 for the full-bleed app icon).
    """
    c.ellipse(cx, cy, r + 2, r + 2, K)
    c.ellipse(cx, cy, r, r, G2)
    c.ellipse(ox, oy, r2 + 2, r2 + 2, K)
    c.ellipse(ox, oy, r2, r2, cut)


def logo():
    c = Canvas(256, 256)
    _crescent(c, 100, 110, 76, 130, 110, 70)
    c.ellipse(62, 78, 6, 6, G1)   # craters
    c.ellipse(50, 118, 5, 5, G1)
    c.ellipse(58, 140, 4, 4, G1)
    sparkle(c, 198, 52, 7, W, 2, G2)
    sparkle(c, 230, 118, 4, G2)
    # tiny sleeping hero head leaning on the crescent's inner curve
    c.ellipse(72, 158, 14, 14, K)
    c.ellipse(72, 158, 12, 12, SK1)
    c.tri(54, 153, 70, 132, 96, 144, K)      # nightcap outline
    c.tri(57, 151, 70, 135, 93, 143, P1)     # nightcap (drooping right)
    c.ellipse_o(96, 142, 2, 2, W, K)          # pompom
    c.hline(73, 77, 158, K)                   # closed eye
    c.set(78, 165, PK)                        # blush
    # "Zz" rising to the upper right, clear of the moon
    glyph(c, GLYPH_Z, 170, 96, 8, W)
    glyph(c, GLYPH_Z, 214, 62, 5, W)
    return c


def app_icon():
    c = Canvas(256, 256, bg=BG0)
    c.rect(0, 0, 255, 3, P1)      # 4px frame
    c.rect(0, 252, 255, 255, P1)
    c.rect(0, 0, 3, 255, P1)
    c.rect(252, 0, 255, 255, P1)
    _crescent(c, 104, 100, 52, 128, 100, 46, cut=BG0)
    c.ellipse(86, 78, 5, 5, G1)
    c.ellipse(78, 114, 4, 4, G1)
    sparkle(c, 192, 56, 5, W, 2, G2)
    glyph(c, GLYPH_Z, 148, 140, 9, W)
    return c


if __name__ == '__main__':
    save(logo(), f'{OUT}/logo.png')
    save(app_icon(), f'{OUT}/app_icon.png')
