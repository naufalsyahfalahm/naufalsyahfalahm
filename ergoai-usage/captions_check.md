# captions_check.md

Every on-screen caption (src/captions.ts) against the visible UI text of the screen or recording window it sits on.
"Supported" = the quoted UI text is visible during that segment. Indonesian words in quotes are exact UI labels.
Indonesian captions (`*_id`) carry the same claims; they were checked against the same UI text.

| Segment | Caption (en) | Supporting UI text (where visible) | Status |
|---|---|---|---|
| intro | "Ergo AI Desk" / "How the assessment works" | "Ergo AI Desk" (header and title, mock-01). "assessment" is the translation of "Asesmen" ("Mulai Asesmen", "Hasil asesmen"). The phrase "How the assessment works" is framing wording from the brief, not a UI claim. | Supported (title); framing line from the brief |
| beranda | Step 1 of 7 / "Start an assessment" / Tap "Mulai Asesmen" to begin. | Button "Mulai Asesmen" (mock-01). "Mulai" = start. | Supported |
| kuesioner | Step 2 of 7 / "Answer the questionnaire" / Fill sections A to D, then continue with "Next: unggah foto". | Header "Kuesioner", "Langkah 1 dari 4"; section cards "A Identitas responden", "B Pekerjaan dan pemakaian komputer", "C Keluhan", "D Penglihatan"; button "Next: unggah foto" (all in the clip window, source frames 130-357). The tap on the button itself is not in the played window (frame 358+ is the next screen, which contains a placeholder). | Supported |
| lateral | Step 3 of 7 / "Capture the lateral view" / Keypoint guidance shows "7 dari 7 keypoint hijau"; then take the photo. | Header "Ambil foto: Lateral", "Panduan keypoint real-time", pill "7 dari 7 keypoint hijau", "Semua keypoint hijau. Foto siap diambil", button "Ambil foto" (mock-03). Preview is labelled "Pratinjau simulasi". | Supported |
| superior | Step 4 of 7 / "Capture the superior view" / Keypoint guidance shows "6 dari 6 keypoint hijau"; then take the photo. | Header "Ambil foto: Superior", pill "6 dari 6 keypoint hijau", "Semua keypoint hijau. Foto siap diambil", button "Ambil foto" (mock-04). | Supported |
| pose | Steps 3-4 of 7 / "Follow the keypoint guidance" / Photo capture stays locked until all keypoints are green. | "Pengambilan foto dan analisis dikunci sampai semua keypoint hijau." (yellow note), buttons "Terkunci · 0/7 hijau", "Terkunci · 5/7 hijau", "Terkunci · luruskan ponsel" (clip window, source frames 0-215). The recording shows the lateral view only; "Steps 3-4" marks the camera phase, not a claim about the superior view. | Supported |
| tambahan | Step 5 of 7 / "Add follow-up answers" / Answer each question "Ya" or "Tidak", then tap "Analisis dan lihat hasil". | Header "Pertanyaan tambahan", "Langkah 3 dari 4", cards "PERTANYAAN 1-3" with buttons "Ya" / "Tidak", button "Analisis dan lihat hasil" (mock-05). "follow-up" translates "tambahan" (additional). | Supported |
| dashboard | Step 6 of 7 / "Scroll through the results" / Each line links two body points; the legend gives its status. | "Setiap garis menghubungkan dua titik tubuh. Sudut atau posisi relatif garis dihitung otomatis dan dibandingkan dengan kriteria."; legend "Sesuai", "Belum sesuai", "Tidak dapat dianalisis"; header "Hasil asesmen" (clip window, source frames 88-172, the section appears in the second half and in the held last frame). The clean window shows the summary card scrolling up first, then this section. | Supported |
| ringkasan | Step 6 of 7 / "Review the summary" / Keypoint connections are counted as sesuai, belum sesuai or tidak dapat dianalisis. | "Dari 13 hubungan antar-keypoint, 8 sesuai, 2 belum sesuai, dan 3 tidak dapat dianalisis." and tiles "Sesuai", "Belum sesuai", "Tidak dapat dianalisis"; tab "Ringkasan" (mock-06). No numbers are repeated in the caption. | Supported |
| temuan | Step 7 of 7 / "Read the findings" / Each finding shows its source photo, keypoint number and status. | Tab "Temuan", heading "Temuan per aspek", "Sumber informasi dan nomor hubungan keypoint ditampilkan pada setiap temuan. Status: sesuai, belum sesuai, atau tidak dapat dianalisis."; chips "Foto lateral", "Keypoint no. 6", "Tidak dapat dianalisis" (mock-07). | Supported |
| outro | "Interface mockup with simulated data" / "Phases shown" + the 7 phase names | "Pratinjau simulasi" (mock-03/04), "Contoh hasil · simulasi" (mock-06), "Foto dari kamera (demo)" (mock-06), README.txt ("SEMUA layar adalah MOCKUP dengan data simulasi"). The Indonesian caption ("Mockup antarmuka dengan data simulasi") is verbatim from the brief. "Phases shown" is framing. | Supported (statement); framing line |

## Fixed labels
| Text | Source | Status |
|---|---|---|
| Badge "Mockup antarmuka (data simulasi)" | README.txt and brief, verbatim, shown in both languages | Required label |
| Result badge "Hasil ilustratif, bukan keluaran model nyata" | Brief, verbatim, shown in both languages. UI support: "Contoh hasil · simulasi. Posisi keypoint dan status setiap hubungan adalah ilustrasi, bukan keluaran model." (mock-06) | Required label; supported |

## Stepper labels
| Stepper label (en / id) | UI text | Status |
|---|---|---|
| Home / Beranda | No on-screen text reads "Beranda" (mock-01 shows "Selamat Datang di Ergo AI Desk"). The name comes from the brief's phase list and the file name `mock-01-beranda`. | Label from the brief; not a UI label |
| Questionnaire / Kuesioner | Header "Kuesioner" | Supported |
| Camera: lateral / Kamera lateral | Header "Ambil foto: Lateral" | Supported (paraphrase) |
| Camera: superior / Kamera superior | Header "Ambil foto: Superior" | Supported (paraphrase) |
| Follow-up questions / Pertanyaan tambahan | Header "Pertanyaan tambahan" | Supported |
| Summary / Hasil ringkasan | Header "Hasil asesmen" and tab "Ringkasan" | Supported (combined) |
| Findings / Hasil temuan | Tab "Temuan" | Supported (paraphrase) |

## Captions that could not be supported
None of the 11 captions is unsupported. Items marked "framing" or "from the brief" (the intro line, the outro line "Phases shown", the label "Home/Beranda") describe the video, not the app.

## Things deliberately not captioned
- Domain D "Stres kerja": no caption mentions stress, and no stress instrument is shown or implied. The home screen (mock-01) does carry a "Stres Kerja" tile; it is visible, unedited, and uncaptioned. Questionnaire section "D" in the recording is "Penglihatan" (vision), not stress.
- No combined score and no probability estimate in any caption or graphic. The home screen (mock-01) states "Hasil berupa ringkasan deskriptif dan probabilitas risiko." and the results screens have a "Risiko" tab, which conflicts with README.txt ("Tidak ada skor gabungan", "Belum ada estimasi probabilitas pada mockup ini"). The screens are shown unedited and the captions do not repeat either phrase; see report.md.
- The counts 8 / 2 / 3 and 13 on mock-06 are not repeated in captions.
