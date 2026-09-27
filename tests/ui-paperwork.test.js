import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMERGENCY_OPTIONS } from '../sim/economy.js';
import { noteText, pointsBar, usedLabel } from '../ui/logic/paperwork.js';

// Owner pick 5C: raise, research and emergency drawn as the paperwork they would be.
test('an emergency note keeps the sim wording after the option name', () => {
  assert.equal(noteText(EMERGENCY_OPTIONS.equityForCompute), 'Cash and cheap capacity now, less independence later.');
  assert.equal(noteText(EMERGENCY_OPTIONS.acquihire), 'A tech giant licenses your models and hires your team. The run ends.');
  assert.equal(noteText('No name here.'), 'No name here.');
});

test('the points bar fills toward the cost and says what is left or missing', () => {
  assert.deepEqual(pointsBar(16, 30), { fill: 16 / 30, label: '16 of 30 research points', rest: 'Needs 14 more' });
  assert.deepEqual(pointsBar(52.4, 40), { fill: 1, label: '52 of 40 research points', rest: '12 left after this' });
  assert.deepEqual(pointsBar(40, 40), { fill: 1, label: '40 of 40 research points', rest: '0 left after this' });

  // Events can push the balance below zero; the bar stays empty rather than full.
  assert.equal(pointsBar(-12, 30).fill, 0);
  assert.equal(pointsBar(-12, 30).rest, 'Needs 42 more');
  // Fractional points just short of the cost must not read as affordable.
  assert.deepEqual(pointsBar(29.6, 30), { fill: 29.6 / 30, label: '29 of 30 research points', rest: 'Needs 1 more' });
});

test('the folder tab counts the last resorts used', () => {
  assert.equal(usedLabel(0, 4), 'Last resorts · 0 of 4 used');
  assert.equal(usedLabel(2, 4), 'Last resorts · 2 of 4 used');
});
