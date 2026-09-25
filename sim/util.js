export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
