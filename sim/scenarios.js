import { SCENARIO_EVENTS } from './data/scenarioEvents.js';
import { createRng } from './rng.js';
import { ROUND_DAYS } from './time.js';

// This stream depends on the run and era, never on unrelated simulation draws.
const eraRng = (state, salt = 0) => createRng(((state.seed >>> 0) * 2654435761 + state.era * 104729 + salt * 7919) >>> 0);
export const scenarioEligible = (event, state) => event.eras.includes(state.era) && event.trigger(state);

export function enableScenarios(state) {
  state.eventMode = 'scenarios';
  return state;
}

export function scenarioTick(state) {
  if (state.eventMode !== 'scenarios' || state.ending) return [];
  let director = state.scenarioDirector;
  if (!director || director.era !== state.era) {
    const rng = eraRng(state);
    const count = rng.int(4, 5);
    const span = 4 * ROUND_DAYS[state.era];
    const start = state.day - state.turnInEra * ROUND_DAYS[state.era] - state.dayInRound;
    const gap = span / (count + 1);
    director = state.scenarioDirector = {
      era: state.era, index: 0, nextAttempt: 0,
      slots: Array.from({ length: count }, (_, i) => start + Math.floor(gap * (i + 1) + rng.int(-Math.floor(gap / 5), Math.floor(gap / 5)))),
      end: start + span,
    };
  }
  // Unanswered incidents can become irrelevant when a model is retired or an era ends.
  state.pendingEvents = state.pendingEvents.filter((card) => {
    const event = SCENARIO_EVENTS.find((row) => row.id === card.id);
    return !event || scenarioEligible(event, state);
  });
  if (director.index >= director.slots.length || state.day < director.slots[director.index]
    || state.day < director.nextAttempt || state.day >= director.end - 1
    || state.pendingEvents.some((card) => card.id.startsWith('scenario'))) return [];
  const eligible = SCENARIO_EVENTS.filter((event) => scenarioEligible(event, state) && !state.seenEvents.includes(event.id));
  if (!eligible.length) return [];
  const event = eraRng(state, director.index + 1).pick(eligible);
  const dueAt = Math.min(state.day + (state.era === 5 ? 3 : state.era >= 3 ? 10 : 21), director.end - 1);
  state.pendingEvents.push({
    id: event.id, title: event.card.title, post: event.card.post,
    choices: event.card.choices.map(({ id, label, cost, backers, opposers, cashCost }) => ({ id, label, cost, backers, opposers, cashCost })),
    targets: [], landsAt: state.day, dueAt,
  });
  state.seenEvents.push(event.id);
  director.index += 1;
  director.nextAttempt = state.day + (state.era === 5 ? 3 : 7);
  return [{ type: 'eventCard', id: event.id }];
}
