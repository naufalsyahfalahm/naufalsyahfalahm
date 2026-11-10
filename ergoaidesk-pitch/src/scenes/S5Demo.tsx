import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  COLORS,
  DEMO_PARTS,
  FILES,
  MOCKUP_LABEL,
  RECORDINGS,
  SAFE,
  SCENES,
  TEXT,
  demoMode,
  questionnaireName,
  recordingsAreMockups,
  type RecordingSpec,
} from "../config";
import { PhoneFrame } from "../components/PhoneFrame";
import { Placeholder } from "../components/Placeholder";
import { RecordingSlot, ScreenImage, useScreenGeometry } from "../components/Media";
import { T } from "../components/Text";
import { hasAsset } from "../lib/assets";
import { easeInOut, fade, prog } from "../lib/motion";

const OVERLAP = 10; // previous part stays underneath while the next dissolves in
const SCREEN_H = 900;
const SCREEN_W = Math.round((SCREEN_H * 780) / 1688); // matches the 780x1688 recordings

const PhoneSlot: React.FC<{
  screenW: number;
  screenH: number;
  zoomTo?: number; // slow push-in over the part (used while a clip holds its last frame)
  dur?: number;
  children: React.ReactNode;
}> = ({ screenW, screenH, zoomTo = 1, dur = 1, children }) => {
  const frame = useCurrentFrame();
  const k = prog(frame, 0, OVERLAP);
  const zoom = zoomTo === 1 ? 1 : 1 + (zoomTo - 1) * prog(frame, OVERLAP, Math.max(dur, OVERLAP + 1), easeInOut);
  return (
    <div
      style={{
        position: "absolute",
        right: SAFE,
        top: (1080 - (screenH + 34)) / 2,
        opacity: k,
        transform: `translateX(${(1 - k) * 36}px) scale(${zoom})`,
      }}
    >
      <PhoneFrame screenW={screenW} screenH={screenH}>
        {children}
      </PhoneFrame>
    </div>
  );
};

const Column: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const o = fade(frame, 6, 12, dur, 8);
  return (
    <div style={{ position: "absolute", left: SAFE, top: 250, width: 1140, opacity: o, transform: `translateY(${(1 - prog(frame, 6, 24)) * 20}px)` }}>
      {children}
    </div>
  );
};

const MockupChip: React.FC = () => (
  <div style={{ display: "inline-block", marginTop: 36, border: `3px solid ${COLORS.grey}`, borderRadius: 999, padding: "4px 28px" }}>
    <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
      {MOCKUP_LABEL}
    </T>
  </div>
);

const RecordingPart: React.FC<{
  spec: RecordingSpec;
  title: string;
  sub: string;
  extra?: string;
  dur: number;
  zoomTo?: number;
}> = ({ spec, title, sub, extra, dur, zoomTo }) => (
  <AbsoluteFill>
    <Column dur={dur}>
      <T size={72} font="heading" maxLines={1}>
        {title}
      </T>
      {extra ? (
        <T size={44} weight={600} color={COLORS.lilac} maxLines={1} style={{ marginTop: 16 }}>
          {extra}
        </T>
      ) : null}
      <T size={44} color={COLORS.grey} maxLines={2} style={{ marginTop: 16 }}>
        {sub}
      </T>
      {recordingsAreMockups && hasAsset(spec.file) ? <MockupChip /> : null}
    </Column>
    <PhoneSlot screenW={SCREEN_W} screenH={SCREEN_H} zoomTo={zoomTo} dur={dur}>
      <RecordingSlot spec={spec} width={SCREEN_W} height={SCREEN_H} />
    </PhoneSlot>
  </AbsoluteFill>
);

/** photos mode, first 300 frames: real upload screen in a phone frame, slow vertical pan, two callouts. */
const PhotosPart: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const VIEW_H = 780;
  const geo = useScreenGeometry(FILES.screenUpload);
  const present = hasAsset(FILES.screenUpload) && geo;
  const viewW = present ? geo.w : SCREEN_W;
  const viewH = present ? Math.min(VIEW_H, geo.h) : SCREEN_H;
  const pan = present ? prog(frame, 20, dur - 20, easeInOut) * Math.max(0, geo.h - viewH) : 0;
  const call = (at: number) => ({
    opacity: fade(frame, at, 14),
    transform: `translateX(${(1 - prog(frame, at, at + 24)) * -40}px)`,
  });
  const card: React.CSSProperties = {
    background: COLORS.navy2,
    borderLeft: `10px solid ${COLORS.teal}`,
    borderRadius: 18,
    padding: "18px 32px",
    marginBottom: 28,
  };
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: SAFE, top: 300, width: 1000 }}>
        <div style={{ ...card, ...call(36) }}>
          <T size={44} weight={600} maxLines={2}>
            {TEXT.demo.photoSide}
          </T>
        </div>
        <div style={{ ...card, ...call(130) }}>
          <T size={44} weight={600} maxLines={2}>
            {TEXT.demo.photoTop}
          </T>
        </div>
      </div>
      <PhoneSlot screenW={viewW} screenH={viewH}>
        {present ? (
          <ScreenImage file={FILES.screenUpload} width={viewW} offsetY={pan} />
        ) : (
          <Placeholder label="[LAYAR APP: ganti app-upload-screen.png]" style={{ width: viewW, height: viewH }} />
        )}
      </PhoneSlot>
    </AbsoluteFill>
  );
};

type Part = { key: string; from: number; to: number; render: (dur: number) => React.ReactNode };

const buildParts = (): Part[] => {
  const q: Part = {
    key: "questionnaire",
    ...DEMO_PARTS.questionnaire,
    render: (dur) => (
      <RecordingPart
        spec={RECORDINGS.questionnaire}
        title={TEXT.demo.questionnaireTitle}
        extra={questionnaireName || undefined}
        sub={TEXT.demo.questionnaireSub}
        dur={dur}
      />
    ),
  };
  const d: Part = {
    key: "dashboard",
    ...DEMO_PARTS.dashboard,
    render: (dur) => (
      <RecordingPart spec={RECORDINGS.dashboard} title={TEXT.demo.dashboardTitle} sub={TEXT.demo.dashboardSub} dur={dur} zoomTo={1.06} />
    ),
  };
  const pose = (range: { from: number; to: number }, rate: number): Part => ({
    key: "pose",
    ...range,
    render: (dur) => (
      <RecordingPart spec={{ ...RECORDINGS.pose, rate }} title={TEXT.demo.poseTitle} sub={TEXT.demo.poseSub} dur={dur} />
    ),
  });
  return demoMode === "photos"
    ? [{ key: "photos", ...DEMO_PARTS.photos, render: (dur) => <PhotosPart dur={dur} /> }, pose(DEMO_PARTS.pose, RECORDINGS.pose.rate), q, d]
    : [pose(DEMO_PARTS.poseVideoMode, RECORDINGS.pose.rateVideoMode ?? RECORDINGS.pose.rate), q, d];
};

export const SceneDemo: React.FC = () => {
  const parts = buildParts();
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      {parts.map((p, i) => {
        const last = i === parts.length - 1;
        const dur = p.to - p.from + (last ? 0 : OVERLAP);
        return (
          <Sequence key={p.key} from={p.from - SCENES.demo.from} durationInFrames={dur} name={p.key}>
            {p.render(dur)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
