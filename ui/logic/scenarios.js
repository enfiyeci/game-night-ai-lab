import { createInitialState } from '../../sim/state.js';
import { createRng } from '../../sim/rng.js';
import { advanceDays, applyActions, endTurn } from '../../sim/turn.js';
import { cardById, cardUnlocked, recipeCost, slotsFor, validateRecipe } from '../../sim/recipe.js';
import { availableUnits } from '../../sim/training.js';
import { inDangerZone } from '../../sim/economy.js';
import { boardVoteThisRound } from '../../sim/board.js';
import { MEETINGS } from '../../sim/data/president.js';
import { setAutomation } from '../../sim/automation.js';
import { turnRecord } from './finance.js';

const preferences = {
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'constitution', 'character', 'deliberative'],
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
// While it waits, the script still buys compute when it runs short, so a run that stalls for want of a few units
// resumes instead of idling into the era gate. Under the compute race plan
// (docs/superpowers/plans/2026-09-26-compute-race.md) board cards stay between rounds, so seed 1 signs a
// 27-unit CoreFlame card kept from turn 5 instead of a fresh 30-unit one, and its era-3 run sat 0.04 units short.
function readyToRelease(seed) {
  const rng = createRng(seed + 1000);
  let state = midEra3(seed);
  for (let guard = 0; guard < 8 && state.activeRun && !state.ending; guard += 1) {
    const actions = scriptedActions(state);
    ({ state } = endTurn(state, { ...actions, moves: actions.moves.filter((move) => move.type === 'deal') }, rng));
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

// A run with full reasoning RL that ends with the cheating trace unanswered. The dice are played from seed 1 up
// until one rolls the hazard (an even chance each), so the state is always reached by the real sim.
function hazardState(seed) {
  let base = SCENARIOS.era3Idle(seed);
  if (base.ending) return base;
  const recipe = {
    sliders: { size: 'small', length: 'optimal', alignShare: 0.25 },
    picks: { pre: ['licensed-data'], mid: ['anneal'], post: ['human-sft', 'reasoning-rl', 'deliberative'] },
  };
  const basic = { budget: { spend: 25, split: { training: 0.6, security: 0.15, product: 0.1, talent: 0.15 } }, computeSplit: { safety: 0.2 } };
  if (availableUnits(base) < recipeCost(base, recipe).units) {
    const offer = base.compute.offers.find((candidate) => candidate.supplier === 'coreflame' && !candidate.viaQueue);
    const eventChoices = Object.fromEntries(base.pendingEvents.map((event) => [event.id, event.choices[0].id]));
    if (offer) {
      base = endTurn(base, {
        ...basic,
        eventChoices,
        moves: [{ type: 'deal', offerId: offer.id }],
      }, createRng(seed + 1000)).state;
    }
  }
  let last = base;
  for (let dice = 1; dice <= 20; dice += 1) {
    const rng = createRng(dice);
    const eventChoices = Object.fromEntries(base.pendingEvents.map((event) => [event.id, event.choices[0].id]));
    let state = endTurn(structuredClone(base), {
      ...basic,
      eventChoices,
      moves: [{ type: 'startRun', recipe }],
    }, rng).state;
    if (!state.activeRun) return base;
    for (let i = 0; i < 6 && state.activeRun && !state.ending; i += 1) {
      const eventChoices = Object.fromEntries(state.pendingEvents.map((event) => [event.id, event.choices[0].id]));
      state = endTurn(state, { ...basic, moves: [], eventChoices }, rng).state;
    }
    last = state;
    if (state.pendingModel?.hazard) return state;
  }
  return last;
}

// An era-4 turn with the hand-offs pushed and little checked, for the grid and office screenshots.
function automationState(seed) {
  const state = atEra(seed, 4);
  if (state.ending || state.era !== 4) return state;
  setAutomation(state, { levels: { review: 3, experiments: 3, choosing: 2 }, checks: { reviewers: 1 } });
  return state;
}

// A state with the x2 line card waiting, for the screen-wall screenshot.
function ownLineState(seed) {
  const rng = createRng(seed);
  let state = atEra(seed, 4);
  const automation = { levels: { review: 3, experiments: 3, choosing: 2, direction: 1 }, checks: { reviewers: 3, aiReview: true } };
  for (let guard = 0; guard < 6 && !state.ending && !state.pendingEvents.some((pending) => pending.id === 'ownLine'); guard += 1) {
    ({ state } = endTurn(state, { ...scriptedActions(state), automation: state.era === 4 ? automation : { checks: automation.checks } }, rng));
  }
  // Real time: a card lands a few story days after the mark that made it; walk the clock to it.
  const card = state.pendingEvents.find((pending) => pending.id === 'ownLine');
  if (card && !state.ending && card.landsAt > state.day) ({ state } = advanceDays(state, card.landsAt - state.day, rng));
  return state;
}

// Era 5 with choosing experiments at Leads and one monitor, walked to a mark where the AI asks for both of its
// moves, for the racks panel screenshot. Seed 1 ends in era 4, so the run is played from the next seed.
function racksState(seed) {
  const rng = createRng(seed + 1);
  let state = atEra(seed + 1, 5);
  const automation = { levels: { choosing: 3 }, checks: { monitors: 1 } };
  for (let guard = 0; guard < 6 && !state.ending && state.era === 5; guard += 1) {
    const next = step(state, { ...scriptedActions(state), automation }, rng).state;
    if (next.ending) break; // keep the last state that still has the office on screen
    state = next;
    if (state.automation.proposals.some((proposal) => proposal.risky)) break;
  }
  // A card that has landed would hold the stage (the panel steps aside for it), so answer it with its first choice.
  const landed = state.pendingEvents.filter((card) => card.landsAt <= state.day);
  const eventChoices = Object.fromEntries(landed.map((card) => [card.id, card.choices[0].id]));
  return landed.length ? applyActions(state, { eventChoices }, rng).state : state;
}

export const SCENARIOS = {
  start,
  midEra3,
  era3Idle: (seed) => throughTurn(seed, 20, (s) => s.era === 3 && !s.activeRun && !s.pendingModel),
  release: releaseState,
  readyToRelease,
  event: eventState,
  meeting: (seed) => throughTurn(seed, 20, (s) => s.meeting?.id === 'first'),
  // Seeds 1 and 2 end in era 4 under the current balance. The offset keeps debug seeds 1–4 on runs
  // that reach the second meeting while preserving the same scripted playthrough.
  meeting2: (seed) => throughTurn(seed + 2, 20, (s) => s.meeting?.id === 'second'),
  summit: (seed) => throughTurn(seed, 20, (s) => s.era === 5 && s.turnInEra === 0 && !s.deal),
  ending: (seed) => throughTurn(seed, 20),
  danger: dangerState,
  era2Deals: dealsState,
  era3Queue: (seed) => atEra(seed, 3),
  era3Budget: budgetState,
  era4Power: powerState,
  boardVote: (seed) => throughTurn(seed, 20, (s) => boardVoteThisRound(s)),
  hazard: hazardState,
  automation: automationState,
  ownLine: ownLineState,
  racks: racksState,
};
