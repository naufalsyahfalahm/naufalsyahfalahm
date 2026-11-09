/**
 * If public/voiceover.mp3 exists: lists speech segments and prints each scene's start/end against the audio,
 * warning where narration runs past its scene. Uses ffmpeg silencedetect. Run: npm run check:audio
 * Missing file => prints a note and exits 0.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { FILES, FPS, SCENES, SCENE_ORDER, TOTAL_FRAMES } from "../src/config";

const file = join("public", FILES.voiceover);
if (!existsSync(file)) {
  console.log(`no ${file}: nothing to check (video renders without voiceover)`);
  process.exit(0);
}
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).stdout);
const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-35dB:d=0.4", "-f", "null", "-"], { encoding: "utf8" });
const log = r.stderr;
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
// speech = complement of silence
const speech: Array<[number, number]> = [];
let t = 0;
for (let i = 0; i < Math.max(starts.length, ends.length); i++) {
  const s = starts[i] ?? dur;
  if (s - t > 0.15) speech.push([t, s]);
  t = ends[i] ?? dur;
}
if (t < dur - 0.15) speech.push([t, dur]);

const total = TOTAL_FRAMES / FPS;
console.log(`voiceover ${dur.toFixed(2)} s vs video ${total.toFixed(2)} s`);
let warned = 0;
if (dur > total + 0.05) {
  warned++;
  console.log(`WARN  voiceover is ${(dur - total).toFixed(2)} s longer than the video and will be cut`);
}
console.log("\nscene        window (s)        narration in window (s)   status");
for (const k of SCENE_ORDER) {
  const a = SCENES[k].from / FPS;
  const b = SCENES[k].to / FPS;
  const inside = speech.filter(([s, e]) => e > a && s < b);
  const first = inside.length ? Math.max(a, inside[0][0]) : NaN;
  const last = inside.length ? inside[inside.length - 1][1] : NaN;
  // a segment that starts in this scene but ends after it = overrun of this scene
  const over = speech.filter(([s, e]) => s >= a && s < b && e > b + 0.3).map(([, e]) => e - b);
  const status = over.length ? `OVERRUN by ${Math.max(...over).toFixed(2)} s` : inside.length ? "ok" : "no speech";
  if (over.length) warned++;
  console.log(`${k.padEnd(12)} ${a.toFixed(1).padStart(5)} - ${b.toFixed(1).padStart(5)}     ${Number.isNaN(first) ? "      -      " : `${first.toFixed(2)} - ${last.toFixed(2)}`.padEnd(24)}  ${status}`);
}
console.log("\nspeech segments (use these to set `at` frames in config.NARRATION):");
for (const [s, e] of speech) console.log(`  ${s.toFixed(2)} - ${e.toFixed(2)} s   frames ${Math.round(s * FPS)} - ${Math.round(e * FPS)}`);
console.log(warned ? `\n${warned} warning(s)` : "\nno overruns");
process.exit(0);
