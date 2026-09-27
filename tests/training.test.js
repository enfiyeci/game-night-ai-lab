import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun, advanceRunBy, availableUnits, recheckCapacity, resolveRun } from '../sim/training.js';
import { recipeCost } from '../sim/recipe.js';

const noLuck = { next: () => 0.99, int: () => 0, chance: () => false, normal: (m) => m };
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'dpo', 'safety-tuning'] },
};

test('starting a run pays cash and reserves compute', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  const r = startRun(s, recipe);
  assert.equal(r.ok, true);
  assert.equal(s.cash, 1000 - 53);
  assert.equal(s.activeRun.units, 5);
  assert.equal(availableUnits(s), 5);
  assert.equal(startRun(s, recipe).ok, false); // one run at a time
});

test('a run fails to start without enough compute', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  s.compute.online = 3;
  assert.equal(startRun(s, recipe).ok, false);
});

test('a finished run produces a trained model with hidden effects applied', () => {
  const s = createInitialState();
  startRun(s, recipe);
  const trained = advanceRun(s, noLuck);
  // base 10 + filtered 3 + synthetic-sft 2 + dpo 2 = 17; talent 0.8 + 0.2 = 1.0; × (1 − 0.5 × 0.15)
  assert.ok(Math.abs(trained.gain - 15.725) < 1e-9);
  assert.ok(Math.abs(trained.capability - 35.725) < 1e-9);
  assert.equal(s.activeRun, null);
  assert.equal(s.pendingModel, trained);
  assert.equal(s.alignmentDebt, 7); // 5 + dpo 2 + zero from the safety-share term
  assert.equal(s.misuseExposure, 2); // 5 − 3
  assert.equal(s.legalCases.length, 1); // D4: filtered web data is always sued (was 0 when the dice said no)
  assert.equal(s.legalCases[0].cost, 120);
  assert.equal(trained.spec.arch, 'dense');
  assert.equal(trained.openWeightsMx, 20);
});

test('zero talent spend provides no talent multiplier bonus', () => {
  const s = createInitialState();
  s.budget.spend = 0;
  startRun(s, recipe);
  const trained = advanceRun(s, noLuck);
  assert.ok(Math.abs(trained.gain - 12.58) < 1e-9);
});

test('a run pauses without reserved compute and resumes when capacity returns', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  startRun(s, recipe);
  s.compute.online = 4;
  const turnsLeft = s.activeRun.turnsLeft;
  s.activeRun.spikeRisk = 0.1; // as a risky card would give
  assert.deepEqual(advanceRun(s), { type: 'runPaused' });
  assert.equal(s.activeRun.turnsLeft, turnsLeft);
  assert.equal(s.activeRun.spikes, 0); // a paused run has not advanced, so its spike has not landed yet
  s.compute.online = 10;
  assert.ok(advanceRun(s).capability > 0);
});

test('training capacity holds for the round unless a player action rechecks it', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  startRun(s, recipe);
  const initial = s.activeRun.turnsLeft;

  advanceRunBy(s, noLuck, 0.25);
  s.compute.online = 4; // organic change mid-round: the round's check stands
  assert.equal(advanceRunBy(s, noLuck, 0.25), null);
  recheckCapacity(s); // a player action: the next day sees the new capacity
  assert.deepEqual(advanceRunBy(s, noLuck, 0.25), { type: 'runPaused' });
  s.compute.online = 10;
  recheckCapacity(s);
  assert.equal(advanceRunBy(s, noLuck, 0.25), null);
  assert.equal(s.activeRun.turnsLeft, initial - 0.75);
});

test('low alignment share adds alignment debt; a spike costs gain; web-crawl data is sued', () => {
  const s = createInitialState();
  const r2 = { ...recipe, sliders: { ...recipe.sliders, alignShare: 0 } };
  startRun(s, r2);
  s.activeRun.spikeRisk = 0.1; // a risky recipe meets its one spike (was: dice that always landed)
  const trained = advanceRun(s);
  // gain 17 × 1.0 × 1 × (1 − 0.2 × 1 spike) = 13.6; debt += 13.6 × 0.15 × 2 + 2
  assert.ok(Math.abs(trained.gain - 13.6) < 1e-9);
  assert.ok(Math.abs(s.alignmentDebt - (5 + 13.6 * 0.3 + 2)) < 1e-9);
  assert.equal(s.legalCases.length, 1);
  assert.equal(s.legalCases[0].dueTurn, 8);
});

test('trained model capability and gain keep counting past 100', () => {
  const s = createInitialState();
  s.capability = 95;
  startRun(s, recipe);
  const trained = advanceRun(s, noLuck);
  assert.ok(Math.abs(trained.gain - 15.725) < 1e-9);
  assert.ok(Math.abs(trained.capability - 110.725) < 1e-9);
});

test('standard agent techniques mark era 4 models as agentic', () => {
  const s = createInitialState();
  s.era = 4;
  s.compute.split.safety = 0;
  s.compute.online = recipeCost(s, recipe).units + 10;
  startRun(s, recipe);
  const trained = advanceRun(s, noLuck);
  assert.ok(trained.flags.includes('agentic'));
});

// A run just started with the given pre-training cards (the recipe above otherwise). Scraping is the default data
// card: it applies when no data card is picked, so it is left out of the picks. Mixture-of-experts and synthetic data
// are researched, and a past model exists, so their cards can be picked.
function startedRunState(pre) {
  const s = createInitialState();
  s.compute.split.safety = 0;
  s.researched.push('moe', 'synthetic');
  s.models.push({});
  const r = startRun(s, { ...recipe, picks: { ...recipe.picks, pre: pre.filter((id) => id !== 'scrape-data') } });
  assert.equal(r.ok, true, r.error);
  return s;
}

test('a risky card without stability meets one loss spike on the first advance, and no more', () => {
  const s = startedRunState(['moe']);
  s.activeRun.turnsLeft = 3;
  advanceRunBy(s, null, 0.25);
  assert.equal(s.activeRun.spikes, 1);
  advanceRunBy(s, null, 1);
  assert.equal(s.activeRun.spikes, 1);
  s.activeRun.spikes = 0; // a rollback answer takes the spike back; it does not come again
  advanceRunBy(s, null, 1);
  assert.equal(s.activeRun.spikes, 0);
  const model = advanceRunBy(s, null, 1);
  assert.equal(model.spikes, 0);
});

test('stability engineering cancels mixture-of-experts: no loss spike', () => {
  const s = startedRunState(['moe', 'stability']);
  const model = advanceRunBy(s, null, 1);
  assert.equal(model.spikes, 0);
});

test('a plain recipe meets no loss spike', () => {
  const s = startedRunState(['filtered-data']);
  const model = advanceRunBy(s, null, 1);
  assert.equal(model.spikes, 0);
});

test('web-crawl data is always sued at full cost; licensed and synthetic data never', () => {
  const s = startedRunState(['scrape-data']);
  const before = s.legalCases.length;
  resolveRun(s, s.activeRun);
  assert.equal(s.legalCases.length, before + 1);
  assert.equal(s.legalCases.at(-1).cost, 200);
  for (const card of ['licensed-data', 'synthetic-data']) {
    const clean = startedRunState([card]);
    const cases = clean.legalCases.length;
    resolveRun(clean, clean.activeRun);
    assert.equal(clean.legalCases.length, cases, card);
  }
});
