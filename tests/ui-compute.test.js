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
  roundEndStrip,
  sitesView,
  turnSummary,
} from '../ui/logic/compute.js';
import { stampLandings } from '../sim/landings.js';
import { storyDate } from '../sim/time.js';
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

test('commitment previews measure delivery from today, not the projected arrival turn', () => {
  const state = createInitialState();
  for (const supplier of ['verde', 'coreflame', 'spot']) {
    const offer = state.compute.offers.find((candidate) => candidate.supplier === supplier);
    const row = commitmentsView(state, offer.id).rows.find((candidate) => candidate.isNew);
    const card = dealCards(state).find((candidate) => candidate.id === offer.id);
    assert.ok(row);
    assert.equal(row.monthsLeft, `arrives ${card.rows.find(([label]) => label === 'Arrives')[1]}`);
  }
});

test('the commitment bill date matches the actual scheduled delivery month', () => {
  const state = createInitialState({ seed: 4 });
  const offer = state.compute.offers.find((candidate) => candidate.supplier === 'coreflame');
  const signed = structuredClone(state);
  const result = signOffer(signed, offer.id, sideRng(signed, 1));
  stampLandings(signed);
  const delivery = signed.compute.pipeline.find((item) => item.id === result.pipelineId);
  assert.equal(commitmentsView(state, offer.id).afterDate, storyDate(delivery.landsDay).label);
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

test('LOI commitments project delivery from available power', () => {
  const s = createInitialState();
  s.cash = 10000;
  s.era = 4;
  s.compute.offers = generateOffers(s);
  const offer = s.compute.offers.find((candidate) => candidate.supplier === 'loi');
  const view = commitmentsView(s, offer.id);
  const row = view.rows.find((candidate) => candidate.isNew);
  assert.equal(row.units, Math.round(offer.units * 0.3));
  assert.equal(row.bill, row.units * offer.price * BALANCE.unitMonthlyCost);
  assert.equal(view.billAfter, view.billNow + row.bill);
  assert.equal(view.billAfterRange, null);
  assert.match(row.status, /power/i);
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
  assert.match(prepaid.reason, /^Upfront is .*; you have -?\$/);
});

test('a projection leaves a pending card alone until its story-day deadline', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'distill', dueAt: s.day + 10 });
  const projected = projectQueue(s, { moves: [] });
  assert.deepEqual(projected.pendingEvents, s.pendingEvents);
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
    assert.equal(option.readyIn, `about ${site.arrivesTurn - s.turn} months`);
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

test('sites and signed deals show the landing date, not the old mark', () => {
  const s = createInitialState({ seed: 7 });
  s.power.sites.push({ id: 'gas-t', source: 'gas', units: 40, arrivesTurn: 2, online: false, oppositionCut: null, landsDay: 170, landsFor: 1 });
  s.power.sites.push({ id: 'nuke-t', source: 'nuclear', units: 30, arrivesTurn: 2, online: false, oppositionCut: null, landsDay: 165, landsFor: 1 });
  const view = sitesView(s);
  assert.equal(view.nextArrival.day, 165); // the next to land, not the first built
  assert.match(view.sites.find((x) => x.id === 'gas-t').status, new RegExp(`online ${storyDate(170).label}`));
  s.compute.pipeline.push({ id: 'c9', supplier: 'verde', units: 8, arrivesTurn: 2, landsDay: 175, landsFor: 1 });
  s.compute.pipeline.unshift({ id: 'c8', supplier: 'azuria', units: 4, arrivesTurn: 2, landsDay: 160, landsFor: 1 }); // an older deal due the same round
  const lines = turnSummary([{ type: 'deal', supplier: 'verde', arrivesTurn: 2, pipelineId: 'c9' }], s);
  assert.ok(lines.some((line) => line.includes(storyDate(175).label)), lines.join(' / '));
});

test('deal cards say who takes them and what happens if you sign first', () => {
  const s = createInitialState({ seed: 1 });
  const cards = dealCards({ ...s, movesLeft: 2 });
  const named = s.compute.offers.filter((o) => o.wantedBy);
  for (const o of named) {
    const card = cards.find((c) => c.id === o.id);
    const rival = s.rivals.find((r) => r.id === o.wantedBy).name;
    assert.equal(card.takenBy, rival);
    assert.match(card.fallbackLine, new RegExp(`^If you sign it, ${rival} `));
  }
  for (const card of cards.filter((c) => !named.some((o) => o.id === c.id))) assert.equal(card.takenBy, null);
});

test('the round-end strip lists every named card and Qilin', () => {
  const s = createInitialState({ seed: 1 });
  const strip = roundEndStrip(s);
  assert.equal(strip.length, s.compute.offers.filter((o) => o.wantedBy).length + 2);
  assert.equal(strip.at(-1).text, 'Cards nobody takes stay on the board');
});

test('turn summaries report rival deals and your denial', () => {
  const s = createInitialState({ seed: 1 });
  const lines = turnSummary([
    { type: 'rivalDeal', id: 'openbrain', supplier: 'verde', units: 40, arrivesTurn: 3, fallback: false, big: true },
    { type: 'rivalDeal', id: 'deepthink', supplier: 'spot', units: 4, arrivesTurn: 1, fallback: true, big: true },
  ], s);
  assert.deepEqual(lines, ["OpenBrain signed Verde's 40 units", "DeepThink signed Spot market's 4 units, its second choice"]);
});

test('a card you cannot pay for says how much you have', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  s.cash = verde.upfront - 1;
  const card = dealCards({ ...s, movesLeft: 2 }).find((c) => c.id === verde.id);
  assert.match(card.reason, /^Upfront is \$[\d.,]+[MB]; you have \$[\d.,]+[MB]\.$/);
});

test('after you queue a named card, the board and strip show the rival taking its second choice', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.wantedBy === 'openbrain');
  const projected = projectQueue(s, { moves: [{ type: 'deal', offerId: verde.id }] });
  assert.ok(!projected.compute.offers.some((o) => o.id === verde.id), 'Verde is signed in the projection');
  const cards = dealCards({ ...projected, movesLeft: 1 });
  const spot = cards.find((c) => c.id === verde.fallback);
  assert.equal(spot.takenBy, 'OpenBrain');
  assert.equal(spot.takenAsSecond, true);
  assert.match(spot.fallbackLine, /^If you sign it, OpenBrain goes without a board card this quarter\.$/);
  assert.deepEqual(spot.secondChoiceOf, [], 'a card a rival takes shows its banner, not a second-choice tag');
  const strip = roundEndStrip(projected).map((i) => i.text);
  assert.ok(strip.some((t) => /^OpenBrain \+\d+ units?$/.test(t)), strip.join(' | '));
});

test('two rivals sharing a second choice: signing one card says what that rival really gets', () => {
  const s = createInitialState({ seed: 1 });
  const cards = dealCards({ ...s, movesLeft: 2 });
  const spotId = s.compute.offers.find((o) => o.supplier === 'spot').id;
  const byRival = Object.fromEntries(cards.filter((c) => c.takenBy).map((c) => [c.takenBy, c]));
  // Catch-up order is Lodestar, DeepThink, OpenBrain; all three fall back to Spot, and the first to need it gets it.
  for (const name of ['OpenBrain', 'DeepThink', 'Lodestar']) {
    assert.match(byRival[name].fallbackLine, new RegExp(`^If you sign it, ${name} takes Spot market's`));
  }
  assert.ok(cards.some((c) => c.id === spotId && c.takenBy === null));
});

test('the research advisor names the gap only when the leader trains a larger model', () => {
  const s = createInitialState({ seed: 1 });
  const research = (state) => opinions(state, 'deals').find((o) => o.id === 'research').text;
  s.rivals.forEach((r) => { r.fleet = 4; }); // every rival down to Small or nothing
  s.rivals[0].capability = 99;
  assert.equal(research(s), 'More compute lets us train a larger model sooner.');
  s.rivals[0].fleet = 40; // the leader can train Large
  assert.match(research(s), /^OpenBrain can train Large; we can train \w+\. More compute closes that\.$/);
});

// The signed stamp (owner playtest 2026-09-26): the board holds a moment with a SIGNED stamp on the card.
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { installFakeDom } from './helpers/fakeDom.js';

async function dealBoard() {
  const doc = installFakeDom();
  const { openDeals } = await import('../ui/screens/compute.js');
  const game = createGame({ state: SCENARIOS.era3Idle(1), seed: 1 });
  const overlay = doc.createElement('div');
  doc.body.append(overlay);
  openDeals(game, overlay);
  return { game, overlay };
}
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 5));

test('signing stamps the card, queues exactly one deal, and a second click ends the stamp', { timeout: 3000 }, async () => {
  const { game, overlay } = await dealBoard();
  const movesBefore = game.movesLeft();
  const offersBefore = game.state.compute.offers.length;
  const signedId = overlay.querySelector('.company-card.selected').dataset.choice;
  overlay.querySelector('.dialog-ok').click();
  assert.equal(game.movesLeft(), movesBefore - 1, 'the deal is queued at once, not after the stamp');
  assert.equal(game.state.compute.offers.some((offer) => offer.id === signedId), false);
  assert.equal(game.state.compute.offers.length, offersBefore - 1);
  const card = overlay.querySelector('.deal-signed');
  assert.equal(card?.dataset.choice, signedId, 'the stamp lands on the card that was signed');
  assert.equal(card.querySelector('.deal-signed-stamp').textContent, 'Signed');
  assert.ok(overlay.querySelector('.dialog-layer'), 'the board stays up while the stamp plays');
  overlay.querySelector('[data-choice]:not(.deal-signed)')?.click();
  overlay.querySelector('.compute-queue-card')?.click();
  assert.equal(overlay.querySelector('.deal-signed')?.dataset.choice, signedId, 'a card click does not redraw the board mid-stamp');
  await nextFrame();
  const closed = new Promise((resolve) => overlay.addEventListener('gdt-dialog-closed', resolve));
  overlay.querySelector('.dialog-ok').click();
  await closed;
  assert.equal(overlay.querySelector('.dialog-layer'), null, 'a second click finishes the stamp');
  assert.equal(game.movesLeft(), movesBefore - 1, 'still exactly one deal');
});

test('the signed stamp closes the board on its own after a short hold', { timeout: 3000 }, async () => {
  const { game, overlay } = await dealBoard();
  const movesBefore = game.movesLeft();
  const closed = new Promise((resolve) => overlay.addEventListener('gdt-dialog-closed', resolve));
  overlay.querySelector('.dialog-ok').click();
  assert.ok(overlay.querySelector('.dialog-layer'));
  await closed;
  assert.equal(overlay.querySelector('.dialog-layer'), null);
  assert.equal(game.movesLeft(), movesBefore - 1);
});
