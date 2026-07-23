#!/usr/bin/env python3
"""heroes.py — generate all 8bit Sleep hero sprites procedurally.

One shared chibi construction (draw_hero) draws all 9 heroes; per-hero
identity comes from the schemes + gear keys in hero_defs.py. For each hero
three variants are rendered from the same draw code:
  hero_<name>.png        color scheme           (128x64, 2-frame idle)
  hero_<name>_gold.png   golden recolor scheme  (128x64, 2-frame idle)
  1bit_hero_<name>.png   pure K/W e-ink scheme  (128x64, 2-frame idle)
plus 1bit_hero_icon_40.png — the knight bust for the e-ink stats card.

Run from the repo root:  python3 tools/art/heroes.py
"""

import os

import colors as _colors
from canvas import Canvas, hconcat
from colors import K, W
from hero_defs import GOLD, GOLD_OVERRIDES, HEROES, ONEBIT
from hero_parts import HEADGEAR
from hero_weapons import BACKS, CHESTS, HANDS

OUT_DIR = os.path.join('assets', '_src', 'heroes')
PALETTE = {v for k, v in vars(_colors).items() if k.isupper() and isinstance(v, str)}


def outline(c, passes=2):
    """Grow the house 2px K outline around the whole silhouette."""
    for _ in range(passes):
        grow = []
        for y in range(c.h):
            for x in range(c.w):
                if c.px[y][x] is not None:
                    continue
                if any(
                    c.get(x + dx, y + dy) is not None
                    for dy in (-1, 0, 1)
                    for dx in (-1, 0, 1)
                ):
                    grow.append((x, y))
        for x, y in grow:
            c.set(x, y, K)


def body(c, s, g):
    """The shared chibi body: big-head proportions, feet at y=60."""
    c.rect(25, 56, 29, 60, s['dark'])  # boots
    c.rect(35, 56, 39, 60, s['dark'])
    c.rect(22, 48, 42, 56, s['main'])  # robe skirt
    c.rect(24, 37, 40, 48, s['main'])  # torso
    c.rect(23, 37, 41, 39, s['main'])  # shoulders
    c.hline(23, 41, 55, s['dark'])  # hem shade
    c.rect(20, 38, 24, 47, s['main'])  # left sleeve
    c.rect(21, 47, 23, 49, s['skin'])  # left hand
    if g.get('bare_arm_r'):
        c.rect(40, 38, 44, 47, s['skin'])  # monk's bare right arm
    else:
        c.rect(40, 38, 44, 47, s['main'])  # right sleeve
    c.rect(41, 47, 43, 49, s['skin'])  # right hand
    if g.get('chest'):
        CHESTS[g['chest']](c, s)
    if g.get('belt'):
        c.rect(24, 47, 40, 48, s['feat'])  # bold 2px belt
    c.ellipse(32, 26, 11, 10, s['skin'])  # head (half the total height)


def draw_hero(hero, s):
    """Assemble one 64x64 frame: back -> body -> headgear(+face) -> gear."""
    c = Canvas(64, 64)
    if hero.get('back'):
        BACKS[hero['back']](c, s)
    body(c, s, hero)
    HEADGEAR[hero['headgear']](c, s)
    if hero.get('hand_l'):
        HANDS[hero['hand_l']](c, s)
    if hero.get('hand_r'):
        HANDS[hero['hand_r']](c, s)
    outline(c)
    return c


def gold_scheme(hero):
    s = dict(hero['scheme'])
    s.update(GOLD)
    s.update(GOLD_OVERRIDES.get(hero['name'], {}))
    return s


def onebit_scheme(hero):
    s = dict(hero['scheme'])
    s.update(ONEBIT)
    return s


def render_strip(hero, scheme):
    """2-frame idle: frame 2 is the whole character bounced up 1px."""
    f1 = draw_hero(hero, scheme)
    return hconcat([f1, f1.shifted(0, -1)])


def draw_icon():
    """1bit_hero_icon_40: knight head-and-shoulders bust, 40x40, pure K/W."""
    c = Canvas(40, 40)
    c.rect(10, 27, 30, 36, W)  # chest
    c.rect(6, 29, 9, 34, W)  # pauldrons
    c.rect(30, 29, 33, 34, W)
    c.rect(16, 24, 23, 28, W)  # neck
    c.ellipse(20, 15, 10, 9, W)  # helm
    c.rect(18, 4, 22, 8, W)  # plume
    c.tri(18, 4, 22, 4, 25, 2, W)
    c.rect(13, 11, 27, 12, K)  # brow band
    c.rect(13, 14, 27, 16, K)  # eye slit
    outline(c)
    return c


def validate(c, label):
    bad = {p for row in c.px for p in row if p is not None and p not in PALETTE}
    assert not bad, f'{label}: off-palette colors {sorted(bad)}'


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for hero in HEROES:
        name = hero['name']
        for suffix, scheme in (
            ('', hero['scheme']),
            ('_gold', gold_scheme(hero)),
        ):
            strip = render_strip(hero, scheme)
            validate(strip, name + suffix)
            strip.save(os.path.join(OUT_DIR, f'hero_{name}{suffix}.png'))
        strip = render_strip(hero, onebit_scheme(hero))
        validate(strip, name + '_1bit')
        strip.save(os.path.join(OUT_DIR, f'1bit_hero_{name}.png'))
        print(f'hero_{name}: color + gold + 1bit')
    icon = draw_icon()
    validate(icon, 'icon')
    icon.save(os.path.join(OUT_DIR, '1bit_hero_icon_40.png'))
    print('1bit_hero_icon_40 saved')


if __name__ == '__main__':
    main()
