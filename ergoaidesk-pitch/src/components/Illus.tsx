import React from "react";
import { COLORS } from "../config";
import { WORLD_DOTS, WORLD_DOT_ASPECT } from "../generated/worldDots";

/** Neutral flat tints derived from the navy/grey palette (no skin-tone claims, no faces). */
export const ILL = {
  skin: "#D5DFE8",
  shirt: "#FFFFFF",
  pants: "#3A6283",
  furn: "#1F4560",
  furn2: "#2F5B7A",
  line: "#6D8CA3",
} as const;

const rad = (d: number) => (d * Math.PI) / 180;

// ------------------------------------------------------------------ world map (decorative, uniform colour)
/** Land-mask dots only. Every dot has the same colour and opacity: no shading, no values, no prevalence. */
export const DottedWorldMap: React.FC<{ width: number; opacity?: number }> = ({ width, opacity = 0.16 }) => {
  const height = width / WORLD_DOT_ASPECT;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
      {WORLD_DOTS.map(([x, y], i) => (
        <circle key={i} cx={x * width} cy={y * height} r={width / 480} fill={COLORS.grey} />
      ))}
    </svg>
  );
};

// ------------------------------------------------------------------ scene 1: person at laptop (side view)
export const PersonAtLaptop: React.FC<{ slump: number; clockTurns: number }> = ({ slump, clockTurns }) => {
  const th = rad(4 + 26 * slump); // torso lean from vertical
  const ph = rad(2 + 32 * slump); // extra neck flexion
  const H = { x: 420, y: 548 };
  const S = { x: H.x + 200 * Math.sin(th), y: H.y - 200 * Math.cos(th) };
  const C = { x: S.x + 108 * Math.sin(th + ph), y: S.y - 108 * Math.cos(th + ph) };
  const hand = { x: 705, y: 438 };
  // two-bone arm (shoulder -> elbow -> hand)
  const U = 150;
  const F = 160;
  const dx = hand.x - S.x;
  const dy = hand.y - S.y;
  const d = Math.min(Math.hypot(dx, dy), U + F - 1);
  const a = (U * U - F * F + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, U * U - a * a));
  const ux = dx / Math.hypot(dx, dy);
  const uy = dy / Math.hypot(dx, dy);
  const mx = S.x + a * ux;
  const my = S.y + a * uy;
  const e1 = { x: mx - hh * uy, y: my + hh * ux };
  const e2 = { x: mx + hh * uy, y: my - hh * ux };
  const elbow = e1.y >= e2.y ? e1 : e2; // elbow hangs below the shoulder-hand line
  const knee = { x: 612, y: 556 };
  const foot = { x: 628, y: 688 };
  const clockA = 360 * clockTurns;
  return (
    <svg width={1200} height={760} viewBox="0 0 1200 760">
      {/* wall clock (time-lapse cue) */}
      <g transform="translate(170 230)">
        <circle r={78} fill={ILL.furn} stroke={ILL.line} strokeWidth={8} />
        <line x1={0} y1={0} x2={0} y2={-58} stroke={COLORS.grey} strokeWidth={7} strokeLinecap="round" transform={`rotate(${clockA})`} />
        <line x1={0} y1={0} x2={0} y2={-38} stroke={COLORS.white} strokeWidth={10} strokeLinecap="round" transform={`rotate(${clockA / 12})`} />
        <circle r={8} fill={COLORS.white} />
      </g>
      {/* floor */}
      <rect x={0} y={700} width={1200} height={10} rx={5} fill={ILL.furn2} />
      {/* chair */}
      <line x1={440} y1={592} x2={440} y2={690} stroke={ILL.line} strokeWidth={16} strokeLinecap="round" />
      <line x1={360} y1={694} x2={520} y2={694} stroke={ILL.line} strokeWidth={14} strokeLinecap="round" />
      <rect x={330} y={566} width={250} height={28} rx={14} fill={ILL.furn2} />
      <line x1={352} y1={566} x2={322} y2={360} stroke={ILL.furn2} strokeWidth={34} strokeLinecap="round" />
      {/* desk */}
      <rect x={640} y={476} width={520} height={24} rx={8} fill={ILL.furn2} />
      <rect x={1110} y={500} width={22} height={200} fill={ILL.furn} />
      {/* laptop */}
      <rect x={660} y={452} width={290} height={22} rx={8} fill={ILL.line} />
      <polygon points="934,452 958,452 1016,292 990,292" fill={ILL.line} />
      <polygon points="930,448 944,448 996,300 982,300" fill={ILL.furn} />
      {/* legs */}
      <polyline points={`${H.x},${H.y} ${knee.x},${knee.y} ${foot.x},${foot.y}`} fill="none" stroke={ILL.pants} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={foot.x} y1={foot.y} x2={foot.x + 60} y2={foot.y} stroke={COLORS.white} strokeWidth={26} strokeLinecap="round" />
      {/* torso */}
      <line x1={H.x} y1={H.y} x2={S.x} y2={S.y} stroke={ILL.shirt} strokeWidth={104} strokeLinecap="round" />
      {/* neck + head (no face) */}
      <line x1={S.x} y1={S.y} x2={C.x} y2={C.y} stroke={ILL.skin} strokeWidth={36} strokeLinecap="round" />
      <circle cx={C.x} cy={C.y} r={52} fill={ILL.skin} />
      <path
        d={`M ${C.x - 52} ${C.y} A 52 52 0 0 1 ${C.x + 8} ${C.y - 51} L ${C.x - 14} ${C.y - 6} Z`}
        fill={ILL.furn}
        transform={`rotate(${(th + ph) * 57.3 - 10} ${C.x} ${C.y})`}
      />
      {/* arm */}
      <polyline points={`${S.x},${S.y} ${elbow.x},${elbow.y} ${hand.x},${hand.y}`} fill="none" stroke={ILL.shirt} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand.x} cy={hand.y} r={18} fill={ILL.skin} />
    </svg>
  );
};

// ------------------------------------------------------------------ scene 1: close-up, hand rubbing the neck
export const NeckCloseUp: React.FC<{ t: number }> = ({ t }) => {
  const rub = Math.sin(t * 0.3);
  const px = 800 + rub * 16;
  const py = 400 + rub * 52;
  const rot = rub * 4;
  const skinDark = "#B3C4D3";
  const outline = { stroke: ILL.furn, strokeWidth: 4 } as const;
  return (
    <svg width={1200} height={760} viewBox="0 0 1200 760">
      <rect x={0} y={0} width={1200} height={760} fill={ILL.furn} />
      {/* back of head: hair dome */}
      <ellipse cx={600} cy={70} rx={270} ry={250} fill={ILL.furn2} />
      <path d="M 340 150 Q 600 340 860 150 L 860 0 L 340 0 Z" fill={ILL.furn2} />
      {/* neck */}
      <rect x={500} y={270} width={200} height={260} rx={70} fill={skinDark} />
      <path d="M 520 300 Q 600 330 680 300" fill="none" stroke={ILL.line} strokeWidth={5} opacity={0.5} />
      {/* shoulders and shirt */}
      <path d="M 60 760 L 60 620 Q 80 520 300 490 L 510 470 L 690 470 L 900 490 Q 1120 520 1140 620 L 1140 760 Z" fill={ILL.shirt} />
      <path d="M 506 470 Q 600 540 694 470 L 694 492 Q 600 566 506 492 Z" fill={ILL.line} opacity={0.45} />
      {/* hand and forearm entering from the right, fingers across the side of the neck */}
      <g transform={`translate(${px} ${py}) rotate(${rot})`}>
        <line x1={0} y1={0} x2={560} y2={-120} stroke={ILL.shirt} strokeWidth={110} strokeLinecap="round" />
        <line x1={20} y1={0} x2={200} y2={-40} stroke={ILL.skin} strokeWidth={84} strokeLinecap="round" />
        <rect x={-95} y={-92} width={170} height={184} rx={50} fill={ILL.skin} {...outline} />
        {[-66, -22, 22, 66].map((y, i) => (
          <rect key={i} x={-250 + (i === 0 || i === 3 ? 22 : 0)} y={y - 20} width={190} height={40} rx={20} fill={ILL.skin} {...outline} />
        ))}
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ scene 2: body icon (back view) + stress ring
const SPOTS = {
  neck: { x: 250, y: 196, r: 62 },
  shoulders: [
    { x: 158, y: 250, r: 64 },
    { x: 342, y: 250, r: 64 },
  ],
  lowerBack: { x: 250, y: 520, r: 84 },
} as const;

const Glow: React.FC<{ id: string; x: number; y: number; r: number; k: number; pulse: number }> = ({ id, x, y, r, k, pulse }) => (
  <g opacity={k}>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.95} />
        <stop offset="55%" stopColor={COLORS.red} stopOpacity={0.55} />
        <stop offset="100%" stopColor={COLORS.red} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * (1.15 + 0.12 * pulse)} fill={`url(#${id})`} />
  </g>
);

export const BodyBack: React.FC<{
  neck: number;
  shoulders: number;
  lowerBack: number;
  stress: number; // 0..1 lilac ring
  pulse: number; // -1..1 (sin of frame)
  ripple: number; // 0..1 loops
}> = ({ neck, shoulders, lowerBack, stress, pulse, ripple }) => (
  <svg width={500} height={900} viewBox="0 0 500 900" style={{ overflow: "visible" }}>
    <g fill={ILL.furn2} stroke="none">
      <circle cx={250} cy={105} r={70} />
      <rect x={222} y={165} width={56} height={56} rx={20} />
      <path d="M250 208 C195 208 132 220 118 268 L126 470 C128 520 150 560 160 600 L340 600 C350 560 372 520 374 470 L382 268 C368 220 305 208 250 208 Z" />
      <rect x={165} y={590} width={80} height={270} rx={34} />
      <rect x={255} y={590} width={80} height={270} rx={34} />
    </g>
    <g fill="none" stroke={ILL.furn2} strokeWidth={54} strokeLinecap="round">
      <path d="M106 276 Q62 380 72 520" />
      <path d="M394 276 Q438 380 428 520" />
    </g>
    <Glow id="g-neck" {...SPOTS.neck} k={neck} pulse={pulse} />
    <Glow id="g-sh1" {...SPOTS.shoulders[0]} k={shoulders} pulse={pulse} />
    <Glow id="g-sh2" {...SPOTS.shoulders[1]} k={shoulders} pulse={pulse} />
    <Glow id="g-lb" {...SPOTS.lowerBack} k={lowerBack} pulse={pulse} />
    {/* psychological: lilac stress ring around the head */}
    <g opacity={stress}>
      <circle cx={250} cy={105} r={102} fill="none" stroke={COLORS.lilac} strokeWidth={12} />
      {[0, 0.5].map((o) => {
        const k = (ripple + o) % 1;
        return <circle key={o} cx={250} cy={105} r={102 + k * 90} fill="none" stroke={COLORS.lilac} strokeWidth={6} opacity={(1 - k) * 0.8} />;
      })}
    </g>
  </svg>
);

// ------------------------------------------------------------------ scene 3: RULA clipboard + paper questionnaire
export const RulaClipboard: React.FC<{ fill: number; t: number }> = ({ fill, t }) => {
  const rows = 6;
  const cur = Math.min(rows - 1, Math.floor(fill * rows));
  return (
    <svg width={520} height={640} viewBox="0 0 520 640">
      <rect x={40} y={60} width={440} height={560} rx={28} fill={ILL.furn2} />
      <rect x={70} y={110} width={380} height={480} rx={10} fill={COLORS.white} />
      <rect x={190} y={30} width={140} height={64} rx={16} fill={COLORS.grey} />
      <rect x={100} y={138} width={150} height={20} rx={10} fill={COLORS.navy} opacity={0.85} />
      {/* simple posture-sketch box (stick figure, no numbers) */}
      <g stroke={COLORS.navy} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8}>
        <rect x={330} y={128} width={96} height={96} rx={10} strokeWidth={3} />
        <circle cx={372} cy={152} r={9} />
        <path d="M372 162 L384 190 L368 214 M384 190 L408 200" />
      </g>
      {Array.from({ length: rows }).map((_, i) => {
        const y = 250 + i * 54;
        const k = Math.max(0, Math.min(1, fill * rows - i));
        return (
          <g key={i}>
            <rect x={100} y={y} width={150} height={16} rx={8} fill={COLORS.grey} />
            <rect x={270} y={y - 2} width={156} height={20} rx={10} fill={COLORS.grey} opacity={0.5} />
            <rect x={270} y={y - 2} width={156 * k} height={20} rx={10} fill={COLORS.teal} />
          </g>
        );
      })}
      {/* pen at the current row */}
      <g transform={`translate(${270 + 156 * Math.max(0.05, fill * rows - cur) + Math.sin(t * 0.6) * 4} ${250 + cur * 54 + 8}) rotate(38)`}>
        <rect x={0} y={-8} width={150} height={16} rx={8} fill={COLORS.navy} />
        <polygon points="0,-8 -22,0 0,8" fill={COLORS.grey} />
      </g>
    </svg>
  );
};

export const PaperQuestionnaire: React.FC<{ fill: number }> = ({ fill }) => {
  const rows = 5;
  return (
    <svg width={520} height={640} viewBox="0 0 520 640">
      <g transform="rotate(2 260 320)">
        <rect x={40} y={40} width={440} height={560} rx={14} fill={COLORS.white} />
        <rect x={80} y={80} width={220} height={20} rx={10} fill={COLORS.navy} opacity={0.85} />
        {Array.from({ length: rows }).map((_, i) => {
          const y = 150 + i * 88;
          const k = Math.max(0, Math.min(1, fill * rows - i));
          const pick = (i * 2 + 1) % 5;
          return (
            <g key={i}>
              <rect x={80} y={y} width={300} height={16} rx={8} fill={COLORS.grey} />
              {Array.from({ length: 5 }).map((__, j) => (
                <circle key={j} cx={100 + j * 80} cy={y + 46} r={16} fill={j === pick && k > 0.5 ? COLORS.lilac : "none"} stroke={COLORS.navy} strokeWidth={4} opacity={0.9} />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
