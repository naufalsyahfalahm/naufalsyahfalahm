import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import {
  avoidPlaceholders,
  fonts,
  layout,
  palette,
  recordings,
  showMockupBadge,
  segmentStarts,
  segments,
  type Lang,
  type Segment,
} from "./config";
import { assets } from "./generated/assets";
import { Background } from "./components/Background";
import { Badge, ResultBadge } from "./components/Badge";
import { IntroCard, OutroCard } from "./components/Cards";
import { FocusBox } from "./components/FocusBox";
import { PhoneFrame } from "./components/PhoneFrame";
import { RecordingClip } from "./components/RecordingClip";
import { ScreenSwap } from "./components/ScreenSwap";
import { StepPanel } from "./components/StepPanel";
import { Stepper } from "./components/Stepper";
import { TapRipple } from "./components/TapRipple";

export type WalkthroughProps = { lang: Lang };

/** Static screen with optional push-in, focus box and tap ripple (all in the same zoomed layer so they track the UI). */
const StillScreen: React.FC<{ seg: Segment }> = ({ seg }) => {
  const frame = useCurrentFrame();
  const scale = seg.pushIn
    ? interpolate(frame, [0, seg.frames], [1, layout.pushIn], { extrapolateRight: "clamp" })
    : 1;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>
        <Img
          src={staticFile(seg.screen as string)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {seg.focus ? <FocusBox box={seg.focus.box} delay={seg.focus.delay} hold={seg.focus.hold} dim={seg.focus.dim} /> : null}
        {seg.ripple ? <TapRipple x={seg.ripple.x} y={seg.ripple.y} delay={seg.ripple.delay} /> : null}
      </div>
    </div>
  );
};

const ClipScreen: React.FC<{ seg: Segment }> = ({ seg }) => {
  const r = recordings[seg.recording as keyof typeof recordings];
  const from = avoidPlaceholders ? r.clean.from : 0;
  const to = avoidPlaceholders ? r.clean.to : r.frames - 1;
  const length = Math.min(to - from + 1, seg.frames);
  return <RecordingClip rec={seg.recording as keyof typeof recordings} startFrom={from} length={length} />;
};

export const Walkthrough: React.FC<WalkthroughProps> = ({ lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const firstApp = segments.findIndex((s) => s.showsApp);
  const lastApp = segments.length - 1 - [...segments].reverse().findIndex((s) => s.showsApp);
  const appStart = segmentStarts[firstApp];
  const appEnd = segmentStarts[lastApp] + segments[lastApp].frames;

  const phoneIn = spring({ frame: frame - appStart, fps, config: { damping: 200 }, durationInFrames: layout.crossfade });
  const phoneOut = spring({ frame: frame - appEnd, fps, config: { damping: 200 }, durationInFrames: layout.crossfade });
  const appOpacity = phoneIn * (1 - phoneOut);

  const current = segments.findIndex((_, i) => frame >= segmentStarts[i] && frame < segmentStarts[i] + segments[i].frames);
  const cur = segments[Math.max(0, current)];

  return (
    <AbsoluteFill style={{ background: palette.navy, fontFamily: fonts.body }}>
      <Background />
      {assets.voiceover ? <Audio src={staticFile("audio/voiceover.wav")} /> : null}

      <PhoneFrame opacity={appOpacity}>
        {segments.map((seg, i) =>
          seg.showsApp ? (
            <Sequence
              key={seg.id}
              from={segmentStarts[i]}
              durationInFrames={seg.frames + (i === lastApp ? 0 : layout.crossfade)}
              premountFor={30}
            >
              <ScreenSwap>{seg.kind === "still" ? <StillScreen seg={seg} /> : <ClipScreen seg={seg} />}</ScreenSwap>
            </Sequence>
          ) : null,
        )}
      </PhoneFrame>

      {cur.showsApp ? <Stepper active={cur.activePhases} lang={lang} opacity={appOpacity} /> : null}

      {segments.map((seg, i) => (
        <Sequence key={seg.id} from={segmentStarts[i]} durationInFrames={seg.frames} layout="none">
          {seg.id === "intro" ? <IntroCard lang={lang} /> : seg.id === "outro" ? <OutroCard lang={lang} /> : <StepPanel id={seg.id} lang={lang} />}
          {seg.result ? <ResultBadge /> : null}
        </Sequence>
      ))}

      {showMockupBadge ? <Badge /> : null}
    </AbsoluteFill>
  );
};
