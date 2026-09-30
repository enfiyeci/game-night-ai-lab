import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mountTraining } from '../ui/screens/training.js';
import { badgeCounts } from '../ui/logic/training.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { recipeCost } from '../sim/recipe.js';
import { sfx } from '../ui/sfx.js';

const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };

function harness(t) {
  const flights = [];
  const timers = [];
  const observers = [];
  let reduced = false;
  let pops = 0;
  let ticks = 0;
  let time = 0;
  const element = () => ({
    textContent: '0', className: '', style: {},
    classList: { remove() {}, add() {} },
    setAttribute() {}, remove() {}, append() {},
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 20 }),
    animate(frames, options) {
      let finish;
      const finished = new Promise((resolve) => { finish = resolve; });
      flights.push({ finish, options });
      return { finished };
    },
  });
  t.mock.method(globalThis, 'setTimeout', (fn, delay) => { timers.push({ fn, delay }); return timers.length; });
  t.mock.method(globalThis, 'clearTimeout', () => {});
  t.mock.method(performance, 'now', () => time);
  const install = (key, value) => {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => old ? Object.defineProperty(globalThis, key, old) : delete globalThis[key]);
  };
  install('document', { createElement: element });
  install('MutationObserver', class { constructor(fn) { observers.push(fn); } observe() {} });
  install('matchMedia', () => ({ matches: reduced }));
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ rack: [20, 30], heads: { researcher1: [10, 10], researcher2: [10, 10], research: [10, 10], safety: [10, 10] } }) }));
  t.mock.method(sfx, 'pop', () => { pops += 1; });
  t.mock.method(sfx, 'tick', () => { ticks += 1; });
  const cap = element();
  const ali = element();
  const hud = { querySelector: (s) => s.startsWith('.cap') ? cap : ali };
  const stage = { ...element(), querySelector: () => ({ after() {} }) };
  const overlay = { ...element(), addEventListener() {} };
  const game = { state: SCENARIOS.midEra3(1), subscribe(fn) { this.render = fn; } };
  const run = game.state.activeRun;
  const total = recipeCost(game.state, run.recipe).turns;
  run.turnsLeft = total;
  mountTraining(game, { stage, hud, overlay });
  return {
    game, flights,
    counts: () => ({ capability: Number(cap.textContent), alignment: Number(ali.textContent) }),
    target: () => badgeCounts(game.state),
    async progress(p) { run.turnsLeft = total * (1 - p); game.render(); await flush(); },
    async finish(flight) { flight.finish(); await flush(); },
    async finishAll() { for (const flight of flights) flight.finish(); await flush(); },
    redraw() { cap.textContent = '999'; ali.textContent = '999'; observers.at(-1)(); },
    reduce() { reduced = true; game.render(); },
    sounds() { for (const { fn } of timers.splice(0)) { time += 1000; fn(); } return { pops, ticks }; },
  };
}

test('fractions never reverse badges and settle exactly after HUD redraws', async (t) => {
  const h = harness(t);
  await h.progress(0.001); // forced first whole badge precedes visual fractions
  let previous = h.counts();
  for (const progress of [0.03, 0.07, 0.12, 0.4, 0.8, 1]) {
    await h.progress(progress);
    h.redraw();
    for (const flight of h.flights.splice(0)) {
      await h.finish(flight);
      const counts = h.counts();
      assert.ok(counts.capability >= previous.capability);
      assert.ok(counts.alignment >= previous.alignment);
      assert.ok(counts.capability <= h.target().capability);
      assert.ok(counts.alignment <= h.target().alignment);
      previous = counts;
    }
    assert.deepEqual(h.counts(), h.target());
  }
});

test('release resets invalidate outstanding flights; reduced motion emits no flights or sound', async (t) => {
  const h = harness(t);
  await h.progress(0.5);
  assert.ok(h.flights.length > 0);
  h.game.state.activeRun = null;
  h.game.state.pendingModel = null;
  h.game.render();
  await h.finishAll();
  assert.deepEqual(h.counts(), { capability: 0, alignment: 0 });
  assert.equal(h.sounds().pops, 0);
  const before = h.flights.length;
  h.game.state.pendingModel = { gain: 12 };
  h.reduce();
  await flush();
  assert.equal(h.flights.length, before);
  assert.deepEqual(h.counts(), h.target());
});

test('daily batches spread launches and share one pop per five bubbles', async (t) => {
  const h = harness(t);
  for (const p of [0.1, 0.2, 0.3, 0.4]) await h.progress(p);
  assert.ok(h.flights.some((f) => f.options.delay > 0));
  assert.ok(h.flights.every((f) => f.options.delay < 3000));
  assert.equal(h.sounds().pops, Math.ceil(h.flights.length / 5));
  h.reduce();
  await h.finishAll();
  assert.deepEqual(h.counts(), h.target());
  assert.equal(h.sounds().ticks, 0);
});


test('overlapping days may land out of order without overcounting', async (t) => {
  const h = harness(t);
  await h.progress(0.2);
  await h.progress(0.4);
  await h.progress(0.6);
  const target = h.target();
  for (const flight of [...h.flights].reverse()) {
    h.redraw();
    await h.finish(flight);
    assert.ok(h.counts().capability <= target.capability);
    assert.ok(h.counts().alignment <= target.alignment);
  }
  assert.deepEqual(h.counts(), target);
});
