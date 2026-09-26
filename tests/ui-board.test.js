import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moodForLean, portrait } from '../ui/components/portraits.js';

test('board copy never uses time-step words', () => {
  const text = readFileSync(new URL('../ui/data/boardCopy.js', import.meta.url), 'utf8');
  assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm, ''), /\b(turns?|moves?|rounds?)\b/i);
});

test('portraits draw every director and moods map from leans', () => {
  for (const id of ['growth', 'financier', 'sovereign', 'safety', 'candor', 'security', 'trustee', 'ceo']) assert.match(portrait(id), /^<svg/);
  assert.equal(moodForLean('with'), 'happy');
  assert.equal(moodForLean('against'), 'cross');
});
