// Renders PNG stills at the first, middle and last frame of every segment into out/stills/,
// plus a background-only reference (_bg.png) for the safe-zone check.
// Usage: tsx scripts/render-stills.ts [frame ...]   (explicit frames render as f<frame>.png)
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { segmentStarts, segments } from "../src/config";

const outDir = path.resolve("out/stills");
mkdirSync(outDir, { recursive: true });
const chromium = process.env.REMOTION_BROWSER_EXECUTABLE ?? "/opt/pw-browsers/chromium";
const browserExecutable = existsSync(chromium) ? chromium : null;

const jobs: { name: string; frame: number }[] = [];
const explicit = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
if (explicit.length) {
  for (const f of explicit) jobs.push({ name: `f${String(f).padStart(4, "0")}`, frame: f });
} else {
  segments.forEach((s, i) => {
    const a = segmentStarts[i];
    const b = a + s.frames - 1;
    const m = a + Math.floor(s.frames / 2);
    jobs.push({ name: `${String(i + 1).padStart(2, "0")}-${s.id}-first`, frame: a });
    jobs.push({ name: `${String(i + 1).padStart(2, "0")}-${s.id}-mid`, frame: m });
    jobs.push({ name: `${String(i + 1).padStart(2, "0")}-${s.id}-last`, frame: b });
  });
}

async function main() {
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
  const walk = await selectComposition({ serveUrl, id: "Walkthrough", browserExecutable });
  const bg = await selectComposition({ serveUrl, id: "BgRef", browserExecutable });

  await renderStill({ composition: bg, serveUrl, output: path.join(outDir, "_bg.png"), frame: 0, imageFormat: "png", browserExecutable });
  for (const j of jobs) {
    await renderStill({
      composition: walk,
      serveUrl,
      output: path.join(outDir, `${j.name}.png`),
      frame: j.frame,
      imageFormat: "png",
      browserExecutable,
    });
    console.log(`${j.name}  frame ${j.frame}`);
  }
  console.log(`done: ${jobs.length} stills + _bg.png in out/stills/`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
