import React from "react";
import { fonts, layout, palette, resultBadgeText, badgeText } from "../config";

/** Persistent label required by README.txt: bottom-left, 48 px safe margin, up to three lines so it stays left of the phone. */
export const Badge: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: layout.safeMargin,
      bottom: layout.safeMargin,
      width: 344,
      boxSizing: "border-box",
      padding: "10px 14px",
      borderRadius: 18,
      background: palette.ink,
      color: palette.navy,
      fontFamily: fonts.body,
      fontWeight: 600,
      fontSize: 36,
      lineHeight: 1.2,
      borderLeft: `8px solid ${palette.amber}`,
      letterSpacing: -0.2,
    }}
  >
    {badgeText.split(/ (?=\()/).map((part, i) => (
      <div key={i}>{part}</div>
    ))}
  </div>
);

/** Extra label on result scenes. Sits under the step panel, ends at x = 1410, left of the safe zone (x >= 1426). */
export const ResultBadge: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: layout.panel.x,
      top: 730,
      width: 350,
      boxSizing: "border-box",
      padding: "12px 16px",
      borderRadius: 18,
      background: palette.amber,
      color: palette.navy,
      fontFamily: fonts.body,
      fontWeight: 600,
      fontSize: 36,
      lineHeight: 1.2,
    }}
  >
    {resultBadgeText}
  </div>
);
