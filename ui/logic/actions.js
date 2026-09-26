import {
  LENGTHS,
  SIZE_UNITS,
  TRAIN_STAGES,
  cardById,
  cardUnlocked,
  recipeCost,
  slotsFor,
  validateRecipe,
} from '../../sim/recipe.js';
import { signOffer, sideRng } from '../../sim/contracts.js';
import { placeOrder } from '../../sim/queue.js';
import { availableUnits, startRun } from '../../sim/training.js';
import { MAX_MOVES } from '../../sim/turn.js';
import { projectQueue } from './compute.js';
import { money, roundsToWords } from './format.js';

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

export function budgetPreviewQueue(queue, { budget, computeSplit, pledge, canPledge }) {
  return {
    ...(queue ?? {}),
    budget,
    computeSplit,
    ...(pledge != null && canPledge ? { pledge } : {}),
  };
}

const DEFAULT_RECIPE = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.2 },
  picks: { pre: [], mid: [], post: [] },
};

function safeRecipeCost(state, draft) {
  if (!Object.hasOwn(SIZE_UNITS, draft?.sliders?.size)) return null;
  if (!Object.hasOwn(LENGTHS, draft?.sliders?.length)) return null;
  const ids = TRAIN_STAGES.flatMap((stage) => draft?.picks?.[stage] ?? []);
  if (ids.some((id) => !cardById(id))) return null;
  return recipeCost(state, draft);
}

export function recipePreview(state, draft) {
  const free = availableUnits(state);
  const errors = [];
  if (state.activeRun) errors.push('a training run is already active');
  if (state.pendingModel) errors.push('release the trained model first');

  const check = validateRecipe(state, draft);
  errors.push(...check.errors);

  const cost = safeRecipeCost(state, draft);
  if (cost?.cash > state.cash) errors.push('not enough cash');
  if (cost?.units > free) errors.push('not enough free compute');
  return {
    ok: errors.length === 0,
    errors,
    cost,
    free,
    fits: cost !== null && cost.units <= free,
  };
}

export function queuedRunProblem(state, queue) {
  const moves = queue?.moves ?? [];
  const runIndex = moves.findIndex((move) => move.type === 'startRun');
  if (runIndex < 0) return '';
  const beforeRun = structuredClone(queue ?? {});
  beforeRun.moves = beforeRun.moves.slice(0, runIndex);
  const projected = projectQueue(state, beforeRun);
  const preview = recipePreview(projected, moves[runIndex].recipe);
  return preview.errors[0] ?? '';
}

function queuedMoveResult(state, move) {
  const candidate = structuredClone(state);
  if (move.type === 'startRun') return startRun(candidate, move.recipe);
  if (move.type === 'deal') return signOffer(candidate, move.offerId, sideRng(candidate, 1));
  if (move.type === 'queueOrder') return placeOrder(candidate, move);
  return { ok: true };
}

export function queuedMoveProblem(state, queue) {
  const moves = (queue?.moves ?? []).slice(0, MAX_MOVES);
  for (let index = 0; index < moves.length; index += 1) {
    const beforeMove = { ...(queue ?? {}), moves: moves.slice(0, index) };
    const projected = projectQueue(state, beforeMove);
    const result = queuedMoveResult(projected, moves[index]);
    if (!result.ok) return result.error ?? 'queued move is no longer available';
  }
  return '';
}

export function sanitizeDraft(state, draft) {
  let size = Object.hasOwn(SIZE_UNITS, draft?.sliders?.size)
    ? draft.sliders.size
    : DEFAULT_RECIPE.sliders.size;
  if (size === 'xl' && state.era < 2) size = 'large';

  let length = Object.hasOwn(LENGTHS, draft?.sliders?.length)
    ? draft.sliders.length
    : DEFAULT_RECIPE.sliders.length;
  if (length === 'heavy' && (size === 'large' || size === 'xl')) length = 'over';

  const rawAlign = Number.isFinite(draft?.sliders?.alignShare)
    ? draft.sliders.alignShare
    : DEFAULT_RECIPE.sliders.alignShare;
  const alignShare = Number((Math.round(Math.max(0, Math.min(0.5, rawAlign)) * 20) / 20).toFixed(2));

  const picks = {};
  for (const stage of TRAIN_STAGES) {
    const selected = [];
    const groups = new Set();
    const ids = Array.isArray(draft?.picks?.[stage]) ? draft.picks[stage] : [];
    for (const id of ids) {
      const card = cardById(id);
      if (!card || card.stage !== stage || !cardUnlocked(state, card) || groups.has(card.group)) continue;
      selected.push(id);
      groups.add(card.group);
      if (selected.length >= slotsFor(state, stage)) break;
    }
    picks[stage] = selected;
  }

  return { sliders: { size, length, alignShare }, picks };
}

export function cardCostWords(card, era = 1) {
  const words = [];
  const cash = card?.cost?.cash ?? 0;
  const computeMult = card?.cost?.computeMult ?? 1;
  const turns = card?.cost?.turns ?? 0;
  if (cash !== 0) words.push(money(cash));
  if (computeMult !== 0 && computeMult !== 1) {
    const change = Math.round(Math.abs(computeMult - 1) * 100);
    words.push(`${computeMult > 1 ? '+' : '−'}${change}% compute`);
  }
  if (turns !== 0) words.push(`+${roundsToWords(era, turns)}`);
  return words;
}
