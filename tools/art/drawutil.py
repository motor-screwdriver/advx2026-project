"""Shared helpers for the 8bit Sleep source-art generators.

blit() draws ASCII-art rows with a char->color map; mirror() expands 8-char
left halves into symmetric 16-char rows; save() enforces palette compliance
before writing the PNG (off-palette pixels are a defect).
"""

import colors as C
from canvas import Canvas

PALETTE = {getattr(C, name) for name in dir(C) if name.isupper()}


def blit(canvas, rows, charmap, dx=0, dy=0, width=16):
    """Draw string rows onto canvas; '.' is transparent, unknown chars raise."""
    for y, row in enumerate(rows):
        assert len(row) == width, f'row {y} is {len(row)} chars, want {width}: {row!r}'
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            if ch not in charmap:
                raise ValueError(f'unknown char {ch!r} in row {y}')
            canvas.set(dx + x, dy + y, charmap[ch])


def mirror(halves):
    """Mirror 8-char left halves into symmetric 16-char rows."""
    for h in halves:
        assert len(h) == 8, f'half row must be 8 chars: {h!r}'
    return [h + h[::-1] for h in halves]


def save(canvas, path):
    """Palette-compliance check, then save."""
    bad = {c for row in canvas.px for c in row if c is not None and c not in PALETTE}
    assert not bad, f'off-palette colors in {path}: {bad}'
    canvas.save(path)
    print(path)


def dilate(points, r=1):
    """8-neighbourhood dilation of a set of (x, y) pixels."""
    out = set()
    for x, y in points:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                out.add((x + dx, y + dy))
    return out


def sparkle(canvas, x, y, arm, c, diag=0, diag_c=None):
    """Plus-shaped sparkle with optional shorter diagonal arms."""
    canvas.vline(x, y - arm, y + arm, c)
    canvas.hline(x - arm, x + arm, y, c)
    for d in range(1, diag + 1):
        dc = diag_c or c
        for sx, sy in ((d, d), (d, -d), (-d, d), (-d, -d)):
            canvas.set(x + sx, y + sy, dc)


GLYPH_Z = [
    '#####',
    '...#.',
    '..#..',
    '.#...',
    '#####',
]


def glyph(canvas, pattern, x0, y0, scale, fill, outline=C.K, pad=None):
    """Hand-drawn blocky letterform with chunky outline (no AA, ever)."""
    pad = max(2, scale // 3) if pad is None else pad
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch == '#':
                canvas.rect(x0 + i * scale - pad, y0 + j * scale - pad,
                            x0 + (i + 1) * scale - 1 + pad,
                            y0 + (j + 1) * scale - 1 + pad, outline)
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch == '#':
                canvas.rect(x0 + i * scale, y0 + j * scale,
                            x0 + (i + 1) * scale - 1, y0 + (j + 1) * scale - 1, fill)
