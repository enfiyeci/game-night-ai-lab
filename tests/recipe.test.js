import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { techAvailable, researchTechnique, standardTechniques } from '../sim/techniques.js';
import { validateRecipe, recipeCost, slotsFor, resolveCards } from '../sim/recipe.js';

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
  assert.equal(recipeCost(s, recipe).units, 10.4);
});

test('talent spend adds a slot', () => {
  const s = createInitialState();
  s.budget.split = { training: 0.25, safety: 0.2, security: 0.1, product: 0.15, talent: 0.3 };
  assert.equal(slotsFor(s, 'pre'), 3);
});

test('a talent share adds no slot when actual talent spend is zero', () => {
  const s = createInitialState();
  s.budget = { spend: 0, split: { training: 0, safety: 0, security: 0, product: 0, talent: 1 } };
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
