"""Gear layer for the chibi heroes: back items, chest details, hand weapons.

All coordinates assume the shared body built by heroes.body(): torso
x24..40 y37..48, skirt x22..42 y48..56, hands at (21..23, 47..49) and
(41..43, 47..49), head ellipse (32,26) rx11 ry10.
"""

from colors import K


# ---- back items (drawn behind the body) ------------------------------------

def bk_quiver(c, s):  # ranger — quiver + arrows peeking over the left shoulder
    c.rect(18, 24, 22, 36, s['wood'])
    c.rect(18, 24, 22, 25, s['dark'])  # rim
    c.rect(18, 19, 19, 21, s['metal2'])  # arrow tips
    c.rect(21, 18, 22, 20, s['metal2'])


def bk_katana(c, s):  # ninja — scabbard diagonal, handle above left shoulder
    c.line(22, 6, 28, 14, s['wood'], 3)  # handle poking up
    c.rect(28, 13, 31, 15, s['metal'])  # guard
    c.line(29, 14, 41, 36, s['dark'], 3)  # scabbard (mostly hidden)


# ---- chest details ----------------------------------------------------------

def ch_beads(c, s):  # monk prayer beads — a bold 2px-dot arc
    for x, y in ((26, 38), (29, 40), (32, 41), (35, 40), (38, 38)):
        c.rect(x, y, x + 1, y + 1, s['feat2'])


def ch_tabard(c, s):  # knight tabard with a pointed hem
    c.rect(28, 39, 36, 52, s['trim'])
    c.tri(28, 52, 36, 52, 32, 56, s['trim'])


def ch_cross(c, s):  # paladin chest cross (bold 1-bit feature)
    c.rect(30, 40, 34, 42, s['feat2'])
    c.rect(31, 39, 33, 45, s['feat2'])


# ---- hand weapons -------------------------------------------------------------

def wp_bow(c, s):  # ranger, right hand — tall chevron limbs + string
    c.line(47, 28, 50, 39, s['wood'], 2)
    c.line(50, 39, 47, 50, s['wood'], 2)
    c.vline(47, 29, 49, s['glint'])  # string
    c.rect(43, 41, 47, 45, s['main'])  # extended sleeve
    c.rect(45, 40, 48, 43, s['skin'])  # grip hand


def wp_daggers(c, s):  # rogue — angled blades jutting past the silhouette
    for hx, tipx in ((22, 16), (42, 48)):
        c.rect(hx - 2, 48, hx + 2, 49, s['wood'])  # guard
        c.line(hx, 50, tipx, 56, s['metal2'], 2)  # blade
        c.set(tipx, 57, s['metal2'])  # tip


def wp_sword(c, s):  # knight, right hand — raised sword
    c.rect(45, 27, 47, 43, s['metal2'])  # blade
    c.tri(45, 27, 47, 27, 46, 25, s['metal2'])  # tip
    c.rect(43, 44, 49, 46, s['accent'])  # gold guard
    c.rect(45, 47, 47, 50, s['wood'])  # grip
    c.rect(40, 42, 44, 47, s['main'])  # sleeve connector
    c.rect(42, 44, 45, 47, s['skin'])  # hand


def wp_shield(c, s):  # knight, left arm — heater shield with cross
    c.rect(14, 38, 22, 46, s['trim'])
    c.tri(14, 46, 22, 46, 18, 52, s['trim'])  # point
    c.rect(16, 40, 20, 42, s['feat2'])  # cross arms
    c.rect(17, 39, 19, 45, s['feat2'])  # cross stem
    if s.get('sparkle'):
        c.set(18, 48, s['sparkle'])


def wp_hammer(c, s):  # paladin, right hand — war hammer
    c.line(46, 30, 46, 57, s['wood'], 2)  # handle
    c.rect(43, 24, 49, 29, s['metal2'])  # head
    c.rect(43, 26, 49, 27, s['trim'])  # gold band
    c.rect(40, 42, 45, 47, s['main'])
    c.rect(43, 44, 46, 47, s['skin'])
    if s.get('sparkle'):
        c.set(48, 25, s['sparkle'])


def _staff_arm(c, s):
    c.rect(40, 43, 45, 47, s['main'])  # sleeve connector
    c.rect(43, 45, 47, 48, s['skin'])  # hand on the shaft


def wp_staff_orb(c, s):  # mage — staff with glowing orb
    c.line(47, 27, 47, 58, s['wood'], 2)
    c.ellipse(47, 23, 3, 3, s['accent'])  # orb
    c.set(46, 22, s['glint'])  # orb glint
    _staff_arm(c, s)
    if s.get('sparkle'):
        c.set(49, 21, s['sparkle'])


def wp_staff_gnarled(c, s):  # druid — gnarled staff with a leaf tuft
    c.line(47, 31, 47, 58, s['wood'], 2)
    c.line(47, 31, 50, 27, s['wood'], 2)  # branch
    c.ellipse(47, 28, 2, 2, s['wood'])  # knot
    c.tri(48, 25, 52, 25, 50, 21, s['accent'])  # leaves
    _staff_arm(c, s)
    if s.get('sparkle'):
        c.set(50, 22, s['sparkle'])


def wp_staff_skull(c, s):  # warlock — skull-topped staff
    c.line(47, 29, 47, 58, s['wood'], 2)
    c.ellipse(47, 24, 3, 3, s['glint'])  # skull (always bone white)
    c.rect(44, 23, 45, 24, K)  # skull eyes
    c.rect(48, 23, 49, 24, K)
    _staff_arm(c, s)
    if s.get('sparkle'):
        c.set(45, 21, s['sparkle'])


BACKS = {'quiver': bk_quiver, 'katana': bk_katana}
CHESTS = {'beads': ch_beads, 'tabard': ch_tabard, 'cross': ch_cross}
HANDS = {
    'bow': wp_bow,
    'daggers': wp_daggers,
    'sword': wp_sword,
    'shield': wp_shield,
    'hammer': wp_hammer,
    'staff_orb': wp_staff_orb,
    'staff_gnarled': wp_staff_gnarled,
    'staff_skull': wp_staff_skull,
}
