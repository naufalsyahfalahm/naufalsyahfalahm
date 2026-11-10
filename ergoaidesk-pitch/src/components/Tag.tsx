import React from "react";
import { COLORS, SAFE, TEXT, showIllustrationTag } from "../config";
import { T } from "./Text";

/** "Ilustrasi" tag. Required on every situation illustration; never on real screens, footage or recordings. */
export const IllustrationTag: React.FC<{
  opacity?: number;
  style?: React.CSSProperties;
}> = ({ opacity = 1, style }) =>
  !showIllustrationTag ? null : (
    <div
      style={{
        position: "absolute",
        top: SAFE - 24,
        right: SAFE,
        padding: "4px 24px",
        borderRadius: 999,
        border: `3px solid ${COLORS.grey}`,
        background: "rgba(14,34,51,0.78)",
        opacity,
        ...style,
      }}
    >
      <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
        {TEXT.illustrationTag}
      </T>
    </div>
  );
