import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captions } from "../captions";
import { fonts, layout, palette, phases, type Lang } from "../config";

const useIn = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame, fps, config: { damping: 200 }, durationInFrames: layout.textIn });
};

/** Title card. Content stays above y = 771 so the bottom-right safe zone is empty. */
export const IntroCard: React.FC<{ lang: Lang }> = ({ lang }) => {
  const p = useIn();
  const c = captions.intro;
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top: 230,
        width: 1600,
        opacity: p,
        transform: `translateY(${(1 - p) * layout.textSlidePx}px)`,
        color: palette.ink,
      }}
    >
      <div style={{ width: 120, height: 10, borderRadius: 5, background: palette.teal, marginBottom: 36 }} />
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 168, lineHeight: 1.02 }}>{c.title_en}</div>
      <div style={{ fontFamily: fonts.body, fontWeight: 400, fontSize: 64, lineHeight: 1.2, marginTop: 28 }}>
        {lang === "en" ? c.line_en : c.line_id}
      </div>
    </div>
  );
};

/** Closing card: mockup statement + step-list recap. No claims. */
export const OutroCard: React.FC<{ lang: Lang }> = ({ lang }) => {
  const p = useIn();
  const c = captions.outro;
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top: 120,
        width: 1600,
        opacity: p,
        transform: `translateY(${(1 - p) * layout.textSlidePx}px)`,
        color: palette.ink,
      }}
    >
      <div style={{ width: 120, height: 10, borderRadius: 5, background: palette.teal, marginBottom: 32 }} />
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 84, lineHeight: 1.06, maxWidth: 1400, textWrap: "balance" }}>
        {lang === "en" ? c.title_en : c.title_id}
      </div>
      <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 38, color: palette.amber, marginTop: 40 }}>
        {lang === "en" ? c.line_en : c.line_id}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 640px)",
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(4, 68px)",
          columnGap: 60,
          marginTop: 20,
          fontFamily: fonts.body,
          fontWeight: 600,
          fontSize: 38,
        }}
      >
        {phases.map((ph, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: palette.teal,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.heading,
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
            <div>{ph[lang]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
