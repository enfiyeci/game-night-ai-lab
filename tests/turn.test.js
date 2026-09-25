import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn, setBudget } from '../sim/turn.js';

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

test('only two moves per turn, and bad moves are reported', () => {
  const r = endTurn(createInitialState(), { moves: [{ type: 'deal', supplierId: 'coreflame' }, { type: 'deal', supplierId: 'coreflame' }, { type: 'deal', supplierId: 'coreflame' }] }, createRng(1));
  assert.ok(r.errors.some((e) => e.includes('2 moves')));
  assert.equal(r.events.filter((e) => e.type === 'deal').length, 2);
  const bad = endTurn(createInitialState(), { moves: [{ type: 'teleport' }] }, createRng(1));
  assert.ok(bad.errors.length > 0);
});

test('budget split must add up to one', () => {
  const s = createInitialState();
  assert.equal(setBudget(s, { spend: 20, split: { training: 0.5, safety: 0.5, security: 0.5, product: 0, talent: 0 } }).ok, false);
});

test('budget values must be finite and non-negative', () => {
  const valid = { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 };
  for (const spend of [NaN, Infinity, -1]) {
    assert.equal(setBudget(createInitialState(), { spend, split: valid }).ok, false);
  }
  for (const value of [NaN, Infinity, -0.1]) {
    const split = { ...valid, training: value, talent: 0.5 - value };
    assert.equal(setBudget(createInitialState(), { spend: 20, split }).ok, false);
  }
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
  const budget = { spend: 200, split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 } };
  const out = endTurn(s, { budget, moves: [{ type: 'emergency', option: 'bridgeRound' }] }, createRng(4));
  assert.equal(out.errors.length, 0);
  assert.equal(out.events.some((e) => e.type === 'emergency'), true);
});

test('conversion deadlines trigger once after the economy step', () => {
  const base = createInitialState();
  base.board = [50, 50, 50, 50, 50];
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
