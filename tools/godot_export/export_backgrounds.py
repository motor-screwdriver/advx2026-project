"""Export the fullscreen backgrounds and their overlay sprites.

These screens are authored as whole paintings and stay that way — one
static background texture per screen is the correct game-dev shape here
(the app only overlays hotspots/labels/glow on top):

  * death        — assets/design/gen/death/sheet.png (1080x1920), the sheet
                   DeathSheet.tsx actually loads (the 2160x3840 death_screen
                   source is not referenced by the app);
  * night_*      — the five night-result sheets (only the 1080x1920 frame-1
                   copies survive in the repo; the *_f2 re-renders were
                   rejected art) + the radial glow sprite the app breathes
                   over the sun/moon;
  * mosaic       — year-mosaic backdrop (raw mockup is gone; best copy);
  * tether       — Soul Tether mini-game sheet (assets/design/gen/tether/
                   sheet.png, 1125x1999, the copy SoulTetherSheet.tsx loads)
                   + star;
  * cloud_curtain — the fullscreen transition curtain.

Run: python3 tools/godot_export/export_backgrounds.py  (or export_all.py)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from godot_export import core  # noqa: E402

BACKGROUNDS = {
    'death': 'assets/design/gen/death/sheet.png',
    'night_perfect': 'assets/design/gen/night/perfect_1.png',
    'night_good': 'assets/design/gen/night/good_1.png',
    'night_bad': 'assets/design/gen/night/bad_1.png',
    'night_terrible': 'assets/design/gen/night/terrible_1.png',
    'night_missed': 'assets/design/gen/night/missed_1.png',
    'mosaic': 'assets/design/gen/mosaic/bg.png',
    'tether': 'assets/design/gen/tether/sheet.png',
}

SPRITES = {
    'glow': ('assets/design/gen/night/glow.png',
             {'note': 'white radial alpha — tint per outcome, breathe over the sun/moon'}),
    'tether_star': ('assets/design/gen/tether/star.png', None),
    'cloud_curtain': ('assets/design/gen/cloud_curtain.png',
                      {'note': 'fullscreen transition curtain'}),
}


def run():
    print('-- backgrounds')
    for name, path in sorted(BACKGROUNDS.items()):
        core.save_static('backgrounds', 'backgrounds', name,
                         core.load_image(path, 'RGB'), 'background')
    for name, (path, meta) in sorted(SPRITES.items()):
        core.save_static('backgrounds', 'backgrounds', name,
                         core.load_image(path), meta=meta)


if __name__ == '__main__':
    run()
    core.write_manifest()
