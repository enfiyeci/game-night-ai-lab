import { enableScenarios } from '../sim/scenarios.js';
import { playRound } from '../tools/play-round.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { STRATEGIES, eventChoices, dailyRelease } from '../tools/balance.js';
import { generateOffers, contractsTurn, deliverDue, expireContracts } from '../sim/contracts.js';
import { SUPPLIERS, eraScale } from '../sim/data/compute.js';
const NO_DICE = new Proxy({}, { get: (_, key) => () => { throw new Error(`outcome drew ${String(key)}`); } });
for (const name of ['speed', 'safety', 'balanced', 'careful', 'random']) {
  test(`${name}: a whole run draws no outcome dice`, () => {
    for (const seed of [1, 2, 3]) {
      const choices = createRng(seed);
      let state = enableScenarios(createInitialState({ seed }));
      for (let i = 0; i < 30 && !state.ending; i++) {
        const result = playRound(state, STRATEGIES[name](state, choices), NO_DICE, current => eventChoices(current, name, choices), { dailyActions: current => dailyRelease(name, current) });
        assert.deepEqual(result.errors, []);
        state = result.state;
      }
      assert.ok(state.ending);
    }
  });
}
test('starting state is identical across seeds', () => {
  const a = createInitialState({ seed: 1 });
  const b = createInitialState({ seed: 99 });
  delete a.seed; delete b.seed;
  assert.deepEqual(a, b);
});
test('supplier allocation follows rank, and terms use heat and elapsed months', () => {
  const s = createInitialState();
  for (const rival of s.rivals) rival.capability = 0;
  assert.equal(generateOffers(s, NO_DICE).find(o => o.supplier === 'coreflame').units, SUPPLIERS.coreflame.size[1] * eraScale(1));
  for (const rival of s.rivals) rival.capability = 100;
  assert.equal(generateOffers(s, NO_DICE).find(o => o.supplier === 'coreflame').units, SUPPLIERS.coreflame.size[0] * eraScale(1));
  s.era = 3;
  s.compute.contracts = [{ supplier: 'coreflame', arrivedTurn: 0, monthsLeft: 24 }, { supplier: 'spot', arrivedTurn: 0, bumpTurn: null }];
  s.raceHeat = 54;
  for (let month = 1; month <= 10; month++) {
    expireContracts(s, 1);
    assert.equal(contractsTurn(s, NO_DICE).warnedBump, false);
  }
  assert.ok(!s.compute.contracts[0].troubled);
  expireContracts(s, 1);
  s.raceHeat = 55;
  assert.equal(contractsTurn(s, NO_DICE).warnedBump, true);
  assert.equal(s.compute.contracts[0].troubled, true);
});
test('letters of intent deliver powered capacity with a 30 percent floor', () => {
  for (const [power, expected] of [[0,30],[70,70],[150,100]]) {
    const s = createInitialState(); s.era = 4;
    s.power.sites = [{ units: power, online: true }];
    s.compute.pipeline = [{ id: 'loi', supplier: 'verde', units: 100, headline: 100, arrivesTurn: 0, price: 1, termMonths: 12 }];
    deliverDue(s, NO_DICE);
    assert.equal(s.compute.contracts.find(c=>c.id === 'loi').units, expected);
  }
});
