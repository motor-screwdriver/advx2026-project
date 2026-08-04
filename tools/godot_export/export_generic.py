"""Export manifest-driven assets into the Godot pack — used art only.

Covers the clean, uniform art in `assets/` that the shipping game actually
references: idle hero strips (color + 1-bit), the chest and Luma-guide
sprites, the live icons (equippable artifacts/cosmetics, hearts, guide book)
the in-use atmosphere layers (day/night clouds, sun, moon, grass) and the
cut UI elements from the design drops.

Dead weight is deliberately dropped, not exported: the gold/walk hero
variants and gravestone (no call site ever selects them), the result-scene
banner strips (`SceneBanner` is unused), off-roster icons, the parallax
props that belonged to the abandoned journey build, and stale design mockups
(book transition, chest-open scene, old tutorial pages, spare toggle knob).

Fullscreen composites (Luma scenes, start screen, night results) and the
journey set have their own export modules — they need re-slicing, not
just repackaging.

Run: python3 tools/godot_export/export_generic.py  (or export_all.py)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import manifest_lib  # noqa: E402
from godot_export import core  # noqa: E402

# Playback rates observed in the RN code (PixelSprite default is 2 fps;
# OracleStage slows Luma down, SceneBanner speeds result scenes up).
FPS_DEFAULT = 2
FPS_OVERRIDES = {'guide_luma': 1.5}

WALK_META = {'facing': 'left', 'note': 'flip_h in Godot to face travel direction'}
CHEST_META = {'note': 'state frames: closed / opening / open — drive by frame, not loop'}

# Extra UI art that screens require() directly, bypassing the manifest.
EXTRA_UI = {
    'buttons': {
        'btn_gold': 'buttons/gen/btn_gold.png',
        'btn_gold_pressed': 'buttons/gen/btn_gold_pressed.png',
        'btn_wood_compact': 'buttons/gen/btn_wood_compact.png',
        'btn_wood_compact_pressed': 'buttons/gen/btn_wood_compact_pressed.png',
    },
    'mosaic': {
        'btn_back': 'design/gen/mosaic/btn_back.png',
        'btn_back_pressed': 'design/gen/mosaic/btn_back_pressed.png',
        'tile_bad': 'design/gen/mosaic/tile_bad.png',
        'tile_good': 'design/gen/mosaic/tile_good.png',
        'tile_perfect': 'design/gen/mosaic/tile_perfect.png',
    },
    'tutorial': {
        'step1': 'design/tutorial/step1.png',
        'step2': 'design/tutorial/step2.png',
        'step3': 'design/tutorial/step3.png',
        'btn_next': 'design/tutorial/btn_next.png',
        'btn_next_pressed': 'design/tutorial/btn_next_pressed.png',
        'btn_skip': 'design/tutorial/btn_skip.png',
        'btn_skip_pressed': 'design/tutorial/btn_skip_pressed.png',
    },
}

# design-section key prefix -> ui/ subfolder.
DESIGN_GROUPS = {'bag': 'bag', 'chest': 'chest', 'gen': 'misc',
                 'onboarding': 'onboarding', 'settings': 'settings'}

# --- usage filters (see module docstring) -----------------------------------

# Icons the game actually renders: hearts, the guide book, the 9 equippable
# artifacts (bagMeta `art_<id>`) and the 4 cosmetics (`cos_<id>`).
ICON_ALLOW = {
    'heart_full', 'heart_empty', 'guide_sleep_book',
    'art_alarm_bell', 'art_coffee_amulet', 'art_hourglass', 'art_iron_armor',
    'art_lucky_coin', 'art_night_watch', 'art_phoenix_feather',
    'art_second_wind', 'art_warm_blanket',
    'cos_hat', 'cos_aura', 'cos_pet', 'cos_frame',
}

# Stale design mockups that no screen requires.
DESIGN_SKIP = {
    'gen_book_page_right_crop', 'gen_booktransition_scene', 'gen_chest_open_scene',
    'gen_tutorial_p1', 'gen_tutorial_p2', 'gen_tutorial_p3', 'settings_toggle_knob',
}


def _sprite_used(name):
    """HeroCeremony renders only idle color heroes; einkCard only idle 1-bit."""
    return not (name == 'gravestone' or name.endswith('_walk') or '_gold' in name)


def _atmo_used(name):
    """Only the DayNightBackground layers survive; the parallax props do not."""
    return (name.startswith(('cloud_a_', 'cloud_b_', 'grass_'))
            or name in {'sun_morning', 'sun_day', 'sun_evening', 'moon_night'})


def _fps(name):
    return FPS_OVERRIDES.get(name, FPS_DEFAULT)


def _export_strip_entry(category, subdir, name, entry, fps, loop=True, meta=None):
    strip = core.load_image('assets/' + entry['path'])
    frames = core.slice_strip(strip, entry['frames'])
    core.save_animation(category, subdir, name, frames, fps, loop, meta=meta)


def export_sprites(data, section, out_root):
    print(f'-- {section}')
    for name, entry in sorted(data[section].items()):
        if not _sprite_used(name):
            continue
        subdir = f'{out_root}/heroes' if name.startswith('hero_') else f'{out_root}/misc'
        if entry['frames'] == 1:
            core.save_static(section, subdir, name, core.load_image('assets/' + entry['path']))
            continue
        meta = WALK_META if name.endswith('_walk') else None
        loop = True
        if name == 'chest':
            meta, loop = CHEST_META, False
        _export_strip_entry(section, subdir, name, entry, _fps(name), loop, meta)


def export_singles(data, section, subdir, keep=None):
    print(f'-- {section}')
    for name, entry in sorted(data[section].items()):
        if keep is not None and not keep(name):
            continue
        core.save_static(section, subdir, name, core.load_image('assets/' + entry['path']))


def export_ui(data):
    print('-- ui (design)')
    for name, entry in sorted(data['design'].items()):
        if name in DESIGN_SKIP:
            continue
        group, _, rest = name.partition('_')
        folder = DESIGN_GROUPS[group]
        core.save_static('ui', f'ui/{folder}', rest, core.load_image('assets/' + entry['path']))
    print('-- ui (extra)')
    for folder, files in EXTRA_UI.items():
        for name, path in sorted(files.items()):
            core.save_static('ui', f'ui/{folder}', name, core.load_image('assets/' + path))


def run():
    data = manifest_lib.load_data()
    export_sprites(data, 'sprites', 'sprites')
    export_sprites(data, 'sprites_1bit', 'sprites_1bit')
    # scene_* result banners are unused (SceneBanner); start_* crops belong to
    # export_start_screen — so the scenes section ships nothing here.
    export_singles(data, 'icons', 'icons', keep=ICON_ALLOW.__contains__)
    export_singles(data, 'atmosphere', 'atmosphere', keep=_atmo_used)
    export_ui(data)


if __name__ == '__main__':
    run()
    core.write_manifest()
