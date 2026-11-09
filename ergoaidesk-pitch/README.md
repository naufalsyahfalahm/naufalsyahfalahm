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
| `footage/hook.mp4` | Scene 1 | Flat illustration (slump, then hand on neck), tagged "Ilustrasi" |
| `screens/app-home-header-crop.png` | Scene 4, phone frame beside the diagram | Labelled placeholder phone |
| `screens/app-upload-screen.png` | Scene 5a (`demoMode: "photos"`), slow pan, never above 1.5x | Labelled placeholder phone, callouts still shown |
| `recordings/demo-pose.mp4` | Scene 5b | `[REKAMAN: ganti demo-pose.mp4]` |
| `recordings/demo-questionnaire.mp4` | Scene 5c | `[REKAMAN: ganti demo-questionnaire.mp4]` |
| `recordings/demo-dashboard.mp4` | Scene 5d | `[REKAMAN: ganti demo-dashboard.mp4]` |
| `footage/presenter.mp4` | Scene 7, slow zoom 1.00 to 1.08 | Navy card with label |
| `data/validation.csv` | Scene 6 charts | Claim cards only |
| `voiceover.mp3`, `music.mp3` | Audio (music volume 0.12, fade in/out) | Renders silent |
| `brand/logo.png` | Logo mark | Plain vector mark drawn (not an official logo) |

`validation.csv` columns: `system_score, expert_score, physical_score, psychological_score`. With >= 4 complete rows the claim cards shrink
to a top row and two scatter charts are added (system vs expert with identity line; physical vs psychological).
Pearson r with 95% CI (Fisher z, se = 1/sqrt(n-3)) and n are computed in the video from the CSV and labelled "Computed from supplied data".
Assumptions: roughly linear association; CI assumes approximately bivariate-normal data. The charts carry no tick labels (every on-screen text is >= 44 px); read the values from the r/CI/n line.

## The supplied recordings are mockups

`public/MOCKUP-README.txt` states that every screen and recording is a **mockup with simulated data** (keypoints and results illustrative).
They are therefore shown with the label **"Mockup antarmuka (data simulasi)"** (`MOCKUP_LABEL`), contrary to the generic rule that recordings carry no tag.
Set `recordingsAreMockups = false` only when real app recordings replace them.

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

## Captions

Text is the PDF narration, split at clause boundaries, words unchanged. Cues are auto-timed in proportion to character count (scenes 1-4, 6, 7) or set by explicit frames (scene 5).
**These are estimates, not synced to audio.** Once `voiceover.mp3` exists, run `npm run check:audio` and copy the printed speech frames into `NARRATION[...].at`.
`npm run check` also warns when a scene's narration cannot be read in its window at 150 wpm.
