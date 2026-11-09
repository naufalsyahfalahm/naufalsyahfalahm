export type Pearson = { r: number; lo: number; hi: number; n: number };

/**
 * Pearson r with a 95% CI via the Fisher z-transform (se = 1/sqrt(n-3)).
 * Assumes roughly linear association and approximately bivariate-normal data for the CI.
 * Returns null when n < 4 or either variable has zero variance.
 */
export const pearson = (xs: number[], ys: number[]): Pearson | null => {
  const n = xs.length;
  if (n < 4 || ys.length !== n) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0 || syy === 0) return null;
  const r = sxy / Math.sqrt(sxx * syy);
  if (Math.abs(r) >= 1) return { r, lo: r, hi: r, n };
  const z = Math.atanh(r);
  const se = 1 / Math.sqrt(n - 3);
  return { r, lo: Math.tanh(z - 1.959964 * se), hi: Math.tanh(z + 1.959964 * se), n };
};

export const fmt = (v: number, d = 2) => (Object.is(v, -0) ? 0 : v).toFixed(d).replace("-", "−");
