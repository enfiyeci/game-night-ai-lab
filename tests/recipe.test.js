import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { techAvailable, researchTechnique, standardTechniques } from '../sim/techniques.js';
import { validateRecipe, recipeCost, slotsFor, resolveCards } from '../sim/recipe.js';
import { eraScale } from '../sim/data/compute.js';

const eraOneRecipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'dpo', 'safety-tuning'] },
};

test('a valid era 1 recipe and its cost', () => {
  const s = createInitialState();
  assert.deepEqual(validateRecipe(s, eraOneRecipe), { ok: true, errors: [] });
  assert.deepEqual(recipeCost(s, eraOneRecipe), { cash: 53, units: 5, turns: 1 });
});

test('slot limits, one card per group, and locks', () => {
  const s = createInitialState();
  const tooMany = { ...eraOneRecipe, picks: { ...eraOneRecipe.picks, pre: ['filtered-data', 'stability', 'hazard-filter-reuse'] } };
  assert.equal(validateRecipe(s, tooMany).ok, false);
  const sameGroup = { ...eraOneRecipe, picks: { ...eraOneRecipe.picks, pre: ['filtered-data', 'licensed-data'] } };
  assert.equal(validateRecipe(s, sameGroup).ok, false);
  const locked = { ...eraOneRecipe, picks: { ...eraOneRecipe.picks, pre: ['moe'] } };
  assert.equal(validateRecipe(s, locked).ok, false);
  const xl = { ...eraOneRecipe, sliders: { ...eraOneRecipe.sliders, size: 'xl' } };
  assert.equal(validateRecipe(s, xl).ok, false);
});

test('recipe enum values must be own table entries', () => {
  const s = createInitialState();
  const badLength = { ...eraOneRecipe, sliders: { ...eraOneRecipe.sliders, length: 'constructor' } };
  const badSize = { ...eraOneRecipe, sliders: { ...eraOneRecipe.sliders, size: 'constructor' } };
  assert.equal(validateRecipe(s, badLength).ok, false);
  assert.equal(validateRecipe(s, badSize).ok, false);
});

test('hazard-filter reuse requires a previously released model', () => {
  const s = createInitialState();
  const filterRecipe = { ...eraOneRecipe, picks: { ...eraOneRecipe.picks, pre: ['hazard-filter-reuse'] } };
  assert.equal(validateRecipe(s, filterRecipe).ok, false);
  s.models.push({});
  assert.equal(validateRecipe(s, filterRecipe).ok, true);
});

test('midtraining opens in era 2 and compute multipliers stack', () => {
  const s = createInitialState();
  assert.equal(slotsFor(s, 'mid'), 0);
  s.era = 2;
  assert.equal(slotsFor(s, 'mid'), 2);
  const recipe = { sliders: { size: 'large', length: 'optimal', alignShare: 0.2 }, picks: { pre: ['moe'], mid: ['soup'], post: [] } };
  assert.equal(validateRecipe(s, recipe).ok, true);
  assert.equal(recipeCost(s, recipe).units, Math.round(10.4 * eraScale(2) * 10) / 10);
});

test('talent spend adds a slot', () => {
  const s = createInitialState();
  s.budget.split = { training: 0.45, security: 0.1, product: 0.15, talent: 0.3 };
  assert.equal(slotsFor(s, 'pre'), 3);
});

test('a talent share adds no slot when actual talent spend is zero', () => {
  const s = createInitialState();
  s.budget = { spend: 0, split: { training: 0, security: 0, product: 0, talent: 1 } };
  assert.equal(slotsFor(s, 'pre'), 2);
});

test('unpicked groups fall back to their default card', () => {
  const s = createInitialState();
  const ids = resolveCards(s, 'pre', ['stability']).map((c) => c.id);
  assert.ok(ids.includes('scrape-data'));
  const post = resolveCards(s, 'post', []).map((c) => c.id);
  assert.ok(post.includes('no-safeguards'));
});

test('techniques arrive by era and can be researched one era early', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(techAvailable(s, 'cot'), false);
  s.researchPoints = 50;
  assert.equal(researchTechnique(s, 'cot').ok, true);
  assert.equal(techAvailable(s, 'cot'), true);
  assert.equal(s.researchPoints, 10);
  s.era = 1;
  assert.equal(researchTechnique(s, 'agents').ok, false);
  s.era = 3;
  assert.deepEqual(standardTechniques(s).map((t) => t.id), ['cot']);
});

test('focus sliders are neutral at the start split and when absent', async () => {
  const { focusEffects } = await import('../sim/recipe.js');
  const { FOCUS } = await import('../sim/data/recipeFocus.js');
  const s = createInitialState();
  s.era = 2;
  const start = Object.fromEntries(Object.entries(FOCUS).map(([stage, sliders]) => [stage, sliders.map((slider) => slider.start)]));
  const neutral = { cap: 0, readiness: 0, spike: 0, mx: 0 };
  const clean = (effects) => Object.fromEntries(Object.entries(effects).map(([key, value]) => [key, Math.abs(value) < 1e-12 ? 0 : value]));
  assert.deepEqual(clean(focusEffects(s, eraOneRecipe)), neutral);
  assert.deepEqual(clean(focusEffects(s, { ...eraOneRecipe, focus: start })), neutral);
  // Doubling every weight keeps the same shares.
  const doubled = Object.fromEntries(Object.entries(start).map(([stage, values]) => [stage, values.map((value) => value * 2 > 100 ? 100 : value * 2)]));
  doubled.post = [60, 20, 20];
  assert.equal(validateRecipe(s, { ...eraOneRecipe, sliders: { ...eraOneRecipe.sliders, alignShare: 0.2 }, focus: doubled }).ok, true);
});

test('focus sliders trade capability against readiness, misuse and spikes', async () => {
  const { focusEffects } = await import('../sim/recipe.js');
  const s = createInitialState();
  const webHeavy = focusEffects(s, { ...eraOneRecipe, focus: { pre: [100, 0, 0] } });
  const cleanHeavy = focusEffects(s, { ...eraOneRecipe, focus: { pre: [0, 0, 100] } });
  assert.ok(webHeavy.cap > 0 && webHeavy.readiness < 0 && webHeavy.mx > 0);
  assert.ok(cleanHeavy.cap < 0 && cleanHeavy.spike < 0 && cleanHeavy.mx < 0);
  const redHeavy = focusEffects(s, { ...eraOneRecipe, focus: { post: [0, 0, 100] } });
  assert.ok(redHeavy.mx < 0 && redHeavy.cap < 0);
  // Midtraining sliders do nothing before midtraining opens.
  assert.deepEqual(focusEffects(s, { ...eraOneRecipe, focus: { mid: [100, 0, 0] } }).cap, 0);
});

test('invalid focus sliders fail validation', () => {
  const s = createInitialState();
  for (const pre of [[0, 0, 0], [50, 50], [-1, 50, 50], [50, 50, Number.NaN], [150, 0, 0]]) {
    assert.equal(validateRecipe(s, { ...eraOneRecipe, focus: { pre } }).ok, false, `${pre}`);
  }
});

test('focus validation rejects sparse arrays, a mismatched alignment share and closed-stage focus', () => {
  const s = createInitialState();
  const sparse = [50, 50, 50];
  delete sparse[1];
  assert.equal(validateRecipe(s, { ...eraOneRecipe, focus: { pre: sparse } }).ok, false);
  const post = { ...eraOneRecipe, focus: { post: [20, 70, 10] } };
  assert.equal(validateRecipe(s, post).ok, false); // alignShare 0.15 but Values says 0.5
  assert.equal(validateRecipe(s, { ...post, sliders: { ...post.sliders, alignShare: 0.5 } }).ok, true);
  assert.equal(validateRecipe(s, { ...eraOneRecipe, focus: { mid: [40, 30, 30] } }).ok, false);
});

test('focus effects are fixed when the run starts', async () => {
  const { startRun } = await import('../sim/training.js');
  const s = createInitialState();
  s.compute.online = 50;
  const result = startRun(s, { ...eraOneRecipe, focus: { pre: [100, 0, 0] } });
  assert.equal(result.ok, true, result.error);
  assert.ok(s.activeRun.focus.cap > 0);
});
