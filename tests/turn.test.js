import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn, setBudget } from '../sim/turn.js';
import { startRun } from '../sim/training.js';
import { BALANCE } from '../sim/balance.js';
import { INITIAL_BOARD, seat } from '../sim/board.js';

const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const release = { picks: ['eval-full', 'channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };

function script(state) {
  if (state.pendingModel) return { moves: [{ type: 'release', release: { ...release, generation: state.models.length + 1 } }] };
  if (!state.activeRun) return { moves: [{ type: 'startRun', recipe }] };
  return {};
}

test('endTurn does not mutate its input', () => {
  const s = createInitialState();
  const copy = structuredClone(s);
  endTurn(s, { moves: [{ type: 'startRun', recipe }] }, createRng(1));
  assert.deepEqual(s, copy);
});

test('train then release across two turns', () => {
  const rng = createRng(5);
  let { state } = endTurn(createInitialState(), { moves: [{ type: 'startRun', recipe }] }, rng);
  assert.ok(state.pendingModel);
  ({ state } = endTurn(state, { moves: [{ type: 'release', release }] }, rng));
  assert.equal(state.models.length, 1);
  assert.equal(state.turn, 2);
});

test('a successful release records the current story day', () => {
  const rng = createRng(5);
  let state = endTurn(createInitialState(), { moves: [{ type: 'startRun', recipe }] }, rng).state;
  const releasedDay = state.day;
  state = endTurn(state, { moves: [{ type: 'release', release }] }, rng).state;
  assert.equal(state.models.at(-1).releasedDay, releasedDay);
});

test('a release valuation gain is measured from the start-of-turn board baseline', () => {
  const rng = createRng(19);
  let { state } = endTurn(createInitialState(), { moves: [{ type: 'startRun', recipe }] }, rng);
  const before = state.board[seat('financier')];
  const valuation = state.valuation;
  ({ state } = endTurn(state, { moves: [{ type: 'release', release }] }, rng));
  assert.ok(state.valuation > valuation);
  assert.equal(state.board[seat('financier')], before + 2);
});

test('only two actions per round, and bad moves are reported', () => {
  const s = createInitialState();
  const coreflame = s.compute.offers.find((offer) => offer.supplier === 'coreflame');
  const azuria = s.compute.offers.find((offer) => offer.supplier === 'azuria');
  const r = endTurn(s, { moves: [{ type: 'deal', offerId: coreflame.id }, { type: 'deal', offerId: azuria.id }, { type: 'deal', offerId: coreflame.id }] }, createRng(1));
  assert.ok(r.errors.some((e) => e.includes('2 actions per round')));
  assert.equal(r.events.filter((e) => e.type === 'deal').length, 2);
  const bad = endTurn(createInitialState(), { moves: [{ type: 'teleport' }] }, createRng(1));
  assert.ok(bad.errors.length > 0);
});

test('budget split must add up to one', () => {
  const s = createInitialState();
  assert.equal(setBudget(s, { spend: 20, split: { training: 1, security: 0.5, product: 0, talent: 0 } }).ok, false);
});

test('budget values must be finite and non-negative', () => {
  const valid = { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 };
  for (const spend of [NaN, Infinity, -1]) {
    assert.equal(setBudget(createInitialState(), { spend, split: valid }).ok, false);
  }
  for (const value of [NaN, Infinity, -0.1]) {
    const split = { ...valid, training: value, talent: 0.5 - value };
    assert.equal(setBudget(createInitialState(), { spend: 20, split }).ok, false);
  }
});

test('the money budget rejects unknown split keys', () => {
  const s = createInitialState();
  const result = setBudget(s, { spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2, bonus: 0 } });
  assert.equal(result.ok, false);
  assert.match(result.error, /bonus/);
});

test('endTurn rejects falsy non-object compute splits', () => {
  for (const computeSplit of [null, 0]) {
    const result = endTurn(createInitialState(), { computeSplit }, createRng(23));
    assert.ok(result.errors.some((error) => error.includes('compute split must be an object')));
  }
});

test('queue withdrawal accepts only booleans and withdraws only on true', () => {
  const makeState = () => {
    const s = createInitialState();
    s.era = 3;
    s.turn = 8;
    s.cash = 0;
    s.compute.queue = { order: null, carry: { units: 10, tier: 'standard' }, last: null };
    return s;
  };
  const moves = [{ type: 'emergency', option: 'acquihire' }];
  const invalid = endTurn(makeState(), { queueWithdraw: 'yes', moves }, createRng(23));
  assert.ok(invalid.errors.some((error) => error.includes('queueWithdraw')));
  assert.ok(invalid.state.compute.queue.carry);
  const skipped = endTurn(makeState(), { queueWithdraw: false, moves }, createRng(23));
  assert.deepEqual(skipped.errors, []);
  assert.ok(skipped.state.compute.queue.carry);
  const withdrawn = endTurn(makeState(), { queueWithdraw: true, moves }, createRng(23));
  assert.deepEqual(withdrawn.errors, []);
  assert.equal(withdrawn.state.compute.queue.carry, null);
});

test('serving load reflects user growth from the same turn', () => {
  const s = createInitialState();
  s.compute.online = 100;
  s.models.push({
    active: true,
    activated: true,
    activeFromTurn: 0,
    channel: 'consumer',
    priceStance: 'market',
    users: 1e6,
    userCap: 4e6,
    servingCost: 0,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const { state } = endTurn(s, {}, createRng(3));
  assert.equal(state.models[0].users, 1.128e6);
  assert.ok(Math.abs(state.compute.servingUnits - 1.128e6 * 2.4 / 1.46e6) < 1e-9);
});

test('a new budget updates emergency eligibility before moves', () => {
  const s = createInitialState();
  s.cash = 100;
  const budget = { spend: 200, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } };
  const out = endTurn(s, { budget, moves: [{ type: 'emergency', option: 'bridgeRound' }] }, createRng(4));
  assert.equal(out.errors.length, 0);
  assert.equal(out.events.some((e) => e.type === 'emergency'), true);
});

test('a same-turn compute deal refreshes burn before a later emergency move', () => {
  const s = createInitialState();
  s.cash = 310;
  const spot = s.compute.offers.find((offer) => offer.supplier === 'spot');
  const out = endTurn(s, {
    moves: [
      { type: 'deal', offerId: spot.id },
      { type: 'emergency', option: 'bridgeRound' },
    ],
  }, createRng(14));
  assert.equal(out.errors.length, 0);
  assert.deepEqual(out.events.slice(0, 2).map((e) => e.type), ['deal', 'emergency']);
});

test('the economy observer sees the burn and compute billed after same-turn actions', () => {
  const s = createInitialState();
  const spot = s.compute.offers.find((offer) => offer.supplier === 'spot');
  let sample;
  const out = endTurn(s, {
    budget: { spend: 35, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } },
    moves: [{ type: 'deal', offerId: spot.id }],
  }, createRng(24), { beforeEconomy: (value) => { sample = value; } });
  assert.deepEqual(out.errors, []);
  assert.equal(sample.burn, out.state.burnHistory.at(-1));
  assert.equal(sample.compute, (10 + spot.units * spot.price) * BALANCE.unitMonthlyCost);
});

test('a same-turn training run does not inflate serving burn for a later emergency move', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  s.models.push({
    active: true,
    activated: true,
    activeFromTurn: 0,
    channel: 'consumer',
    priceStance: 'market',
    users: 9e6,
    userCap: 1e8,
    servingCost: 0,
    spec: { size: 'medium', arch: 'moe', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const smallRecipe = { ...recipe, sliders: { ...recipe.sliders, size: 'small' } };
  // The run costs $35M up front, but serving keeps the same capacity and burn.
  // With $300M left, runway remains just over six months and the emergency stays closed.
  s.cash = 300 + 35;
  const out = endTurn(s, {
    moves: [
      { type: 'startRun', recipe: smallRecipe },
      { type: 'emergency', option: 'bridgeRound' },
    ],
  }, createRng(17));
  assert.ok(out.errors.includes('emergency options open only when runway is short'));
  assert.equal(out.events.some((event) => event.type === 'emergency'), false);
});

test('using a rescue extends insolvency grace for the current turn only', () => {
  const s = createInitialState();
  s.cash = -100;
  s.burnPlanned = 50;
  s.flags.insolvent = true;
  let out = endTurn(s, { moves: [{ type: 'emergency', option: 'bridgeRound' }] }, createRng(15));
  assert.equal(out.state.ending, null);
  assert.equal(out.state.flags.insolvent, true);
  assert.equal(out.events.some((e) => e.type === 'emergency'), true);
  out = endTurn(out.state, {}, createRng(16));
  assert.equal(out.state.ending, 'acquihire');
});

test('conversion deadlines trigger once after the economy step', () => {
  const base = createInitialState();
  base.board = INITIAL_BOARD.map(() => 50);
  const due = structuredClone(base);
  due.flags.conversionDeadline = 0;
  const control = endTurn(base, {}, createRng(9)).state;
  const out = endTurn(due, {}, createRng(9));
  assert.equal(out.state.flags.converted, true);
  assert.equal(out.events.some((e) => e.type === 'conversionFight'), true);
  assert.equal(out.state.publicTrust, control.publicTrust - 4);
  assert.equal(out.state.staffTrust, control.staffTrust - 6);
  assert.ok(out.state.board.every((support, i) => support <= control.board[i] - 6));
  const next = endTurn(out.state, {}, createRng(10));
  assert.equal(next.events.some((e) => e.type === 'conversionFight'), false);
});

test('endTurn activates due releases before growing users', () => {
  const s = createInitialState();
  const spec = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' };
  s.models.push(
    { active: true, activated: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market', users: 2e6, userCap: 8e6, servingCost: 0, spec },
    { active: true, activated: false, activeFromTurn: 0, channel: 'consumer', priceStance: 'market', users: 1e6, userCap: 4e6, servingCost: 0, spec },
  );
  const { state } = endTurn(s, {}, createRng(11));
  assert.equal(state.models[0].active, false);
  assert.equal(state.models[0].users, 0);
  assert.equal(state.models[1].activated, true);
  assert.equal(state.models[1].users, 2.256e6);
});

test('a due release consumes serving compute before move validation', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  s.models.push({
    active: true,
    activated: false,
    activeFromTurn: 0,
    channel: 'consumer',
    priceStance: 'market',
    users: 4e6,
    userCap: 16e6,
    servingCost: 0,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const out = endTurn(s, { moves: [{ type: 'startRun', recipe }] }, createRng(17));
  assert.equal(out.state.activeRun, null);
  assert.ok(out.errors.includes('not enough free compute'));
  assert.ok(out.state.compute.servingUnits > 5);
});

test('a quiet takeover stops training and event generation for the turn', () => {
  const s = createInitialState();
  s.era = 3;
  s.turn = 1;
  s.compute.online = 60;
  startRun(s, recipe);
  s.activeRun.turnsLeft = 1;
  s.era = 4;
  s.automation.stage = 3; s.capability = 80;
  s.alignmentDebt = 100;
  s.automation.pressure = 1; // the running total reaches 1 this round (A3: no dice, running total)
  s.models.push({
    active: true,
    activated: true,
    activeFromTurn: 0,
    channel: 'consumer',
    flags: ['sycophancy'],
    users: 1e6,
    userCap: 4e6,
    priceStance: 'market',
    servingCost: 0,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  s.warnings.flattery = { turn: 0 };
  const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (values) => values[0], normal: (mean) => mean };

  const out = endTurn(s, {}, hit);

  assert.equal(out.state.ending, 'quietTakeover');
  assert.ok(out.state.activeRun);
  assert.equal(out.state.pendingModel, null);
  assert.equal(out.state.pendingEvents.length, 0);
  assert.equal(out.events.some((event) => event.type === 'runComplete'), false);
});

test('a card made on the final round mark is dropped, never shown after the ending', () => {
  const s = createInitialState();
  s.era = 5;
  s.turn = 19;
  s.turnInEra = 3;
  s.capability = 100;
  s.warnings.jailbreak = { turn: 18 };
  s.models.push({
    active: true,
    activated: true,
    activeFromTurn: 0,
    channel: 'consumer',
    flags: ['jailbreakWaiting'],
    users: 1e6,
    userCap: 4e6,
    priceStance: 'market',
    servingCost: 0,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const out = endTurn(s, {}, createRng(1));
  assert.ok(out.state.ending);
  assert.equal(out.state.pendingEvents.some((event) => event.id === 'jailbreak'), false);
  assert.ok(out.state.pendingEvents.every((event) => event.landsAt != null));
});

test('the board sees event choices from the start-of-turn snapshot', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'president' });
  const out = endTurn(s, { eventChoices: { president: 'refuse' } }, createRng(22));
  assert.equal(out.state.govFavor.us, 42);
  // the hawk sees both the fall in US favor (-2) and the low level it ends at (-2)
  assert.equal(out.state.board[seat('security')], s.board[seat('security')] - 4);
});

test('endTurn emits a pause event when a run has lost reserved compute', () => {
  const s = createInitialState();
  startRun(s, recipe);
  const turnsLeft = s.activeRun.turnsLeft;
  s.compute.contracts = [];
  s.compute.online = 0;
  const out = endTurn(s, {}, createRng(20));
  assert.equal(out.state.activeRun.turnsLeft, turnsLeft);
  assert.equal(out.events.some((event) => event.type === 'runPaused'), true);
});

test('terminal moves normalize bounded state before advisor history is recorded', () => {
  const s = createInitialState();
  s.cash = 0;
  s.alignmentDebt = 150;
  s.misuseExposure = 140;
  s.misuseLocked = 130;
  s.security = -10;
  s.raceHeat = 125;
  s.publicTrust = 140;
  s.staffTrust = -20;
  s.perceivedAdOffset = 130;
  s.govFavor = { us: -10, intl: 120 };
  const out = endTurn(s, { moves: [{ type: 'emergency', option: 'acquihire' }] }, createRng(21));
  assert.equal(out.state.ending, 'acquihire');
  for (const value of [
    out.state.alignmentDebt, out.state.misuseExposure, out.state.misuseLocked,
    out.state.security, out.state.raceHeat, out.state.publicTrust, out.state.staffTrust,
    out.state.perceivedAdOffset, out.state.govFavor.us, out.state.govFavor.intl,
  ]) assert.ok(value >= 0 && value <= 100);
  const safety = out.state.advisorHistory.at(-1).readings.find((reading) => reading.id === 'safety');
  assert.equal(safety.truth, 100);
});

test('eras advance every four turns and time accelerates', () => {
  let state = createInitialState();
  const rng = createRng(2);
  for (let i = 0; i < 4; i++) ({ state } = endTurn(state, {}, rng));
  assert.equal(state.ending, null);
  assert.equal(state.era, 2);
  assert.equal(state.monthsElapsed, 12);
});

test('later eras use their accelerated turn lengths', () => {
  const eraThree = createInitialState();
  eraThree.era = 3;
  const afterThree = endTurn(eraThree, {}, createRng(12)).state;
  assert.equal(afterThree.monthsElapsed, 1);

  const eraFive = createInitialState();
  eraFive.era = 5;
  const afterFive = endTurn(eraFive, {}, createRng(13)).state;
  assert.equal(afterFive.monthsElapsed, 0.25);
});

test('an insolvent lab cannot win at the era 5 finale', () => {
  const s = createInitialState();
  s.era = 5;
  s.turnInEra = 3;
  s.capability = 100;
  s.cash = 1;
  const { state } = endTurn(s, {}, createRng(18));
  assert.equal(state.cash <= 0, true);
  assert.equal(state.flags.insolvent, true);
  assert.equal(state.ending, 'acquihire');
});

test('a full run is deterministic for a seed and always ends', () => {
  const play = (seed) => {
    const rng = createRng(seed);
    let state = createInitialState({ seed });
    for (let i = 0; i < 30 && !state.ending; i++) ({ state } = endTurn(state, script(state), rng));
    return state;
  };
  const a = play(7);
  const b = play(7);
  assert.deepEqual(a, b);
  assert.ok(a.ending);
  assert.ok(a.turn <= 20);
});

test('a card set aside before the ending is cleared when the run ends', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'lossSpike', title: 't', post: { handle: '@x', text: 'y' }, choices: [], targets: [], landsAt: 0, dueAt: 999 });
  s.cash = -1e6;
  s.flags.insolvent = true;
  let out = { state: s };
  for (let i = 0; i < 30 && !out.state.ending; i += 1) out = endTurn(out.state, {}, createRng(2));
  assert.ok(out.state.ending);
  assert.deepEqual(out.state.pendingEvents, []);
});

test('a delayed release goes live at the round mark with no player action', async () => {
  const { SCENARIOS } = await import('../ui/logic/scenarios.js');
  const { releaseDraft, releasePayload } = await import('../ui/logic/release.js');
  const { applyActions, advanceDays } = await import('../sim/turn.js');
  const rng = createRng(1);
  const ready = SCENARIOS.readyToRelease(1);
  const draft = { ...releaseDraft(ready), family: 'Kestrel', picks: ['eval-third'] };
  const acted = applyActions(ready, { moves: [{ type: 'release', release: releasePayload(ready, draft) }] }, rng);
  const model = acted.state.models.at(-1);
  assert.equal(model.activated, false, 'an outside evaluation delays the launch');
  const launches = (state) => state.feed.filter((post) => post.tag === 'launch').length;
  assert.equal(launches(acted.state), launches(ready), 'no launch posts before it ships');
  let out = { state: acted.state, events: [] };
  const events = [];
  for (let i = 0; i < 200 && !out.state.models.at(-1).activated && !out.state.ending; i += 1) {
    out = advanceDays(out.state, 1, rng);
    events.push(...out.events);
  }
  assert.equal(out.state.models.at(-1).activated, true);
  const live = events.find((event) => event.type === 'modelLive');
  assert.ok(live);
  const scheduled = (state) => [...state.feed, ...(state.feedQueue ?? [])].filter((post) => post.tag === 'launch').length;
  assert.ok(scheduled(out.state) > launches(ready), 'its launch posts appear when it ships');
});
