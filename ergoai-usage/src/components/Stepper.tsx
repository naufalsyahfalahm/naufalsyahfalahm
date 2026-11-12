import React from "react";
import { fonts, layout, palette, phases, type Lang } from "../config";

const ROW = 112;
const CIRCLE = 52;

const Check: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** Vertical stepper, left edge. Active = teal, completed = green with check, upcoming = muted outline. */
export const Stepper: React.FC<{ active: number[]; lang: Lang; opacity: number }> = ({ active, lang, opacity }) => {
  const first = Math.min(...active);
  return (
    <div style={{ position: "absolute", left: layout.safeMargin, top: 64, width: 336, opacity, fontFamily: fonts.body }}>
      {phases.map((p, i) => {
        const isActive = active.includes(i);
        const done = i < first;
        return (
          <div
            key={i}
            style={{
              position: "relative",
              height: ROW,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxSizing: "border-box",
              padding: "0 10px",
              margin: 0,
              borderRadius: 22,
              background: isActive ? palette.teal : "transparent",
              color: isActive ? "#FFFFFF" : done ? palette.ink : "rgba(244,247,249,0.72)",
            }}
          >
            <div
              style={{
                width: CIRCLE,
                height: CIRCLE,
                flex: "none",
                borderRadius: CIRCLE / 2,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done ? palette.green : isActive ? "#FFFFFF" : "transparent",
                border: done || isActive ? "none" : "3px solid rgba(244,247,249,0.55)",
                color: isActive ? palette.teal : "rgba(244,247,249,0.8)",
                fontFamily: fonts.heading,
                fontWeight: 700,
                fontSize: 36,
              }}
            >
              {done ? <Check /> : i + 1}
            </div>
            <div style={{ fontSize: 36, lineHeight: 1.12, fontWeight: 600 }}>{p[lang]}</div>
          </div>
        );
      })}
    </div>
  );
};
