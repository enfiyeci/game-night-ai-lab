import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { SUPPLIERS, eraScale } from '../sim/data/compute.js';
import { allocate, rivalOrders, placeOrder, queueTurn, released, withdrawOrder, QUEUE_RELEASE, RIVAL_ORDER, PREPAY_SHARE, QUEUE_TERM_MONTHS } from '../sim/queue.js';

// Rival speeds are pinned here so a balance re-tune of rival speed does not change these tests.
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };
const fire = { ...lo, chance: () => true };
const SPEED = { openbrain: 0.8, lodestar: 0.55, deepthink: 0.65, qilin: 0.7 };
const fresh3 = () => {
  const s = createInitialState();
  s.era = 3;
  s.cash = 1e6;
  for (const r of s.rivals) r.speed = SPEED[r.id];
  Object.assign(s.compute, { nextId: s.compute.nextId ?? 1 });
  return s;
};
const MEAN_WEST = (SPEED.openbrain + SPEED.lodestar + SPEED.deepthink) / 3;
const orderOf = (speed) => Math.round(RIVAL_ORDER * (speed / MEAN_WEST) * eraScale(3));

test('prepaid orders are served first; standard orders share the rest by size', () => {
  assert.deepEqual(allocate(150, [
    { lab: 'openbrain', units: 52, tier: 'prepaid' },
    { lab: 'lodestar', units: 42, tier: 'standard' },
    { lab: 'deepthink', units: 46, tier: 'standard' },
    { lab: 'you', units: 60, tier: 'standard' },
  ]), { openbrain: 52, lodestar: 28, deepthink: 30, you: 40 });
});

test('supply is never exceeded and a small order is filled in full', () => {
  assert.deepEqual(allocate(150, [{ lab: 'a', units: 200, tier: 'prepaid' }, { lab: 'b', units: 10, tier: 'standard' }]), { a: 150, b: 0 });
  assert.deepEqual(allocate(150, [{ lab: 'a', units: 20, tier: 'standard' }]), { a: 20 });
});

test('rival orders follow relative speed: the fastest Western lab prepays, the Eastern lab cannot buy', () => {
  const s = fresh3();
  const o = rivalOrders(s);
  assert.equal(o.some((x) => x.lab === 'qilin'), false);
  assert.deepEqual(o.find((x) => x.lab === 'openbrain'), { lab: 'openbrain', units: orderOf(SPEED.openbrain), tier: 'prepaid' });
  assert.deepEqual(o.find((x) => x.lab === 'lodestar'), { lab: 'lodestar', units: orderOf(SPEED.lodestar), tier: 'standard' });
  assert.equal(o.find((x) => x.lab === 'deepthink').tier, 'standard');
  for (const r of s.rivals) r.speed *= 1.6; // a rival-speed re-tune leaves the queue unchanged
  assert.deepEqual(rivalOrders(s), o);
  assert.equal(released(s), QUEUE_RELEASE * eraScale(3));
});

test('orders: era 3 only, one per turn; prepaying costs cash and race heat', () => {
  const e2 = createInitialState(); e2.era = 2;
  assert.equal(placeOrder(e2, { units: 10, tier: 'standard' }).ok, false);
  const s = fresh3();
  const cash = s.cash;
  const heat = s.raceHeat;
  const units = released(s);
  assert.equal(placeOrder(s, { units, tier: 'prepaid' }).ok, true);
  assert.equal(s.cash, cash - Math.round(PREPAY_SHARE * units * SUPPLIERS.verde.price * BALANCE.unitMonthlyCost * QUEUE_TERM_MONTHS));
  assert.equal(s.raceHeat, heat + 2);
  assert.equal(placeOrder(s, { units: 10, tier: 'standard' }).ok, false);
  assert.equal(placeOrder(fresh3(), { units: 0, tier: 'standard' }).ok, false);
  assert.equal(placeOrder(fresh3(), { units: 10, tier: 'vip' }).ok, false);
});

test('a standard order is part-filled now; the rest waits, blocks a new order, and can be withdrawn', () => {
  const s = fresh3();
  const want = released(s);
  placeOrder(s, { units: want, tier: 'standard' });
  const expected = allocate(released(s), [...rivalOrders(s), { lab: 'you', units: want, tier: 'standard' }]).you;
  const ev = queueTurn(s, lo);
  assert.ok(expected > 0 && expected < want);
  assert.equal(ev.find((e) => e.type === 'queueFilled').units, expected);
  assert.deepEqual(s.compute.queue.carry, { units: want - expected, tier: 'standard' });
  assert.equal(s.compute.pipeline.at(-1).units, expected);
  assert.equal(s.compute.pipeline.at(-1).price, SUPPLIERS.verde.price);
  assert.equal(s.compute.pipeline.at(-1).arrivesTurn, s.turn + 1);
  assert.equal(s.compute.queue.last.rows.find((r) => r.lab === 'you').got, expected);
  assert.equal(placeOrder(s, { units: 10, tier: 'standard' }).ok, false, 'a waiting order must be withdrawn first');
  assert.equal(withdrawOrder(s).ok, true);
  assert.equal(s.compute.queue.carry, null);
  assert.equal(withdrawOrder(s).ok, false);
});

test('a rival switching to prepaid is announced a turn ahead', () => {
  const s = fresh3();
  const ev = queueTurn(s, fire);
  assert.ok(ev.some((e) => e.type === 'rivalPrepays' && e.lab === 'lodestar'));
  assert.equal(rivalOrders(s).find((x) => x.lab === 'lodestar').tier, 'prepaid');
});

test('outside era 3 the queue clears', () => {
  const s = fresh3();
  placeOrder(s, { units: released(s), tier: 'standard' });
  queueTurn(s, lo);
  s.era = 4;
  assert.deepEqual(queueTurn(s, lo), []);
  assert.equal(s.compute.queue.carry, null);
});
