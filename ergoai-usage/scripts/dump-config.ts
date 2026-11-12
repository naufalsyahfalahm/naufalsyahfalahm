// Dumps segment/focus data to out/config.json for the Python check scripts.
import { mkdirSync, writeFileSync } from "node:fs";
import { recordings, segmentStarts, segments } from "../src/config";

mkdirSync("out", { recursive: true });
writeFileSync(
  "out/config.json",
  JSON.stringify({ segments: segments.map((s, i) => ({ ...s, start: segmentStarts[i] })), recordings }, null, 1),
);
console.log("wrote out/config.json");
