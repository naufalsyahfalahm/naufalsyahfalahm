import React from "react";
import { Composition } from "remotion";
import { fps, height, lang, TOTAL_FRAMES, width } from "./config";
import { Background } from "./components/Background";
import { Walkthrough } from "./Walkthrough";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Walkthrough"
        component={Walkthrough}
        durationInFrames={TOTAL_FRAMES}
        fps={fps}
        width={width}
        height={height}
        defaultProps={{ lang }}
      />
      {/* Background only: reference still for the safe-zone check (scripts/verify_stills.py). */}
      <Composition id="BgRef" component={Background} durationInFrames={1} fps={fps} width={width} height={height} />
    </>
  );
};
