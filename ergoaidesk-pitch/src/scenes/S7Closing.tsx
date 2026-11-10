import React from "react";
import { AbsoluteFill, Easing, Img, useCurrentFrame } from "remotion";
import {
  AFFILIATION,
  CLOSING_CARD_AT,
  CLOSING_LOGOS,
  COLORS,
  TEAM_NAMES,
  TEXT,
} from "../config";
import { LogoMark } from "../components/Logo";
import { FootageSlot } from "../components/Media";
import { Placeholder } from "../components/Placeholder";
import { T } from "../components/Text";
import { assetInfo, hasAsset, src } from "../lib/assets";
import { easeInOut, prog } from "../lib/motion";

const NavyCard: React.FC = () => (
  <AbsoluteFill
    style={{
      background: COLORS.navy,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Placeholder
      label="[REKAMAN: ganti presenter.mp4]"
      style={{ border: "none", background: "transparent", color: COLORS.grey }}
    />
  </AbsoluteFill>
);

const PLATE_H = 156;
const PAD_X = 26;

/** One logo on its own plate. Drawn at most at native pixel size (never enlarged), no filters. */
const LogoPlate: React.FC<{
  file: string;
  name: string;
  plate: "white" | "navy";
  maxH: number;
  at: number;
}> = ({ file, name, plate, maxH, at }) => {
  const frame = useCurrentFrame();
  const info = assetInfo(file);
  if (!info.exists || !info.width || !info.height) return null;
  const k = Math.min(1, maxH / info.height, 400 / info.width);
  const w = Math.round(info.width * k);
  const h = Math.round(info.height * k);
  const p = prog(frame, at, at + 22);
  return (
    <div
      style={{
        width: w + 2 * PAD_X,
        height: PLATE_H,
        borderRadius: 20,
        background: plate === "white" ? COLORS.white : COLORS.navy2,
        border: plate === "white" ? "none" : `3px solid ${COLORS.grey}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 28}px)`,
      }}
    >
      <Img
        src={src(file)}
        alt={name}
        style={{ width: w, height: h, display: "block" }}
      />
    </div>
  );
};

export const SceneClosing: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = 1 + 0.08 * prog(frame, 0, CLOSING_CARD_AT + 20, Easing.linear);
  const p = prog(frame, CLOSING_CARD_AT, CLOSING_CARD_AT + 22, easeInOut);
  const item = (at: number) => ({
    opacity: prog(frame, at, at + 18),
    transform: `translateY(${(1 - prog(frame, at, at + 24)) * 24}px)`,
  });
  const logos = CLOSING_LOGOS.filter((l) => hasAsset(l.file));
  const ugmShown = CLOSING_LOGOS.some(
    (l) => l.name === "Universitas Gadjah Mada" && hasAsset(l.file),
  );
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <FootageSlot kind="presenter" scale={zoom} fallback={<NavyCard />} />
      <AbsoluteFill
        style={{
          background: COLORS.navy,
          clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`,
          alignItems: "center",
          paddingTop: 150,
        }}
      >
        <div
          style={{
            ...item(CLOSING_CARD_AT + 10),
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <LogoMark size={130} />
          <T
            size={100}
            font="heading"
            maxLines={1}
            style={{ whiteSpace: "nowrap" }}
          >
            {TEXT.wordmark}
          </T>
        </div>
        <div style={{ ...item(CLOSING_CARD_AT + 34), marginTop: 30 }}>
          <T
            size={64}
            font="heading"
            weight={500}
            maxLines={1}
            align="center"
            color={COLORS.white}
            style={{ whiteSpace: "nowrap" }}
          >
            {TEXT.tagline}
          </T>
        </div>
        <div
          style={{
            ...item(CLOSING_CARD_AT + 70),
            marginTop: 36,
            maxWidth: 1500,
          }}
        >
          <T
            size={48}
            weight={600}
            maxLines={2}
            align="center"
            color={COLORS.grey}
          >
            {TEAM_NAMES.join(" · ")}
          </T>
        </div>
        {ugmShown ? null : (
          <div style={{ ...item(CLOSING_CARD_AT + 90), marginTop: 20 }}>
            <T
              size={48}
              weight={600}
              maxLines={1}
              align="center"
              color={COLORS.lilac}
            >
              {AFFILIATION}
            </T>
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 44,
          }}
        >
          {logos.map((l, i) => (
            <LogoPlate
              key={l.file}
              file={l.file}
              name={l.name}
              plate={l.plate}
              maxH={l.maxH}
              at={CLOSING_CARD_AT + 100 + i * 14}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
