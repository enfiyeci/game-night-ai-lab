import { createInitialState } from '../../sim/state.js';
import { createRng } from '../../sim/rng.js';
import { endTurn } from '../../sim/turn.js';
import { cardById, cardUnlocked, recipeCost, slotsFor, validateRecipe } from '../../sim/recipe.js';
import { availableUnits } from '../../sim/training.js';
import { inDangerZone } from '../../sim/economy.js';

const preferences = {
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'character', 'deliberative', 'spec-light'],
  release: ['eval-third', 'eval-full', 'channel-api'],
};

function pickFrom(state, stage, ids) {
  const picks = [];
  const groups = new Set();
  for (const id of ids) {
    const card = cardById(id);
    if (picks.length >= slotsFor(state, stage)) break;
    if (card && card.stage === stage && cardUnlocked(state, card) && !groups.has(card.group)) {
      picks.push(id);
      groups.add(card.group);
    }
  }
  return picks;
}

function affordableRecipe(state) {
  const picks = {
    pre: pickFrom(state, 'pre', preferences.pre),
    mid: pickFrom(state, 'mid', preferences.mid),
    post: pickFrom(state, 'post', preferences.post),
  };
  for (const size of ['xl', 'large', 'medium', 'small']) {
    const recipe = { sliders: { size, length: 'optimal', alignShare: 0.4 }, picks };
    if (!validateRecipe(state, recipe).ok) continue;
    const cost = recipeCost(state, recipe);
    if (cost.units <= availableUnits(state) && cost.cash < state.cash * 0.5) return recipe;
  }
  return null;
}

const release = (state) => ({
  picks: pickFrom(state, 'release', preferences.release),
  price: 'market',
  reasoning: 'off',
  family: 'Kestrel',
  generation: state.models.length + 1,
});

function scriptedActions(state) {
  const moves = [];
  if (state.pendingModel) {
    moves.push({ type: 'release', release: release(state) });
  } else if (!state.activeRun) {
    const recipe = affordableRecipe(state);
    if (recipe) moves.push({ type: 'startRun', recipe });
  }
  if (inDangerZone(state) && state.flags.lastRoundEra !== state.era) {
    moves.push({ type: 'raise', archetype: 'vc' });
  } else if (availableUnits(state) < 5) {
    moves.push({ type: 'deal', supplierId: 'coreflame' });
  }
  return {
    budget: { spend: 25, split: { training: 0.2, safety: 0.4, security: 0.15, product: 0.1, talent: 0.15 } },
    moves: moves.slice(0, 2),
  };
}

function throughTurn(seed, targetTurn, stopWhen = () => false) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  while (!state.ending && state.turn < targetTurn && !stopWhen(state)) {
    ({ state } = endTurn(state, scriptedActions(state), rng));
  }
  return state;
}

const start = (seed) => createInitialState({ seed });
const releaseState = (seed) => throughTurn(seed, 3);
// The first era-3 turn with a training run under way, so the HUD shows a project and its progress bar.
const midEra3 = (seed) => throughTurn(seed, 12, (s) => s.era === 3 && s.activeRun !== null);

export const SCENARIOS = {
  start,
  midEra3,
  release: releaseState,
  // After Plan 2A merges, this scenario will stop with a pending event card.
  event: midEra3,
  // After Plan 2A merges, this scenario will stop with the era-5 summit open.
  summit: (seed) => throughTurn(seed, 20, (s) => s.era === 5),
  ending: (seed) => throughTurn(seed, 20),
};
