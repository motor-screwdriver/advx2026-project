#!/usr/bin/env python3
"""Compose the cloud curtain for the wipe transition from the cloud sheets in
docs/clouds/. Output: assets/design/gen/cloud_curtain.png — a wide RGBA strip,
solid-packed in the center, irregular puffy edges left/right (alpha), so the
screen cover looks like clouds drifting over the UI instead of a hard box.
"""
import math
import os
import random
from collections import deque

from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEETS = [
    os.path.join(ROOT, "docs", "clouds", "31-облака-вечерние-1.png"),
    os.path.join(ROOT, "docs", "clouds", "32-облака-вечерние-2.png"),
]
OUT = os.path.join(ROOT, "assets", "design", "gen", "cloud_curtain.png")

NIGHT = (16, 10, 32)  # deep evening sky, matches the clouds' undersides


def key_black(im, thr=30, ramp=48):
    """Key out the black background with a soft alpha ramp so cloud rims stay
    feathered instead of a hard 1-bit cutout."""
    rgb = im.convert("RGB")
    px = rgb.load()
    out = Image.new("RGBA", rgb.size)
    opx = out.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            m = max(r, g, b)
            if m < thr:
                a = 0
            else:
                a = min(255, (m - thr) * 255 // ramp)
            opx[x, y] = (r, g, b, a)
    return out


def extract_clouds(paths):
    """Connected-component extraction of individual clouds from the sheets."""
    clouds = []
    for path in paths:
        keyed = key_black(Image.open(path))
        small = keyed.resize((256, 256))
        alpha = small.getchannel("A").load()
        seen = [[False] * 256 for _ in range(256)]
        for sy in range(256):
            for sx in range(256):
                if seen[sy][sx] or alpha[sx, sy] == 0:
                    continue
                q = deque([(sx, sy)])
                xs, ys = [], []
                while q:
                    x, y = q.popleft()
                    if x < 0 or y < 0 or x >= 256 or y >= 256 or seen[y][x] or alpha[x, y] == 0:
                        continue
                    seen[y][x] = True
                    xs.append(x)
                    ys.append(y)
                    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
                if len(xs) < 200:
                    continue
                k = keyed.width / 256
                box = (
                    max(int(min(xs) * k) - 4, 0),
                    max(int(min(ys) * k) - 4, 0),
                    min(int(max(xs) * k) + 5, keyed.width),
                    min(int(max(ys) * k) + 5, keyed.height),
                )
                cloud = keyed.crop(box)
                # drop stray keyed-off halo: keep as is, black is already alpha
                clouds.append(cloud)
    return clouds


def dim(cloud, factor):
    r, g, b, a = cloud.split()
    r = r.point(lambda v: int(v * factor))
    g = g.point(lambda v: int(v * factor))
    b = b.point(lambda v: int(v * factor))
    return Image.merge("RGBA", (r, g, b, a))


def edge_fade(w, h, inner0, inner1):
    """Horizontal alpha mask: opaque across [inner0, inner1] (the zone that
    must fully cover the screen), then a strong feather to zero at both sides.
    The fade boundary wiggles per-row (layered sines) so it never reads as a
    straight dividing line, and a power curve makes the flanks dissolve hard."""
    grad = Image.new("L", (w, h))
    px = grad.load()

    def wiggle(y, phase):
        n = (
            math.sin(y * 0.011 + phase)
            + 0.6 * math.sin(y * 0.029 + phase * 2.3)
            + 0.4 * math.sin(y * 0.067 + phase * 4.1)
        ) / 2.0
        return n * 0.06 * w  # +-6% of width

    for y in range(h):
        i0 = inner0 + wiggle(y, 1.3)
        i1 = inner1 + wiggle(y, 4.7)
        for x in range(w):
            if x < i0:
                t = x / i0
            elif x > i1:
                t = (w - 1 - x) / (w - 1 - i1)
            else:
                t = 1.0
            # outer 35% of each flank is fully clear, then a steep feather
            t = max(0.0, min(1.0, (t - 0.35) / 0.65))
            t = t * t * (3 - 2 * t)  # smoothstep
            t = t**2.4  # bias toward transparency: flanks thin out early
            px[x, y] = int(t * 255)
    return grad


def main():
    random.seed(8)
    clouds = extract_clouds(SHEETS)
    print(f"extracted {len(clouds)} clouds")

    W, H = 2048, 1024
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # solid center block (guaranteed full cover), puffy border via clouds
    cx0, cx1 = int(W * 0.20), int(W * 0.80)
    block = Image.new("RGBA", (cx1 - cx0, H), (*NIGHT, 255))
    canvas.paste(block, (cx0, 0), block)

    def stamp(cloud, x, y, size, dark=False):
        scale = size / cloud.width
        c = cloud.resize((int(cloud.width * scale), int(cloud.height * scale)), Image.LANCZOS)
        if dark:
            c = dim(c, 0.7)
        canvas.paste(c, (int(x), int(y)), c)

    # pack the solid zone wall-to-wall with clouds: a jittered grid of big
    # overlapping puffs (no bare night sky may show through), then a loose
    # sprinkle of bright ones on top for depth
    for gy in range(-160, H + 40, 130):
        for gx in range(cx0 - 180, cx1 + 60, 130):
            c = random.choice(clouds)
            stamp(
                c,
                gx + random.uniform(-60, 60),
                gy + random.uniform(-60, 60),
                random.uniform(340, 560),
                dark=random.random() < 0.45,
            )
    for _ in range(30):
        c = random.choice(clouds)
        x = random.uniform(cx0 - 80, cx1 - 120)
        y = random.uniform(-60, H - 40)
        stamp(c, x, y, random.uniform(300, 620), dark=random.random() < 0.5)

    # puffy walls: a full-height column of overlapping clouds on each boundary,
    # then a few sparse outriders so the silhouette stays irregular
    for bx, direction in ((cx0, -1), (cx1, 1)):
        y = -160
        while y < H + 80:
            c = random.choice(clouds)
            size = random.uniform(380, 560)
            stamp(c, bx - size * 0.55 + random.uniform(-40, 40), y, size)
            y += size * 0.38
        for _ in range(7):  # outriders drifting away from the wall
            c = random.choice(clouds)
            size = random.uniform(170, 340)
            x = bx + direction * random.uniform(W * 0.03, W * 0.16) - size * 0.5
            stamp(c, x, random.uniform(-40, H - 120), size, dark=True)

    # feather the flanks: alpha ramps out toward both sides so the puffy
    # edges dissolve over the UI instead of ending in opaque cloud chunks
    alpha = ImageChops.multiply(canvas.getchannel("A"), edge_fade(W, H, cx0, cx1))
    canvas.putalpha(alpha)

    canvas = canvas.resize((1536, 768), Image.LANCZOS)
    alpha = canvas.getchannel("A")  # quantize dithers alpha; keep the original
    canvas = canvas.quantize(colors=255, method=Image.Quantize.FASTOCTREE).convert("RGBA")
    canvas.putalpha(alpha)
    canvas.save(OUT, optimize=True)
    print("saved", OUT, canvas.size, os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
