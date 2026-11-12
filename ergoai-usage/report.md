# report.md: Ergo AI Desk usage walkthrough

Composition `Walkthrough`, 1920x1080, 30 fps, 2520 frames (84.0 s), H.264 crf 18, no audio track (no `public/audio/voiceover.wav`; none generated).
All screens are mockups with simulated data. Nothing below claims visual quality beyond the programmatic checks listed; the stills in `out/stills/` are for your review.

## 1. Deviations from the brief (read first)

1. **Wrong archive uploaded.** `Alur_asesmen_interaktif-html.zip` contains the HTML design source (`Main.dc.html`, `support.js`, `vendor/`), not `ergoai-mockup-assets.zip`. I used the assets already in this repo (`ergoaidesk-pitch/public/screens/mock-01..07`, `recordings/*.mp4`, `MOCKUP-README.txt`), which match the brief's file names. Copies were verified byte-identical (md5) and are in `ergoai-usage/public/`; `MOCKUP-README.txt` is `README.txt`. The originals were not modified. If your intended zip differs from these files, the trims below must be redone.
2. **Recordings have grey padding.** Each recording is a 780x1688 canvas, but the UI occupies only the top-left 390x844 (the rest is flat grey, 1x capture on a 2x canvas). The phone shows that box, scaled uniformly by 1.137 and clipped (no distortion). On-screen recording UI is therefore less sharp than the 2x static PNGs. A true 2x re-export would fix this.
3. **Placeholder avoidance vs. slot length.** The placeholder-free windows of the recordings are short (section 4). Clips are trimmed to those windows and the last clean frame is held, so part of each recording slot is a freeze (dashboard: 78%). Setting `avoidPlaceholders = false` in `src/config.ts` plays the full clips instead (placeholders then visible); I did not render that variant.
4. **Persistent badge removed at the author's request (second render).** The bottom-left label "Mockup antarmuka (data simulasi)" is switched off (`showMockupBadge = false` in `src/config.ts`; set `true` to restore). The README.txt/brief requirement for it is therefore not met in this render. Still on screen: the result badge "Hasil ilustratif, bukan keluaran model nyata" on the three result scenes (verbatim in both `lang` values), the outro statement, and the app's own text ("Pratinjau simulasi", "Contoh hasil · simulasi"). No other frame states that the screens are simulated. The outro statement follows `lang` (en: "Interface mockup with simulated data"; id: verbatim from the brief).
5. **Intro card.** With the badge off, the intro card no longer contains the badge text.
6. **Pixel format.** ffprobe reports `yuvj420p` (full-range H.264 High). Players handle it; re-render with `--pixel-format yuv420p` if a target requires limited range.

## 2. Recording probes (ffprobe, originals untouched)

| File | Codec | Resolution | fps | Frames | Duration | Audio |
|---|---|---|---|---|---|---|
| demo-questionnaire.mp4 | h264 | 780x1688 | 30/1 (r = avg) | 378 | 12.600 s | none |
| demo-pose.mp4 | h264 | 780x1688 | 30/1 (r = avg) | 276 | 9.200 s | none |
| demo-dashboard.mp4 | h264 | 780x1688 | 30/1 (r = avg) | 353 | 11.767 s | none |

All are constant 30 fps, so no working copy was needed. No clip is longer than its slot (420 / 300 / 390 frames); none is sped up (1.0x everywhere).

## 3. Trims (source frames at 30 fps, inclusive)

| Segment | Slot | Played | Cut | Held |
|---|---|---|---|---|
| kuesioner | 420 | frames 130-357 (4.33-11.90 s) = 228 frames | 0-129: Beranda then "Persiapan" screen (consent text with "[Teks final mengikuti persetujuan etik]", frames 39-127); 358-377: "Unggah foto postur" screen ("[usulan, perlu keputusan]", from frame 359) | last frame, 192 frames |
| pose | 300 | frames 0-215 (0-7.17 s) = 216 frames | 216-275: "Foto siap diambil" state with "[durasi tahan sesuai protokol]" (from frame 217) | last frame, 84 frames |
| dashboard | 390 | frames 88-172 (2.93-5.73 s) = 85 frames | 0-87: orange note with "[ ]" (a sliver of it is still visible at frame 84; found by eye, OCR missed it); 173-352: returns to the note with "[ ]", then findings with "[Uraian AI: ...]" | last frame, 305 frames |

What the cuts remove from the interaction: the Beranda tap and the "Persiapan" screen (device and mouse selection) are not shown in the questionnaire segment; the pose clip stops at "Terkunci · luruskan ponsel" (before the unlock); the dashboard clip shows only the summary card scrolling and the "Hubungan antar-keypoint" section, not the findings list. The video therefore does not show the Persiapan step.

## 4. Bracketed placeholders (inventory)

Method: rapidocr on the 7 PNGs; on every 3rd recording frame (cropped to the 390x844 content box, 2x), boundaries refined per frame; clean windows checked by eye; OCR repeated on the rendered MP4 (5 fps, phone region).

| Where | Placeholder text | Location | Handling |
|---|---|---|---|
| mock-03 kamera-lateral | "[durasi tahan sesuai protokol]" | info card under preview, y 0.694-0.711 | **Visible** in the lateral scene; push-in skipped; focus box on the preview only, no dim |
| mock-04 kamera-superior | "[durasi tahan sesuai protokol]" | y 0.695-0.712 | **Visible** in the superior scene; same handling |
| mock-06 hasil-ringkasan | "[ ]" in "Teks bertanda [ ] menunggu protokol" | orange note, y 0.324-0.342 | **Visible** in the ringkasan scene; push-in skipped; focus box on the dark card (y 0.37-0.68), no dim |
| mock-07 hasil-temuan | "[Uraian AI: kontak telapak kaki ...]", "[Uraian AI: jarak punggung bawah ...]", "[Uraian AI: selisih tinggi siku ...]" (the third is cut by the bottom bar) | y 0.444-0.486, 0.667-0.708, 0.889-0.908 | **Visible** in the temuan scene; push-in skipped; focus box on the heading and description only, no dim |
| mock-01, 02, 05 | none found | | static scenes 02 and 05 use push-in |
| recordings | see section 3 | | avoided by trimming; none inside the played windows |

Why "visible" in four scenes: the phone shows the whole screen (no crop, no edit, nothing painted over), and the placeholder cannot be avoided by a zoom or crop region without changing the 390:844 frame. The dim overlay is switched off on those scenes so no placeholder is dimmed or singled out.

Rendered-MP4 OCR: bracket text appears only in crossfade frames at the boundaries of these four static scenes (e.g. frames 720-729 entering lateral, 1080 leaving superior, 1986 entering ringkasan). One further hit at frame 300 is the OCR misreading the camera icon on mock-01 ("[] Panduan foto AR"), not a placeholder.

Placeholders that exist in `Main.dc.html` but were not seen in any supplied PNG or recording: "[ambang sesuai protokol]", "[jumlah bingkai]", "[isi dari protokol]" (a method note), "[Butir stres kerja 1-3]" and "[Pilihan jawaban sesuai instrumen]" (domain D stress frame), "[toleransi sesuai protokol]". Not used in this video. OCR can miss text (one sliver was missed, see section 3), so residual risk remains for recording frames inside the played windows; please review them.

## 5. Focus boxes and ripples

See `focus_check.md` (normalised coordinates, pixel equivalents, UI element covered, OCR of each box region: no bracket text in any box). Ripples: beranda ("Mulai Asesmen") and tambahan ("Analisis dan lihat hasil"). Push-in 100% to 104% runs on beranda and tambahan only.

## 6. Captions that could not be supported

None. Framing lines (intro "How the assessment works", outro "Phases shown") and the stepper label "Home/Beranda" come from the brief rather than on-screen UI text; see `captions_check.md`.

## 7. Content conflicts on screen (shown unedited, not captioned)

- mock-01 reads "Hasil berupa ringkasan deskriptif dan probabilitas risiko." and the results screens have a "Risiko" tab, while README.txt says the mockup has no probability estimate and no combined score. No caption or graphic mentions probability or a score.
- mock-01 has a "Stres Kerja" tile. Domain D stress has no instrument; no caption mentions stress. A viewer could still read the tile as an existing instrument. You may want to decide whether to crop or comment on it.
- The questionnaire recording's section D is "Penglihatan" (vision), unrelated to stress.

## 8. Verification

- `ffprobe out/ergoai-usage.mp4`: h264 High, 1920x1080, 30/1 fps, 2520 frames, duration 84.000 s (target 84 s), 1 video stream, no audio stream (correct: no voiceover.wav).
- `scripts/verify_stills.py` on 33 stills (first, middle, last frame of each of 11 segments; PNG): 0 failing checks.
  - Safe zone x >= 1426, y >= 771: max pixel difference from the background-only reference `_bg.png` is 0 on all 33 stills (so no content, and the subtle grid is identical to the reference).
  - Badge: switched off, so the check is inverted: no badge-coloured pixels in its rectangle on all 33 stills. (First render, badge on: present on all 33, OCR read "mockup" and "simulasi".)
  - Result badge present on dashboard, ringkasan and temuan stills and absent elsewhere.
  - Step panel content stays inside x 1060-1860, y 200-700 (measured bbox x 1060-1847, y 208-539).
  - Overlay font sizes in `src/` are all >= 36 px (step panel title 68, description 38, stepper and badges 36). Phone UI text is mockup content and is smaller.
  - Contrast pairs 5.14-15.07:1 (all >= 4.5).
- Not measured: flashing frequency (ripple cycles are ~1.6 s, two per scene; no other fast changes), caption overlap with the phone beyond geometry (stepper ends at x 384, panel starts at x 1060; the phone ring starts at x 394).
- The OCR scan of the rendered MP4 (section 4) was run on the first render; the second differs only by the removed badge.
- Crossfade: spring (damping 200), 10 frames, 24 px slide; text in: 12 frames, 16 px, no bounce.

## 9. Files written

| File | Size |
|---|---|
| out/ergoai-usage.mp4 (second render, badge off) | 10,361,811 B |
| out/ergoai-usage.srt (en, 11 cues; `npm run srt -- id` for Indonesian) | 1,243 B |
| out/stills/ (33 stills + `_bg.png`, `verify.json`) | 11 MB total |
| report.md, captions_check.md, focus_check.md | this folder |
| src/config.ts, src/captions.ts, src/Root.tsx, src/Walkthrough.tsx, src/fonts.ts | |
| src/components/{PhoneFrame, StepPanel, Stepper, Badge, TapRipple, FocusBox, ScreenSwap, RecordingClip, Background, Cards}.tsx | |
| scripts/{scan-assets, export-srt, render-stills, dump-config}.ts, scripts/{verify_stills, check_focus}.py | |
| public/screens, public/recordings (copies), README.txt (copy of MOCKUP-README.txt) | |

Commands: `npm run render` (scan + render + SRT), `npm run stills`, `python3 scripts/verify_stills.py`, `--props='{"lang":"id"}'` for Indonesian. The Python checks need numpy, Pillow and (optional) rapidocr_onnxruntime.
