import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { recipeCost } from '../sim/recipe.js';
import { computeRent, projectBurn } from '../sim/economy.js';
import { sideRng } from '../sim/contracts.js';
import { eraScale, SCALE_DOWN } from '../sim/data/compute.js';
import { allocate, rivalOrders, released } from '../sim/queue.js';
import { SITE_TYPES } from '../sim/power.js';

const offerOf = (s, supplier) => s.compute.offers.find((o) => o.supplier === supplier && !o.viaQueue);

test('offers exist from turn 0; rivals take their named cards at the mark; the rest stay', () => {
  const s = createInitialState();
  assert.deepEqual(s.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.deepEqual(s.power, { sites: [], nextId: 1 });
  const named = s.compute.offers.filter((o) => o.wantedBy);
  assert.equal(named.length, 3, 'three Western rivals are short of compute on turn 0');
  const { state, events } = endTurn(s, {}, createRng(1));
  const deals = events.filter((e) => e.type === 'rivalDeal');
  assert.deepEqual(deals.map((e) => e.supplier).sort(), named.map((o) => o.supplier).sort());
  assert.deepEqual(state.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot'], 'taken slots refill');
  const untaken = s.compute.offers.find((o) => !o.wantedBy);
  assert.equal(state.compute.offers.find((o) => o.supplier === untaken.supplier).id, untaken.id, 'the untaken card stays');
});

test('a deal move signs an offer; it is online on its arrival turn and its bill enters the burn', () => {
  const s = createInitialState();
  const cf = offerOf(s, 'coreflame');
  const out = endTurn(s, { moves: [{ type: 'deal', offerId: cf.id }] }, createRng(2));
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.turn, s.turn + cf.arrivesIn);
  assert.equal(out.state.compute.pipeline.length, 0);
  assert.equal(out.state.compute.online, 10 + cf.units, 'usable for moves and training on its arrival turn');
  assert.ok(out.events.some((e) => e.type === 'computeArrived' && e.supplier === 'coreflame'));
  assert.ok(computeRent(out.state) > computeRent(s));
  assert.ok(Math.abs(out.state.burnPlanned - projectBurn(out.state)) < 1e-9, 'the returned burn already includes the new bill');
  assert.equal(endTurn(s, { moves: [{ type: 'deal', supplierId: 'coreflame' }] }, createRng(2)).errors.length, 1);
});

test('contract actions run before moves', () => {
  const s = createInitialState();
  const out = endTurn(s, { contractActions: [{ id: 'starter', action: 'scaleDown' }] }, createRng(4));
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.compute.contracts.find((c) => c.id === 'starter').units, 10 - Math.round(10 * SCALE_DOWN));
});

test('training runs cost more compute each era', () => {
  const s = createInitialState();
  const recipe = { sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: [] } };
  const e1 = recipeCost(s, recipe).units;
  s.era = 4;
  assert.equal(recipeCost(s, recipe).units, e1 * eraScale(4));
});

test('an era 3 queue fill is a Verde contract on the next turn', () => {
  const s = createInitialState();
  s.era = 3; s.turn = 8; s.turnInEra = 0;
  const want = released(s);
  const expected = allocate(want, [...rivalOrders(s), { lab: 'you', units: want, tier: 'standard' }]).you;
  const out = endTurn(s, { moves: [{ type: 'queueOrder', units: want, tier: 'standard' }] }, createRng(5));
  assert.deepEqual(out.errors, []);
  assert.ok(out.events.some((e) => e.type === 'queueFilled' && e.units === expected));
  assert.ok(out.state.compute.contracts.some((c) => c.supplier === 'verde' && c.units === expected));
});

test('in era 4 new chips need site power, and the lease starts when the site is online', () => {
  const s = createInitialState();
  s.era = 4; s.turn = 12; s.turnInEra = 0; s.cash = 1e6;
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 100, price: 1, monthsLeft: 24, needsPower: true, dark: false, string: null });
  const built = endTurn(s, { moves: [{ type: 'buildSite', source: 'gas' }] }, createRng(7));
  assert.deepEqual(built.errors, []);
  assert.equal(built.state.compute.online, 10);
  assert.equal(built.state.compute.unpowered, 100);
  assert.equal(built.state.power.sites[0].source, 'gas');
  // Bring the site forward to next turn instead of playing four turns, so the test never crosses the era 4 gate.
  const st = structuredClone(built.state);
  st.power.sites[0].arrivesTurn = st.turn + 1;
  const next = endTurn(st, {}, createRng(8)).state;
  assert.equal(next.power.sites[0].online, true);
  assert.equal(next.compute.online, 10 + Math.min(100, next.power.sites[0].units));
});

test('same-turn site builds use distinct deterministic side draws', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 4;
  s.turn = 12;
  s.turnInEra = 0;
  const actions = { moves: [{ type: 'buildSite', source: 'gas' }, { type: 'buildSite', source: 'gas' }] };
  const first = endTurn(s, actions, createRng(1));
  const second = endTurn(s, actions, createRng(1));
  assert.deepEqual(first.errors, []);
  assert.deepEqual(first.state.power.sites, second.state.power.sites);
  assert.notEqual(first.state.power.sites[0].units, first.state.power.sites[1].units);
});

test('a site build and contractsTurn use different side draws in the same turn', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 4;
  s.turn = 12;
  s.turnInEra = 0;
  s.compute.contracts[0].supplier = 'coreflame';
  const contractDraw = sideRng(s, 3).next();
  const siteDraw = sideRng(s, 1000 + s.power.nextId).next();
  const [lo, hi] = SITE_TYPES.gas.size;
  const gasUnits = (draw) => Math.round((lo + Math.floor(draw * (hi - lo + 1))) / 10) * 10;

  const result = endTurn(s, { moves: [{ type: 'buildSite', source: 'gas' }] }, createRng(1));

  assert.notEqual(siteDraw, contractDraw);
  assert.equal(result.state.power.sites[0].units, gasUnits(siteDraw));
  assert.notEqual(result.state.power.sites[0].units, gasUnits(contractDraw));
});
