import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captions } from "../captions";
import { fonts, layout, palette, ui, type Lang, type SegmentId } from "../config";

/** Right block x 1060-1860, y 200-700: step number, title (68 px), one-line description (38 px). Text animates in over 12 frames. */
export const StepPanel: React.FC<{ id: SegmentId; lang: Lang }> = ({ id, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = captions[id];
  const p = spring({ frame, fps, config: { damping: 200 }, durationInFrames: layout.textIn });
  const title = lang === "en" ? c.title_en : c.title_id;
  const line = lang === "en" ? c.line_en : c.line_id;
  const u = ui[lang];
  const multi = typeof c.step === "string";
  return (
    <div
      style={{
        position: "absolute",
        left: layout.panel.x,
        top: layout.panel.y,
        width: layout.panel.w,
        height: layout.panel.h,
        opacity: p,
        transform: `translateY(${(1 - p) * layout.textSlidePx}px)`,
        color: palette.ink,
      }}
    >
      {c.step !== null ? (
        <div style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 38, color: palette.amber, letterSpacing: 1 }}>
          {multi ? u.steps : u.step} {c.step} {u.of} 7
        </div>
      ) : null}
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 68, lineHeight: 1.08, marginTop: 20, textWrap: "balance" }}>{title}</div>
      <div style={{ fontFamily: fonts.body, fontWeight: 400, fontSize: 38, lineHeight: 1.35, marginTop: 28 }}>{line}</div>
    </div>
  );
};
