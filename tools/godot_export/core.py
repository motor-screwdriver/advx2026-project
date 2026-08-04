"""Shared library for the Godot asset export pipeline.

Turns the ad-hoc RN asset soup into engine-friendly sprites:
  * horizontal strips with uniform frames per animation,
  * individual trimmed PNGs for UI elements,
  * fullscreen "animations" decomposed into background + small diff-zone
    strips (only the pixels that actually change between frames),
  * a JSON sidecar per animation and one global manifest.json,
  * ready-to-use Godot 4 `SpriteFrames` .tres per animation.

Everything lands under `godot_assets/` at the repo root. The .tres files
assume that folder is copied into a Godot project as `res://assets/`
(see the generated README).

This module only provides the toolkit; the per-category export scripts
(`export_*.py` in this package) drive it.
"""

import io
import json
import os
import subprocess

import numpy as np
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_ROOT = os.path.join(REPO_ROOT, 'godot_assets')
# Where the pack is expected to live inside a Godot project.
RES_PREFIX = 'res://assets/'

# Global registry: category -> name -> entry. Filled by save_* helpers,
# flushed once by write_manifest() at the end of the export run.
MANIFEST = {}


# --- image loading -----------------------------------------------------------

def load_image(path, mode='RGBA'):
    """Open an image from the working tree (path relative to repo root)."""
    return Image.open(os.path.join(REPO_ROOT, path)).convert(mode)


def load_git_image(commit, path, mode='RGBA'):
    """Open an image straight from git history (for deleted sources)."""
    blob = subprocess.run(
        ['git', 'show', f'{commit}:{path}'],
        cwd=REPO_ROOT, check=True, capture_output=True,
    ).stdout
    return Image.open(io.BytesIO(blob)).convert(mode)


# --- basic geometry ----------------------------------------------------------

def slice_strip(strip, frames):
    """Split a horizontal strip into `frames` equal-width images."""
    if strip.width % frames:
        raise ValueError(f'strip width {strip.width} not divisible by {frames}')
    w = strip.width // frames
    return [strip.crop((i * w, 0, (i + 1) * w, strip.height)) for i in range(frames)]


def pack_strip(frames):
    """Pack equally-sized frames into one horizontal strip."""
    w, h = frames[0].size
    for f in frames:
        if f.size != (w, h):
            raise ValueError(f'frame size mismatch: {f.size} vs {(w, h)}')
    strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f.convert('RGBA'), (i * w, 0))
    return strip


def trim(image, threshold=0):
    """Crop transparent margins; returns (cropped, bbox in source coords)."""
    alpha = np.asarray(image.convert('RGBA'))[..., 3]
    ys, xs = np.where(alpha > threshold)
    if xs.size == 0:
        return image, (0, 0, image.width, image.height)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return image.crop(box), box


def trim_frames(frames, threshold=0):
    """Trim a frame set to their shared content bbox (keeps registration)."""
    boxes = [trim(f, threshold)[1] for f in frames]
    box = (
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    )
    return [f.crop(box) for f in frames], box


# --- diff zones (fullscreen frame sets -> background + animated regions) -----

# The fullscreen frames are hand repaints: almost every pixel wiggles a bit,
# so a plain per-pixel diff floods the whole canvas. Instead the mask is
# evaluated on a coarse cell grid — a cell counts as "animated" only when a
# real share of its pixels changes strongly. Cells cluster into zones.
TOLERANCE = 40      # per-pixel channel delta that counts as a real change
CELL_DIVISOR = 64   # cell size ≈ short image side / 64 (16px @ 1080)
CELL_DENSITY = 0.25  # min fraction of changed pixels for an animated cell
MIN_CELLS = 3       # components smaller than this are repaint noise
PAD = 8             # px padding around each zone
GAP = 24            # px: zones closer than this merge into one


def _components(mask, reach=2):
    """Connected components of a boolean grid (cells within `reach` link up).

    Returns (x0, y0, x1, y1, cell_count) per component, exclusive bounds.
    """
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps = []
    for sy, sx in zip(*np.where(mask)):
        if seen[sy, sx]:
            continue
        stack = [(sy, sx)]
        seen[sy, sx] = True
        x0, y0, x1, y1, count = sx, sy, sx, sy, 0
        while stack:
            y, x = stack.pop()
            count += 1
            x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
            for ny in range(max(y - reach, 0), min(y + reach + 1, h)):
                for nx in range(max(x - reach, 0), min(x + reach + 1, w)):
                    if mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        comps.append((x0, y0, x1 + 1, y1 + 1, count))
    return comps


def _merge_close(boxes, gap):
    """Union boxes that overlap or sit closer than `gap`, until stable."""
    boxes = list(boxes)
    changed = True
    while changed:
        changed = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if (a[0] < b[2] + gap and b[0] < a[2] + gap
                        and a[1] < b[3] + gap and b[1] < a[3] + gap):
                    boxes[i] = (
                        min(a[0], b[0]), min(a[1], b[1]),
                        max(a[2], b[2]), max(a[3], b[3]),
                    )
                    del boxes[j]
                    changed = True
                    break
            if changed:
                break
    return boxes


def diff_zones(base, frames, tolerance=TOLERANCE, density=CELL_DENSITY, pad=PAD):
    """Boxes (in `base` coords) where any of `frames` visibly differs."""
    ref = np.asarray(base.convert('RGB')).astype(int)
    h, w = ref.shape[:2]
    cell = max(8, min(h, w) // CELL_DIVISOR)
    gh, gw = h // cell, w // cell
    grid = np.zeros((gh, gw), dtype=bool)
    for frame in frames:
        arr = np.asarray(frame.convert('RGB')).astype(int)
        mask = np.abs(arr - ref).max(axis=2) > tolerance
        cells = mask[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell)
        grid |= cells.mean(axis=(1, 3)) > density

    boxes = []
    for gx0, gy0, gx1, gy1, count in _components(grid):
        if count < MIN_CELLS:
            continue
        boxes.append((
            int(max(gx0 * cell - pad, 0)), int(max(gy0 * cell - pad, 0)),
            int(min(gx1 * cell + pad, w)), int(min(gy1 * cell + pad, h)),
        ))
    return sorted(_merge_close(boxes, GAP), key=lambda b: (b[1], b[0]))


# --- Godot 4 SpriteFrames (.tres) ---------------------------------------------

def _tres_sprite_frames(texture_res_path, frame_w, frame_h, frames, fps, loop,
                        frame_order=None):
    """Render a Godot 4 SpriteFrames resource over a horizontal strip.

    `frame_order` lets the playback sequence repeat strip frames
    (e.g. talk cycles like 0,5,6,5); defaults to 0..frames-1.
    """
    order = list(range(frames)) if frame_order is None else list(frame_order)
    steps = frames + 2  # ext_resource + atlas subresources + resource itself
    lines = [
        f'[gd_resource type="SpriteFrames" load_steps={steps} format=3]',
        '',
        f'[ext_resource type="Texture2D" path="{texture_res_path}" id="1"]',
        '',
    ]
    for i in range(frames):
        lines += [
            f'[sub_resource type="AtlasTexture" id="Atlas_{i}"]',
            'atlas = ExtResource("1")',
            f'region = Rect2({i * frame_w}, 0, {frame_w}, {frame_h})',
            '',
        ]
    entries = ', '.join(
        '{\n"duration": 1.0,\n"texture": SubResource("Atlas_%d")\n}' % i
        for i in order
    )
    lines += [
        '[resource]',
        'animations = [{',
        f'"frames": [{entries}],',
        f'"loop": {str(loop).lower()},',
        '"name": &"default",',
        f'"speed": {float(fps)}',
        '}]',
        '',
    ]
    return '\n'.join(lines)


# --- saving ------------------------------------------------------------------

def _out_path(rel_path):
    path = os.path.join(OUT_ROOT, rel_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def _register(category, name, entry):
    MANIFEST.setdefault(category, {})[name] = entry


def save_animation(category, subdir, name, frames, fps, loop=True,
                   frame_order=None, meta=None, register=True):
    """Save frames as strip.png + sidecar .json + SpriteFrames .tres."""
    strip = pack_strip(frames)
    w, h = frames[0].size
    rel_png = f'{subdir}/{name}.png'
    strip.save(_out_path(rel_png), optimize=True)

    entry = {
        'type': 'animation',
        'texture': rel_png,
        'frame_width': w,
        'frame_height': h,
        'frames': len(frames),
        'fps': fps,
        'loop': loop,
    }
    if frame_order is not None:
        entry['frame_order'] = list(frame_order)
    if meta:
        entry['meta'] = meta

    with open(_out_path(f'{subdir}/{name}.json'), 'w', encoding='utf-8') as fh:
        json.dump({'name': name, **entry}, fh, indent=2)
        fh.write('\n')
    tres = _tres_sprite_frames(
        RES_PREFIX + rel_png, w, h, len(frames), fps, loop, frame_order,
    )
    with open(_out_path(f'{subdir}/{name}.tres'), 'w', encoding='utf-8') as fh:
        fh.write(tres)

    if register:
        _register(category, name, entry)
    print(f'  [anim]   {rel_png}  {w}x{h} x{len(frames)} @{fps}fps')
    return entry


def save_static(category, subdir, name, image, kind='sprite', meta=None, register=True):
    """Save a single static image (UI element, background, tile...)."""
    rel_png = f'{subdir}/{name}.png'
    image.save(_out_path(rel_png), optimize=True)
    entry = {
        'type': kind,
        'texture': rel_png,
        'width': image.width,
        'height': image.height,
    }
    if meta:
        entry['meta'] = meta
    if register:
        _register(category, name, entry)
    print(f'  [{kind:6s}] {rel_png}  {image.width}x{image.height}')
    return entry


def save_scene(category, subdir, name, background, zones, meta=None):
    """Save a layered fullscreen scene: background + animated diff zones.

    `zones` is a list of dicts: {name, frames, fps, loop, box, frame_order?}
    where `box` is the zone position in background coords. Each zone becomes
    its own strip + .tres; the scene.json ties everything together so a
    Godot scene can place AnimatedSprite2D nodes at the right offsets.
    """
    scene_dir = f'{subdir}/{name}'
    bg_entry = save_static(
        category, scene_dir, 'background', background, 'background', register=False,
    )
    zone_entries = []
    for zone in zones:
        entry = save_animation(
            category, scene_dir, zone['name'], zone['frames'],
            zone['fps'], zone.get('loop', True), zone.get('frame_order'),
            meta=zone.get('meta'), register=False,
        )
        zone_entries.append({
            'name': zone['name'],
            'position': [zone['box'][0], zone['box'][1]],
            **entry,
        })

    scene_entry = {
        'type': 'layered_scene',
        'background': bg_entry['texture'],
        'width': background.width,
        'height': background.height,
        'zones': zone_entries,
    }
    if meta:
        scene_entry['meta'] = meta
    with open(_out_path(f'{scene_dir}/scene.json'), 'w', encoding='utf-8') as fh:
        json.dump({'name': name, **scene_entry}, fh, indent=2)
        fh.write('\n')
    _register(category, name, scene_entry)
    return scene_entry


def write_manifest():
    """Flush the global registry to godot_assets/manifest.json."""
    with open(_out_path('manifest.json'), 'w', encoding='utf-8') as fh:
        json.dump(MANIFEST, fh, indent=1, sort_keys=True)
        fh.write('\n')
    total = sum(len(v) for v in MANIFEST.values())
    print(f'manifest.json written ({total} entries)')
