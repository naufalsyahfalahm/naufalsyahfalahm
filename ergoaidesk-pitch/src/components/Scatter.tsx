import React from "react";
import { COLORS } from "../config";

/** Plain scatter. No tick labels (they would need >=44 px text); axis names and r/CI/n are set as text around it. */
export const Scatter: React.FC<{
  xs: number[];
  ys: number[];
  w: number;
  h: number;
  identity?: boolean;
  shared?: boolean; // same domain on both axes (needed for an identity line)
  progress: number; // 0..1 reveal
}> = ({ xs, ys, w, h, identity, shared, progress }) => {
  const pad = 14;
  const ext = (a: number[]) => {
    const lo = Math.min(...a);
    const hi = Math.max(...a);
    const m = (hi - lo || 1) * 0.06;
    return [lo - m, hi + m] as const;
  };
  const [xl, xh] = shared ? ext([...xs, ...ys]) : ext(xs);
  const [yl, yh] = shared ? [xl, xh] : ext(ys);
  const X = (v: number) => pad + ((v - xl) / (xh - xl)) * (w - 2 * pad);
  const Y = (v: number) => h - pad - ((v - yl) / (yh - yl)) * (h - 2 * pad);
  const shown = Math.ceil(xs.length * progress);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x={0} y={0} width={w} height={h} rx={14} fill={COLORS.navy2} />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={COLORS.grey} strokeWidth={3} />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={COLORS.grey} strokeWidth={3} />
      {identity ? <line x1={X(xl)} y1={Y(xl)} x2={X(xh)} y2={Y(xh)} stroke={COLORS.grey} strokeWidth={3} strokeDasharray="12 10" /> : null}
      {xs.slice(0, shown).map((x, i) => (
        <circle key={i} cx={X(x)} cy={Y(ys[i])} r={6} fill={COLORS.white} fillOpacity={0.85} stroke={COLORS.navy} strokeWidth={1.5} />
      ))}
    </svg>
  );
};
