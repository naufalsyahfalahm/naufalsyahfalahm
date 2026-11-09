import React from "react";
import { Freeze, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import { FILES, FOOTAGE_PRIVACY, FPS, MAX_UPSCALE, RECORDING_CONTENT_BOX, SCREEN_SCALE, type RecordingSpec } from "../config";
import { assetInfo, hasAsset, src } from "../lib/assets";
import { Placeholder } from "./Placeholder";

/**
 * Demo recording: trims to [startSec, endSec], plays at `rate`, then holds the last frame
 * until the slot ends. Missing file => labelled placeholder (no fake UI).
 */
export const RecordingSlot: React.FC<{ spec: RecordingSpec; width: number; height: number }> = ({
  spec,
  width,
  height,
}) => {
  const frame = useCurrentFrame();
  if (!hasAsset(spec.file)) {
    return <Placeholder label={spec.placeholder} style={{ width, height }} />;
  }
  const info = assetInfo(spec.file);
  const playFrames = Math.floor(((spec.endSec - spec.startSec) * FPS) / spec.rate);
  const f = Math.min(frame, playFrames - 1);
  // Show only the content box (top-left of the canvas) scaled to fill the phone screen.
  const k = width / RECORDING_CONTENT_BOX.w;
  const vw = (info.width ?? RECORDING_CONTENT_BOX.w) * k;
  const vh = (info.height ?? RECORDING_CONTENT_BOX.h) * k;
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden" }}>
      <Freeze frame={f}>
        <OffthreadVideo
          src={src(spec.file)}
          muted
          trimBefore={Math.round(spec.startSec * FPS)}
          playbackRate={spec.rate}
          style={{ position: "absolute", left: 0, top: 0, width: vw, height: vh }}
        />
      </Freeze>
    </div>
  );
};

/** Blur a region (percent of frame) of whatever sits behind it. */
const BlurBox: React.FC<{ x: number; y: number; w: number; h: number; px: number }> = ({ x, y, w, h, px }) => (
  <div
    style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`,
      backdropFilter: `blur(${px}px)`,
      WebkitBackdropFilter: `blur(${px}px)`,
      borderRadius: 24,
    }}
  />
);

/**
 * Full-frame supplied footage with privacy handling. Default (no documented consent, no regions):
 * the entire frame is blurred. See config.FOOTAGE_PRIVACY.
 */
export const FootageSlot: React.FC<{
  kind: "hook" | "presenter";
  scale?: number;
  fallback: React.ReactNode;
}> = ({ kind, scale = 1, fallback }) => {
  const file = kind === "hook" ? FILES.hookFootage : FILES.presenterFootage;
  if (!hasAsset(file)) return <>{fallback}</>;
  const p = FOOTAGE_PRIVACY[kind];
  const wholeBlur = !p.consentDocumented && p.blurRegions.length === 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale * (wholeBlur ? 1.06 : 1)})`,
          filter: wholeBlur ? `blur(${p.blurPx}px)` : undefined,
        }}
      >
        <OffthreadVideo src={src(file)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {!p.consentDocumented
          ? p.blurRegions.map((r, i) => <BlurBox key={i} {...r} px={p.blurPx} />)
          : null}
      </div>
    </div>
  );
};

/**
 * Real app screen. Never upscaled beyond MAX_UPSCALE, no filters (so no sharpening).
 * `viewportH` + `pan` (0..1) give a vertical pan when the image is taller than the viewport.
 */
export const useScreenGeometry = (file: string, targetW?: number) => {
  const info = assetInfo(file);
  if (!info.exists || !info.width || !info.height) return null;
  const scale = Math.min(MAX_UPSCALE, SCREEN_SCALE);
  const w = targetW ? Math.min(targetW, info.width * MAX_UPSCALE) : info.width * scale;
  const s = w / info.width;
  return { w: Math.round(w), h: Math.round(info.height * s), scale: s, nativeW: info.width, nativeH: info.height };
};

export const ScreenImage: React.FC<{ file: string; width: number; offsetY?: number }> = ({
  file,
  width,
  offsetY = 0,
}) => (
  <Img
    src={src(file)}
    style={{
      position: "absolute",
      left: 0,
      top: -offsetY,
      width,
      height: "auto",
      imageRendering: "auto",
    }}
  />
);
