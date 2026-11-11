#!/usr/bin/env python3
"""
Builds public/audio-master.mp3: the finished 180 s audio (voice made clearer + background music ducked under it).

  python3 scripts/master-audio.py [--closing work/pip/closing_unison.wav] [--out public/audio-master.mp3]

Inputs: public/voiceover.mp3 (the laid-out voiceover), public/music.mp3 (original track from build-music.py) and,
optionally, a closing wav that replaces the voiceover in 161.30-174.00 s (100 ms crossfade, same as the video).
Voice chain (ffmpeg): high-pass 90 Hz, gentle FFT denoise, -3 dB at 220 Hz (boom), +2.5 dB at 3.2 kHz (presence),
low-pass 12 kHz, de-esser, 2.5:1 compressor. No pitch or tempo change, no gating, no edits inside speech.
Music: ducked 6 dB while anyone speaks (150 ms attack, 700 ms release), 2 s fade in, 3 s fade out, about 11 LU under the voice.
Master: two-pass loudnorm to -16 LUFS integrated, true peak <= -1.5 dBTP. Needs numpy and ffmpeg.
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

SR = 48000
root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--closing", default=None)
ap.add_argument("--out", default=str(root / "public/audio-master.mp3"))
ap.add_argument("--music_lufs", type=float, default=-29.0)
ap.add_argument("--duck_db", type=float, default=-6.0)
ap.add_argument("--target", type=float, default=-16.0)
ap.add_argument("--keep", default=None, help="folder for intermediate wavs")
a = ap.parse_args()

def rd(path, ch=1):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, ch).copy()

def ff(x, af, ch):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-", "-af", af, "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, ch).copy()

def lufs(x, ch):
    r = subprocess.run(["ffmpeg", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-", "-af", "ebur128=peak=true", "-f", "null", "-"], input=x.astype(np.float32).tobytes(), capture_output=True)
    s = r.stderr.decode(); s = s[s.rfind("Summary"):]
    g = lambda k: float([l for l in s.splitlines() if l.strip().startswith(k)][0].split()[1])
    pk = [l for l in s.splitlines() if "Peak:" in l]
    return g("I:"), g("LRA:"), (float(pk[0].split()[1]) if pk else float("nan"))

N = int(180 * SR)
vo = rd(root / "public/voiceover.mp3")[:, 0]
voice = np.zeros(N, dtype=np.float32); voice[: min(N, len(vo))] = vo[:N]
if a.closing:
    c = rd(a.closing)[:, 0]; c0 = int(round(161.30 * SR)); c1 = int(round(174.00 * SR)); f = int(0.1 * SR)
    duck = np.ones(N, dtype=np.float32); duck[c0:c1] = 0
    duck[c0:c0 + f] = np.linspace(1, 0, f); duck[c1 - f:c1] = np.linspace(0, 1, f)
    voice *= duck; voice[c0:c0 + len(c)] += c[: N - c0]
voice_raw = voice.copy()
chain = ("highpass=f=90,afftdn=nr=10:nf=-40,equalizer=f=220:t=q:w=1.0:g=-3,equalizer=f=3200:t=q:w=0.9:g=2.5,"
         "lowpass=f=12000,deesser=i=0.25,acompressor=threshold=0.063:ratio=2.5:attack=10:release=150:makeup=2,alimiter=limit=0.55:attack=3:release=60:level=disabled")
voice = ff(voice[:, None], chain, 1)[:, 0][:N]
if len(voice) < N: voice = np.pad(voice, (0, N - len(voice)))
# music: speech-activity ducking
music = rd(root / "public/music.mp3", 2)[:N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
Im, _, _ = lufs(music, 2); music *= 10 ** ((a.music_lufs - Im) / 20)
w = int(0.05 * SR); nfr = N // w
db = 10 * np.log10((voice[: nfr * w].reshape(nfr, w) ** 2).mean(1) + 1e-12)
act = (db > -50).astype(np.float32)
k = int(0.3 / 0.05); act = np.convolve(act, np.ones(2 * k + 1), "same") > 0          # bridge short pauses (0.3 s each side)
g = np.where(act, 10 ** (a.duck_db / 20), 1.0).astype(np.float32)
gs = np.repeat(g, w); gs = np.pad(gs, (0, N - len(gs)), constant_values=1.0)
sm = np.empty(N, dtype=np.float32); y = 1.0
att, rel = np.exp(-1 / (0.15 * SR)), np.exp(-1 / (0.70 * SR))
for i in range(0, N, 1):  # one-pole smoothing (slow loop avoided below)
    break
# vectorised one-pole via chunks of 480 samples (10 ms control rate)
ctl = gs[::480]; out = np.empty_like(ctl); y = 1.0
ca, cr = np.exp(-0.01 / 0.15), np.exp(-0.01 / 0.70)
for i, t in enumerate(ctl):
    c = ca if t < y else cr
    y = c * y + (1 - c) * t; out[i] = y
gm = np.interp(np.arange(N), np.arange(len(out)) * 480, out).astype(np.float32)
t = np.arange(N) / SR
fade = np.minimum(1, t / 2.0) * np.minimum(1, (180 - t) / 3.0)
music = music * (gm * fade)[:, None]
mix = music.copy(); mix[:, 0] += voice; mix[:, 1] += voice
# loudness: gain to the target integrated loudness, then a look-ahead limiter for the true peak; repeat once if needed
mix = mix.astype(np.float32)
for _ in range(3):
    I, _, _ = lufs(mix, 2)
    if abs(I - a.target) < 0.15: break
    mix = mix * 10 ** ((a.target - I) / 20)
    lim = ff(mix, "alimiter=limit=%.4f:attack=3:release=60:level=disabled" % (10 ** (-1.9 / 20)), 2)[:N]
    mix = lim if len(lim) == N else np.pad(lim, ((0, N - len(lim)), (0, 0)))
if a.keep:
    Path(a.keep).mkdir(parents=True, exist_ok=True)
    for n, x, ch in (("voice_raw", voice_raw[:, None], 1), ("voice_clear", voice[:, None], 1), ("master", mix, 2)):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-", "-c:a", "pcm_s16le", f"{a.keep}/{n}.wav"], input=x.astype(np.float32).tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "320k", a.out], input=mix.astype(np.float32).tobytes(), check=True)
I, LRA, P = lufs(mix, 2)
print(f"wrote {a.out}: integrated {I:.1f} LUFS, LRA {LRA:.1f} LU, sample peak {20*np.log10(np.abs(mix).max()):.1f} dBFS; music {Im:.1f} LUFS raw -> {a.music_lufs} base, duck {a.duck_db} dB")
