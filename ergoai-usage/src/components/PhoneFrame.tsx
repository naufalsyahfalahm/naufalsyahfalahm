import React from "react";
import { AbsoluteFill } from "remotion";
import { height, layout } from "../config";

/** Rounded phone frame, 390:844, centred at x = layout.phoneCenterX. Children fill the screen (clipped, no distortion). */
export const PhoneFrame: React.FC<{ opacity?: number; children: React.ReactNode }> = ({ opacity = 1, children }) => {
  const w = layout.phoneWidth;
  const h = layout.phoneHeight;
  return (
    <div
      style={{
        position: "absolute",
        left: layout.phoneCenterX - w / 2,
        top: (height - h) / 2,
        width: w,
        height: h,
        borderRadius: 44,
        overflow: "hidden",
        background: "#FFFFFF",
        opacity,
        boxShadow: "0 0 0 4px rgba(244,247,249,0.14), 0 28px 70px rgba(0,0,0,0.45)",
      }}
    >
      <AbsoluteFill>{children}</AbsoluteFill>
    </div>
  );
};
