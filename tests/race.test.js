import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { SIZE_CAP } from '../sim/recipe.js';
import { RIVAL_EDGE, NO_SIZE_GAIN } from '../sim/data/race.js';
import { generateOffers, refreshOffers, signOffer, sideRng } from '../sim/contracts.js';
import { announceTargets, takeTargets, offBoardGrowth, landRivalCompute, rivalDealsTurn } from '../sim/rivalDeals.js';
import { rivalsTurn, rivalSize, rivalTraining, rivalShortfall, launchGain, rank, computeShares, recordStanding } from '../sim/rivals.js';

const rivalOf = (s, id) => s.rivals.find((r) => r.id === id);
const expectedGain = (r, size, roll) => (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll - 2) * (1 - 0.5 * (0.1 + 0.2 * r.caution));

test('rivals start with fleets and want more as the era grows', () => {
  const s = createInitialState({ seed: 1 });
  assert.deepEqual(s.rivals.map((r) => r.fleet), [14, 10, 12, 11]);
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalShortfall(s, ob) - (25 * 1.3 * (1.1 - 0.4 * 0.25) - 14)) < 1e-9);
  ob.pipeline.push({ units: 100, turn: 1, source: 'offBoard' });
  assert.equal(rivalShortfall(s, ob), 0, 'compute on the way counts; the shortfall never goes below 0');
});

test('a rival trains the largest size its training compute fits, on the player ladder', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalTraining(ob) - 14 * (1 - (0.05 + 0.25 * 0.25)) * 0.7) < 1e-9);
  assert.equal(rivalSize(s, ob), 'medium'); // about 8.7 units: Medium needs 5, Large 10
  ob.fleet = 3;
  assert.equal(rivalSize(s, ob), null); // about 1.9 units: Small needs 2
  ob.fleet = 1000;
  assert.equal(rivalSize(s, ob), 'large', 'XL waits for era 2');
  s.era = 2;
  assert.equal(rivalSize(s, ob), 'xl');
});

test('the size ladder follows the era it is asked about', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  ob.fleet = 1000;
  assert.equal(rivalSize(s, ob), 'large', 'era 1 by default');
  assert.equal(rivalSize(s, ob, 2), 'xl', 'a roll made for an era 2 round uses the era 2 ladder');
});

test('launch gain comes from model size; no size fits gives 2', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(launchGain(s, ob, 3) - expectedGain(ob, 'medium', 3)) < 1e-9);
  ob.fleet = 3;
  assert.equal(launchGain(s, ob, 3), NO_SIZE_GAIN);
});

test('rival launches draw the same random numbers in the same order', () => {
  const s = createInitialState({ seed: 1 });
  const calls = [];
  const spy = { next: () => { calls.push('next'); return 0; }, int: (a, b) => { calls.push(`int:${a},${b}`); return a; } };
  s.rivals[0].progress = 0.99;
  rivalsTurn(s, spy);
  assert.deepEqual(calls, ['next', 'int:0,4', 'next', 'next', 'next']);
});

test('a binding compute cap limits each signing rival to 5 per launch', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  for (const r of s.rivals) r.fleet = 1000;
  s.deal = { collapsed: false, binding: ['computeCap'], signed: { computeCap: ['openbrain'] } };
  assert.equal(launchGain(s, rivalOf(s, 'openbrain'), 4), 5);
  assert.ok(launchGain(s, rivalOf(s, 'deepthink'), 4) > 5, 'a lab that did not sign keeps its full gain');
  s.deal.collapsed = true;
  assert.ok(launchGain(s, rivalOf(s, 'openbrain'), 4) > 5, 'a collapsed deal binds nobody');
});

test('compute shares cover every lab and add up to 1', () => {
  const s = createInitialState({ seed: 1 });
  const shares = computeShares(s);
  assert.ok(Math.abs(shares.you - 10 / 57) < 1e-9); // 10 of 10 + 14 + 10 + 12 + 11
  assert.ok(Math.abs(Object.values(shares).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test('each round mark counts the labs within half a point of the top', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 26.4; // OpenBrain 26 is within 0.5; DeepThink 24 is not
  recordStanding(s);
  recordStanding(s);
  assert.deepEqual(s.race.atTop, { you: 2, openbrain: 2 });
});

test('score ranks first; within half a point, standing decides and ties go to you', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 25.4; // OpenBrain 0.6 ahead
  assert.equal(rank(s), 2);
  s.capability = 26.3; // within 0.5, you are higher on score
  s.race.atTop = { you: 2, openbrain: 4 };
  assert.equal(rank(s), 2, 'OpenBrain got there first and stayed');
  s.race.atTop = { you: 4, openbrain: 4 };
  assert.equal(rank(s), 2, 'same time at the top: OpenBrain holds more compute (14 against your 10)');
  s.compute.online = 14;
  assert.equal(rank(s), 1, 'equal standing goes to you');
});

const flat = { next: () => 0.5, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };

test('board cards stay; a signed or taken slot refills; an era change makes a new board', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  s.compute.offers = s.compute.offers.filter((o) => o.supplier !== 'coreflame'); // signed or taken
  s.turn = 1;
  s.compute.offers = refreshOffers(s, flat);
  assert.deepEqual(s.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.equal(s.compute.offers.find((o) => o.supplier === 'verde'), verde, 'the untaken card is the same card');
  assert.equal(s.compute.offers.find((o) => o.supplier === 'coreflame').id, 'coreflame-1', 'the empty slot refills');
  s.era = 2;
  s.turn = 4;
  s.compute.offers = refreshOffers(s, flat);
  assert.ok(s.compute.offers.every((o) => o.id.endsWith('-4')), 'a new era makes a new board');
});

test('a kept card keeps its size but takes the fresh card\'s price', () => {
  const s = createInitialState({ seed: 1 });
  const azuria = s.compute.offers.find((o) => o.supplier === 'azuria');
  const units = azuria.units;
  azuria.price *= 2; // a stale price, as if drawn under a markup that has since ended
  azuria.monthly *= 2;
  azuria.upfront *= 2;
  azuria.partnerMarkup = 2;
  s.turn = 1;
  s.compute.offers = refreshOffers(s, flat);
  const kept = s.compute.offers.find((o) => o.supplier === 'azuria');
  const fresh = generateOffers(s, flat).find((o) => o.supplier === 'azuria');
  assert.equal(kept, azuria, 'still the same card');
  assert.equal(kept.units, units);
  assert.equal(kept.price, fresh.price);
  assert.ok(Math.abs(kept.monthly - (units * fresh.monthly) / fresh.units) < 1e-9);
  assert.equal(kept.partnerMarkup, undefined);
});

test('a kept card\'s upfront is worked out from the card itself, so it never drifts', async () => {
  const { SUPPLIERS } = await import('../sim/data/compute.js');
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  const expected = (o) => Math.round(SUPPLIERS.verde.upfrontShare * o.units * o.price * BALANCE.unitMonthlyCost * o.termMonths);
  const [lo, hi] = SUPPLIERS.verde.size;
  for (let size = lo; size <= hi; size += 1) { // every size the fresh card can be drawn at
    const turn = size - lo + 1;
    s.turn = turn;
    s.compute.offers = refreshOffers(s, { ...flat, int: () => size });
    assert.equal(s.compute.offers.find((o) => o.supplier === 'verde'), verde);
    assert.equal(verde.upfront, expected(verde), `round ${turn}`);
  }
});

test('the investment and the grid are always made fresh', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  s.compute.offersEra = 2;
  s.compute.offers = refreshOffers(s, flat);
  const equity = s.compute.offers.find((o) => o.supplier === 'azuriaEquity');
  const grid = s.compute.offers.find((o) => o.supplier === 'grid');
  s.valuation *= 2;
  s.turn = 5;
  s.compute.offers = refreshOffers(s, flat);
  const next = s.compute.offers.find((o) => o.supplier === 'azuriaEquity');
  assert.notEqual(next.id, equity.id);
  assert.ok(next.credits > equity.credits);
  assert.equal(grid.id, 'grid-0');
  assert.equal(s.compute.offers.find((o) => o.supplier === 'grid').id, 'grid-5', 'the grid card is made fresh');
});

test('a kept card takes the current arrival delay, so a scale-down delay never sticks or stacks', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  s.compute.delays.verde = 1; // a scale-down: Verde's cards on the board arrive a round later
  verde.arrivesIn += 1;
  s.turn = 1;
  s.compute.offers = refreshOffers(s, flat);
  const kept = s.compute.offers.find((o) => o.supplier === 'verde');
  assert.equal(kept, verde, 'the kept card is the same card');
  assert.equal(kept.arrivesIn, generateOffers(s, flat).find((o) => o.supplier === 'verde').arrivesIn, 'still delayed once, never twice');
  s.compute.delays.verde = 0; // signing with Verde clears the delay
  s.turn = 2;
  s.compute.offers = refreshOffers(s, flat);
  assert.equal(s.compute.offers.find((o) => o.supplier === 'verde'), verde);
  assert.equal(verde.arrivesIn, generateOffers(s, flat).find((o) => o.supplier === 'verde').arrivesIn, 'the delay is gone');
});

test('the era 3 queue entry is made fresh every round, never kept as a board card', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 3;
  s.turn = 8;
  s.compute.offers = refreshOffers(s, flat); // the era changes: a new board
  s.turn = 9;
  s.compute.offers = refreshOffers(s, flat);
  assert.equal(s.compute.offers.find((o) => o.viaQueue).id, 'verde-queue-9');
});

// Lodestar (22) picks first, then DeepThink (24), then OpenBrain (26). Era 1 shortfalls: Lodestar about 7.6,
// DeepThink about 11.6, OpenBrain about 18.5, Qilin about 16.6.
function board() {
  const s = createInitialState({ seed: 1 });
  s.compute.offers = [
    { id: 'verde-0', supplier: 'verde', units: 40, arrivesIn: 3, upfront: 0, monthly: 1, price: 0.85, termMonths: 24, string: null },
    { id: 'azuria-0', supplier: 'azuria', units: 12, arrivesIn: 1, upfront: 0, monthly: 1, price: 2, termMonths: 24, string: 'exclusive' },
    { id: 'coreflame-0', supplier: 'coreflame', units: 9, arrivesIn: 1, upfront: 0, monthly: 1, price: 0.75, termMonths: 12, string: 'fragile' },
    { id: 'spot-0', supplier: 'spot', units: 4, arrivesIn: 0, upfront: 0, monthly: 1, price: 4, termMonths: null, string: 'bumpable' },
  ];
  announceTargets(s);
  return s;
}
const offer = (s, id) => s.compute.offers.find((o) => o.id === id);

test('rivals name cards in catch-up order: careful labs the nearest, bold labs the biggest', () => {
  const s = board();
  assert.equal(offer(s, 'coreflame-0').wantedBy, 'lodestar'); // careful: 9 is nearest its 7.6
  assert.equal(offer(s, 'azuria-0').wantedBy, 'deepthink'); // caution 0.5 counts as careful: 12 is nearest 11.6
  assert.equal(offer(s, 'verde-0').wantedBy, 'openbrain'); // bold: the biggest card left
  assert.equal(offer(s, 'spot-0').wantedBy, undefined);
  for (const id of ['coreflame-0', 'azuria-0', 'verde-0']) assert.equal(offer(s, id).fallback, 'spot-0');
  assert.equal(rivalOf(s, 'qilin').named, null, 'Qilin never takes a board card');
});

test('a rival takes exactly the card it named', () => {
  const s = board();
  const heat = s.raceHeat;
  const events = takeTargets(s);
  assert.deepEqual(events.map((e) => [e.id, e.supplier, e.units, e.fallback]),
    [['lodestar', 'coreflame', 9, false], ['deepthink', 'azuria', 12, false], ['openbrain', 'verde', 40, false]]);
  assert.deepEqual(s.compute.offers.map((o) => o.id), ['spot-0'], 'the untaken card stays');
  assert.deepEqual(rivalOf(s, 'openbrain').pipeline, [{ units: 40, turn: s.turn + 3, supplier: 'verde', source: 'board' }]);
  assert.equal(rivalOf(s, 'lodestar').pipeline[0].turn, s.turn + 1);
  assert.equal(s.raceHeat, heat, 'rival deals add no heat (owner pick F); big ones are still news');
  assert.ok(events.every((e) => e.big), 'each of these deals adds a quarter or more to its fleet');
});

test('sign a named card first and that rival takes its second choice', () => {
  const s = board();
  s.compute.offers = s.compute.offers.filter((o) => o.id !== 'azuria-0');
  const events = takeTargets(s);
  assert.deepEqual(events.find((e) => e.id === 'deepthink'), { type: 'rivalDeal', id: 'deepthink', supplier: 'spot', units: 4, arrivesTurn: s.turn + 1, fallback: true, big: true });
});

test('two rivals share a fallback: the one earlier in catch-up order gets it', () => {
  const s = board();
  s.compute.offers = s.compute.offers.filter((o) => o.id !== 'coreflame-0' && o.id !== 'azuria-0');
  const events = takeTargets(s);
  assert.equal(events.find((e) => e.id === 'lodestar').supplier, 'spot');
  assert.equal(events.some((e) => e.id === 'deepthink'), false, 'DeepThink goes without a board card this round');
});

test('off the board, a quarter of what is still short arrives next round; Qilin grows only this way', () => {
  const s = board();
  takeTargets(s);
  offBoardGrowth(s);
  const qilin = rivalOf(s, 'qilin');
  assert.deepEqual(qilin.pipeline, [{ units: Math.round((25 * 1.15 * (1.1 - 0.4 * 0.35) - 11) * 0.25), turn: s.turn + 1, source: 'offBoard' }]);
  assert.equal(rivalOf(s, 'openbrain').pipeline.length, 1, 'OpenBrain is covered by its chip order');
});

test('compute lands in the rival fleet on its turn', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  ob.pipeline = [{ units: 5, turn: 0, source: 'offBoard' }, { units: 7, turn: 1, source: 'board' }];
  landRivalCompute(s);
  assert.equal(ob.fleet, 19);
  assert.deepEqual(ob.pipeline, [{ units: 7, turn: 1, source: 'board' }]);
});

test('denying a rival its card heats the race; a big deal on its own does not (owner pick F)', () => {
  const s = board();
  s.compute.online = 100;
  const heat = s.raceHeat;
  const r = signOffer(s, 'coreflame-0', sideRng(s, 1)); // Lodestar named it; 9 is under a quarter of 100
  assert.equal(r.denied, 'lodestar');
  assert.equal(s.raceHeat, heat + 2);
  s.compute.online = 10;
  signOffer(s, 'spot-0', sideRng(s, 1)); // nobody named it; 4 is over a quarter of 10
  assert.equal(s.raceHeat, heat + 2);
});

test('the round mark counts standing, then lands, takes and grows', () => {
  const s = board();
  const events = rivalDealsTurn(s);
  assert.equal(events.filter((e) => e.type === 'rivalDeal').length, 3);
  assert.deepEqual(s.race.atTop, { openbrain: 1 }, 'standing is counted at the mark');
  assert.ok(rivalOf(s, 'qilin').pipeline.some((p) => p.source === 'offBoard'));
});

test('from era 2, a rival more than 10 behind you gains +1 per 2 points beyond 10 on each launch (owner pick B6)', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain'); // score 26, Medium
  s.capability = 66; // 40 ahead: 30 beyond the threshold, so +15
  const base = expectedGain(ob, 'medium', 3);
  assert.ok(Math.abs(launchGain(s, ob, 3) - base) < 1e-9, 'era 1: no catch-up');
  s.era = 2;
  assert.ok(Math.abs(launchGain(s, ob, 3, 1) - base) < 1e-9, 'a roll for an era 1 round: no catch-up');
  ob.fleet = 12; // keep it Medium on the era 2 ladder
  const size = rivalSize(s, ob);
  const era2 = expectedGain(ob, size, 3);
  assert.ok(Math.abs(launchGain(s, ob, 3) - (era2 + 15)) < 1e-9);
  s.capability = 36; // exactly 10 ahead
  assert.ok(Math.abs(launchGain(s, ob, 3) - era2) < 1e-9, 'a lead of 10 or less gives nothing');
  ob.fleet = 3;
  s.capability = 66;
  assert.equal(launchGain(s, ob, 3), NO_SIZE_GAIN + 15, 'it applies when no size fits too');
});

test('the catch-up gain stays under a binding compute cap', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  s.capability = 90;
  s.deal = { collapsed: false, binding: ['computeCap'], signed: { computeCap: ['openbrain'] } };
  assert.equal(launchGain(s, rivalOf(s, 'openbrain'), 4), 5);
});

test('rounds at the top count only in the current era (owner pick A5)', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 26.3; // within 0.5 of OpenBrain
  s.race.atTop = { you: 4 };
  recordStanding(s); // era 1: you 5, openbrain 1
  assert.equal(rank(s), 1);
  s.era = 2;
  assert.equal(rank(s), 1, 'until era 2 has a round mark, era 1 still stands: rank does not flip at the era change');
  recordStanding(s);
  assert.deepEqual(s.race.atTop, { you: 1, openbrain: 1 }, 'the count starts again at the first era 2 mark');
  assert.equal(rank(s), 2, 'even time at the top this era: OpenBrain holds more compute');
});

test('a launch still waiting to land counts toward the gap, so a lead is not copied twice', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  const ob = rivalOf(s, 'openbrain'); // score 26
  ob.fleet = 12;
  const era2 = expectedGain(ob, rivalSize(s, ob), 3);
  s.capability = 66;
  s.rivalLaunches = [{ id: 'openbrain', gain: 20, heat: 0, day: 9999 }, { id: 'lodestar', gain: 50, heat: 0, day: 9999 }];
  // OpenBrain will be at 46 once its launch lands: 20 behind, 10 beyond the threshold, so +5. Lodestar's does not count.
  assert.ok(Math.abs(launchGain(s, ob, 3) - (era2 + 5)) < 1e-9);
});
