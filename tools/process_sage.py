"""Sage & Ivory Garden: raw Gemini PNGs -> web-ready WebP under the file names the site uses.
usage: python tools/process_sage.py   (run with the venv that has pillow/numpy/scipy)"""
import os, subprocess, sys, glob, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
R, O = "assets/raw", "assets/img"
PY = sys.executable
KEY = "2b2b2b"   # charcoal backdrop used for the white flowers

def cut(src, dst, *extra, bg=KEY, tol="26"):
    if not os.path.exists(f"{R}/{src}.png"):
        print("missing", src); return False
    subprocess.check_call([PY, "tools/cutout.py", f"{R}/{src}.png", dst, "--bg", bg, "--tol", tol, *extra])
    return True

def crop_bbox(path, q=88):
    im = Image.open(path).convert("RGBA")
    bb = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
    if bb: im = im.crop(bb)
    im.save(path, "WEBP", quality=q)

# paper
if os.path.exists(f"{R}/s_paper.png"):
    Image.open(f"{R}/s_paper.png").convert("RGB").resize((1024, 1024), Image.LANCZOS).save(f"{O}/paper_card.webp", quality=82)

# hero / opening florals + corner + sprigs
for src, dst, mx in [("s_top_l", "hero_top_l", 1400), ("s_top_r", "hero_top_r", 1400),
                     ("s_bot_l", "hero_bot_l", 1400),
                     ("s_corner", "frame_cluster", 900), ("s_sprig_tl", "sprig_tl", 1100), ("s_sprig_br", "sprig_br", 1100)]:
    if cut(src, f"{O}/{dst}.webp", "--max", str(mx)): crop_bbox(f"{O}/{dst}.webp")

# bottom-right = mirror of bottom-left (keeps both corners matching)
if os.path.exists(f"{O}/hero_bot_l.webp"):
    Image.open(f"{O}/hero_bot_l.webp").transpose(Image.FLIP_LEFT_RIGHT).save(f"{O}/hero_bot_r.webp", "WEBP", quality=88)

# scratch-medal blooms
if os.path.isdir(f"{O}/blossoms"): shutil.rmtree(f"{O}/blossoms")
cut("s_blooms", f"{O}/blossoms/blossom", "--split", "--max", "360")

# falling petals (petals.js loads petal_01..16, so always provide 16)
if os.path.isdir(f"{O}/petals"): shutil.rmtree(f"{O}/petals")
cut("s_petals", f"{O}/petals/petal", "--split", "--max", "220", "--min-area", "1500")
files = sorted(glob.glob(f"{O}/petals/petal_*.webp"))
for k in range(len(files) + 1, 17):
    shutil.copy(files[(k - 1) % len(files)], f"{O}/petals/petal_{k:02d}.webp")
print("petals:", len(glob.glob(f"{O}/petals/petal_*.webp")))

# closing card (white backdrop)
for src, dst in [("s_card", "closing_card"), ("s_card_m", "closing_card_m")]:
    if cut(src, f"{O}/{dst}.webp", "--max", "2000", bg="ffffff", tol="12"): crop_bbox(f"{O}/{dst}.webp")

# venue paintings (white vignette, multiply-blended on the page)
for src, dst in [("s_venue_wedding", "venue_wedding"), ("s_venue_reception", "venue_reception")]:
    if os.path.exists(f"{R}/{src}.png"):
        im = Image.open(f"{R}/{src}.png").convert("RGB"); im.thumbnail((1100, 1100)); im.save(f"{O}/{dst}.webp", quality=84)
print("done")
