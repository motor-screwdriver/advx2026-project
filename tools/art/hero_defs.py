"""Hero roster for 8bit Sleep — pure data: color schemes + gear specs.

Every hero is drawn by the SAME construction code (heroes.draw_hero); only
these scheme colors and gear-key strings differ. Scheme roles:
  skin/skin2  face + hands (unchanged in gold; white in 1-bit)
  main/dark   robe or armor base / shadow
  trim        secondary clothing color (tabard, shield face, brow band)
  feat/feat2  the bold interior features — in 1-bit these are the ONLY
              allowed interior marks besides the eyes (belt, mask band,
              hat band, slit, cross, beads), so every hero uses <= 2.
  metal/metal2  weapon metal / highlight
  wood/bone     staffs, bow limbs / antlers, horns
  accent      plume, scarf, orb, wings, leaves
  glint       always-on white glint (orb spark, slit eyes, skull)
  sparkle     set only in the gold scheme: W sparkle accent pixels
"""

from colors import (
    B0, B1, B2, BR0, BR1, BR2,
    G0, G1, G2, GR0, GR1, GR2, GY0, GY1, GY2,
    K, P0, P1, P2, P3, R0, R1, SK0, SK1, W,
)


def _base(**kw):
    s = dict(
        skin=SK0, skin2=SK1, eye=K, glint=W,
        metal=GY1, metal2=GY2, wood=BR1, bone=BR2,
        sparkle=None,
    )
    s.update(kw)
    return s


HEROES = [
    dict(name='monk', headgear='bald', chest='beads', belt=True, bare_arm_r=True,
         scheme=_base(main=G1, dark=G0, trim=R1, feat=R1, feat2=BR0, accent=R1)),
    dict(name='ranger', headgear='hood', back='quiver', hand_r='bow', belt=True,
         scheme=_base(main=GR1, dark=GR0, trim=BR1, feat=BR1, accent=GR2, wood=BR2)),
    dict(name='druid', headgear='antlers', hand_r='staff_gnarled', belt=True,
         scheme=_base(main=GR2, dark=GR1, trim=BR2, feat=BR2, accent=GR1, wood=BR1)),
    dict(name='rogue', headgear='hood_mask', hand_l='daggers', belt=True,
         scheme=_base(main=GY0, dark=P0, trim=GY1, feat=GY1, accent=R0)),
    dict(name='knight', headgear='helm_plume', hand_r='sword', hand_l='shield',
         chest='tabard', belt=False,
         scheme=_base(main=GY1, dark=GY0, trim=B1, feat=K, feat2=G2, accent=R1, wood=BR0)),
    dict(name='paladin', headgear='helm_winged', hand_r='hammer', chest='cross', belt=True,
         scheme=_base(main=W, dark=GY2, trim=G1, feat=G0, feat2=G2, accent=G2)),
    dict(name='ninja', headgear='mask', back='katana', belt=True,
         scheme=_base(main=B0, dark=P0, trim=GY1, feat=GY1, accent=R1, wood=BR0)),
    dict(name='mage', headgear='hat', hand_r='staff_orb', belt=True,
         scheme=_base(main=B1, dark=B0, trim=P2, feat=P2, accent=B2)),
    dict(name='warlock', headgear='hood_horned', hand_r='staff_skull', belt=True,
         scheme=_base(main=P1, dark=P0, trim=P3, feat=P3, accent=P3, bone=GY2, wood=BR0)),
]

# Golden skins: identical silhouette, clothing recolored to the gold ramp
# (G0 shadow / G1 base / G2 highlight, W sparkle). Skin, eyes, outline stay.
GOLD = dict(main=G1, dark=G0, trim=G2, feat=G0, feat2=G2, accent=G2,
            metal=G1, metal2=G2, wood=G0, bone=G2, sparkle=W)
GOLD_OVERRIDES = {
    'monk': dict(feat2=G0),            # beads must contrast the gold robe
    'knight': dict(feat=K, feat2=G0),  # slit stays dark; cross on gold shield
}

# 1-bit e-ink scheme: white fill, black outline + bold features only.
ONEBIT = dict(skin=W, skin2=W, main=W, dark=W, trim=W, accent=W,
              metal=W, metal2=W, wood=W, bone=W, feat=K, feat2=K,
              sparkle=None)
