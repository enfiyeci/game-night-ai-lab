// $ per million tokens by era, for a Medium dense model at full precision.
export const HW = [6.0, 2.5, 1.0, 0.4, 0.15];
// Millions of tokens per consumer user per month, by era, without reasoning.
export const USAGE = [0.5, 0.8, 1.5, 1.5, 1.75];
export const SIZE = { small: 0.25, medium: 1, large: 3, xl: 8 };
// [light load, load above 80% of capacity]
export const ARCH = { dense: [1, 1], moe: [0.5, 0.7], sparse: [0.35, 0.6] };
export const CONTEXT = { short: 0.8, long: 1.0, lean: 0.85, million: 1.6 };
export const REASONING = { off: 1, low: 2, medium: 4, high: 8 };
export const PRECISION = { bf16: 1, fp8: 0.7, fp4: 0.45 };
export const CHANNEL = { consumer: 1, enterprise: 4, agent: 20 };
export const REVENUE_PER_USER = { consumer: 5, enterprise: 30, agent: 200 };
// What a user pays grows with each era's models, stamped on a model at launch (model.eraPrice): pricier tiers, seats
// and agent products, the way real lab revenue outgrew its user counts. Owner's middle ground (2026-09-26): revenue
// covers about a third of spending through 2025, half in 2026 and two thirds in 2027 (balanced bot); real labs got
// closer to break-even (docs/research/ai-lab-mechanics/notes/lab_finances.md, runway-history), money stays tighter.
export const ERA_PRICE = [1, 1.1, 1.9, 2.1, 2.25];
export const PRICE_STANCE = {
  premium: { rev: 1.5, growth: 0.6 },
  market: { rev: 1, growth: 1 },
  undercut: { rev: 0.5, growth: 1.6 },
  free: { rev: 0.6, growth: 2.2 },
};

export const activeModels = (state) =>
  state.models.filter((model) => model.active && model.channel !== 'open' && state.turn >= model.activeFromTurn);

export const safetyUnits = (online, control, share) =>
  Math.min(online - control, Math.round(online * share * 10) / 10);

const guardMult = (guard, era) => (guard ? (era >= 4 ? 1.01 : 1.24) : 1);

export function servingCost(spec, era, load) {
  const e = era - 1;
  const tokens = USAGE[e] * CHANNEL[spec.channel] * REASONING[spec.reasoning];
  const arch = ARCH[spec.arch][load > 0.8 ? 1 : 0];
  const perMillion = HW[e] * SIZE[spec.size] * arch * CONTEXT[spec.context] * PRECISION[spec.precision] * guardMult(spec.guard, era);
  return tokens * perMillion;
}

export const margin = (cost, revenuePerUser) => 1 - cost / revenuePerUser;
