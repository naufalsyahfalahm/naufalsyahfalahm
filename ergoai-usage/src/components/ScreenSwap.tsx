import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../config";

/**
 * Incoming screen: 10-frame crossfade + 24 px slide (spring, damping 200, no bounce).
 * The outgoing screen stays opaque underneath for the same 10 frames (Walkthrough extends its Sequence).
 */
export const ScreenSwap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 }, durationInFrames: layout.crossfade });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: p,
        transform: `translateX(${(1 - p) * layout.slidePx}px)`,
      }}
    >
      {children}
    </div>
  );
};
