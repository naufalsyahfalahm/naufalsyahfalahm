/**
 * Everything editable for the Ergo AI Desk usage walkthrough.
 * All screens are MOCKUPS with simulated data (see README.txt, binding).
 */

export type Lang = "en" | "id";

export const fps = 30;
export const width = 1920;
export const height = 1080;

export const palette = {
  navy: "#0E2233",
  teal: "#0B7A7C",
  amber: "#F0A62B",
  red: "#C8372D",
  green: "#23794A",
  ink: "#F4F7F9",
} as const;

/** Families are loaded in src/fonts.ts with @remotion/google-fonts. */
export const fonts = {
  heading: '"Space Grotesk", sans-serif',
  body: '"Inter", sans-serif',
} as const;

/** Language of all on-screen text and of the SRT. Override per render with --props='{"lang":"id"}'. */
export const lang: Lang = "en";

/** Kept empty on every frame so a presenter picture-in-picture can be added bottom-right later. */
export const safeZone = { x: 1426, y: 771 } as const;

/** Verbatim labels required by README.txt; shown in both languages. */
export const badgeText = "Mockup antarmuka (data simulasi)";
export const resultBadgeText = "Hasil ilustratif, bukan keluaran model nyata";

export const layout = {
  phoneCenterX: 620,
  phoneHeight: 960,
  /** 390:844 */
  phoneWidth: (960 * 390) / 844,
  safeMargin: 48,
  panel: { x: 1060, y: 200, w: 800, h: 500 },
  crossfade: 10,
  slidePx: 24,
  textIn: 12,
  textSlidePx: 16,
  pushIn: 1.04,
} as const;

/**
 * Recordings. Each file is a 780x1688 canvas, but the UI occupies only the top-left 390x844
 * (the rest is flat grey), so the phone shows that content box.
 * `clean` = inclusive source-frame range without bracketed placeholder text (found by OCR on every
 * 3rd frame, boundaries refined per frame, then checked by eye; see report.md).
 * `full` = whole clip. `avoidPlaceholders` selects which one plays.
 */
export const avoidPlaceholders = true;

export type RecordingKey = "questionnaire" | "pose" | "dashboard";

export const recordings: Record<
  RecordingKey,
  {
    file: string;
    srcW: number;
    srcH: number;
    contentW: number;
    contentH: number;
    fps: number;
    frames: number;
    clean: { from: number; to: number };
  }
> = {
  questionnaire: {
    file: "recordings/demo-questionnaire.mp4",
    srcW: 780,
    srcH: 1688,
    contentW: 390,
    contentH: 844,
    fps: 30,
    frames: 378,
    // 0-38 (Beranda) and 39-127 (Persiapan, "[Teks final mengikuti persetujuan etik]") are cut;
    // 359+ (Unggah foto postur, "[usulan, perlu keputusan]") is cut.
    clean: { from: 130, to: 357 },
  },
  pose: {
    file: "recordings/demo-pose.mp4",
    srcW: 780,
    srcH: 1688,
    contentW: 390,
    contentH: 844,
    fps: 30,
    frames: 276,
    // 217+ shows "[durasi tahan sesuai protokol]".
    clean: { from: 0, to: 215 },
  },
  dashboard: {
    file: "recordings/demo-dashboard.mp4",
    srcW: 780,
    srcH: 1688,
    contentW: 390,
    contentH: 844,
    fps: 30,
    frames: 353,
    // 0-87 show the "[ ]" note (a sliver of it is still visible at frame 84); 174+ shows "[ ]" and then "[Uraian AI: ...]".
    clean: { from: 88, to: 172 },
  },
};

/** Convert pixel coordinates on a 780x1688 screen image to normalised 0-1 (x0, y0, x1, y1, pad px). */
export const fromPx = (x0: number, y0: number, x1: number, y1: number, pad = 0) => ({
  x: (x0 - pad) / 780,
  y: (y0 - pad) / 1688,
  w: (x1 - x0 + 2 * pad) / 780,
  h: (y1 - y0 + 2 * pad) / 1688,
});

export type Norm = { x: number; y: number; w: number; h: number };

export type SegmentId =
  | "intro"
  | "beranda"
  | "kuesioner"
  | "lateral"
  | "superior"
  | "pose"
  | "tambahan"
  | "dashboard"
  | "ringkasan"
  | "temuan"
  | "outro";

export type Segment = {
  id: SegmentId;
  frames: number;
  kind: "card" | "still" | "clip";
  showsApp: boolean;
  /** Result scene: adds the "Hasil ilustratif..." badge. */
  result: boolean;
  /** Stepper indices (0-6) shown as active. Steps before the first active one are completed. */
  activePhases: number[];
  screen?: string;
  recording?: RecordingKey;
  /** Slow push-in 100% -> 104%. Skipped where a bracketed placeholder is visible. */
  pushIn: boolean;
  /** Bracketed placeholder text visible in this scene (listed in report.md). */
  placeholders: string[];
  focus?: {
    box: Norm;
    delay: number;
    /** frames visible before it fades out; omit to keep until the end */
    hold?: number;
    /** dim overlay outside the box; off where a placeholder is visible so it is never dimmed or singled out */
    dim: boolean;
    covers: string;
  };
  ripple?: { x: number; y: number; delay: number; covers: string };
};

export const segments: Segment[] = [
  { id: "intro", frames: 90, kind: "card", showsApp: false, result: false, activePhases: [], pushIn: false, placeholders: [] },
  {
    id: "beranda",
    frames: 210,
    kind: "still",
    showsApp: true,
    result: false,
    activePhases: [0],
    screen: "screens/mock-01-beranda.png",
    pushIn: true,
    placeholders: [],
    focus: {
      box: fromPx(32, 1012, 748, 1120, 10),
      delay: 30,
      dim: true,
      covers: 'Button "Mulai Asesmen"',
    },
    ripple: { x: 0.5, y: 1066 / 1688, delay: 75, covers: 'Centre of button "Mulai Asesmen"' },
  },
  {
    id: "kuesioner",
    frames: 420,
    kind: "clip",
    showsApp: true,
    result: false,
    activePhases: [1],
    recording: "questionnaire",
    pushIn: false,
    placeholders: [],
  },
  {
    id: "lateral",
    frames: 180,
    kind: "still",
    showsApp: true,
    result: false,
    activePhases: [2],
    screen: "screens/mock-03-kamera-lateral.png",
    pushIn: false,
    placeholders: ['"[durasi tahan sesuai protokol]" in the info card under the preview (y 0.694-0.711)'],
    focus: {
      box: fromPx(32, 190, 748, 1070, 8),
      delay: 30,
      dim: false,
      covers: 'Camera preview with keypoints and the pill "7 dari 7 keypoint hijau"',
    },
  },
  {
    id: "superior",
    frames: 180,
    kind: "still",
    showsApp: true,
    result: false,
    activePhases: [3],
    screen: "screens/mock-04-kamera-superior.png",
    pushIn: false,
    placeholders: ['"[durasi tahan sesuai protokol]" in the info card under the preview (y 0.695-0.712)'],
    focus: {
      box: fromPx(32, 190, 748, 1070, 8),
      delay: 30,
      dim: false,
      covers: 'Camera preview with keypoints and the pill "6 dari 6 keypoint hijau"',
    },
  },
  {
    id: "pose",
    frames: 300,
    kind: "clip",
    showsApp: true,
    result: false,
    activePhases: [2, 3],
    recording: "pose",
    pushIn: false,
    placeholders: [],
  },
  {
    id: "tambahan",
    frames: 210,
    kind: "still",
    showsApp: true,
    result: false,
    activePhases: [4],
    screen: "screens/mock-05-pertanyaan-tambahan.png",
    pushIn: true,
    placeholders: [],
    focus: {
      box: fromPx(32, 330, 748, 845, 16),
      delay: 30,
      hold: 110,
      dim: true,
      covers: 'Heading "Domain A. Kursi dan perangkat" and the card "PERTANYAAN 1" with Ya / Tidak',
    },
    ripple: { x: 0.5, y: 1606 / 1688, delay: 150, covers: 'Centre of button "Analisis dan lihat hasil"' },
  },
  {
    id: "dashboard",
    frames: 390,
    kind: "clip",
    showsApp: true,
    result: true,
    activePhases: [5],
    recording: "dashboard",
    pushIn: false,
    placeholders: [],
  },
  {
    id: "ringkasan",
    frames: 180,
    kind: "still",
    showsApp: true,
    result: true,
    activePhases: [5],
    screen: "screens/mock-06-hasil-ringkasan.png",
    pushIn: false,
    placeholders: ['"[ ]" inside the orange note "Contoh hasil · simulasi" (y 0.324-0.342)'],
    focus: {
      box: fromPx(32, 632, 748, 1136, 8),
      delay: 30,
      dim: false,
      covers: 'Dark card "ANALISIS KEYPOINT OTOMATIS" with the Sesuai / Belum sesuai / Tidak dapat dianalisis tiles',
    },
  },
  {
    id: "temuan",
    frames: 240,
    kind: "still",
    showsApp: true,
    result: true,
    activePhases: [6],
    screen: "screens/mock-07-hasil-temuan.png",
    pushIn: false,
    placeholders: [
      '"[Uraian AI: kontak telapak kaki dengan lantai atau penopang]" (y 0.444-0.486)',
      '"[Uraian AI: jarak punggung bawah ke sandaran]" (y 0.667-0.708)',
      '"[Uraian AI: selisih tinggi siku dan ...]" (y 0.889-0.908, cut by the bottom bar)',
    ],
    focus: {
      box: fromPx(32, 322, 748, 482, 16),
      delay: 30,
      dim: false,
      covers: 'Heading "Temuan per aspek" and the line "Sumber informasi dan nomor hubungan keypoint ..."',
    },
  },
  { id: "outro", frames: 120, kind: "card", showsApp: false, result: false, activePhases: [], pushIn: false, placeholders: [] },
];

export const TOTAL_FRAMES = segments.reduce((a, s) => a + s.frames, 0);

export const segmentStarts: number[] = segments.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + segments[i - 1].frames);
  return acc;
}, []);

/** Stepper phases (labels from the brief; en = translation of the Indonesian UI wording). */
export const phases: { en: string; id: string }[] = [
  { en: "Home", id: "Beranda" },
  { en: "Questionnaire", id: "Kuesioner" },
  { en: "Camera: lateral", id: "Kamera lateral" },
  { en: "Camera: superior", id: "Kamera superior" },
  { en: "Follow-up questions", id: "Pertanyaan tambahan" },
  { en: "Summary", id: "Hasil ringkasan" },
  { en: "Findings", id: "Hasil temuan" },
];

export const ui: Record<Lang, { step: string; steps: string; of: string }> = {
  en: { step: "Step", steps: "Steps", of: "of" },
  id: { step: "Langkah", steps: "Langkah", of: "dari" },
};
