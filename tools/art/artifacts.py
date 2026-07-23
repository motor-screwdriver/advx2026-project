"""Artifact icons, 16x16 (PROMPT: bold single-object glyphs, K outline).

Run from repo root:  python3 tools/art/artifacts.py
"""

from canvas import Canvas
from colors import K, W, BG1, B0, B1, B2, BR0, BR1, BR2, R0, R1, R2, \
    G0, G1, G2, T0, T1, GY0, GY1, GY2
from drawutil import blit, mirror, save

OUT = 'assets/_src/icons'


def art_iron_armor():
    halves = [
        '........',
        '..KKK...',
        '.KaaaaK.',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '.Kaaaaaa',
        '..Kaaaaa',
        '..Kaaaaa',
        '...Kaaaa',
        '...Kaaaa',
        '....KKKK',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'a': GY1})
    for x, y in ((2, 2), (3, 2), (2, 3), (3, 3)):
        c.set(x, y, GY2)  # shoulder shine
    for y in range(3, 10):
        c.set(13, y, GY0)  # right edge shade
    for x, y in ((12, 10), (12, 11), (11, 12), (11, 13)):
        c.set(x, y, GY0)
    for x, y in ((7, 5), (8, 5), (7, 8), (8, 8)):
        c.set(x, y, G1)  # rivets
    return c


def art_phoenix_feather():
    rows = [
        '................',
        '............KK..',
        '...........KggK.',
        '..........KgggK.',
        '.........KgoooK.',
        '........KoooooK.',
        '.......KooorrrK.',
        '......KoorrrrK..',
        '.....KorrrrrK...',
        '....KorrrKK.....',
        '....KqrrK.K.....',
        '...KqqrK........',
        '...KqqK.........',
        '..KqK...........',
        '..KK............',
        '................',
    ]
    c = Canvas(16, 16)
    blit(c, rows, {'K': K, 'g': G2, 'o': R2, 'r': R1, 'q': W})
    # central shaft
    for x, y in ((5, 9), (6, 8), (7, 7), (8, 6), (9, 5), (10, 4), (11, 3)):
        c.set(x, y, W)
    return c


def art_hourglass():
    halves = [
        '........',
        '.Kgggggg',
        '.Kgggggg',
        '..Kddddd',
        '...Kdddd',
        '....Kddd',
        '.....Kww',
        '......KK',
        '.....Kdw',
        '....Kdww',
        '....Kwww',
        '...Kwwww',
        '..Kwwwww',
        '.Kgggggg',
        '.Kgggggg',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'g': G1, 'd': BG1, 'w': W})
    c.hline(2, 13, 2, G0)   # top bar bevel
    c.hline(2, 13, 14, G0)  # bottom bar bevel
    c.set(2, 1, G2)
    c.set(3, 1, G2)
    return c


def art_coffee_amulet():
    rows = [
        '.K............K.',
        '..K..........K..',
        '...K........K...',
        '....K......K....',
        '....K......K....',
        '....KKKKKKKK....',
        '....KwwwwwwK....',
        '....KbbbbbbKKK..',
        '....KbbbbbbK.K..',
        '....KbbbbbbK.K..',
        '....KbbbbbbKKK..',
        '....KbbbbbbK....',
        '....KbbbbbbK....',
        '....KKKKKKKK....',
        '................',
        '................',
    ]
    c = Canvas(16, 16)
    blit(c, rows, {'K': K, 'w': W, 'b': BR1})
    for x, y in ((5, 7), (6, 7), (5, 8)):
        c.set(x, y, BR2)  # mug shine
    for y in range(7, 13):
        c.set(10, y, BR0)  # right shade
    c.set(5, 6, BR2)
    return c


def art_alarm_bell():
    halves = [
        '........',
        '......KK',
        '.....Kgg',
        '....Kggg',
        '...Kgggg',
        '...Kgggg',
        '..Kggggg',
        '..Kggggg',
        '..Kggggg',
        '..Kggggg',
        '.Kgggggg',
        '.KGGGGGG',
        '.....Kvv',
        '......KK',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'g': G1, 'G': G0, 'v': GY0})
    for x, y in ((4, 4), (5, 4), (4, 5), (3, 6)):
        c.set(x, y, G2)  # left shine
    for x, y in ((11, 4), (12, 6), (12, 7), (12, 8), (12, 9)):
        c.set(x, y, G0)  # right shade
    return c


def art_warm_blanket():
    halves = [
        '........',
        '........',
        '........',
        '.KKKKKKK',
        '.Kffffff',
        '.Kffffff',
        '.Kffffff',
        '.KKKKKKK',
        '.Krrrrrr',
        '.Krrrrrr',
        '.Krrrrrr',
        '.Krrrrrr',
        '.Krrrrrr',
        '.KKKKKKK',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'f': R2, 'r': R1})
    # check pattern: W stripes (skipping the K fold seam at y=7)
    for y in range(4, 13):
        if y == 7:
            continue
        c.set(5, y, W)
        c.set(10, y, W)
    for x in range(2, 14):
        c.set(x, 5, W)
        c.set(x, 10, W)
    return c


def art_night_watch():
    halves = [
        '.......K',
        '......K.',
        '....KKKK',
        '...Kbbbb',
        '..Kbbbbb',
        '....Kyyy',
        '....Kyww',
        '....Kyww',
        '....Kyww',
        '....Kyww',
        '....Kyyy',
        '...Kbbbb',
        '...KKKKK',
        '........',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'b': B1, 'y': G2, 'w': W})
    c.set(4, 3, B2)
    c.set(5, 3, B2)      # hood shine
    c.set(11, 3, B0)
    c.set(12, 4, B0)     # hood shade
    c.set(7, 5, W)
    c.set(8, 5, W)       # candle flame tip
    return c


def art_lucky_coin():
    c = Canvas(16, 16)
    c.ellipse_o(7, 7, 5, 5, G1, K)
    c.ellipse(7, 7, 4, 4, G0)
    c.ellipse(7, 7, 3, 3, G1)
    for x, y in ((7, 5), (7, 6), (7, 8), (7, 9), (5, 7), (6, 7), (8, 7), (9, 7),
                 (6, 6), (8, 6), (6, 8), (8, 8)):
        c.set(x, y, G2)
    c.set(7, 7, W)       # star core
    c.set(3, 3, W)       # rim shine
    return c


def art_star_map():
    halves = [
        '........',
        '.Kbbbbbb',
        'Kbbbbbbb',
        '.Kbbbbbb',
        '..Kddddd',
        '..Kddddd',
        '..Kddddd',
        '..Kddddd',
        '..Kddddd',
        '..Kddddd',
        '..Kddddd',
        '.Kbbbbbb',
        'Kbbbbbbb',
        '.Kbbbbbb',
        '........',
        '........',
    ]
    c = Canvas(16, 16)
    blit(c, mirror(halves), {'K': K, 'b': B1, 'd': B0})
    for x, y in ((4, 5), (7, 6), (5, 8), (9, 9), (11, 7), (6, 10)):
        c.set(x, y, W)  # stars
    for x, y in ((10, 4), (10, 6), (9, 5), (11, 5), (10, 5)):
        c.set(x, y, G2)  # one bright sparkle star
    c.hline(2, 13, 3, B0)
    c.hline(2, 13, 13, B0)  # roll undersides
    return c


def art_second_wind():
    rows = [
        '................',
        '.....KKKKK......',
        '...KKtttttKK....',
        '..KtttttttttK...',
        '..KttKKKKtttK...',
        '.KttK....KtttK..',
        '.KtK..KK..KtK...',
        '.KtK.KttK.KtK...',
        '.KtK.KttK.KtK...',
        '.KttK.KKKtK.....',
        '..KttK..KttK....',
        '..KtttKKtttK....',
        '...KtttttttK....',
        '.....KKKKKK.....',
        '................',
        '................',
    ]
    c = Canvas(16, 16)
    blit(c, rows, {'K': K, 't': T1})
    for x, y in ((3, 3), (4, 3), (3, 4)):
        c.set(x, y, W)   # top-left glint
    for x, y in ((5, 12), (6, 12), (7, 12), (8, 12), (9, 12), (10, 12)):
        c.set(x, y, T0)  # bottom arc shade
    return c


if __name__ == '__main__':
    save(art_iron_armor(), f'{OUT}/art_iron_armor.png')
    save(art_phoenix_feather(), f'{OUT}/art_phoenix_feather.png')
    save(art_hourglass(), f'{OUT}/art_hourglass.png')
    save(art_coffee_amulet(), f'{OUT}/art_coffee_amulet.png')
    save(art_alarm_bell(), f'{OUT}/art_alarm_bell.png')
    save(art_warm_blanket(), f'{OUT}/art_warm_blanket.png')
    save(art_night_watch(), f'{OUT}/art_night_watch.png')
    save(art_lucky_coin(), f'{OUT}/art_lucky_coin.png')
    save(art_star_map(), f'{OUT}/art_star_map.png')
    save(art_second_wind(), f'{OUT}/art_second_wind.png')
