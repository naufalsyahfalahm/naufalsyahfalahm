#!/usr/bin/env python3
"""
Generates public/music.mp3: an original background track for the pitch (no third-party material).

  python3 scripts/build-music.py        # needs numpy and ffmpeg; deterministic (fixed seed)

Calm, hopeful, no percussion so it never competes with the narration: a warm pad on a four-chord loop
(Am7 - Fmaj7 - Cmaj7 - Gadd9, 76 BPM, two bars per chord), a soft sine bass, and sparse plucked arpeggios
that enter after about 16 s. 180 s, stereo, normalised to about -14 dBFS RMS; the video plays it at
config.MUSIC_VOLUME (0.12) with a fade in and out.
"""
import subprocess
from pathlib import Path

import numpy as np

SR = 48000
DUR = 180.0
N = int(SR * DUR)
BPM = 76
BEAT = 60.0 / BPM
BAR = 4 * BEAT
CHORD_S = 2 * BAR
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# (pad voicing, bass root) as MIDI notes
CHORDS = [
    ([57, 60, 64, 67], 45),  # Am7
    ([53, 57, 60, 64], 41),  # Fmaj7
    ([52, 55, 59, 64], 48),  # Cmaj7
    ([55, 59, 62, 64], 43),  # Gadd9 (G B D E)
]

L = np.zeros(N, dtype=np.float32)
R = np.zeros(N, dtype=np.float32)


def add(buf, sig, start):
    a = int(start * SR)
    if a >= N:
        return
    b = min(N, a + len(sig))
    buf[a:b] += sig[: b - a]


def pad_note(f, hold):
    rel = 2.6
    n = int((hold + rel) * SR)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / 1.8) ** 2
    env *= np.where(t > hold, np.exp(-(t - hold) * 3.2 / rel * 1.0) * (1 - np.minimum(1, (t - hold) / rel)), 1.0)
    vib = 1 + 0.0015 * np.sin(2 * np.pi * 0.23 * t + f)
    sig = np.zeros(n)
    for det in (1.0, 1.0030, 0.9970):
        ph = 2 * np.pi * f * det * t * vib
        for h in range(1, 8):
            sig += np.sin(ph * h + det * h) / h**1.25
    return (sig * env * 0.034).astype(np.float32)


def bass_note(f, hold):
    rel = 0.9
    n = int((hold + rel) * SR)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / 0.35) * np.where(t > hold, np.maximum(0, 1 - (t - hold) / rel), 1.0)
    sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return (sig * env * 0.035).astype(np.float32)


def pluck(f, gain):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / 0.008) * np.exp(-t / 0.55)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.25) + 0.1 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.12)
    return (sig * env * gain).astype(np.float32)


n_chords = int(np.ceil(DUR / CHORD_S))
for k in range(n_chords):
    voicing, root = CHORDS[k % 4]
    t0 = k * CHORD_S
    hold = min(CHORD_S, DUR - t0) + 0.4  # slight overlap into the next chord
    for m in voicing:
        s = pad_note(hz(m), hold)
        pan = 0.5 + 0.35 * np.sin(m * 1.7)  # spread the voices a little
        add(L, s * (1 - pan) * 1.4, t0)
        add(R, s * pan * 1.4, t0)
    b = bass_note(hz(root), hold)
    add(L, b, t0)
    add(R, b, t0)

# sparse plucked arpeggio from bar 7 on: eighth-note grid, 5 notes per bar
STEPS = {0: 0, 2: 2, 3: 3, 5: 2, 6: 1}  # grid position (eighth) -> index into the chord voicing
first_bar = 7
n_bars = int(DUR / BAR)
for bar in range(first_bar, n_bars):
    voicing, _ = CHORDS[(bar // 2) % 4]
    for pos, idx in STEPS.items():
        t = bar * BAR + pos * BEAT / 2
        if t > DUR - 4:
            continue
        m = voicing[idx % len(voicing)] + 12
        g = 0.055 * (0.75 if pos else 1.0) * (0.85 + 0.15 * rng.random())
        s = pluck(hz(m), g)
        pan = 0.30 if (bar + pos) % 2 else 0.70
        add(L, s * (1 - pan) * 1.4, t)
        add(R, s * pan * 1.4, t)


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x)).astype(np.float32)


# darken the pad/bass/pluck mix a little, then add a stereo hall
L = fft_filter(L, lo=70, hi=6500)
R = fft_filter(R, lo=70, hi=6500)


def make_ir(seed_offset):
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * 6.9 / 2.4)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))  # soft onset
    return fft_filter(ir.astype(np.float32), hi=3800)


def convolve(x, ir):
    size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return y.astype(np.float32)


wetL = convolve(L, make_ir(0))
wetR = convolve(R, make_ir(1))
wet_gain = 0.55 * np.sqrt(np.mean(L**2) / (np.mean(wetL**2) + 1e-12))
L = 0.78 * L + 0.30 * wet_gain * wetL
R = 0.78 * R + 0.30 * wet_gain * wetR

# gentle intro swell, master level, soft limiter
t = np.arange(N) / SR
swell = 0.6 + 0.4 * np.minimum(1.0, t / 18.0)
L *= swell
R *= swell
rms = np.sqrt((np.mean(L**2) + np.mean(R**2)) / 2)
g = 10 ** (-14 / 20) / rms
L, R = np.tanh(L * g * 0.9) / 0.9, np.tanh(R * g * 0.9) / 0.9
peak = max(np.abs(L).max(), np.abs(R).max())
if peak > 0.89:
    L, R = L * 0.89 / peak, R * 0.89 / peak
peak = max(np.abs(L).max(), np.abs(R).max())

stereo = np.stack([L, R], axis=1).astype(np.float32)
dest = Path(__file__).resolve().parent.parent / "public/music.mp3"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "160k", str(dest)],
    input=stereo.tobytes(),
    check=True,
)
print(f"wrote {dest.name}: {DUR:.0f} s, peak {peak:.2f}, rms {20*np.log10(np.sqrt(np.mean(stereo**2))):.1f} dBFS")
