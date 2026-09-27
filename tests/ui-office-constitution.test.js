import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../sim/state.js';
import { constitutionOnWall } from '../ui/logic/office.js';

test('the era 2 office has no constitution on the wall; eras 3-5 keep it as a hideable group', () => {
  assert.doesNotMatch(readFileSync('ui/assets/office-era2.svg', 'utf8'), /Constitution/);
  for (const era of [3, 4, 5]) {
    assert.match(readFileSync(`ui/assets/office-era${era}.svg`, 'utf8'), /<g class="office-constitution">/, `era ${era}`);
  }
});

test('the constitution goes up in era 3, once a draft is adopted or a model has learned one', () => {
  const state = createInitialState();
  state.era = 2;
  state.constitution.version = 1;
  assert.equal(constitutionOnWall(state), false, 'never before era 3');
  state.era = 3;
  state.constitution.version = 0;
  assert.equal(constitutionOnWall(state), false, 'not before the constitution section');
  state.constitutionDraft = { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: {}, changes: [] };
  assert.equal(constitutionOnWall(state), true, 'an adopted draft');
  state.constitutionDraft = null;
  state.constitution.version = 2;
  assert.equal(constitutionOnWall(state), true, 'a learned constitution');
});
