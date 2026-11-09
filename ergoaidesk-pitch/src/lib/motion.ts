import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0..1 over [from, to], clamped, eased. Pure interpolate. */
export const prog = (frame: number, from: number, to: number, easing = easeOut) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Fade in at `from` over `dur`, optionally fade out ending at `out`. */
export const fade = (frame: number, from: number, dur = 12, out?: number, outDur = 12) => {
  const a = prog(frame, from, from + dur);
  const b = out === undefined ? 1 : 1 - prog(frame, out - outDur, out);
  return Math.min(a, b);
};

/** Spring that starts at scene-local frame `delay`. Smooth (no overshoot) by default. */
export const useSpring = (delay = 0, config: { damping?: number; stiffness?: number; mass?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200, ...config } });
};
