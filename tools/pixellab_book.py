"""Publish the PixelLab book page into the live assets + manifest.

Raw generation lives in assets/_src/pixellab/ (gitignored). book_page is the
flat ornate character-sheet page generated on a studio-gray backdrop — we trim
that backdrop to the art's bounding box so the page fills the whole asset and
the UI can cover-fit it edge to edge. The UI overlays the ink stats + 1-bit
hero at render time, so the generated page is intentionally blank.
"""

import os
import sys

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

REPO_ROOT = manifest_lib.REPO_ROOT
RAW_DIR = os.path.join(REPO_ROOT, "assets", "_src", "pixellab")
OUT_DIR = os.path.join(REPO_ROOT, "assets", "pixellab", "scenes")

NAMES = ["book_page"]
TRIM = {"book_page"}  # trim the flat studio backdrop down to the art


def trim_backdrop(img: Image.Image) -> Image.Image:
    """Crop away the uniform backdrop color sampled from the top-left corner.

    The PixelLab backdrop carries subtle noise, so the difference image is
    thresholded before taking the bounding box.
    """
    rgb = img.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((1, 1)))
    diff = ImageChops.difference(rgb, bg).convert("L")
    bbox = diff.point(lambda v: 255 if v > 15 else 0).getbbox()
    return img.crop(bbox) if bbox else img


def build():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name in NAMES:
        img = Image.open(os.path.join(RAW_DIR, name + ".png")).convert("RGBA")
        if name in TRIM:
            img = trim_backdrop(img)
        out_path = os.path.join(OUT_DIR, name + ".png")
        img.save(out_path)
        rel = os.path.relpath(out_path, os.path.join(REPO_ROOT, "assets"))
        manifest_lib.update(
            "scenes",
            name,
            {
                "path": rel.replace(os.sep, "/"),
                "width": img.width,
                "height": img.height,
                "frames": 1,
                "frameWidth": img.width,
                "frameHeight": img.height,
            },
        )
        print(f"registered scenes.{name} ({img.width}x{img.height})")


if __name__ == "__main__":
    build()
