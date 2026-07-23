"""Shared campsite layout for the six morning scenes (PROMPT C §2).

Every morning scene draws the SAME forest campsite — tent, campfire on a
stone ring, sitting log, pine silhouettes, ground line — from the helpers
below. Per-scene modules only swap the palette dict and weather extras, so
the layout stays pixel-identical across all six moods.

Grid: 256x144 per frame, full-bleed (no transparency). Palette colors only.
"""

import math

from canvas import Canvas
from colors import (
    K, BG0, BG1, P0, W, BR0, BR1, R0, R1, G0, G1, G2, GR0, GR1, GR2,
    B2, T0, GY0, GY1, GY2,
)

GW, GH, HOR = 256, 144, 92          # frame size, horizon (ground start) y
FIRE_X, FIRE_Y = 128, 104           # flame base point (ring center-ish)
LOG_X0, LOG_X1, LOG_Y0, LOG_Y1 = 176, 202, 96, 101

# fixed ground detail spots (identical in every scene)
TUFTS = [(34, 124), (58, 136), (96, 120), (150, 132), (168, 118),
         (204, 126), (232, 138), (118, 140)]
PEBBLES = [(74, 112), (186, 116), (216, 108)]
STARS = [(20, 14), (44, 30), (70, 10), (96, 24), (112, 8), (148, 16),
         (160, 30), (178, 10), (214, 20), (236, 34), (248, 12), (86, 40),
         (30, 48), (146, 44)]
PLUS_STARS = [(44, 30), (214, 20)]  # brighter 5px crosses


def new_frame():
    return Canvas(GW, GH)


def sky(c, bands):
    """Discrete horizontal bands: [(color, height), ...] top-down."""
    y = 0
    for col, hh in bands:
        c.rect(0, y, GW - 1, y + hh - 1, col)
        y += hh
    assert y == HOR, f'sky bands must sum to {HOR}, got {y}'


def stars(c, cols, frame, skip_beam=False):
    """Twinkle: one star in four hidden per frame (rotating subset)."""
    for i, (x, y) in enumerate(STARS):
        if skip_beam and 114 < x < 142:
            continue
        if (i + frame) % 4 == 0:
            continue
        c.set(x, y, cols[i % len(cols)])
    for j, (x, y) in enumerate(PLUS_STARS):
        if skip_beam and 114 < x < 142:
            continue
        if (j + frame) % 3 == 2:
            continue
        col = cols[0]
        for dx, dy in ((0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
            c.set(x + dx, y + dy, col)


def moon(c, x=200, y=30):
    c.ellipse(x, y, 8, 8, GY2)
    c.ellipse(x - 2, y - 1, 5, 5, W)
    for px, py in ((x + 3, y - 3), (x + 4, y + 3), (x + 2, y + 1)):
        c.set(px, py, GY1)


def sun(c, x=196, y=56):
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0),
                   (-1, -1), (1, -1), (-1, 1), (1, 1)):
        c.line(x + dx * 11, y + dy * 11, x + dx * 16, y + dy * 16, G2, thick=2)
    c.ellipse(x, y, 8, 8, G2)
    c.ellipse(x, y, 4, 4, W)


def cloud(c, x, y, col=W, shade=GY2):
    c.ellipse(x, y, 9, 3, col)
    c.ellipse(x + 6, y - 2, 6, 2, col)
    c.hline(x - 8, x + 8, y + 2, shade)


def ground(c, p):
    c.rect(0, HOR, GW - 1, GH - 1, p['gmain'])
    c.ellipse(60, 128, 14, 3, p['gpatch'])
    c.ellipse(200, 134, 16, 3, p['gpatch'])
    c.ellipse(30, 100, 10, 2, p['gpatch'])
    c.ellipse(70, 93, 24, 2, p['gpatch'])            # tent shadow
    c.ellipse(FIRE_X, 110, 26, 7, p['dirt'])         # dirt under fire ring
    c.hline(0, GW - 1, HOR, p['gline'])
    for x, y in TUFTS:
        c.vline(x, y - 2, y, p['grass'])
        c.set(x - 1, y - 1, p['grass'])
        c.set(x - 2, y - 2, p['grass'])
        c.set(x + 1, y - 1, p['grass'])
        c.set(x + 2, y - 2, p['grass'])
    for x, y in PEBBLES:
        c.set(x, y, p['pebble'])
        c.set(x + 1, y, p['pebble'])
        c.set(x, y - 1, p['pebble'])


def pine(c, cx, top, base, hw, col, trunk, dx=0):
    """Three-tier silhouette pine. Big: top=36 hw=17; small: top=54 hw=13."""
    h = base - top
    for i in range(3):
        t_top = top + int(h * i / 3.2)
        t_bot = top + int(h * (i + 1.15) / 3.2)
        w = int(hw * (i + 1.6) / 3.6)
        c.tri(cx - w + dx, t_bot, cx + w + dx, t_bot, cx + dx, t_top, col)
    c.rect(cx - 1 + dx, base - 6, cx + 1 + dx, base, trunk)


def pines(c, p, dx=0):
    pine(c, 20, 36, HOR, 17, p['tree'], p['trunk'], dx)
    pine(c, 52, 54, HOR, 13, p['tree'], p['trunk'], dx)
    pine(c, 206, 54, HOR, 13, p['tree'], p['trunk'], dx)
    pine(c, 236, 36, HOR, 17, p['tree'], p['trunk'], dx)


def tent(c, p):
    c.tri(46, HOR, 94, HOR, 70, 58, K)                 # outline
    c.tri(50, HOR - 1, 90, HOR - 1, 70, 63, p['tent'])
    c.tri(50, HOR - 1, 70, HOR - 1, 70, 63, p['tent_dk'])
    c.tri(63, HOR - 1, 77, HOR - 1, 70, 76, p['tent_in'])


def log_seat(c, p):
    c.rect(LOG_X0 - 1, LOG_Y0 - 1, LOG_X1 + 1, LOG_Y1 + 1, K)
    c.rect(LOG_X0 + 1, LOG_Y0, LOG_X1 - 1, LOG_Y1, p['logc'])
    c.vline(LOG_X0 + 2, LOG_Y0, LOG_Y1, p['log_dk'])
    c.vline(LOG_X1 - 2, LOG_Y0, LOG_Y1, p['log_dk'])
    c.set(LOG_X0 + 8, LOG_Y0 + 2, p['log_dk'])
    c.set(LOG_X1 - 9, LOG_Y0 + 2, p['log_dk'])


def fire_ring(c, p):
    """Eight stones on an ellipse + two crossed logs."""
    for i in range(8):
        a = math.pi * i / 4.0
        sx = int(FIRE_X + math.cos(a) * 20)
        sy = int(110 + math.sin(a) * 6)
        col = p['stone_dk'] if math.sin(a) < 0 else p['stone']
        c.ellipse(sx, sy, 3, 2, K)
        c.ellipse(sx, sy, 2, 1, col)
    c.line(120, 108, 136, 100, p['logc'], thick=3)
    c.line(136, 108, 120, 100, p['logc'], thick=3)
    for ex, ey in ((119, 108), (137, 108), (119, 100), (137, 100)):
        c.set(ex, ey, p['log_dk'])
        c.set(ex, ey - 1, p['log_dk'])


def flame(c, x, base, hw, h, frame, outer=R1, mid=G1, inner=G2, core=None):
    """3 flicker variants: tip leans center/left/right, height pulses."""
    dx, dh = ((0, 0), (-2, -3), (2, -2))[frame]
    hh = h + dh
    c.tri(x - hw, base, x + hw, base, x + dx, base - hh, outer)
    if frame == 1:
        c.tri(x - hw - 1, base, x - hw + 4, base, x - hw, base - 8, outer)
    if frame == 2:
        c.tri(x + hw - 4, base, x + hw + 1, base, x + hw, base - 8, outer)
    c.tri(x - hw + 2, base, x + hw - 2, base, x + dx, base - hh + 5, mid)
    c.tri(x - hw + 4, base, x + hw - 4, base, x + dx // 2, base - hh + 11, inner)
    if core is not None:
        c.tri(x - hw + 6, base, x + hw - 6, base, x, base - hh + 17, core)


def smoke_puffs(c, frame):
    """Storm: fire nearly dead — gray blobs drifting up, 2px per frame."""
    sway = (0, 1, 0)[frame]
    for sx, sy, rx, ry, col in ((128, 96, 3, 2, GY1), (131, 88, 2, 1, GY2),
                                (126, 80, 2, 1, GY1)):
        c.ellipse(sx + sway, sy - 2 * frame, rx, ry, col)


def smoke_wisp(c, frame, pts, col_a=GY0, col_b=GY1):
    """Thin 1px wisp rising 1px per frame with a gentle sway."""
    sway = (0, 1, 0)[frame]
    for i, (x, y) in enumerate(pts):
        c.set(x + sway, y - frame, col_a if i % 2 == 0 else col_b)


def sparkles(c, frame):
    """Perfect: plus-shaped motes around the flame, rotating on/off."""
    pts = [(108, 86), (148, 82), (116, 72), (142, 94), (128, 64)]
    for i, (x, y) in enumerate(pts):
        if (i + frame) % 3 == 0:
            continue
        col = W if i % 2 == 0 else G2
        for dx, dy in ((0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)):
            c.set(x + dx, y + dy, col)


def birds(c, frame):
    """Tiny dark v-shapes drifting 1px right per frame, gentle bob."""
    dy = (0, -1, 0)[frame]
    for bx, by in ((150, 26), (170, 34), (188, 22)):
        x = bx + frame
        y = by + dy
        c.set(x - 2, y - 1, K)
        c.set(x - 1, y, K)
        c.set(x + 1, y, K)
        c.set(x + 2, y - 1, K)


def rain(c, frame):
    """B2 diagonal streaks shifting (+1, +2) per frame, in front of all."""
    for row in range(6, 132, 12):
        for col0 in range(0, GW, 18):
            x = (col0 + (row // 12) * 9 + frame) % GW
            y = row + 2 * frame
            c.set(x, y, B2)
            c.set(x + 1, y + 1, B2)
            c.set(x + 2, y + 2, B2)


def lightning(c):
    """Frame-2-only W jagged bolt, right-of-center sky."""
    pts = [(170, 0), (166, 12), (172, 22), (164, 34), (170, 44), (162, 54)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        c.line(x0, y0, x1, y1, W)
    c.line(172, 22, 178, 30, W)


def beam(c):
    """Resurrection: banded golden column from the sky onto the fire ring."""
    for x0, x1, col in ((120, 121, G0), (122, 124, G1), (125, 126, G2),
                        (127, 128, W), (129, 131, G2), (132, 134, G1),
                        (135, 136, G0)):
        c.rect(x0, 0, x1, FIRE_Y, col)


def motes(c, frame):
    """Gold sparks rising inside the beam; 6px spacing / 2px shift = seamless.

    Mote color contrasts the beam stripe it sits on (G2 on the W core,
    W everywhere else), with a 4px plus on the wider sparks.
    """
    xs = (124, 128, 132, 126, 130, 123, 129, 133, 125, 131)
    for i in range(10):
        x, y = xs[i], 100 - 6 * i - 2 * frame
        col = G2 if x in (127, 128) else W
        c.set(x, y, col)
        if i % 3 == 0:
            c.set(x - 1, y, col)
            c.set(x + 1, y, col)
            c.set(x, y - 1, col)
    c.set(112, 100 - 2 * frame, G1)
    c.set(144, 98 - 2 * frame, G1)


def gravestone(c):
    c.ellipse(163, 86, 8, 7, K)
    c.rect(155, 86, 171, 97, K)
    c.ellipse(163, 86, 6, 5, GY1)
    c.rect(157, 86, 169, 95, GY1)
    c.rect(153, 95, 173, 98, GY0)                     # plinth
    c.vline(163, 80, 88, GY0)                         # engraved cross
    c.hline(160, 166, 83, GY0)
    # crow silhouette perched on top, facing left
    c.ellipse(162, 77, 3, 2, K)
    c.ellipse(159, 74, 2, 2, K)
    c.set(157, 75, K)
    c.set(166, 76, K)
    c.set(167, 75, K)
    c.vline(161, 79, 80, K)


def fog(c):
    """Death: flat low GY0 bands hugging the ground, broken into segments."""
    for x0, x1, y0, y1 in ((0, 90, 118, 120), (170, 255, 118, 120),
                           (40, 140, 126, 128), (200, 255, 126, 128),
                           (0, 110, 136, 137), (150, 255, 136, 137)):
        c.rect(x0, y0, x1, y1, GY0)


def build_strip(frames, path):
    from canvas import hconcat
    hconcat(frames).save(path)
