import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { layout, palette } from "../config";

/**
 * 40 px translucent ripple at a normalised point (x, y) of the screen image.
 * Two slow cycles (48 frames each, ~1.6 s) from `delay`: no flashing.
 */
export const TapRipple: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  const frame = useCurrentFrame() - delay;
  const cycles = 2;
  const period = 48;
  if (frame < 0 || frame >= period * cycles) return null;
  const t = (frame % period) / 36;
  const tt = Math.min(t, 1);
  const scale = interpolate(tt, [0, 1], [1, 2.2]);
  const opacity = interpolate(tt, [0, 0.15, 1], [0, 0.6, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: x * layout.phoneWidth - 20,
        top: y * layout.phoneHeight - 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        background: "rgba(244,247,249,0.55)",
        border: `3px solid ${palette.teal}`,
        boxSizing: "border-box",
        opacity,
        transform: `scale(${scale})`,
      }}
    />
  );
};
