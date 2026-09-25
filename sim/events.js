import { EVENTS } from './data/events.js';

const MAX_CARDS = 2;
const byId = (id) => EVENTS.find((event) => event.id === id);
const publicCard = (event) => ({
  id: event.id,
  title: event.card.title,
  post: event.card.post,
  choices: event.card.choices.map(({ id, label, cost, backers, opposers }) => ({ id, label, cost, backers, opposers })),
});

export function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, handle, text, tag });
  if (state.feed.length > 40) state.feed.splice(0, state.feed.length - 40);
}

export function eventsTick(state, rng) {
  const out = [];
  for (const event of EVENTS) {
    if (state.pendingEvents.length >= MAX_CARDS) break;
    if (state.pendingEvents.some((pending) => pending.id === event.id)) continue;
    if (event.kind !== 'internal' && state.seenEvents.includes(event.id)) continue;
    const warned = Object.hasOwn(state.warnings, event.id) ? state.warnings[event.id] : null;
    if (warned && warned.turn < state.turn) {
      delete state.warnings[event.id];
      if (event.kind === 'planted' && !event.trigger(state, rng)) continue;
    } else if (!warned) {
      if (!event.trigger(state, rng)) continue;
      if (event.warning) {
        state.warnings[event.id] = { turn: state.turn };
        pushFeed(state, event.warning.handle, event.warning.text, 'warning');
        out.push({ type: 'warning', id: event.id });
        continue;
      }
    } else continue;
    state.pendingEvents.push(publicCard(event));
    if (event.kind !== 'internal') state.seenEvents.push(event.id);
    pushFeed(state, event.card.post.handle, event.card.post.text, 'event');
    out.push({ type: 'eventCard', id: event.id });
  }
  return out;
}

export function addressWarning(state, id) {
  const event = byId(id);
  if (!event || !Object.hasOwn(state.warnings, id)) return { ok: false, error: `no warning ${id}` };
  state.cash -= 5 * state.era;
  delete state.warnings[id];
  if (event.flag) {
    for (const model of state.models) model.flags = (model.flags ?? []).filter((flag) => flag !== event.flag);
  }
  if (!state.seenEvents.includes(id)) state.seenEvents.push(id);
  return { ok: true, id };
}

export function resolveEvent(state, id, choiceId) {
  const index = state.pendingEvents.findIndex((pending) => pending.id === id);
  if (index < 0) return { ok: false, error: `no pending event ${id}` };
  const event = byId(id);
  const choice = event?.card.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return { ok: false, error: `unknown choice ${choiceId}` };
  choice.effects(state);
  state.pendingEvents.splice(index, 1);
  return { ok: true, id, choiceId };
}

export function fallbackChoice(id) {
  const event = byId(id);
  return event?.fallback ?? event?.card.choices.at(-1)?.id;
}
