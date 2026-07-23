#!/usr/bin/env python3
"""pixellab_walkfix.py — experiment with PixelLab params for clean side-view
walk cycles. Scratch tool; candidates go to assets/_src/pixellab/walkfix/.

Reads PIXELLAB_SECRET / _2 / _3 from the repo-root .env, tries _3 first and
falls back on HTTP 402 (out of generations).

Usage:
  python3 tools/pixellab_walkfix.py text <out_base> <ref.png> \
      --action "walk cycle, side view profile" --guidance 5 --frames 4 \
      --desc "knight in plate armor..." [--seed N]
  python3 tools/pixellab_walkfix.py skeleton-estimate <image.png> <out.json>
  python3 tools/pixellab_walkfix.py skeleton-anim <out_base> <ref.png> \
      --keypoints kf.json [--guidance 4] [--seed N]
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE_URL = "https://api.pixellab.ai/v1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "_src", "pixellab", "walkfix")

STYLE = "8-bit retro console RPG pixel art, dark fantasy, limited color palette, crisp pixels"


def load_keys():
    keys = {}
    env_path = os.path.join(ROOT, ".env")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            for name in ("PIXELLAB_SECRET_3", "PIXELLAB_SECRET_2", "PIXELLAB_SECRET"):
                if line.startswith(name + "="):
                    keys[name] = line.split("=", 1)[1].strip()
    order = ["PIXELLAB_SECRET_3", "PIXELLAB_SECRET_2", "PIXELLAB_SECRET"]
    out = [k for k in order if k in keys]
    if not out:
        sys.exit("no PIXELLAB_SECRET* keys in .env")
    return out


def post(path, payload):
    """Try each key in preference order; on 402 move to the next."""
    body = json.dumps(payload).encode()
    keys = load_keys()
    last_err = None
    for attempt in range(2):
        for key_name in keys:
            req = urllib.request.Request(
                BASE_URL + path,
                data=body,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + load_secret_named(key_name),
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=300) as resp:
                    data = json.loads(resp.read())
                    print(f"  [key={key_name}] usage={data.get('usage')}")
                    return data
            except urllib.error.HTTPError as e:
                detail = e.read().decode(errors="replace")
                if e.code == 402:
                    print(f"  [key={key_name}] 402 out of quota")
                    last_err = f"402 on {key_name}"
                    continue
                if e.code in (429, 529):
                    print(f"  [key={key_name}] rate limited ({e.code}), backing off")
                    last_err = f"{e.code} on {key_name}"
                    continue
                sys.exit(f"API error {e.code} on {path}: {detail}")
        if attempt == 0:
            time.sleep(20)
    sys.exit(f"all keys failed: {last_err}")


def load_secret_named(name):
    env_path = os.path.join(ROOT, ".env")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip()
    sys.exit(f"{name} not found in .env")


def b64_file(path):
    with open(path, "rb") as f:
        return {"type": "base64", "base64": base64.b64encode(f.read()).decode()}


def save_frames(data, out_base):
    os.makedirs(os.path.dirname(out_base), exist_ok=True)
    images = data.get("images") or [data["image"]]
    paths = []
    for i, img in enumerate(images):
        p = f"{out_base}_f{i}.png"
        with open(p, "wb") as f:
            f.write(base64.b64decode(img["base64"]))
        paths.append(p)
    print("wrote", len(paths), "frames ->", out_base + "_f*.png")
    if len(paths) > 1:
        from PIL import Image

        imgs = [Image.open(p) for p in paths]
        w, h = imgs[0].size
        sheet = Image.new("RGBA", (w * len(imgs), h))
        for i, im in enumerate(imgs):
            sheet.paste(im, (i * w, 0))
        sheet_path = out_base + "_sheet.png"
        sheet.save(sheet_path)
        print("wrote", sheet_path)


def out_path(base):
    if not os.path.isabs(base):
        base = os.path.join(OUT_DIR, base)
    return base


def cmd_text(args):
    payload = {
        "description": f"{args.desc}, {STYLE}",
        "action": args.action,
        "image_size": {"width": 64, "height": 64},
        "view": "side",
        "direction": "east",
        "reference_image": b64_file(args.ref),
        "n_frames": args.frames,
    }
    if args.guidance is not None:
        payload["image_guidance_scale"] = args.guidance
    if args.seed is not None:
        payload["seed"] = args.seed
    data = post("/animate-with-text", payload)
    save_frames(data, out_path(args.out))


def cmd_skel_est(args):
    data = post("/estimate-skeleton", {"image": b64_file(args.image)})
    print("usage:", data.get("usage"))
    with open(args.out, "w") as f:
        json.dump(data["keypoints"], f, indent=2)
    print("wrote", args.out, f"({len(data['keypoints'])} keypoints)")
    for kp in data["keypoints"]:
        print(f"  {kp['label']:20s} x={kp['x']:.1f} y={kp['y']:.1f} z={kp.get('z_index')}")


def cmd_skel_anim(args):
    with open(args.keypoints) as f:
        frames_kp = json.load(f)  # list of frames, each a list of keypoints
    payload = {
        "image_size": {"width": 64, "height": 64},
        "reference_image": b64_file(args.ref),
        "view": "side",
        "direction": "east",
        "skeleton_keypoints": frames_kp,
    }
    if args.guidance is not None:
        payload["guidance_scale"] = args.guidance
    if args.seed is not None:
        payload["seed"] = args.seed
    data = post("/animate-with-skeleton", payload)
    save_frames(data, out_path(args.out))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("text", help="animate-with-text experiment")
    p.add_argument("out", help="output basename under walkfix/")
    p.add_argument("ref", help="reference image path")
    p.add_argument("--action", default="walk cycle, side view profile")
    p.add_argument("--guidance", type=float, default=None, help="image_guidance_scale (default 1.4)")
    p.add_argument("--frames", type=int, default=4)
    p.add_argument("--desc", default="knight in plate armor with plumed helm, sword and shield")
    p.add_argument("--seed", type=int, default=None)
    p.set_defaults(fn=cmd_text)

    p = sub.add_parser("skeleton-estimate", help="estimate skeleton keypoints of an image")
    p.add_argument("image")
    p.add_argument("out", help="output JSON path")
    p.set_defaults(fn=cmd_skel_est)

    p = sub.add_parser("skeleton-anim", help="animate-with-skeleton experiment")
    p.add_argument("out", help="output basename under walkfix/")
    p.add_argument("ref", help="reference image path")
    p.add_argument("--keypoints", required=True, help="JSON: list of frames of keypoints")
    p.add_argument("--guidance", type=float, default=None)
    p.add_argument("--seed", type=int, default=None)
    p.set_defaults(fn=cmd_skel_anim)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
