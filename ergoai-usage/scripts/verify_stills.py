#!/usr/bin/env python3
"""
Programmatic checks on out/stills/*.png (first / middle / last frame of every segment).
  1. Safe zone: pixels x >= 1426, y >= 771 equal the background-only reference (_bg.png): max abs diff,
     and the variance of the zone's difference. Any content there fails.
  2. Badge "Mockup antarmuka (data simulasi)" present on every frame (app-showing frames are a subset):
     the badge rectangle differs from the background and is mostly ink-coloured; OCR confirms the text when
     rapidocr_onnxruntime is installed.
  3. Result badge present on result scenes (amber fill) and absent elsewhere.
  4. Step panel content (x >= 860, y < 720) stays inside x 1060-1860, y 200-700 on app scenes.
  5. Overlay text sizes in src/ are >= 36 px and palette contrast pairs are >= 4.5:1.
Run: python3 scripts/verify_stills.py   (needs numpy + Pillow; rapidocr_onnxruntime optional)
"""
import glob, json, os, re, sys
import numpy as np
from PIL import Image

ZONE_X, ZONE_Y = 1426, 771
BADGE = (48, 880, 392, 1032)   # x0, y0, x1, y1 (badge is bottom-left, 48 px margin, <= 344 px wide)
RESULT = (1060, 730, 1410, 890)
PANEL = (1060, 200, 1860, 700)
RESULT_IDS = {"dashboard", "ringkasan", "temuan"}
APP_IDS = {"beranda", "kuesioner", "lateral", "superior", "pose", "tambahan", "dashboard", "ringkasan", "temuan"}

try:
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
except Exception:
    ocr = None

def load(p):
    return np.asarray(Image.open(p).convert("RGB")).astype(np.int16)

root = os.path.join(os.path.dirname(__file__), "..", "out", "stills")
bg = load(os.path.join(root, "_bg.png"))
files = sorted(f for f in glob.glob(os.path.join(root, "[0-9][0-9]-*.png")))
rows, fails = [], 0

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

for f in files:
    name = os.path.basename(f)[:-4]
    seg = name.split("-")[1]
    im = load(f)
    d = np.abs(im - bg).max(axis=2)
    zone = d[ZONE_Y:, ZONE_X:]
    zone_max = int(zone.max())
    zone_var = float(zone.astype(np.float64).var())
    z_ok = zone_max <= 2

    x0, y0, x1, y1 = BADGE
    crop = im[y0:y1, x0:x1]
    dd = d[y0:y1, x0:x1]
    changed = float((dd > 40).mean())
    ink = float((np.abs(crop - np.array([244, 247, 249])).max(axis=2) < 12).mean())
    b_ok = changed > 0.25 and ink > 0.25
    ocr_txt = ""
    if ocr is not None:
        res, _ = ocr(np.ascontiguousarray(crop.astype(np.uint8)[:, :, ::-1]))
        ocr_txt = " ".join(t for _, t, _ in (res or []))
        b_ok = b_ok and ("mockup" in ocr_txt.lower() and "simulasi" in ocr_txt.lower())

    rx0, ry0, rx1, ry1 = RESULT
    amber = float((np.abs(im[ry0:ry1, rx0:rx1] - np.array([240, 166, 43])).max(axis=2) < 12).mean())
    r_present = amber > 0.2
    r_ok = r_present == (seg in RESULT_IDS)

    p_ok = True
    px = ""
    if seg in APP_IDS:
        sub = d[:720, 860:] > 24
        ys, xs = np.where(sub)
        if len(xs):
            bx0, bx1, by0, by1 = xs.min() + 860, xs.max() + 860, ys.min(), ys.max()
            px = f"{bx0}-{bx1} x {by0}-{by1}"
            p_ok = bx0 >= PANEL[0] - 4 and bx1 <= PANEL[2] + 4 and by0 >= PANEL[1] - 4 and by1 <= PANEL[3] + 4

    ok = z_ok and b_ok and r_ok and p_ok
    fails += 0 if ok else 1
    rows.append(dict(still=name, zone_max_diff=zone_max, zone_diff_variance=round(zone_var, 4), zone_ok=bool(z_ok),
                     badge_changed=round(changed, 2), badge_ink=round(ink, 2), badge_ok=bool(b_ok), badge_ocr=ocr_txt,
                     result_badge=bool(r_present), result_ok=bool(r_ok), panel_bbox=px, panel_ok=bool(p_ok)))

print(f"{'still':26} zone(max diff) badge result panel-bbox")
for r in rows:
    print(f"{r['still']:26} {r['zone_max_diff']:>3} {'ok' if r['zone_ok'] else 'FAIL':4}  {'ok' if r['badge_ok'] else 'FAIL':4}  "
          f"{'ok' if r['result_ok'] else 'FAIL':4}  {'ok' if r['panel_ok'] else 'FAIL':4} {r['panel_bbox']}")

# Overlay text size >= 36 px
src = os.path.join(os.path.dirname(__file__), "..", "src")
small = []
for p in glob.glob(os.path.join(src, "**", "*.tsx"), recursive=True):
    for i, line in enumerate(open(p), 1):
        for m in re.finditer(r"fontSize:\s*(\d+)", line):
            if int(m.group(1)) < 36:
                small.append(f"{os.path.relpath(p, src)}:{i} fontSize {m.group(1)}")
print("\noverlay font sizes >= 36 px:", "ok" if not small else "FAIL " + "; ".join(small))
fails += len(small)

pairs = {
    "ink on navy (titles, step list)": ("#F4F7F9", "#0E2233"),
    "amber on navy (step label)": ("#F0A62B", "#0E2233"),
    "white on teal (active step)": ("#FFFFFF", "#0B7A7C"),
    "white on green (completed check)": ("#FFFFFF", "#23794A"),
    "navy on ink (mockup badge)": ("#0E2233", "#F4F7F9"),
    "navy on amber (result badge)": ("#0E2233", "#F0A62B"),
    "teal on white (active step number)": ("#0B7A7C", "#FFFFFF"),
}
print("contrast ratios (>= 4.5):")
for k, (a, b) in pairs.items():
    c = contrast(a, b)
    flag = "ok" if c >= 4.5 else "FAIL"
    fails += 0 if c >= 4.5 else 1
    print(f"  {k:36} {c:5.2f} {flag}")
# muted ink (alpha 0.72) over navy, used for upcoming steps
navy = np.array([14, 34, 51]); ink = np.array([244, 247, 249])
mix = (0.72 * ink + 0.28 * navy).round().astype(int)
mh = "#%02X%02X%02X" % tuple(mix)
c = contrast(mh, "#0E2233"); fails += 0 if c >= 4.5 else 1
print(f"  {'muted ink (72%) on navy (upcoming step)':36} {c:5.2f} {'ok' if c >= 4.5 else 'FAIL'}")

json.dump(rows, open(os.path.join(root, "verify.json"), "w"), indent=1)
print(f"\n{len(rows)} stills checked, {fails} failing check(s); OCR {'on' if ocr else 'off (badge text not OCR-confirmed)'}")
sys.exit(1 if fails else 0)
