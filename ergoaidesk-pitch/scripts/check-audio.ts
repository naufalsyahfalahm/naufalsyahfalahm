/**
 * Voiceover check. Run: npm run check:audio            (analyses public/voiceover.mp3 as laid out by
 *                                                       config.VOICEOVER_SEGMENTS)
 *      or:      npm run check:audio -- --timeline f.wav (analyses an audio file that is already on the
 *                                                       video timeline, e.g. audio extracted from the render)
 * Prints speech segments, each scene's start/end against the audio, warnings when narration overruns
 * its scene or the video, and whether each caption cue starts where speech is actually playing.
 * No voiceover file => prints a note and exits 0.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FILES, FPS, NARRATION, SCENES, SCENE_ORDER, TOTAL_FRAMES, VOICEOVER_SEGMENTS } from "../src/config";

const tl = process.argv.indexOf("--timeline");
const file = tl > 0 ? process.argv[tl + 1] : join("public", FILES.voiceover);
if (!existsSync(file)) {
  console.log(`no ${file}: nothing to check (video renders without voiceover)`);
  process.exit(0);
}
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout);

// 50 ms RMS envelope; speech = windows above -33 dB (the narrator's noise floor is about -44 dB),
// bridging pauses shorter than 0.25 s.
const pcm = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 29 }).stdout;
const x = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));
const W = 800;
const n = Math.floor(x.length / W);
const loud: boolean[] = [];
for (let i = 0; i < n; i++) {
  let e = 0;
  for (let j = 0; j < W; j++) e += (x[i * W + j] / 32768) ** 2;
  loud.push(10 * Math.log10(e / W + 1e-12) > -33);
}
const step = 0.05;
const src: Array<[number, number]> = [];
for (let i = 0; i < n; ) {
  if (!loud[i]) { i++; continue; }
  let last = i;
  for (let j = i; j < n; j++) {
    if (loud[j]) last = j;
    else if ((j - last) * step >= 0.25) break;
  }
  src.push([i * step, (last + 1) * step]);
  i = last + 1;
}

// map to the video timeline
let speech: Array<[number, number]> = src;
if (tl < 0 && VOICEOVER_SEGMENTS) {
  speech = [];
  for (const [s, e] of src) {
    let covered = 0;
    for (const g of VOICEOVER_SEGMENTS) {
      const a = Math.max(s, g.srcFrom);
      const b = Math.min(e, g.srcTo);
      if (b > a) {
        speech.push([a - g.srcFrom + g.at, b - g.srcFrom + g.at]);
        covered += b - a;
      }
    }
    if (covered < e - s - 0.5) console.log(`WARN  speech ${s.toFixed(2)}-${e.toFixed(2)} s in the file is partly outside VOICEOVER_SEGMENTS (${(e - s - covered).toFixed(2)} s dropped)`);
  }
}

const total = TOTAL_FRAMES / FPS;
let warned = 0;
console.log(`${file}: ${dur.toFixed(2)} s${tl < 0 ? `, placed on the video timeline as ${VOICEOVER_SEGMENTS ? VOICEOVER_SEGMENTS.length + " segment(s)" : "one unedited piece"}` : " (already a timeline)"}; video ${total.toFixed(2)} s`);
const lastEnd = speech.length ? speech[speech.length - 1][1] : 0;
if (lastEnd > total) {
  warned++;
  console.log(`WARN  narration runs to ${lastEnd.toFixed(2)} s, ${(lastEnd - total).toFixed(2)} s past the end of the video (cut off)`);
}
console.log("\nscene        window (s)        speech in window (s)      status");
for (const k of SCENE_ORDER) {
  const a = SCENES[k].from / FPS;
  const b = SCENES[k].to / FPS;
  const inside = speech.filter(([s, e]) => e > a && s < b);
  const first = inside.length ? Math.max(a, inside[0][0]) : NaN;
  const last = inside.length ? inside[inside.length - 1][1] : NaN;
  // a segment that starts inside this scene but ends after it overruns this scene
  const over = speech.filter(([s, e]) => s >= a && s < b && e > b + 0.3).map(([, e]) => e - b);
  const spill = speech.filter(([s, e]) => s < a && e > a + 0.3 && s >= a - 12).length;
  if (over.length) warned++;
  const status = over.length ? `OVERRUN by ${Math.max(...over).toFixed(2)} s` : inside.length ? "ok" : "no speech";
  console.log(`${k.padEnd(12)} ${a.toFixed(1).padStart(5)} - ${b.toFixed(1).padStart(5)}     ${Number.isNaN(first) ? "      -      " : `${first.toFixed(2)} - ${last.toFixed(2)}`.padEnd(24)}  ${status}${spill ? "" : ""}`);
}

// caption cues should start while speech is playing (cues with an explicit `at`)
console.log("\ncaption cue starts vs speech:");
let off = 0;
for (const k of SCENE_ORDER) {
  for (const c of NARRATION[k]) {
    if (c.at === undefined) continue;
    const t = c.at / FPS;
    const playing = speech.some(([s, e]) => t + 0.12 >= s && t <= e + 0.05);
    const nearest = speech.reduce((m, [s]) => Math.min(m, Math.abs(s - t)), 1e9);
    if (!playing) {
      off++;
      console.log(`WARN  ${k}: cue at ${t.toFixed(2)} s starts in silence (nearest speech onset ${nearest.toFixed(2)} s away): "${c.text.slice(0, 40)}"`);
    }
  }
}
if (!off) console.log("  every cue starts while speech is playing");
warned += off;

console.log("\nspeech segments on the video timeline:");
for (const [s, e] of speech) console.log(`  ${s.toFixed(2)} - ${e.toFixed(2)} s   frames ${Math.round(s * FPS)} - ${Math.round(e * FPS)}`);
console.log(warned ? `\n${warned} warning(s)` : "\nno overruns");
process.exit(0);
