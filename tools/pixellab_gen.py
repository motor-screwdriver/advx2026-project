#!/usr/bin/env python3
"""pixellab_gen.py — PixelLab AI pixel-art generation helper for 8bit Sleep.

Thin CLI over the PixelLab REST API (https://api.pixellab.ai/v1). The API key
is read from the PIXELLAB_SECRET env var or from the repo-root .env file (see
.env.example). Raw outputs land in assets/_src/pixellab/ (gitignored), where
the rest of the art pipeline (tools/pixelate.py, tools/art/) can pick them up.

Commands:
  balance   Show remaining credits (free, no generation).
  image     Text-to-pixel-art via /generate-image-pixflux.
  animate   Text-guided 64x64 animation via /animate-with-text. Requires a
            reference image (e.g. one produced by `image`); saves one PNG per
            frame plus a horizontal spritesheet.

Usage:
  python3 tools/pixellab_gen.py balance
  python3 tools/pixellab_gen.py image "iron sword icon" --size 64 --no-bg \\
      --out sword.png
  python3 tools/pixellab_gen.py animate "human mage" --action walk \\
      --ref assets/_src/pixellab/mage.png --frames 4 --out mage_walk
"""

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = "https://api.pixellab.ai/v1"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT_DIR = os.path.join(ROOT, "assets", "_src", "pixellab")


def load_secret():
    secret = os.environ.get("PIXELLAB_SECRET")
    if secret:
        return secret
    env_path = os.path.join(ROOT, ".env")
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("PIXELLAB_SECRET="):
                    return line.split("=", 1)[1].strip()
    except OSError:
        pass
    sys.exit("PIXELLAB_SECRET not set (env var or .env); see .env.example")


def post(path, payload):
    body = json.dumps(payload).encode()
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
        sys.exit(f"API error {e.code} on {path}: {detail}")


def b64_image(path):
    with open(path, "rb") as f:
        return {"type": "base64", "base64": base64.b64encode(f.read()).decode()}


def save_b64_png(b64, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(b64))
    print("wrote", out_path)


def report_usage(data):
    usage = data.get("usage")
    if usage:
        print("usage:", json.dumps(usage))


def cmd_balance(_args):
    req = urllib.request.Request(
        BASE_URL + "/balance",
        headers={"Authorization": "Bearer " + load_secret()},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(json.dumps(json.loads(resp.read()), indent=2))
    except urllib.error.HTTPError as e:
        sys.exit(f"API error {e.code} on /balance: {e.read().decode(errors='replace')}")


def cmd_image(args):
    payload = {
        "description": args.description,
        "image_size": {"width": args.size, "height": args.size},
        "no_background": args.no_bg,
    }
    if args.negative:
        payload["negative_description"] = args.negative
    if args.seed is not None:
        payload["seed"] = args.seed
    data = post("/generate-image-pixflux", payload)
    report_usage(data)
    out = args.out or args.description.replace(" ", "_")[:40] + ".png"
    if not os.path.isabs(out):
        out = os.path.join(DEFAULT_OUT_DIR, out)
    save_b64_png(data["image"]["base64"], out)


def cmd_animate(args):
    payload = {
        "description": args.description,
        "action": args.action,
        "image_size": {"width": 64, "height": 64},
        "view": args.view,
        "direction": args.direction,
        "reference_image": b64_image(args.ref),
        "n_frames": args.frames,
    }
    if args.seed is not None:
        payload["seed"] = args.seed
    data = post("/animate-with-text", payload)
    report_usage(data)
    frames = data["images"]
    out_base = args.out or (args.description.replace(" ", "_")[:30] + "_" + args.action)
    if not os.path.isabs(out_base):
        out_base = os.path.join(DEFAULT_OUT_DIR, out_base)
    frame_paths = []
    for i, img in enumerate(frames):
        p = f"{out_base}_f{i}.png"
        save_b64_png(img["base64"], p)
        frame_paths.append(p)
    if len(frame_paths) > 1:
        from PIL import Image

        imgs = [Image.open(p) for p in frame_paths]
        w, h = imgs[0].size
        sheet = Image.new("RGBA", (w * len(imgs), h))
        for i, im in enumerate(imgs):
            sheet.paste(im, (i * w, 0))
        os.makedirs(os.path.dirname(out_base), exist_ok=True)
        sheet_path = out_base + "_sheet.png"
        sheet.save(sheet_path)
        print("wrote", sheet_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("balance", help="show remaining credits").set_defaults(fn=cmd_balance)

    p_img = sub.add_parser("image", help="text-to-pixel-art (pixflux)")
    p_img.add_argument("description")
    p_img.add_argument("--size", type=int, default=64, help="square side, 16-400 (default 64)")
    p_img.add_argument("--no-bg", action="store_true", help="transparent background")
    p_img.add_argument("--negative", help="negative prompt")
    p_img.add_argument("--seed", type=int)
    p_img.add_argument("--out", help="output PNG (default: assets/_src/pixellab/<desc>.png)")
    p_img.set_defaults(fn=cmd_image)

    p_anim = sub.add_parser("animate", help="text-guided animation (fixed 64x64)")
    p_anim.add_argument("description", help="character description")
    p_anim.add_argument("--action", required=True, help="e.g. walk, run, attack, idle")
    p_anim.add_argument("--ref", required=True, help="reference image of the character")
    p_anim.add_argument("--frames", type=int, default=4, help="2-20 (default 4)")
    p_anim.add_argument("--view", default="side", choices=["side", "front", "back", "low top-down", "high top-down"])
    p_anim.add_argument("--direction", default="south")
    p_anim.add_argument("--seed", type=int)
    p_anim.add_argument("--out", help="output basename (default: assets/_src/pixellab/<desc>_<action>)")
    p_anim.set_defaults(fn=cmd_animate)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
