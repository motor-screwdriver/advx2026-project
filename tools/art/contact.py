"""Build review contact sheets from the assets/_src/icons sources.

Sheets: contact_icons.png (16x16 icons x8 + tiles x16), contact_props.png
(chest frames / gravestone / tether x4), contact_logo.png (x4),
contact_1bit.png (1-bit hearts on white). Run from repo root:

  python3 tools/art/contact.py
"""

import os

from PIL import Image

SRC = 'assets/_src/icons'


def checker(w, h, cell=4):
    img = Image.new('RGBA', (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = (255, 255, 255, 255) if ((x // cell) + (y // cell)) % 2 == 0 \
                else (208, 208, 216, 255)
    return img


def load(name):
    return Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')


def up(img, factor):
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)


def sheet_icons():
    names16 = [
        'heart_full', 'heart_empty', 'heart_armor',
        'art_iron_armor', 'art_phoenix_feather', 'art_hourglass',
        'art_coffee_amulet', 'art_alarm_bell', 'art_warm_blanket',
        'art_night_watch', 'art_lucky_coin', 'art_star_map', 'art_second_wind',
        'cos_hat', 'cos_crown', 'cos_aura', 'cos_pet', 'cos_frame',
        'cos_plant', 'cos_scarf', 'cos_mask',
    ]
    tiles = ['tile_gold', 'tile_gray', 'tile_black']
    cell, cols = 136, 6
    rows = (len(names16) + cols - 1) // cols
    img = checker(cols * cell, (rows + 1) * cell)
    for i, n in enumerate(names16):
        ic = up(load(n), 8)
        img.paste(ic, ((i % cols) * cell + 4, (i // cols) * cell + 4), ic)
    for j, n in enumerate(tiles):
        ic = up(load(n), 16)
        img.paste(ic, (j * cell + 4, rows * cell + 4), ic)
    img.save(os.path.join(SRC, 'contact_icons.png'))


def sheet_props():
    chest = load('chest')
    frames = [up(chest.crop((i * 48, 0, (i + 1) * 48, 48)), 4) for i in range(3)]
    grave = up(load('gravestone'), 4)
    bar = up(load('tether_bar'), 4)
    zone = up(load('tether_zone'), 4)
    cur = up(load('tether_cursor'), 4)
    img = checker(1048, 8 + 192 + 16 + 128 + 16 + 128 + 16 + 128 + 8)
    x = 8
    for f in frames:
        img.paste(f, (x, 8), f)
        x += 200
    img.paste(grave, (x, 8), grave)
    y = 208
    img.paste(bar, (8, y), bar)
    y += 144
    img.paste(zone, (8, y), zone)
    y += 144
    img.paste(cur, (496, y), cur)
    img.save(os.path.join(SRC, 'contact_props.png'))


def sheet_logo():
    logo = up(load('logo'), 4)
    icon = up(load('app_icon'), 4)
    img = checker(8 + 1024 + 16 + 1024 + 8, 1024 + 16)
    img.paste(logo, (8, 8), logo)
    img.paste(icon, (1040, 8), icon)
    img.save(os.path.join(SRC, 'contact_logo.png'))


def sheet_1bit():
    img = Image.new('RGBA', (8 + 128 + 16 + 128 + 8, 128 + 16), (255, 255, 255, 255))
    a = up(load('1bit_heart_full'), 8)
    b = up(load('1bit_heart_empty'), 8)
    img.paste(a, (8, 8), a)
    img.paste(b, (152, 8), b)
    img.save(os.path.join(SRC, 'contact_1bit.png'))


if __name__ == '__main__':
    sheet_icons()
    sheet_props()
    sheet_logo()
    sheet_1bit()
    print('contact sheets written')
