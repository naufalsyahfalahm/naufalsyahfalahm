import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ADVANTAGES,
  BENEFITS_FOOTNOTE,
  COLORS,
  FILES,
  SAFE,
  TEXT,
  benefits,
} from "../config";
import { LogoMark } from "../components/Logo";
import { PhoneFrame } from "../components/PhoneFrame";
import { Placeholder } from "../components/Placeholder";
import { ScreenImage, useScreenGeometry } from "../components/Media";
import { T } from "../components/Text";
import { hasAsset } from "../lib/assets";
import { easeInOut, fade, prog, useSpring } from "../lib/motion";

// Reveal frames are scene-local and follow the voiceover: "We developed ERGO-AI DESK" 57, "YOLOv11-based
// computer vision" 258, "self-report questionnaires" 422, "perceived psychological strain" 620,
// "By integrating both assessments" 720, "targeted workplace improvement recommendations" ~880.
const NODE_W = 560;
const COL_A = 0;
const COL_B = 664;
const GROUP_TOP = 200;
const CENTER_SHIFT = 252; // diagram sits centred until the phone arrives
const F = TEXT.flow;

type NodeDef = {
  id: string;
  x: number;
  y: number;
  h: number;
  lines: readonly string[];
  fill: string;
  color: string;
  at: number; // scene-local reveal frame
};

const NODES: NodeDef[] = [
  {
    id: "camera",
    x: COL_A,
    y: 0,
    h: 96,
    lines: [F.camera],
    fill: COLORS.teal,
    color: COLORS.white,
    at: 285,
  },
  {
    id: "pose",
    x: COL_A,
    y: 140,
    h: 136,
    lines: F.pose,
    fill: COLORS.teal,
    color: COLORS.white,
    at: 325,
  },
  {
    id: "physical",
    x: COL_A,
    y: 320,
    h: 96,
    lines: [F.physical],
    fill: COLORS.teal,
    color: COLORS.white,
    at: 380,
  },
  {
    id: "questionnaire",
    x: COL_B,
    y: 160,
    h: 96,
    lines: [F.questionnaire],
    fill: COLORS.lilac,
    color: COLORS.navy,
    at: 440,
  },
  {
    id: "psych",
    x: COL_B,
    y: 320,
    h: 96,
    lines: [F.psych],
    fill: COLORS.lilac,
    color: COLORS.navy,
    at: 625,
  },
  {
    id: "merge",
    x: COL_A,
    y: 464,
    h: 136,
    lines: F.merge,
    fill: COLORS.white,
    color: COLORS.navy,
    at: 735,
  },
  {
    id: "recs",
    x: COL_B,
    y: 464,
    h: 136,
    lines: F.recs,
    fill: COLORS.grey,
    color: COLORS.navy,
    at: 865,
  },
];

type Edge = {
  d: string;
  color: string;
  at: number;
  head: "teal" | "lilac" | "white";
};
const EDGES: Edge[] = [
  { d: "M280 100 V136", color: COLORS.teal, at: 310, head: "teal" },
  { d: "M280 280 V316", color: COLORS.teal, at: 358, head: "teal" },
  { d: "M944 260 V316", color: COLORS.lilac, at: 600, head: "lilac" },
  { d: "M280 420 V460", color: COLORS.white, at: 720, head: "white" },
  {
    d: "M944 420 V436 Q944 440 940 440 H484 Q480 440 480 444 V460",
    color: COLORS.white,
    at: 720,
    head: "white",
  },
  { d: "M564 532 H660", color: COLORS.white, at: 850, head: "white" },
];

const Node: React.FC<NodeDef> = ({ x, y, h, lines, fill, color, at }) => {
  const k = useSpring(at, { damping: 18, stiffness: 120 });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_W,
        height: h,
        boxSizing: "border-box",
        borderRadius: 22,
        background: fill,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(1, k * 1.4),
        transform: `translateY(${(1 - k) * 28}px) scale(${0.94 + 0.06 * k})`,
      }}
    >
      <T
        size={44}
        font="heading"
        weight={700}
        color={color}
        maxLines={lines.length}
        align="center"
        lineHeight={1.1}
      >
        {lines.map((l, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <br /> : null}
            {l}
          </React.Fragment>
        ))}
      </T>
    </div>
  );
};

const HEAD_ID = {
  teal: "ah-teal",
  lilac: "ah-lilac",
  white: "ah-white",
} as const;

const Flow: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <svg
        width={1224}
        height={620}
        viewBox="0 0 1224 620"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <defs>
          {(["teal", "lilac", "white"] as const).map((c) => (
            <marker
              key={c}
              id={HEAD_ID[c]}
              markerWidth={24}
              markerHeight={24}
              refX={20}
              refY={12}
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 1 L22 12 L0 23 Z" fill={COLORS[c]} />
            </marker>
          ))}
        </defs>
        {EDGES.map((e, i) => {
          const k = prog(frame, e.at, e.at + 22);
          return (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke={e.color}
              strokeWidth={6}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - k}
              markerEnd={k > 0.98 ? `url(#${HEAD_ID[e.head]})` : undefined}
            />
          );
        })}
      </svg>
      {NODES.map((n) => (
        <Node key={n.id} {...n} />
      ))}
    </>
  );
};

const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const intro = useSpring(20, { damping: 200 });
  const move = prog(frame, 230, 290, easeInOut);
  const s = 2.6 - 1.6 * move;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          top: SAFE,
          transformOrigin: "0 0",
          transform: `translate(${239 * (1 - move)}px, ${226 * (1 - move)}px) scale(${s})`,
          opacity: intro,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <LogoMark size={64} />
        <T
          size={60}
          font="heading"
          maxLines={1}
          style={{ whiteSpace: "nowrap" }}
        >
          {TEXT.wordmark}
        </T>
      </div>
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 640,
          opacity: fade(frame, 105, 20, 235, 20),
        }}
      >
        <T
          size={44}
          weight={600}
          color={COLORS.grey}
          maxLines={1}
          align="center"
        >
          {TEXT.wordmarkSub}
        </T>
      </div>
    </>
  );
};

const HeaderPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const k = prog(frame, 540, 610);
  const geo = useScreenGeometry(FILES.screenHeader, 424);
  const present = hasAsset(FILES.screenHeader) && geo;
  const w = present ? geo.w : 424;
  const h = present ? geo.h : 300;
  return (
    <div
      style={{
        position: "absolute",
        left: 1920 - SAFE - (w + 34),
        top: GROUP_TOP,
        opacity: k,
        transform: `translateX(${(1 - k) * 420}px)`,
      }}
    >
      <PhoneFrame screenW={w} screenH={h} open fadeH={28}>
        {present ? (
          <ScreenImage file={FILES.screenHeader} width={w} />
        ) : (
          <Placeholder
            label="[LAYAR APP: ganti app-home-header-crop.png]"
            style={{ width: w, height: h }}
            size={44}
          />
        )}
      </PhoneFrame>
    </div>
  );
};

/** Optional: only when config.benefits is set. Always carries the "designed functions" footnote. */
const BenefitsBeat: React.FC = () => {
  const frame = useCurrentFrame();
  if (!benefits) return null;
  const o = fade(frame, 905, 16);
  return (
    <AbsoluteFill
      style={{
        background: COLORS.navy,
        opacity: o,
        padding: SAFE,
        justifyContent: "center",
        gap: 28,
      }}
    >
      {benefits.map((b, i) => (
        <T key={i} size={56} font="heading" maxLines={2}>
          {b}
        </T>
      ))}
      <T size={44} color={COLORS.grey} maxLines={2} style={{ marginTop: 24 }}>
        {BENEFITS_FOOTNOTE}
      </T>
    </AbsoluteFill>
  );
};

/** App advantages, top right beside the wordmark; always with the "designed functions" footnote. */
const AdvantageBanner: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 700,
        right: SAFE,
        top: 88,
        opacity: fade(frame, 560, 20),
      }}
    >
      <T size={44} weight={600} maxLines={1}>
        {ADVANTAGES.app.join(" \u00B7 ")}
      </T>
      <T size={44} color={COLORS.grey} maxLines={1}>
        {BENEFITS_FOOTNOTE}
      </T>
    </div>
  );
};

export const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = prog(frame, 540, 610, easeInOut);
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <Wordmark />
      <div
        style={{
          position: "absolute",
          left: SAFE + CENTER_SHIFT * (1 - shift),
          top: GROUP_TOP,
          width: 1224,
          height: 620,
        }}
      >
        <Flow />
      </div>
      <HeaderPhone />
      <AdvantageBanner />
      <BenefitsBeat />
    </AbsoluteFill>
  );
};
