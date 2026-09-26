import { EVENTS } from './data/events.js';
import { hasLine } from './constitution.js';
import {
  failedPresidentPromises,
  promiseCallCard,
  promiseCallKey,
  promiseFallback,
  resolvePromiseCall,
} from './promises.js';

const MAX_CARDS = 2;
const byId = (id) => EVENTS.find((event) => event.id === id);
const orderedEvents = [...EVENTS.filter((event) => event.kind === 'internal'), ...EVENTS.filter((event) => event.kind !== 'internal')];
const targetIndices = (state, event) => event.flag
  ? state.models.flatMap((model, index) => ((model.flags ?? []).includes(event.flag) ? [index] : []))
  : [];
const publicCard = (state, event) => ({
  id: event.id,
  title: event.card.title,
  post: event.card.post,
  choices: event.card.choices.map(({ id, label, cost, backers, opposers }) => ({ id, label, cost, backers, opposers })),
  targets: targetIndices(state, event),
});

export function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, handle, text, tag });
  if (state.feed.length > 40) state.feed.splice(0, state.feed.length - 40);
}

function queuePromiseCalls(state, event, out) {
  for (const promise of failedPresidentPromises(state)) {
    const queued = state.pendingEvents.some((pending) =>
      pending.eventId === event.id
      && pending.promiseId === promise.id
      && pending.promiseMeeting === promise.meeting);
    if (queued) continue;
    const key = promiseCallKey(promise);
    if (state.pendingEvents.length >= MAX_CARDS) {
      state.warnings[key] = {
        turn: state.turn,
        deferred: true,
        eventId: event.id,
        promiseId: promise.id,
        promiseMeeting: promise.meeting,
      };
      continue;
    }
    delete state.warnings[key];
    const card = promiseCallCard(event, promise);
    state.pendingEvents.push(card);
    pushFeed(state, card.post.handle, card.post.text, 'event');
    out.push({ type: 'eventCard', id: event.id, promiseId: promise.id, promiseMeeting: promise.meeting });
  }
}

export function eventsTick(state, rng) {
  const out = [];
  for (const event of orderedEvents) {
    if (event.kind === 'promise') {
      queuePromiseCalls(state, event, out);
      continue;
    }
    if (state.pendingEvents.some((pending) => pending.id === event.id)) continue;
    if (event.kind !== 'internal' && state.seenEvents.includes(event.id)) continue;
    const hasWarning = Object.hasOwn(state.warnings, event.id);
    const warned = hasWarning ? state.warnings[event.id] : null;
    if (hasWarning && warned?.turn < state.turn) {
      delete state.warnings[event.id];
      if (event.kind === 'planted' && !event.trigger(state, rng)) continue;
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
      out.push({ type: 'eventResolved', id: event.id, choiceId: 'refuse', auto: true });
      continue;
    }
    if (state.pendingEvents.length >= MAX_CARDS) {
      state.warnings[event.id] = { turn: state.turn, deferred: true };
      continue;
    }
    state.pendingEvents.push(publicCard(state, event));
    if (event.kind !== 'internal') state.seenEvents.push(event.id);
    pushFeed(state, event.card.post.handle, event.card.post.text, 'event');
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
  state.cash -= 5 * state.era;
  delete state.warnings[id];
  if (event.flag) {
    for (const model of state.models) model.flags = (model.flags ?? []).filter((flag) => flag !== event.flag);
  }
  if (event.addressEffects) event.addressEffects(state);
  if (!state.seenEvents.includes(id)) state.seenEvents.push(id);
  return { ok: true, id };
}

export function resolveEvent(state, id, choiceId) {
  let index = state.pendingEvents.findIndex((pending) => pending.id === id);
  if (index < 0) index = state.pendingEvents.findIndex((pending) => pending.eventId === id);
  if (index < 0) return { ok: false, error: `no pending event ${id}` };
  const pending = state.pendingEvents[index];
  const event = byId(pending.eventId ?? pending.id);
  const choice = event?.kind === 'promise'
    ? pending.choices?.find((candidate) => candidate.id === choiceId)
    : event?.card.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return { ok: false, error: `unknown choice ${choiceId}` };
  if (event.kind === 'promise') {
    const result = resolvePromiseCall(state, pending, choiceId);
    if (!result.ok) return result;
  } else {
    const catalogChoice = event?.card.choices.find((candidate) => candidate.id === choiceId);
    if (!catalogChoice) return { ok: false, error: `unknown choice ${choiceId}` };
    const targets = pending.targets ?? targetIndices(state, event);
    catalogChoice.effects(state, targets);
  }
  if (hasLine(state, 'honest') && ['defend', 'deny', 'stonewall', 'coverup'].includes(choice.id)) state.staffTrust -= 3;
  state.pendingEvents.splice(index, 1);
  return { ok: true, id: pending.id, choiceId };
}

export function fallbackChoice(id, pending) {
  const event = byId(pending?.eventId ?? id);
  if (event?.kind === 'promise') return promiseFallback(pending);
  return event?.fallback ?? event?.card.choices.at(-1)?.id;
}
