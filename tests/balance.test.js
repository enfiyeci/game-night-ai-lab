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

test('every strategy uses a player-selectable budget level', () => {
  for (const [name, strategy] of Object.entries(balanceApi.STRATEGIES)) {
    for (let era = 1; era <= 5; era++) {
      const state = createInitialState({ seed: 31 });
      state.era = era;
      const spend = strategy(state, createRng(31)).budget.spend;
      const multiplier = 1 + 0.5 * (era - 1);
      assert.ok([12, 20, 35].map((base) => base * multiplier).includes(spend), `${name} era ${era}: ${spend}`);
    }
  }
});

test('committed pipeline compute uses minimum LOI delivery and projected power', () => {
  const state = createInitialState();
  state.era = 4;
  state.compute.split.safety = 0;
  state.compute.pipeline = [{ supplier: 'verde', units: 1000, headline: 1000, dark: false }];
  assert.equal(balanceApi.committedFreeUnits(state), 10, 'unpowered pipeline is not usable');
  state.power.sites = [{ units: 100, online: false }];
  assert.equal(balanceApi.committedFreeUnits(state), 110, 'pipeline is capped by projected site power');
  state.power.sites[0].units = 1000;
  assert.equal(balanceApi.committedFreeUnits(state), 310, 'an LOI contributes its 30% minimum');
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

test('difficulty target: most runs of the extreme strategies end in eras 3 or 4', {
  todo: 'speed 200/200, safety 154/200 after the second ui merge (2026-09-26); the target holds, drop this todo in the balance pass; see docs/notes/later.md (balance)',
}, () => {
  for (const name of ['speed', 'safety']) {
    assert.ok(targetReport[name].diedInEra3or4 / 200 >= 0.5, `${name} ${targetReport[name].diedInEra3or4}/200`);
  }
});

test('the report measures the compute race', () => {
  const r = balanceApi.report(3);
  for (const [name, row] of Object.entries(r)) {
    assert.equal(typeof row.leftBehindByEra, 'object', name);
    assert.ok(row.roundsAtFirst >= 0 && row.roundsAtFirst <= 1, `${name}: ${row.roundsAtFirst}`);
    assert.ok(row.rivalDealsPerRun >= 0, name);
  }
});

test('the denier probe takes named cards; the safety bot never does; denying does not bankrupt the speed bot', () => {
  assert.ok(balanceApi.PROBES.includes('denier'));
  let denied = 0;
  let safetyDenied = 0;
  const speedBroke = [];
  for (const seed of [1, 2, 3]) {
    for (const [name, count] of [['denier', (n) => { denied += n; }], ['safety', (n) => { safetyDenied += n; }], ['speed', () => {}]]) {
      const rng = createRng(seed);
      let state = createInitialState({ seed });
      for (let turn = 0; turn < 12 && !state.ending; turn += 1) {
        const result = endTurn(state, balanceApi.STRATEGIES[name](state, rng), rng);
        count(result.events.filter((e) => e.type === 'deal' && e.denied).length);
        state = result.state;
      }
      if (name === 'speed' && state.ending === 'acquihire' && state.era === 2) speedBroke.push(seed);
    }
  }
  assert.ok(denied > 0);
  assert.equal(safetyDenied, 0);
  // Seeds 1 and 3 run out of money in era 2 even with the deny rule off; seed 2 did only because the bot kept denying.
  assert.ok(!speedBroke.includes(2), `speed out of money in era 2 on seeds ${speedBroke}`);
});
