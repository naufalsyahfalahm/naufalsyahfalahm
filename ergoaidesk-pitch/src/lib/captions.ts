import {
  CAPTION_LEAD,
  CAPTION_TAIL,
  NARRATION,
  SCENES,
  SCENE_ORDER,
  type SceneKey,
} from "../config";

export type Cue = { scene: SceneKey; from: number; to: number; text: string };

/** Cues from config.NARRATION. Explicit `at` wins; otherwise proportional to character count. */
export const buildCues = (): Cue[] => {
  const cues: Cue[] = [];
  for (const scene of SCENE_ORDER) {
    const items = NARRATION[scene];
    const range = SCENES[scene];
    const explicit = items.every((i) => i.at !== undefined);
    if (items.some((i) => i.at !== undefined) && !explicit) {
      throw new Error(`NARRATION.${scene}: give \`at\` for every cue or for none`);
    }
    if (explicit) {
      items.forEach((it, k) => {
        const from = it.at as number;
        const to = k + 1 < items.length ? (items[k + 1].at as number) : range.to - CAPTION_TAIL;
        cues.push({ scene, from, to, text: it.text });
      });
      continue;
    }
    const start = range.from + CAPTION_LEAD;
    const end = range.to - CAPTION_TAIL;
    const total = items.reduce((s, i) => s + i.text.length, 0);
    let t = start;
    for (const it of items) {
      const len = ((end - start) * it.text.length) / total;
      cues.push({ scene, from: Math.round(t), to: Math.round(t + len), text: it.text });
      t += len;
    }
  }
  return cues;
};
