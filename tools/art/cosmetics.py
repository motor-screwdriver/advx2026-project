"""Cosmetic icons, 16x16.

Run from repo root:  python3 tools/art/cosmetics.py
"""

from canvas import Canvas
from colors import K, W, BG1, P0, P1, P2, PK, R0, R1, R2, G0, G1, G2, \
    GR0, GR1, GR2, B2, T0, T1, BR0, BR1, BR2, GY0, GY1, SK1
from drawutil import blit, mirror, save

OUT = 'assets/_src/icons'


def cos_hat():
    rows = [
        '................',
        '.........KKK....',
        '........KppK....',
        '........KpppK...',
        '.......KppppK...',
        '.......KpppppK..',
        '......KppppppK..',
        '......KpppppppK.',
        '.....KppppppppK.',
        '.....KggggggggK.',
        '.....KgguuggggK.',
        '..KppppppppppppK',
        '.KdddddddddddddK',
        '.KKKKKKKKKKKKKKK',
        '................',
        '................',
    ]
    c = Canvas(16, 16)
    blit(c, rows, {'K': K, 'p': P1, 'g': G1, 'u': G2, 'd': P0})
    for x, y in ((8, 5), (7, 6), (7, 7)):
        c.set(x, y, P2)  # cone shine
    c.set(11, 4, W)      # hat star
    return c


def cos_crown():
    halves = [
        '........',
        '........',
        '........',
        '.......K',
        '......KK',
        '.K..Kggg',
        '.Kg.Kggg',
        '.KggKggg',
        '.Kgggggg',
        '.Kgggggg',
        '.Kgggggg',
        '.Kgwgggr',
        '.Kgwgggr',
        '.KKKKKKK',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'g': G1, 'w': W, 'r': R1})
    for x, y in ((2, 8), (3, 8), (2, 9)):
        c.set(x, y, G2)  # left shine
    for x, y in ((13, 8), (13, 9), (13, 10)):
        c.set(x, y, G0)  # right shade
    c.set(7, 4, G2)
    c.set(8, 4, G2)      # center tip glint
    return c


def cos_aura():
    c = Canvas(16, 16)
    c.ellipse(7, 7, 7, 4, K)
    c.ellipse(7, 7, 6, 3, T1)
    c.ellipse(7, 7, 4, 1, None)  # hollow center -> two arcs
    for x, y in ((3, 4), (4, 4), (5, 4), (4, 3)):
        c.set(x, y, B2)  # top-left glow
    c.set(3, 4, W)
    for x, y in ((10, 10), (11, 10), (12, 10)):
        c.set(x, y, T0)  # bottom-right shade
    return c


def cos_pet():
    halves = [
        '........',
        '........',
        '..K.....',
        '..KwK...',
        '.KwwK...',
        '.KwwKwww',
        '.Kwwwwww',
        '.Kwwwwww',
        '.KwwEwww',
        '.KwPwwww',
        '.Kwwwwww',
        '.Kwwwwww',
        '.Kwwwwww',
        '..KKKKKK',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'w': W, 'E': K, 'P': PK})
    c.set(3, 3, PK)
    c.set(12, 3, PK)     # inner ears
    for x in (4, 5, 10, 11):
        c.set(x, 14, K)  # little paws
    return c


def cos_frame():
    halves = [
        '........',
        '.KKKKKKK',
        '.Kgggggg',
        '.Kgggggg',
        '.KgggKdd',
        '.KgggKdd',
        '.KgggKdd',
        '.KgggKdd',
        '.KgggKdd',
        '.KgggKdd',
        '.Kgggggg',
        '.Kgggggg',
        '.KKKKKKK',
        '........',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'g': G1, 'd': BG1})
    for x, y in ((2, 2), (13, 2), (2, 11), (13, 11)):
        c.set(x, y, G2)  # corner ornaments
    c.set(7, 5, G2)      # tiny moon in the portrait
    c.set(9, 7, W)
    c.set(6, 8, W)       # tiny stars
    c.vline(13, 3, 10, G0)  # right rail shade
    return c


def cos_plant():
    halves = [
        '........',
        '........',
        '......KK',
        '.....Kgg',
        '..K.Kggg',
        '.KgKgggg',
        '.KggKggg',
        '..KggKgg',
        '...KggKg',
        '.Kbbbbbb',
        '.Kbbbbbb',
        '..Kbbbbb',
        '..Kbbbbb',
        '...Kbbbb',
        '...KKKKK',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'g': GR1, 'b': BR1})
    for x, y in ((7, 3), (7, 4), (6, 5)):
        c.set(x, y, GR2)  # leaf shine
    for x, y in ((2, 5), (13, 6), (12, 7)):
        c.set(x, y, GR0)  # side-leaf shade
    c.hline(2, 13, 9, BR2)   # pot rim highlight
    c.vline(12, 11, 12, BR0)  # pot shade
    return c


def cos_scarf():
    rows = [
        '................',
        '................',
        '................',
        '..KKKKKKKKKKK...',
        '.KrrrrrrrrrrrK..',
        '.KrrrrrrrrrrrrK.',
        '.KrrrrrrrrrrrrK.',
        '.KrrrrrrrrrrrrK.',
        '..KKKKKKKKKrrK..',
        '..........KrrK..',
        '..........KrdrK.',
        '..........KrrK..',
        '..........KwwK..',
        '..........KrrK..',
        '..........K.K.K.',
        '................',
    ]
    c = Canvas(16, 16)
    blit(c, rows, {'K': K, 'r': R1, 'd': R0, 'w': W})
    c.vline(5, 4, 7, R0)   # wrap folds
    c.vline(9, 4, 7, R0)
    for x, y in ((2, 4), (3, 4), (2, 5)):
        c.set(x, y, R2)  # top-left shine
    return c


def cos_mask():
    halves = [
        '........',
        '........',
        '........',
        '........',
        '..KKKKKK',
        '.Kmmmmmm',
        '.Kmmwwmm',
        '.Kmmwwmm',
        '.Kmmmmmm',
        '..KKKKKK',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'm': GY0, 'w': W})
    c.set(2, 5, GY1)
    c.set(3, 5, GY1)     # top-left shine
    return c


if __name__ == '__main__':
    save(cos_hat(), f'{OUT}/cos_hat.png')
    save(cos_crown(), f'{OUT}/cos_crown.png')
    save(cos_aura(), f'{OUT}/cos_aura.png')
    save(cos_pet(), f'{OUT}/cos_pet.png')
    save(cos_frame(), f'{OUT}/cos_frame.png')
    save(cos_plant(), f'{OUT}/cos_plant.png')
    save(cos_scarf(), f'{OUT}/cos_scarf.png')
    save(cos_mask(), f'{OUT}/cos_mask.png')
