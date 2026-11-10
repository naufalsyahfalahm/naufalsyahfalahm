#!/usr/bin/env python3
"""
Rebuilds public/voiceover.mp3 from the uncut recording using reference/voiceover-selection.json.

  python3 scripts/build-voiceover.py            # needs numpy and ffmpeg; raw file: reference/AI_No_Cut_Audio.mp3

The output is already laid out on the video timeline (180.0 s): every scene's first sentence starts at
`first_onset_s`, the next sentences follow after `gaps_s`. Only silences are shortened (pauses inside a
sentence longer than max_internal_pause_s are cut down to it); no speech is cut, sped up or reordered.
Each clip is gain-matched to speech_rms_db and limited to stay below clipping.
Writes public/voiceover.mp3 and reference/voiceover-layout.json (where every sentence landed).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
WIN = 0.05  # 50 ms analysis window
QUIET_DB = -34.0  # raw recording: noise floor about -40 dB, speech about -22 dB
TOTAL_S = 180.0
PAD = 0.06
FADE = 0.008

root = Path(__file__).resolve().parent.parent
sel = json.loads((root / "reference/voiceover-selection.json").read_text())
raw_path = root / sel["raw"]
if not raw_path.exists():
    sys.exit(f"missing {raw_path} (the uncut recording is not committed; copy it there)")

pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", str(raw_path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    capture_output=True,
    check=True,
).stdout
raw = np.frombuffer(pcm, dtype=np.float32)


def window_db(x):
    w = int(SR * WIN)
    n = len(x) // w
    if n == 0:
        return np.zeros(0)
    return 10 * np.log10((x[: n * w].reshape(n, w) ** 2).mean(1) + 1e-12)


def crossfade_join(a, b, n=int(SR * 0.010)):
    n = min(n, len(a), len(b))
    if n <= 0:
        return np.concatenate([a, b])
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    return np.concatenate([a[:-n], a[-n:] * (1 - ramp) + b[:n] * ramp, b[n:]])


def prepare(clip_start, clip_end, max_pause):
    x = raw[int((clip_start - PAD) * SR) : int((clip_end + PAD) * SR)].copy()
    w = int(SR * WIN)
    db = window_db(x)
    quiet = db < QUIET_DB
    loud_idx = np.where(~quiet)[0]
    if len(loud_idx) == 0:
        raise SystemExit("clip has no speech")
    first, last = loud_idx[0], loud_idx[-1]
    # shorten internal pauses
    keep = max(1, int(round(max_pause / WIN / 2)))
    pieces, i = [], 0
    while i <= last:
        if quiet[i] and i > first:
            j = i
            while j <= last and quiet[j]:
                j += 1
            if (j - i) * WIN > max_pause + 1e-6 and j <= last:
                pieces.append((i * w, (i + keep) * w))
                pieces.append(((j - keep) * w, j * w))
            else:
                pieces.append((i * w, j * w))
            i = j
        else:
            j = i
            while j <= last and quiet[j] == quiet[i]:
                j += 1
            pieces.append((i * w, j * w))
            i = j
    # lead-in/out: a little room tone either side of the speech
    lead = max(0, first - 1) * w
    body = None
    for a, b in pieces:
        seg = x[max(a, first * w) : b] if a < first * w else x[a:b]
        if len(seg) == 0:
            continue
        body = seg if body is None else crossfade_join(body, seg)
    head = x[lead : first * w]
    tail = x[(last + 1) * w : min(len(x), (last + 3) * w)]
    y = np.concatenate([head, body, tail]).astype(np.float32)
    onset = len(head) / SR
    speech_end = (len(head) + len(body)) / SR
    return y, onset, speech_end


def level_match(y, onset, speech_end, target_db):
    s, e = int(onset * SR), int(speech_end * SR)
    db = window_db(y[s:e])
    loud = db > QUIET_DB
    cur = 10 * np.log10(np.mean(10 ** (db[loud] / 10)) + 1e-12)
    gain = 10 ** ((target_db - cur) / 20)
    limited = False
    peak = float(np.abs(y).max()) * gain
    if peak > 0.95:
        gain *= 0.95 / peak
        limited = True
    z = y * gain
    f = int(SR * FADE)
    z[:f] *= np.linspace(0, 1, f, dtype=np.float32)
    z[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
    return z, 20 * np.log10(gain), limited


out = np.zeros(int(TOTAL_S * SR), dtype=np.float32)
layout = []
for sc in sel["scenes"]:
    cursor_onset = sc["first_onset_s"]
    for k, u in enumerate(sc["units"]):
        y, onset, speech_end = prepare(u["start"], u["end"], sel["max_internal_pause_s"])
        y, gain_db, limited = level_match(y, onset, speech_end, sel["speech_rms_db"])
        t0 = cursor_onset - onset
        a = int(round(t0 * SR))
        b = a + len(y)
        if b > len(out):
            sys.exit(f"{sc['scene']} unit {u['unit']} runs past {TOTAL_S} s")
        out[a:b] += y
        on, off = cursor_onset, cursor_onset + (speech_end - onset)
        layout.append(
            {"scene": sc["scene"], "unit": u["unit"], "take": u["take"], "onset_s": round(on, 3), "end_s": round(off, 3),
             "gain_db": round(float(gain_db), 1), "limited": limited, "text": u["text"]}
        )
        gap = sc["gaps_s"][k] if k < len(sc["gaps_s"]) else 0
        cursor_onset = off + gap

peak = float(np.abs(out).max())
assert peak <= 0.99, f"peak {peak}"
dest = root / "public/voiceover.mp3"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k", str(dest)],
    input=out.tobytes(),
    check=True,
)
(root / "reference/voiceover-layout.json").write_text(json.dumps(layout, indent=1, ensure_ascii=False))
print(f"wrote {dest.relative_to(root)} ({TOTAL_S:.0f} s), peak {peak:.2f}")
for r in layout:
    print(f"  {r['scene']:9} u{r['unit']} {r['take']:6} {r['onset_s']:7.2f}-{r['end_s']:7.2f}  gain {r['gain_db']:+5.1f} dB{'  (limited)' if r['limited'] else ''}")
