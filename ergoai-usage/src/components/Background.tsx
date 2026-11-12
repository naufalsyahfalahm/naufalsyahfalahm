import React from "react";
import { AbsoluteFill } from "remotion";
import { palette } from "../config";

/** Navy with a very subtle grid. Static, so a background-only reference still can be diffed against any frame. */
export const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: palette.navy,
      backgroundImage:
        "linear-gradient(rgba(244,247,249,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(244,247,249,0.035) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }}
  />
);
