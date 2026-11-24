"""Generate images with Gemini on Vertex AI (your GCP project).

usage: python gen_image.py OUT.png "prompt" [--ref ref.jpg ...] [--ar 1:1] [--model gemini-3-pro-image]
"""
import argparse, base64, json, subprocess, sys, urllib.request

PROJECT = "plasma-ivy-458810-u9"
LOCATION = "global"

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("prompt")
ap.add_argument("--ref", action="append", default=[])
ap.add_argument("--ar", default="1:1")
ap.add_argument("--size", default="2K")
ap.add_argument("--model", default="gemini-3-pro-image")
a = ap.parse_args()

token = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()
parts = []
for r in a.ref:
    mime = "image/png" if r.lower().endswith(".png") else "image/jpeg"
    parts.append({"inlineData": {"mimeType": mime, "data": base64.b64encode(open(r, "rb").read()).decode()}})
parts.append({"text": a.prompt})
body = {
    "contents": [{"role": "user", "parts": parts}],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
        "imageConfig": {"aspectRatio": a.ar, "imageSize": a.size},
    },
}
url = (f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{LOCATION}"
       f"/publishers/google/models/{a.model}:generateContent")
req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={
    "Authorization": f"Bearer {token}", "x-goog-user-project": PROJECT,
    "Content-Type": "application/json"})
try:
    resp = json.load(urllib.request.urlopen(req, timeout=300))
except urllib.error.HTTPError as e:
    sys.exit(f"{a.out}: HTTP {e.code} {e.read().decode()[:600]}")
for c in resp.get("candidates", []):
    for p in c.get("content", {}).get("parts", []):
        if "inlineData" in p:
            open(a.out, "wb").write(base64.b64decode(p["inlineData"]["data"]))
            print("saved", a.out)
            sys.exit(0)
sys.exit(f"{a.out}: no image returned: {json.dumps(resp)[:600]}")
