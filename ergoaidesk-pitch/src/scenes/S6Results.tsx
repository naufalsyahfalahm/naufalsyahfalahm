import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, SAFE, SOURCE_LINE, TEXT, claims } from "../config";
import { VALIDATION_ROWS } from "../generated/assets";
import { Scatter } from "../components/Scatter";
import { T } from "../components/Text";
import { fmt, pearson } from "../lib/stats";
import { fade, prog, useSpring } from "../lib/motion";

const W = 1920 - 2 * SAFE;
// keep "> 0.90" together (non-breaking space); the text itself is unchanged
const nb = (t: string) => t.replace(/> (?=\d)/g, ">\u00A0");

const Row: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const k = useSpring(at, { damping: 20, stiffness: 110 });
  const c = claims[i];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 40,
        background: COLORS.navy2,
        borderRadius: 24,
        borderLeft: `12px solid ${COLORS.grey}`,
        padding: "20px 36px",
        marginBottom: 20,
        opacity: Math.min(1, k * 1.5),
        transform: `translateY(${(1 - k) * 36}px)`,
      }}
    >
      <div style={{ width: 300, flexShrink: 0 }}>
        <T size={88} font="heading" maxLines={1} lineHeight={1}>
          {c.value}
        </T>
      </div>
      <div style={{ flex: 1 }}>
        <T size={44} weight={600} maxLines={2}>
          {nb(c.text)}
        </T>
        <T size={44} color={COLORS.grey} maxLines={2} style={{ marginTop: 4 }}>
          {c.source}
        </T>
      </div>
    </div>
  );
};

const CardsOnly: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <div style={{ position: "absolute", left: SAFE, top: 170, width: W }}>
        {claims.map((_, i) => (
          <Row key={i} i={i} at={30 + i * 100} />
        ))}
        <div style={{ marginTop: 28, opacity: fade(frame, 340, 16) }}>
          <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
            {TEXT.resultsFooter}
          </T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Swatch: React.FC<{ color: string }> = ({ color }) => <div style={{ width: 30, height: 30, borderRadius: 8, background: color, flexShrink: 0 }} />;

const ChartPanel: React.FC<{
  title: string;
  xLabel: string;
  yLabel: string;
  xs: number[];
  ys: number[];
  identity?: boolean;
  xColor?: string;
  yColor?: string;
  at: number;
}> = ({ xs, ys, identity, xLabel, yLabel, xColor, yColor, at }) => {
  const frame = useCurrentFrame();
  const o = fade(frame, at, 14);
  const stat = useMemo(() => pearson(xs, ys), [xs, ys]);
  const w = 836;
  return (
    <div style={{ width: w, opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {yColor ? <Swatch color={yColor} /> : null}
        <T size={44} weight={600} maxLines={1}>{`y: ${yLabel}`}</T>
      </div>
      <Scatter xs={xs} ys={ys} w={w} h={200} identity={identity} shared={identity} progress={prog(frame, at + 6, at + 70)} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {xColor ? <Swatch color={xColor} /> : null}
        <T size={44} weight={600} maxLines={1}>{`x: ${xLabel}`}</T>
      </div>
      <T size={44} color={COLORS.grey} maxLines={1}>
        {stat
          ? `r = ${fmt(stat.r)}, 95% CI ${fmt(stat.lo)}–${fmt(stat.hi)}, n = ${stat.n}`
          : `n = ${xs.length} (too few for r with CI)`}
      </T>
    </div>
  );
};

const WithCharts: React.FC<{ rows: NonNullable<typeof VALIDATION_ROWS> }> = ({ rows }) => {
  const frame = useCurrentFrame();
  // top-row card widths follow text length so every claim fits on 2 lines at >= 44 px
  const weights = claims.map((c) => c.text.length + 10);
  const sum = weights.reduce((a, b) => a + b, 0);
  const gap = 20;
  const widths = weights.map((x) => ((W - gap * (claims.length - 1)) * x) / sum);
  const col = (k: keyof (typeof rows)[number]) => rows.map((r) => r[k]);
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <div style={{ position: "absolute", left: SAFE, top: SAFE, width: W, display: "flex", gap }}>
        {claims.map((c, i) => {
          const o = fade(frame, 20 + i * 14, 14);
          return (
            <div key={i} style={{ width: widths[i], boxSizing: "border-box", background: COLORS.navy2, borderRadius: 18, borderTop: `8px solid ${COLORS.grey}`, padding: "10px 20px", opacity: o }}>
              <T size={44} weight={600} maxLines={2} lineHeight={1.15}>
                {nb(c.text)}
              </T>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: SAFE, top: 250, width: W, opacity: fade(frame, 70, 14) }}>
        <T size={44} color={COLORS.grey} maxLines={2} lineHeight={1.15}>
          {SOURCE_LINE}
        </T>
      </div>
      <div style={{ position: "absolute", left: SAFE, top: 372, width: W, opacity: fade(frame, 120, 14) }}>
        <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
          {TEXT.chartsLabel}
        </T>
      </div>
      <div style={{ position: "absolute", left: SAFE, top: 430, width: W, display: "flex", justifyContent: "space-between" }}>
        <ChartPanel title="system-expert" xLabel="System score" yLabel="Expert score" xs={col("system_score")} ys={col("expert_score")} identity at={140} />
        <ChartPanel title="phys-psych" xLabel="Physical score" yLabel="Psychological score" xs={col("physical_score")} ys={col("psychological_score")} xColor={COLORS.teal} yColor={COLORS.lilac} at={200} />
      </div>
      <div style={{ position: "absolute", left: SAFE, top: 800, width: W, opacity: fade(frame, 300, 16) }}>
        <T size={44} weight={600} color={COLORS.grey} maxLines={1}>
          {TEXT.resultsFooter}
        </T>
      </div>
    </AbsoluteFill>
  );
};

/** Claim cards state validation status only. Charts appear only when public/data/validation.csv exists. */
export const SceneResults: React.FC = () => (VALIDATION_ROWS && VALIDATION_ROWS.length >= 4 ? <WithCharts rows={VALIDATION_ROWS} /> : <CardsOnly />);
