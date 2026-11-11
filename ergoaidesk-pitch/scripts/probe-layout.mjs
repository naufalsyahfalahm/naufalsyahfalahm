// Layout probe for the PiP keep-out zones. Usage: node scripts/probe-layout.mjs <step_frames> <out.json> [frame,frame,...]
// Bundles the project once, renders low-res stills of selected frames with inputProps.probe=true and collects
// the "PROBE {...}" console lines (every visible element that intersects a keep-out zone).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const step = Number(process.argv[2] ?? 15);
const outFile = process.argv[3] ?? "work/probe.json";
const extra = (process.argv[4] ?? "").split(",").filter(Boolean).map(Number);
const chromium = process.env.REMOTION_BROWSER_EXECUTABLE ?? "/opt/pw-browsers/chromium";
const serveUrl = await bundle({ entryPoint: join(process.cwd(), "src/index.ts"), onProgress: () => {}, rspack: true });
const inputProps = { probe: true, checkpass: true, probeAll: process.env.PROBE_ALL === '1' };
const browserExecutable = existsSync(chromium) ? chromium : undefined;
const comp = await selectComposition({ serveUrl, id: "ErgoAIDeskPitch", inputProps, browserExecutable });
const frames = new Set(extra);
for (let f = 0; f < comp.durationInFrames; f += step) frames.add(f);
for (const f of [0, 1, 4799, 4800, 5399]) frames.add(f);
const list = [...frames].filter((f) => f >= 0 && f < comp.durationInFrames).sort((a, b) => a - b);
mkdirSync("work/probe_tmp", { recursive: true });
const results = {};
let idx = 0;
async function worker(w) {
  while (idx < list.length) {
    const f = list[idx++];
    const logs = [];
    await renderStill({
      composition: comp, serveUrl, frame: f, inputProps, scale: 0.25, imageFormat: "jpeg", jpegQuality: 40,
      output: join("work/probe_tmp", `w${w}.jpg`), browserExecutable, overwrite: true, timeoutInMilliseconds: 120000,
      onBrowserLog: (l) => { if (l.text.startsWith("PROBE ")) logs.push(l.text.slice(6)); },
    });
    const line = logs.map((x) => JSON.parse(x)).filter((x) => x.frame === f).pop();
    results[f] = line ? line.hits : null;
    if (idx % 20 === 0) console.log(`${idx}/${list.length}`);
  }
}
await Promise.all([0, 1, 2].map(worker));
writeFileSync(outFile, JSON.stringify(results));
console.log("frames", list.length, "missing", list.filter((f) => results[f] === null).length);
