# Urutan audio voiceover (gabungan take)

Sumber: `reference/AI_No_Cut_Audio.mp3` (931 s). Waktu mentah = posisi di file sumber; waktu video = posisi di `public/voiceover.mp3` / video (180,0 s).
Jeda di dalam klip yang lebih panjang dari 0,4 s dipendekkan, jadi durasi di video bisa sedikit lebih pendek daripada rentang mentah.
Scene 4 dan 5 dipotong di tingkat frasa: satu kalimat bisa tersusun dari dua take yang disambung di jeda napas. **Diganti** = berbeda dari voiceover pertama.

| # | Scene | Klip | Take | Rentang di file mentah | Durasi mentah | Rentang di video | Durasi video | Status |
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
| 10 | 4 Solution | We developed ERGO-AI DESK, an AI-assisted multidomain erg... | r769 | 12:49.40 - 12:55.70 | 6.3 s | 1:09.10 - 1:15.50 | 6.4 s | tetap |
| 11 | 4 Solution | It combines YOLOv11-based computer vision to assess body... | r769 | 12:56.15 - 13:01.34 | 5.2 s | 1:15.95 - 1:21.15 | 5.2 s | tetap |
| 12 | 4 Solution | with brief self-report questionnaires covering ergonomic... | r719 | 12:12.33 - 12:22.30 | 10.0 s | 1:21.45 - 1:31.42 | 10.0 s | **Diganti** |
| 13 | 4 Solution | By integrating both assessments, the system generates erg... | r719 | 12:23.00 - 12:30.95 | 8.0 s | 1:31.92 - 1:39.77 | 7.8 s | **Diganti** |
| 14 | 5 Demo | Users capture their working posture using a camera, | r173 | 2:53.00 - 2:56.20 | 3.2 s | 1:48.65 - 1:51.90 | 3.2 s | **Diganti** |
| 15 | 5 Demo | while YOLOv11 analyzes body keypoints and ergonomic indic... | r810 | 13:33.85 - 13:38.40 | 4.5 s | 1:52.25 - 1:56.90 | 4.7 s | tetap |
| 16 | 5 Demo | They then complete a brief questionnaire on workstation c... | r173 | 3:03.70 - 3:10.25 | 6.6 s | 1:57.45 - 2:03.98 | 6.5 s | **Diganti** |
| 17 | 5 Demo | Both results are integrated into a dashboard displaying e... | r810 | 13:45.00 - 13:52.30 | 7.3 s | 2:04.53 - 2:11.86 | 7.3 s | tetap |
| 18 | 6 Results | ERGO-AI DESK aims to provide accessible and comprehensive... | r858 | 14:18.65 - 14:30.95 | 12.3 s | 2:21.40 - 2:33.74 | 12.3 s | tetap |
| 19 | 7 Closing | ERGO-AI DESK integrates AI-based posture analysis and psy... | r908 | 15:08.35 - 15:16.20 | 7.9 s | 2:41.50 - 2:49.41 | 7.9 s | tetap |
| 20 | 7 Closing | Smarter assessment, healthier workplaces. Thank you. | r908 | 15:21.30 - 15:24.95 | 3.7 s | 2:49.91 - 2:53.52 | 3.6 s | tetap |

Label take `rNNN` = detik awal (di file mentah) dari pengambilan scene tersebut. Contoh: `r719` adalah pengambilan scene 4 yang mulai di sekitar 11:59 pada file mentah.
Rincian skor kandidat take ada di `reference/voiceover-selection.json`.
