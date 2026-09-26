import { createInitialState } from '../../sim/state.js';
import { createRng } from '../../sim/rng.js';
import { advanceDays, endTurn } from '../../sim/turn.js';
import { cardById, cardUnlocked, recipeCost, slotsFor, validateRecipe } from '../../sim/recipe.js';
import { availableUnits } from '../../sim/training.js';
import { inDangerZone } from '../../sim/economy.js';
import { boardVoteThisRound } from '../../sim/board.js';
import { MEETINGS } from '../../sim/data/president.js';
import { turnRecord } from './finance.js';

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
  const actions = {
    budget: { spend: 25, split: { training: 0.6, security: 0.15, product: 0.1, talent: 0.15 } },
    computeSplit: { safety: 0.2 },
    addressWarnings: Object.entries(state.warnings)
      .filter(([, warning]) => !warning.deferred)
      .map(([id]) => id),
    eventChoices: Object.fromEntries(state.pendingEvents.map((event) => [
      event.id,
      event.id === 'pledgeDrop' && event.choices.some((choice) => choice.id === 'refuse')
        ? 'refuse' : event.choices[0].id,
    ])),
    moves,
  };
  if (state.turn === 0) actions.pledge = 0.1;
  if (state.pendingModel?.hazard) actions.hazardChoice = 'ignore';
  if (state.meeting) {
    const meeting = MEETINGS.find((entry) => entry.id === state.meeting.id);
    moves.push({ type: 'meeting' });
    actions.presidentAnswers = meeting.exchanges.map((exchange) => (
      exchange.answers.find((answer) => answer.style === 'plain') ?? exchange.answers[0]
    ).id);
  }
  if (state.pendingModel) {
    moves.push({ type: 'release', release: release(state) });
  } else if (!state.activeRun) {
    const recipe = affordableRecipe(state);
    if (recipe) moves.push({ type: 'startRun', recipe });
  }
  if (inDangerZone(state) && state.flags.lastRoundEra !== state.era) {
    moves.push({ type: 'raise', archetype: 'vc' });
  } else if (availableUnits(state) < 5) {
    const offer = state.compute.offers.find((candidate) => candidate.supplier === 'coreflame' && !candidate.viaQueue);
    if (offer && offer.upfront <= state.cash) moves.push({ type: 'deal', offerId: offer.id });
  }
  actions.moves = moves.slice(0, 2);
  return actions;
}

// Finance records for every scenario state, so the finance planner has a past on debug routes too.
const histories = new WeakMap();
export const scenarioHistory = (state) => histories.get(state) ?? [];

function step(state, actions, rng) {
  const update = endTurn(state, actions, rng);
  if (!state.ending) histories.set(update.state, [...scenarioHistory(state), turnRecord(state, update.state, update.events)]);
  return update;
}

function throughTurn(seed, targetTurn, stopWhen = () => false) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  while (!state.ending && state.turn < targetTurn && !stopWhen(state)) {
    ({ state } = step(state, scriptedActions(state), rng));
  }
  return state;
}

const start = (seed) => createInitialState({ seed });
const releaseState = (seed) => throughTurn(seed, 3);
// The first era-3 turn with a training run under way, so the HUD shows a project and its progress bar.
const midEra3 = (seed) => throughTurn(seed, 12, (s) => s.era === 3 && s.activeRun !== null);
const atEra = (seed, era) => throughTurn(seed, 20, (state) => state.era === era);

function eventState(seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  const landed = (candidate) => candidate.pendingEvents.some((event) => event.landsAt <= candidate.day);
  while (!state.ending && state.turn < 20 && !landed(state)) {
    ({ state } = endTurn(state, scriptedActions(state), rng));
    const nextLanding = Math.min(...state.pendingEvents.map((event) => event.landsAt));
    if (Number.isFinite(nextLanding) && nextLanding > state.day) {
      ({ state } = advanceDays(state, nextLanding - state.day, rng));
    }
  }
  return state;
}

// An era-3 state with a trained model waiting to be released (for the release dialog and reveal screenshots).
function readyToRelease(seed) {
  const rng = createRng(seed + 1000);
  let state = midEra3(seed);
  for (let guard = 0; guard < 8 && state.activeRun && !state.ending; guard += 1) {
    ({ state } = endTurn(state, { ...scriptedActions(state), moves: [] }, rng));
  }
  return state;
}

function dealsState(seed) {
  const rng = createRng(seed);
  let state = atEra(seed, 2);
  if (state.ending || state.era !== 2) return state;
  const actions = scriptedActions(state);
  actions.moves = [{ type: 'raise', archetype: 'vc' }, ...actions.moves].slice(0, 2);
  ({ state } = step(state, actions, rng));
  return state;
}

function budgetState(seed) {
  const rng = createRng(seed);
  let state = atEra(seed, 3);
  if (state.ending || state.era !== 3) return state;
  ({ state } = step(state, scriptedActions(state), rng));
  return state;
}

function powerState(seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  while (!state.ending && state.era < 4) {
    const actions = scriptedActions(state);
    const grid = state.compute.offers.find((offer) => offer.supplier === 'grid');
    if (grid && grid.upfront <= state.cash) {
      actions.moves = [{ type: 'deal', offerId: grid.id }, ...actions.moves].slice(0, 2);
    }
    ({ state } = step(state, actions, rng));
  }
  if (state.ending || state.era !== 4) return state;

  let actions = scriptedActions(state);
  actions.moves = [{ type: 'buildSite', source: 'gas' }, { type: 'raise', archetype: 'vc' }];
  ({ state } = step(state, actions, rng));
  if (state.ending || state.era !== 4) return state;

  actions = scriptedActions(state);
  const chips = state.compute.offers.find((offer) => (
    (offer.supplier === 'verde' || offer.supplier === 'loi') && offer.upfront <= state.cash
  ));
  if (chips) actions.moves = [{ type: 'deal', offerId: chips.id }, ...actions.moves].slice(0, 2);
  ({ state } = step(state, actions, rng));
  while (!state.ending && state.era === 4 && state.turn < 15) {
    ({ state } = step(state, scriptedActions(state), rng));
  }
  return state;
}

function dangerState(seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  while (!state.ending && state.turn < 20 && !(state.era >= 2 && inDangerZone(state))) {
    const moves = state.turn === 0 ? [{
      type: 'startRun',
      recipe: {
        sliders: { size: 'small', length: 'optimal', alignShare: 0.4 },
        picks: { pre: [], mid: [], post: [] },
      },
    }] : state.pendingModel ? [{ type: 'release', release: release(state) }] : [];
    ({ state } = step(state, {
      budget: {
        spend: 70,
        split: { training: 0.55, security: 0.05, product: 0.05, talent: 0.35 },
      },
      computeSplit: { safety: 0.05 },
      moves,
    }, rng));
  }
  return state;
}

export const SCENARIOS = {
  start,
  midEra3,
  era3Idle: (seed) => throughTurn(seed, 20, (s) => s.era === 3 && !s.activeRun && !s.pendingModel),
  release: releaseState,
  readyToRelease,
  event: eventState,
  summit: (seed) => throughTurn(seed, 20, (s) => s.era === 5 && s.turnInEra === 0 && !s.deal),
  ending: (seed) => throughTurn(seed, 20),
  danger: dangerState,
  era2Deals: dealsState,
  era3Queue: (seed) => atEra(seed, 3),
  era3Budget: budgetState,
  era4Power: powerState,
  boardVote: (seed) => throughTurn(seed, 20, (s) => boardVoteThisRound(s)),
};
