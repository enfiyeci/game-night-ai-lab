import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as balanceApi from '../tools/balance.js';
import { ENDINGS } from '../sim/endings.js';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';

const targetReport = balanceApi.report(200);

test('every strategy finishes every run with a known ending', () => {
  const report = balanceApi.runBalance(3);
  for (const [name, r] of Object.entries(report)) {
    const total = Object.values(r.endings).reduce((a, b) => a + b, 0);
    assert.equal(total, 3, name);
    for (const id of Object.keys(r.endings)) assert.ok(ENDINGS[id], `${name}: ${id}`);
  }
});

test('runs are reproducible', () => {
  assert.equal(typeof balanceApi.simulate, 'function');
  assert.deepEqual(balanceApi.simulate('random', 4), balanceApi.simulate('random', 4));
});

test('every strategy sends only accepted actions', () => {
  for (const [name, strategy] of Object.entries(balanceApi.STRATEGIES)) {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = createRng(seed);
      let state = createInitialState({ seed });
      while (!state.ending && state.turn < 30) {
        const turn = state.turn;
        const result = endTurn(state, strategy(state, rng), rng);
        assert.deepEqual(result.errors, [], `${name} seed ${seed} turn ${turn}: ${result.errors.join('; ')}`);
        state = result.state;
      }
    }
  }
});

test('strategy planning refreshes burn before checking emergency funding', () => {
  const state = createInitialState({ seed: 91 });
  state.era = 2;
  state.turn = 4;
  state.cash = 100;
  state.arr = 0;
  state.burnPlanned = 1;
  const actions = balanceApi.STRATEGIES.safety(state, createRng(91));
  assert.ok(actions.moves.some((move) => move.type === 'raise'));
});

test('difficulty target: no scripted strategy wins more than about a third of runs', () => {
  for (const [name, row] of Object.entries(targetReport)) {
    if (balanceApi.PROBES.includes(name)) continue;
    const wins = ['aligned', 'pacingDeal', 'pyrrhic'].reduce((sum, id) => sum + (row.endings[id] ?? 0), 0);
    assert.ok(wins / 200 <= 0.36, `${name} wins ${wins}/200`);
  }
});

test('difficulty target: most runs of the extreme strategies end in eras 3 or 4', () => {
  for (const name of ['speed', 'safety']) {
    assert.ok(targetReport[name].diedInEra3or4 / 200 >= 0.5, `${name} ${targetReport[name].diedInEra3or4}/200`);
  }
});
