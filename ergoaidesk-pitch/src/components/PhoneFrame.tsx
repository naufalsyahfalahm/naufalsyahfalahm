import React from "react";
import { COLORS } from "../config";

export const BEZEL = 14;

/**
 * Plain device frame. `open` draws only the top of a phone that fades out at the bottom
 * (used for the header-only crop so no other part of the app is implied or shown).
 */
export const PhoneFrame: React.FC<{
  screenW: number;
  screenH: number;
  open?: boolean;
  fadeH?: number; // height of the fade-out at the bottom of an open frame
  children: React.ReactNode;
}> = ({ screenW, screenH, open = false, fadeH = 90, children }) => (
  <div
    style={{
      position: "relative",
      width: screenW + 2 * BEZEL,
      height: screenH + (open ? BEZEL : 2 * BEZEL),
      borderRadius: open ? "46px 46px 0 0" : 46,
      background: "#0A1824",
      border: `3px solid ${COLORS.grey}`,
      borderBottomWidth: open ? 0 : 3,
      boxSizing: "border-box",
      padding: BEZEL,
      paddingBottom: open ? 0 : BEZEL,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    }}
  >
    <div
      style={{
        position: "relative",
        width: screenW,
        height: screenH,
        borderRadius: open ? "32px 32px 0 0" : 32,
        overflow: "hidden",
        background: COLORS.navy2,
      }}
    >
      {children}
      {open ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: fadeH,
            background: `linear-gradient(to bottom, rgba(14,34,51,0), ${COLORS.navy})`,
          }}
        />
      ) : null}
    </div>
  </div>
);
