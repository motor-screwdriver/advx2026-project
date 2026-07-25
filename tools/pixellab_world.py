#!/usr/bin/env python3
"""pixellab_world.py — parallax world layers for the book->world transition.

Consumes two PixelLab raws generated into assets/_src/pixellab/:

  world_night_far.png  (384x128) — full opaque night backdrop: gradient sky,
                        stars, mountain range, a small glowing castle, faint
                        distant treeline. Used as the slowest parallax layer.
  world_night_mid.png  (384x160) — teal sky + pine treeline. The sky is keyed
                        out so only the dark pines remain (transparent), giving
                        a midground silhouette that scrolls faster for depth.

Both are mirror-composed into seamless 2x-wide strips (left half + horizontally
flipped right half) so an endless horizontal scroll wraps without a seam, then
registered in the manifest ATMO section. UI reads only from the manifest.

Usage: python3 tools/pixellab_world.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
RAW_DIR = os.path.join(ROOT, "assets", "_src", "pixellab")
OUT_DIR = os.path.join(ROOT, "assets", "pixellab", "atmo")

# Luminance below which a mid-layer pixel is treated as pine (kept); brighter
# teal-sky and firefly pixels become transparent.
PINE_LUMA_MAX = 20


def mirror_h(img):
    """Double width by appending a horizontally flipped copy (seamless wrap)."""
    out = Image.new("RGBA", (img.width * 2, img.height))
    out.paste(img, (0, 0))
    out.paste(img.transpose(Image.FLIP_LEFT_RIGHT), (img.width, 0))
    return out


def key_sky(img, luma_max):
    """Keep only dark (pine) pixels; everything brighter becomes transparent."""
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            luma = (r * 299 + g * 587 + b * 114) // 1000
            if luma > luma_max:
                px[x, y] = (0, 0, 0, 0)
    return img


ENTRIES = {}


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    rel = f"pixellab/atmo/{name}.png"
    img.save(os.path.join(ROOT, "assets", rel))
    ENTRIES[name] = (rel, img.width, img.height)
    print("wrote", rel, img.size)


def build():
    far = Image.open(os.path.join(RAW_DIR, "world_night_far.png")).convert("RGBA")
    save(mirror_h(far), "world_night_far")

    mid = Image.open(os.path.join(RAW_DIR, "world_night_mid.png")).convert("RGBA")
    mid = key_sky(mid, PINE_LUMA_MAX)
    bbox = mid.getbbox()
    if bbox:
        # crop vertically to the pine band, keep full width for seamless tiling
        mid = mid.crop((0, bbox[1], mid.width, mid.height))
    save(mirror_h(mid), "world_night_mid")


def register():
    for name, (rel, w, h) in sorted(ENTRIES.items()):
        manifest_lib.update("atmosphere", name, {
            "path": rel, "width": w, "height": h,
            "frames": 1, "frameWidth": w, "frameHeight": h,
        })
    print(f"registered {len(ENTRIES)} ATMO entries")


if __name__ == "__main__":
    build()
    register()
