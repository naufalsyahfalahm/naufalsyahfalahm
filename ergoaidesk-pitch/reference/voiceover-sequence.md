# Urutan audio voiceover (gabungan take)

Sumber: `reference/AI_No_Cut_Audio.mp3` (931 s). Waktu mentah = posisi di file sumber; waktu video = posisi di `public/voiceover.mp3` / video (180,0 s).
Jeda di dalam kalimat yang lebih panjang dari 0,4 s dipendekkan, jadi durasi di video bisa sedikit lebih pendek daripada rentang mentah.
Kolom *Take*: `rNNN` = take yang mulai di detik NNN file mentah. **Diganti** = berbeda dari voiceover pertama.

| # | Scene | Kalimat | Take | Rentang di file mentah | Durasi mentah | Rentang di video | Durasi video | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 Hook | How do we know whether our working environment is truly e... | r286 | 4:46.50 - 4:49.80 | 3.3 s | 0:00.25 - 0:03.55 | 3.3 s | **Diganti** |
| 2 | 1 Hook | Office workers spend hours in front of computers, often m... | r337 | 5:41.85 - 5:50.95 | 9.1 s | 0:04.05 - 0:12.99 | 8.9 s | tetap |
| 3 | 1 Hook | Yet, ergonomic risks are not always visible at first glance. | r337 | 5:51.55 - 5:55.55 | 4.0 s | 0:13.49 - 0:17.35 | 3.9 s | tetap |
| 4 | 2 Problem | Poor working posture, prolonged static activities, and su... | r358 | 5:58.50 - 6:06.60 | 8.1 s | 0:20.25 - 0:28.29 | 8.0 s | tetap |
| 5 | 2 Problem | At the same time, psychological factors, including percei... | r606 | 10:14.00 - 10:21.45 | 7.5 s | 0:28.79 - 0:36.10 | 7.3 s | **Diganti** |
| 6 | 2 Problem | These interconnected dimensions highlight the need for a... | r358 | 6:17.05 - 6:23.95 | 6.9 s | 0:36.60 - 0:43.53 | 6.9 s | tetap |
| 7 | 3 Gap | Conventional ergonomic assessments often evaluate physica... | r640 | 10:40.30 - 10:46.80 | 6.5 s | 0:45.25 - 0:51.69 | 6.4 s | **Diganti** |
| 8 | 3 Gap | Physical assessments may rely on manual observation, whil... | r393 | 6:40.40 - 6:48.15 | 7.8 s | 0:52.19 - 0:59.90 | 7.7 s | **Diganti** |
| 9 | 3 Gap | When these assessments are not integrated, the interactio... | r640 | 10:54.65 - 11:02.05 | 7.4 s | 1:00.40 - 1:07.79 | 7.4 s | **Diganti** |
| 10 | 4 Solution | We developed ERGO-AI DESK, an AI-assisted multidomain erg... | r769 | 12:49.40 - 12:55.70 | 6.3 s | 1:09.70 - 1:16.10 | 6.4 s | tetap |
| 11 | 4 Solution | It combines YOLOv11-based computer vision to assess body... | r769 | 12:56.15 - 13:10.30 | 14.1 s | 1:16.60 - 1:30.73 | 14.1 s | tetap |
| 12 | 4 Solution | By integrating both assessments, the system generates erg... | r769 | 13:11.40 - 13:19.65 | 8.2 s | 1:31.33 - 1:39.64 | 8.3 s | tetap |
| 13 | 5 Demo | Users capture their working posture using a camera, while... | r810 | 13:30.55 - 13:38.40 | 7.9 s | 1:48.65 - 1:56.60 | 7.9 s | tetap |
| 14 | 5 Demo | They then complete a brief questionnaire on workstation c... | r810 | 13:38.85 - 13:44.50 | 5.6 s | 1:57.15 - 2:02.86 | 5.7 s | tetap |
| 15 | 5 Demo | Both results are integrated into a dashboard displaying e... | r810 | 13:45.00 - 13:52.30 | 7.3 s | 2:03.41 - 2:10.74 | 7.3 s | tetap |
| 16 | 6 Results | ERGO-AI DESK aims to provide accessible and comprehensive... | r858 | 14:18.65 - 14:30.95 | 12.3 s | 2:21.40 - 2:33.74 | 12.3 s | tetap |
| 17 | 7 Closing | ERGO-AI DESK integrates AI-based posture analysis and psy... | r908 | 15:08.35 - 15:16.20 | 7.9 s | 2:41.50 - 2:49.41 | 7.9 s | tetap |
| 18 | 7 Closing | Smarter assessment, healthier workplaces. Thank you. | r908 | 15:21.30 - 15:24.95 | 3.7 s | 2:49.91 - 2:53.52 | 3.6 s | tetap |

Label take `rNNN` = detik awal (di file mentah) dari pengambilan scene tersebut. Contoh: `r640` adalah pengambilan scene 3 yang mulai di sekitar 10:40 pada file mentah.
Satu scene punya beberapa pengambilan di file mentah; kalimat dalam satu scene bisa diambil dari pengambilan yang berbeda (kolom *Take* per kalimat).
Rincian skor tiap kandidat take ada di `reference/voiceover-selection.json`.
