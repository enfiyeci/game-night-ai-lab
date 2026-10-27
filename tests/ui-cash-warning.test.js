import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { projectBurn } from '../sim/economy.js';
import { cashWarning, cashWarningCheckpoint } from '../ui/logic/cashWarning.js';

function stateAt(months) {
  const state = createInitialState({ seed: 1 });
  state.cash = projectBurn(state) * months;
  return state;
}

test('cash warnings start before the emergency and escalate at six, three and one month', () => {
  assert.equal(cashWarning(stateAt(6.01)), null);
  assert.equal(cashWarning(stateAt(6)).level, 'watch');
  assert.equal(cashWarning(stateAt(3)).level, 'urgent');
  assert.equal(cashWarning(stateAt(1)).level, 'critical');
  assert.equal(cashWarning(stateAt(0)).runway, 0);
});

test('budget and compute changes warn immediately without waiting for stale planned burn', () => {
  const state = stateAt(7);
  state.burnPlanned = 0;
  state.budget.spend += state.cash;
  assert.equal(cashWarning(state).level, 'critical');
  const compute = stateAt(7);
  compute.compute.contracts.push({ supplier: 'spot', units: 10000, price: 1, monthsLeft: 12 });
  assert.equal(cashWarning(compute).level, 'critical');
});

test('cash warnings use current revenue rather than stale ARR', () => {
  const state = stateAt(2);
  state.arr = 1e9;
  assert.equal(cashWarning(state).level, 'urgent');
});

test('negative cash remains critical and completed games remove warnings', () => {
  const state = stateAt(-1);
  assert.equal(cashWarning(state).level, 'critical');
  state.ending = 'bankrupt';
  assert.equal(cashWarning(state), null);
});

test('funding availability respects era and already used rounds', () => {
  const state = stateAt(5);
  assert.equal(cashWarning(state).fundingAvailable, false);
  state.era = 2;
  assert.equal(cashWarning(state).fundingAvailable, true);
  state.flags.lastRoundEra = 2;
  assert.equal(cashWarning(state).fundingAvailable, false);
});

test('acknowledgements pause only on escalation, then reset after recovery', () => {
  let checkpoint = 0;
  for (const [level, pause] of [['watch', false], ['urgent', true], ['urgent', false], ['critical', true], ['critical', false], ['urgent', false]]) {
    const next = cashWarningCheckpoint(checkpoint, { level });
    assert.equal(next.pause, pause);
    checkpoint = next.checkpoint;
  }
  checkpoint = cashWarningCheckpoint(checkpoint, null).checkpoint;
  assert.equal(cashWarningCheckpoint(checkpoint, { level: 'urgent' }).pause, true);
});

test('cash acknowledgement preserves other clock pauses and recovery removes the cash pause', async () => {
  const { mountCashWarning } = await import('../ui/screens/cashWarning.js');
  const { createClock } = await import('../ui/clock.js');
  const previousDocument = globalThis.document;
  const element = () => ({
    children: [], dataset: {}, listeners: {}, hidden: false,
    append(...nodes) { this.children.push(...nodes); },
    setAttribute() {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    remove() { this.removed = true; },
  });
  globalThis.document = { createElement: element };
  try {
    const stage = element();
    let subscriber;
    let unsubscribed = false;
    const game = {
      state: stateAt(2),
      subscribe(fn) { subscriber = fn; return () => { unsubscribed = true; }; },
    };
    game.clock = createClock(game, { now: () => 0 });
    game.clock.pause('dialog');
    let financeOpened = 0;
    const mounted = mountCashWarning(game, { stage, onFinance: () => financeOpened++, onBudget() {}, onFunding() {} });
    const banner = stage.children[0];
    const actions = banner.children[1].children;
    const acknowledge = actions.at(-1);
    assert.equal(banner.hidden, false);
    assert.ok(game.clock.now().reasons.includes('cash-warning'));
    actions[0].listeners.click();
    assert.equal(financeOpened, 1);
    acknowledge.listeners.click();
    assert.deepEqual(game.clock.now().reasons, ['dialog']);
    assert.equal(acknowledge.hidden, true);
    subscriber();
    assert.deepEqual(game.clock.now().reasons, ['dialog']);
    game.state.cash = projectBurn(game.state) * 0.5;
    subscriber();
    assert.ok(game.clock.now().reasons.includes('cash-warning'));
    game.state.cash = projectBurn(game.state) * 8;
    subscriber();
    assert.equal(banner.hidden, true);
    assert.deepEqual(game.clock.now().reasons, ['dialog']);
    mounted.destroy();
    assert.equal(unsubscribed, true);
    assert.equal(banner.removed, true);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test('with the pacing director, the warning stops the clock only on a pause the sim recorded today', async () => {
  const { mountCashWarning } = await import('../ui/screens/cashWarning.js');
  const { createClock } = await import('../ui/clock.js');
  const previousDocument = globalThis.document;
  const element = () => ({
    children: [], dataset: {}, listeners: {}, hidden: false,
    append(...nodes) { this.children.push(...nodes); },
    setAttribute() {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    remove() {},
  });
  globalThis.document = { createElement: element };
  try {
    const stage = element();
    let subscriber;
    const game = { state: stateAt(2), subscribe(fn) { subscriber = fn; return () => {}; } };
    // Moving day: the director folded the warning into the era recap, so the banner shows without a pause.
    game.state.pacing = { stops: [], lastBeat: 0, cash: { checkpoint: 2, pause: null, folded: { day: game.state.day, level: 'urgent' } } };
    game.clock = createClock(game, { now: () => 0 });
    mountCashWarning(game, { stage, onFinance() {}, onBudget() {}, onFunding() {} });
    const banner = stage.children[0];
    assert.equal(banner.hidden, false);
    assert.deepEqual(game.clock.now().reasons, []);
    // A later day: the director lets it pause.
    game.state.day += 3;
    game.state.cash = projectBurn(game.state) * 0.5;
    game.state.pacing.cash.pause = { day: game.state.day, level: 'critical' };
    subscriber();
    assert.deepEqual(game.clock.now().reasons, ['cash-warning']);
    banner.children[1].children.at(-1).listeners.click();
    subscriber();
    assert.deepEqual(game.clock.now().reasons, [], 'the same pause does not stop the clock twice');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
