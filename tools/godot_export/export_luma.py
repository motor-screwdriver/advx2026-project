"""Decompose the fullscreen Luma scenes into background + a few hand-cut zones.

The RN app swaps whole 9:16 paintings (a base plus per-frame repaints) for
one talking scene. Naive per-pixel diffing shreds those hand-repaints into
dozens of stray micro-zones (an eye here, a plaque there) — worthless. So
the zones are defined BY HAND instead, one coherent rectangle each:

  * `luma`   — the whole character. Two strips ride this one box:
               `luma_blink` (base + blink) and `luma_talk`
               (base + half-open + open, cycled) — Luma stays one piece,
               never carved into eyes/mouth/staff;
  * `env_*`  — the ambient flames (fireplace, candle) that loop on their own.

Everything below the dialog panel (the empty parchment + input bar) is UI,
not art, so no zone ever reaches into it.

Sources:
  * morning       — the raw 2160x3840 drop in `экран_утро_сон/` (full res);
  * tavern_*      — the surviving 1080x1920 copies in assets/luma/.

Per scene: `background.png`, one strip + .json + .tres per zone (frame 0 is
always the base state), and `scene.json` placing every zone. Playback
timings come from src/ui/LumaTavernScene.tsx: env ping-pongs at 700 ms,
blink is a random 220 ms flash every 3-6 s, talk cycles at 150 ms.

Run: python3 tools/godot_export/export_luma.py  (or export_all.py)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from godot_export import core  # noqa: E402

MORNING_RAW = 'экран_утро_сон'

# Each scene: base painting, the character box (verified by eye against the
# art), the frames that repaint the character (blink / talk mouth states),
# and the ambient-flame boxes with their env repaint frames. Boxes are in
# source pixels; nothing crosses the dialog panel top.
SCENES = {
    'tavern_welcome': {
        'base': 'assets/luma/s1_base_start.png',
        'luma_box': (150, 215, 770, 800),
        'blink': ['assets/luma/s1_blink_start.png'],
        'talk': ['assets/luma/s1_talk_half_start.png',
                 'assets/luma/s1_talk_open_start.png'],
        'env': [
            ('fire', (775, 385, 1015, 665)),
            ('candle', (25, 540, 120, 670)),
        ],
        'env_frames': [f'assets/luma/s1_env{i}_start.png' for i in (2, 3, 4)],
    },
    'tavern_question': {
        'base': 'assets/luma/s1_base.png',
        'luma_box': (150, 215, 770, 800),
        'blink': ['assets/luma/s1_blink.png'],
        'talk': ['assets/luma/s1_talk_half.png', 'assets/luma/s1_talk_open.png'],
        'env': [
            ('fire', (775, 385, 1015, 665)),
            ('candle', (25, 540, 120, 670)),
        ],
        'env_frames': [f'assets/luma/s1_env{i}.png' for i in (2, 3, 4)],
    },
    'tavern_result': {
        'base': 'assets/luma/s2_base.png',
        'luma_box': (200, 150, 745, 910),
        'blink': ['assets/luma/s2_blink.png'],
        'talk': [],
        'env': [
            ('fire', (715, 580, 1020, 800)),
            ('candle', (35, 645, 150, 815)),
        ],
        'env_frames': [f'assets/luma/s2_env{i}.png' for i in (2, 3)],
    },
    'morning': {
        'base': f'{MORNING_RAW}/кадр_1_базовый.png',
        'luma_box': (520, 540, 1620, 1680),
        'blink': [f'{MORNING_RAW}/моргание/люма_моргание.png'],
        'talk': [f'{MORNING_RAW}/разговор/рот_приоткрыт.png',
                 f'{MORNING_RAW}/разговор/рот_открыт.png'],
        'env': [
            ('fire', (1590, 890, 1965, 1245)),
            ('candle', (25, 1095, 185, 1365)),
        ],
        'env_frames': [f'{MORNING_RAW}/окружение/кадр_{i}.png' for i in (2, 3)],
    },
}

BUTTONS = {
    'btn_accept': 'assets/luma/btn_accept.png',
    'btn_accept_down': 'assets/luma/btn_accept_down.png',
    'btn_adjust': 'assets/luma/btn_adjust.png',
    'btn_adjust_down': 'assets/luma/btn_adjust_down.png',
    'btn_empty': 'assets/luma/btn_empty.png',
    'btn_empty_down': 'assets/luma/btn_empty_down.png',
}

# Playback timings from src/ui/LumaTavernScene.tsx intervals.
ENV_FPS = round(1000 / 700, 2)
BLINK_FPS = round(1000 / 220, 2)
TALK_FPS = round(1000 / 150, 2)
BLINK_META = {'note': 'random blink: show frame 1 for one tick every 3-6 s'}
TALK_META = {'note': 'cycle while Luma speaks: closed -> half -> open -> half'}


def pingpong(count):
    """0,1..n-1,n-2..1 — SpriteFrames has no ping-pong mode, so bake it."""
    return list(range(count)) + list(range(count - 2, 0, -1))


def build_zones(spec):
    """One character box (blink + talk strips) + the ambient-flame boxes."""
    base = core.load_image(spec['base'], 'RGB')
    zones = []

    lx = spec['luma_box']
    base_crop = base.crop(lx)
    if spec.get('blink'):
        frames = [base_crop] + [core.load_image(p, 'RGB').crop(lx) for p in spec['blink']]
        zones.append({'name': 'luma_blink', 'frames': frames, 'fps': BLINK_FPS,
                      'loop': False, 'box': lx, 'meta': BLINK_META})
    if spec.get('talk'):
        frames = [base_crop] + [core.load_image(p, 'RGB').crop(lx) for p in spec['talk']]
        zones.append({'name': 'luma_talk', 'frames': frames, 'fps': TALK_FPS,
                      'frame_order': [0, 1, 2, 1], 'box': lx, 'meta': TALK_META})

    env_frames = [core.load_image(p, 'RGB') for p in spec.get('env_frames', [])]
    for tag, box in spec.get('env', []):
        frames = [base.crop(box)] + [f.crop(box) for f in env_frames]
        zones.append({'name': f'env_{tag}', 'frames': frames, 'fps': ENV_FPS,
                      'frame_order': pingpong(len(frames)), 'box': box})
    return base, zones


def export_scene(name, spec):
    base, zones = build_zones(spec)
    core.save_scene('luma', 'luma', name, base, zones)


def run():
    print('-- luma scenes')
    for name, spec in SCENES.items():
        print(f'  scene {name}:')
        export_scene(name, spec)
    print('-- luma buttons')
    for name, path in sorted(BUTTONS.items()):
        core.save_static('ui', 'ui/luma', name, core.load_image(path))


if __name__ == '__main__':
    run()
    core.write_manifest()
