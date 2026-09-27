import { cardById, cardUnlocked, recipeCost, slotsFor, validateRecipe } from '../../sim/recipe.js';
import { availableUnits } from '../../sim/training.js';
import { inDangerZone } from '../../sim/economy.js';
import { MEETINGS } from '../../sim/data/president.js';

// A player that trains, releases, answers cards and raises money, so a run survives to its board meetings. A copy of
// scriptedActions in ui/logic/scenarios.js (not exported there), kept here so sim tests can reach votes.
const PREFERENCES = {
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'constitution', 'character', 'deliberative'],
  release: ['eval-third', 'eval-full'],
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
  const picks = { pre: pickFrom(state, 'pre', PREFERENCES.pre), mid: pickFrom(state, 'mid', PREFERENCES.mid), post: pickFrom(state, 'post', PREFERENCES.post) };
  for (const size of ['xl', 'large', 'medium', 'small']) {
    const recipe = { product: 'business', sliders: { size, length: 'optimal', alignShare: 0.4 }, picks };
    if (!validateRecipe(state, recipe).ok) continue;
    const cost = recipeCost(state, recipe);
    if (cost.units <= availableUnits(state) && cost.cash < state.cash * 0.5) return recipe;
  }
  return null;
}

export function playerActions(state) {
  const moves = [];
  const actions = {
    budget: { spend: 25, split: { training: 0.6, security: 0.15, product: 0.1, talent: 0.15 } },
    computeSplit: { safety: 0.2 },
    addressWarnings: Object.entries(state.warnings).filter(([, warning]) => !warning.deferred).map(([id]) => id),
    eventChoices: Object.fromEntries(state.pendingEvents.map((event) => [
      event.id,
      event.id === 'pledgeDrop' && event.choices.some((choice) => choice.id === 'refuse') ? 'refuse' : event.choices[0].id,
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
    moves.push({
      type: 'release',
      release: { picks: pickFrom(state, 'release', PREFERENCES.release), price: 'market', reasoning: 'off', family: 'Kestrel', generation: state.models.length + 1 },
    });
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
