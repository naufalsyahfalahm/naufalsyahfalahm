#!/usr/bin/env python3
"""Voiceover pipeline. Stages: inventory, transcribe, match, build.

    . .venv/bin/activate
    python make_voiceover.py inventory   # step 1  -> work/*.wav, out/inventory.json
    python make_voiceover.py transcribe  # step 2-3a -> work/segments.json (silence split + local ASR)
    python make_voiceover.py match       # step 3b -> out/segments.csv, out/takes.csv, out/glossary.txt
    python make_voiceover.py build       # steps 4-9 -> out/voiceover.wav/.mp3, out/scenes/, out/timeline.json, out/report.md

Nothing here modifies files under raw_dir. No audio is sent to any service.
"""
import csv, json, re, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf, yaml

HERE = Path(__file__).resolve().parent
CFG = yaml.safe_load((HERE / "config.yaml").read_text())
RAW = (HERE / CFG["raw_dir"]).resolve()
WORK, OUT = HERE / "work", HERE / "out"
SR = 48000
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".flac"}


# ------------------------------------------------------------------ helpers
def raw_files():
    """[(speaker, path)]. Speaker = sub-folder name; files directly in raw/ get '?' (unlabelled)."""
    out = []
    for p in sorted(RAW.rglob("*")):
        if p.suffix.lower() in AUDIO_EXT and str(p.relative_to(RAW)) not in CFG["exclude"]:
            rel = p.relative_to(RAW)
            out.append((rel.parts[0] if len(rel.parts) > 1 else "?", p))
    return out


def work_wav(p):
    return WORK / (p.stem + ".wav")


NONSPEECH = re.compile(r"\([^)]*\)|\[[^\]]*\]?|\*[^*]*\*")       # Whisper tags: (static) [BLANK_AUDIO] *clears throat*


def norm_words(text):
    t = NONSPEECH.sub(" ", text).lower().replace("’", "'").replace("”", "").replace("“", "")
    t = re.sub(r"[-–—/]", " ", t)
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    return t.split()


def load_script():
    """{scene: text} in script order, using the budget keys of the chosen video."""
    names = list(CFG["budgets"][CFG["video"]])
    src = (HERE / CFG["script"][CFG["video"]]).resolve()
    if CFG["video"] == "ergoaidesk":
        lines = subprocess.run(["pdftotext", "-layout", str(src), "-"], capture_output=True, text=True,
                               check=True).stdout.splitlines()
        blocks, cur = [], None
        for ln in lines:
            if re.match(r"^\s*\d:\d\d\s*-\s*\d:\d\d", ln):
                cur = []; blocks.append(cur)
            if cur is not None:
                cur.append(ln)
        if len(blocks) != len(names):
            sys.exit(f"script parse: found {len(blocks)} scenes, config has {len(names)}")
        scripts = {}
        for name, blk in zip(names, blocks):
            col = min(ln.find(q) for ln in blk for q in "“”\"" if q in ln)   # column where narration starts
            txt = " ".join(ln[col:].strip() for ln in blk if len(ln) > col)
            scripts[name] = txt.strip(" “”\"")
        return scripts
    md = src.read_text()                                    # ergofix: "## scene" heading per block
    parts = re.split(r"^#+\s*(\w+)\s*$", md, flags=re.M)
    d = {parts[i].lower(): parts[i + 1].strip() for i in range(1, len(parts), 2)}
    return {n: d[n] for n in names}


# ------------------------------------------------------------------ stage: inventory
def stage_inventory():
    WORK.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True)
    inv = []
    for spk, p in raw_files():
        w = work_wav(p)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(p), "-ac", "1", "-ar", str(SR),
                        "-c:a", "pcm_s24le", str(w)], check=True)
        x, _ = sf.read(w)
        pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate,channels",
                             "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout.strip().split(",")
        r = subprocess.run(["ffmpeg", "-nostats", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        fl = int(0.05 * SR); n = len(x) // fl
        db = 20 * np.log10(np.sqrt((x[:n * fl].reshape(n, fl) ** 2).mean(1)) + 1e-12)
        inv.append(dict(speaker=spk, file=str(p.relative_to(RAW)), duration_s=round(len(x) / SR, 2),
                        sample_rate=int(pr[0]), channels=int(pr[1]),
                        peak_dBFS=round(float(20 * np.log10(np.abs(x).max() + 1e-12)), 2),
                        integrated_LUFS=float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]),
                        noise_floor_dBFS=round(float(np.sort(db)[:max(1, n // 10)].mean()), 1),
                        clipped_samples=int((np.abs(x) >= 0.999).sum())))
    (OUT / "inventory.json").write_text(json.dumps(inv, indent=1))
    for r in inv:
        print(r)


# ------------------------------------------------------------------ stage: transcribe
def active_runs(x, floor_db):
    """Return [(start_s, end_s)] of speech separated by silences >= min_silence_s."""
    S = CFG["segmentation"]
    fl = int(SR * S["frame_ms"] / 1000); n = len(x) // fl
    db = 20 * np.log10(np.sqrt((x[:n * fl].reshape(n, fl) ** 2).mean(1)) + 1e-12)
    act = db > floor_db + S["threshold_above_floor_db"]
    runs, i = [], 0
    while i < n:
        if act[i]:
            j = i
            while j < n:                                    # extend through gaps shorter than min_silence
                k = j
                while k < n and not act[k]:
                    k += 1
                if k - j >= S["min_silence_s"] * 1000 / S["frame_ms"] or k >= n:
                    break
                j = k + 1
                while j < n and act[j]:
                    j += 1
            end = j
            while end > i and not act[end - 1]:
                end -= 1
            runs.append((i * fl / SR, end * fl / SR)); i = max(j, end)
        i += 1
    return [(a, b) for a, b in runs if b - a >= S["min_segment_s"]], db, fl


def stage_transcribe():
    import sherpa_onnx
    A = CFG["asr"]; d = HERE / A["model_dir"]; S = CFG["segmentation"]
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(d / "small.en-encoder.int8.onnx"), decoder=str(d / "small.en-decoder.int8.onnx"),
        tokens=str(d / "small.en-tokens.txt"), language="en", task="transcribe", num_threads=A["num_threads"])
    inv = json.loads((OUT / "inventory.json").read_text())
    segs = []
    for rec_i in inv:
        w = work_wav(RAW / rec_i["file"]); x, _ = sf.read(w, dtype="float32")
        runs, db, fl = active_runs(x, rec_i["noise_floor_dBFS"])
        pieces = []
        for a, b in runs:                                   # split over-long runs at the quietest frame
            while b - a > S["max_segment_s"]:
                lo, hi = int((a + 18) * SR / fl), int((a + S["max_segment_s"]) * SR / fl)
                cut = (lo + int(np.argmin(db[lo:hi]))) * fl / SR
                pieces.append((a, cut)); a = cut
            pieces.append((a, b))
        for k, (a, b) in enumerate(pieces):
            pad = S["pad_s"]
            chunk = x[int(max(0, a - pad) * SR): int(min(len(x) / SR, b + pad) * SR)]
            st = rec.create_stream(); st.accept_waveform(SR, chunk); rec.decode_stream(st)
            segs.append(dict(speaker=rec_i["speaker"], file=rec_i["file"], start=round(a, 2), end=round(b, 2),
                             text=st.result.text.strip()))
            print(f"[{k + 1}/{len(pieces)}] {a:7.2f}-{b:7.2f}  {st.result.text.strip()[:90]}", flush=True)
    (WORK / "segments.json").write_text(json.dumps(segs, indent=1))


# ------------------------------------------------------------------ stage: match
def semi_global(hyp, ref):
    """Edit distance of hyp against the best contiguous stretch of ref (free ref start/end).
    Returns (errors, ref_start, ref_end)."""
    n, m = len(hyp), len(ref)
    D = np.zeros((n + 1, m + 1), int); D[:, 0] = np.arange(n + 1)
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            D[i, j] = min(D[i - 1, j - 1] + (hyp[i - 1] != ref[j - 1]), D[i - 1, j] + 1, D[i, j - 1] + 1)
    # D[0, j] = 0: free start in ref. Pick best end column, trace back for the start column.
    j = int(np.argmin(D[n])); err = int(D[n, j]); i, end = n, j
    while i > 0:
        if j > 0 and D[i, j] == D[i - 1, j - 1] + (hyp[i - 1] != ref[j - 1]): i, j = i - 1, j - 1
        elif D[i, j] == D[i - 1, j] + 1: i -= 1
        else: j -= 1
    return err, j, end


def wer(hyp, ref):
    import jiwer
    return jiwer.wer(" ".join(ref), " ".join(hyp)) if hyp else 1.0


def stage_match():
    scripts = load_script(); sw = {k: norm_words(v) for k, v in scripts.items()}
    segs = json.loads((WORK / "segments.json").read_text())
    for s in segs:
        h = norm_words(s["text"]); s["n_words"] = len(h)
        best = None
        for sc, ref in sw.items():
            if len(h) < CFG["segmentation"]["min_words_for_scene"]: break      # too short to assign reliably
            err, a, b = semi_global(h, ref)
            cand = (err / len(h), sc, a, b)
            if best is None or cand[0] < best[0]: best = cand
        s["scene"], s["seg_err_rate"], s["ref_a"], s["ref_b"] = (best[1], round(best[0], 3), best[2], best[3]) if best else ("", 1.0, 0, 0)
        s["duration"] = round(s["end"] - s["start"], 2)
    # group consecutive segments of one scene into takes; a new take starts when the script position resets
    takes, cur = [], None
    for s in segs:
        ok = s["seg_err_rate"] <= 0.5 and s["scene"]
        if cur and ok and s["scene"] == cur["scene"] and s["file"] == cur["file"] and s["ref_a"] >= cur["last_b"] - 3:
            cur["segs"].append(s); cur["last_b"] = s["ref_b"]
        else:
            if cur: takes.append(cur)
            cur = dict(scene=s["scene"] if ok else "(unmatched)", file=s["file"], speaker=s["speaker"],
                       segs=[s], last_b=s["ref_b"])
    if cur: takes.append(cur)
    OUT.mkdir(exist_ok=True)
    with open(OUT / "segments.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["speaker", "file", "start", "end", "duration", "scene", "seg_err_rate", "text"])
        for s in segs: w.writerow([s["speaker"], s["file"], s["start"], s["end"], s["duration"], s["scene"], s["seg_err_rate"], s["text"]])
    rows = []
    for t in takes:
        hyp = norm_words(" ".join(s["text"] for s in t["segs"]))
        ref = sw.get(t["scene"])
        rows.append([t["speaker"], t["file"], t["segs"][0]["start"], t["segs"][-1]["end"], t["scene"],
                     round(wer(hyp, ref), 3) if ref else "", round(t["segs"][-1]["end"] - t["segs"][0]["start"], 2),
                     len(t["segs"]), " ".join(s["text"] for s in t["segs"])])
    (WORK / "takes.json").write_text(json.dumps([dict(scene=t["scene"], file=t["file"], speaker=t["speaker"],
        WER=(round(wer(norm_words(" ".join(x["text"] for x in t["segs"])), sw[t["scene"]]), 4) if t["scene"] in sw else None),
        segs=t["segs"]) for t in takes], indent=1))
    with open(OUT / "takes.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["speaker", "file", "start", "end", "scene", "WER", "duration", "n_segments", "text"])
        w.writerows(rows)
    gl = [f"{g!r}: " + (" | ".join(f"{s['file']} {s['start']:.1f}s -> \"{s['text']}\"" for s in segs
                                   if re.sub(r"[^a-z0-9]", "", g.lower()) in re.sub(r"[^a-z0-9]", "", s["text"].lower()))
                        or "NOT found verbatim in any transcript segment") for g in CFG["glossary"]]
    (OUT / "glossary.txt").write_text("\n".join(gl))
    print(f"{len(segs)} segments, {len(rows)} takes -> out/segments.csv, out/takes.csv, out/glossary.txt")


# ------------------------------------------------------------------ stage: build
import difflib
from scipy.signal import resample_poly

B = CFG["build"]


def to_db(v):
    return 20 * np.log10(np.maximum(v, 1e-9))


def frames_db(x, ms):
    fl = int(SR * ms / 1000); n = len(x) // fl
    return to_db(np.sqrt((x[:n * fl].reshape(n, fl) ** 2).mean(1))), fl


def floor_db_of(x):
    d, _ = frames_db(x, 50)
    return float(np.sort(d)[:max(1, len(d) // 10)].mean())


def xfade(a, b, n):
    """Equal-power crossfade of the last n samples of a with the first n of b."""
    n = min(n, len(a), len(b)); t = np.linspace(0, np.pi / 2, n)
    return np.concatenate([a[:-n], a[-n:] * np.cos(t) + b[:n] * np.sin(t), b[n:]])


def run_ff(x, af, tag):
    tmp = WORK / "tmp"; tmp.mkdir(exist_ok=True)
    i, o = tmp / f"{tag}_in.wav", tmp / f"{tag}_out.wav"
    sf.write(i, x, SR, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(i), "-af", af, "-ar", str(SR), "-c:a", "pcm_f32le", str(o)], check=True)
    return sf.read(o, dtype="float64")[0]


def measure_loudness(y, tag="m"):
    tmp = WORK / "tmp"; tmp.mkdir(exist_ok=True); i = tmp / f"{tag}_meas.wav"
    sf.write(i, y, SR, subtype="FLOAT")
    r = subprocess.run(["ffmpeg", "-nostats", "-i", str(i), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", tail).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", tail).group(1))


def loudnorm_two_pass(y, tag):
    L = B["loudness"]; tmp = WORK / "tmp"; tmp.mkdir(exist_ok=True); i = tmp / f"{tag}_ln.wav"
    sf.write(i, y, SR, subtype="FLOAT")
    base = f"loudnorm=I={L['I']}:TP={L['TP']}:LRA={L['LRA']}"
    r = subprocess.run(["ffmpeg", "-nostats", "-i", str(i), "-af", base + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(r[r.rfind("{"):r.rfind("}") + 1])
    af = (base + f":measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample={SR}")
    return run_ff(y, af, tag + "_ln2"), m


def make_tone(tone, n):
    """Room tone of exactly n samples: the excerpt looped with 100 ms equal-power crossfades."""
    out = tone.copy()
    while len(out) < n + 1:
        out = xfade(out, tone, int(0.1 * SR))
    return out[:n]


def find_room_tone(x, file_segs):
    """Quietest tone_s window that contains no detected segment (+-0.3 s) in this recording."""
    d, fl = frames_db(x, 50); act = np.zeros(len(d), bool)
    for s in file_segs:
        act[max(0, int((s["start"] - 0.3) / 0.05)): int((s["end"] + 0.3) / 0.05) + 1] = True
    w = int(B["roomtone_s"] / 0.05); best = None
    csum = np.concatenate([[0], np.cumsum(d)])
    for i in range(0, len(d) - w):
        if act[i:i + w].any(): continue
        m = (csum[i + w] - csum[i]) / w
        if best is None or m < best[0]: best = (m, i)
    a = int(best[1] * 0.05 * SR)
    return x[a:a + int(B["roomtone_s"] * SR)], round(best[1] * 0.05, 2), round(float(best[0]), 1)


def assemble_take(x, segs):
    """Cut the take out of the recording, shorten internal pauses > pause_max_s to pause_to_s.
    Returns (audio, [(start_s, end_s) of each segment inside the audio])."""
    keep = (B["pause_to_s"] + 0.02) / 2                  # per side; the 20 ms crossfade overlap brings the total to pause_to_s
    xf = int(0.02 * SR); pieces = []
    a = int(max(0, segs[0][0] - B["safety_s"] - B["lead_tail_s"]) * SR)
    for (s0, e0), (s1, e1) in zip(segs, segs[1:]):
        if s1 - e0 > B["pause_max_s"]:
            pieces.append((a, int((e0 + keep) * SR))); a = int((s1 - keep) * SR)
    pieces.append((a, int(min(len(x) / SR, segs[-1][1] + B["safety_s"] + B["lead_tail_s"]) * SR)))
    out, offs = None, []
    for pa, pb in pieces:
        p = x[pa:pb]
        if out is None: offs.append(0); out = p.copy()
        else: offs.append(len(out) - xf); out = xfade(out, p, xf)
    smap = []
    for s, e in segs:
        k = max(i for i, (pa, pb) in enumerate(pieces) if pa <= int(s * SR) < pb or i == 0 and int(s * SR) < pa)
        pa = pieces[k][0]
        smap.append(((offs[k] + int(s * SR) - pa) / SR, (offs[k] + int(e * SR) - pa) / SR))
    return out, smap


def attenuate_breaths(y, floor, speech_med):
    """Gentle -9 dB on breath-like runs: >=200 ms, above noise floor+6 dB, >=20 dB under median speech level, noisy spectrum."""
    fl = int(0.01 * SR); n = len(y) // fl; fr = y[:n * fl].reshape(n, fl)
    d = to_db(np.sqrt((fr ** 2).mean(1)))
    sp = np.abs(np.fft.rfft(fr * np.hanning(fl), axis=1)); fq = np.fft.rfftfreq(fl, 1 / SR)
    cen = (sp * fq).sum(1) / (sp.sum(1) + 1e-12)
    m = (d > floor + 6) & (d < speech_med - 20) & (cen > 1800)
    g = np.ones(n); cnt = 0; i = 0
    while i < n:
        if m[i]:
            j = i
            while j < n and m[j]: j += 1
            if j - i >= 20: g[i:j] = 10 ** (-9 / 20); cnt += 1
            i = j
        else: i += 1
    env = np.convolve(np.repeat(g, fl), np.ones(int(0.03 * SR)) / int(0.03 * SR), mode="same")
    yy = y.copy(); yy[:len(env)] = y[:len(env)] * env
    return yy, cnt


def sibilance_index(y, floor):
    import librosa
    S = np.abs(librosa.stft(y, n_fft=1024, hop_length=256)) ** 2; f = librosa.fft_frequencies(sr=SR, n_fft=1024)
    lo = 10 * np.log10(S[(f >= 1000) & (f < 4000)].sum(0) + 1e-12); hi = 10 * np.log10(S[(f >= 5000) & (f < 9000)].sum(0) + 1e-12)
    tot = 10 * np.log10(S.sum(0) + 1e-12); sp = tot > np.percentile(tot, 50)
    return float(np.percentile(hi[sp], 95) - np.median(lo[sp]))


def median_f0(y, floor):
    import librosa
    y16 = resample_poly(y, 1, 3); f0 = librosa.yin(y16.astype(np.float32), fmin=60, fmax=400, sr=16000, frame_length=1024)
    d, fl = frames_db(y16, 64); n = min(len(f0), len(d) * 4)
    lvl = np.repeat(d, 4)[:len(f0)] if len(d) * 4 >= len(f0) else np.pad(np.repeat(d, 4), (0, len(f0) - len(d) * 4), constant_values=-99)
    v = lvl > (np.percentile(d, 90) - 12)
    return float(np.median(f0[v])) if v.any() else float("nan")


def take_features(x, tk, ref_n):
    segs = [(s["start"], s["end"]) for s in tk["segs"]]
    hyp = norm_words(" ".join(s["text"] for s in tk["segs"]))
    speech = sum(e - s for s, e in segs)
    wpm = len(hyp) / speech * 60
    pauses = sum(1 for (s0, e0), (s1, e1) in zip(segs, segs[1:]) if s1 - e0 > B["pause_max_s"])
    a, b = int(max(0, segs[0][0] - 0.5) * SR), int(min(len(x) / SR, segs[-1][1] + 0.5) * SR)
    nf = floor_db_of(x[a:b]); clip = int((np.abs(x[int(segs[0][0] * SR):int(segs[-1][1] * SR)]) >= 0.999).sum())
    fill = sum(w in CFG["fillers"] for w in hyp) + sum(1 for i in range(len(hyp) - 1) if hyp[i] == hyp[i + 1]) \
        + sum(1 for i in range(len(hyp) - 3) if hyp[i:i + 2] == hyp[i + 2:i + 4])
    W = CFG["weights"]
    comp = dict(wer=W["wer"] * tk["WER"], pacing=W["pacing"] * abs(wpm - CFG["target_wpm"]) / CFG["target_wpm"],
                pause=W["pause"] * pauses, noise=W["noise"] * max(0.0, nf + 45), clipping=W["clipping"] * min(1.0, clip / B["clip_full_penalty_samples"]),
                filler=W["filler"] * fill)
    f0 = median_f0(x[int(segs[0][0] * SR):int(segs[-1][1] * SR)], nf)
    return dict(f0=round(f0, 1), wpm=round(wpm, 1), pauses=pauses, noise_floor=round(nf, 1), clipped=clip, fillers=fill,
                comps={k: round(v, 4) for k, v in comp.items()}, score=round(sum(comp.values()), 4))


def stage_build(variant=None):
    """variant None = best-in-pool over all takes; 'low'/'high' = only takes whose median F0 is below/above voice_group_split_hz.
    These are measured acoustic groups, NOT speaker labels (A/B must come from the raw/A, raw/B folders)."""
    import shutil
    global OUT
    if variant:
        base = OUT; OUT = base / f"variant-{variant}F0"; (OUT / "scenes").mkdir(parents=True, exist_ok=True); shutil.copy(base / "inventory.json", OUT / "inventory.json")
    scripts = load_script(); sw = {k: norm_words(v) for k, v in scripts.items()}
    budgets = CFG["budgets"][CFG["video"]]
    takes = [t for t in json.loads((WORK / "takes.json").read_text()) if t["scene"] in sw and t["WER"] is not None
             and t["file"] not in CFG["exclude"]]
    segs_all = json.loads((WORK / "segments.json").read_text())
    audio = {}
    def get_audio(f):
        if f not in audio: audio[f] = sf.read(work_wav(RAW / f), dtype="float64")[0]
        return audio[f]
    # ---- choose (single pool: speaker labels unknown, so no switch penalty / max_switches can be applied)
    rank_rows, chosen = [], {}
    for sc in budgets:
        cands = []
        for t in takes:
            if t["scene"] != sc: continue
            ft = take_features(get_audio(t["file"]), t, len(sw[sc])); t = dict(t, **ft)
            if variant and (t["f0"] < B["voice_group_split_hz"]) != (variant == "low"): continue
            cands.append(t)
            rank_rows.append([sc, t["speaker"], t["file"], t["segs"][0]["start"], t["segs"][-1]["end"], t["WER"], t["wpm"], t["pauses"],
                              t["noise_floor"], t["clipped"], t["fillers"], t["f0"], *t["comps"].values(), t["score"]])
        if not cands: sys.exit(f"variant {variant}: no candidate take for scene {sc}")
        cands.sort(key=lambda t: t["score"]); chosen[sc] = (cands[0], cands[1] if len(cands) > 1 else None, len(cands))
    with open(OUT / "takes_ranked.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["scene", "speaker", "file", "start", "end", "WER", "wpm", "pauses_gt_0.8s", "noise_floor_dBFS", "clipped_samples",
                                       "fillers_repeats", "median_F0_Hz", "c_wer", "c_pacing", "c_pause", "c_noise", "c_clipping", "c_filler", "score"])
        w.writerows(sorted(rank_rows, key=lambda r: (list(budgets).index(r[0]), r[-1])))
    # ---- clean / fit / level each scene
    SC = OUT / "scenes"; SC.mkdir(parents=True, exist_ok=True)
    for old in SC.glob("*.wav"): old.unlink()
    res = []; cursor = 0.0; fade = int(B["fade_ms"] / 1000 * SR)
    for idx, (sc, budget) in enumerate(budgets.items(), 1):
        tk, runner, ncand = chosen[sc]; x = get_audio(tk["file"])
        segs = [(s["start"], s["end"]) for s in tk["segs"]]
        clip, smap = assemble_take(x, segs); raw_dur = segs[-1][1] - segs[0][0]
        fl = floor_db_of(x[int(max(0, segs[0][0] - .5) * SR): int((segs[-1][1] + .5) * SR)])
        sp_med = float(np.median(frames_db(clip, 50)[0][frames_db(clip, 50)[0] > fl + 15]))
        f0 = median_f0(clip, fl)
        clip, nbreath = attenuate_breaths(clip, fl, sp_med)
        L = len(clip) / SR; ratio = 1.0; flags = []
        if L > budget:
            need = L / budget
            if need - 1 <= B["max_stretch"]:
                ratio = need; clip = run_ff(clip, f"atempo={ratio:.6f}", f"{sc}_tempo")
                smap = [(a / ratio, b / ratio) for a, b in smap]; L = len(clip) / SR
            else:
                flags.append(f"TOO LONG by {L - budget:.1f} s (no stretch applied: exceeds {B['max_stretch']*100:.0f} % limit; trim script or re-record)")
        tone, tone_at, tone_db = find_room_tone(x, [s for s in segs_all if s["file"] == tk["file"]])
        pad_s = max(0.0, budget - L)
        if pad_s > 0: clip = xfade(clip, make_tone(tone, int(pad_s * SR) + int(0.05 * SR)), int(0.05 * SR)); clip = clip[:int(max(budget, L) * SR)]
        if tk["WER"] > CFG["wer_max"]: flags.insert(0, f"RE-RECORD (best WER {tk['WER']:.3f} > {CFG['wer_max']})")
        # noise reduction: strongest setting whose measured floor reduction stays <= limit
        nf_raw = floor_db_of(clip)
        clip_hp = run_ff(clip, f"highpass=f={B['hp_hz']}:poles=2,bandreject=f={B['notch_hz']}:width_type=q:w={B['notch_q']}", f"{sc}_hp")
        nf_in = floor_db_of(clip_hp); y = None          # afftdn works on the post-high-pass floor
        for nr in B["nr_db_try"]:
            y = run_ff(clip_hp, f"afftdn=nr={nr}:nf={max(-80, min(-20, nf_in)):.1f}:tn=1", f"{sc}_nr{nr}")
            red = nf_in - floor_db_of(y)
            if red <= B["max_floor_reduction_db"]: break
        if red > B["max_floor_reduction_db"]: flags.append("ARTEFACT RISK (afftdn floor reduction > limit even at lowest strength)")
        elif nr < B["nr_db_try"][0]: flags.append(f"NR lowered to {nr} dB (first setting reduced floor by > {B['max_floor_reduction_db']} dB)")
        if nf_in > B["floor_risk_dbfs"]: flags.append(f"ARTEFACT RISK (post-high-pass noise floor {nf_in:.1f} dBFS above {B['floor_risk_dbfs']}; check for watery sound)")
        sib = sibilance_index(y, fl); deessed = B["deess_enabled"] and sib > B["deess_threshold_db"]
        if deessed: y = run_ff(y, f"deesser=i={B['deess_amount']}:m=0.5:f=0.5", f"{sc}_ds")
        y, ln = loudnorm_two_pass(y, sc)
        y = y.copy(); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
        for _ in range(3):                                          # linear trim if loudnorm missed the target; never above the true-peak limit
            I, TP = measure_loudness(y, sc); g = B["loudness"]["I"] - I if abs(B["loudness"]["I"] - I) > 0.3 else 0.0
            cap = B["loudness"]["TP"] - B["loudness"]["tp_guard"]                    # stay a hair under the limit
            if TP + g > cap: g = cap - TP
            if abs(g) < 0.05: break
            y = y * 10 ** (g / 20)
        I, TP = measure_loudness(y, sc)
        sf.write(SC / f"scene-{idx:02d}-{sc}.wav", y, SR, subtype="PCM_24")
        slot = max(budget, len(y) / SR)
        res.append(dict(idx=idx, scene=sc, tk=tk, runner=runner, ncand=ncand, y=y, start=cursor, slot=slot, budget=budget, raw_dur=raw_dur,
                        final_dur=len(y) / SR, ratio=ratio, nr=nr, nf_raw=nf_raw, nf_in=nf_in, nf_out=floor_db_of(y), red=red, flags=flags, I=I, TP=TP, sib=sib,
                        deessed=deessed, nbreath=nbreath, f0=f0, smap=smap, tone=(tone_at, tone_db), pad=pad_s, ln_in=float(ln["input_i"])))
        cursor += slot
        print(f"scene {idx} {sc:<9} take {tk['segs'][0]['start']:.1f}-{tk['segs'][-1]['end']:.1f}  WER {tk['WER']:.3f}  final {len(y)/SR:5.1f}s / budget {budget}s  "
              f"I={I:.2f} TP={TP:.2f}  nr={nr} red={red:.1f}dB  stretch={ratio:.4f}  {'; '.join(flags)}", flush=True)
    # ---- assemble master
    master = np.zeros(int(round(cursor * SR)))
    for r in res: a = int(round(r["start"] * SR)); master[a:a + len(r["y"])] = r["y"]
    sf.write(OUT / "voiceover.wav", master, SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / "voiceover.wav"), "-c:a", "libmp3lame", "-b:a", "192k", str(OUT / "voiceover.mp3")], check=True)
    tl = []; bstart = 0.0
    for r in res:
        tk = r["tk"]
        tl.append(dict(scene=r["scene"], start_s=round(r["start"], 3), end_s=round(r["start"] + r["slot"], 3), budget_start_s=round(bstart, 3),
                       drift_s=round(r["start"] - bstart, 3), voice_start_s=round(r["start"] + B["lead_tail_s"], 3),
                       voice_end_s=round(r["start"] + r["final_dur"] - B["lead_tail_s"] - (r["pad"] if r["pad"] > 0 else 0), 3),
                       speaker=tk["speaker"], source_file=tk["file"], take=f"{tk['segs'][0]['start']:.2f}-{tk['segs'][-1]['end']:.2f}",
                       WER=tk["WER"], flags=r["flags"]))
        bstart += r["budget"]
    (OUT / "timeline.json").write_text(json.dumps(tl, indent=1))
    shutil.rmtree(WORK / "tmp", ignore_errors=True)
    write_report(res, sw, scripts, master, variant)
    stage_verify()
    if variant:
        shutil.copy(OUT / "voiceover.mp3", base / f"voiceover-{variant}F0-only.mp3")


def stage_verify():
    """Re-transcribe the FINAL scene files with the same local ASR and compare with the script.
    Two independent passes over the same speech show how much of the WER is ASR noise."""
    import sherpa_onnx
    A = CFG["asr"]; d = HERE / A["model_dir"]; scripts = load_script()
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / "small.en-encoder.int8.onnx"), decoder=str(d / "small.en-decoder.int8.onnx"),
                                                     tokens=str(d / "small.en-tokens.txt"), language="en", num_threads=A["num_threads"])
    tl = json.loads((OUT / "timeline.json").read_text()); rows = []; swaps = []
    for i, t in enumerate(tl, 1):
        y = sf.read(OUT / "scenes" / f"scene-{i:02d}-{t['scene']}.wav", dtype="float32")[0]; parts = [y]
        if len(y) > 28 * SR:                                  # ASR window is 30 s: split at the quietest point near the middle
            dd, fl = frames_db(y.astype("float64"), 20); mid = len(dd) // 2; k = mid - 100 + int(np.argmin(dd[mid - 100:mid + 100]))
            parts = [y[:k * fl], y[k * fl:]]
        txt = []
        for p_ in parts:
            st = rec.create_stream(); st.accept_waveform(SR, p_); rec.decode_stream(st); txt.append(st.result.text.strip())
        t["final_file_WER"] = round(wer(norm_words(" ".join(txt)), norm_words(scripts[t["scene"]])), 4)
        if any(f.startswith("RE-RECORD") and "re-transcription" not in f for f in t["flags"]) and t["final_file_WER"] <= CFG["wer_max"]:
            new = []
            for f in t["flags"]:
                if f.startswith("RE-RECORD") and "re-transcription" not in f:
                    g = f + " — but re-transcription of the final file gives WER %.3f ≤ %.2f: likely ASR noise, verify by ear" % (t["final_file_WER"], CFG["wer_max"])
                    swaps.append((f, g)); f = g
                new.append(f)
            t["flags"] = new
        rows.append((t["scene"], t["WER"], t["final_file_WER"]))
    (OUT / "timeline.json").write_text(json.dumps(tl, indent=1))
    rp = (OUT / "report.md").read_text()
    sec = ["", "## Post-processing check (second ASR pass on the final scene files)", "",
           "| Scene | WER at selection (raw take) | WER of final file | Δ |", "|---|---|---|---|"]
    sec += [f"| {a} | {b:.3f} | {c:.3f} | {c - b:+.3f} |" for a, b, c in rows]
    sec += ["", "The same speech scored differently in two ASR passes (|Δ| up to %.2f). WER differences smaller than that between takes, and the 0.15 RE-RECORD threshold itself, "
            "are within ASR noise; treat flags as prompts to listen, not verdicts." % max(abs(c - b) for _, b, c in rows), ""]
    for old, new in swaps: rp = rp.replace(old, new)           # keep the scene table's flags column in step with timeline.json
    (OUT / "report.md").write_text(rp + "\n".join(sec) + "\n")
    print("verify ->", rows)


def seg_diffs(seg, ref):
    h = norm_words(seg["text"]); r = ref[seg["ref_a"]:seg["ref_b"]]; out = []
    for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, r, h, autojunk=False).get_opcodes():
        if op != "equal": out.append(f"script \"{' '.join(r[a0:a1]) or '∅'}\" → heard \"{' '.join(h[b0:b1]) or '∅'}\"")
    return out


def write_report(res, sw, scripts, master, variant=None):
    inv = json.loads((OUT / "inventory.json").read_text())[0]; L = []
    tl = lambda s: f"{int(s // 60)}:{s % 60:05.2f}"
    L += ["# Voiceover report — ergoaidesk" + (f" (variant: only takes with median F0 {'below' if variant == 'low' else 'at/above'} {B['voice_group_split_hz']} Hz)" if variant else ""), "",
          f"Master: `out/voiceover.wav` ({len(master)/SR:.1f} s; budget total {sum(r['budget'] for r in res)} s), `out/voiceover.mp3` (192 kbps).", "",
          "## Read this first", "",
          "- **Speaker identity is unknown.** `raw/` holds one unlabelled file, so every take has speaker `?`. `switch_penalty`, `max_switches`, voice matching EQ and the A-only/B-only exports could not be applied. "
          "Each scene was chosen as best-in-pool; if the recording holds two voices, consecutive scenes may come from different people (see voice-consistency diagnostic below).",
          "- **ASR caveat.** WER is measured against a local Whisper small.en (ONNX int8) transcript, not against what was actually said. Brand names and technical terms are often mis-heard (e.g. 'ERGO-AI DESK'), so WER over-states real errors by an unknown amount. Word-level times are not available; all times below are segment-level.",
          "- **Budgets are not forced.** As requested, scenes longer than budget are kept whole (order preserved); later scenes shift later by the cumulative `drift_s` in `timeline.json`.",
          "- **No take joins.** Every scene is a single take (pauses inside it shortened). No take-to-take splicing was done.",
          "- **Noise reduction.** The dominant noise in this recording is not hiss: ~70 % of the silent-frame power lies below 60 Hz (subsonic drift plus a tonal peak at 48.3 Hz). "
          f"Each scene therefore gets a {B['hp_hz']} Hz 2nd-order high-pass and a narrow notch at {B['notch_hz']} Hz (band power 100 Hz–12 kHz measured unchanged on a test take), then `afftdn` at the strength shown. "
          "afftdn alone lowered the floor by only ~0.5 dB, i.e. it is mild by design; I cannot judge by ear whether any watery artefact is present.",
          "- **Scoring weight changed during the run.** The first build used a flat 0.10 clipping penalty, which made 1–2 full-scale samples (MP3 decode overs) outweigh a 0.10 WER difference and picked worse-WER takes for solution and demo. "
          f"The penalty is now proportional: weight × min(1, clipped samples / {B['clip_full_penalty_samples']}).",
          "- **De-esser not applied.** The a-priori sibilance heuristic (p95 of 5–9 kHz band minus median of 1–4 kHz band, threshold 6 dB) exceeded the threshold on every scene (see processing log), so it did not discriminate 'clearly harsh' from normal; it is disabled (`deess_enabled: false`) and the index is only reported.",
          "- **Not applied:** mouth-click removal (no reliable detector without word alignment). Breath attenuation is a simple level/spectrum heuristic (-9 dB), counts below.", "",
          "## Source recording", "", f"`{inv['file']}`: {inv['duration_s']} s, {inv['sample_rate']} Hz, {inv['channels']} ch, peak {inv['peak_dBFS']} dBFS, "
          f"{inv['integrated_LUFS']} LUFS, noise floor {inv['noise_floor_dBFS']} dBFS, {inv['clipped_samples']} samples at full scale (mono mix).", "",
          "## Scenes", "",
          "| # | Scene | Speaker | Take (source s) | WER | Score | Raw → final (s) | Budget | Start (s) | Drift | Stretch | afftdn (dB) | Floor raw→after HP+notch→final incl. loudness gain (dBFS) | LUFS / TP | Flags |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in res:
        t = r["tk"]
        L.append(f"| {r['idx']} | {r['scene']} | ? | {t['segs'][0]['start']:.1f}–{t['segs'][-1]['end']:.1f} | {t['WER']:.3f} | {t['score']:.3f} | {r['raw_dur']:.1f} → {r['final_dur']:.1f} | {r['budget']} | "
                 f"{r['start']:.1f} | {r['start'] - sum(x['budget'] for x in res[:r['idx']-1]):+.1f} | {'×%.4f' % r['ratio'] if r['ratio'] != 1 else 'none'} | {r['nr']} | "
                 f"{r['nf_raw']:.1f}→{r['nf_in']:.1f}→{r['nf_out']:.1f} | {r['I']:.2f} / {r['TP']:.2f} | {'; '.join(r['flags']) or '—'} |")
    Is = [r["I"] for r in res]
    L += ["", f"Loudness spread across scenes: {max(Is) - min(Is):.2f} LU (target ≤ {B['loudness']['tolerance_LU']} LU). Fades: {B['fade_ms']} ms in/out on every scene file.", "",
          "## Why each take won", ""]
    for r in res:
        t, ru = r["tk"], r["runner"]
        c = " + ".join(f"{k} {v:.3f}" for k, v in t["comps"].items() if v > 0) or "0"
        s = f"- **{r['scene']}** ({r['ncand']} candidates): score {t['score']:.3f} = {c}. wpm {t['wpm']}, pauses>0.8 s {t['pauses']}, take noise floor {t['noise_floor']} dBFS, clipped samples {t['clipped']}, fillers/repeats {t['fillers']}."
        if ru: s += f" Runner-up {ru['segs'][0]['start']:.1f}–{ru['segs'][-1]['end']:.1f} s: score {ru['score']:.3f} (WER {ru['WER']:.3f}); margin {ru['score'] - t['score']:.3f}."
        else: s += " Only candidate."
        L.append(s)
    L += ["", "All candidate scores: `out/takes_ranked.csv`.", "", "## Processing log per scene", ""]
    for r in res:
        L.append(f"- **{r['scene']}**: breath runs attenuated {r['nbreath']}; sibilance index {r['sib']:.1f} dB ({'de-esser applied' if r['deessed'] else 'de-esser not applied'}); "
                 f"room tone for padding from {r['tone'][0]} s (level {r['tone'][1]} dBFS), pad {r['pad']:.1f} s; loudnorm input {r['ln_in']:.1f} LUFS.")
    # speaker switches / voice consistency
    f0s = [r["f0"] for r in res]; spread = (max(f0s) - min(f0s)) / np.nanmedian(f0s)
    grp = ["low" if f < B["voice_group_split_hz"] else "high" for f in f0s]
    sw_pts = [(res[i + 1]["start"], res[i]["scene"], res[i + 1]["scene"]) for i in range(len(res) - 1) if grp[i] != grp[i + 1]]
    L += ["", "## Speaker-switch points", "",
          "Speaker labels were not provided, so `switch_penalty`/`max_switches` were not applied and no speaker is named here. Measured diagnostic instead — median F0 of each chosen take (Hz): " +
          ", ".join(f"{r['scene']} {r['f0']:.0f} ({g})" for r, g in zip(res, grp)) + f". Relative spread {spread:.0%}.",
          ("Acoustic-group changes between consecutive scenes (these would be the voice-change points if the two groups are two people): " +
           "; ".join(f"**{tl(t)}** ({a_} → {b_})" for t, a_, b_ in sw_pts) + ". The join already carries ~0.3 s of room tone (0.15 s tail + 0.15 s head); the 250 ms / 100 ms-crossfade rule was not applied because it presumes confirmed speaker labels.")
          if sw_pts else "No change of acoustic group between consecutive scenes.", ""]
    # wording differences
    L += ["", "## Wording differences vs script (not corrected; may be ASR error or the speaker — listen)", ""]
    for r in res:
        t = r["tk"]; ref = sw[r["scene"]]; items = []
        for k, s in enumerate(t["segs"]):
            at = r["start"] + r["smap"][k][0] / r["ratio"] * (1 if r["ratio"] == 1 else 1)
            for d in seg_diffs(s, ref): items.append(f"[{tl(r['start'] + r['smap'][k][0])}] {d}")
        cov_a, cov_b = t["segs"][0]["ref_a"], t["segs"][-1]["ref_b"]
        if cov_a > 0: items.append(f"script start not heard: \"{' '.join(ref[:cov_a])}\"")
        if cov_b < len(ref): items.append(f"script end not heard: \"{' '.join(ref[cov_b:])}\"")
        L.append(f"- **{r['scene']}**: " + ("; ".join(items) if items else "none detected"))
    # glossary
    L += ["", "## Glossary terms: transcription result in the final audio (check pronunciation by ear)", ""]
    letters = lambda t: re.sub(r"[^a-z0-9]", "", t.lower())
    for g in CFG["glossary"]:
        key = letters(g); hits = []
        if not any(key in letters(v) for v in scripts.values()):
            L.append(f"- **{g}**: not in this video's narration script, nothing to check."); continue
        for r in res:
            ref = sw[r["scene"]]
            for k, sg in enumerate(r["tk"]["segs"]):
                when = f"[{tl(r['start'] + r['smap'][k][0])}, {r['scene']}]"
                if key in letters(sg["text"]): hits.append(f"{when} heard as written"); continue
                h = norm_words(sg["text"]); rr = ref[sg["ref_a"]:sg["ref_b"]]
                for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, rr, h, autojunk=False).get_opcodes():
                    sc_l = letters("".join(rr[a0:a1]))
                    if op != "equal" and len(sc_l) >= 4 and (sc_l in key or key in sc_l):
                        hits.append(f"{when} script \"{' '.join(rr[a0:a1])}\" → heard \"{' '.join(h[b0:b1]) or '∅'}\"")
        L.append(f"- **{g}**: " + (" | ".join(hits) if hits else "in the script, but not located in the chosen takes' transcript"))
    # lowest confidence
    worst = []
    for r in res:
        for k, s in enumerate(r["tk"]["segs"]):
            worst.append((s["seg_err_rate"], r, k, s))
    worst.sort(key=lambda w: -w[0])
    L += ["", "## Five lowest-confidence spots (largest ASR-vs-script mismatch per segment; segment-level, no word times)", "",
          "| # | Final-audio time | Scene | Source time | Mismatch rate | Heard (ASR) |", "|---|---|---|---|---|---|"]
    for n, (e, r, k, s) in enumerate(worst[:5], 1):
        a, b = r["smap"][k]
        L.append(f"| {n} | {tl(r['start'] + a)}–{tl(r['start'] + b)} | {r['scene']} | {s['start']:.1f}–{s['end']:.1f} | {e:.2f} | {s['text'][:140]} |")
    (OUT / "report.md").write_text("\n".join(L) + "\n")
    print("report -> out/report.md")


if __name__ == "__main__":
    st = sys.argv[1]
    if st == "build": stage_build(sys.argv[2] if len(sys.argv) > 2 else None)        # optional: low | high
    else: {"inventory": stage_inventory, "transcribe": stage_transcribe, "match": stage_match, "verify": stage_verify}[st]()
