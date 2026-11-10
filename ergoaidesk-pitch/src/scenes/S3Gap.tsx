import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, TEXT } from "../config";
import { PaperQuestionnaire, RulaClipboard, ILL } from "../components/Illus";
import { IllustrationTag } from "../components/Tag";
import { T } from "../components/Text";
import { easeInOut, fade, prog } from "../lib/motion";

const PANEL = { w: 780, h: 580, top: 200 };

const Observer: React.FC = () => (
  <svg width={300} height={470} viewBox="0 0 300 470">
    <path d="M10 470 L10 330 Q20 250 150 236 Q280 250 290 330 L290 470 Z" fill={ILL.shirt} />
    <rect x={118} y={170} width={64} height={80} rx={28} fill={ILL.skin} />
    <circle cx={150} cy={118} r={62} fill={ILL.skin} />
    <path d="M88 118 A62 62 0 0 1 212 108 L212 96 Q150 58 88 96 Z" fill={ILL.furn2} />
    <line x1={250} y1={300} x2={330} y2={340} stroke={ILL.shirt} strokeWidth={40} strokeLinecap="round" />
  </svg>
);

export const SceneGap: React.FC = () => {
  const frame = useCurrentFrame();
  // timed to the voiceover (scene-local): sentence 1 0-246, "manual observation" 246-333,
  // "psychological conditions ... self-report" 333-465, "not integrated" 462, "interaction" 556
  const inL = prog(frame, 0, 28);
  const inR = prog(frame, 0, 28);
  const fillL = prog(frame, 60, 330, easeInOut);
  const fillR = prog(frame, 150, 470, easeInOut);
  const divider = prog(frame, 470, 545);
  const q = prog(frame, 560, 605);
  const headA = fade(frame, 14, 14, 545, 12);
  const headB = fade(frame, 556, 16);
  const x0 = 96;
  const x1 = 1920 - 96 - PANEL.w;
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <div style={{ position: "absolute", left: 96, right: 96, top: 96, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", height: 70 }}>
          <div style={{ opacity: headA, position: "absolute", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <T size={64} font="heading" maxLines={1} align="center">
              {TEXT.gapA}
            </T>
          </div>
          <div style={{ opacity: headB, position: "absolute", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <T size={64} font="heading" maxLines={1} align="center">
              {TEXT.gapB}
            </T>
          </div>
        </div>
      </div>

      {/* left: observer filling a RULA sheet */}
      <div
        style={{
          position: "absolute",
          left: x0,
          top: PANEL.top,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 28,
          background: COLORS.navy2,
          opacity: inL,
          transform: `translateX(${(1 - inL) * -80}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 30, top: 110 }}>
          <Observer />
        </div>
        <div style={{ position: "absolute", left: 300, top: 14, transform: "scale(0.88)", transformOrigin: "0 0" }}>
          <RulaClipboard fill={fillL} t={frame} />
        </div>
      </div>
      <div style={{ position: "absolute", left: x0, top: PANEL.top + PANEL.h + 10, width: PANEL.w, opacity: inL }}>
        <T size={44} weight={600} color={COLORS.grey} maxLines={1} align="center">
          {TEXT.gapLeft}
        </T>
      </div>

      {/* right: paper questionnaire */}
      <div
        style={{
          position: "absolute",
          left: x1,
          top: PANEL.top,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 28,
          background: COLORS.navy2,
          opacity: inR,
          transform: `translateX(${(1 - inR) * 80}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: 170, top: 14, transform: "scale(0.88)", transformOrigin: "0 0" }}>
          <PaperQuestionnaire fill={fillR} />
        </div>
      </div>
      <div style={{ position: "absolute", left: x1, top: PANEL.top + PANEL.h + 10, width: PANEL.w, opacity: inR }}>
        <T size={44} weight={600} color={COLORS.grey} maxLines={1} align="center">
          {TEXT.gapRight}
        </T>
      </div>

      {/* dashed divider, then a question mark between the two assessments */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line
          opacity={divider > 0 ? 1 : 0}
          x1={960}
          y1={PANEL.top}
          x2={960}
          y2={PANEL.top + PANEL.h * divider}
          stroke={COLORS.grey}
          strokeWidth={6}
          strokeDasharray="22 16"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 960 - 90,
          top: PANEL.top + PANEL.h / 2 - 90,
          width: 180,
          height: 180,
          borderRadius: 90,
          background: COLORS.navy,
          border: `6px solid ${COLORS.grey}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: q,
          transform: `scale(${0.6 + 0.4 * q + Math.sin(frame * 0.12) * 0.02 * q})`,
        }}
      >
        <T size={130} font="heading" maxLines={1} align="center" lineHeight={1}>
          ?
        </T>
      </div>
      <IllustrationTag opacity={fade(frame, 4, 14)} />
    </AbsoluteFill>
  );
};
