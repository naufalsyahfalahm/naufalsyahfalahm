import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, TEXT } from "../config";
import { BodyBack, DottedWorldMap } from "../components/Illus";
import { IllustrationTag } from "../components/Tag";
import { T } from "../components/Text";
import { easeInOut, fade, prog } from "../lib/motion";

// page-space hot-spots for a body drawn at scale 0.8 with its top-left at (760, 110)
const BODY = { left: 760, top: 110, scale: 0.8 };
const pt = (x: number, y: number) => ({ x: BODY.left + x * BODY.scale, y: BODY.top + y * BODY.scale });
const NECK = pt(250, 196);
const SH_L = pt(158, 250);
const LOW = pt(250, 520);
const HEAD_RING = pt(250 + 102, 105);
const PHYS_PILL = { x: 560, y: 430 }; // right-middle edge of the physical pill
const PSY_PILL = { x: 1288, y: 330 }; // left edge of the psychological pill

const Leader: React.FC<{ from: { x: number; y: number }; to: { x: number; y: number }; k: number; color: string }> = ({ from, to, k, color }) => (
  <line
    x1={from.x}
    y1={from.y}
    x2={from.x + (to.x - from.x) * k}
    y2={from.y + (to.y - from.y) * k}
    stroke={color}
    strokeWidth={4}
    strokeDasharray="10 10"
    opacity={k > 0 ? 0.9 : 0}
  />
);

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const neck = prog(frame, 70, 110);
  const sh = prog(frame, 160, 200);
  const low = prog(frame, 250, 290);
  const stress = prog(frame, 370, 420);
  const pulse = Math.sin(frame * 0.18);
  const ripple = (frame * 0.012) % 1;
  const bodyIn = prog(frame, 0, 30);
  const pillP = prog(frame, 50, 80);
  const pillS = prog(frame, 360, 390);
  const link = prog(frame, 560, 650, easeInOut);
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      {/* decorative map: uniform colour and opacity, land mask only; carries no data */}
      <div style={{ position: "absolute", left: 0, top: 170, opacity: fade(frame, 0, 30) }}>
        <DottedWorldMap width={1920} />
      </div>
      <div
        style={{
          position: "absolute",
          left: BODY.left,
          top: BODY.top,
          transform: `scale(${BODY.scale})`,
          transformOrigin: "0 0",
          opacity: bodyIn,
        }}
      >
        <BodyBack neck={neck} shoulders={sh} lowerBack={low} stress={stress} pulse={pulse} ripple={ripple} />
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Leader from={PHYS_PILL} to={NECK} k={neck} color={COLORS.grey} />
        <Leader from={PHYS_PILL} to={SH_L} k={sh} color={COLORS.grey} />
        <Leader from={PHYS_PILL} to={LOW} k={low} color={COLORS.grey} />
        <Leader from={PSY_PILL} to={HEAD_RING} k={stress} color={COLORS.lilac} />
        {/* the two tracks are linked once both are shown */}
        <path
          d={`M 330 500 C 330 760, 1560 760, 1560 470`}
          fill="none"
          stroke={COLORS.grey}
          strokeWidth={4}
          strokeDasharray="4 14"
          strokeLinecap="round"
          opacity={link * 0.8}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 96,
          top: PHYS_PILL.y - 54,
          opacity: pillP,
          transform: `translateX(${(1 - pillP) * -40}px)`,
          background: COLORS.teal,
          padding: "10px 36px",
          borderRadius: 999,
          width: "max-content",
        }}
      >
        <T size={60} font="heading" maxLines={1} color={COLORS.white}>
          {TEXT.problemPhysical}
        </T>
      </div>
      <div
        style={{
          position: "absolute",
          left: PSY_PILL.x,
          top: PSY_PILL.y - 66,
          opacity: pillS,
          transform: `translateX(${(1 - pillS) * 40}px)`,
          background: COLORS.lilac,
          padding: "14px 40px",
          borderRadius: 40,
          width: 520,
          boxSizing: "border-box",
        }}
      >
        <T size={60} font="heading" maxLines={2} color={COLORS.navy}>
          {TEXT.problemPsych}
        </T>
      </div>
      <IllustrationTag opacity={fade(frame, 4, 14)} />
    </AbsoluteFill>
  );
};
