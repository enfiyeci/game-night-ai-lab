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

test('eras advance every four turns and time accelerates', () => {
  let state = createInitialState();
  const rng = createRng(2);
  for (let i = 0; i < 4; i++) ({ state } = endTurn(state, script(state), rng));
  if (!state.ending) {
    assert.equal(state.era, 2);
    assert.equal(state.monthsElapsed, 12);
  }
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
