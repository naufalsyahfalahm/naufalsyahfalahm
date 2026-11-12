#!/usr/bin/env python3
"""
Writes focus_check.md: for each static screen, the focus box and ripple in normalised and pixel
coordinates (780x1688 image), the UI element covered, and an OCR check that the box region contains no
bracketed placeholder text. Run `npx tsx scripts/dump-config.ts` first.
Needs numpy, Pillow, rapidocr_onnxruntime (the OCR check is skipped, and says so, if it is missing).
"""
import json, os
import numpy as np
from PIL import Image

root = os.path.join(os.path.dirname(__file__), "..")
cfg = json.load(open(os.path.join(root, "out", "config.json")))
try:
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
except Exception:
    ocr = None

W, H = 780, 1688
lines = [
    "# focus_check.md",
    "",
    "Focus boxes and tap ripples, normalised to the screen image (780x1688 PNG; x, y = top-left, w, h = size).",
    "Pixel values are the same box on the 780x1688 image. The OCR column is rapidocr on the cropped box region "
    "(`none` = no `[` or `]` found inside the box).",
    "",
    "| Scene | Screen | Box x, y, w, h (normalised) | Box px (x0,y0,x1,y1) | UI element covered | Dim overlay | Bracket text inside box (OCR) |",
    "|---|---|---|---|---|---|---|",
]
bad = 0
for s in cfg["segments"]:
    f = s.get("focus")
    if not f:
        continue
    b = f["box"]
    x0, y0 = round(b["x"] * W), round(b["y"] * H)
    x1, y1 = round((b["x"] + b["w"]) * W), round((b["y"] + b["h"]) * H)
    res = "OCR unavailable"
    if ocr is not None:
        im = np.asarray(Image.open(os.path.join(root, "public", s["screen"])).convert("RGB"))
        crop = np.ascontiguousarray(im[y0:y1, x0:x1][:, :, ::-1])
        out, _ = ocr(crop)
        txt = [t for _, t, _ in (out or [])]
        br = [t for t in txt if "[" in t or "]" in t]
        res = "none" if not br else "FOUND: " + "; ".join(br)
        bad += 1 if br else 0
    dim = "yes" if f["dim"] else "no (placeholder visible elsewhere on this screen; outline only)"
    lines.append(
        f"| {s['id']} | {os.path.basename(s['screen'])} | {b['x']:.4f}, {b['y']:.4f}, {b['w']:.4f}, {b['h']:.4f} | "
        f"{x0},{y0},{x1},{y1} | {f['covers']} | {dim} | {res} |"
    )
lines += ["", "## Tap ripples (40 px, translucent)", "", "| Scene | Point x, y (normalised) | Pixel (780x1688) | Covers |", "|---|---|---|---|"]
for s in cfg["segments"]:
    r = s.get("ripple")
    if r:
        lines.append(f"| {s['id']} | {r['x']:.4f}, {r['y']:.4f} | {round(r['x']*W)},{round(r['y']*H)} | {r['covers']} |")
lines += [
    "",
    "## Scenes without a focus box",
    "",
    "- `kuesioner`, `pose`, `dashboard`: recordings (no overlay; the clip contains its own interaction).",
    "- `intro`, `outro`: title cards.",
    "",
    "## Zoom (push-in 100% to 104%)",
    "",
    "Applied to `beranda` and `tambahan` only (no visible placeholder). Skipped on `lateral`, `superior`, `ringkasan`, `temuan`, "
    "where a bracketed placeholder is visible in the static screen; see report.md.",
    "",
    f"Result: {'no focus box contains bracket text' if not bad and ocr else 'CHECK FAILED / not run'}.",
]
open(os.path.join(root, "focus_check.md"), "w").write("\n".join(lines) + "\n")
print("wrote focus_check.md; boxes with bracket text:", bad)
