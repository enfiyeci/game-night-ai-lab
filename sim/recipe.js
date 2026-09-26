import { CARDS, STAGE_SLOTS } from './data/cards.js';
import { eraScale } from './data/compute.js';
import { FOCUS } from './data/recipeFocus.js';
import { techAvailable } from './techniques.js';

export const SIZES = ['small', 'medium', 'large', 'xl'];
export const SIZE_UNITS = { small: 2, medium: 5, large: 10, xl: 20 };
export const SIZE_CAP = { small: -5, medium: 0, large: 5, xl: 8 };
export const LENGTHS = { optimal: { turns: 0, cap: 0 }, over: { turns: 1, cap: 3 }, heavy: { turns: 2, cap: 5 } };
export const TRAIN_STAGES = ['pre', 'mid', 'post'];
const TALENT_SLOT_SPEND = 5;

export const cardById = (id) => CARDS.find((c) => c.id === id);

export const talentSpend = (state) => state.budget.spend * state.budget.split.talent;

export function slotsFor(state, stage) {
  if (stage === 'mid' && state.era < 2) return 0;
  if (!Object.hasOwn(STAGE_SLOTS, stage)) return 0;
  // The old 25% share at the typical $20M budget becomes a $5M/month threshold.
  return STAGE_SLOTS[stage] + (talentSpend(state) >= TALENT_SLOT_SPEND ? 1 : 0);
}

export function cardUnlocked(state, card) {
  if (card.default) return false;
  if (card.era > state.era) return false;
  if (card.requiresTech && !techAvailable(state, card.requiresTech)) return false;
  if (card.requiresModel && state.models.length === 0) return false;
  return true;
}

export function pickableCards(state, stage) {
  return CARDS.filter((c) => c.stage === stage && cardUnlocked(state, c));
}

export function validatePicks(state, stage, ids) {
  const errors = [];
  const slots = slotsFor(state, stage);
  if (ids.length > slots) errors.push(`${stage}: ${ids.length} picks but only ${slots} slots`);
  const groups = new Set();
  for (const id of ids) {
    const card = cardById(id);
    if (!card || card.stage !== stage) {
      errors.push(`${stage}: unknown card ${id}`);
      continue;
    }
    if (!cardUnlocked(state, card)) errors.push(`${stage}: card ${id} is locked`);
    if (groups.has(card.group)) errors.push(`${stage}: two cards from group ${card.group}`);
    groups.add(card.group);
  }
  return errors;
}

export function resolveCards(state, stage, ids) {
  if (slotsFor(state, stage) === 0) return [];
  const picked = ids.map(cardById);
  const covered = new Set(picked.map((c) => c.group));
  const defaults = CARDS.filter((c) => c.stage === stage && c.default && !covered.has(c.group));
  return [...picked, ...defaults];
}

// Share of a stage's time per focus slider, or null when the recipe sets no focus for that stage.
export function focusShares(recipe, stage) {
  const values = recipe?.focus?.[stage];
  if (!Array.isArray(values)) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function validFocus(values) {
  return Array.isArray(values) && values.length === 3
    && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)
    && values.some((value) => value > 0);
}

// Effects of moving the focus sliders away from their start split; all zero at the start split.
// Values time is not here: it reaches the sim as sliders.alignShare.
export function focusEffects(state, recipe) {
  const delta = (stage) => {
    const shares = focusShares(recipe, stage);
    return shares ? shares.map((share, index) => share - FOCUS[stage][index].start / 100) : [0, 0, 0];
  };
  const [web, math, clean] = delta('pre');
  const [anneal, long, prep] = slotsFor(state, 'mid') > 0 ? delta('mid') : [0, 0, 0];
  const [, , red] = delta('post');
  const large = recipe.sliders.size === 'large' || recipe.sliders.size === 'xl';
  return {
    cap: web * 6 - clean * 3 + anneal * 5 * (large ? 0.5 : 1) - red * 3,
    readiness: math * 0.5 + prep * 0.5,
    spike: -clean * 0.15,
    mx: -clean * 5 - red * 8,
    usersMult: 1 + long * 0.2,
  };
}

export function validateRecipe(state, recipe) {
  const errors = [];
  const { size, length, alignShare } = recipe.sliders;
  for (const stage of TRAIN_STAGES) {
    if (recipe.focus?.[stage] !== undefined && !validFocus(recipe.focus[stage])) errors.push(`${stage}: invalid focus sliders`);
  }
  if (!Object.hasOwn(SIZE_UNITS, size)) errors.push(`unknown size ${size}`);
  if (size === 'xl' && state.era < 2) errors.push('the xl size unlocks in era 2');
  if (!Object.hasOwn(LENGTHS, length)) errors.push(`unknown training length ${length}`);
  if (length === 'heavy' && size !== 'small' && size !== 'medium') errors.push('heavy overtraining needs a small or medium model');
  if (!(alignShare >= 0 && alignShare <= 0.5)) errors.push('alignShare must be between 0 and 0.5');
  for (const stage of TRAIN_STAGES) errors.push(...validatePicks(state, stage, recipe.picks[stage] ?? []));
  return { ok: errors.length === 0, errors };
}

export function recipeCards(state, recipe) {
  return TRAIN_STAGES.flatMap((stage) => resolveCards(state, stage, recipe.picks[stage] ?? []));
}

export function recipeCost(state, recipe) {
  const cards = recipeCards(state, recipe);
  const { size, length } = recipe.sliders;
  const mult = cards.reduce((m, c) => m * (c.cost.computeMult ?? 1), 1);
  return {
    cash: cards.reduce((s, c) => s + (c.cost.cash ?? 0), 0),
    units: Math.round(SIZE_UNITS[size] * mult * eraScale(state.era) * 10) / 10,
    turns: 1 + LENGTHS[length].turns + cards.reduce((s, c) => s + (c.cost.turns ?? 0), 0),
  };
}
