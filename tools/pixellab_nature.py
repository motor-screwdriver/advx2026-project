#!/usr/bin/env python3
"""pixellab_nature.py — the living night-world nature pack for 8bit Sleep.

Generates a full quality pass of night nature via the PixelLab API (per
docs/8bit Sleep — гайд генерация ассетов Kimi + PixelLab.md): moon, drifting
clouds, far mountains, pine forest, foreground grass, a lone wind-swayed oak
and falling leaves. Wide bands are mirrored (mirror_h) so the parallax loop
wraps seamlessly; everything is upscaled with NEAREST so fat pixels survive
runtime smoothing.

Output goes to assets/pixellab/atmo/ and registers in the ATMO manifest
section, overwriting moon_night / grass_night with better art.

API-key rotation: keys are read from .env; the guide marks _1/_2 as exhausted,
so keys are tried freshest-first (_7 .. _1, then the base key). On a 402 the
next key is used.

Usage: python3 tools/pixellab_nature.py            # api + build + register
       python3 tools/pixellab_nature.py build      # rebuild from cached raws
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
RAW_DIR = os.path.join(ROOT, "assets", "_src", "pixellab", "nature")
OUT_DIR = os.path.join(ROOT, "assets", "pixellab", "atmo")

STYLE = "8-bit retro console RPG pixel art, limited color palette, crisp pixels, night scene"

SPECS = {
    "moon": dict(
        prompt="large glowing crescent moon with detailed craters and a soft pale halo, silver blue, night sky element",
        size=(128, 128), no_bg=True, seed=7101),
    "moon_full": dict(
        prompt="large full moon disc with detailed craters and maria, pale silver white with a soft blue glow halo, night sky element",
        size=(128, 128), no_bg=True, seed=7401),
    "cloud_night_a": dict(
        prompt="one long wispy night cloud, translucent pale blue-grey with silver moonlit edges, thin and stretched horizontally, night sky element",
        size=(128, 48), no_bg=True, seed=7102),
    "cloud_night_b": dict(
        prompt="one small fluffy night cloud, soft blue-grey with silver highlights, night sky element",
        size=(96, 48), no_bg=True, seed=7103),
    "mountains_night": dict(
        prompt="2D side-scrolling game background band: distant jagged mountain range silhouette with snow-capped peaks under moonlight, dark indigo and slate blue, orthographic side view, flat horizontal strip filling the whole frame edge to edge, no perspective, no sky, no stars, no moon",
        size=(384, 160), no_bg=True, seed=7104),
    "pines_night": dict(
        prompt="2D side-scrolling game background band: dense pine forest silhouette at night, varied tall fir trees with moonlit tips, dark teal and deep blue-green, orthographic side view, flat horizontal strip filling the whole frame edge to edge, no perspective, no sky",
        size=(384, 192), no_bg=True, seed=7105),
    "big_tree_night": dict(
        prompt="one large old oak tree with thick gnarled trunk and sprawling leafy canopy, night palette deep teal and dark blue with subtle silver moonlit rim light, full tree visible from roots to crown, 2D game sprite",
        size=(192, 256), no_bg=True, seed=7106),
    "grass_night": dict(
        prompt="2D side-scrolling platformer ground tile filling the ENTIRE frame edge to edge: a dense solid wall of tall night grass meadow covering the top half completely, dark soil cross-section with small roots filling the bottom half, dark blue-green blades with tiny glowing pale flowers, orthographic side view, no perspective, no isometric, no sky, no floating island",
        size=(96, 105), no_bg=False, seed=7207),
    "leaf_a": dict(
        prompt="single small autumn leaf, muted orange-brown with a pale moonlit edge, simple iconic shape, game sprite",
        size=(48, 48), no_bg=True, seed=7108),
    "leaf_b": dict(
        prompt="single small dry curled leaf, muted teal-grey, simple iconic shape, game sprite",
        size=(48, 48), no_bg=True, seed=7109),
    # ---- decorative props the hero scrolls past (quality bar: the wizard-town
    # reference — warm lantern glows, glowing crystals, lively night details)
    "prop_windmill": dict(
        prompt="old wooden windmill silhouette on a hill, dark indigo night silhouette with one small warm lit window, distant background building, 2D game sprite",
        size=(96, 128), no_bg=True, seed=7301),
    "prop_castle": dict(
        prompt="distant fairytale castle tower with pointed blue roof, dark silhouette with tiny warm glowing windows, night background building, 2D game sprite",
        size=(112, 144), no_bg=True, seed=7302),
    "prop_crystal": dict(
        prompt="cluster of large glowing magic crystals growing from a rock, luminous violet and cyan with bright inner light and soft glow, night fantasy prop, 2D game sprite",
        size=(64, 64), no_bg=True, seed=7303),
    "prop_runestone": dict(
        prompt="ancient mossy standing stone monolith with glowing blue carved runes, weathered grey rock, night fantasy prop, 2D game sprite",
        size=(64, 88), no_bg=True, seed=7304),
    "prop_mushrooms": dict(
        prompt="cluster of small glowing forest mushrooms, luminous teal caps with soft cyan glow, dark stems, night fantasy prop, 2D game sprite",
        size=(48, 48), no_bg=True, seed=7305),
    "prop_lantern": dict(
        prompt="rustic wooden lamp post with a hanging iron lantern, warm golden glowing flame with soft glow halo, dark wood, night village prop, 2D game sprite",
        size=(56, 104), no_bg=True, seed=7306),
    "prop_stump_owl": dict(
        prompt="small brown owl with big glowing amber eyes perched on an old mossy tree stump, night forest prop, 2D game sprite",
        size=(64, 72), no_bg=True, seed=7307),
    "prop_campfire": dict(
        prompt="small campfire with stones ring and warm orange flames, glowing embers and soft light halo, night camp prop, 2D game sprite",
        size=(56, 56), no_bg=True, seed=7308),
    "prop_bush": dict(
        prompt="round dense night bush, dark teal leaves with a few tiny pale glowing flowers, moonlit silver rim, 2D game sprite",
        size=(72, 48), no_bg=True, seed=7309),
    "prop_fence": dict(
        prompt="short rustic wooden fence segment of three crooked planks, dark weathered wood with moonlit silver edges, night village prop, 2D game sprite",
        size=(96, 48), no_bg=True, seed=7310),
}

# props ride the parallax layers at 2x like the rest of the pack
PROPS = tuple(n for n in SPECS if n.startswith("prop_"))


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
    # Fresh keys first (guide: _1/_2 exhausted, use _4+), base key last.
    names = [f"PIXELLAB_SECRET_{i}" for i in range(7, 0, -1)] + ["PIXELLAB_SECRET"]
    for name in names:
        if env.get(name) and env[name] not in keys:
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
        "seed": spec["seed"],
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

def upscale(img, scale):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def mirror_h(img):
    """Double width by appending a horizontally flipped copy (seamless wrap)."""
    out = Image.new("RGBA", (img.width * 2, img.height))
    out.paste(img, (0, 0))
    out.paste(img.transpose(Image.FLIP_LEFT_RIGHT), (img.width, 0))
    return out


def crop_alpha(img):
    img = img.convert("RGBA")
    bbox = img.getchannel("A").getbbox()
    return img.crop(bbox) if bbox else img


def cut_sky(img, step_tol=16, min_area=600, pale_luma=None):
    """Flood-erase the baked sky: BFS from the TOP rows only, spreading while
    the per-channel step to the next pixel stays under step_tol (walks smooth
    gradients, blocked by crisp sprite edges). Isolated opaque specks left
    inside the erased sky (stars, stray moons) are then despeckled away.
    Ground, silhouettes and anything touching the sides/bottom survive.

    pale_luma is for lone trees: the sky flood stops at canopy edges, so the
    moon/stars survive as detached pale blobs — erase every component that is
    both bright (mean luma over pale_luma) AND not green-dominated
    (leaf clusters and their highlights always are)."""
    from collections import deque

    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    sky = bytearray(w * h)
    q = deque([(x, 0) for x in range(w)] + [(x, 1) for x in range(w)])
    for x, y in q:
        sky[y * w + x] = 1
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not sky[ny * w + nx]:
                nr, ng, nb, _ = px[nx, ny]
                if max(abs(r - nr), abs(g - ng), abs(b - nb)) <= step_tol:
                    sky[ny * w + nx] = 1
                    q.append((nx, ny))
    for i in range(w * h):
        if sky[i]:
            x, y = i % w, i // w
            px[x, y] = (0, 0, 0, 0)
    # despeckle: drop small opaque islands fully enclosed by the erased sky
    seen = bytearray(w * h)
    comps = []
    for i in range(w * h):
        if seen[i] or px[i % w, i // w][3] == 0:
            continue
        comp = []
        q = deque([(i % w, i // w)])
        seen[i] = 1
        while q:
            x, y = q.popleft()
            comp.append((x, y))
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3] > 0:
                    seen[ny * w + nx] = 1
                    q.append((nx, ny))
        comps.append(comp)
    biggest = max(comps, key=len) if comps else []
    for comp in comps:
        drop = len(comp) < min_area
        if not drop and pale_luma is not None and comp is not biggest:
            n = len(comp)
            mr = sum(px[x, y][0] for x, y in comp) / n
            mg = sum(px[x, y][1] for x, y in comp) / n
            mb = sum(px[x, y][2] for x, y in comp) / n
            luma = (mr * 299 + mg * 587 + mb * 114) / 1000
            drop = luma > pale_luma and (mg - max(mr, mb)) < 20
        if drop:
            for x, y in comp:
                px[x, y] = (0, 0, 0, 0)
    return img


def key_out_sky(img, luma_max=150):
    """Erase sky-like pixels ANYWHERE in the frame: blue-dominant (b > g > r)
    and dark. The BFS flood only walks from the top edge, so it can never reach
    sky pockets sealed under a tree canopy — this hue rule catches them plus
    the ghost fir silhouettes, while green canopies (g > b) and brown trunks
    (r largest) survive. Bright pixels (moon rims, highlights) are kept; stars
    that survive are despeckled by cut_sky beforehand."""
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            luma = (r * 299 + g * 587 + b * 114) / 1000
            if b > g > r and b - r > 12 and luma < luma_max:
                px[x, y] = (0, 0, 0, 0)
    return img


def ground_tree(img, soil=(18, 15, 26), root_frac=0.55):
    """Plant the lone tree: after sky key-out the mound is gone and the roots
    end mid-air. Fill a dark soil strip under every column whose lowest opaque
    pixel sits in the roots zone (below root_frac of the height)."""
    img = img.convert("RGBA")
    px = img.load()
    h, w = img.height, img.width
    for x in range(w):
        for y in range(h - 1, -1, -1):
            if px[x, y][3] > 0:
                if y >= h * root_frac:
                    for yy in range(y + 1, h):
                        px[x, yy] = (*soil, 255)
                break
    return img


def clean_ground(img):
    """Chroma-key the uniform sky background sampled at the top-left corner."""
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


def fill_soil(img, soil=(34, 26, 20), guard_frac=0.0):
    """Solid ground: under each column's lowest opaque pixel, fill down to the
    tile bottom with dark soil. guard_frac skips columns whose lowest pixel is
    too high (stray specks) so sparse blade tips don't grow soil pillars."""
    px = img.load()
    for x in range(img.width):
        lowest = -1
        for y in range(img.height - 1, -1, -1):
            if px[x, y][3] > 0:
                lowest = y
                break
        if lowest < img.height * guard_frac:
            continue
        for y in range(lowest + 1, img.height):
            px[x, y] = (*soil, 255)
    return img


def dim_soil(img, top_frac=0.45, soil=(30, 22, 18), keep=0.25):
    """Reference soil is a flat dark umber; the raw bakes noisy pale speckles
    into the cross-section and clean_ground blows sky-colored ones into holes.
    Blend every non-green pixel of the soil zone toward the soil color (keeping
    a hint of texture) and plug transparent holes with solid soil. Green blades
    reaching down into the zone survive untouched."""
    px = img.load()
    for y in range(int(img.height * top_frac), img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if not a:
                px[x, y] = (*soil, 255)
            elif not (g > r and g > b):
                px[x, y] = (
                    int(soil[0] * (1 - keep) + r * keep),
                    int(soil[1] * (1 - keep) + g * keep),
                    int(soil[2] * (1 - keep) + b * keep),
                    a,
                )
    return img


def night_tint(img, mul=(0.5, 0.7, 0.95)):
    """Pull a too-bright tile down to night levels: darken red most, blue least,
    so greens shift toward moonlit teal."""
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (int(r * mul[0]), int(g * mul[1]), int(b * mul[2]), a)
    return img


ENTRIES = {}  # name -> (path, width, height)


def save(img, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    rel = f"pixellab/atmo/{name}.png"
    img.save(os.path.join(ROOT, "assets", rel))
    ENTRIES[name] = (rel, img.width, img.height)
    print("wrote", rel, img.size)


def build():
    def raw(name):
        return Image.open(os.path.join(RAW_DIR, f"{name}.png"))

    try:
        save(upscale(crop_alpha(raw("moon")), 2), "moon_night")
    except FileNotFoundError:
        print("skip moon (no raw)")

    try:
        save(upscale(crop_alpha(raw("moon_full")), 2), "moon_full")
    except FileNotFoundError:
        print("skip moon_full (no raw)")

    for shape in ("cloud_night_a", "cloud_night_b"):
        try:
            save(upscale(crop_alpha(raw(shape)), 2), shape)
        except FileNotFoundError:
            print(f"skip {shape} (no raw)")

    for band in ("mountains_night", "pines_night"):
        try:
            save(crop_alpha(cut_sky(mirror_h(crop_alpha(raw(band))))), band)
        except FileNotFoundError:
            print(f"skip {band} (no raw)")

    try:
        tree = cut_sky(crop_alpha(raw("big_tree_night")), min_area=12, pale_luma=100)
        tree = key_out_sky(tree)  # sealed sky pocket + ghost firs under the canopy
        tree = ground_tree(tree)  # soil strip where the baked mound used to be
        # the raw bakes a daylight canopy — pull it into the night palette so
        # the oak sits in the same moonlit teal register as the pines
        tree = night_tint(tree, (0.5, 0.72, 0.8))
        save(upscale(crop_alpha(tree), 2), "big_tree_night")
    except FileNotFoundError:
        print("skip big_tree_night (no raw)")

    for leaf in ("leaf_a", "leaf_b"):
        try:
            save(upscale(crop_alpha(raw(leaf)), 2), leaf)
        except FileNotFoundError:
            print(f"skip {leaf} (no raw)")

    for prop in PROPS:
        try:
            # no_bg generations arrive with clean alpha; silhouette props are
            # legitimately dark blue, so no sky key-out here — inspect instead
            save(upscale(crop_alpha(raw(prop)), 2), prop)
        except FileNotFoundError:
            print(f"skip {prop} (no raw)")

    try:
        grass = clean_ground(raw("grass_night"))
        # blade band: from the first row with real coverage take a fixed window —
        # the raw has empty sky above and noisy baked soil below
        px = grass.load()
        gw, gh = grass.size
        top = next(
            (y for y in range(gh) if sum(1 for x in range(gw) if px[x, y][3] > 0) / gw > 0.15),
            0,
        )
        grass = grass.crop((0, top, gw, min(gh, top + 40)))
        grass = grass.resize((96, 48), Image.NEAREST)
        # reference HUD: moonlit but still saturated GREEN meadow, not teal —
        # keep green nearly full, pull red a bit and blue hardest
        grass = night_tint(mirror_h(grass), (0.72, 0.98, 0.6))
        grass = fill_soil(grass, soil=(30, 22, 18), guard_frac=0.3)
        grass = dim_soil(grass)
        save(upscale(grass, 2), "grass_night")  # 96x48 -> mirrored -> 384x96
    except FileNotFoundError:
        print("skip grass_night (no raw)")


def register():
    if not ENTRIES:
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
