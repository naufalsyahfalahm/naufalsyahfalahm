#!/usr/bin/env python3
"""Voiceover pipeline. Stages implemented so far: inventory, transcribe, match.

    . .venv/bin/activate
    python make_voiceover.py inventory   # step 1  -> work/*.wav, out/inventory.json
    python make_voiceover.py transcribe  # step 2-3a -> work/segments.json (silence split + local ASR)
    python make_voiceover.py match       # step 3b -> out/segments.csv, out/takes.csv, out/glossary.txt

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
    with open(OUT / "takes.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["speaker", "file", "start", "end", "scene", "WER", "duration", "n_segments", "text"])
        w.writerows(rows)
    gl = [f"{g!r}: " + (" | ".join(f"{s['file']} {s['start']:.1f}s -> \"{s['text']}\"" for s in segs
                                   if re.sub(r"[^a-z0-9]", "", g.lower()) in re.sub(r"[^a-z0-9]", "", s["text"].lower()))
                        or "NOT found verbatim in any transcript segment") for g in CFG["glossary"]]
    (OUT / "glossary.txt").write_text("\n".join(gl))
    print(f"{len(segs)} segments, {len(rows)} takes -> out/segments.csv, out/takes.csv, out/glossary.txt")


if __name__ == "__main__":
    {"inventory": stage_inventory, "transcribe": stage_transcribe, "match": stage_match}[sys.argv[1]]()
