"""demo-3 Midnight Navy & Gold: raw Gemini PNGs -> web WebP (reuses the demo-2 roses/petals/venues)."""
import os, subprocess, sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R, O, PY = "assets/raw", "assets/img", sys.executable

def cut(src, dst, mx, bg="2b2b2b", tol="26"):
    subprocess.check_call([PY, "tools/cutout.py", f"{R}/{src}.png", dst, "--bg", bg, "--tol", tol, "--max", str(mx)])
    im = Image.open(dst).convert("RGBA"); bb = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    if bb: im = im.crop(bb)
    im.save(dst, "WEBP", quality=88)

# navy linen page texture
Image.open(f"{R}/n_paper.png").convert("RGB").resize((1024, 1024), Image.LANCZOS).save(f"{O}/paper_navy.webp", quality=82)

for src, dst, mx in [("n_top_l", "hero_top_l", 1400), ("n_top_r", "hero_top_r", 1400), ("n_bot_l", "hero_bot_l", 1400), ("n_corner", "frame_cluster", 900)]:
    cut(src, f"{O}/{dst}.webp", mx)
Image.open(f"{O}/hero_bot_l.webp").transpose(Image.FLIP_LEFT_RIGHT).save(f"{O}/hero_bot_r.webp", "WEBP", quality=88)

for src, dst in [("n_card", "closing_card"), ("n_card_m", "closing_card_m")]:
    cut(src, f"{O}/{dst}.webp", 2000, bg="ffffff", tol="12")
    im = Image.open(f"{O}/{dst}.webp").convert("RGBA"); a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    ivory = ndi.binary_opening((al > 200) & (r > 232) & (g > 224) & (b > 200) & (abs(r - g) < 14), iterations=4)
    lab, k = ndi.label(ivory); big = np.argmax(ndi.sum(ivory, lab, range(1, k + 1))) + 1
    ys, xs = np.where(lab == big); H, W = ivory.shape
    print(dst, im.size, "panel x %.3f-%.3f y %.3f-%.3f" % (xs.min() / W, xs.max() / W, ys.min() / H, ys.max() / H))
