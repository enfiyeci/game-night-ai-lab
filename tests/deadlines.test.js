import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { advanceDays } from '../sim/turn.js';
import { eventsTick, stampNewCards, resolveDue } from '../sim/events.js';
import { DEFAULT_EVENT_TIMING, EVENT_TIMING } from '../sim/data/eventTiming.js';

const withCard = (seed) => {
  const s = createInitialState({ seed });
  s.pendingEvents.push({ id: 'lossSpike', title: 't', post: { handle: '@x', text: 'y' }, choices: [], targets: [] });
  return s;
};
const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (values) => values[0], normal: (mean) => mean };

test('a new card lands inside the next round and is due some days later', () => {
  const s = withCard(1);
  stampNewCards(s, createRng(1));
  const card = s.pendingEvents[0];
  assert.ok(card.landsAt >= s.day && card.landsAt < s.day + 91);
  assert.equal(card.dueAt, card.landsAt + (EVENT_TIMING.lossSpike ?? DEFAULT_EVENT_TIMING).days);
});

test('a card past its deadline resolves with its fallback and says why', () => {
  const s = withCard(2);
  stampNewCards(s, createRng(2));
  s.day = s.pendingEvents[0].dueAt;
  const out = resolveDue(s);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(out[0].type, 'eventResolved');
  assert.equal(out[0].reason, 'deadline');
  assert.equal(out[0].auto, true);
});

test('a card can outlive a round in era 5', () => {
  const s = withCard(3);
  s.era = 5;
  stampNewCards(s, createRng(3));
  const due = s.pendingEvents[0].dueAt;
  const after = advanceDays(s, 7, createRng(3)).state;
  if (due > s.day + 7) assert.equal(after.pendingEvents.some((p) => p.id === 'lossSpike'), true);
});

test('a new warning gets the day it was raised and the next round mark', () => {
  const s = createInitialState({ seed: 4 });
  s.warnings.lossSpike = { turn: 0 };
  stampNewCards(s, createRng(4));
  assert.equal(s.warnings.lossSpike.day, 0);
  assert.equal(s.warnings.lossSpike.dueAt, 91);
});

test('an event card post appears on its landing day, once', () => {
  const s = createInitialState({ seed: 5 });
  s.automation.stage = 2; s.automation.stageTurn = 0;
  eventsTick(s, no);
  const card = s.pendingEvents[0];
  card.landsAt = 2;
  card.dueAt = 10;
  const cardPosts = (state) => state.feed.filter((post) => post.tag === 'event');
  let out = advanceDays(s, 1, createRng(5));
  assert.equal(cardPosts(out.state).length, 0);
  out = advanceDays(out.state, 1, createRng(5));
  assert.deepEqual(cardPosts(out.state), [{ turn: 0, day: 2, handle: card.post.handle, text: card.post.text, tag: 'event' }]);
  out = advanceDays(out.state, 1, createRng(5));
  assert.equal(cardPosts(out.state).length, 1);
});
