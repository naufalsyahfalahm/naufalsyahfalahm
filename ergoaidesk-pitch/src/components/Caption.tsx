import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { CAPTION_LAYOUT, COLORS, SAFE, SCENES, SCENE_ORDER, WIDTH, captionsEnabled } from "../config";
import { buildCues } from "../lib/captions";
import { fade } from "../lib/motion";
import { T } from "./Text";

/** Bottom captions from the PDF narration (config.NARRATION). Max 2 lines; toggle: config.captionsEnabled. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cues = useMemo(buildCues, []);
  if (!captionsEnabled) return null;
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  if (!cue) return null;
  const layout = CAPTION_LAYOUT[cue.scene];
  const width = layout === "left" ? 1120 : WIDTH - 2 * SAFE;
  const opacity = fade(frame, cue.from, 8, cue.to, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE,
        bottom: SAFE,
        width,
        display: "flex",
        justifyContent: layout === "left" ? "flex-start" : "center",
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(14,34,51,0.88)",
          borderRadius: 16,
          padding: "8px 24px",
          maxWidth: width,
          boxSizing: "border-box",
        }}
      >
        <T size={44} weight={600} color={COLORS.white} maxLines={2} align={layout === "left" ? "left" : "center"} lineHeight={1.2} style={{ textWrap: "balance" }}>
          {cue.text}
        </T>
      </div>
    </div>
  );
};

export const sceneOf = (frame: number) => SCENE_ORDER.find((k) => frame >= SCENES[k].from && frame < SCENES[k].to);
