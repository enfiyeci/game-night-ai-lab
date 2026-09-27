import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { INDEPENDENCE_ROUND_SHARE, INVESTORS, raiseRound, roundAmount, useEmergency } from '../sim/economy.js';
import { PARTNER_MARKUP, RIVAL_CLOUDS, SPOT_PRICE, SUPPLIERS, spotPrice } from '../sim/data/compute.js';
import { generateOffers, markUpRivalOffers, syncContracts } from '../sim/contracts.js';
import { spotCover } from '../sim/split.js';
import { EVENTS } from '../sim/data/events.js';
import { roundSize, signedAt } from '../ui/logic/finance.js';

// Owner 2026-09-26: the strings the investors promise must happen in play. The strategic cloud partner
// marks up rival clouds; trading equity for compute shrinks every later round.
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };

function fresh(era = 3) {
  const s = createInitialState();
  s.era = era;
  s.govFavor.us = 70; // the Gulf campus is on offer
  s.cash = 1e6;
  Object.assign(s.compute, { offers: [], delays: {}, nextId: 1, credits: 0, unpowered: 0 });
  return s;
}
const offerFor = (offers, supplier) => offers.find((o) => o.supplier === supplier && !o.viaQueue);

test('before any cloud money, rival clouds are at list price', () => {
  const offers = generateOffers(fresh(), lo);
  assert.equal(offerFor(offers, 'coreflame').price, SUPPLIERS.coreflame.price);
  assert.equal(offerFor(offers, 'spot').price, SPOT_PRICE[3]);
  assert.equal(offerFor(offers, 'coreflame').partnerMarkup, undefined);
});

test('the strategic cloud partner marks up every rival cloud, and only those', () => {
  const s = fresh();
  assert.equal(raiseRound(s, 'strategic').ok, true);
  const offers = generateOffers(s, lo);
  assert.deepEqual(RIVAL_CLOUDS.slice().sort(), ['coreflame', 'gulf', 'spot']);
  assert.equal(offerFor(offers, 'coreflame').price, SUPPLIERS.coreflame.price * PARTNER_MARKUP);
  assert.equal(offerFor(offers, 'spot').price, SPOT_PRICE[3] * PARTNER_MARKUP);
  assert.equal(offerFor(offers, 'gulf').price, SUPPLIERS.gulf.price * PARTNER_MARKUP);
  assert.equal(offerFor(offers, 'coreflame').partnerMarkup, PARTNER_MARKUP);
  const coreflame = offerFor(offers, 'coreflame');
  assert.equal(coreflame.monthly, coreflame.units * coreflame.price * BALANCE.unitMonthlyCost);
  assert.equal(offerFor(offers, 'azuria').price, SUPPLIERS.azuria.price);
  assert.equal(offerFor(offers, 'azuria').partnerMarkup, undefined);
});

test('other investors leave cloud prices alone', () => {
  for (const archetype of ['vc', 'sovereign']) {
    const s = fresh();
    raiseRound(s, archetype);
    assert.equal(offerFor(generateOffers(s, lo), 'coreflame').price, SUPPLIERS.coreflame.price);
  }
});

test('spot keeps the markup when it renews and when it covers a shortfall', () => {
  const s = fresh();
  raiseRound(s, 'strategic');
  s.compute.contracts = [{ id: 'x', supplier: 'spot', units: 4, price: SPOT_PRICE[3], monthsLeft: null, dark: false, string: 'bumpable' }];
  syncContracts(s);
  assert.equal(s.compute.contracts[0].price, SPOT_PRICE[3] * PARTNER_MARKUP);
  assert.equal(spotPrice(s), SPOT_PRICE[3] * PARTNER_MARKUP);

  // More serving demand than online units leaves a shortfall that spot covers.
  const cover = (state) => {
    Object.assign(state.compute, { online: 0, servingUnits: 5 });
    state.compute.split.coverWithSpot = true;
    return spotCover(state);
  };
  const base = cover(fresh());
  assert.ok(base > 0);
  assert.ok(Math.abs(cover(s) - base * PARTNER_MARKUP) < 1e-6);
});

test('after trading equity for compute, every later round raises less', () => {
  const s = createInitialState();
  s.era = 2;
  s.burnPlanned = 50;
  s.cash = 200; // short runway, so emergency options are open
  const full = roundAmount(s, 'vc');
  assert.equal(full, Math.round(s.valuation * INVESTORS.vc.share));
  assert.equal(useEmergency(s, 'equityForCompute').ok, true);
  assert.equal(roundAmount(s, 'vc'), Math.round(s.valuation * INVESTORS.vc.share * INDEPENDENCE_ROUND_SHARE));
  assert.equal(roundSize(s), roundAmount(s, 'vc')); // the finance planner plans with the same amount
  const before = s.cash;
  const expected = roundAmount(s, 'sovereign');
  assert.equal(raiseRound(s, 'sovereign').amount, expected);
  assert.equal(s.cash, before + expected);
});

test('other emergency options do not cost independence', () => {
  const s = createInitialState();
  s.era = 2;
  s.burnPlanned = 50;
  s.cash = 200;
  useEmergency(s, 'bridgeRound');
  assert.equal(roundAmount(s, 'vc'), Math.round(s.valuation * INVESTORS.vc.share));
});

test('raising from the partner marks up rival offers already on the table this turn', () => {
  const s = fresh();
  s.compute.offers = generateOffers(s, lo);
  const before = { ...offerFor(s.compute.offers, 'gulf') };
  raiseRound(s, 'strategic');
  const gulf = offerFor(s.compute.offers, 'gulf');
  assert.equal(gulf.price, before.price * PARTNER_MARKUP);
  assert.equal(gulf.monthly, gulf.units * gulf.price * BALANCE.unitMonthlyCost);
  assert.equal(gulf.upfront, Math.round(before.upfront * PARTNER_MARKUP));
  assert.equal(offerFor(s.compute.offers, 'spot').price, SPOT_PRICE[3] * PARTNER_MARKUP);
  assert.equal(offerFor(s.compute.offers, 'azuria').price, SUPPLIERS.azuria.price);
  const again = gulf.price;
  markUpRivalOffers(s); // never twice
  assert.equal(gulf.price, again);
});

test('the planner bills a spot contract at its stored price this turn and the marked-up price after', () => {
  const s = fresh();
  s.compute.contracts = [{ id: 'x', supplier: 'spot', units: 4, price: SPOT_PRICE[3], monthsLeft: null, dark: false, string: 'bumpable', needsPower: false }];
  s.compute.pipeline = [];
  s.power = { sites: [], nextId: 1 };
  raiseRound(s, 'strategic');
  const now = signedAt(s, s.turn).prices.find((p) => p.units === 4);
  const next = signedAt(s, s.turn + 1).prices.find((p) => p.units === 4);
  assert.equal(now.price, SPOT_PRICE[3]);
  assert.equal(next.price, SPOT_PRICE[3] * PARTNER_MARKUP);
});

test('moving a failing neocloud to spot pays the partner-marked spot price', () => {
  const s = fresh();
  raiseRound(s, 'strategic');
  s.compute.contracts = [{ id: 'cf', supplier: 'coreflame', units: 8, price: SUPPLIERS.coreflame.price, monthsLeft: 6, dark: false, troubled: true, string: 'fragile' }];
  const card = EVENTS.find((event) => event.id === 'neocloudTrouble');
  card.card.choices.find((choice) => choice.id === 'spot').effects(s);
  assert.equal(s.compute.contracts[0].supplier, 'spot');
  assert.equal(s.compute.contracts[0].price, SPOT_PRICE[3] * PARTNER_MARKUP);
});
