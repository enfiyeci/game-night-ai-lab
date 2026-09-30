export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));

// A repeating chance without dice (owner 2026-09-26, "decisions decide the ending"): the chance adds up in
// holder[key], and the thing happens each time the total reaches 1. Same long-run rate as rolling it.
export function accrue(holder, key, chance) {
  holder[key] = (holder[key] ?? 0) + Math.max(0, chance);
  if (holder[key] < 1 - 1e-9) return false;
  holder[key] -= 1;
  return true;
}
