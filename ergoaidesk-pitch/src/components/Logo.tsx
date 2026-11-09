import React from "react";
import { Img } from "remotion";
import { COLORS, FILES } from "../config";
import { hasAsset, src } from "../lib/assets";

/** Uses public/brand/logo.png when supplied; otherwise a plain vector mark (placeholder, not an official logo). */
export const LogoMark: React.FC<{ size: number }> = ({ size }) =>
  hasAsset(FILES.logo) ? (
    <Img src={src(FILES.logo)} style={{ width: size, height: size, objectFit: "contain" }} />
  ) : (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width={64} height={64} rx={16} fill={COLORS.teal} />
      <path d="M14 38 L24 38 L29 22 L36 46 L41 32 L50 32" fill="none" stroke={COLORS.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={48} cy={16} r={6} fill={COLORS.lilac} />
    </svg>
  );
