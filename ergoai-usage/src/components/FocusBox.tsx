import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { layout, palette, type Norm } from "../config";

/**
 * Rounded teal rectangle at a box normalised to the screen image (0-1), with an optional dim
 * overlay outside it. Fades in over 12 frames from `delay`; fades out over 8 frames after `hold`.
 */
export const FocusBox: React.FC<{ box: Norm; delay: number; hold?: number; dim: boolean }> = ({ box, delay, hold, dim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = layout.phoneWidth;
  const H = layout.phoneHeight;
  const inP = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 12 });
  const outP = hold === undefined ? 0 : spring({ frame: frame - delay - hold, fps, config: { damping: 200 }, durationInFrames: 8 });
  const o = inP * (1 - outP);
  if (o <= 0.001) return null;
  const x = box.x * W;
  const y = box.y * H;
  const w = box.w * W;
  const h = box.h * H;
  const r = 22;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o }}>
      <defs>
        <mask id="focus-hole">
          <rect width={W} height={H} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} fill="black" />
        </mask>
      </defs>
      {dim ? <rect width={W} height={H} fill={palette.navy} fillOpacity={0.55} mask="url(#focus-hole)" /> : null}
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={palette.teal} strokeWidth={6} />
    </svg>
  );
};
