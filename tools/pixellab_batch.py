#!/usr/bin/env python3
"""pixellab_batch.py — regenerate every visual asset of 8bit Sleep via PixelLab.

Produces a full alternative asset tree under assets/pixellab/ that mirrors the
geometry of the original pipeline output (same strip layouts, same on-disk
sizes = pixel grid x 4 upscale), then points assets/manifest.data.json +
assets/manifest.ts and app.json at the new files. Originals stay untouched;
reverting is `git checkout assets/manifest.* app.json`.

Phases:
  api    — call PixelLab for every missing raw generation (resumable: raws are
           cached in assets/_src/pixellab/batch/, existing files are skipped).
  build  — post-process raws into final strips (upscale x4, gold recolor,
           1-bit threshold, root icon variants) under assets/pixellab/.
  switch — rewrite manifest paths + app.json to the pixellab tree.

Usage:
  python3 tools/pixellab_batch.py            # api + build + switch
  python3 tools/pixellab_batch.py build      # skip API, rebuild from raws
  python3 tools/pixellab_batch.py switch     # only rewrite manifest/app.json
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
from pixellab_gen import load_secret  # noqa: E402

from PIL import Image  # noqa: E402

ROOT = manifest_lib.REPO_ROOT
BASE_URL = "https://api.pixellab.ai/v1"
RAW_DIR = os.path.join(ROOT, "assets", "_src", "pixellab", "batch")
OUT_DIR = os.path.join(ROOT, "assets", "pixellab")

STYLE = "8-bit retro console RPG pixel art, dark fantasy, limited color palette, crisp pixels"

HEROES = {
    "monk": "bald martial arts monk with prayer beads, one bare arm",
    "ranger": "hooded ranger with quiver on back, holding a bow",
    "druid": "druid with wooden antlers, holding a gnarled staff",
    "rogue": "hooded rogue with face mask, dual daggers",
    "knight": "knight in plate armor with plumed helm, sword and shield",
    "paladin": "paladin in ornate armor with winged helm, war hammer, cross emblem",
    "ninja": "ninja with masked face, katana on back",
    "mage": "wizard with pointed hat, holding a staff with glowing orb",
    "warlock": "warlock with horned hood, holding a skull staff",
}

ICONS = {
    # artifacts
    "art_alarm_bell": "small brass alarm bell, game item icon",
    "art_coffee_amulet": "amulet with a coffee bean gem, game item icon",
    "art_hourglass": "wooden hourglass with glowing sand, game item icon",
    "art_iron_armor": "iron breastplate armor, game item icon",
    "art_lucky_coin": "golden lucky coin with star, game item icon",
    "art_night_watch": "hooded lantern watchman lantern, game item icon",
    "art_phoenix_feather": "glowing orange phoenix feather, game item icon",
    "art_second_wind": "winged boot with wind swirls, game item icon",
    "art_star_map": "folded star map with constellations, game item icon",
    "art_warm_blanket": "cozy folded warm blanket, game item icon",
    # cosmetics
    "cos_aura": "glowing magical aura ring, game cosmetic icon",
    "cos_crown": "golden royal crown, game cosmetic icon",
    "cos_frame": "ornate golden picture frame, game cosmetic icon",
    "cos_hat": "wide-brimmed adventurer hat, game cosmetic icon",
    "cos_mask": "mysterious masquerade mask, game cosmetic icon",
    "cos_pet": "cute tiny slime pet, game cosmetic icon",
    "cos_plant": "potted sprout plant, game cosmetic icon",
    "cos_scarf": "striped wool scarf, game cosmetic icon",
    # hearts
    "heart_full": "red pixel heart, full health, game HUD icon",
    "heart_empty": "dark empty heart outline, game HUD icon",
    "heart_armor": "silver armored heart with metal plates, game HUD icon",
}

SCENES = {
    "scene_perfect": "serene forest campsite at golden sunrise, god rays, clear sky, birds, fantasy landscape",
    "scene_good": "calm forest campsite in soft blue morning light, gentle mist, fantasy landscape",
    "scene_bad": "gloomy forest campsite under overcast grey sky, dying campfire, fantasy landscape",
    "scene_terrible": "stormy night forest campsite, heavy rain, lightning, puddles, fantasy landscape",
    "scene_death": "cursed dead forest at night, thick fog, dead twisted trees, green will-o-wisps, fantasy landscape",
    "scene_resurrection": "forest campsite at dawn, radiant divine light breaking through clouds, motes of light, fantasy landscape",
}

FAILURES = []


# ---------------------------------------------------------------- api phase

def api_post(path, payload, retries=3):
    body = json.dumps(payload).encode()
    for attempt in range(retries):
        req = urllib.request.Request(
            BASE_URL + path,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + load_secret(),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")
            if e.code in (429, 529) and attempt < retries - 1:
                wait = 20 * (attempt + 1)
                print(f"  rate limited ({e.code}), retry in {wait}s")
                time.sleep(wait)
                continue
            raise RuntimeError(f"API error {e.code} on {path}: {detail}")


def b64_file(path):
    with open(path, "rb") as f:
        return {"type": "base64", "base64": base64.b64encode(f.read()).decode()}


def save_frames(data, raw_base):
    """Persist API response frames as <raw_base>_f{i}.png. Returns count."""
    os.makedirs(os.path.dirname(raw_base), exist_ok=True)
    images = data.get("images") or [data["image"]]
    for i, img in enumerate(images):
        with open(f"{raw_base}_f{i}.png", "wb") as f:
            f.write(base64.b64decode(img["base64"]))
    return len(images)


def raw_exists(raw_base):
    return os.path.exists(f"{raw_base}_f0.png")


def gen_image(key, description, width, height, no_bg=True, seed=None):
    """pixflux single image -> raw <key>_f0.png. Skips if cached."""
    raw_base = os.path.join(RAW_DIR, key)
    if raw_exists(raw_base):
        print(f"skip {key} (cached)")
        return True
    payload = {
        "description": f"{description}, {STYLE}",
        "image_size": {"width": width, "height": height},
        "no_background": no_bg,
    }
    if seed is not None:
        payload["seed"] = seed
    try:
        data = api_post("/generate-image-pixflux", payload)
        n = save_frames(data, raw_base)
        print(f"ok   {key} ({n} frame, usage {data.get('usage')})")
        return True
    except Exception as e:  # noqa: BLE001 - record and continue the batch
        print(f"FAIL {key}: {e}")
        FAILURES.append(key)
        return False


def gen_anim(key, description, action, ref_raw, n_frames, seed=None):
    """animate-with-text (64x64) -> raw <key>_f{i}.png. Skips if cached."""
    raw_base = os.path.join(RAW_DIR, key)
    if raw_exists(raw_base):
        print(f"skip {key} (cached)")
        return True
    payload = {
        "description": f"{description}, {STYLE}",
        "action": action,
        "image_size": {"width": 64, "height": 64},
        "view": "side",
        "direction": "east",
        "reference_image": b64_file(f"{ref_raw}_f0.png"),
        "n_frames": n_frames,
    }
    if seed is not None:
        payload["seed"] = seed
    try:
        data = api_post("/animate-with-text", payload)
        n = save_frames(data, raw_base)
        print(f"ok   {key} ({n} frames, usage {data.get('usage')})")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"FAIL {key}: {e}")
        FAILURES.append(key)
        return False


def phase_api():
    for name, desc in HEROES.items():
        base = f"hero_{name}"
        if not gen_image(base, f"{desc}, full body, side view", 64, 64, seed=1000):
            continue  # no reference -> skip its animations
        ref = os.path.join(RAW_DIR, base)
        gen_anim(f"{base}_idle", desc, "idle breathing, subtle bob", ref, 2, seed=2000)
        gen_anim(f"{base}_walk", desc, "walk cycle", ref, 6, seed=3000)

    if gen_image("chest", "ornate wooden treasure chest with metal bands, side view, closed lid", 64, 64, seed=4000):
        gen_anim("chest_open", "ornate wooden treasure chest, side view", "lid opening", os.path.join(RAW_DIR, "chest"), 3, seed=4001)
    gen_image("gravestone", "old mossy gravestone tombstone, side view", 48, 48, seed=5000)

    for name, desc in SCENES.items():
        for frame in range(3):
            gen_image(f"{name}_v{frame}", desc, 256, 144, no_bg=False, seed=6000 + frame)

    for name, desc in ICONS.items():
        gen_image(f"icon_{name}", desc, 32, 32, seed=7000)

    gen_image("app_icon", "sleeping knight helmet under a crescent moon, game app icon, centered emblem", 256, 256, no_bg=False, seed=8000)
    gen_image("logo", "emblem of a tiny knight sleeping on a crescent moon, stars around, no text, game logo", 256, 256, seed=8001)


# ---------------------------------------------------------------- build phase

def load_frames(raw_base):
    frames = []
    i = 0
    while os.path.exists(f"{raw_base}_f{i}.png"):
        frames.append(Image.open(f"{raw_base}_f{i}.png").convert("RGBA"))
        i += 1
    if not frames:
        raise FileNotFoundError(raw_base)
    return frames


def normalize(frames, n):
    """Trim or cycle the frame list to exactly n frames."""
    if len(frames) >= n:
        idx = [round(i * (len(frames) - 1) / (n - 1)) for i in range(n)] if n > 1 else [0]
        return [frames[i] for i in idx]
    out = []
    while len(out) < n:
        out.extend(frames)
    return out[:n]


def upscale(img, scale):
    return img.resize((img.width * scale, img.height * scale), Image.NEAREST)


def save_strip(frames, out_rel):
    """Horizontal strip of equally sized frames, written under OUT_DIR."""
    out_path = os.path.join(OUT_DIR, out_rel)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    w, h = frames[0].size
    strip = Image.new("RGBA", (w * len(frames), h))
    for i, im in enumerate(frames):
        strip.paste(im, (i * w, 0))
    strip.save(out_path)
    print("wrote", os.path.relpath(out_path, ROOT))


GOLD_RAMP = [  # dark -> bright, classic golden-skin recolor
    (40, 26, 8), (94, 60, 16), (148, 98, 24),
    (202, 142, 34), (240, 190, 60), (255, 234, 140),
]


def goldify(img):
    """Luminance -> gold ramp, alpha preserved (pipeline's golden-skin idiom)."""
    img = img.convert("RGBA")
    px = img.load()
    n = len(GOLD_RAMP) - 1
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (r * 299 + g * 587 + b * 114) // 1000
            t = min(1.0, lum / 255.0) * n
            i = int(t)
            f = t - i
            c0, c1 = GOLD_RAMP[i], GOLD_RAMP[min(i + 1, n)]
            px[x, y] = (
                round(c0[0] + (c1[0] - c0[0]) * f),
                round(c0[1] + (c1[1] - c0[1]) * f),
                round(c0[2] + (c1[2] - c0[2]) * f),
                a,
            )
    return img


def one_bit(img):
    """Pure black/white threshold for the e-ink section, alpha preserved."""
    img = img.convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = (r * 299 + g * 587 + b * 114) // 1000
            v = 255 if lum >= 128 else 0
            px[x, y] = (v, v, v, a)
    return img


def grid_downscale(img, grid):
    return img.resize((grid, grid), Image.LANCZOS)


def phase_build():
    # --- heroes: idle 2x256 (512x256), walk 6x256 (1536x256), + gold + 1bit ---
    for name in HEROES:
        base = f"hero_{name}"
        try:
            idle = normalize(load_frames(os.path.join(RAW_DIR, f"{base}_idle")), 2)
            walk = normalize(load_frames(os.path.join(RAW_DIR, f"{base}_walk")), 6)
        except FileNotFoundError:
            print(f"skip build {base} (no raws)")
            continue
        idle4 = [upscale(f, 4) for f in idle]
        walk4 = [upscale(f, 4) for f in walk]
        save_strip(idle4, f"sprites/{base}.png")
        save_strip(walk4, f"sprites/{base}_walk.png")
        save_strip([goldify(f) for f in idle4], f"sprites/{base}_gold.png")
        save_strip([goldify(f) for f in walk4], f"sprites/{base}_gold_walk.png")
        save_strip([one_bit(f) for f in idle4], f"sprites/1bit/{base}.png")
        save_strip([one_bit(f) for f in walk4], f"sprites/1bit/{base}_walk.png")

    # --- chest 3x192 (48 grid), gravestone 1x192 ---
    try:
        chest = normalize(load_frames(os.path.join(RAW_DIR, "chest_open")), 3)
    except FileNotFoundError:
        try:  # no open animation -> reuse the closed frame for all 3 slots
            chest = normalize(load_frames(os.path.join(RAW_DIR, "chest")), 3)
        except FileNotFoundError:
            chest = None
            print("skip build chest (no raws)")
    if chest:
        save_strip([upscale(grid_downscale(f, 48), 4) for f in chest], "sprites/chest.png")
    try:
        grave = load_frames(os.path.join(RAW_DIR, "gravestone"))[:1]
        save_strip([upscale(f, 4) for f in grave], "sprites/gravestone.png")
    except FileNotFoundError:
        print("skip build gravestone (no raws)")

    # --- 1bit hearts (16 grid -> 64) + hero_icon_40 (40 grid -> 160) ---
    for heart in ("1bit_heart_full", "1bit_heart_empty"):
        src = "heart_full" if heart.endswith("full") else "heart_empty"
        try:
            icon = load_frames(os.path.join(RAW_DIR, f"icon_{src}"))[0]
            g = grid_downscale(icon, 16)
            save_strip([upscale(one_bit(upscale(g, 4)), 1)], f"sprites/1bit/{heart}.png")
        except FileNotFoundError:
            print(f"skip build {heart} (no raws)")
    try:
        knight = load_frames(os.path.join(RAW_DIR, "hero_knight_idle"))[0]
        save_strip([upscale(one_bit(upscale(grid_downscale(knight, 40), 4)), 1)], "sprites/1bit/hero_icon_40.png")
    except FileNotFoundError:
        print("skip build hero_icon_40 (no raws)")

    # --- scenes: 3x1024x576 (256x144 grid x4) ---
    for name in SCENES:
        frames = []
        for v in range(3):
            try:
                frames.append(load_frames(os.path.join(RAW_DIR, f"{name}_v{v}"))[0])
            except FileNotFoundError:
                break
        if len(frames) == 3:
            save_strip([upscale(f, 4) for f in frames], f"scenes/{name}.png")
        else:
            print(f"skip build {name} (missing variants)")

    # --- icons: 32 grid x2 -> 64; app_icon/logo: 256 grid x4 -> 1024 ---
    for name in ICONS:
        try:
            icon = load_frames(os.path.join(RAW_DIR, f"icon_{name}"))[0]
            save_strip([upscale(icon, 2)], f"icons/{name}.png")
        except FileNotFoundError:
            print(f"skip build icon {name} (no raws)")
    for name in ("app_icon", "logo"):
        try:
            img = load_frames(os.path.join(RAW_DIR, name))[0]
            save_strip([upscale(img, 4)], f"icons/{name}.png")
        except FileNotFoundError:
            print(f"skip build {name} (no raws)")

    # --- root icons for app.json, derived from the app_icon art ---
    try:
        app = load_frames(os.path.join(RAW_DIR, "app_icon"))[0]
        root_out = os.path.join(OUT_DIR, "root")
        os.makedirs(root_out, exist_ok=True)
        upscale(app, 4).save(os.path.join(root_out, "icon.png"))                    # 1024
        upscale(app, 4).save(os.path.join(root_out, "android-icon-foreground.png"))
        app.resize((48, 48), Image.NEAREST).save(os.path.join(root_out, "favicon.png"))
        app.save(os.path.join(root_out, "splash-icon.png"))                          # 256
        bg = Image.new("RGBA", (1024, 1024), (34, 24, 18, 255))                      # #221812
        bg.save(os.path.join(root_out, "android-icon-background.png"))
        mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        big = upscale(app, 4)
        alpha = big.getchannel("A")
        white = Image.new("RGBA", big.size, (255, 255, 255, 255))
        mono.paste(white, (0, 0), alpha)
        mono.save(os.path.join(root_out, "android-icon-monochrome.png"))
        print("wrote root icon variants")
    except FileNotFoundError:
        print("skip root icons (no app_icon raw)")


# ---------------------------------------------------------------- switch phase

REPLACED = {"sprites": [], "sprites_1bit": [], "scenes": [], "icons": []}


def collect_replaced():
    for name in HEROES:
        base = f"hero_{name}"
        REPLACED["sprites"] += [base, f"{base}_walk", f"{base}_gold", f"{base}_gold_walk"]
        REPLACED["sprites_1bit"] += [base, f"{base}_walk"]
    REPLACED["sprites"] += ["chest", "gravestone"]
    REPLACED["sprites_1bit"] += ["1bit_heart_empty", "1bit_heart_full", "hero_icon_40"]
    REPLACED["scenes"] += list(SCENES)
    REPLACED["icons"] += list(ICONS) + ["app_icon", "logo"]


def phase_switch():
    collect_replaced()
    data = manifest_lib.load_data()
    missing = []
    for section, names in REPLACED.items():
        for name in names:
            entry = data.get(section, {}).get(name)
            if not entry:
                missing.append(f"{section}/{name}")
                continue
            if entry["path"].startswith("pixellab/"):
                continue  # already switched
            new_rel = entry["path"].replace("sprites/1bit/", "pixellab/sprites/1bit/")
            for old in ("sprites/", "scenes/", "icons/"):
                if new_rel.startswith(old):
                    new_rel = "pixellab/" + new_rel
                    break
            target = os.path.join(ROOT, "assets", new_rel)
            if not os.path.exists(target):
                missing.append(f"{section}/{name} (no file {new_rel})")
                continue
            entry["path"] = new_rel
    manifest_lib.save_data(data)
    manifest_lib.write_manifest_ts(data)
    if missing:
        print("NOT switched (missing entry or file):")
        for m in missing:
            print("  -", m)

    # app.json -> pixellab root icons
    app_json_path = os.path.join(ROOT, "app.json")
    with open(app_json_path) as f:
        cfg = json.load(f)
    expo = cfg["expo"]
    root_icons = os.path.join(OUT_DIR, "root", "icon.png")
    if os.path.exists(root_icons):
        expo["icon"] = "./assets/pixellab/root/icon.png"
        expo["web"]["favicon"] = "./assets/pixellab/root/favicon.png"
        expo["splash"] = {"image": "./assets/pixellab/root/splash-icon.png",
                          "backgroundColor": "#221812"}
        ai = expo["android"]["adaptiveIcon"]
        ai["foregroundImage"] = "./assets/pixellab/root/android-icon-foreground.png"
        ai["backgroundImage"] = "./assets/pixellab/root/android-icon-background.png"
        ai["monochromeImage"] = "./assets/pixellab/root/android-icon-monochrome.png"
        with open(app_json_path, "w") as f:
            json.dump(cfg, f, indent=2)
            f.write("\n")
        print("app.json switched to pixellab root icons")
    else:
        print("app.json NOT switched (no root icons)")


def main():
    phases = sys.argv[1:] or ["api", "build", "switch"]
    if "api" in phases:
        phase_api()
    if "build" in phases:
        phase_build()
    if "switch" in phases:
        phase_switch()
    if FAILURES:
        print(f"\n{len(FAILURES)} API failures:")
        for f_ in FAILURES:
            print("  -", f_)
        sys.exit(1)
    print("\ndone")


if __name__ == "__main__":
    main()
