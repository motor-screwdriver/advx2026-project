"""Face + headgear layer for the 9 chibi heroes (shared construction).

Head origin for every hero: skin ellipse at (32,26) rx11 ry10.
Each headgear function paints its shapes and then calls one of the shared
face helpers, so the face stays pixel-identical across the roster.
"""

from colors import K, W  # noqa: F401  (K/W used by scheme defaults elsewhere)


def face_skin(c, s):
    """The ONE face: identical on every bare-faced hero."""
    c.hline(28, 36, 35, s['skin2'])  # chin shade
    c.rect(26, 25, 27, 26, s['eye'])
    c.rect(36, 25, 37, 26, s['eye'])
    c.hline(31, 32, 30, s['eye'])  # tiny mouth


def face_eyes(c, s):
    """Masked heroes keep the same eyes, lose the mouth."""
    c.rect(26, 25, 27, 26, s['eye'])
    c.rect(36, 25, 37, 26, s['eye'])


def _sparkle(c, s, x, y):
    if s.get('sparkle'):
        c.set(x, y, s['sparkle'])


def hg_bald(c, s):  # monk
    _sparkle(c, s, 37, 19)
    face_skin(c, s)


def hg_hood(c, s):  # ranger — pointy green hood with a dark rim
    c.ellipse(32, 24, 13, 12, s['main'])
    c.tri(29, 14, 35, 14, 32, 8, s['main'])
    c.ellipse(32, 27, 11, 9, s['trim'])  # hood rim (vanishes in 1-bit)
    c.ellipse(32, 28, 10, 8, s['skin'])  # face opening
    c.rect(21, 33, 25, 40, s['main'])  # drape over shoulders
    c.rect(39, 33, 43, 40, s['main'])
    _sparkle(c, s, 32, 9)
    face_skin(c, s)


def hg_hood_mask(c, s):  # rogue — dark hood + mask band over the mouth
    c.ellipse(32, 24, 13, 12, s['main'])
    c.tri(29, 14, 35, 14, 31, 9, s['main'])
    c.ellipse(32, 28, 10, 8, s['skin'])
    c.rect(26, 29, 38, 33, s['feat'])  # face mask
    c.rect(21, 33, 25, 40, s['main'])
    c.rect(39, 33, 43, 40, s['main'])
    _sparkle(c, s, 31, 10)
    face_eyes(c, s)


def hg_antlers(c, s):  # druid — branching antlers, bare face
    c.line(24, 19, 23, 10, s['bone'], 2)
    c.line(23, 13, 19, 9, s['bone'], 2)
    c.line(24, 17, 20, 15, s['bone'], 2)
    c.line(40, 19, 41, 10, s['bone'], 2)
    c.line(41, 13, 45, 9, s['bone'], 2)
    c.line(40, 17, 44, 15, s['bone'], 2)
    _sparkle(c, s, 19, 8)
    _sparkle(c, s, 45, 8)
    face_skin(c, s)


def hg_helm_plume(c, s):  # knight — enclosed helm, slit + glints, red plume
    c.ellipse(32, 25, 12, 11, s['main'])
    c.rect(24, 22, 40, 23, s['dark'])  # visor ridge
    c.rect(25, 24, 39, 27, s['feat'])  # eye slit (always dark)
    c.rect(27, 25, 28, 26, s['glint'])
    c.rect(35, 25, 36, 26, s['glint'])
    c.rect(31, 28, 33, 33, s['main'])  # nose guard
    c.rect(29, 9, 34, 14, s['accent'])  # plume base
    c.tri(29, 9, 34, 9, 38, 5, s['accent'])  # flame tip sweeping right
    _sparkle(c, s, 36, 7)


def hg_helm_winged(c, s):  # paladin — open-face helm with side wings
    c.ellipse(32, 23, 12, 9, s['main'])
    c.rect(22, 20, 42, 21, s['trim'])  # brow band
    c.ellipse(32, 29, 10, 7, s['skin'])  # face opening
    c.tri(22, 20, 15, 10, 28, 15, s['accent'])  # left wing, upper feather
    c.tri(22, 22, 18, 16, 27, 19, s['accent'])  # left wing, lower feather
    c.tri(42, 20, 49, 10, 36, 15, s['accent'])  # right wing, upper feather
    c.tri(42, 22, 46, 16, 37, 19, s['accent'])  # right wing, lower feather
    _sparkle(c, s, 16, 11)
    _sparkle(c, s, 48, 11)
    face_skin(c, s)


def hg_mask(c, s):  # ninja — full mask with eye strip + flowing red scarf
    c.ellipse(32, 25, 12, 11, s['main'])
    c.rect(23, 24, 41, 28, s['skin'])  # eye strip
    face_eyes(c, s)
    c.rect(24, 34, 40, 37, s['accent'])  # scarf wrap
    c.rect(38, 31, 47, 33, s['accent'])  # scarf tail
    c.tri(47, 31, 47, 33, 52, 29, s['accent'])
    _sparkle(c, s, 50, 30)


def hg_hat(c, s):  # mage — wide pointy hat with a bold band
    c.tri(24, 17, 40, 17, 31, 6, s['main'])  # cone
    c.line(31, 6, 30, 5, s['main'], 2)  # tip
    c.ellipse(32, 19, 14, 3, s['main'])  # wide brim
    c.rect(26, 14, 38, 16, s['feat'])  # hat band
    _sparkle(c, s, 30, 5)
    face_skin(c, s)


def hg_hood_horned(c, s):  # warlock — horned hood
    c.ellipse(32, 24, 13, 12, s['main'])
    c.tri(30, 13, 34, 13, 33, 8, s['main'])  # hood peak
    c.ellipse(32, 28, 10, 8, s['skin'])
    c.line(22, 18, 17, 11, s['bone'], 2)  # left horn
    c.line(17, 11, 20, 6, s['bone'], 2)
    c.line(42, 18, 47, 11, s['bone'], 2)  # right horn
    c.line(47, 11, 44, 6, s['bone'], 2)
    _sparkle(c, s, 20, 5)
    _sparkle(c, s, 44, 5)
    face_skin(c, s)


HEADGEAR = {
    'bald': hg_bald,
    'hood': hg_hood,
    'hood_mask': hg_hood_mask,
    'antlers': hg_antlers,
    'helm_plume': hg_helm_plume,
    'helm_winged': hg_helm_winged,
    'mask': hg_mask,
    'hat': hg_hat,
    'hood_horned': hg_hood_horned,
}
