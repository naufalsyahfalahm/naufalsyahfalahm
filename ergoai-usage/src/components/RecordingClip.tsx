import React from "react";
import { Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { layout, type RecordingKey, recordings } from "../config";

/**
 * Plays source frames [startFrom, startFrom + length) at 1.0x (never sped up), then holds the last
 * frame. The recording canvas (780x1688) holds the UI only in its top-left contentW x contentH, so the
 * video is scaled uniformly (no distortion) and clipped to that box.
 */
export const RecordingClip: React.FC<{ rec: RecordingKey; startFrom: number; length: number }> = ({ rec, startFrom, length }) => {
  const frame = useCurrentFrame();
  const r = recordings[rec];
  const s = layout.phoneHeight / r.contentH;
  const f = Math.min(frame, length - 1);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#FFFFFF" }}>
      <Freeze frame={f}>
        <OffthreadVideo
          src={staticFile(r.file)}
          startFrom={startFrom}
          endAt={startFrom + length}
          muted
          style={{ position: "absolute", left: 0, top: 0, width: r.srcW * s, height: r.srcH * s, maxWidth: "none" }}
        />
      </Freeze>
    </div>
  );
};
