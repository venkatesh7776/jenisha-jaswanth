"""Remove the flat white background from generated flower art and export WebP.

Background = white-ish pixels connected to the image border (flood fill), so pale
petals inside a flower stay opaque. Edges get a soft alpha ramp and the white fringe
is removed by un-blending against white.

usage:
  python cutout.py in.png out.webp [--max 1600]
  python cutout.py in.png outdir/prefix --split [--min-area 3000] [--max 600]
"""
import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("dst")
ap.add_argument("--split", action="store_true")
ap.add_argument("--min-area", type=int, default=3000)
ap.add_argument("--max", type=int, default=1600)
ap.add_argument("--tol", type=float, default=22)
a = ap.parse_args()

rgb = np.asarray(Image.open(a.src).convert("RGB")).astype(np.float32)
dist = (255 - rgb).max(axis=2)            # 0 = pure white
whiteish = dist < a.tol
lab, n = ndi.label(whiteish)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
bg = np.isin(lab, border[border > 0])
# enclosed pockets of near-pure white between flowers are background too
sizes = ndi.sum(np.ones_like(dist), lab, index=np.arange(1, n + 1))
means = ndi.mean(dist, lab, index=np.arange(1, n + 1))
pocket = np.zeros(n + 1, bool)
pocket[1:] = (sizes > dist.size * 0.00015) & (means < 7)
bg |= pocket[lab]

# soft edge: ramp alpha by "how non-white" within a thin band next to background
band = ndi.binary_dilation(bg, iterations=2) & ~bg
ramp = np.clip((dist - 4) / (a.tol * 1.6), 0, 1)
alpha = np.where(bg, 0.0, np.where(band, ramp, 1.0))
alpha = np.minimum(ndi.gaussian_filter(alpha, 0.6), np.where(bg, 0.0, 1.0))

# un-blend white fringe
a3 = np.clip(alpha, 1e-3, 1)[..., None]
col = np.clip((rgb - (1 - a3) * 255) / a3, 0, 255)
rgba = np.dstack([col, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, "RGBA")

def save(im, path, maxside):
    bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox: im = im.crop(bbox)
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    im.save(path, "WEBP", quality=88, method=6)
    print("saved", path, im.size)

if not a.split:
    # keep full canvas for corner/edge pieces (position matters), just resize
    w, h = img.size
    s = min(1, a.max / max(w, h))
    out = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    os.makedirs(os.path.dirname(a.dst) or ".", exist_ok=True)
    out.save(a.dst, "WEBP", quality=88, method=6)
    print("saved", a.dst, out.size)
else:
    solid = ndi.binary_dilation(alpha > 0.1, iterations=6)
    lab, n = ndi.label(solid)
    objs = ndi.find_objects(lab)
    pieces = []
    for i, sl in enumerate(objs, 1):
        area = (lab[sl] == i).sum()
        if area < a.min_area: continue
        pieces.append((sl[0].start, sl[1].start, i, sl))
    pieces.sort(key=lambda p: (round(p[0] / (rgb.shape[0] / 8)), p[1]))  # row-major
    for k, (_, _, i, sl) in enumerate(pieces):
        sub = rgba[sl].copy()
        sub[..., 3] = np.where(lab[sl] == i, sub[..., 3], 0)
        save(Image.fromarray(sub, "RGBA"), f"{a.dst}_{k + 1:02d}.webp", a.max)
