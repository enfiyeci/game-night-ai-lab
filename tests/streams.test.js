import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { sideRng } from '../sim/contracts.js';
import { eventsTick, EVENT_TRIGGER_SALT } from '../sim/events.js';
import { recordAdvisors, ADVISOR_SALT } from '../sim/advisors.js';

test('event triggers default to their own per-round stream', () => {
  const a = createInitialState({ seed: 7 });
  const b = structuredClone(a);
  assert.deepEqual(eventsTick(a), eventsTick(b, sideRng(b, EVENT_TRIGGER_SALT)));
  assert.deepEqual(a.pendingEvents, b.pendingEvents);
});

test('advisor noise defaults to its own per-round stream', () => {
  const a = createInitialState({ seed: 7 });
  const b = structuredClone(a);
  assert.deepEqual(recordAdvisors(a), recordAdvisors(b, sideRng(b, ADVISOR_SALT)));
});

test('the round loop does not feed its rng to advisors', () => {
  const start = createInitialState({ seed: 7 });
  const one = endTurn(start, {}, createRng(1)).state;
  const two = endTurn(start, {}, createRng(2)).state;
  assert.deepEqual(one.advisorHistory.at(-1), two.advisorHistory.at(-1));
});
