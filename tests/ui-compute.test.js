import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  commitmentsView,
  computeBar,
  dealCards,
  idleComputeCost,
  opinions,
  pledgeAvailable,
  powerSitesAvailable,
  projectQueue,
  queueOrderPreflight,
  queueOrderPreview,
  queueScreenAvailable,
  queueTrainingView,
  queueView,
  replaceQueueOrder,
  sitesView,
} from '../ui/logic/compute.js';
import { BALANCE } from '../sim/balance.js';
import { allocate, placeOrder, rivalOrders, released } from '../sim/queue.js';
import { buildSite, leaseBills, leaseMonthly, powerTurn } from '../sim/power.js';
import { creditOffset, deliverDue, generateOffers, sideRng, signOffer } from '../sim/contracts.js';
import { projectBurn, runway, updateServing } from '../sim/economy.js';
import { computeAmount, money } from '../ui/logic/format.js';
import { COMPANY_ITEMS } from '../ui/menu.js';

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

test('grid commitment runway includes the reservation payment', () => {
  const s = createInitialState();
  s.era = 2;
  s.compute.offers = generateOffers(s, sideRng(s, 5));
  updateServing(s);
  s.burnPlanned = projectBurn(s);
  const grid = s.compute.offers.find((offer) => offer.supplier === 'grid');
  const view = commitmentsView(s, grid.id);
  const signed = structuredClone(s);
  assert.equal(signOffer(signed, grid.id, sideRng(signed, 1)).ok, true);
  updateServing(signed);
  signed.burnPlanned = projectBurn(signed);
  assert.equal(signed.cash, s.cash - 50);
  assert.equal(view.runwayAfter, runway(signed, 'planned'));
  assert.ok(view.runwayAfter < view.runwayNow);
});

test('Azuria investment runway applies its credits after delivery', () => {
  const s = createInitialState();
  s.era = 2;
  s.compute.offers = generateOffers(s, sideRng(s, 5));
  const offer = s.compute.offers.find((candidate) => candidate.supplier === 'azuriaEquity');
  const view = commitmentsView(s, offer.id);
  const signed = structuredClone(s);
  const result = signOffer(signed, offer.id, sideRng(signed, 1));
  signed.turn = result.arrivesTurn;
  deliverDue(signed, sideRng(signed, 6));
  updateServing(signed);
  signed.burnPlanned = projectBurn(signed);
  assert.ok(creditOffset(signed) > 0);
  assert.equal(view.runwayAfter, runway(signed, 'planned'));
});

test('LOI commitments show the delivery range and site-power status', () => {
  const s = createInitialState();
  s.era = 4;
  s.cash = 5000;
  s.compute.offers = generateOffers(s, sideRng(s, 5));
  const offer = s.compute.offers.find((candidate) => candidate.supplier === 'loi');
  const view = commitmentsView(s, offer.id);
  const row = view.rows.find((candidate) => candidate.name.includes('(new)'));
  assert.deepEqual(row.unitsRange, [Math.round(offer.units * 0.3), offer.units]);
  assert.deepEqual(row.billRange, row.unitsRange.map((units) => units * offer.price * BALANCE.unitMonthlyCost));
  assert.match(row.status, /power|Unpowered/i);
  assert.equal(view.billAfter, null);
  assert.deepEqual(view.billAfterRange, row.billRange.map((bill) => view.billNow + bill));
  assert.equal(view.runwayAfter, null);
  assert.equal(view.runwayAfterRange.length, 2);
  assert.ok(view.runwayAfterRange[0] <= view.runwayAfterRange[1]);
});

test('future deal projection brings due power sites online before delivery', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 4;
  s.compute.offers = generateOffers(s, sideRng(s, 5));
  const offer = s.compute.offers.find((candidate) => candidate.supplier === 'verde');
  assert.ok(offer);
  s.cash = offer.upfront + Math.max(100, offer.monthly);
  s.power.sites.push({
    id: 'gas-due', source: 'gas', units: offer.units, arrivesTurn: s.turn + 1, online: false, oppositionCut: null,
  });
  const view = commitmentsView(s, offer.id);
  const signed = structuredClone(s);
  const result = signOffer(signed, offer.id, sideRng(signed, 1));
  assert.equal(result.ok, true);
  while (signed.turn < result.arrivesTurn) {
    signed.turn += 1;
    powerTurn(signed);
    deliverDue(signed, sideRng(signed, 6));
  }
  updateServing(signed);
  signed.burnPlanned = projectBurn(signed);
  assert.equal(signed.power.sites[0].online, true);
  assert.ok(leaseBills(signed) > 0);
  assert.equal(view.runwayAfter, runway(signed, 'planned'));
  assert.equal(view.rows.find((row) => row.isNew).status, 'Needs site power');
});

test('dark Gulf commitments say that billing is paused', () => {
  const s = createInitialState();
  s.compute.contracts.push({
    id: 'gulf-dark', supplier: 'gulf', units: 50, price: 1, monthsLeft: 12,
    needsPower: false, dark: true, scaledDown: false, exclusiveBought: false,
  });
  const row = commitmentsView(s).rows.find((candidate) => candidate.id === 'gulf-dark');
  assert.equal(row.bill, 0);
  assert.equal(row.status, 'License revoked · billing paused');
  assert.doesNotMatch(row.status, /still billed/i);
});

test('the queue preview compares standard and prepaid', () => {
  const s = createInitialState();
  s.era = 3;
  const supply = released(s);
  const units = Math.max(1, Math.round(supply * 0.75));
  const q = queueView(s, { units, tier: 'standard' });
  assert.equal(q.released, supply);
  assert.equal(q.you.standard, allocate(supply, [...rivalOrders(s), { lab: 'you', units, tier: 'standard' }]).you);
  assert.equal(q.you.prepaid, allocate(supply, [...rivalOrders(s), { lab: 'you', units, tier: 'prepaid' }]).you);
  assert.equal(q.rows.find((r) => r.lab === 'qilin').tier, 'none');
});

test('queue training availability includes control and safety reservations', () => {
  const s = createInitialState();
  s.era = 3;
  s.compute.online = 30;
  s.compute.servingUnits = 5.4;
  s.compute.split.safety = 0.2;
  s.activeRun = { units: 20 };
  const view = queueTrainingView(s);
  assert.ok(Math.abs(view.free - 18.6) < 1e-9);
  assert.equal(view.need, 20);
  assert.ok(Math.abs(view.short - 1.4) < 1e-9);
  assert.notEqual(view.free, s.compute.online - s.compute.servingUnits);
});

test('queue order preflight mirrors sim rejection and withdrawal rules', () => {
  const s = createInitialState();
  s.era = 3;
  s.compute.queue = { order: null, carry: { units: 12, tier: 'standard' }, last: null };
  assert.equal(queueOrderPreview(s, { units: 10, tier: 'standard' }).reason, 'an earlier order is still waiting: withdraw it first');
  const withdrawn = projectQueue(s, { queueWithdraw: true, moves: [] });
  assert.equal(withdrawn.compute.queue.carry, null);
  assert.equal(queueOrderPreview(withdrawn, { units: 10, tier: 'standard' }).ok, true);

  withdrawn.cash = 0;
  const rejected = queueOrderPreview(withdrawn, { units: 10, tier: 'prepaid' });
  const direct = placeOrder(structuredClone(withdrawn), { units: 10, tier: 'prepaid' });
  assert.equal(rejected.reason, direct.error);
});

test('replacing a queue draft keeps its position and preflights before later moves', () => {
  const moves = [
    { type: 'queueOrder', units: 10, tier: 'standard' },
    { type: 'raise', archetype: 'vc' },
    { type: 'queueOrder', units: 20, tier: 'prepaid' },
  ];
  const next = replaceQueueOrder(moves, { units: 30, tier: 'prepaid' });
  assert.deepEqual(next, [
    { type: 'queueOrder', units: 30, tier: 'prepaid' },
    moves[1],
  ]);

  const s = createInitialState();
  s.era = 3;
  s.cash = 0;
  const queue = { moves: [moves[0], moves[1]] };
  const direct = placeOrder(structuredClone(s), { units: 30, tier: 'prepaid' });
  const preview = queueOrderPreflight(s, queue, { units: 30, tier: 'prepaid' });
  const afterRaise = projectQueue(s, { moves: [moves[1]] });
  assert.equal(preview.index, 0);
  assert.equal(preview.reason, direct.error);
  assert.match(preview.reason, /cash/i);
  assert.equal(queueOrderPreview(afterRaise, { units: 30, tier: 'prepaid' }).ok, true);
});

test('projected contract actions refresh deal cash and exclusivity checks', () => {
  const s = createInitialState();
  s.era = 2;
  s.cash = 1000;
  s.compute.contracts.push({
    id: 'az', supplier: 'azuria', units: 100, price: 1.1, monthsLeft: 24,
    needsPower: false, dark: false, scaledDown: false, exclusiveBought: false,
  });
  s.compute.offers = generateOffers(s, sideRng(s, 5));
  assert.equal(dealCards(s).find((card) => card.supplier === 'coreflame').disabled, true);
  const boughtOut = projectQueue(s, { contractActions: [{ id: 'az', action: 'buyout' }], moves: [] });
  assert.equal(dealCards(boughtOut).find((card) => card.supplier === 'coreflame').disabled, false);
  const lowCash = structuredClone(s);
  lowCash.cash = 60;
  const broken = projectQueue(lowCash, { contractActions: [{ id: 'az', action: 'break' }], moves: [] });
  const prepaid = dealCards(broken).find((card) => Object.fromEntries(card.rows).Upfront !== 'none');
  assert.equal(prepaid.disabled, true);
  assert.match(prepaid.reason, /cash/i);
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

test('a dropped one-time pledge cannot be offered again', () => {
  const s = createInitialState();
  assert.equal(pledgeAvailable(s), true);
  s.flags.safetyPledgeMade = true;
  assert.equal(pledgeAvailable(s), false);
  s.flags.safetyPledgeMade = false;
  s.promises.push({ type: 'safetyCompute', share: 0.1, turn: 0 });
  assert.equal(pledgeAvailable(s), false);
});

test('idle compute cost uses the average billed price of online contracts', () => {
  const s = createInitialState();
  s.era = 4;
  s.compute.contracts = [{
    id: 'spot', supplier: 'spot', units: 100, price: 3, monthsLeft: null,
    needsPower: false, dark: false, scaledDown: false, exclusiveBought: false,
  }, {
    id: 'verde-dark-by-power', supplier: 'verde', units: 900, price: 1, monthsLeft: 24,
    needsPower: true, dark: false, scaledDown: false, exclusiveBought: false,
  }];
  s.compute.online = 100;
  s.compute.servingUnits = 0;
  s.compute.split.safety = 0.1;
  const idle = computeBar(s).segments.find((segment) => segment.key === 'idle').units;
  assert.equal(idleComputeCost(s), idle * 3 * BALANCE.unitMonthlyCost);
  assert.ok(s.compute.contracts.reduce((sum, contract) => sum + contract.units * contract.price * BALANCE.unitMonthlyCost, 0)
    > idleComputeCost(s));
  assert.match(opinions(s, 'budget').find((opinion) => opinion.id === 'cfo').text, new RegExp(money(idleComputeCost(s)).replace('$', '\\$')));
});

test('idle compute cost does not attribute pooled capacity cost to idle units', () => {
  const s = createInitialState();
  s.compute.contracts = [{
    id: 'spot', supplier: 'spot', units: 100, price: 1, monthsLeft: null,
    needsPower: false, dark: false, scaledDown: false, exclusiveBought: false,
  }];
  s.compute.pooled = 0.3;
  s.compute.online = 70;
  s.compute.servingUnits = 0;
  s.compute.split.safety = 0;
  assert.equal(computeBar(s).segments.find((segment) => segment.key === 'idle').units, 70);
  assert.equal(idleComputeCost(s), 70 * BALANCE.unitMonthlyCost);
});

test('idle compute cost is unchanged without pooling', () => {
  const s = createInitialState();
  s.compute.contracts = [{
    id: 'spot', supplier: 'spot', units: 100, price: 1, monthsLeft: null,
    needsPower: false, dark: false, scaledDown: false, exclusiveBought: false,
  }];
  s.compute.pooled = 0;
  s.compute.online = 100;
  s.compute.servingUnits = 0;
  s.compute.split.safety = 0;
  assert.equal(computeBar(s).segments.find((segment) => segment.key === 'idle').units, 100);
  assert.equal(idleComputeCost(s), 100 * BALANCE.unitMonthlyCost);
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

test('site options match the exact side-RNG builds that will be queued', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 4;
  const view = sitesView(s);
  for (const source of ['gas', 'nuclear']) {
    const projected = structuredClone(s);
    const result = buildSite(projected, source, sideRng(projected, 1000 + projected.power.nextId));
    const site = projected.power.sites.find((candidate) => candidate.id === result.site);
    const option = view.options.find((candidate) => candidate.source === source);
    assert.equal(option.units, site.units);
    assert.equal(option.lease, leaseMonthly(site.units));
    assert.equal(option.readyIn, `${site.arrivesTurn - s.turn} turns`);
  }
});

test('queue and power screens are exposed only in their playable eras', () => {
  const s = createInitialState();
  const powerItem = COMPANY_ITEMS.find((item) => item.id === 'power');
  for (const era of [1, 2, 3, 4, 5]) {
    s.era = era;
    assert.equal(queueScreenAvailable(s), era === 3);
    assert.equal(powerSitesAvailable(s), era === 4);
    assert.equal(powerItem.hidden(s), era !== 4);
  }
});

test('era-four capacities use power units in visible and accessible copy', () => {
  assert.equal(computeAmount(30, 4), '51 MW');
  const s = createInitialState();
  s.era = 4;
  s.compute.online = 30;
  s.compute.servingUnits = 0;
  assert.match(computeAmount(computeBar(s).segments.at(-1).units, s.era), /MW|GW/);
});

test('view-model text never reveals poisoned hidden-state numbers', () => {
  const s = createInitialState();
  const sentinels = ['731091', '731092', '731093', '731094'];
  s.alignmentDebt = Number(sentinels[0]);
  s.concealedDebt = Number(sentinels[1]);
  s.misuseExposure = Number(sentinels[2]);
  s.rivals[0].capability = Number(sentinels[3]);
  const text = [dealCards(s), commitmentsView(s), queueView({ ...s, era: 3 }), computeBar(s), sitesView(s)];
  for (const screen of ['deals', 'queue', 'budget', 'power']) {
    const o = opinions(s, screen);
    assert.equal(o.length, 4);
    text.push(o);
  }
  const rendered = JSON.stringify(text);
  for (const sentinel of sentinels) assert.doesNotMatch(rendered, new RegExp(sentinel));
});
