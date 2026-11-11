# ERGO-AI DESK: 3-minute pitch video (Remotion)

International 3-Minute OSH Innovation Challenge 2026.
Composition `ErgoAIDeskPitch`: 1920x1080, 30 fps, 5400 frames (180.0 s). Narration and scene timing follow `reference/Skenario_Lomba_OUM.pdf`.

Accepted title: *ERGO AI DESK: Multidomain Ergonomic Risk Assessment System Integrating Computer Vision Pose Estimation and Psychosocial Self-Report Instruments*.
(The PDF header words it slightly differently: "...Computer Vision-Based Pose Estimation and Psychological Self-Report Instruments". The video uses the accepted title where a title is needed; it is not printed on screen.)

## Commands

```bash
npm install
npm run dev            # Remotion Studio (re-scans public/ first)
npm run check          # scan assets + spec checks (contrast, timing, lint, stats) + tsc
npm run check:audio    # only if public/voiceover.mp3 exists: scene start/end vs speech, overrun warnings
scripts/stills.sh out/stills 120 450 ...   # stills at chosen frames
npm run render         # out/ergoaidesk-pitch.mp4  (h264, crf 18)
```

`npm run scan` (run by dev/check/render) writes `src/generated/assets.ts`, which records which optional files exist,
their native pixel size, and the rows of `public/data/validation.csv`. **Re-run it after adding or removing a file.**
A missing file never errors; its slot renders as a labelled placeholder (or the optional layer is omitted).

Offline/sandbox note: `remotion.config.ts` uses `/opt/pw-browsers/chromium` when present (or `REMOTION_BROWSER_EXECUTABLE`), because Remotion's own headless-shell download may be blocked.

## Everything editable is in `src/config.ts`

Frame ranges, on-screen text, colours, file paths, team names, caption toggle (`captionsEnabled`), `demoMode`, `claims`,
`questionnaireName`, `benefits`, `RECORDINGS` (trim, rate), `FOOTAGE_PRIVACY`, `NARRATION` (caption text and timing).

## Slots (what to supply)

| File (under `public/`) | Used in | If missing |
|---|---|---|
| `footage/hook.mp4` | Scene 1 | Flat illustration (slump, then hand on neck); the "Ilustrasi" tag is off (`showIllustrationTag`) |
| `screens/app-home-header-crop.png` | Scene 4, phone frame beside the diagram. Currently the top 300 px of `mock-01-beranda.png` (header and title) | Labelled placeholder phone |
| `screens/app-upload-screen.png`, `app-upload-screen-top.png` | Scene 5a (`demoMode: "photos"`): side view, then top view, slow pan. Currently the mockup capture screens (lateral, superior) cropped above their placeholder text; callouts "Lateral view" and "Superior view (connections 8-13)" list the points analysed in each view | Labelled placeholder phone, callouts still shown |
| `recordings/demo-pose.mp4` | Scene 5b | `[REKAMAN: ganti demo-pose.mp4]` |
| `recordings/demo-questionnaire.mp4` | Scene 5c | `[REKAMAN: ganti demo-questionnaire.mp4]` |
| `recordings/demo-dashboard.mp4` | Scene 5d | `[REKAMAN: ganti demo-dashboard.mp4]` |
| `footage/presenter.mp4` | Scene 7, slow zoom 1.00 to 1.08 | Navy card with label |
| `data/validation.csv` | Scene 6 charts | Claim cards only |
| `voiceover.mp3`, `music.mp3` | Audio (music volume 0.12, fade in/out) | Renders without it |
| `brand/logo.png` | Product logo mark | Plain vector mark drawn (not an official logo) |
| `brand/ugm.png`, `british-council.png`, `dsig.png`, `ldtrc.png`, `middlesex.png` | Closing card, in this order (`CLOSING_LOGOS`) | The logo is omitted |

`validation.csv` columns: `system_score, expert_score, physical_score, psychological_score`. With >= 4 complete rows the claim cards shrink
to a top row and two scatter charts are added (system vs expert with identity line; physical vs psychological).
Pearson r with 95% CI (Fisher z, se = 1/sqrt(n-3)) and n are computed in the video from the CSV and labelled "Computed from supplied data".
Assumptions: roughly linear association; CI assumes approximately bivariate-normal data. The charts carry no tick labels (every on-screen text is >= 44 px); read the values from the r/CI/n line.

## The supplied recordings are mockups

`public/MOCKUP-README.txt` states that every screen and recording is a **mockup with simulated data** (keypoints and results illustrative) and asks for the label
"Mockup antarmuka (data simulasi)". **At the author's request the label is not shown** (`showMockupLabel = false` in `src/config.ts`; set it to `true` to restore it).
In its place the video shows app advantages (`ADVANTAGES`), each followed by the footnote "Designed functions; outcome data not yet available.":
"Instant, objective check" and "Recheck over time" (scene 4), and in scene 5 the app screens' own statements about photos, real-time keypoint guidance and answer privacy, plus
"Specific fixes such as monitor height, distance, seating". The screens and recordings are still simulated; without the label nothing on screen says so.

Two technical facts about these files:

1. **Content box.** Each file is a 780x1688 canvas, but the UI occupies only the top-left 390x844 (captured at 1x on a 2x canvas; the rest is flat grey).
   The video is cropped to that box (`RECORDING_CONTENT_BOX`), so on-screen UI resolution is 390x844 scaled about 1.07x. Re-export at true 2x for a sharper result.
2. **Trims.** The mockups contain bracketed placeholder text. OCR at 5 fps found these ranges, which are avoided by `RECORDINGS.*.startSec/endSec`:
   pose from 7.2 s ("[durasi tahan sesuai protokol]"); questionnaire 1.2-4.0 s ("[Teks final mengikuti persetujuan etik]") and from 12.0 s ("[usulan, perlu keputusan]");
   dashboard 0-2.6 s ("[ ]") and from 6.0 s ("[Uraian AI: ...]"). The clean windows are shorter than two slots, so pose and dashboard play at 0.5x and hold the last frame.
   OCR can miss text: re-check the trims by eye if the files change.

The static `screens/mock-*.png` files are included from the zip but are **not used** in the video (they are not the requested app screens, and several contain bracketed placeholder text).

## Privacy of people in footage

`FOOTAGE_PRIVACY.hook|presenter`: with `consentDocumented: false` (default) and no `blurRegions`, the **whole clip is blurred**.
Set `consentDocumented: true` once consent is on file, or list `blurRegions` (percent of frame) to blur faces only.

## Rules enforced in code

- All text goes through `<T>`: font size >= 44 px, line limit (default 2). The line limit is measured on the laid-out element and **fails the render** on overflow.
- Palette checked by `npm run check` (contrast >= 4.5:1 for every text/fill pair; no off-palette hex; red/amber/green not used decoratively; no emoji; no image filters on screens).
  Teal on navy is only 3.2:1, so teal is used for fills and lines only; text on teal is white.
- Claims state validation status only; forbidden phrases ("significant", effectiveness, injury, productivity) are scanned.
- If `benefits` is set, a closing beat is added to scene 4 together with "Designed functions; outcome data not yet available."
- App screens are never upscaled beyond `MAX_UPSCALE` (1.5x) and are drawn with no filters.
- The decorative world map is a land mask (Natural Earth 110m via `world-atlas`, public domain; `scripts/gen-world-dots.mjs`), one uniform colour and opacity: no regional shading or values.

## Voiceover and captions

`public/voiceover.mp3` is **already laid out on the video timeline** (180.0 s). It is built from the uncut recording
(`reference/AI_No_Cut_Audio.mp3`, 931 s, about 7 takes of the whole script plus outtakes) by

```bash
python3 scripts/build-voiceover.py     # needs numpy + ffmpeg; the raw file is not committed (22 MB), copy it to reference/
```

using `reference/voiceover-selection.json`, which lists, for each of the 18 sentences, the take used, its start/end in the raw file,
and the scores of every candidate take. `reference/voiceover-layout.json` records where each sentence landed.
Only silences are changed: pauses inside a sentence longer than 0.4 s are shortened to 0.4 s, sentences are placed at fixed onsets with 0.5 s between them, and each
clip is level-matched (speech RMS -18 dB) and limited. No speech is cut, sped up or reordered.

**How the takes were chosen.** Every sentence of every take was cut by forced alignment against the script, transcribed with two local Whisper models
(`base.en`, `small.en`), and scored by word error rate against the script, speaking rate, the longest pause inside the sentence, and clipping.
A take replaced the one used in the first voiceover only when it was at least as good in both models and clearly better.
This is a proxy, not listening: audition the changed sentences (table below) before the final export.

| Sentence | First voiceover | Now | Word error rate base / small |
|---|---|---|---|
| Scene 1, "How do we know..." | r337 | r286 | 0.18 / 0.00 -> 0.00 / 0.00 |
| Scene 2, "At the same time, psychological factors..." | r358 | r606 | 0.19 / 0.12 -> 0.06 / 0.00 ("perceived stress" was heard as "precip stress") |
| Scene 3, "Conventional ergonomic assessments..." | r98 | r640 | 0.64 / 0.36 -> 0.00 / 0.27 |
| Scene 3, "Physical assessments may rely on manual observation..." | r98 | r393 | 0.19 / 0.12 -> 0.06 / 0.06 |
| Scene 3, "When these assessments are not integrated..." | r98 | r640 | tied at 0.00 (small); 0.9 s shorter, which keeps scene 3's narration before 68.0 s |

The other 13 sentences keep the take used in the first voiceover; no candidate beat them in both models.
**Weakest sentence: scene 5, "Users capture their working posture using a camera, while YOLOv11 analyzes body keypoints and ergonomic indicators."**
The file has two takes of it and neither is clean (one reads "captured ... analyzed", past tense; the other garbles "keypoints" and "ergonomic indicators"). Re-record this line.

**One PDF timing was changed.** The PDF gives the research-gap scene 0:45-1:00. The narrator reads its three sentences in about 22.5 s (45.25-67.8 s),
so the gap|solution boundary is at 68.0 s (frame 2040) instead of 60.0 s. To restore the PDF boundary set `SCENES.gap.to`, `SCENES.solution.from` and the
`TRANSITIONS` entry back to 1800; the third sentence will then be heard 7.8 s into scene 4. Scenes 1, 2 and 5-7 keep their PDF windows.

Captions are the PDF narration, words unchanged, split where the narrator pauses; every cue has `at` (and the last cue of a scene `to`) in frames.
Scene animations (glow points, flow nodes, divider and "?", demo sub-clips, closing card) are timed to the same onsets.

```bash
npm run check:audio                              # scene windows vs speech, overruns, caption onsets vs speech
npm run check:audio -- --timeline some.wav       # same check on audio extracted from a render
```

If the voiceover changes, re-run `build-voiceover.py`, then `check:audio`, and update the `at`/`to` values in `NARRATION`.

## Closing-card logos

The five logos sit in one white rounded band (1424x132 px) under the team names, separated by thin dividers, in the same placement as the ErgoFix pitch video
(order: UGM, British Council, DSIG, London Digital Twin Research Centre, Middlesex; `CLOSING_LOGOS` in `src/config.ts`). A logo is enlarged by at most 1.3x and has no filters.
`ldtrc.png` is the official London Digital Twin Research Centre logo (500x169, from dt.mdx.ac.uk); its text is white, so it sits on a small navy tile inside the band.
`ugm.png` and `dsig.png` are the HD files supplied by the team. **`british-council.png` (177x51) and `middlesex.png` (104x104, the crest only) are the low-resolution files supplied
and should be replaced with the official HD files** (`npm run check` warns). The ErgoFix video shows Middlesex as the horizontal crest-and-name lockup; that file was not supplied.
The British Council and Middlesex marks are subject to their owners' brand rules; confirm permission for this use.

## Music

`public/music.mp3` is an original track generated by `python3 scripts/build-music.py` (numpy + ffmpeg, deterministic): a warm pad on an Am7 - Fmaj7 - Cmaj7 - Gadd9 loop
at 76 BPM, a soft sine bass and sparse plucked arpeggios from about 16 s, no percussion so it stays under the narration. It contains no third-party material, so it carries no licence obligations.
It is 180 s and is played at `MUSIC_VOLUME` 0.12 with a fade in and out. Checked objectively (chord pitches, level stability, no clicks, spectral balance) but not auditioned by ear.
Replace the file with a licensed track of your choice if you prefer; the video picks up whatever is at that path.
