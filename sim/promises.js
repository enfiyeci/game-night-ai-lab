import { ERAS } from './data/eras.js';
import { PROMISES } from './data/promises.js';
import { hasLine } from './constitution.js';
import { FEED_KEEP } from './feedLive.js';

const LAST_TURN = ERAS.reduce((sum, era) => sum + era.turns, 0) - 1;
const ERA3_FIRST_TURN = ERAS[0].turns + ERAS[1].turns;

function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, day: state.day, handle, text, tag });
  if (state.feed.length > FEED_KEEP) state.feed.splice(0, state.feed.length - FEED_KEEP);
}

const promiseDefinition = (promise) => PROMISES[promise.id];
const isPresidentPromise = (promise) => promise?.source === 'president' && Object.hasOwn(PROMISES, promise.id);
const isEndgamePromise = (promise) => promise.dueTurn >= LAST_TURN;

export function createPresidentPromise(id, meeting, turn, state) {
  const definition = PROMISES[id];
  if (!definition) return null;
  if (state) {
    state.promiseBaselines ??= {};
    state.promiseBaselines[`${meeting}:${id}`] = {
      amendments: state.constitution.amendments.length,
      deals: (state.compute.deals ?? []).length,
      models: state.models.length,
    };
  }
  const dueOffset = meeting === 'first' ? 4 : 2;
  const due = Math.min(turn + dueOffset, LAST_TURN);
  return {
    source: 'president',
    id,
    text: definition.text,
    meeting,
    madeTurn: turn,
    dueTurn: definition.touchesConstitution ? Math.max(due, ERA3_FIRST_TURN) : due,
    status: 'open',
    stalled: false,
    leaked: false,
  };
}

// Thanks the lab for each open President promise that has come due (by `due`) and is kept.
export function keepPromises(state, due = (promise) => promise.dueTurn <= state.turn) {
  for (const promise of state.promises) {
    if (!isPresidentPromise(promise)
      || promise.status !== 'open'
      || isEndgamePromise(promise)
      || !due(promise)) continue;
    if (!promiseDefinition(promise).check(state, promise)) continue;
    promise.status = 'kept';
    state.govFavor.us += 5;
    pushFeed(state, '@executive_office', `Thank you to the lab for keeping its promise: “${promise.text}”`, 'event');
  }
}

export function promiseUpkeep(state, rng) {
  keepPromises(state);
  for (const promise of state.promises) {
    if (!isPresidentPromise(promise) || promise.status !== 'open' || promise.leaked) continue;
    const contradictsHeldLine = promiseDefinition(promise).contradicts.some((line) => hasLine(state, line));
    if (!contradictsHeldLine || !rng.chance(0.15)) continue;
    promise.leaked = true;
    state.publicTrust -= 4;
    state.staffTrust -= 6;
    pushFeed(state, '@leakwire', `memo: lab promised the President it would … ${promise.text}`, 'event');
  }
}

export const promiseCallKey = (state, promise) => `promiseCall:${state.promises.indexOf(promise)}`;

export function failedPresidentPromises(state) {
  return state.promises.filter((promise) =>
    isPresidentPromise(promise)
    && promise.status === 'open'
    && !isEndgamePromise(promise)
    && promise.dueTurn <= state.turn
    && !promiseDefinition(promise).check(state, promise));
}

export function judgeEndingPromises(state) {
  for (const promise of state.promises) {
    if (!isPresidentPromise(promise) || promise.status !== 'open') continue;
    promise.status = promiseDefinition(promise).check(state, promise) ? 'kept' : 'broken';
  }
}

export function promiseCallCard(state, event, promise) {
  const promiseIndex = state.promises.indexOf(promise);
  const definition = promiseDefinition(promise);
  const choices = event.card.choices
    .filter((choice) => choice.id !== 'stall' || !promise.stalled)
    .map(({ id, label, cost, backers, opposers }) => ({
      id,
      label: id === 'deliver' ? definition.deliver.label : label,
      cost,
      backers,
      opposers,
    }));
  return {
    id: promiseCallKey(state, promise),
    eventId: event.id,
    title: event.card.title,
    post: { handle: '@executive_office', text: `You promised us: “${promise.text}”` },
    choices,
    targets: [],
    promiseIndex,
    promiseId: promise.id,
    promiseMeeting: promise.meeting,
  };
}

function pendingPromise(state, pending) {
  const promise = state.promises[pending.promiseIndex];
  return (
    isPresidentPromise(promise)
    && promise.id === pending.promiseId
    && promise.meeting === pending.promiseMeeting
    && promise.status === 'open'
  ) ? promise : null;
}

export function resolvePromiseCall(state, pending, choiceId) {
  const promise = pendingPromise(state, pending);
  if (!promise) return { ok: false, error: 'no open promise for this call' };
  if (!pending.choices.some((choice) => choice.id === choiceId)) {
    return { ok: false, error: `unknown choice ${choiceId}` };
  }
  if (choiceId === 'deliver') {
    promiseDefinition(promise).deliver.effects(state);
    promise.status = 'delivered';
  } else if (choiceId === 'stall') {
    state.govFavor.us -= 6;
    promise.dueTurn += 2;
    promise.stalled = true;
  } else if (choiceId === 'refuse') {
    state.govFavor.us -= 12;
    state.flags.supplyChainRisk = true;
    state.staffTrust += 3;
    promise.status = 'refused';
  }
  return { ok: true };
}

export function promiseFallback(pending) {
  return pending.choices.some((choice) => choice.id === 'stall') ? 'stall' : 'refuse';
}
