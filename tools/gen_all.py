"""Generate every asset in prompts.json with Gemini on Vertex AI, in parallel.
usage: python gen_all.py [name ...]   (no names = all)
"""
import json, subprocess, sys, os, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
S = f"{ROOT}/assets/src"
REFS = {"right": [f"{S}/ref_flowers_right.jpg", f"{S}/ref_flowers_tl.jpg"],
        "left": [f"{S}/ref_flowers_gold.jpg", f"{S}/ref_flowers_leftcard.jpg", f"{S}/ref_flowers_tl.jpg"],
        "cream": [f"{S}/ref_cream_panel.jpg"],
        "hero": [f"{S}/ref_cream_panel.jpg", f"{S}/ref_flowers_right.jpg", f"{S}/ref_flowers_gold.jpg"],
        "couple": [f"{S}/ref_couple.jpg", f"{S}/ref_flowers_right.jpg"],
        "flowers": [f"{S}/ref_flowers_right.jpg", f"{S}/ref_flowers_gold.jpg"],
        "diecut": [f"{S}/card_ref.jpg", f"{S}/ref_flowers_gold.jpg", f"{S}/ref_flowers_leftcard.jpg"]}
OUT = f"{ROOT}/assets/raw"
os.makedirs(OUT, exist_ok=True)

cfg = json.load(open(f"{HERE}/prompts.json"))
only = set(sys.argv[1:])

def build(p):
    return (p.replace("{style}", cfg["_style"]).replace("{foil}", cfg["_foil"])
             .replace("{iso}", cfg["_iso"]))

def run(a):
    out = f"{OUT}/{a['name']}.png"
    for attempt in range(6):
        r = subprocess.run([sys.executable, f"{HERE}/gen_image.py", out, build(a["prompt"]),
                            *sum((["--ref", r] for r in REFS[a["ref"]]), []), "--ar", a["ar"]],
                           capture_output=True, text=True)
        if r.returncode == 0:
            return f"OK   {a['name']}"
        err = (r.stderr or r.stdout).strip()[-300:]
        if "429" not in err and "503" not in err and "no image" not in err:
            break
        time.sleep(20 * (attempt + 1))
    return f"FAIL {a['name']}: {err}"

todo = [a for a in cfg["assets"] if not only or a["name"] in only]
with ThreadPoolExecutor(2) as ex:
    for line in ex.map(run, todo):
        print(line, flush=True)
