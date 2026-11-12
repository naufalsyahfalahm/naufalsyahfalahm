// Writes out/ergoai-usage.srt from the caption timings. Usage: tsx scripts/export-srt.ts [en|id]
import { mkdirSync, writeFileSync } from "node:fs";
import { captions } from "../src/captions";
import { fps, lang as defaultLang, segments, segmentStarts, type Lang } from "../src/config";

const lang = ((process.argv[2] as Lang | undefined) ?? defaultLang) as Lang;
const ts = (frame: number) => {
  const ms = Math.round((frame / fps) * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const out = segments.map((s, i) => {
  const c = captions[s.id];
  const title = lang === "en" ? c.title_en : c.title_id;
  const line = lang === "en" ? c.line_en : c.line_id;
  const start = segmentStarts[i];
  // End one frame before the next cue so cues never overlap.
  return `${i + 1}\n${ts(start)} --> ${ts(start + s.frames - 1)}\n${title}\n${line}\n`;
});
mkdirSync("out", { recursive: true });
writeFileSync("out/ergoai-usage.srt", out.join("\n"));
console.log(`wrote out/ergoai-usage.srt (${lang}, ${segments.length} cues)`);
