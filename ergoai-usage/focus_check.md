# focus_check.md

Focus boxes and tap ripples, normalised to the screen image (780x1688 PNG; x, y = top-left, w, h = size).
Pixel values are the same box on the 780x1688 image. The OCR column is rapidocr on the cropped box region (`none` = no `[` or `]` found inside the box).

| Scene | Screen | Box x, y, w, h (normalised) | Box px (x0,y0,x1,y1) | UI element covered | Dim overlay | Bracket text inside box (OCR) |
|---|---|---|---|---|---|---|
| beranda | mock-01-beranda.png | 0.0282, 0.5936, 0.9436, 0.0758 | 22,1002,758,1130 | Button "Mulai Asesmen" | yes | none |
| lateral | mock-03-kamera-lateral.png | 0.0308, 0.1078, 0.9385, 0.5308 | 24,182,756,1078 | Camera preview with keypoints and the pill "7 dari 7 keypoint hijau" | no (placeholder visible elsewhere on this screen; outline only) | none |
| superior | mock-04-kamera-superior.png | 0.0308, 0.1078, 0.9385, 0.5308 | 24,182,756,1078 | Camera preview with keypoints and the pill "6 dari 6 keypoint hijau" | no (placeholder visible elsewhere on this screen; outline only) | none |
| tambahan | mock-05-pertanyaan-tambahan.png | 0.0205, 0.1860, 0.9590, 0.3241 | 16,314,764,861 | Heading "Domain A. Kursi dan perangkat" and the card "PERTANYAAN 1" with Ya / Tidak | yes | none |
| ringkasan | mock-06-hasil-ringkasan.png | 0.0308, 0.3697, 0.9385, 0.3081 | 24,624,756,1144 | Dark card "ANALISIS KEYPOINT OTOMATIS" with the Sesuai / Belum sesuai / Tidak dapat dianalisis tiles | no (placeholder visible elsewhere on this screen; outline only) | none |
| temuan | mock-07-hasil-temuan.png | 0.0205, 0.1813, 0.9590, 0.1137 | 16,306,764,498 | Heading "Temuan per aspek" and the line "Sumber informasi dan nomor hubungan keypoint ..." | no (placeholder visible elsewhere on this screen; outline only) | none |

## Tap ripples (40 px, translucent)

| Scene | Point x, y (normalised) | Pixel (780x1688) | Covers |
|---|---|---|---|
| beranda | 0.5000, 0.6315 | 390,1066 | Centre of button "Mulai Asesmen" |
| tambahan | 0.5000, 0.9514 | 390,1606 | Centre of button "Analisis dan lihat hasil" |

## Scenes without a focus box

- `kuesioner`, `pose`, `dashboard`: recordings (no overlay; the clip contains its own interaction).
- `intro`, `outro`: title cards.

## Zoom (push-in 100% to 104%)

Applied to `beranda` and `tambahan` only (no visible placeholder). Skipped on `lateral`, `superior`, `ringkasan`, `temuan`, where a bracketed placeholder is visible in the static screen; see report.md.

Result: no focus box contains bracket text.
