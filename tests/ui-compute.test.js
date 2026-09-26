import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { dealCards, commitmentsView, queueView, computeBar, sitesView, opinions } from '../ui/logic/compute.js';
import { BALANCE } from '../sim/balance.js';
import { allocate, rivalOrders, released } from '../sim/queue.js';

test('deal cards mirror the offers and name each catch', () => {
  const s = createInitialState();
  const cards = dealCards(s);
  assert.deepEqual(cards.map((c) => c.supplier), s.compute.offers.map((o) => o.supplier));
  assert.equal(cards.find((c) => c.supplier === 'azuria').chip, 'Exclusive');
  assert.equal(cards.find((c) => c.supplier === 'verde').chip, 'No strings');
});

test('commitments show the bill before and after signing', () => {
  const s = createInitialState();
  const v = s.compute.offers.find((o) => o.supplier === 'verde');
  const c = commitmentsView(s, v.id);
  assert.ok(c.billAfter > c.billNow);
  assert.equal(c.segments.at(-1).isNew, true);
  assert.ok(c.runwayAfter <= c.runwayNow);
});

test('the queue preview compares standard and prepaid', () => {
  const s = createInitialState();
  s.era = 3;
  const q = queueView(s, { units: 60, tier: 'standard' });
  assert.equal(q.released, released(s));
  assert.equal(q.you.standard, allocate(released(s), [...rivalOrders(s), { lab: 'you', units: 60, tier: 'standard' }]).you);
  assert.equal(q.you.prepaid, allocate(released(s), [...rivalOrders(s), { lab: 'you', units: 60, tier: 'prepaid' }]).you);
  assert.equal(q.rows.find((r) => r.lab === 'qilin').tier, 'none');
});

test('the compute bar adds up to online compute and marks the pledge', () => {
  const s = createInitialState();
  s.compute.online = 200; s.compute.servingUnits = 90; s.compute.split.safety = 0.12;
  s.promises.push({ type: 'safetyCompute', share: 0.1, turn: 0 });
  const b = computeBar(s);
  assert.equal(b.segments.reduce((sum, x) => sum + x.units, 0), 200);
  assert.deepEqual(b.pledgeMarker, { share: 0.1, kept: true });
  assert.equal(b.needMarker, 90);
});

test('the sites view counts dark chips and their bill', () => {
  const s = createInitialState();
  s.era = 4;
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 700, price: 1, monthsLeft: 24, needsPower: true, dark: false, string: null });
  s.power.sites.push({ id: 'grid-1', source: 'grid', units: 500, arrivesTurn: 0, online: true, oppositionCut: null });
  const v = sitesView(s);
  assert.equal(v.unpowered, 200);
  assert.ok(Math.abs(v.unpoweredBill - 200 * BALANCE.unitMonthlyCost) < 1e-9);
});

test('each screen gets four advisor opinions without hidden numbers', () => {
  const s = createInitialState();
  for (const screen of ['deals', 'queue', 'budget', 'power']) {
    const o = opinions(s, screen);
    assert.equal(o.length, 4);
    assert.ok(o.every((x) => typeof x.text === 'string' && !/alignmentDebt|misuse/.test(x.text)));
  }
});
