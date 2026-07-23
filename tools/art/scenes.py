#!/usr/bin/env python3
"""Morning scenes x6 (PROMPT C §2) — 256x144, 3-frame strips, full-bleed.

One recurring forest campsite; only lighting/weather/mood change per scene.
Run from repo root:  python3 tools/art/scenes.py
Outputs: assets/_src/scenes/scene_{perfect,good,bad,terrible,death,resurrection}.png
"""

import os

from colors import (
    K, BG0, BG1, P0, P3, W, BR0, BR1, R0, R1, R2, G0, G1, G2, GR0, GR1, GR2,
    B2, PK, T0, GY0, GY1, GY2,
)
import scene_common as sc


OUT_DIR = 'assets/_src/scenes'

PAL_PERFECT = dict(gmain=GR1, gline=GR0, gpatch=GR0, dirt=BR0, grass=GR2,
                   pebble=G0, tree=GR0, trunk=BR0, tent=BR1, tent_dk=BR0,
                   tent_in=K, stone=GY1, stone_dk=GY0, logc=BR1, log_dk=BR0)
PAL_GOOD = dict(PAL_PERFECT)          # same warm campsite, calmer light
PAL_BAD = dict(gmain=GR0, gline=GY0, gpatch=GY0, dirt=BR0, grass=GY1,
               pebble=GY0, tree=K, trunk=BR0, tent=BR1, tent_dk=BR0,
               tent_in=K, stone=GY1, stone_dk=GY0, logc=BR0, log_dk=K)
PAL_TERRIBLE = dict(gmain=GR0, gline=GY0, gpatch=T0, dirt=BR0, grass=GY0,
                    pebble=GY0, tree=BG0, trunk=K, tent=P0, tent_dk=BG1,
                    tent_in=K, stone=GY1, stone_dk=GY0, logc=BR0, log_dk=K)
PAL_DEATH = dict(gmain=T0, gline=BG0, gpatch=GR0, dirt=BG1, grass=GR0,
                 pebble=GY0, tree=BG0, trunk=K, tent=P0, tent_dk=BG1,
                 tent_in=K, stone=GY1, stone_dk=GY0, logc=BR0, log_dk=K)
PAL_RESURRECTION = dict(PAL_DEATH, grass=GR0)


def frame_perfect(f):
    c = sc.new_frame()
    sc.sky(c, [(G2, 40), (G1, 28), (R2, 24)])
    sc.sun(c)
    sc.ground(c, PAL_PERFECT)
    c.ellipse(sc.FIRE_X, 112, 30, 8, G1)              # warm light on ground
    c.ellipse(sc.FIRE_X, 112, 22, 6, G2)
    sc.pines(c, PAL_PERFECT)
    sc.tent(c, PAL_PERFECT)
    sc.log_seat(c, PAL_PERFECT)
    sc.fire_ring(c, PAL_PERFECT)
    sc.flame(c, sc.FIRE_X, sc.FIRE_Y, 9, 30, f, core=W)
    sc.sparkles(c, f)
    sc.birds(c, f)
    return c


def frame_good(f):
    c = sc.new_frame()
    sc.sky(c, [(B2, 40), (P3, 26), (PK, 26)])
    sc.cloud(c, 56, 26)
    sc.cloud(c, 150, 18)
    sc.cloud(c, 214, 38)
    sc.ground(c, PAL_GOOD)
    c.ellipse(sc.FIRE_X, 112, 26, 7, G0)              # soft fire glow
    sc.pines(c, PAL_GOOD)
    sc.tent(c, PAL_GOOD)
    sc.log_seat(c, PAL_GOOD)
    sc.fire_ring(c, PAL_GOOD)
    sc.flame(c, sc.FIRE_X, sc.FIRE_Y, 7, 22, f)
    return c


def frame_bad(f):
    c = sc.new_frame()
    sc.sky(c, [(GY0, 42), (GY1, 50)])
    c.ellipse(80, 58, 20, 2, GY0)                     # flat dull cloud banks
    c.ellipse(190, 66, 22, 2, GY0)
    c.ellipse(140, 48, 14, 2, GY0)
    sc.ground(c, PAL_BAD)
    c.ellipse(sc.FIRE_X, 112, 18, 5, G0)              # faint glow
    sc.pines(c, PAL_BAD)
    sc.tent(c, PAL_BAD)
    sc.log_seat(c, PAL_BAD)
    sc.fire_ring(c, PAL_BAD)
    sc.flame(c, sc.FIRE_X, sc.FIRE_Y, 5, 13, f,
             outer=R0, mid=R1, inner=G1)              # weak small fire
    sc.smoke_wisp(c, f, [(130, 86), (132, 79), (131, 72)], GY0, GY1)
    return c


def frame_terrible(f):
    c = sc.new_frame()
    sc.sky(c, [(BG1, 44), (GY0, 48)])
    sc.ground(c, PAL_TERRIBLE)
    sway = (0, 1, 0)[f]                               # trees sway 1px
    sc.pines(c, PAL_TERRIBLE, dx=sway)
    sc.tent(c, PAL_TERRIBLE)
    sc.log_seat(c, PAL_TERRIBLE)
    sc.fire_ring(c, PAL_TERRIBLE)
    if f != 1:                                        # ember barely alive
        c.set(127, 102, R0)
    sc.smoke_puffs(c, f)                              # no flame, smoke only
    if f == 1:
        sc.lightning(c)
    sc.rain(c, f)
    return c


def frame_death(f):
    c = sc.new_frame()
    sc.sky(c, [(BG1, 46), (P0, 46)])
    sc.stars(c, [W, GY2], f)
    sc.moon(c)
    sc.ground(c, PAL_DEATH)
    sc.pines(c, PAL_DEATH)
    sc.tent(c, PAL_DEATH)
    sc.log_seat(c, PAL_DEATH)
    sc.gravestone(c)
    sc.fire_ring(c, PAL_DEATH)                        # stone-cold, no flame
    sc.smoke_wisp(c, f, [(128, 98), (129, 92), (128, 86), (127, 80), (128, 74)])
    sc.fog(c)
    return c


def frame_resurrection(f):
    c = sc.new_frame()
    sc.sky(c, [(BG1, 44), (P0, 48)])
    sc.stars(c, [GY2, W], f, skip_beam=True)
    sc.ground(c, PAL_RESURRECTION)
    sc.beam(c)
    c.ellipse(sc.FIRE_X, 110, 32, 9, G0)              # golden pool of light
    c.ellipse(sc.FIRE_X, 110, 26, 7, G2)
    sc.pines(c, PAL_RESURRECTION)
    sc.tent(c, PAL_RESURRECTION)
    sc.log_seat(c, PAL_RESURRECTION)
    sc.fire_ring(c, PAL_RESURRECTION)
    sc.flame(c, sc.FIRE_X, sc.FIRE_Y, 8, 34, f, core=W)  # reigniting tall
    sc.motes(c, f)
    return c


BUILDERS = {
    'scene_perfect': frame_perfect,
    'scene_good': frame_good,
    'scene_bad': frame_bad,
    'scene_terrible': frame_terrible,
    'scene_death': frame_death,
    'scene_resurrection': frame_resurrection,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, build in BUILDERS.items():
        frames = [build(f) for f in range(3)]
        path = os.path.join(OUT_DIR, f'{name}.png')
        sc.build_strip(frames, path)
        print(f'{path}  768x144 (3 frames)')


if __name__ == '__main__':
    main()
