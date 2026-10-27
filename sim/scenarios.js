import { SCENARIO_EVENTS } from './data/scenarioEvents.js';
import { createRng } from './rng.js';
import { ROUND_DAYS } from './time.js';
import { QUIET_S, canLand, noteStop, quietFor } from './pacing.js';

// This stream depends on the run and era, never on unrelated simulation draws.
// Era 5's card days, counted from the era's first day.
const ERA5_FIRST = 5;
const ERA5_LAST = 25;

// Story days a scenario card stays open for an answer, by era.
const answerWindow = (era) => (era === 5 ? 3 : era >= 3 ? 10 : 21);

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
    // Eras 1 and 2 last a year of story days, so they get more cards and a tighter wobble: no quiet stretch runs much
    // past a minute of clock (pacing fix, 2026-10-14).
    const long = state.era <= 2;
    const count = long ? rng.int(6, 7) : rng.int(4, 5);
    const span = 4 * ROUND_DAYS[state.era];
    const start = state.day - state.turnInEra * ROUND_DAYS[state.era] - state.dayInRound;
    // Era 5 spreads its cards from day 5 (after the summit) to day 25, so every one of its four weeks gets one.
    const at = state.era === 5 ? (i) => ERA5_FIRST + (ERA5_LAST - ERA5_FIRST) * (i / (count - 1)) : (i) => (span / (count + 1)) * (i + 1);
    const gap = state.era === 5 ? (ERA5_LAST - ERA5_FIRST) / (count - 1) : span / (count + 1);
    const wobble = Math.floor(gap / (long ? 10 : 5));
    // No card is scheduled so late that its full answer window would run past the era's last day, and each earlier
    // card leaves room for the ones after it even when left open to its deadline: an open card blocks new ones through
    // its due day, so card i comes at the latest (window + 1) days per later card before the last possible day (review
    // fix). Only era 5's short span is tight enough for this to move a card.
    const latest = span - 1 - answerWindow(state.era);
    const latestFor = (i) => latest - (answerWindow(state.era) + 1) * (count - 1 - i);
    director = state.scenarioDirector = {
      era: state.era, index: 0, nextAttempt: 0,
      slots: Array.from({ length: count }, (_, i) => start + Math.min(latestFor(i), Math.floor(at(i) + rng.int(-wobble, wobble)))),
      latest: Array.from({ length: count }, (_, i) => start + latestFor(i)),
      end: start + span,
    };
  }
  // Unanswered incidents can become irrelevant when a model is retired or an era ends.
  state.pendingEvents = state.pendingEvents.filter((card) => {
    const event = SCENARIO_EVENTS.find((row) => row.id === card.id);
    return !event || scenarioEligible(event, state);
  });
  // The pacing director's quiet backstop (sim/pacing.js): after 90 s of clock with no stop, decision or payoff, the
  // era's next card comes now instead of on its day.
  if (director.index < director.slots.length && director.slots[director.index] > state.day && quietFor(state) >= QUIET_S) {
    director.slots[director.index] = state.day;
  }
  // The pacing director holds a card only until its latest day, where it lands whatever else is on; a card held back
  // (by an open card or the spacing) past the last day with a full answer window is dropped.
  const forced = state.day >= (director.latest?.[director.index] ?? Infinity);
  if (director.index >= director.slots.length || state.day < director.slots[director.index]
    || state.day < director.nextAttempt || state.day + answerWindow(state.era) > director.end - 1
    || state.pendingEvents.some((card) => card.id.startsWith('scenario')) || !(forced || canLand(state))) return [];
  const eligible = SCENARIO_EVENTS.filter((event) => scenarioEligible(event, state) && !state.seenEvents.includes(event.id));
  if (!eligible.length) return [];
  const event = eraRng(state, director.index + 1).pick(eligible);
  const dueAt = state.day + answerWindow(state.era);
  state.pendingEvents.push({
    id: event.id, title: event.card.title, post: event.card.post,
    choices: event.card.choices.map(({ id, label, cost, backers, opposers, cashCost }) => ({ id, label, cost, backers, opposers, cashCost })),
    targets: [], landsAt: state.day, dueAt, paced: true,
  });
  noteStop(state, 'card', { movable: true, forced });
  state.seenEvents.push(event.id);
  director.index += 1;
  director.nextAttempt = state.day + (state.era === 5 ? 3 : 7);
  return [{ type: 'eventCard', id: event.id }];
}
