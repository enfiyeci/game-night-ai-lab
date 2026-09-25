import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';

// Fictional actors modeled on the research's actor types (docs/research/ai-lab-mechanics/report.md).
export const SUPPLIERS = [
  { id: 'verde', name: 'Verde, the chip titan (multi-year order)', units: 10, delay: 3, costMult: 1.0, prepayMonths: 3, failChance: 0 },
  { id: 'azuria', name: 'Azuria Cloud (reserved capacity)', units: 8, delay: 1, costMult: 1.25, prepayMonths: 0, failChance: 0, exclusive: true },
  { id: 'coreflame', name: 'CoreFlame neocloud (available now)', units: 6, delay: 0, costMult: 0.9, prepayMonths: 0, failChance: 0.06 },
  { id: 'gulf', name: 'Gulf sovereign campus', units: 15, delay: 2, costMult: 1.0, prepayMonths: 1, failChance: 0, govUs: -4, publicTrust: -3 },
];

export const BOTTLENECK_DELAY = { chips: 0, packaging: 0, 'wafers-hbm': 1, power: 2, everything: 1 };

export function signDeal(state, supplierId) {
  const s = SUPPLIERS.find((x) => x.id === supplierId);
  if (!s) return { ok: false, error: `unknown supplier ${supplierId}` };
  const upfront = s.units * s.costMult * BALANCE.unitMonthlyCost * s.prepayMonths;
  if (upfront > state.cash) return { ok: false, error: 'not enough cash for the prepayment' };
  state.cash -= upfront;
  const arrivesTurn = state.turn + s.delay + BOTTLENECK_DELAY[eraById(state.era).bottleneck];
  state.compute.pipeline.push({ supplier: s.id, units: s.units, costMult: s.costMult, failChance: s.failChance, arrivesTurn });
  if (s.govUs) state.govFavor.us += s.govUs;
  if (s.publicTrust) state.publicTrust += s.publicTrust;
  if (s.exclusive) state.flags.exclusiveCloud = true;
  return { ok: true, arrivesTurn };
}

export function computeTurn(state, rng) {
  const arrived = [];
  const failed = [];
  state.compute.pipeline = state.compute.pipeline.filter((p) => {
    if (p.arrivesTurn > state.turn) return true;
    state.compute.contracts.push({ supplier: p.supplier, units: p.units, costMult: p.costMult, failChance: p.failChance });
    arrived.push(p);
    return false;
  });
  state.compute.contracts = state.compute.contracts.filter((c) => {
    if (c.failChance > 0 && rng.chance(c.failChance)) {
      failed.push(c);
      return false;
    }
    return true;
  });
  state.compute.online = state.compute.contracts.reduce((s, c) => s + c.units, 0);
  return { arrived, failed };
}
