import { FIRST_MOVER, WAVE_USERS, RELEASE_FEATURES, RIVAL_FEATURES, claimFirsts, crowding, holdsFirst, waveProduct } from './data/products.js';
import { servingCost } from './serving.js';
import { revenuePerUser } from './economy.js';
import { CARDS } from './data/cards.js';
import { FOCUS } from './data/recipeFocus.js';
import { FIT_PROFILES, FOCUS_SIGNAL_MIN } from './data/products.js';
import { cardById, cardUnlocked, focusShares, slotsFor } from './recipe.js';

function signalCards(signal) {
  if (signal.ids) return signal.ids.map(cardById).filter(Boolean);
  if (signal.group) {
    return CARDS.filter((card) => card.group === signal.group && !card.default && !(signal.except ?? []).includes(card.id));
  }
  return [];
}

function achievable(state, signal) {
  if (signal.kind === 'focus') return slotsFor(state, signal.stage) > 0;
  if (signal.kind === 'size') return true;
  return signalCards(signal).some((card) => cardUnlocked(state, card) && (card.stage === 'release' || slotsFor(state, card.stage) > 0));
}

function present(state, recipe, releasePicks, signal) {
  if (signal.kind === 'focus') {
    const shares = focusShares(recipe, signal.stage);
    return Boolean(shares) && shares[signal.index] - FOCUS[signal.stage][signal.index].start / 100 >= FOCUS_SIGNAL_MIN - 1e-9;
  }
  if (signal.kind === 'size') return signal.sizes.includes(recipe.sliders?.size);
  return signalCards(signal).some((card) => cardUnlocked(state, card) && (card.stage === 'release'
    ? releasePicks.includes(card.id)
    : slotsFor(state, card.stage) > 0 && (recipe.picks?.[card.stage] ?? []).includes(card.id)));
}

// How well a recipe matches a product, against what this era can reach (spec section 4).
export function fitReport(state, recipe, product, releasePicks = []) {
  const signals = FIT_PROFILES[product].filter((signal) => achievable(state, signal));
  const total = signals.reduce((sum, signal) => sum + signal.w, 0);
  if (total === 0) return { fit: 1, missing: [] };
  const hits = signals.filter((signal) => present(state, recipe, releasePicks, signal));
  const fit = hits.reduce((sum, signal) => sum + signal.w, 0) / total;
  const missing = signals.filter((signal) => !hits.includes(signal)).sort((a, b) => b.w - a.w).map((signal) => signal.label);
  return { fit: Math.round(fit * 1000) / 1000, missing };
}

// Same-round launches share firsts regardless of the order their actions resolve.
const canClaim = (state, kind, key, lab) => !state.firsts?.[kind]?.[key]
  || state.firsts[kind][key].turn === state.turn || holdsFirst(state, kind, key, lab);

export function marketTerms(state, product, lab = 'player') {
  const wave = waveProduct(state.era) === product ? WAVE_USERS : 1;
  const crowd = crowding(state, product);
  const first = canClaim(state, 'products', product, lab);
  return { wave, crowding: crowd, first, mult: wave * crowd * (first ? FIRST_MOVER.users : 1) };
}

export const featureAppeal = (product, ids) => ids.reduce((sum, id) => sum + (RELEASE_FEATURES[id]?.appeal[product] ?? 0), 0);

export function featureServing(state, lab, id) {
  const { serving } = RELEASE_FEATURES[id];
  return canClaim(state, 'features', id, lab)
    ? Math.round((1 + (serving - 1) * (1 - FIRST_MOVER.featureExcessCut)) * 1000) / 1000 : serving;
}

export function claimRivalFeatures(state) {
  for (const row of RIVAL_FEATURES) {
    if (row.era === state.era && row.turnInEra === state.turnInEra) claimFirsts(state, row.rival, null, [row.feature]);
  }
}

// Light-load serving cost per revenue dollar lets different products compare fairly.
export const costPerDollar = (spec, era, model) => servingCost(spec, era, 0) / Math.max(1e-9, revenuePerUser(model));
