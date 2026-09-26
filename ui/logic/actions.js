export const SPEND_LEVELS = { lean: 12, steady: 20, aggressive: 35 };

const safeEra = (era) => (Number.isFinite(era) ? era : 1);

export function normaliseSplit(values) {
  const entries = Object.entries(values ?? {});
  if (entries.length === 0) return {};

  const cleaned = entries.map(([, value]) => (Number.isFinite(value) && value > 0 ? value : 0));
  let weights = cleaned;
  if (Math.max(...cleaned) === 0) weights = cleaned.map(() => 1);

  const scale = Math.max(...weights);
  const scaled = weights.map((value) => value / scale);
  const total = scaled.reduce((sum, value) => sum + value, 0);
  const exact = scaled.map((value) => (value / total) * 100);
  const cents = exact.map(Math.floor);
  let remaining = 100 - cents.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - cents[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) cents[order[index].index] += 1;

  return Object.fromEntries(entries.map(([key], index) => [key, cents[index] / 100]));
}

export function spendFor(level, era) {
  const base = SPEND_LEVELS[level];
  return base * (1 + 0.5 * (safeEra(era) - 1));
}

export function levelFor(spend, era) {
  return Object.keys(SPEND_LEVELS).reduce((nearest, level) => (
    Math.abs(spendFor(level, era) - spend) < Math.abs(spendFor(nearest, era) - spend) ? level : nearest
  ));
}

export function budgetFromSliders(values, level, era) {
  return { spend: spendFor(level, era), split: normaliseSplit(values) };
}
