import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, resolveEvent } from '../sim/events.js';
import { updateServing, monthlyRevenue } from '../sim/economy.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { REAL_EVENTS } from '../sim/data/realEvents.js';
import { endTurn } from '../sim/turn.js';
import { createRng } from '../sim/rng.js';
import { contractBill } from '../sim/contracts.js';
import { RESCUE_MONTHS, SPOT_PRICE } from '../sim/data/compute.js';
import { leaseMonthly, powerTurn } from '../sim/power.js';
import { readTheRoom } from '../sim/summit.js';

const no = { next: () => 0.99, int: (a) => a, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { ...no, next: () => 0, chance: () => true };
const kestrel = () => ({
  name: 'Kestrel 1 Core', active: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market', users: 4e6, userCap: 16e6, servingCost: 0,
  spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
});

test('a troubled neocloud warns first, then asks what to do', () => {
  const s = createInitialState();
  s.compute.contracts.push({ id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' });
  eventsTick(s, no);
  assert.ok(s.warnings.neocloudTrouble);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.find((event) => event.id === 'neocloudTrouble')?.id, 'neocloudTrouble');
  assert.equal(resolveEvent(s, 'neocloudTrouble', 'letgo').ok, true);
  assert.equal(s.compute.contracts.some((c) => c.id === 'cf'), false);
});

test('a CoreFlame failure is warned about in the turn it happens', () => {
  // Search seeds for a turn whose trouble roll hits (about 6% per era 1 turn), then check the same turn's events.
  let out = null;
  for (let seed = 1; seed <= 2000 && !out; seed++) {
    const s = createInitialState({ seed });
    s.compute.contracts.push({ id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: false, string: 'fragile' });
    const r = endTurn(s, {}, createRng(seed));
    if (r.state.compute.contracts.some((c) => c.id === 'cf' && c.troubled)) out = r;
  }
  assert.ok(out, 'some seed rolls CoreFlame trouble');
  assert.ok(out.events.some((e) => e.type === 'warning' && e.id === 'neocloudTrouble'));
});

test('acting on the neocloud warning refinances it', () => {
  const s = createInitialState();
  s.compute.contracts.push({ id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' });
  eventsTick(s, no);
  assert.equal(addressWarning(s, 'neocloudTrouble').ok, true);
  assert.equal(s.compute.contracts.find((c) => c.id === 'cf').troubled, false);
  s.compute.contracts.find((c) => c.id === 'cf').troubled = true;
  eventsTick(s, no);
  assert.ok(s.warnings.neocloudTrouble);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.find((event) => event.id === 'neocloudTrouble')?.id, 'neocloudTrouble');
  assert.equal(resolveEvent(s, 'neocloudTrouble', 'rescue').ok, true);
});

test('neocloud choices convert or rescue every troubled contract and remain repeatable', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'neocloudTrouble');
  const spot = createInitialState();
  spot.era = 3;
  spot.compute.contracts.push(
    { id: 'a', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' },
    { id: 'b', supplier: 'coreflame', units: 7, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' },
  );
  spot.seenEvents.push('neocloudTrouble');
  assert.equal(event.repeatable, true);
  event.card.choices.find((choice) => choice.id === 'spot').effects(spot);
  for (const contract of spot.compute.contracts.filter((contract) => contract.id === 'a' || contract.id === 'b')) {
    assert.equal(contract.supplier, 'spot');
    assert.equal(contract.price, SPOT_PRICE[3]);
    assert.equal(contract.string, 'bumpable');
    assert.equal(contract.monthsLeft, null);
    assert.equal(contract.troubled, false);
  }
  assert.equal(spot.seenEvents.includes('neocloudTrouble'), true);

  const rescue = createInitialState();
  const troubled = { id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' };
  rescue.compute.contracts.push(troubled);
  rescue.seenEvents.push('neocloudTrouble');
  const cash = rescue.cash;
  event.card.choices.find((choice) => choice.id === 'rescue').effects(rescue);
  assert.equal(rescue.cash, cash - RESCUE_MONTHS * contractBill(troubled));
  assert.equal(troubled.troubled, false);
  assert.equal(rescue.seenEvents.includes('neocloudTrouble'), true);
});

test('opposition to a gas site: pushing through can cut the site', () => {
  const s = createInitialState({ seed: 71 });
  s.era = 4;
  s.turn = 12;
  s.seenEvents = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS]
    .filter((event) => event.id !== 'siteOpposition')
    .map((event) => event.id);
  s.power.sites.push({ id: 'gas-1', source: 'gas', units: 400, arrivesTurn: 99, online: false, oppositionCut: null });
  eventsTick(s, yes);
  assert.ok(s.warnings.siteOpposition);
  s.turn += 1;
  eventsTick(s, yes);
  assert.equal(resolveEvent(s, 'siteOpposition', 'push').ok, true);
  assert.equal(s.power.sites[0].units, 280);
});

test('site opposition never targets a site that will be online before its card can be answered', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'siteOpposition');
  const sharedRng = { chance: () => assert.fail('site opposition used the shared event RNG') };
  const soon = createInitialState({ seed: 71 });
  soon.turn = 12;
  soon.power.sites.push({ id: 'gas-soon', source: 'gas', units: 400, arrivesTurn: 14, online: false, oppositionCut: null });
  assert.equal(event.trigger(soon, sharedRng), false);
  assert.equal(soon.flags.oppositionSite, undefined);

  const building = createInitialState({ seed: 71 });
  building.turn = 12;
  building.power.sites.push({ id: 'gas-building', source: 'gas', units: 400, arrivesTurn: 15, online: false, oppositionCut: null });
  assert.equal(event.trigger(building, sharedRng), true);
  assert.equal(building.flags.oppositionSite, 'gas-building');
});

test('moving a deferred opposed site takes it offline and brings it back two turns later', () => {
  const s = createInitialState({ seed: 71 });
  s.era = 4;
  s.turn = 12;
  s.seenEvents = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS]
    .filter((event) => event.id !== 'siteOpposition')
    .map((event) => event.id);
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 400, price: 1, monthsLeft: 24, needsPower: true, dark: false });
  s.power.sites.push({ id: 'gas-deferred', source: 'gas', units: 400, arrivesTurn: 15, online: false, oppositionCut: null });
  s.pendingEvents = [{ id: 'block-a' }, { id: 'block-b' }];

  eventsTick(s, no);
  assert.ok(s.warnings.siteOpposition);
  s.turn = 13;
  eventsTick(s, no);
  assert.equal(s.warnings.siteOpposition.deferred, true);
  s.pendingEvents = [];
  s.turn = 14;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((event) => event.id === 'siteOpposition'), true);
  s.turn = 15;
  assert.equal(powerTurn(s).some((event) => event.id === 'gas-deferred'), true);
  assert.equal(s.power.sites[0].online, true);

  assert.equal(resolveEvent(s, 'siteOpposition', 'move').ok, true);
  assert.equal(s.power.sites[0].online, false);
  assert.equal(s.power.sites[0].arrivesTurn, 17);
  assert.equal(s.compute.online, 10);
  s.turn = 16;
  assert.deepEqual(powerTurn(s), []);
  assert.equal(s.power.sites[0].online, false);
  s.turn = 17;
  assert.equal(powerTurn(s).some((event) => event.id === 'gas-deferred'), true);
  assert.equal(s.power.sites[0].online, true);
});

test('site opposition benefits cost one lease month and moving delays the selected site', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'siteOpposition');
  const benefits = createInitialState();
  benefits.flags.oppositionSite = 'gas-1';
  benefits.power.sites.push({ id: 'gas-1', source: 'gas', units: 300, arrivesTurn: 9, online: false, oppositionCut: false });
  const cash = benefits.cash;
  event.card.choices.find((choice) => choice.id === 'benefits').effects(benefits);
  assert.equal(benefits.cash, cash - leaseMonthly(300));

  const move = createInitialState();
  move.flags.oppositionSite = 'gas-2';
  move.compute.online = 999;
  move.power.sites.push({ id: 'gas-1', source: 'gas', units: 300, arrivesTurn: 7, online: false, oppositionCut: false });
  move.power.sites.push({ id: 'gas-2', source: 'gas', units: 400, arrivesTurn: 8, online: false, oppositionCut: false });
  event.card.choices.find((choice) => choice.id === 'move').effects(move);
  assert.deepEqual(move.power.sites.map((site) => site.arrivesTurn), [7, 10]);
  assert.equal(move.compute.online, 10);

  const push = createInitialState();
  push.flags.oppositionSite = 'gas-3';
  push.compute.contracts.push({ id: 'v', supplier: 'verde', units: 400, price: 1, monthsLeft: 24, needsPower: true, dark: false });
  push.power.sites.push({ id: 'gas-3', source: 'gas', units: 400, arrivesTurn: 12, online: true, oppositionCut: true });
  push.compute.online = 410;
  event.card.choices.find((choice) => choice.id === 'push').effects(push);
  assert.equal(push.power.sites[0].units, 280);
  assert.equal(push.compute.online, 290);
});

test('dropping the safety pledge preserves its once-ever flag and every President promise', () => {
  const s = createInitialState();
  s.era = 2;
  s.flags.safetyPledgeMade = true;
  const safety = { type: 'safetyCompute', share: 0.2, turn: 1 };
  const president = { source: 'president', id: 'beatRivals', status: 'open' };
  const presidentWithType = { source: 'president', type: 'safetyCompute', id: 'domesticChips', status: 'open' };
  s.promises.push(safety, president, presidentWithType);
  const cash = s.cash;
  const value = s.valuation;
  const staff = s.staffTrust;
  const event = EVENTS.find((candidate) => candidate.id === 'pledgeDrop');
  assert.equal(event.trigger(s), true);
  event.card.choices.find((choice) => choice.id === 'drop').effects(s);
  assert.equal(s.cash, cash + Math.round(value * 0.05));
  assert.equal(s.staffTrust, staff - 8);
  assert.equal(s.flags.safetyPledgeMade, true);
  assert.deepEqual(s.promises, [president, presidentWithType]);
});

test('the agent surge doubles serving demand', () => {
  const s = createInitialState();
  s.compute.online = 1000;
  s.models.push(kestrel());
  const base = updateServing(s);
  s.compute.surge = { mult: 2, turnsLeft: 2 };
  assert.ok(base > 0);
  assert.ok(Math.abs(updateServing(s) - 2 * base) < 1e-9);
});

test('the agent surge triggers only for a serving-active agentic model', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'agentSurge');
  const s = createInitialState();
  s.era = 3;
  s.models.push({ ...kestrel(), flags: ['agentic'], activeFromTurn: 1 });
  assert.equal(event.trigger(s), false);
  s.models[0].activeFromTurn = 0;
  s.models[0].active = false;
  assert.equal(event.trigger(s), false);
  s.models[0].active = true;
  assert.equal(event.trigger(s), true);
});

test('routing users to a cheaper model cuts usage: serving load and revenue both fall', () => {
  const s = createInitialState();
  s.compute.online = 1000;
  s.models.push(kestrel());
  const base = updateServing(s);
  const revenue = monthlyRevenue(s);
  EVENTS.find((e) => e.id === 'agentSurge').card.choices.find((c) => c.id === 'route').effects(s);
  const { mult, usage } = s.compute.surge;
  assert.ok(usage < 1);
  assert.ok(Math.abs(updateServing(s) - mult * usage * base) < 1e-9);
  assert.ok(Math.abs(monthlyRevenue(s) - usage * revenue) < 1e-9);
});

test('surge spot and cap choices restore the previous spot setting after two economy turns', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'agentSurge');
  const s = createInitialState();
  s.era = 3;
  s.turn = 8;
  s.compute.split.coverWithSpot = false;
  event.card.choices.find((choice) => choice.id === 'spot').effects(s);
  assert.equal(s.compute.split.coverWithSpot, true);
  assert.equal(s.compute.surge.restoreCover, false);
  s.seenEvents = EVENTS.filter((candidate) => candidate.kind === 'world').map((candidate) => candidate.id);

  const first = endTurn(s, {}, no);
  assert.equal(first.state.compute.surge.turnsLeft, 1);
  assert.equal(first.state.compute.split.coverWithSpot, true);
  const second = endTurn(first.state, {}, no);
  assert.equal(second.state.compute.surge, null);
  assert.equal(second.state.compute.split.coverWithSpot, false);

  const capped = createInitialState();
  capped.compute.split.coverWithSpot = true;
  event.card.choices.find((choice) => choice.id === 'cap').effects(capped);
  assert.equal(capped.compute.split.coverWithSpot, false);
  assert.equal(capped.compute.surge.restoreCover, true);
});

test('pooling takes a share of compute for US favor, decided before the summit', () => {
  const s = createInitialState();
  s.turn = 13; s.era = 4; s.turnInEra = 1;
  eventsTick(s, no);
  const gov = s.govFavor.us;
  resolveEvent(s, 'pooling', 'accept');
  assert.equal(s.govFavor.us, gov + 10);
  assert.equal(s.compute.online, 7);
  assert.equal(s.flags.pooled, true);
});

test('pooling bypasses a full card queue before era 5 opens', () => {
  const s = createInitialState();
  s.turn = 13;
  s.era = 4;
  s.turnInEra = 1;
  s.pendingEvents.push({ id: 'president' }, { id: 'investors' });
  s.seenEvents = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS]
    .filter((event) => event.id !== 'pooling')
    .map((event) => event.id);

  eventsTick(s, no);

  assert.equal(s.pendingEvents.some((event) => event.id === 'pooling'), true);
  assert.deepEqual(s.pendingEvents.slice(0, 2).map((event) => event.id), ['president', 'investors']);
});

test('pooling risk uses its compute side stream instead of the shared event RNG', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'pooling');
  const s = createInitialState({ seed: 15 });
  s.turn = 13;
  s.era = 4;
  s.turnInEra = 1;
  const sharedRng = { chance: () => assert.fail('pooling used the shared event RNG') };
  assert.equal(event.trigger(s, sharedRng), true);
  assert.equal(s.flags.poolingRisk, true);
});

test('refusing pooling applies the stored risk, while accepting improves summit stances', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'pooling');
  const refused = createInitialState({ seed: 15 });
  refused.turn = 13;
  refused.era = 4;
  refused.turnInEra = 1;
  assert.equal(event.trigger(refused, yes), true);
  assert.equal(refused.flags.poolingRisk, true);
  event.card.choices.find((choice) => choice.id === 'refuse').effects(refused);
  assert.equal(refused.govFavor.us, 42);
  assert.equal(refused.flags.supplyChainRisk, true);

  const plain = createInitialState();
  const pooled = createInitialState();
  plain.raceHeat = 50;
  pooled.raceHeat = 50;
  pooled.flags.pooled = true;
  const plan = { proposals: ['evaluators'], checks: { evaluators: 1 } };
  assert.equal(readTheRoom(plain, plan).evaluators.deepthink, 'maybe');
  assert.equal(readTheRoom(pooled, plan).evaluators.deepthink, 'yes');
});

test('the old data-center event is gone', async () => {
  const { EVENTS } = await import('../sim/data/events.js');
  assert.equal(EVENTS.some((e) => e.id === 'datacenter'), false);
});
