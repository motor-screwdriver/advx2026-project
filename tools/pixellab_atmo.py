#!/usr/bin/env python3
"""pixellab_atmo.py — PixelLab-generated home-screen atmosphere for 8bit Sleep.

Generates the day/night atmosphere elements (sun, moon, clouds, grass tile)
via the PixelLab API and derives the four DayPhase variants (morning / day /
evening / night) locally by recolouring towards the PHASE_VISUALS palette in
src/ui/timeOfDay.ts — so the images always match the code-drawn sky gradient.

Output goes to assets/pixellab/atmo/ and is registered in the manifest under
the ATMO section. UI components (SceneSun / SceneClouds / SceneGrass) render
these instead of the old code bitmaps.

API-key rotation: keys are read from .env as PIXELLAB_SECRET, then
PIXELLAB_SECRET_2, _3, ... On a 402 (quota exhausted) the next key is used.

Usage: python3 tools/pixellab_atmo.py            # api + build + register
       python3 tools/pixellab_atmo.py build      # rebuild from cached raws
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_lib  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
BASE_URL = "https://api.pixellab.ai/v1"
RAW_DIR = os.path.join(ROOT, "assets", "_src", "pixellab", "atmo")
OUT_DIR = os.path.join(ROOT, "assets", "pixellab", "atmo")

STYLE = "8-bit retro console RPG pixel art, limited color palette, crisp pixels"

# PHASE_VISUALS subset from src/ui/timeOfDay.ts (keep in sync!).
PHASES = {
    "morning": dict(orb="#ffe6ad", orbShade="#f4c877", cloud="#faf6ec", cloudShade="#ddd2be", grass="#5f8038"),
    "day": dict(orb="#ffe27a", orbShade="#ffcf4d", cloud="#ffffff", cloudShade="#dde6ed", grass="#6b9142"),
    "evening": dict(orb="#ff9a5a", orbShade="#f0713f", cloud="#f0cabf", cloudShade="#c99a96", grass="#49602f"),
    "night": dict(orb="#e6ecf5", orbShade="#aebbe0", cloud="#c7d0e6", cloudShade="#8a94b8", grass="#243016"),
}
SUN_PHASES = ["morning", "day", "evening"]

SPECS = {
    "sun": dict(prompt="glowing pixel art sun disc with short straight square rays, warm yellow, game sky element", size=(64, 64), no_bg=True),
    "moon": dict(prompt="pixel art crescent moon with small craters, pale silver blue, game sky element", size=(64, 64), no_bg=True),
    "cloud_a": dict(prompt="one big fluffy pixel art cloud, white with soft grey shading, game sky element", size=(96, 48), no_bg=True),
    "cloud_b": dict(prompt="one small puffy pixel art cloud, plain white, game sky element", size=(64, 32), no_bg=True),
    "grass": dict(prompt="2D side-scrolling platformer ground tile, orthographic side view, flat horizontal strip filling the whole frame edge to edge, green grass with tiny flowers on top, brown dirt with small roots below, no perspective, no isometric, no sky", size=(96, 105), no_bg=False),
}


# ---------------------------------------------------------------- api

def load_keys():
    keys = []
    env = dict(os.environ)
    env_path = os.path.join(ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env.setdefault(k.strip(), v.strip())
    for name in ("PIXELLAB_SECRET", "PIXELLAB_SECRET_2", "PIXELLAB_SECRET_3", "PIXELLAB_SECRET_4"):
        if env.get(name):
            keys.append(env[name])
    if not keys:
        sys.exit("no PIXELLAB_SECRET* keys in env or .env")
    return keys


KEYS = load_keys()
_key_idx = 0


def api_post(path, payload, retries=2):
    global _key_idx
    body = json.dumps(payload).encode()
    for attempt in range(retries + len(KEYS)):
        req = urllib.request.Request(
            BASE_URL + path,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + KEYS[_key_idx],
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if e.code == 402 and _key_idx < len(KEYS) - 1:
                _key_idx += 1
                print(f"  quota exhausted, switching to API key #{_key_idx + 1}")
                continue
            if e.code in (429, 529, 502) and attempt < retries:
                wait = 15 * (attempt + 1)
                print(f"  transient {e.code}, retry in {wait}s")
                time.sleep(wait)
                continue
            raise RuntimeError(f"API error {e.code} on {path}: {detail}")


def gen(name):
    raw = os.path.join(RAW_DIR, f"{name}.png")
    if os.path.exists(raw):
        print(f"skip {name} (cached)")
        return True
    spec = SPECS[name]
    payload = {
        "description": f"{spec['prompt']}, {STYLE}",
        "image_size": {"width": spec["size"][0], "height": spec["size"][1]},
        "no_background": spec["no_bg"],
        "seed": 4200,
    }
    try:
        data = api_post("/generate-image-pixflux", payload)
        os.makedirs(RAW_DIR, exist_ok=True)
        img = data.get("image") or data["images"][0]
        with open(raw, "wb") as f:
            f.write(base64.b64decode(img["base64"]))
        print(f"ok   {name} (usage {data.get('usage')})")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"FAIL {name}: {e}")
        return False


# ---------------------------------------------------------------- build

def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def ramp(img, dark_hex, light_hex):
    """Luminance -> two-colour ramp, alpha preserved."""
    dark, light = hex_rgb(dark_hex), hex_rgb(light_hex)
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            t = ((r * 299 + g * 587 + b * 114) // 1000) / 255.0
            px[x, y] = (
                round(dark[0] + (light[0] - dark[0]) * t),
                round(dark[1] + (light[1] - dark[1]) * t),
                round(dark[2] + (light[2] - dark[2]) * t),
                a,
            )
    return img


def multiply(img, factors):
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (min(255, round(r * factors[0])), min(255, round(g * factors[1])),
                        min(255, round(b * factors[2])), a)
    return img


def upscale(img, scale):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def mirror_h(img):
    """Double width by appending a horizontally flipped copy (seamless wrap)."""
    out = Image.new("RGBA", (img.width * 2, img.height))
    out.paste(img, (0, 0))
    out.paste(img.transpose(Image.FLIP_LEFT_RIGHT), (img.width, 0))
    return out


ENTRIES = {}  # name -> (path, width, height)


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    rel = f"pixellab/atmo/{name}.png"
    img.save(os.path.join(ROOT, "assets", rel))
    ENTRIES[name] = (rel, img.width, img.height)
    print("wrote", rel, img.size)


def clean_ground(img):
    """Chroma-key the uniform sky background (sampled at a corner) and fill
    everything under the dirt silhouette with soil, squaring off the
    'floating island' look into a proper bottom-anchored tile."""
    img = img.convert("RGBA")
    px = img.load()
    key = px[0, 0][:3]
    tol = 40
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if abs(r - key[0]) < tol and abs(g - key[1]) < tol and abs(b - key[2]) < tol:
                px[x, y] = (0, 0, 0, 0)
    return img


def fill_soil(img, soil=(58, 40, 26)):
    px = img.load()
    for x in range(img.width):
        lowest = -1
        for y in range(img.height - 1, -1, -1):
            if px[x, y][3] > 0:
                lowest = y
                break
        for y in range(lowest + 1, img.height):
            px[x, y] = (*soil, 255)
    return img


def build():
    day_grass = hex_rgb(PHASES["day"]["grass"])

    try:
        sun = Image.open(os.path.join(RAW_DIR, "sun.png"))
        for phase in SUN_PHASES:
            v = PHASES[phase]
            save(ramp(upscale(sun, 4), v["orbShade"], v["orb"]), f"sun_{phase}")
    except FileNotFoundError:
        print("skip sun (no raw)")

    try:
        moon = Image.open(os.path.join(RAW_DIR, "moon.png"))
        v = PHASES["night"]
        save(ramp(upscale(moon, 4), v["orbShade"], v["orb"]), "moon_night")
    except FileNotFoundError:
        print("skip moon (no raw)")

    for shape, scale in (("cloud_a", 2), ("cloud_b", 2)):
        try:
            cloud = Image.open(os.path.join(RAW_DIR, f"{shape}.png"))
            for phase, v in PHASES.items():
                save(ramp(upscale(cloud, scale), v["cloudShade"], v["cloud"]), f"{shape}_{phase}")
        except FileNotFoundError:
            print(f"skip {shape} (no raw)")

    try:
        grass = clean_ground(Image.open(os.path.join(RAW_DIR, "grass.png")))
        bbox = grass.getbbox()
        if bbox:
            grass = grass.crop(bbox)
        # trim the rounded island sides so mirrored tiles join seamlessly
        inset = max(2, grass.width // 12)
        grass = grass.crop((inset, 0, grass.width - inset, grass.height))
        grass = fill_soil(grass.resize((96, 105), Image.NEAREST))
        tile = upscale(mirror_h(grass), 2)  # 96x105 -> 192x105 mirrored -> 384x210
        for phase, v in PHASES.items():
            g = hex_rgb(v["grass"])
            factors = (g[0] / day_grass[0], g[1] / day_grass[1], g[2] / day_grass[2])
            save(multiply(tile, factors), f"grass_{phase}")
    except FileNotFoundError:
        print("skip grass (no raw)")


def register():
    if not ENTRIES:
        # rebuild map from disk when running `register` standalone
        for f in sorted(os.listdir(OUT_DIR)):
            if f.endswith(".png"):
                img = Image.open(os.path.join(OUT_DIR, f))
                ENTRIES[f[:-4]] = (f"pixellab/atmo/{f}", img.width, img.height)
    for name, (rel, w, h) in sorted(ENTRIES.items()):
        manifest_lib.update("atmosphere", name, {
            "path": rel, "width": w, "height": h,
            "frames": 1, "frameWidth": w, "frameHeight": h,
        })
    print(f"registered {len(ENTRIES)} ATMO entries")


def main():
    phases = sys.argv[1:] or ["api", "build", "register"]
    ok = True
    if "api" in phases:
        for name in SPECS:
            ok = gen(name) and ok
    if "build" in phases:
        build()
    if "register" in phases:
        register()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
