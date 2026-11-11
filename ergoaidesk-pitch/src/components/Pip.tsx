import React from "react";
import { OffthreadVideo, getInputProps, interpolate, useCurrentFrame } from "remotion";
import { FILES, FPS, PIP, PIP_H, PIP_HIDE, PIP_LEFT, PIP_RIGHT, PIP_W } from "../config";
import { PIP_TRACKS } from "../generated/pip";
import { hasAsset, src } from "../lib/assets";

type Keys = ReadonlyArray<readonly [number, number]>;
const level = (frame: number, keys: Keys) => {
  if (keys.length === 0) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (frame <= keys[i][0]) return interpolate(frame, [keys[i - 1][0], keys[i][0]], [keys[i - 1][1], keys[i][1]]);
  }
  return keys[keys.length - 1][1];
};

const hiddenFactor = (frame: number, side: "left" | "right") => {
  const f = Math.round(PIP.fadeS * FPS);
  let o = 1;
  for (const h of PIP_HIDE) {
    if (h.side !== side) continue;
    o = Math.min(o, interpolate(frame, [h.from - f, h.from, h.to, h.to + f], [1, 0, 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return o;
};

/** One face box. The video is the aligned track on the main timeline (same frame number as the composition). */
const Box: React.FC<{ file: string; x: number; y: number; opacity: number; name: string }> = ({ file, x, y, opacity, name }) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      data-pip={name}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: PIP_W,
        height: PIP_H,
        boxSizing: "border-box",
        border: `${PIP.borderPx}px solid ${PIP.borderColor}`,
        borderRadius: 8,
        overflow: "hidden",
        background: "#0E2233",
        opacity,
      }}
    >
      {getInputProps().checkpass ? (
        // check pass: plain grey rectangle over the keep-out zone instead of the video
        <div style={{ width: "100%", height: "100%", background: "#808080" }} />
      ) : (
        <OffthreadVideo src={src(file)} muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </div>
  );
};

/** Top layer: right PiP = the face of whoever speaks (crossfade at switches); closing = B left, A right. */
export const PipLayer: React.FC = () => {
  const frame = useCurrentFrame();
  if (!hasAsset(FILES.pipA) || !hasAsset(FILES.pipB)) return null;
  const r = hiddenFactor(frame, "right");
  const l = hiddenFactor(frame, "left");
  return (
    <>
      <Box name="pip-right-A" file={FILES.pipA} x={PIP_RIGHT.x} y={PIP_RIGHT.y} opacity={level(frame, PIP_TRACKS.A.right) * r} />
      <Box name="pip-right-B" file={FILES.pipB} x={PIP_RIGHT.x} y={PIP_RIGHT.y} opacity={level(frame, PIP_TRACKS.B.right) * r} />
      <Box name="pip-left-B" file={FILES.pipB} x={PIP_LEFT.x} y={PIP_LEFT.y} opacity={level(frame, PIP_TRACKS.B.left) * l} />
    </>
  );
};
