"""Minimal pixel canvas for the source-art generators.

Draws at the final asset grid resolution (e.g. 64x64) with hex colors;
`None` means transparent. Saved as RGBA PNG for tools/pixelate.py.
"""

import os

from PIL import Image

from colors import K


class Canvas:
    def __init__(self, w, h, bg=None):
        self.w = w
        self.h = h
        self.px = [[bg] * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def rect(self, x0, y0, x1, y1, c):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for x in range(min(x0, x1), max(x0, x1) + 1):
                self.set(x, y, c)

    def hline(self, x0, x1, y, c):
        for x in range(min(x0, x1), max(x0, x1) + 1):
            self.set(x, y, c)

    def vline(self, x, y0, y1, c):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            self.set(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(cy - ry, cy + ry + 1):
            for x in range(cx - rx, cx + rx + 1):
                if ((x - cx) / max(rx, 0.5)) ** 2 + ((y - cy) / max(ry, 0.5)) ** 2 <= 1.0:
                    self.set(x, y, c)

    def ellipse_o(self, cx, cy, rx, ry, c, outline=K):
        """Filled ellipse with the house 2px dark outline."""
        self.ellipse(cx, cy, rx + 2, ry + 2, outline)
        self.ellipse(cx, cy, rx, ry, c)

    def tri(self, x0, y0, x1, y1, x2, y2, c):
        def sign(ax, ay, bx, by, px, py):
            return (px - bx) * (ay - by) - (ax - bx) * (py - by)

        lo_x, hi_x = min(x0, x1, x2), max(x0, x1, x2)
        lo_y, hi_y = min(y0, y1, y2), max(y0, y1, y2)
        for y in range(lo_y, hi_y + 1):
            for x in range(lo_x, hi_x + 1):
                d1 = sign(x0, y0, x1, y1, x, y)
                d2 = sign(x1, y1, x2, y2, x, y)
                d3 = sign(x2, y2, x0, y0, x, y)
                neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
                pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
                if not (neg and pos):
                    self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c, thick=1):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err, x, y = dx + dy, x0, y0
        while True:
            r = thick // 2
            self.rect(x - r, y - r, x + (thick - 1 - r), y + (thick - 1 - r), c)
            if x == x1 and y == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy

    def shifted(self, dx, dy):
        out = Canvas(self.w, self.h)
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    out.set(x + dx, y + dy, self.px[y][x])
        return out

    def paste(self, other, dx=0, dy=0):
        """Alpha-over: other's opaque pixels win."""
        for y in range(other.h):
            for x in range(other.w):
                if other.px[y][x] is not None:
                    self.set(x + dx, y + dy, other.px[y][x])

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img = Image.new('RGBA', (self.w, self.h))
        img.putdata([
            (0, 0, 0, 0) if c is None else (*_hex(c), 255)
            for row in self.px
            for c in row
        ])
        img.save(path)


def _hex(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def hconcat(canvases):
    """Lay canvases side by side into an animation strip."""
    w = sum(c.w for c in canvases)
    out = Canvas(w, max(c.h for c in canvases))
    x = 0
    for c in canvases:
        out.paste(c, x, 0)
        x += c.w
    return out
