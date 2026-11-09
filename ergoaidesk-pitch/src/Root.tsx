import React from "react";
import { Composition } from "remotion";
import { COMPOSITION_ID, FPS, HEIGHT, SCENES, SCENE_ORDER, TOTAL_FRAMES, WIDTH } from "./config";
import { Pitch } from "./Pitch";

// Fail fast if the scene ranges do not tile 0..TOTAL_FRAMES exactly.
let cursor = 0;
for (const k of SCENE_ORDER) {
  if (SCENES[k].from !== cursor) throw new Error(`Scene "${k}" starts at ${SCENES[k].from}, expected ${cursor}`);
  cursor = SCENES[k].to;
}
if (cursor !== TOTAL_FRAMES) throw new Error(`Scenes end at ${cursor}, expected ${TOTAL_FRAMES}`);

export const RemotionRoot: React.FC = () => (
  <Composition id={COMPOSITION_ID} component={Pitch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
