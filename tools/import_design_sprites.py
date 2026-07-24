#!/usr/bin/env python3
"""import_design_sprites.py — import the sliced design sprites into the repo.

Copies docs/images_full/8bit-sleep-спрайты/<screen>/*.png to
assets/design/<ascii_key>/ and registers them in the manifest under the
`design` section (export DESIGN). Keys look like "home_scene_night" —
<screen_key>_<sprite filename stem, leading NN- stripped, slugified>.

Only slices actually referenced as `DESIGN.<key>` in src/ and app/ are imported
and registered; the remaining mockup crops are not imported (they live only in
the source dir) so the manifest and repo stay lean. The design section is
rebuilt each run.

Idempotent: safe to re-run, files and manifest entries are overwritten.

Usage: python3 tools/import_design_sprites.py
"""

import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
SRC = os.path.join(ROOT, "docs", "images_full", "8bit-sleep-спрайты")
DST = os.path.join(ROOT, "assets", "design")

DIRS = {
    "01a-новелла-вопрос": "novella_q",
    "01b-новелла-окно": "novella_w",
    "01-онбординг": "onboarding",
    "02-церемония-героя": "ceremony",
    "03a-книга-меню": "bookmenu",
    "03b-книга-переход": "booktransition",
    "03-home-ночь": "home",
    "04-утро-perfect": "morning",
    "05-смерть": "death",
    "06-soul-tether": "tether",
    "07-мозаика": "mosaic",
    "08-настройки": "settings",
    "09-сундук": "chest",
    "10-инвентарь": "bag",
    "11-туториал": "tutorial",
    "12-герои": "heroes",
    "13-рейд-костёр": "raid",
}


def slug(name):
    name = re.sub(r"^\d+-", "", os.path.splitext(name)[0])
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def used_design_keys():
    """Design entry names actually referenced as `DESIGN.<key>` in app code.

    Only these slices are imported + registered; the rest of the mockup crops
    stay reference-only (see .gitignore) so the manifest and repo stay lean.
    """
    pat = re.compile(r"DESIGN\.([A-Za-z0-9_]+)")
    keys = set()
    for base in ("src", "app"):
        for root, _dirs, files in os.walk(os.path.join(ROOT, base)):
            for fn in files:
                if fn.endswith((".ts", ".tsx")):
                    with open(os.path.join(root, fn), encoding="utf-8") as fh:
                        keys.update(pat.findall(fh.read()))
    keys.discard("md")  # `DESIGN.md` is a docs filename in a string, not a sprite
    return keys


def main():
    used = used_design_keys()
    count = 0
    data = manifest_lib.load_data()
    data["design"] = {}  # rebuild from scratch so dropped slices don't linger
    for dirname, key in sorted(DIRS.items()):
        src_dir = os.path.join(SRC, dirname)
        dst_dir = os.path.join(DST, key)
        os.makedirs(dst_dir, exist_ok=True)
        for fname in sorted(os.listdir(src_dir)):
            if not fname.endswith(".png"):
                continue
            entry_name = f"{key}_{slug(fname)}"
            if entry_name not in used:
                continue  # reference-only crop — skip import + manifest entry
            shutil.copy2(os.path.join(src_dir, fname), os.path.join(dst_dir, fname))
            with Image.open(os.path.join(dst_dir, fname)) as im:
                w, h = im.size
            manifest_lib.add_entry(data, "design", entry_name, {
                "path": f"design/{key}/{fname}",
                "width": w, "height": h, "frames": 1,
                "frameWidth": w, "frameHeight": h,
            })
            count += 1
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    print(f"imported {count} used design sprites -> assets/design/ (of {len(used)} referenced keys)")


if __name__ == "__main__":
    main()
