import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { AFFILIATION, CLOSING_CARD_AT, COLORS, TEAM_NAMES, TEXT } from "../config";
import { LogoMark } from "../components/Logo";
import { FootageSlot } from "../components/Media";
import { Placeholder } from "../components/Placeholder";
import { T } from "../components/Text";
import { easeInOut, prog } from "../lib/motion";

const NavyCard: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.navy, alignItems: "center", justifyContent: "center" }}>
    <Placeholder label="[REKAMAN: ganti presenter.mp4]" style={{ border: "none", background: "transparent", color: COLORS.grey }} />
  </AbsoluteFill>
);

export const SceneClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = 1 + 0.08 * prog(frame, 0, CLOSING_CARD_AT + 20, Easing.linear);
  const p = prog(frame, CLOSING_CARD_AT, CLOSING_CARD_AT + 22, easeInOut);
  const item = (at: number) => ({ opacity: prog(frame, at, at + 18), transform: `translateY(${(1 - prog(frame, at, at + 24)) * 24}px)` });
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <FootageSlot kind="presenter" scale={zoom} fallback={<NavyCard />} />
      <AbsoluteFill style={{ background: COLORS.navy, clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`, alignItems: "center", paddingTop: 190 }}>
        <div style={{ ...item(CLOSING_CARD_AT + 10), display: "flex", alignItems: "center", gap: 28 }}>
          <LogoMark size={150} />
          <T size={110} font="heading" maxLines={1} style={{ whiteSpace: "nowrap" }}>
            {TEXT.wordmark}
          </T>
        </div>
        <div style={{ ...item(CLOSING_CARD_AT + 34), marginTop: 44 }}>
          <T size={64} font="heading" weight={500} maxLines={1} align="center" color={COLORS.white} style={{ whiteSpace: "nowrap" }}>
            {TEXT.tagline}
          </T>
        </div>
        <div style={{ ...item(CLOSING_CARD_AT + 70), marginTop: 56, maxWidth: 1500 }}>
          <T size={48} weight={600} maxLines={2} align="center" color={COLORS.grey}>
            {TEAM_NAMES.join(" · ")}
          </T>
        </div>
        <div style={{ ...item(CLOSING_CARD_AT + 90), marginTop: 28 }}>
          <T size={48} weight={600} maxLines={1} align="center" color={COLORS.lilac}>
            {AFFILIATION}
          </T>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
