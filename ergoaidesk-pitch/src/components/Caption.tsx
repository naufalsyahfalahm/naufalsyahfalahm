import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { CAPTION_CLOSING, CAPTION_LAYOUT, CAPTION_X, COLORS, HEIGHT, KEEP_OUT, SAFE, SCENES, SCENE_ORDER, captionsEnabled } from "../config";
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
  // PiP keep-out: captions stay inside x 48-1402 (right PiP). In the closing (left PiP too) the caption sits in
  // x 518-1402, or above the PiP row (bottom edge at y = KEEP_OUT.right.yMin) when the text does not fit in 2 lines.
  const closingIdx = cue.scene === "closing" ? cues.filter((c) => c.scene === "closing").indexOf(cue) : -1;
  const closing = closingIdx >= 0 ? CAPTION_CLOSING[Math.min(closingIdx, CAPTION_CLOSING.length - 1)] : null;
  let left: number = CAPTION_X.min;
  let width: number = CAPTION_X.max - CAPTION_X.min;
  let bottom: number = SAFE;
  if (closing?.place === "band") {
    left = CAPTION_X.closingMin;
    width = CAPTION_X.max - CAPTION_X.closingMin;
  } else if (closing?.place === "above") {
    bottom = HEIGHT - KEEP_OUT.right.yMin;
    left = SAFE;
    width = 1920 - 2 * SAFE;
  } else if (layout === "wide") {
    left = SAFE;
    width = CAPTION_X.max - SAFE;
  } else if (layout === "left") {
    left = SAFE;
    width = 1120;
  }
  const opacity = fade(frame, cue.from, 8, cue.to, 8);
  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom,
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
