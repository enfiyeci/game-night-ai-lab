import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { createRng } from '../sim/rng.js';
import { SUPPLIERS, SPOT_PRICE, EQUITY_SHARE, GULF_OPEN, GULF_REVOKE, SCALE_DOWN, SCALE_DOWN_PENALTY_MONTHS, BREAK_SHARE, BUYOUT_MONTHS, eraScale } from '../sim/data/compute.js';
import { SITE_TYPES } from '../sim/power.js';
import {
  generateOffers, signOffer, deliverDue, contractsTurn, syncContracts, expireContracts, pullBumped, contractAction, monthlyBills,
  creditOffset, spendCredits, perTurn, exclusiveActive, sideRng,
} from '../sim/contracts.js';

// Tests check behaviour against the modules' own exports, not tuned constants (compute spec §11b).
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };
const fire = { ...lo, chance: () => true };
const U = BALANCE.unitMonthlyCost;
const small = (key, era) => SUPPLIERS[key].size[0] * eraScale(era); // the lo rng rolls the low end

function fresh(era = 1, favor = 50) {
  const s = createInitialState();
  s.era = era;
  s.govFavor.us = favor;
  s.cash = 1e6;
  s.power ??= { sites: [], nextId: 1 };
  Object.assign(s.compute, { offers: [], delays: {}, nextId: 1, credits: 0, unpowered: 0 });
  s.compute.contracts = [{ id: 'starter', supplier: 'starter', units: 10, price: 1, monthsLeft: 24, needsPower: false, dark: false, string: null }];
  s.compute.offers = generateOffers(s, lo);
  return s;
}
const offer = (s, supplier) => s.compute.offers.find((o) => o.supplier === supplier && !o.viaQueue);

test('offers follow the era menu and scale with the era', () => {
  assert.deepEqual(fresh(1).compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.equal(offer(fresh(1), 'verde').units, small('verde', 1));
  const e4 = fresh(4, GULF_OPEN + 10);
  assert.equal(offer(e4, 'verde').units, small('verde', 4));
  assert.ok(offer(e4, 'gulf') && offer(e4, 'loi') && offer(e4, 'azuriaEquity'));
  assert.deepEqual(fresh(5, GULF_OPEN + 10).compute.offers.map((o) => o.supplier), ['coreflame', 'spot']);
  const e3 = fresh(3);
  assert.equal(e3.compute.offers[0].viaQueue, true);
  assert.equal(offer(e3, 'verde'), undefined);
  assert.equal(offer(e3, 'gulf'), undefined, 'the Gulf offer needs US favor');
  const risk = fresh(4, GULF_OPEN + 10);
  risk.flags.supplyChainRisk = true;
  assert.equal(generateOffers(risk, lo).some((o) => o.supplier === 'gulf'), false);
});

test('speed carries the premium: spot costs the most, long reservations the least', () => {
  const s = fresh(1);
  assert.equal(offer(s, 'spot').price, SPOT_PRICE[1]);
  assert.ok(offer(s, 'spot').price > offer(s, 'azuria').price);
  assert.ok(offer(s, 'azuria').price > offer(s, 'verde').price);
  assert.equal(offer(s, 'verde').upfront, Math.round(SUPPLIERS.verde.upfrontShare * small('verde', 1) * U * SUPPLIERS.verde.termMonths));
  assert.equal(offer(fresh(5), 'spot').price, SPOT_PRICE[5]);
  assert.ok(Math.abs(perTurn(0.02, 3) - (1 - 0.98 ** 3)) < 1e-12);
});

test('a signed contract bills every month until its term ends, used or not', () => {
  const s = fresh(1);
  const cash = s.cash;
  const v = offer(s, 'verde');
  assert.equal(signOffer(s, v.id, lo).ok, true);
  assert.equal(s.cash, cash - v.upfront);
  assert.equal(s.compute.offers.some((o) => o.id === v.id), false, 'offers are single use');
  s.turn = v.arrivesIn;
  deliverDue(s, lo);
  assert.equal(s.compute.online, 10 + v.units);
  assert.ok(Math.abs(monthlyBills(s) - (10 + v.units) * U) < 1e-9);
  const c = s.compute.contracts.find((x) => x.supplier === 'verde');
  for (let m = 0; m < SUPPLIERS.verde.termMonths; m += 3) expireContracts(s);
  assert.equal(s.compute.contracts.includes(c), false);
  assert.equal(signOffer(s, 'nope', lo).ok, false);
});

test('spot arrives at once, renews every turn at the era price, and can be dropped for free', () => {
  const s = fresh(1);
  const sp = offer(s, 'spot');
  assert.equal(signOffer(s, sp.id, lo).ok, true);
  assert.equal(s.compute.online, 10 + sp.units);
  expireContracts(s);
  expireContracts(s);
  const c = s.compute.contracts.find((x) => x.supplier === 'spot');
  assert.ok(c, 'spot rolls over');
  s.era = 3;
  syncContracts(s);
  assert.equal(c.price, SPOT_PRICE[3], 'a renewal pays the current era price');
  const cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'break' }).ok, true);
  assert.equal(s.cash, cash);
  assert.equal(s.compute.online, 10);
});

test('an Azuria contract, cloud or investment, blocks other clouds until bought out', () => {
  const s = fresh(1);
  const az = offer(s, 'azuria');
  signOffer(s, az.id, lo);
  assert.equal(exclusiveActive(s), true);
  assert.equal(signOffer(s, offer(s, 'coreflame').id, lo).ok, false);
  s.turn = 1;
  deliverDue(s, lo);
  const c = s.compute.contracts.find((x) => x.supplier === 'azuria');
  const cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'buyout' }).ok, true);
  assert.ok(Math.abs(s.cash - (cash - BUYOUT_MONTHS * az.units * az.price * U)) < 1e-9);
  assert.equal(exclusiveActive(s), false);
  assert.equal(signOffer(s, offer(s, 'coreflame').id, lo).ok, true);
  const e = fresh(2);
  signOffer(e, offer(e, 'azuriaEquity').id, lo);
  assert.equal(exclusiveActive(e), true);
});

test('scale down once with a penalty and a slower next offer; break costs a share of what is left', () => {
  const s = fresh(1);
  const cf = offer(s, 'coreflame');
  signOffer(s, cf.id, lo);
  s.turn = 1;
  deliverDue(s, lo);
  const c = s.compute.contracts.find((x) => x.supplier === 'coreflame');
  const removed = Math.round(cf.units * SCALE_DOWN);
  let cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'scaleDown' }).ok, true);
  assert.equal(c.units, cf.units - removed);
  assert.ok(Math.abs(s.cash - (cash - removed * U * SCALE_DOWN_PENALTY_MONTHS)) < 1e-9);
  assert.equal(contractAction(s, { id: c.id, action: 'scaleDown' }).ok, false);
  s.compute.offers = generateOffers(s, lo);
  assert.equal(offer(s, 'coreflame').arrivesIn, SUPPLIERS.coreflame.arrival + 1);
  cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'break' }).ok, true);
  assert.ok(Math.abs(s.cash - (cash - BREAK_SHARE * c.units * U * c.monthsLeft)) < 1e-9);
  assert.equal(contractAction(s, { id: 'nope', action: 'break' }).ok, false);
  assert.equal(contractAction(s, { id: 'starter', action: 'melt' }).ok, false);
});

test('scale down delays an already-generated offer from the same supplier', () => {
  const s = fresh(1);
  signOffer(s, offer(s, 'coreflame').id, lo);
  s.turn = SUPPLIERS.coreflame.arrival;
  deliverDue(s, lo);
  s.compute.offers = generateOffers(s, lo);
  const current = offer(s, 'coreflame');
  const arrivesIn = current.arrivesIn;
  const c = s.compute.contracts.find((x) => x.supplier === 'coreflame');
  assert.equal(contractAction(s, { id: c.id, action: 'scaleDown' }).ok, true);
  assert.equal(current.arrivesIn, arrivesIn + 1);
  assert.equal(signOffer(s, current.id, lo).arrivesTurn, s.turn + arrivesIn + 1);
});

test('neocloud trouble, and the Gulf license follows US favor', () => {
  const s = fresh(3, GULF_OPEN + 5);
  const pt = s.publicTrust;
  signOffer(s, offer(s, 'coreflame').id, lo);
  assert.equal(signOffer(s, offer(s, 'gulf').id, lo).ok, true);
  assert.equal(s.publicTrust, pt - 2);
  s.turn = 2;
  deliverDue(s, lo);
  contractsTurn(s, fire);
  assert.equal(s.compute.contracts.find((c) => c.supplier === 'coreflame').troubled, true);
  const g = s.compute.contracts.find((c) => c.supplier === 'gulf');
  const withGulf = monthlyBills(s);
  s.govFavor.us = 45; contractsTurn(s, lo);
  assert.equal(g.dark, false, 'the license holds for the rest of the turn');
  syncContracts(s);
  assert.equal(g.dark, true);
  assert.ok(monthlyBills(s) < withGulf, 'a revoked license pauses billing');
  s.govFavor.us = 55; syncContracts(s);
  assert.equal(g.dark, true, 'restored only at the opening threshold');
  s.govFavor.us = GULF_OPEN; syncContracts(s);
  assert.equal(g.dark, false);
  s.flags.supplyChainRisk = true; syncContracts(s);
  assert.equal(g.dark, true, 'a supply-chain-risk designation also revokes it');
});

test('a letter of intent delivers 30 to 100 percent of its headline and needs power in era 4', () => {
  const s = fresh(4);
  const l = offer(s, 'loi');
  assert.equal(l.units, small('loi', 4));
  assert.equal(signOffer(s, l.id, lo).ok, true);
  s.turn = l.arrivesIn;
  deliverDue(s, lo);
  const c = s.compute.contracts.find((x) => x.headline === l.units);
  assert.equal(c.units, Math.round(l.units * 0.3));
  assert.equal(c.needsPower, true);
});

test('equity-for-compute credits pay Azuria bills and cost board support', () => {
  const s = fresh(2);
  s.valuation = 12000;
  s.compute.offers = generateOffers(s, lo);
  const e = offer(s, 'azuriaEquity');
  assert.equal(e.credits, Math.round(12000 * EQUITY_SHARE));
  assert.equal(e.units, Math.floor(e.credits / (U * SUPPLIERS.azuriaEquity.termMonths)));
  const board = [...s.board];
  signOffer(s, e.id, lo);
  assert.deepEqual(s.board, board.map((b) => b - 3));
  s.turn = 1;
  deliverDue(s, lo);
  assert.ok(Math.abs(creditOffset(s) - e.units * U) < 1e-9);
  const used = spendCredits(s);
  assert.ok(Math.abs(s.compute.credits - (e.credits - used)) < 1e-9);
});

test('the grid card reserves a power site and then disappears', () => {
  const s = fresh(2);
  const g = offer(s, 'grid');
  assert.equal(g.upfront, SITE_TYPES.grid.upfront);
  assert.equal(signOffer(s, g.id, lo).ok, true);
  assert.equal(s.power.sites[0].source, 'grid');
  assert.equal(generateOffers(s, lo).some((o) => o.supplier === 'grid'), false);
});

test('spot can be pulled with a turn of warning in the tight eras, and its last turn is billed', () => {
  const s = fresh(3);
  signOffer(s, offer(s, 'spot').id, lo);
  assert.equal(contractsTurn(s, fire).warnedBump, true);
  assert.equal(pullBumped(s).length, 0, 'it still serves the turn after the warning');
  s.turn += 1;
  assert.equal(contractsTurn(s, fire).warnedBump, false, 'a pull is warned once');
  const bill = monthlyBills(s);
  assert.ok(s.compute.contracts.some((c) => c.supplier === 'spot'), 'the economy bills its last turn');
  assert.equal(pullBumped(s).length, 1);
  assert.ok(monthlyBills(s) < bill);
  assert.equal(s.compute.contracts.some((c) => c.supplier === 'spot'), false);
});

test('a delivery applies the era spot price and the Gulf license at once', () => {
  const s = fresh(3, GULF_OPEN + 5);
  signOffer(s, offer(s, 'spot').id, lo);
  signOffer(s, offer(s, 'gulf').id, lo);
  s.govFavor.us = GULF_REVOKE - 1;
  s.era = 4;
  s.turn = SUPPLIERS.gulf.arrival;
  deliverDue(s, lo);
  assert.equal(s.compute.contracts.find((c) => c.supplier === 'spot').price, SPOT_PRICE[4]);
  assert.equal(s.compute.contracts.find((c) => c.supplier === 'gulf').dark, true, 'a license revoked in transit arrives dark');
});

test('a Gulf license revoked in transit stays revoked until favor reaches the opening threshold', () => {
  const s = fresh(3, GULF_OPEN);
  const gulf = offer(s, 'gulf');
  signOffer(s, gulf.id, lo);
  s.turn = 1;
  s.govFavor.us = GULF_REVOKE - 1;
  deliverDue(s, lo);
  s.turn = gulf.arrivesIn;
  s.govFavor.us = GULF_REVOKE + 1;
  deliverDue(s, lo);
  const c = s.compute.contracts.find((x) => x.supplier === 'gulf');
  assert.equal(c.dark, true);
  assert.equal(monthlyBills(s), 10 * U);
});

test('the side stream is deterministic and independent of the main stream', () => {
  const s = fresh(1);
  assert.equal(sideRng(s, 3).next(), sideRng(s, 3).next());
  assert.notEqual(sideRng(s, 3).next(), sideRng(s, 4).next());
  const original = sideRng(s, 3).next();
  s.seed += 1;
  assert.notEqual(sideRng(s, 3).next(), original);
  s.seed -= 1;
  s.turn += 1;
  assert.notEqual(sideRng(s, 3).next(), original);
  s.turn -= 1;
  const main = createRng(s.seed);
  main.next();
  main.next();
  assert.equal(sideRng(s, 3).next(), original);
});
