import React from "react";
import { COLORS, showPlaceholderLabels } from "../config";
import { T } from "./Text";

/** Labelled stand-in for a missing slot. Draws nothing that could pass for real UI, keypoints or data. */
export const Placeholder: React.FC<{
  label: string;
  style?: React.CSSProperties;
  size?: number;
}> = ({ label, style, size = 44 }) => (
  <div
    style={{
      boxSizing: "border-box",
      border: `4px dashed ${COLORS.grey}`,
      background: COLORS.navy2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      ...style,
    }}
  >
    {showPlaceholderLabels ? (
      <T size={size} weight={600} color={COLORS.grey} maxLines={4} align="center" style={{ overflowWrap: "anywhere" }}>
        {label}
      </T>
    ) : null}
  </div>
);
