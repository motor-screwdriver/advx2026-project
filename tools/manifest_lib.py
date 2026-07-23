"""Manifest bookkeeping for the 8bit Sleep art pipeline.

`assets/manifest.data.json` is the machine-readable source of truth; every
pipeline run updates it and regenerates the typed `assets/manifest.ts` that
the UI developer imports. Never edit manifest.ts by hand.
"""

import json
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(REPO_ROOT, 'assets', 'manifest.data.json')
TS_PATH = os.path.join(REPO_ROOT, 'assets', 'manifest.ts')

SECTIONS = ['sprites', 'sprites_1bit', 'scenes', 'icons', 'atmosphere', 'audio']


def load_data():
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, 'r', encoding='utf-8') as fh:
            return json.load(fh)
    return {section: {} for section in SECTIONS}


def save_data(data):
    with open(DATA_PATH, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, indent=1, sort_keys=True)
        fh.write('\n')


def add_entry(data, section, name, entry):
    data.setdefault(section, {})[name] = entry


def _sprite_line(name, e):
    return (
        f"  {json.dumps(name)}: {{ source: require('./{e['path']}'), "
        f"width: {e['width']}, height: {e['height']}, frames: {e['frames']}, "
        f"frameWidth: {e['frameWidth']}, frameHeight: {e['frameHeight']} }},"
    )


def _audio_line(name, e):
    return (
        f"  {json.dumps(name)}: {{ source: require('./{e['path']}'), "
        f"durationSec: {e['durationSec']}, loop: {str(e['loop']).lower()} }},"
    )


HEADER = """/* eslint-disable max-lines */
// GENERATED FILE — produced by tools/pixelate.py / tools/generate_audio.py.
// Do not edit by hand; rerun the pipeline instead. This manifest is the ONLY
// supported way for UI code to reference game assets (PROMPT C §6).
//
// Multi-frame assets are horizontal strips: frameWidth x frameHeight per
// frame, `frames` frames laid out left to right.

export interface SpriteEntry {
  /** Metro asset reference — pass straight to <Image source={...} />. */
  readonly source: number;
  /** On-disk pixel size of the whole strip (grid size x 4 upscale). */
  readonly width: number;
  readonly height: number;
  readonly frames: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
}

export interface AudioEntry {
  readonly source: number;
  readonly durationSec: number;
  readonly loop: boolean;
}
"""

SECTION_EXPORTS = {
    'sprites': ('SPRITES', 'SpriteEntry', _sprite_line),
    'sprites_1bit': ('SPRITES_1BIT', 'SpriteEntry', _sprite_line),
    'scenes': ('SCENES', 'SpriteEntry', _sprite_line),
    'icons': ('ICONS', 'SpriteEntry', _sprite_line),
    'atmosphere': ('ATMO', 'SpriteEntry', _sprite_line),
    'audio': ('AUDIO', 'AudioEntry', _audio_line),
}


def write_manifest_ts(data):
    """Regenerate assets/manifest.ts from the data dict."""
    chunks = [HEADER]
    for section in SECTIONS:
        export_name, type_name, line_fn = SECTION_EXPORTS[section]
        entries = data.get(section, {})
        chunks.append(
            f'\nexport const {export_name} = {{\n'
            + '\n'.join(line_fn(name, entries[name]) for name in sorted(entries))
            + f'\n}} as const satisfies Record<string, {type_name}>;\n'
        )
    with open(TS_PATH, 'w', encoding='utf-8') as fh:
        fh.write(''.join(chunks))
    total = sum(len(data.get(s, {})) for s in SECTIONS)
    print(f'manifest.ts regenerated ({total} entries)')


def update(section, name, entry):
    """Add one entry to the data file and regenerate manifest.ts."""
    data = load_data()
    add_entry(data, section, name, entry)
    save_data(data)
    write_manifest_ts(data)
