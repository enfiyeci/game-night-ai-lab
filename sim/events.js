import { EVENTS } from './data/events.js';
import { EVENTS_6C } from './data/events6c.js';
import { REAL_EVENTS } from './data/realEvents.js';
import { BOARD_EVENTS } from './data/boardEvents.js';
import { SCENARIO_EVENTS } from './data/scenarioEvents.js';
import { scenarioEligible } from './scenarios.js';
import { warningResponse } from './data/warningResponses.js';
import { hasLine } from './constitution.js';
import { EVENT_TIMING, DEFAULT_EVENT_TIMING } from './data/eventTiming.js';
import { ROUND_DAYS, nextRoundDay, roundMarkDay } from './time.js';
import { eraById } from './data/eras.js';
import { sideRng } from './contracts.js';
import { FEED_KEEP } from './feedLive.js';
import {
  failedPresidentPromises,
  promiseCallCard,
  promiseCallKey,
  promiseFallback,
  resolvePromiseCall,
} from './promises.js';

const MAX_CARDS = 2;
const allEvents = () => [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS, ...BOARD_EVENTS, ...SCENARIO_EVENTS];
const byId = (id) => allEvents().find((event) => event.id === id);
export const isAnchorId = (id) => Boolean(byId(id)?.anchor);
const limitedCardCount = (state) => state.pendingEvents
  .filter((card) => !isAnchorId(card.eventId ?? card.id)).length;
const KIND_ORDER = ['internal', 'training'];
const orderedEvents = () => {
  const events = allEvents();
  return [
    ...KIND_ORDER.flatMap((kind) => events.filter((event) => event.kind === kind)),
    ...events.filter((event) => !KIND_ORDER.includes(event.kind)),
  ];
};
// A row may name its own targets (a card planted by more than one flag); otherwise the flag decides.
const targetIndices = (state, event) => event.targets ? event.targets(state) : event.flag
  ? state.models.flatMap((model, index) => ((model.flags ?? []).includes(event.flag) ? [index] : []))
  : [];
const publicCard = (state, event) => ({
  id: event.id,
  title: event.card.title,
  post: event.card.post,
  choices: event.card.choices.map(({ id, label, cost, backers, opposers }) => ({ id, label, cost, backers, opposers })),
  targets: targetIndices(state, event),
  ...(event.card.kicker ? { kicker: event.card.kicker } : {}),
  ...(event.card.watching ? { watching: [...event.card.watching] } : {}),
});

export function nextRound(state) {
  if (state.turnInEra + 1 >= eraById(state.era).turns && state.era < 5) return { era: state.era + 1, round: 0 };
  return { era: state.era, round: state.turnInEra + 1 };
}

export function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, day: state.day, handle, text, tag });
  if (state.feed.length > FEED_KEEP) state.feed.splice(0, state.feed.length - FEED_KEEP);
}

function queuePromiseCalls(state, event, out) {
  for (const promise of failedPresidentPromises(state)) {
    const key = promiseCallKey(state, promise);
    const queued = state.pendingEvents.some((pending) => pending.id === key);
    if (queued) continue;
    if (limitedCardCount(state) >= MAX_CARDS) {
      state.warnings[key] = {
        turn: state.turn,
        deferred: true,
        eventId: event.id,
        promiseIndex: state.promises.indexOf(promise),
        promiseId: promise.id,
        promiseMeeting: promise.meeting,
      };
      continue;
    }
    delete state.warnings[key];
    const card = promiseCallCard(state, event, promise);
    state.pendingEvents.push(card);
    out.push({ type: 'eventCard', id: card.id, eventId: event.id, promiseId: promise.id, promiseMeeting: promise.meeting });
  }
}

export function eventsTick(state, rng) {
  const out = [];
  for (const event of orderedEvents()) {
    if (event.kind === 'scenario') continue;
    if (state.eventMode === 'scenarios' && !['internal', 'training', 'board', 'promise'].includes(event.kind)) continue;
    if (event.kind === 'promise') {
      queuePromiseCalls(state, event, out);
      continue;
    }
    if (state.pendingEvents.some((pending) => pending.id === event.id)) continue;
    if (event.kind !== 'internal' && !event.repeatable && state.seenEvents.includes(event.id)) continue;
    const hasWarning = Object.hasOwn(state.warnings, event.id);
    const warned = hasWarning ? state.warnings[event.id] : null;
    if (hasWarning && warned?.turn < state.turn) {
      delete state.warnings[event.id];
      if ((event.kind === 'planted' || event.repeatable) && !event.trigger(state, rng)) continue;
    } else if (!hasWarning) {
      if (!event.trigger(state, rng)) continue;
      if (event.warning) {
        state.warnings[event.id] = { turn: state.turn };
        pushFeed(state, event.warning.handle, event.warning.text, 'warning');
        out.push({ type: 'warning', id: event.id });
        continue;
      }
    } else continue;
    if (event.id === 'president' && hasLine(state, 'no-power-grab')) {
      event.card.choices.find((choice) => choice.id === 'refuse').effects(state, []);
      if (!state.seenEvents.includes(event.id)) state.seenEvents.push(event.id);
      pushFeed(state, '@your_model', "The model's hard line refused the request.", 'event');
      out.push({ type: 'eventResolved', id: event.id, eventId: event.id, choiceId: 'refuse', auto: true });
      continue;
    }
    if (!event.bypassCardLimit && limitedCardCount(state) >= MAX_CARDS) {
      state.warnings[event.id] = { turn: state.turn, deferred: true };
      continue;
    }
    state.pendingEvents.push(publicCard(state, event));
    if (event.kind !== 'internal' && !state.seenEvents.includes(event.id)) state.seenEvents.push(event.id);
    out.push({ type: 'eventCard', id: event.id });
  }
  return out;
}

export function addressWarning(state, id) {
  const event = byId(id);
  const warned = Object.hasOwn(state.warnings, id) ? state.warnings[id] : null;
  if (!event || event.kind === 'internal' || event.kind === 'promise' || !warned || warned.deferred) {
    return { ok: false, error: `no warning ${id}` };
  }
  const cost = warningResponse(id, state).cost;
  if (state.cash < cost) return { ok: false, error: 'not enough cash for this response' };
  state.cash -= cost;
  delete state.warnings[id];
  if (event.flag) {
    for (const model of state.models) model.flags = (model.flags ?? []).filter((flag) => flag !== event.flag);
  }
  if (event.addressEffects) event.addressEffects(state);
  if (!state.seenEvents.includes(id)) state.seenEvents.push(id);
  event.defuse?.(state);
  return { ok: true, id };
}

export function resolveEvent(state, id, choiceId) {
  const index = state.pendingEvents.findIndex((pending) => pending.id === id);
  if (index < 0) return { ok: false, error: `no pending event ${id}` };
  const pending = state.pendingEvents[index];
  const event = byId(pending.eventId ?? pending.id);
  const choice = event?.kind === 'promise'
    ? pending.choices?.find((candidate) => candidate.id === choiceId)
    : event?.card.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return { ok: false, error: `unknown choice ${choiceId}` };
  if (event.kind === 'scenario' && !scenarioEligible(event, state)) {
    state.pendingEvents.splice(index, 1);
    return { ok: false, error: 'this situation no longer applies' };
  }
  if (choice.cashCost > 0 && choice.cashCost > state.cash) return { ok: false, error: 'not enough cash for this response' };
  if (event.kind === 'promise') {
    const result = resolvePromiseCall(state, pending, choiceId);
    if (!result.ok) return result;
  } else {
    const catalogChoice = event?.card.choices.find((candidate) => candidate.id === choiceId);
    if (!catalogChoice) return { ok: false, error: `unknown choice ${choiceId}` };
    const targets = pending.targets ?? targetIndices(state, event);
    catalogChoice.effects(state, targets);
    if (event.crisis) state.flags.boardCrisis = true;
  }
  if (hasLine(state, 'honest') && ['defend', 'deny', 'stonewall', 'coverup', 'discredit', 'smear'].includes(choice.id)) state.staffTrust -= 3;
  state.pendingEvents.splice(index, 1);
  return { ok: true, id: pending.id, choiceId };
}

export function fallbackChoice(id, pending) {
  const event = byId(pending?.eventId ?? id);
  if (event?.kind === 'promise') return promiseFallback(pending);
  return event?.fallback ?? event?.card.choices.at(-1)?.id;
}

// A round mark falls on this story day (walking era changes, as roundMarkDay does).
function isMarkDay(state, day) {
  for (let k = 1; k <= 40; k += 1) {
    const mark = roundMarkDay(state, k);
    if (mark >= day) return mark === day;
  }
  return false;
}

export function stampNewCards(state) {
  const days = ROUND_DAYS[state.era];
  state.pendingEvents.forEach((card, index) => {
    if (card.landsAt != null) return;
    const rng = sideRng(state, 9 + index);
    const anchor = byId(card.eventId ?? card.id)?.anchor;
    card.landsAt = anchor
      ? state.day + Math.floor(days * anchor.at)
      : state.day + rng.int(0, Math.max(0, Math.floor(days * 0.8) - 1));
    const timing = EVENT_TIMING[card.eventId ?? card.id] ?? DEFAULT_EVENT_TIMING;
    card.dueAt = card.landsAt + Math.min(timing.days, state.era === 5 ? 6 : Infinity);
    // The run ends at era 5's last mark: a card due after it could never fall back, so it is due the day before.
    if (state.era === 5 && state.turnInEra >= eraById(5).turns - 1) card.dueAt = Math.min(card.dueAt, nextRoundDay(state) - 1);
    // A board card must resolve before its meeting opens: due by the day before the vote round's mark.
    if (byId(card.id)?.kind === 'board') {
      card.dueAt = Math.min(card.dueAt, roundMarkDay(state, eraById(state.era).turns - state.turnInEra) - 1);
    }
    // The emergency vote must be known the day before its mark, when the meeting opens: a card due on a mark day
    // would resolve inside the mark's own step. One day earlier.
    if (card.id === 'boardRevolt' && isMarkDay(state, card.dueAt)) card.dueAt -= 1;
  });
  for (const warning of Object.values(state.warnings)) {
    if (warning.deferred || warning.dueAt != null) continue;
    warning.day = state.day;
    warning.dueAt = nextRoundDay(state);
  }
}

export function resolveDue(state) {
  const out = [];
  for (const pending of [...state.pendingEvents]) {
    if (pending.dueAt == null || state.day < pending.dueAt) continue;
    const choiceId = fallbackChoice(pending.id, pending);
    const result = resolveEvent(state, pending.id, choiceId);
    if (result.ok) out.push({ type: 'eventResolved', id: pending.id, eventId: pending.eventId ?? pending.id, choiceId, promiseId: pending.promiseId, auto: true, reason: 'deadline' });
  }
  return out;
}
