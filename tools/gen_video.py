"""Generate a video with gemini-omni-1.2-flash via the Vertex AI Interactions API.

usage: python gen_video.py OUT.mp4 "prompt" [--image start.jpg] [--ar 16:9] [--dur 8] [--res 1080p]
"""
import argparse, base64, json, subprocess, sys, time, urllib.request

PROJECT = "plasma-ivy-458810-u9"
BASE = f"https://aiplatform.googleapis.com/v1beta1/projects/{PROJECT}/locations/global/interactions"

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("prompt")
ap.add_argument("--image"); ap.add_argument("--ar", default="16:9")
ap.add_argument("--dur", type=int, default=8)
ap.add_argument("--res", default="1080p")
a = ap.parse_args()

def call(url, body=None):
    tok = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {tok}", "x-goog-user-project": PROJECT,
                 "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=600))
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} {e.read().decode()[:1500]}")

inp = [{"type": "text", "text": a.prompt + (" Use the image as the first frame." if a.image else "")}]
if a.image:
    mime = "image/png" if a.image.endswith(".png") else "image/jpeg"
    inp.append({"type": "image", "mime_type": mime,
                "data": base64.b64encode(open(a.image, "rb").read()).decode()})
body = {
    "model": "gemini-omni-1.2-flash",
    "store": True, "background": True,
    "input": inp,
    "response_format": [{"type": "video", "delivery": "inline", "aspect_ratio": a.ar,
                         "resolution": a.res, "duration": f"{a.dur}s"}],
}
r = call(BASE, body)
iid = r.get("id")
print("interaction", iid, r.get("status"), flush=True)
while r.get("status") in ("in_progress", None) and iid:
    time.sleep(12)
    r = call(f"{BASE}/{iid}")
if r.get("status") != "completed":
    sys.exit("not completed: " + json.dumps(r)[:1500])

for step in r.get("steps", []):
    for c in step.get("content", []) or []:
        if c.get("type") == "video":
            if c.get("data"):
                open(a.out, "wb").write(base64.b64decode(c["data"]))
            else:
                subprocess.check_call(["gcloud", "storage", "cp", c["uri"], a.out])
            print("saved", a.out); sys.exit(0)
sys.exit("no video in response: " + json.dumps(r)[:1500])
