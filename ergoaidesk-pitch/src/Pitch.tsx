import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  COLORS,
  FILES,
  FPS,
  MUSIC_FADE_IN,
  MUSIC_FADE_OUT,
  musicEnabled,
  MUSIC_VOLUME,
  SCENES,
  SCENE_ORDER,
  TOTAL_FRAMES,
  TRANSITIONS,
  VOICEOVER_FADE,
  VOICEOVER_SEGMENTS,
  VOICEOVER_VOLUME,
  type SceneKey,
} from "./config";
import { Captions } from "./components/Caption";
import { hasAsset, src } from "./lib/assets";
import { easeInOut } from "./lib/motion";
import { SceneHook } from "./scenes/S1Hook";
import { SceneProblem } from "./scenes/S2Problem";
import { SceneGap } from "./scenes/S3Gap";
import { SceneSolution } from "./scenes/S4Solution";
import { SceneDemo } from "./scenes/S5Demo";
import { SceneResults } from "./scenes/S6Results";
import { SceneClosing } from "./scenes/S7Closing";

const SCENE_COMPONENTS: Record<SceneKey, React.FC> = {
  hook: SceneHook,
  problem: SceneProblem,
  gap: SceneGap,
  solution: SceneSolution,
  demo: SceneDemo,
  results: SceneResults,
  closing: SceneClosing,
};

/** Wipe: a panel sweeps left to right and fully covers the screen at the cut. Dissolve: dip through navy. */
const Transitions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {TRANSITIONS.map((t) => {
        if (t.type === "cut") return null;
        const half = t.frames / 2;
        if (frame < t.at - half || frame > t.at + half) return null;
        const p = (frame - (t.at - half)) / t.frames;
        if (t.type === "wipe") {
          const x = interpolate(p, [0, 1], [-1920, 1920], {
            easing: easeInOut,
          });
          return (
            <div
              key={t.at}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1920,
                height: 1080,
                transform: `translateX(${x}px)`,
                background: COLORS.navy2,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 14,
                  background: COLORS.grey,
                }}
              />
            </div>
          );
        }
        const o = interpolate(p, [0, 0.5, 1], [0, 1, 0]);
        return (
          <div
            key={t.at}
            style={{
              position: "absolute",
              inset: 0,
              background: COLORS.navy,
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

/** Voiceover laid onto the timeline in pieces (config.VOICEOVER_SEGMENTS); only silences are removed. */
const Voiceover: React.FC = () => {
  if (!VOICEOVER_SEGMENTS)
    return <Audio src={src(FILES.voiceover)} volume={VOICEOVER_VOLUME} />;
  return (
    <>
      {VOICEOVER_SEGMENTS.map((seg, i) => {
        const dur = Math.round((seg.srcTo - seg.srcFrom) * FPS);
        return (
          <Sequence
            key={i}
            name={`voiceover ${i + 1}`}
            from={Math.round(seg.at * FPS)}
            durationInFrames={dur}
          >
            <Audio
              src={src(FILES.voiceover)}
              trimBefore={Math.round(seg.srcFrom * FPS)}
              volume={(f) =>
                VOICEOVER_VOLUME *
                interpolate(
                  f,
                  [0, VOICEOVER_FADE, dur - VOICEOVER_FADE, dur],
                  [0, 1, 1, 0],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              }
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const Pitch: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.navy }}>
    {SCENE_ORDER.map((k) => {
      const Scene = SCENE_COMPONENTS[k];
      return (
        <Sequence
          key={k}
          name={k}
          from={SCENES[k].from}
          durationInFrames={SCENES[k].to - SCENES[k].from}
        >
          <Scene />
        </Sequence>
      );
    })}
    <Transitions />
    <Captions />
    {hasAsset(FILES.voiceover) ? <Voiceover /> : null}
    {musicEnabled && hasAsset(FILES.music) ? (
      <Audio
        src={src(FILES.music)}
        loop
        volume={(f) =>
          interpolate(
            f,
            [0, MUSIC_FADE_IN, TOTAL_FRAMES - MUSIC_FADE_OUT, TOTAL_FRAMES],
            [0, MUSIC_VOLUME, MUSIC_VOLUME, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
        }
      />
    ) : null}
  </AbsoluteFill>
);
