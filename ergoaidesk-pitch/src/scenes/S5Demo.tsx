import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  COLORS,
  DEMO_PARTS,
  FILES,
  ADVANTAGES,
  BENEFITS_FOOTNOTE,
  MOCKUP_LABEL,
  RECORDINGS,
  SAFE,
  SCENES,
  TEXT,
  demoMode,
  questionnaireName,
  showMockupLabel,
  type RecordingSpec,
} from "../config";
import { PhoneFrame } from "../components/PhoneFrame";
import { Placeholder } from "../components/Placeholder";
import {
  RecordingSlot,
  ScreenImage,
  useScreenGeometry,
} from "../components/Media";
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
  const zoom =
    zoomTo === 1
      ? 1
      : 1 +
        (zoomTo - 1) *
          prog(frame, OVERLAP, Math.max(dur, OVERLAP + 1), easeInOut);
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

const Column: React.FC<{ dur: number; children: React.ReactNode }> = ({
  dur,
  children,
}) => {
  const frame = useCurrentFrame();
  const o = fade(frame, 6, 12, dur, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE,
        top: 250,
        width: 1140,
        opacity: o,
        transform: `translateY(${(1 - prog(frame, 6, 24)) * 20}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** The mockup label. Off by default (config.showMockupLabel). */
const MockupChip: React.FC = () => (
  <div
    style={{
      display: "inline-block",
      marginTop: 36,
      border: `3px solid ${COLORS.grey}`,
      borderRadius: 999,
      padding: "4px 28px",
    }}
  >
    <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
      {MOCKUP_LABEL}
    </T>
  </div>
);

/** An app advantage, always followed by the "designed functions" footnote. */
const Advantage: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ marginTop: 40 }}>
    <div style={{ borderLeft: `10px solid ${COLORS.grey}`, paddingLeft: 24 }}>
      <T size={44} weight={600} maxLines={2}>
        {text}
      </T>
      <T size={44} color={COLORS.grey} maxLines={2} style={{ marginTop: 6 }}>
        {BENEFITS_FOOTNOTE}
      </T>
    </div>
    {showMockupLabel ? <MockupChip /> : null}
  </div>
);

const RecordingPart: React.FC<{
  spec: RecordingSpec;
  title: string;
  sub: string;
  extra?: string;
  advantage: string;
  dur: number;
  zoomTo?: number;
}> = ({ spec, title, sub, extra, advantage, dur, zoomTo }) => (
  <AbsoluteFill>
    <Column dur={dur}>
      <T size={72} font="heading" maxLines={1}>
        {title}
      </T>
      {extra ? (
        <T
          size={44}
          weight={600}
          color={COLORS.lilac}
          maxLines={1}
          style={{ marginTop: 16 }}
        >
          {extra}
        </T>
      ) : null}
      <T size={44} color={COLORS.grey} maxLines={2} style={{ marginTop: 16 }}>
        {sub}
      </T>
      <Advantage text={advantage} />
    </Column>
    <PhoneSlot screenW={SCREEN_W} screenH={SCREEN_H} zoomTo={zoomTo} dur={dur}>
      <RecordingSlot spec={spec} width={SCREEN_W} height={SCREEN_H} />
    </PhoneSlot>
  </AbsoluteFill>
);

/**
 * photos mode, first part: two app screens (side view, then top view) in a phone frame with a slow vertical pan,
 * and the two callouts. The screens are the mockup capture screens cropped above their placeholder text.
 */
const ScreenShot: React.FC<{
  file: string;
  label: string;
  viewW: number;
  viewH: number;
  panFrom: number;
  panTo: number;
}> = ({ file, label, viewW, viewH, panFrom, panTo }) => {
  const frame = useCurrentFrame();
  const geo = useScreenGeometry(file, viewW);
  if (!hasAsset(file) || !geo)
    return (
      <Placeholder label={label} style={{ width: viewW, height: viewH }} />
    );
  const pan =
    prog(frame, panFrom, panTo, easeInOut) * Math.max(0, geo.h - viewH);
  return <ScreenImage file={file} width={geo.w} offsetY={pan} />;
};

/** A view title with the points the app analyses in it, shown as chips. */
const ViewBlock: React.FC<{
  title: string;
  items: readonly string[];
  at: number;
  out?: number;
}> = ({ title, items, at, out }) => {
  const frame = useCurrentFrame();
  const o = fade(frame, at, 14, out, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1120,
        opacity: o,
        transform: `translateX(${(1 - prog(frame, at, at + 24)) * -40}px)`,
      }}
    >
      <div style={{ borderLeft: `10px solid ${COLORS.teal}`, paddingLeft: 24 }}>
        <T size={56} font="heading" maxLines={2}>
          {title}
        </T>
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 26 }}
      >
        {items.map((it, i) => {
          const k = prog(frame, at + 16 + i * 11, at + 30 + i * 11);
          return (
            <div
              key={it}
              style={{
                border: `3px solid ${COLORS.teal}`,
                background: COLORS.navy2,
                borderRadius: 999,
                padding: "4px 24px",
                opacity: k,
                transform: `translateY(${(1 - k) * 14}px)`,
              }}
            >
              <T size={44} weight={600} maxLines={1}>
                {it}
              </T>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PhotosPart: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const VIEW_W = 460;
  const VIEW_H = 560;
  const SWAP = 140; // scene-local frame where the superior-view screen takes over
  const swap = prog(frame, SWAP, SWAP + 12);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: SAFE, top: 250, width: 1120 }}>
        <div style={{ position: "relative", height: 330 }}>
          <ViewBlock
            title={TEXT.demo.photoSide}
            items={TEXT.demo.lateralItems}
            at={16}
            out={SWAP + 8}
          />
          <ViewBlock
            title={TEXT.demo.photoTop}
            items={TEXT.demo.superiorItems}
            at={SWAP + 10}
          />
        </div>
        <div style={{ opacity: fade(frame, 60, 16) }}>
          <Advantage text={ADVANTAGES.photos} />
        </div>
      </div>
      <PhoneSlot screenW={VIEW_W} screenH={VIEW_H}>
        <ScreenShot
          file={FILES.screenUpload}
          label="[LAYAR APP: ganti app-upload-screen.png]"
          viewW={VIEW_W}
          viewH={VIEW_H}
          panFrom={20}
          panTo={SWAP + 10}
        />
        <div style={{ position: "absolute", inset: 0, opacity: swap }}>
          <ScreenShot
            file={FILES.screenUploadTop}
            label="[LAYAR APP: ganti app-upload-screen-top.png]"
            viewW={VIEW_W}
            viewH={VIEW_H}
            panFrom={SWAP}
            panTo={dur - 20}
          />
        </div>
      </PhoneSlot>
    </AbsoluteFill>
  );
};

type Part = {
  key: string;
  from: number;
  to: number;
  render: (dur: number) => React.ReactNode;
};

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
        advantage={ADVANTAGES.questionnaire}
        dur={dur}
      />
    ),
  };
  const d: Part = {
    key: "dashboard",
    ...DEMO_PARTS.dashboard,
    render: (dur) => (
      <RecordingPart
        spec={RECORDINGS.dashboard}
        title={TEXT.demo.dashboardTitle}
        sub={TEXT.demo.dashboardSub}
        advantage={ADVANTAGES.dashboard}
        dur={dur}
        zoomTo={1.06}
      />
    ),
  };
  const pose = (range: { from: number; to: number }, rate: number): Part => ({
    key: "pose",
    ...range,
    render: (dur) => (
      <RecordingPart
        spec={{ ...RECORDINGS.pose, rate }}
        title={TEXT.demo.poseTitle}
        sub={TEXT.demo.poseSub}
        advantage={ADVANTAGES.pose}
        dur={dur}
      />
    ),
  });
  return demoMode === "photos"
    ? [
        {
          key: "photos",
          ...DEMO_PARTS.photos,
          render: (dur) => <PhotosPart dur={dur} />,
        },
        pose(DEMO_PARTS.pose, RECORDINGS.pose.rate),
        q,
        d,
      ]
    : [
        pose(
          DEMO_PARTS.poseVideoMode,
          RECORDINGS.pose.rateVideoMode ?? RECORDINGS.pose.rate,
        ),
        q,
        d,
      ];
};

export const SceneDemo: React.FC = () => {
  const parts = buildParts();
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      {parts.map((p, i) => {
        const last = i === parts.length - 1;
        const dur = p.to - p.from + (last ? 0 : OVERLAP);
        return (
          <Sequence
            key={p.key}
            from={p.from - SCENES.demo.from}
            durationInFrames={dur}
            name={p.key}
          >
            {p.render(dur)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
