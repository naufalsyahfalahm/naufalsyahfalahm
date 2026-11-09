import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { COLORS, SAFE, TEXT } from "../config";
import { IllustrationTag } from "../components/Tag";
import { T } from "../components/Text";
import { FootageSlot } from "../components/Media";
import { NeckCloseUp, PersonAtLaptop } from "../components/Illus";
import { easeInOut, fade, prog } from "../lib/motion";

const CUT = 330; // scene-local frame where the illustration wipes to the close-up
const PANEL = { w: 1020, h: 646, top: 210 };

/** Illustrated stand-in for the hook footage: slow slump (time-lapse), then a hand rubbing the neck. */
const HookIllustration: React.FC = () => {
  const frame = useCurrentFrame();
  const slump = prog(frame, 0, 300, easeInOut);
  const turns = prog(frame, 0, 300, Easing.linear) * 6;
  const wipe = prog(frame, CUT, CUT + 14, easeInOut);
  const o = fade(frame, 0, 10);
  const s = PANEL.w / 1200;
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <div
        style={{
          position: "absolute",
          left: (1920 - PANEL.w) / 2,
          top: PANEL.top,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 28,
          overflow: "hidden",
          background: COLORS.navy2,
          opacity: o,
          transform: `translateY(${(1 - prog(frame, 0, 24)) * 40}px)`,
        }}
      >
        <div style={{ transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <PersonAtLaptop slump={slump} clockTurns={turns} />
        </div>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
          <div style={{ transform: `scale(${s})`, transformOrigin: "0 0" }}>
            <NeckCloseUp t={Math.max(0, frame - CUT)} />
          </div>
        </div>
        <IllustrationTag opacity={o} style={{ top: 16, right: 16 }} />
      </div>
    </AbsoluteFill>
  );
};

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const up = prog(frame, 20, 60);
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <FootageSlot kind="hook" fallback={<HookIllustration />} />
      {/* scrim keeps the headline legible if real footage is supplied */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,34,51,0.75) 0%, rgba(14,34,51,0) 38%)" }} />
      <div
        style={{
          position: "absolute",
          left: SAFE,
          right: SAFE,
          top: 100,
          opacity: up,
          transform: `translateY(${(1 - up) * 24}px)`,
        }}
      >
        <T size={76} font="heading" maxLines={1} align="center">
          {TEXT.hook}
        </T>
      </div>
    </AbsoluteFill>
  );
};
