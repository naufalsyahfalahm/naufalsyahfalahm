import React from "react";
import { AbsoluteFill, Easing, Img, useCurrentFrame } from "remotion";
import {
  AFFILIATION,
  CLOSING_CARD_AT,
  CLOSING_LOGOS,
  COLORS,
  MAX_LOGO_UPSCALE,
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

const BAND_W = 1424;
const BAND_H = 132;

/** One logo inside its cell of the band. Enlarged at most MAX_LOGO_UPSCALE, no filters. */
const LogoCell: React.FC<{
  file: string;
  name: string;
  tile: "none" | "navy";
  maxH: number;
  last: boolean;
  at: number;
}> = ({ file, name, tile, maxH, last, at }) => {
  const frame = useCurrentFrame();
  const info = assetInfo(file);
  if (!info.exists || !info.width || !info.height) return null;
  const k = Math.min(MAX_LOGO_UPSCALE, maxH / info.height, 236 / info.width);
  const w = Math.round(info.width * k);
  const h = Math.round(info.height * k);
  const p = prog(frame, at, at + 20);
  const img = (
    <Img
      src={src(file)}
      alt={name}
      style={{ width: w, height: h, display: "block" }}
    />
  );
  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
      }}
    >
      {tile === "navy" ? (
        <div
          style={{
            background: COLORS.navy,
            borderRadius: 14,
            padding: "14px 20px",
          }}
        >
          {img}
        </div>
      ) : (
        img
      )}
      {last ? null : (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 30,
            bottom: 30,
            width: 2,
            background: COLORS.grey,
            opacity: 0.7 * p,
          }}
        />
      )}
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
  const band = prog(frame, CLOSING_CARD_AT + 100, CLOSING_CARD_AT + 124);
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <FootageSlot kind="presenter" scale={zoom} fallback={<NavyCard />} />
      <AbsoluteFill
        style={{
          background: COLORS.navy,
          clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`,
          alignItems: "center",
          paddingTop: 165,
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
        <div style={{ ...item(CLOSING_CARD_AT + 34), marginTop: 28 }}>
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
            ...item(CLOSING_CARD_AT + 60),
            marginTop: 34,
            maxWidth: 1500,
          }}
        >
          <T
            size={48}
            weight={400}
            maxLines={2}
            align="center"
            color={COLORS.white}
          >
            {TEAM_NAMES.join(" · ")}
          </T>
        </div>
        <div style={{ ...item(CLOSING_CARD_AT + 76), marginTop: 12 }}>
          <T
            size={48}
            weight={600}
            maxLines={1}
            align="center"
            color={COLORS.grey}
          >
            {AFFILIATION}
          </T>
        </div>
        {/* one white band with all partner logos and thin dividers */}
        <div
          style={{
            marginTop: 44,
            width: BAND_W,
            height: BAND_H,
            borderRadius: 28,
            background: COLORS.white,
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
            padding: "0 20px",
            opacity: band,
            transform: `translateY(${(1 - band) * 24}px)`,
          }}
        >
          {logos.map((l, i) => (
            <LogoCell
              key={l.file}
              file={l.file}
              name={l.name}
              tile={l.tile}
              maxH={l.maxH}
              last={i === logos.length - 1}
              at={CLOSING_CARD_AT + 108 + i * 10}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
