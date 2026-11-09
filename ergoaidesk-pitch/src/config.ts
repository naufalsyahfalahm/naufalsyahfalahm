/**
 * ERGO-AI DESK pitch video: single source of truth.
 * Everything editable (timings, text, colours, paths, team, toggles) lives here.
 * This file must stay free of Remotion/React imports (it is also read by scripts/*.ts).
 *
 * Frame numbers are 30 fps. Scene ranges are [from, to) and must tile 0..5400 exactly.
 * Timings follow reference/Skenario_Lomba_OUM.pdf (0:00 hook ... 2:40 closing).
 */

export const COMPOSITION_ID = "ErgoAIDeskPitch";
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 5400; // 180.0 s

export const TITLE =
  "ERGO AI DESK: Multidomain Ergonomic Risk Assessment System Integrating Computer Vision Pose Estimation and Psychosocial Self-Report Instruments";
export const CHALLENGE = "International 3-Minute OSH Innovation Challenge 2026";

/** Layout rules (px). Text never goes below MIN_FONT or inside SAFE. */
export const SAFE = 96;
export const MIN_FONT = 44;
export const MAX_UPSCALE = 1.5; // app screens: never upscale beyond this

// ---------------------------------------------------------------- colours
export const COLORS = {
  navy: "#0E2233", // background
  navy2: "#16344B", // card / panel tint of the navy (derived)
  teal: "#0B7A7C", // physical / posture track
  lilac: "#A58BFF", // psychological / psychosocial track
  white: "#FFFFFF",
  grey: "#D5DFE8", // soft grey
  // Risk levels ONLY (never decorative):
  red: "#C8372D",
  amber: "#F0A62B",
  green: "#23794A",
} as const;

/** Text-on-fill pairs used in the video. scripts/check-spec.ts asserts contrast >= 4.5:1. */
export const CONTRAST_PAIRS: ReadonlyArray<{ label: string; fg: string; bg: string }> = [
  { label: "white on navy", fg: COLORS.white, bg: COLORS.navy },
  { label: "grey on navy", fg: COLORS.grey, bg: COLORS.navy },
  { label: "lilac on navy", fg: COLORS.lilac, bg: COLORS.navy },
  { label: "white on navy2", fg: COLORS.white, bg: COLORS.navy2 },
  { label: "grey on navy2", fg: COLORS.grey, bg: COLORS.navy2 },
  { label: "white on teal", fg: COLORS.white, bg: COLORS.teal },
  { label: "navy on lilac", fg: COLORS.navy, bg: COLORS.lilac },
  { label: "navy on white", fg: COLORS.navy, bg: COLORS.white },
  { label: "navy on grey", fg: COLORS.navy, bg: COLORS.grey },
  { label: "white on red", fg: COLORS.white, bg: COLORS.red },
  { label: "navy on amber", fg: COLORS.navy, bg: COLORS.amber },
  { label: "white on green", fg: COLORS.white, bg: COLORS.green },
];

// ---------------------------------------------------------------- scenes
export type Range = { from: number; to: number };
export const SCENES = {
  hook: { from: 0, to: 600 },
  problem: { from: 600, to: 1350 },
  gap: { from: 1350, to: 1800 },
  solution: { from: 1800, to: 3000 },
  demo: { from: 3000, to: 4200 },
  results: { from: 4200, to: 4800 },
  closing: { from: 4800, to: 5400 },
} as const satisfies Record<string, Range>;
export type SceneKey = keyof typeof SCENES;
export const SCENE_ORDER: SceneKey[] = [
  "hook",
  "problem",
  "gap",
  "solution",
  "demo",
  "results",
  "closing",
];

/** Demo scene sub-ranges. */
export const DEMO_PARTS = {
  photos: { from: 3000, to: 3300 }, // "photos" mode only
  pose: { from: 3300, to: 3750 }, // "photos" mode
  poseVideoMode: { from: 3000, to: 3750 }, // "video" mode
  questionnaire: { from: 3750, to: 3975 },
  dashboard: { from: 3975, to: 4200 },
} as const satisfies Record<string, Range>;

/** "photos": 3000-3300 shows the app upload screen first. "video": pose recording runs 3000-3750. */
export const demoMode: "photos" | "video" = "photos";

/** Boundary effects. `at` is the first frame of the incoming scene. Cuts have no overlay. */
export const TRANSITIONS: ReadonlyArray<{
  at: number;
  type: "cut" | "wipe" | "dissolve";
  frames: number;
}> = [
  { at: 600, type: "wipe", frames: 16 },
  { at: 1350, type: "dissolve", frames: 14 },
  { at: 1800, type: "wipe", frames: 16 },
  { at: 3000, type: "wipe", frames: 16 },
  { at: 4200, type: "dissolve", frames: 14 },
  { at: 4800, type: "wipe", frames: 16 },
];

// ---------------------------------------------------------------- files (relative to public/)
export const FILES = {
  hookFootage: "footage/hook.mp4",
  presenterFootage: "footage/presenter.mp4",
  screenUpload: "screens/app-upload-screen.png",
  screenHeader: "screens/app-home-header-crop.png",
  logo: "brand/logo.png", // optional; a simple vector mark is drawn when absent
  validationCsv: "data/validation.csv",
  voiceover: "voiceover.mp3",
  music: "music.mp3",
} as const;

/**
 * Demo recordings. start/end are source seconds, `rate` is playback speed,
 * and the last frame is held when the clip is shorter than its slot.
 * Trims avoid frames that show bracketed placeholder text inside the mockups
 * (checked by OCR at 5 fps; see README "Recording trims").
 */
export type RecordingSpec = {
  file: string;
  startSec: number;
  endSec: number;
  rate: number;
  /** Playback rate when the clip fills the longer slot of demoMode "video" (optional). */
  rateVideoMode?: number;
  placeholder: string;
};
export const RECORDINGS: Record<"pose" | "questionnaire" | "dashboard", RecordingSpec> = {
  pose: {
    file: "recordings/demo-pose.mp4",
    startSec: 0,
    endSec: 7.0, // from 7.2 s the mockup shows "[durasi tahan sesuai protokol]"
    rate: 0.5,
    rateVideoMode: 0.35,
    placeholder: "[REKAMAN: ganti demo-pose.mp4]",
  },
  questionnaire: {
    file: "recordings/demo-questionnaire.mp4",
    startSec: 4.2, // 1.2-4.0 s shows "[Teks final mengikuti persetujuan etik]"
    endSec: 11.7, // from 12.0 s "[usulan, perlu keputusan]"
    rate: 1,
    placeholder: "[REKAMAN: ganti demo-questionnaire.mp4]",
  },
  dashboard: {
    file: "recordings/demo-dashboard.mp4",
    startSec: 2.8, // 0-2.6 s "[ ]" note; from 6.0 s "[Uraian AI: ...]" findings
    endSec: 5.8,
    rate: 0.5,
    placeholder: "[REKAMAN: ganti demo-dashboard.mp4]",
  },
};

/**
 * The supplied recordings are 780x1688 canvases, but the app UI only fills the top-left 390x844
 * (captured at 1x on a 2x canvas; the rest is flat grey). The video is cropped to this box.
 * If the recordings are re-exported without the grey canvas, set both to the file's full size.
 */
export const RECORDING_CONTENT_BOX = { w: 390, h: 844 };

/** The supplied recordings and screens are mockups with simulated data (see public/MOCKUP-README.txt). */
export const MOCKUP_LABEL = "Mockup antarmuka (data simulasi)";
/** Set false only when real app recordings replace the mockups. */
export const recordingsAreMockups = true;

// ---------------------------------------------------------------- text
export const TEXT = {
  illustrationTag: "Ilustrasi",
  hook: "Is our workstation truly ergonomic?",
  problemPhysical: "Physical risk",
  problemPsych: "Psychological strain",
  gapA: "Assessed separately",
  gapB: "The interaction is overlooked",
  gapLeft: "RULA sheet",
  gapRight: "Questionnaire",
  wordmark: "ERGO-AI DESK",
  wordmarkSub: "AI-assisted multidomain ergonomic assessment",
  appName: "ErgoAI K3", // name shown on the app-name screen
  flow: {
    camera: "Camera or Photos",
    pose: ["Pose Estimation", "(YOLOv11)"],
    physical: "Physical Score",
    questionnaire: "Questionnaire",
    psych: "Psychological Score",
    merge: ["Multidomain Ergonomic", "Risk Score"],
    recs: ["Targeted", "Recommendations"],
  },
  demo: {
    photoSide: "Side view: back and neck posture",
    photoTop: "Top view: shoulder and head symmetry",
    poseTitle: "Posture capture",
    poseSub: "YOLOv11 body keypoints",
    questionnaireTitle: "Brief questionnaire",
    questionnaireSub: "Workstation conditions, work habits, psychological strain",
    dashboardTitle: "Results dashboard",
    dashboardSub: "Ergonomic risk scores and targeted recommendations",
  },
  resultsFooter: "Phase 1 validation; manuscript under submission.",
  chartsLabel: "Computed from supplied data",
  tagline: "Smarter assessment, healthier workplaces.",
  placeholderPrefix: "",
} as const;

/** Shown only when non-empty, under the questionnaire step. */
export const questionnaireName = "";

/**
 * Optional benefits text. null = not shown. When set, a closing beat is added to the Solution scene
 * together with the mandatory footnote below.
 * e.g. ["Instant, objective check", "Specific fixes such as monitor height, distance, seating", "Recheck over time"]
 */
export const benefits: string[] | null = null;
export const BENEFITS_FOOTNOTE = "Designed functions; outcome data not yet available.";

/** Results cards: validation status only. No effectiveness, injury or productivity claims. */
export const SOURCE_LINE =
  "Pribadi AP, Kristina H, Ardiyanto, Sukma RM. ACSEL 2025 (manuscript under submission)";
export const claims: ReadonlyArray<{ value: string; text: string; source: string }> = [
  { value: "2,928", text: "Trained on 2,928 workstation images", source: SOURCE_LINE },
  {
    value: "> 0.90",
    text: "Correlation with reference assessment > 0.90",
    source: SOURCE_LINE,
  },
  { value: "> 0.90", text: "Intra-rater ICC > 0.90", source: SOURCE_LINE },
];
/** Words that must never appear in on-screen text (checked by scripts/check-spec.ts). */
export const FORBIDDEN_WORDS = ["significant", "injuries preventable", "productivity increase"];

// ---------------------------------------------------------------- closing
export const TEAM_NAMES: string[] = ["[TEAM NAMES]"];
export const AFFILIATION = "Universitas Gadjah Mada";
/** Presenter footage plays until this frame (scene-local); then the logo card. */
export const CLOSING_CARD_AT = 330;

// ---------------------------------------------------------------- privacy
/**
 * Any person visible in supplied footage must be unrecognisable or have documented consent.
 * Default: NOT documented, so the whole clip is blurred. Either set consentDocumented = true
 * (after consent forms are on file) or list blurRegions (percent of frame) to blur faces only.
 */
export const FOOTAGE_PRIVACY: Record<
  "hook" | "presenter",
  {
    consentDocumented: boolean;
    blurRegions: ReadonlyArray<{ x: number; y: number; w: number; h: number }>;
    blurPx: number;
  }
> = {
  hook: { consentDocumented: false, blurRegions: [], blurPx: 28 },
  presenter: { consentDocumented: false, blurRegions: [], blurPx: 28 },
};

// ---------------------------------------------------------------- captions
export const captionsEnabled = true;
/** Where the caption sits per scene: full width, or left column when a phone occupies the right. */
export const CAPTION_LAYOUT: Record<SceneKey, "full" | "left"> = {
  hook: "full",
  problem: "full",
  gap: "full",
  solution: "full",
  demo: "left",
  results: "full",
  closing: "full",
};
/** Frames before/after a scene's first/last cue (only for auto-timed scenes). */
export const CAPTION_LEAD = 12;
export const CAPTION_TAIL = 12;

/**
 * Narration from reference/Skenario_Lomba_OUM.pdf, split at clause boundaries (words unchanged).
 * Cues are auto-timed in proportion to character count unless `at` (absolute frame) is given
 * for every cue in that scene. This is an estimate: re-time with `at` once the voiceover exists
 * (scripts/check-audio.ts prints the speech segments to read the values from).
 */
export const NARRATION: Record<SceneKey, ReadonlyArray<{ text: string; at?: number }>> = {
  hook: [
    { text: "How do we know whether our working environment is truly ergonomic?" },
    {
      text: "Office workers spend hours in front of computers, often maintaining static postures",
    },
    { text: "that may lead to musculoskeletal discomfort and psychological strain." },
    { text: "Yet, ergonomic risks are not always visible at first glance." },
  ],
  problem: [
    {
      text: "Poor working posture, prolonged static activities, and suboptimal workstation design",
    },
    { text: "can contribute to physical ergonomic risks." },
    {
      text: "At the same time, psychological factors, including perceived stress, may further influence workers’ overall well-being.",
    },
    {
      text: "These interconnected dimensions highlight the need for a more comprehensive approach to ergonomic risk assessment.",
    },
  ],
  gap: [
    {
      text: "Conventional ergonomic assessments often evaluate physical posture and psychological conditions separately.",
    },
    {
      text: "Physical assessments may rely on manual observation, while psychological conditions are measured through self-report questionnaires.",
    },
    {
      text: "When these assessments are not integrated, the interaction between physical and psychological risks may be overlooked.",
    },
  ],
  solution: [
    {
      text: "We developed ERGO-AI DESK, an AI-assisted multidomain ergonomic assessment system for computer users.",
    },
    {
      text: "It combines YOLOv11-based computer vision to assess body posture and workstation characteristics",
    },
    {
      text: "with brief self-report questionnaires covering ergonomic and psychosocial factors,",
    },
    { text: "including lighting, break habits, and perceived psychological strain." },
    {
      text: "By integrating both assessments, the system generates ergonomic risk scores and targeted workplace improvement recommendations.",
    },
  ],
  demo: [
    { text: "Users capture their working posture using a camera,", at: 3012 },
    { text: "while YOLOv11 analyzes body keypoints and ergonomic indicators.", at: 3320 },
    { text: "They then complete a brief questionnaire", at: 3752 },
    {
      text: "on workstation conditions, work habits, and psychological strain.",
      at: 3860,
    },
    { text: "Both results are integrated into a dashboard", at: 3977 },
    {
      text: "displaying ergonomic risk scores and targeted improvement recommendations.",
      at: 4080,
    },
  ],
  results: [
    {
      text: "ERGO-AI DESK aims to provide accessible and comprehensive ergonomic screening,",
    },
    {
      text: "with ongoing development and expert validation to improve assessment accuracy and support healthier, safer workplaces.",
    },
  ],
  closing: [
    {
      text: "ERGO-AI DESK integrates AI-based posture analysis and psychosocial assessment for multidomain ergonomic risk evaluation.",
    },
    { text: "Smarter assessment, healthier workplaces. Thank you." },
  ],
};

// ---------------------------------------------------------------- audio
export const MUSIC_VOLUME = 0.12;
export const MUSIC_FADE_IN = 60; // frames
export const MUSIC_FADE_OUT = 90;
export const VOICEOVER_VOLUME = 1;

// ---------------------------------------------------------------- misc
/** Labelled placeholders for missing slots. Turn off only for the final render when nothing is missing. */
export const showPlaceholderLabels = true;
/** App screens are shown at this scale (clamped to MAX_UPSCALE). */
export const SCREEN_SCALE = 1.25;
