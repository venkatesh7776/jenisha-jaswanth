"""Turn a theme's raw Gemini PNGs into the web WebP files the site uses.
usage: python tools/process_theme.py <prefix> <key-hex>      e.g.  python tools/process_theme.py m 7a7a7a
Expects assets/raw/<prefix>_{paper,top_l,top_r,bot_l,corner,sprig_tl,sprig_br,blooms,petals,card,card_m,venue_wedding,venue_reception}.png
"""
import os, subprocess, sys, glob, shutil
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P, KEY = sys.argv[1], sys.argv[2]
R, O, PY = "assets/raw", "assets/img", sys.executable

def have(n): return os.path.exists(f"{R}/{P}_{n}.png")
def cut(n, dst, *extra, bg=KEY, tol="26", crop=True):
    if not have(n): print("missing", n); return False
    subprocess.check_call([PY, "tools/cutout.py", f"{R}/{P}_{n}.png", dst, "--bg", bg, "--tol", tol, *extra], stdout=subprocess.DEVNULL)
    if crop and "--split" not in extra:
        im = Image.open(dst).convert("RGBA"); bb = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
        if bb: im = im.crop(bb)
        im.save(dst, "WEBP", quality=88)
    return True

if have("paper"):
    im = Image.open(f"{R}/{P}_paper.png").convert("RGB").resize((1024, 1024), Image.LANCZOS)
    base = Image.new("RGB", im.size, tuple(np.asarray(im).reshape(-1, 3).mean(0).astype(int)))
    Image.blend(im, base, .35).save(f"{O}/paper_card.webp", quality=82)

for n, dst, mx in [("top_l", "hero_top_l", 1400), ("top_r", "hero_top_r", 1400), ("bot_l", "hero_bot_l", 1400),
                   ("corner", "frame_cluster", 900), ("sprig_tl", "sprig_tl", 1100), ("sprig_br", "sprig_br", 1100)]:
    cut(n, f"{O}/{dst}.webp", "--max", str(mx))
if os.path.exists(f"{O}/hero_bot_l.webp"):
    Image.open(f"{O}/hero_bot_l.webp").transpose(Image.FLIP_LEFT_RIGHT).save(f"{O}/hero_bot_r.webp", "WEBP", quality=88)

if have("blooms"):
    shutil.rmtree(f"{O}/blossoms", ignore_errors=True); cut("blooms", f"{O}/blossoms/blossom", "--split", "--max", "360")
if have("petals"):
    shutil.rmtree(f"{O}/petals", ignore_errors=True); cut("petals", f"{O}/petals/petal", "--split", "--max", "220", "--min-area", "1500")
    files = sorted(glob.glob(f"{O}/petals/petal_*.webp"))
    for k in range(len(files) + 1, 17): shutil.copy(files[(k - 1) % len(files)], f"{O}/petals/petal_{k:02d}.webp")
    print("petals:", len(glob.glob(f"{O}/petals/petal_*.webp")))

for n, dst in [("card", "closing_card"), ("card_m", "closing_card_m")]:
    if cut(n, f"{O}/{dst}.webp", "--max", "2000", bg="ffffff", tol="12"):
        im = Image.open(f"{O}/{dst}.webp").convert("RGBA"); a = np.asarray(im).astype(int)
        r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
        ivory = ndi.binary_opening((al > 200) & (r > 232) & (g > 222) & (b > 200) & (abs(r - g) < 16), iterations=4)
        lab, k = ndi.label(ivory); big = np.argmax(ndi.sum(ivory, lab, range(1, k + 1))) + 1
        ys, xs = np.where(lab == big); H, W = ivory.shape
        print(dst, im.size, "panel x %.3f-%.3f y %.3f-%.3f" % (xs.min() / W, xs.max() / W, ys.min() / H, ys.max() / H))

for n, dst in [("venue_wedding", "venue_wedding"), ("venue_reception", "venue_reception")]:
    if have(n):
        im = Image.open(f"{R}/{P}_{n}.png").convert("RGB"); im.thumbnail((1100, 1100)); im.save(f"{O}/{dst}.webp", quality=84)
print("done")
