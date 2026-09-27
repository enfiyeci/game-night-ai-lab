// The shared deal board (spec 2026-09-26 compute race §2 rules 3–5). No dice: rivals name cards in catch-up order,
// the player moves first, and at the round's end each rival takes what it named or its second choice.
import { BOARD_SUPPLIERS, BIG_DEAL_SHARE, BIG_DEAL_HEAT, OFF_BOARD_SHARE } from './data/race.js';
import { rivalShortfall, recordStanding } from './rivals.js';

const boardCards = (state) => state.compute.offers.filter((o) => BOARD_SUPPLIERS.includes(o.supplier) && o.units > 0);
// Lowest score picks first, as in Power Grid's catch-up rule. Qilin buys only home-made chips.
const catchUpOrder = (state) => state.rivals.filter((r) => !r.eastern)
  .sort((a, b) => a.capability - b.capability || a.id.localeCompare(b.id));

// Bold labs (caution below 0.5) want the biggest card; careful labs the card nearest their shortfall.
function choose(r, short, cards) {
  if (!cards.length) return null;
  const cost = r.caution < 0.5 ? (o) => -o.units : (o) => Math.abs(o.units - short);
  return cards.reduce((best, o) => (cost(o) < cost(best) ? o : best));
}

// After the round's offers go up. A second choice comes from cards nobody named, so it never takes another rival's.
export function announceTargets(state) {
  for (const o of state.compute.offers) {
    delete o.wantedBy;
    delete o.fallback;
  }
  for (const r of state.rivals) r.named = null;
  const free = [...boardCards(state)];
  const picks = [];
  for (const r of catchUpOrder(state)) {
    const short = rivalShortfall(state, r);
    if (short <= 0) continue;
    const pick = choose(r, short, free);
    if (!pick) break;
    free.splice(free.indexOf(pick), 1);
    picks.push([r, short, pick]);
  }
  for (const [r, short, pick] of picks) {
    const fallback = choose(r, short, free)?.id ?? null;
    pick.wantedBy = r.id;
    pick.fallback = fallback;
    r.named = { offerId: pick.id, fallback };
  }
}

// At the round mark. The player has already had the round to sign any card first.
export function takeTargets(state) {
  const events = [];
  const onBoard = (id) => (id ? state.compute.offers.find((o) => o.id === id) : null);
  for (const r of catchUpOrder(state)) {
    const plan = r.named;
    r.named = null;
    if (!plan) continue;
    const offer = onBoard(plan.offerId) ?? onBoard(plan.fallback);
    if (!offer) continue;
    state.compute.offers = state.compute.offers.filter((o) => o !== offer);
    const arrivesTurn = state.turn + Math.max(1, offer.arrivesIn ?? 1);
    r.pipeline.push({ units: offer.units, turn: arrivesTurn, supplier: offer.supplier, source: 'board' });
    const big = offer.units >= BIG_DEAL_SHARE * r.fleet;
    if (big) state.raceHeat += BIG_DEAL_HEAT;
    events.push({ type: 'rivalDeal', id: r.id, supplier: offer.supplier, units: offer.units, arrivesTurn, fallback: offer.id !== plan.offerId, big });
  }
  return events;
}

// Deals the player never sees: a quarter of what each rival is still short arrives next round.
export function offBoardGrowth(state) {
  for (const r of state.rivals) {
    const units = Math.round(rivalShortfall(state, r) * OFF_BOARD_SHARE);
    if (units > 0) r.pipeline.push({ units, turn: state.turn + 1, source: 'offBoard' });
  }
}

export function landRivalCompute(state) {
  for (const r of state.rivals) {
    r.pipeline = r.pipeline.filter((p) => {
      if (p.turn > state.turn) return true;
      r.fleet += p.units;
      return false;
    });
  }
}

// Called in endRound before the rival launches are rolled.
export function rivalDealsTurn(state) {
  recordStanding(state);
  landRivalCompute(state);
  const events = takeTargets(state);
  offBoardGrowth(state);
  return events;
}
