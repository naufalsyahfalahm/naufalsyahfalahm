/**
 * Static checks for the pitch spec. Run: npm run check
 * Exits non-zero on any failure. Contrast, tiling, forbidden words, font-size/emoji/colour lint,
 * caption reading speed, statistics unit test, and a list of slots that will render as placeholders.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import * as C from "../src/config";
import { pearson } from "../src/lib/stats";
import { buildCues } from "../src/lib/captions";
import { ASSETS } from "../src/generated/assets";

let failures = 0;
const fail = (m: string) => {
  failures++;
  console.log(`FAIL  ${m}`);
};
const ok = (m: string) => console.log(`ok    ${m}`);
const warn = (m: string) => console.log(`WARN  ${m}`);

// ---- timing
let cur: number = 0;
for (const k of C.SCENE_ORDER) {
  if (C.SCENES[k].from !== cur) fail(`scene ${k} starts at ${C.SCENES[k].from}, expected ${cur}`);
  cur = C.SCENES[k].to;
}
cur === C.TOTAL_FRAMES && C.TOTAL_FRAMES === 5400 && C.TOTAL_FRAMES / C.FPS === 180
  ? ok(`scenes tile 0..${cur} (${cur / C.FPS}s @ ${C.FPS}fps)`)
  : fail(`scenes end at ${cur}, expected 5400 (180.0 s)`);

const parts = C.demoMode === "photos"
  ? [C.DEMO_PARTS.photos, C.DEMO_PARTS.pose, C.DEMO_PARTS.questionnaire, C.DEMO_PARTS.dashboard]
  : [C.DEMO_PARTS.poseVideoMode, C.DEMO_PARTS.questionnaire, C.DEMO_PARTS.dashboard];
let pc: number = C.SCENES.demo.from;
for (const p of parts) {
  if (p.from !== pc) fail(`demo part starts at ${p.from}, expected ${pc}`);
  pc = p.to;
}
pc === C.SCENES.demo.to ? ok(`demo parts (${C.demoMode}) tile ${C.SCENES.demo.from}..${pc}`) : fail(`demo parts end at ${pc}`);
for (const t of C.TRANSITIONS) {
  if (!C.SCENE_ORDER.some((k) => C.SCENES[k].from === t.at)) fail(`transition at ${t.at} is not a scene start`);
}

// ---- recordings: trims within source duration, and fill their slots
for (const [name, r] of Object.entries(C.RECORDINGS)) {
  const a = ASSETS[r.file];
  if (!a?.exists) continue;
  if (a.durationSec && r.endSec > a.durationSec + 0.01) fail(`${name}: endSec ${r.endSec} > file duration ${a.durationSec}`);
  const slot = name === "pose"
    ? (C.demoMode === "photos" ? C.DEMO_PARTS.pose : C.DEMO_PARTS.poseVideoMode)
    : C.DEMO_PARTS[name as "questionnaire" | "dashboard"];
  const slotFrames = slot.to - slot.from;
  const rate = name === "pose" && C.demoMode === "video" ? (r.rateVideoMode ?? r.rate) : r.rate;
  const playFrames = Math.floor(((r.endSec - r.startSec) * C.FPS) / rate);
  const hold = slotFrames - playFrames;
  hold < 0
    ? warn(`${name}: trimmed clip needs ${playFrames} frames but slot has ${slotFrames}; it is cut off by ${-hold} frames (raise rate)`)
    : ok(`${name}: ${playFrames} frames playing at ${rate}x, last frame held ${hold} frames (${(hold / C.FPS).toFixed(1)} s)`);
  if (a.width && a.height && (a.width < C.RECORDING_CONTENT_BOX.w || a.height < C.RECORDING_CONTENT_BOX.h)) {
    fail(`${name}: content box larger than file (${a.width}x${a.height})`);
  }
}

// ---- contrast >= 4.5:1
const lum = (hex: string) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
for (const p of C.CONTRAST_PAIRS) {
  const r = ratio(p.fg, p.bg);
  r >= 4.5 ? ok(`contrast ${p.label}: ${r.toFixed(2)}:1`) : fail(`contrast ${p.label}: ${r.toFixed(2)}:1 < 4.5`);
}
console.log(`note  teal on navy is ${ratio(C.COLORS.teal, C.COLORS.navy).toFixed(2)}:1 -> teal is used as a fill/graphic only, never as text colour`);

// ---- source lint
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? (f === "generated" ? [] : walk(p)) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
const files = walk("src");
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const hex = /#[0-9A-Fa-f]{6}\b/g;
const allowedHex = new Set<string>(Object.values(C.COLORS).map((h) => h.toLowerCase()));
const illFile = "src/components/Illus.tsx";
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const rel = relative(".", f);
  if (emoji.test(src)) fail(`${rel}: contains emoji`);
  for (const m of src.matchAll(/size=\{(\d+)\}|fontSize:\s*(\d+)/g)) {
    const n = Number(m[1] ?? m[2]);
    if (n < C.MIN_FONT) fail(`${rel}: font size ${n}px < ${C.MIN_FONT}px`);
  }
  if (/filter:[^,}\n]*(contrast|saturate|sharpen|brightness|hue-rotate)/i.test(src)) fail(`${rel}: image filter that could alter app screens`);
  if (rel !== "src/config.ts") {
    for (const h of src.match(hex) ?? []) {
      if (!allowedHex.has(h.toLowerCase()) && rel !== illFile && !rel.endsWith("PhoneFrame.tsx")) fail(`${rel}: off-palette colour ${h}`);
    }
  }
  if (/COLORS\.(amber|green)\b/.test(src) && rel !== "src/config.ts") fail(`${rel}: amber/green are for risk levels only and are not used in this video`);
  if (/COLORS\.red\b/.test(src) && !/Illus\.tsx$|config\.ts$/.test(rel)) fail(`${rel}: red is for risk levels only`);
  if (/Math\.random|from "@remotion\/(three|lottie)"|<video\b|<Video\b/.test(src)) fail(`${rel}: non-deterministic or non-spec animation/media`);
}
ok(`linted ${files.length} source files (emoji, font size, palette, risk colours, filters)`);

// ---- words that must not appear on screen
const onScreen = JSON.stringify([C.TEXT, C.claims, C.NARRATION, C.TEAM_NAMES, C.SOURCE_LINE, C.questionnaireName, C.benefits, C.MOCKUP_LABEL]).toLowerCase();
for (const w of C.FORBIDDEN_WORDS) if (onScreen.includes(w.toLowerCase())) fail(`forbidden phrase on screen: "${w}"`);
ok("no forbidden phrases in on-screen text");
if (C.benefits && !C.BENEFITS_FOOTNOTE) fail("benefits shown without footnote");
const claimTxt = C.claims.map((c) => c.text).join(" ");
if (/(reduc|prevent|productiv|injur|effective)/i.test(claimTxt)) fail("claim cards mention effectiveness/injury/productivity");
else ok("claim cards state validation status only");

// ---- caption reading speed (chars/s); >21 is hard to read
const cues = buildCues();
let worst = 0;
for (const c of cues) {
  const cps = c.text.length / ((c.to - c.from) / C.FPS);
  worst = Math.max(worst, cps);
  if (cps > 21) warn(`caption ${c.from}-${c.to} reads at ${cps.toFixed(1)} chars/s: "${c.text.slice(0, 40)}..."`);
  if (c.to <= c.from) fail(`caption cue ${c.from}-${c.to} has no duration`);
}
ok(`${cues.length} caption cues, fastest ${worst.toFixed(1)} chars/s (timed to the voiceover where at is set)`);

// ---- narration length vs scene length (150 wpm is a normal presentation pace)
for (const k of C.SCENE_ORDER) {
  const words = C.NARRATION[k].reduce((n, c) => n + c.text.split(/\s+/).length, 0);
  const need = (words / 150) * 60;
  const have = (C.SCENES[k].to - C.SCENES[k].from) / C.FPS;
  const wpm = (words / have) * 60;
  need > have
    ? warn(`${k}: ${words} words in ${have.toFixed(0)} s = ${wpm.toFixed(0)} wpm; at 150 wpm the narration needs ${need.toFixed(1)} s (overruns by ${(need - have).toFixed(1)} s). Trim the script or accept a faster read`)
    : ok(`${k}: ${words} words in ${have.toFixed(0)} s = ${wpm.toFixed(0)} wpm`);
}

// ---- statistics unit test: textbook example, x=1..5, y=2,4,5,4,5 -> r = 0.7746 (math fixture, not empirical data)
const t = pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
t && Math.abs(t.r - 0.7745967) < 1e-6 && t.n === 5 ? ok(`pearson r fixture = ${t.r.toFixed(4)}`) : fail("pearson fixture mismatch");
// Fisher CI for r=0.7746, n=5: z=1.0317, se=0.7071 -> [-0.30, 0.98] approx (wide, as expected for n=5)
t && t.lo < -0.2 && t.hi > 0.95 ? ok(`Fisher 95% CI fixture = ${t.lo.toFixed(2)} to ${t.hi.toFixed(2)}`) : fail("Fisher CI fixture mismatch");

// ---- slots that render as placeholders
const slots: Array<[string, string]> = [
  ["hook footage", C.FILES.hookFootage],
  ["app header crop (scene 4)", C.FILES.screenHeader],
  ["app upload screen (scene 5a)", C.FILES.screenUpload],
  ["demo-pose recording", C.RECORDINGS.pose.file],
  ["demo-questionnaire recording", C.RECORDINGS.questionnaire.file],
  ["demo-dashboard recording", C.RECORDINGS.dashboard.file],
  ["presenter footage", C.FILES.presenterFootage],
  ["voiceover", C.FILES.voiceover],
  ["music", C.FILES.music],
  ["validation.csv (charts)", C.FILES.validationCsv],
  ["logo (vector stand-in drawn)", C.FILES.logo],
];
console.log("\nSlots:");
for (const [label, p] of slots) console.log(`  ${ASSETS[p]?.exists ? "supplied   " : "MISSING    "} ${label}  (public/${p})`);
if (C.TEAM_NAMES.some((n) => n.startsWith("["))) console.log("  MISSING     team names (config.TEAM_NAMES)");
if (!existsSync("reference/Skenario_Lomba_OUM.pdf")) warn("reference/Skenario_Lomba_OUM.pdf not found");

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
