import type { SegmentId } from "./config";

/**
 * One short caption per segment. Every caption is checked against visible UI text
 * in captions_check.md. Indonesian words in quotes are the exact UI labels.
 */
export type Caption = {
  /** Step number(s) of the 7 phases; null on title cards. */
  step: number | string | null;
  title_en: string;
  title_id: string;
  line_en: string;
  line_id: string;
};

export const captions: Record<SegmentId, Caption> = {
  intro: {
    step: null,
    title_en: "Ergo AI Desk",
    title_id: "Ergo AI Desk",
    line_en: "How the assessment works",
    line_id: "Cara kerja asesmen",
  },
  beranda: {
    step: 1,
    title_en: "Start an assessment",
    title_id: "Mulai asesmen",
    line_en: 'Tap "Mulai Asesmen" to begin.',
    line_id: 'Ketuk "Mulai Asesmen" untuk memulai.',
  },
  kuesioner: {
    step: 2,
    title_en: "Answer the questionnaire",
    title_id: "Jawab kuesioner",
    line_en: 'Fill sections A to D, then continue with "Next: unggah foto".',
    line_id: 'Isi bagian A sampai D, lalu lanjut dengan "Next: unggah foto".',
  },
  lateral: {
    step: 3,
    title_en: "Capture the lateral view",
    title_id: "Ambil foto lateral",
    line_en: 'Keypoint guidance shows "7 dari 7 keypoint hijau"; then take the photo.',
    line_id: 'Panduan keypoint menunjukkan "7 dari 7 keypoint hijau"; lalu ambil foto.',
  },
  superior: {
    step: 4,
    title_en: "Capture the superior view",
    title_id: "Ambil foto superior",
    line_en: 'Keypoint guidance shows "6 dari 6 keypoint hijau"; then take the photo.',
    line_id: 'Panduan keypoint menunjukkan "6 dari 6 keypoint hijau"; lalu ambil foto.',
  },
  pose: {
    step: "3–4",
    title_en: "Follow the keypoint guidance",
    title_id: "Ikuti panduan keypoint",
    line_en: "Photo capture stays locked until all keypoints are green.",
    line_id: "Pengambilan foto terkunci sampai semua keypoint hijau.",
  },
  tambahan: {
    step: 5,
    title_en: "Add follow-up answers",
    title_id: "Tambahkan jawaban lanjutan",
    line_en: 'Answer each question "Ya" or "Tidak", then tap "Analisis dan lihat hasil".',
    line_id: 'Jawab tiap pertanyaan "Ya" atau "Tidak", lalu ketuk "Analisis dan lihat hasil".',
  },
  dashboard: {
    step: 6,
    title_en: "Scroll through the results",
    title_id: "Telusuri hasil",
    line_en: "Each line links two body points; the legend gives its status.",
    line_id: "Setiap garis menghubungkan dua titik tubuh; legenda menunjukkan statusnya.",
  },
  ringkasan: {
    step: 6,
    title_en: "Review the summary",
    title_id: "Tinjau ringkasan",
    line_en: "Keypoint connections are counted as sesuai, belum sesuai or tidak dapat dianalisis.",
    line_id: "Hubungan keypoint dihitung sebagai sesuai, belum sesuai, atau tidak dapat dianalisis.",
  },
  temuan: {
    step: 7,
    title_en: "Read the findings",
    title_id: "Baca temuan",
    line_en: "Each finding shows its source photo, keypoint number and status.",
    line_id: "Setiap temuan menampilkan foto sumber, nomor keypoint, dan status.",
  },
  outro: {
    step: null,
    title_en: "Interface mockup with simulated data",
    title_id: "Mockup antarmuka dengan data simulasi",
    line_en: "Phases shown",
    line_id: "Tahap yang ditampilkan",
  },
};
