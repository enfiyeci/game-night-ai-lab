import { ERAS } from './data/eras.js';
import { PROMISES } from './data/promises.js';

const LAST_TURN = ERAS.reduce((sum, era) => sum + era.turns, 0) - 1;

function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, handle, text, tag });
  if (state.feed.length > 40) state.feed.splice(0, state.feed.length - 40);
}

const promiseDefinition = (promise) => PROMISES[promise.id];
const isPresidentPromise = (promise) => promise?.source === 'president' && Object.hasOwn(PROMISES, promise.id);

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
  return {
    source: 'president',
    id,
    text: definition.text,
    meeting,
    madeTurn: turn,
    dueTurn: Math.min(turn + dueOffset, LAST_TURN),
    status: 'open',
    stalled: false,
    leaked: false,
  };
}

export function promiseUpkeep(state, rng) {
  void rng;
  for (const promise of state.promises) {
    if (!isPresidentPromise(promise) || promise.status !== 'open' || promise.dueTurn > state.turn) continue;
    if (!promiseDefinition(promise).check(state, promise)) continue;
    promise.status = 'kept';
    state.govFavor.us += 5;
    pushFeed(state, '@executive_office', `Thank you to the lab for keeping its promise: “${promise.text}”`, 'event');
  }
}

export const promiseCallKey = (promise) => `promiseCall:${promise.meeting}:${promise.id}`;

export function failedPresidentPromises(state) {
  return state.promises.filter((promise) =>
    isPresidentPromise(promise)
    && promise.status === 'open'
    && promise.dueTurn <= state.turn
    && !promiseDefinition(promise).check(state, promise));
}

export function promiseCallCard(event, promise) {
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
    id: promiseCallKey(promise),
    eventId: event.id,
    title: event.card.title,
    post: { handle: '@executive_office', text: `You promised us: “${promise.text}”` },
    choices,
    targets: [],
    promiseId: promise.id,
    promiseMeeting: promise.meeting,
  };
}

function pendingPromise(state, pending) {
  return state.promises.find((promise) =>
    isPresidentPromise(promise)
    && promise.id === pending.promiseId
    && promise.meeting === pending.promiseMeeting
    && promise.status === 'open');
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
