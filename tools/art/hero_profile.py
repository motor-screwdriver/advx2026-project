#!/usr/bin/env python3
"""hero_profile.py — side-profile WALK sprites for the 8bit Sleep heroes.

Companion to heroes.py (which draws the front-facing idle chibi). This module
draws the SAME roster in a right-facing 3/4-side profile and animates a proper
walk cycle, used on the home screen when the hero sets off on the night
journey. Shared construction, per-hero identity from hero_defs schemes + gear.

Grid 64x64, facing right (+x = forward). Origin landmarks:
  head ellipse (30,24) r11  |  torso x24..40 y36..50  |  hips y50, feet y61
Legs and arms are posed per frame from WALK (a 6-frame cycle: contact, down,
passing x2). `near` limbs are lit (main); `far` limbs sit behind in shadow.

Run from repo root:  python3 tools/art/hero_profile.py [hero...]
"""

import os
import sys

import colors as _colors
from canvas import Canvas, hconcat
from colors import K, W
from hero_defs import GOLD, GOLD_OVERRIDES, HEROES, ONEBIT

OUT_DIR = os.path.join('assets', '_src', 'heroes')
PALETTE = {v for k, v in vars(_colors).items() if k.isupper() and isinstance(v, str)}

HIPX, HIPY = 30, 49
FOOTY = 62
SHX, SHY = 32, 38  # shoulder pivot

# 6-frame walk cycle. Each pose: forward offsets (px) of the near/far foot,
# how high each foot is lifted, the body bob, and the arm swing of each arm.
WALK = [
    dict(nf=8, ff=-7, nl=0, fl=0, dy=0, na=-6, fa=6),   # 0 contact (near ahead)
    dict(nf=5, ff=-3, nl=0, fl=3, dy=1, na=-3, fa=3),   # 1 recoil / weight down
    dict(nf=1, ff=3, nl=0, fl=7, dy=-1, na=2, fa=-2),   # 2 far leg passes, body up
    dict(nf=-7, ff=8, nl=0, fl=0, dy=0, na=6, fa=-6),   # 3 contact (far ahead)
    dict(nf=-3, ff=5, nl=3, fl=0, dy=1, na=3, fa=-3),   # 4 recoil / weight down
    dict(nf=3, ff=1, nl=7, fl=0, dy=-1, na=-2, fa=2),   # 5 near leg passes, body up
]


def outline(c, passes=2):
    """Grow the house 2px K outline around the whole silhouette."""
    for _ in range(passes):
        grow = []
        for y in range(c.h):
            for x in range(c.w):
                if c.px[y][x] is not None:
                    continue
                if any(c.get(x + dx, y + dy) is not None
                       for dy in (-1, 0, 1) for dx in (-1, 0, 1)):
                    grow.append((x, y))
        for x, y in grow:
            c.set(x, y, K)


def leg(c, s, footx, lift, near):
    """A two-segment leg from the hip to a posed foot, with a chunky boot."""
    col = s['main'] if near else s['dark']
    footy = FOOTY - lift
    kneex = (HIPX + footx) // 2 + (2 if footx > HIPX else -1)
    c.line(HIPX, HIPY, kneex, 55, col, 4)          # thigh
    c.line(kneex, 55, footx, footy - 2, col, 4)    # shin (stops above boot)
    c.rect(footx - 2, footy - 2, footx + 4, footy, s['dark'])  # boot, toe forward
    if near:
        c.hline(footx - 2, footx + 4, footy - 2, s['main'])    # lit boot top


def swing_arm(c, col, skin, hand, dy):
    """Draw one arm from the shoulder to `hand` and a small skin fist."""
    c.line(SHX, SHY + dy, hand[0], hand[1], col, 4)
    c.rect(hand[0] - 1, hand[1], hand[0] + 2, hand[1] + 2, skin)


def torso(c, s, dy):
    """Narrow profile torso + short tunic; front (+x) lit, back (-x) shaded."""
    c.rect(25, 35 + dy, 39, 50 + dy, s['main'])   # torso + short tunic
    c.vline(25, 36 + dy, 49 + dy, s['dark'])      # back edge shade
    c.hline(25, 39, 49 + dy, s['dark'])           # hem shade
    if s.get('belt_role'):
        c.rect(25, 46 + dy, 39, 47 + dy, s['feat'])  # belt band


def head(c, s, dy):
    """Bare profile skull + neck + nose (skin only). Face stamped by headgear."""
    cy = 22 + dy
    c.rect(28, 31 + dy, 33, 36 + dy, s['skin'])        # neck
    c.rect(28, 35 + dy, 33, 36 + dy, s['skin2'])       # neck shade
    c.ellipse(30, cy, 10, 10, s['skin'])               # skull
    c.rect(40, cy, 41, cy + 3, s['skin'])              # nose bump (front)
    c.hline(22, 29, cy + 8, s['skin2'])                # jaw/back shade


def pface(c, s, dy):
    """The one profile face: forward eye + small mouth (bare-faced heroes)."""
    cy = 22 + dy
    c.rect(36, cy - 1, 37, cy + 1, s['eye'])           # eye
    c.hline(38, 40, cy + 5, s['eye'])                  # mouth line


def pface_eyes(c, s, dy):
    """Masked heroes keep the forward eye, lose the mouth."""
    c.rect(36, 21 + dy, 37, 23 + dy, s['eye'])


def draw_profile(hero, s, pose):
    """Assemble one 64x64 walk frame with correct near/far depth ordering."""
    c = Canvas(64, 64)
    dy = pose['dy']
    near_hand = (34 + pose['na'], 49 + dy)
    far_hand = (31 + pose['fa'], 47 + dy)
    # --- back item + far side, behind the torso ---
    bk = PROFILE_BACKS.get(hero.get('back'))
    if bk:
        bk(c, s, dy)
    swing_arm(c, s['dark'], s['skin2'], far_hand, dy)
    leg(c, s, HIPX + pose['ff'], pose['fl'], near=False)
    _route(hero, s, near_hand, far_hand, dy, c, behind=True)
    # --- body ---
    torso(c, s, dy)
    ch = PROFILE_CHESTS.get(hero.get('chest'))
    if ch:
        ch(c, s, dy)
    leg(c, s, HIPX + pose['nf'], pose['nl'], near=True)
    head(c, s, dy)
    hg = PROFILE_HEADGEAR.get(hero['headgear'])
    if hg:
        hg(c, s, dy)
    # --- near side, in front ---
    swing_arm(c, s['main'], s['skin'], near_hand, dy)
    _route(hero, s, near_hand, far_hand, dy, c, behind=False)
    outline(c)
    return c


# Weapons carried on the far side (drawn behind the torso).
BEHIND = {'sword'}


def _route(hero, s, near, far, dy, c, behind):
    """Draw the hero's weapons for one depth layer (behind vs. in front)."""
    for key in ('hand_r', 'hand_l'):
        w = hero.get(key)
        if not w or (w in BEHIND) != behind:
            continue
        fn = PROFILE_HANDS.get(w)
        if fn:
            fn(c, s, near, far, dy)


# ---- knight profile parts (first hero to nail; others added next) ----------

def phg_helm_plume(c, s, dy):  # knight — enclosed helm, forward visor, red crest
    cy = 22 + dy
    c.ellipse(30, cy, 11, 10, s['main'])           # helm dome
    c.rect(28, cy + 9, 34, cy + 11, s['dark'])     # helm base rim
    c.rect(20, cy + 2, 41, cy + 4, s['feat'])      # visor slit (dark), forward
    c.rect(36, cy + 2, 37, cy + 3, s['glint'])     # slit glint
    c.rect(39, cy + 5, 42, cy + 9, s['main'])      # faceplate / nose guard fwd
    c.rect(24, cy - 11, 31, cy - 8, s['accent'])   # crest, sweeping back-down
    c.rect(19, cy - 9, 26, cy - 6, s['accent'])
    c.rect(15, cy - 6, 21, cy - 3, s['accent'])
    _sparkle(c, s, 28, cy - 10)


def pwp_sword(c, s, near, far, dy):  # knight — sword carried low on the far side
    hx, hy = far
    c.rect(hx - 1, hy - 2, hx + 3, hy - 1, s['accent'])     # crossguard
    c.line(hx + 1, hy, hx - 4, hy + 13, s['metal2'], 2)     # blade down-back
    c.set(hx - 5, hy + 14, s['metal2'])                     # tip


def pwp_shield(c, s, near, far, dy):  # knight — heater shield on the near arm
    hx, hy = near
    c.rect(hx - 3, hy - 7, hx + 5, hy + 3, s['trim'])       # shield face
    c.tri(hx - 3, hy + 3, hx + 5, hy + 3, hx + 1, hy + 8, s['trim'])  # point
    c.rect(hx - 1, hy - 4, hx + 3, hy - 2, s['feat2'])      # cross arms
    c.rect(hx, hy - 6, hx + 1, hy + 2, s['feat2'])          # cross stem


def pch_tabard(c, s, dy):  # knight — tabard stripe down the tunic front
    c.rect(33, 37 + dy, 38, 50 + dy, s['trim'])
    c.tri(33, 50 + dy, 38, 50 + dy, 35, 53 + dy, s['trim'])  # pointed hem


def _sparkle(c, s, x, y):
    if s.get('sparkle'):
        c.set(x, y, s['sparkle'])


# ---- remaining headgear (facing right; draw hair/hat, then stamp face) ------

def _hood(c, s, dy, peak_dx):
    cy = 22 + dy
    c.ellipse(29, cy, 12, 11, s['main'])                       # hood shell
    c.rect(17, cy + 5, 25, cy + 15, s['main'])                 # back drape
    c.tri(24, cy - 9, 30, cy - 9, 24 + peak_dx, cy - 15, s['main'])  # peak
    c.ellipse(33, cy + 1, 8, 8, s['skin'])                     # face opening


def phg_bald(c, s, dy):  # monk
    cy = 22 + dy
    c.rect(25, cy + 1, 27, cy + 4, s['skin2'])                 # ear
    _sparkle(c, s, 33, cy - 9)
    pface(c, s, dy)


def phg_hood(c, s, dy):  # ranger
    _hood(c, s, dy, peak_dx=-6)
    _sparkle(c, s, 20, 8 + dy)
    pface(c, s, dy)


def phg_hood_mask(c, s, dy):  # rogue
    _hood(c, s, dy, peak_dx=-4)
    c.rect(33, 25 + dy, 42, 28 + dy, s['feat'])                # mask over mouth
    pface_eyes(c, s, dy)


def phg_hood_horned(c, s, dy):  # warlock
    _hood(c, s, dy, peak_dx=-3)
    cy = 22 + dy
    c.line(26, cy - 8, 22, cy - 15, s['bone'], 2)              # back horn
    c.line(22, cy - 15, 25, cy - 19, s['bone'], 2)
    c.line(34, cy - 9, 36, cy - 16, s['bone'], 2)              # front horn
    c.line(36, cy - 16, 33, cy - 20, s['bone'], 2)
    _sparkle(c, s, 25, cy - 19)
    pface(c, s, dy)


def phg_antlers(c, s, dy):  # druid
    cy = 22 + dy
    c.line(27, cy - 8, 24, cy - 16, s['bone'], 2)              # back antler
    c.line(24, cy - 13, 20, cy - 15, s['bone'], 2)
    c.line(34, cy - 9, 37, cy - 17, s['bone'], 2)              # front antler
    c.line(37, cy - 14, 41, cy - 16, s['bone'], 2)
    _sparkle(c, s, 20, cy - 15)
    pface(c, s, dy)


def phg_helm_winged(c, s, dy):  # paladin
    cy = 22 + dy
    c.ellipse(29, cy - 1, 11, 9, s['main'])                    # helm cap
    c.rect(22, cy - 1, 41, cy, s['trim'])                      # brow band
    c.ellipse(33, cy + 3, 8, 7, s['skin'])                     # face opening
    c.tri(24, cy - 2, 16, cy - 9, 27, cy - 4, s['accent'])     # wing upper
    c.tri(24, cy, 18, cy - 5, 27, cy - 2, s['accent'])         # wing lower
    _sparkle(c, s, 17, cy - 8)
    pface(c, s, dy)


def phg_mask(c, s, dy):  # ninja
    cy = 22 + dy
    c.ellipse(30, cy, 11, 10, s['main'])                       # full cowl
    c.rect(31, cy - 1, 42, cy + 2, s['skin'])                  # eye strip
    c.rect(18, cy + 7, 30, cy + 10, s['accent'])               # scarf wrap
    c.rect(12, cy + 5, 20, cy + 8, s['accent'])                # scarf tail
    c.tri(12, cy + 5, 12, cy + 8, 7, cy + 3, s['accent'])
    _sparkle(c, s, 9, cy + 4)
    pface_eyes(c, s, dy)


def phg_hat(c, s, dy):  # mage
    cy = 22 + dy
    c.ellipse(30, cy + 2, 14, 3, s['main'])                    # wide brim
    c.tri(22, cy - 1, 34, cy - 1, 16, cy - 14, s['main'])      # cone (back lean)
    c.rect(23, cy - 2, 34, cy, s['feat'])                      # hat band
    _sparkle(c, s, 17, cy - 12)
    pface(c, s, dy)


# ---- remaining weapons (near hand unless noted) ----------------------------

def pwp_bow(c, s, near, far, dy):  # ranger
    hx, hy = near
    c.line(hx + 2, hy - 9, hx + 5, hy, s['wood'], 2)           # upper limb
    c.line(hx + 5, hy, hx + 2, hy + 9, s['wood'], 2)           # lower limb
    c.vline(hx + 2, hy - 9, hy + 9, s['glint'])                # string


def pwp_daggers(c, s, near, far, dy):  # rogue
    hx, hy = near
    c.rect(hx - 1, hy - 1, hx + 3, hy, s['wood'])             # guard
    c.line(hx + 1, hy + 1, hx + 4, hy + 8, s['metal2'], 2)     # blade
    c.set(hx + 5, hy + 9, s['metal2'])                        # tip


def pwp_hammer(c, s, near, far, dy):  # paladin
    hx, hy = near
    c.line(hx + 2, hy - 10, hx + 2, hy + 8, s['wood'], 2)      # handle
    c.rect(hx, hy - 13, hx + 5, hy - 9, s['metal2'])          # head
    c.rect(hx, hy - 12, hx + 5, hy - 11, s['trim'])           # band
    _sparkle(c, s, hx + 5, hy - 12)


def _staff(c, s, near):
    hx, hy = near
    c.line(hx + 2, hy - 12, hx + 2, hy + 10, s['wood'], 2)     # shaft
    return hx + 2, hy


def pwp_staff_orb(c, s, near, far, dy):  # mage
    sx, hy = _staff(c, s, near)
    c.ellipse(sx, hy - 15, 3, 3, s['accent'])                 # orb
    c.set(sx - 1, hy - 16, s['glint'])
    _sparkle(c, s, sx + 2, hy - 17)


def pwp_staff_gnarled(c, s, near, far, dy):  # druid
    sx, hy = _staff(c, s, near)
    c.line(sx, hy - 12, sx + 3, hy - 16, s['wood'], 2)         # branch
    c.tri(sx + 2, hy - 16, sx + 6, hy - 16, sx + 4, hy - 20, s['accent'])  # leaf
    _sparkle(c, s, sx + 5, hy - 19)


def pwp_staff_skull(c, s, near, far, dy):  # warlock
    sx, hy = _staff(c, s, near)
    c.ellipse(sx, hy - 15, 3, 3, s['glint'])                  # skull (bone white)
    c.rect(sx - 1, hy - 16, sx, hy - 15, K)                   # eyes
    c.rect(sx + 1, hy - 16, sx + 2, hy - 15, K)
    _sparkle(c, s, sx - 2, hy - 18)


# ---- back items + remaining chest features ---------------------------------

def pbk_quiver(c, s, dy):  # ranger
    c.rect(18, 33 + dy, 23, 46 + dy, s['wood'])               # quiver on back
    c.rect(18, 33 + dy, 23, 34 + dy, s['dark'])              # rim
    c.rect(19, 28 + dy, 20, 33 + dy, s['metal2'])            # arrow shafts
    c.rect(21, 27 + dy, 22, 33 + dy, s['metal2'])


def pbk_katana(c, s, dy):  # ninja
    c.line(16, 30 + dy, 24, 48 + dy, s['dark'], 3)            # scabbard
    c.line(13, 25 + dy, 17, 31 + dy, s['wood'], 3)           # handle up-back
    c.rect(16, 30 + dy, 18, 32 + dy, s['metal'])            # guard


def pch_beads(c, s, dy):  # monk
    for x, y in ((33, 39), (35, 41), (37, 43), (38, 45)):
        c.rect(x, y + dy, x + 1, y + 1 + dy, s['feat2'])


def pch_cross(c, s, dy):  # paladin
    c.rect(34, 40 + dy, 38, 42 + dy, s['feat2'])
    c.rect(35, 39 + dy, 37, 45 + dy, s['feat2'])


PROFILE_HEADGEAR = {
    'bald': phg_bald,
    'hood': phg_hood,
    'hood_mask': phg_hood_mask,
    'antlers': phg_antlers,
    'helm_plume': phg_helm_plume,
    'helm_winged': phg_helm_winged,
    'mask': phg_mask,
    'hat': phg_hat,
    'hood_horned': phg_hood_horned,
}
PROFILE_BACKS = {
    'quiver': pbk_quiver,
    'katana': pbk_katana,
}
PROFILE_CHESTS = {
    'beads': pch_beads,
    'tabard': pch_tabard,
    'cross': pch_cross,
}
PROFILE_HANDS = {
    'bow': pwp_bow,
    'daggers': pwp_daggers,
    'sword': pwp_sword,
    'shield': pwp_shield,
    'hammer': pwp_hammer,
    'staff_orb': pwp_staff_orb,
    'staff_gnarled': pwp_staff_gnarled,
    'staff_skull': pwp_staff_skull,
}


# ---- render / pipeline -----------------------------------------------------

def render_walk(hero, s):
    return hconcat([draw_profile(hero, s, p) for p in WALK])


def gold_scheme(hero):
    s = dict(hero['scheme'])
    s.update(GOLD)
    s.update(GOLD_OVERRIDES.get(hero['name'], {}))
    return s


def onebit_scheme(hero):
    s = dict(hero['scheme'])
    s.update(ONEBIT)
    return s


def validate(c, label):
    bad = {p for row in c.px for p in row if p is not None and p not in PALETTE}
    assert not bad, f'{label}: off-palette colors {sorted(bad)}'


def build(names):
    os.makedirs(OUT_DIR, exist_ok=True)
    roster = [h for h in HEROES if not names or h['name'] in names]
    for hero in roster:
        name = hero['name']
        hero = dict(hero)
        hero['scheme'] = dict(hero['scheme'], belt_role=hero.get('belt'))
        for suffix, scheme in (('', hero['scheme']), ('_gold', gold_scheme(hero))):
            strip = render_walk(hero, scheme)
            validate(strip, name + suffix)
            strip.save(os.path.join(OUT_DIR, f'hero_{name}{suffix}_walk.png'))
        strip = render_walk(hero, onebit_scheme(hero))
        validate(strip, name + '_1bit')
        strip.save(os.path.join(OUT_DIR, f'1bit_hero_{name}_walk.png'))
        print(f'hero_{name}_walk: color + gold + 1bit ({len(WALK)}f)')


if __name__ == '__main__':
    build(set(sys.argv[1:]))
