import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS } from '../sim/endings.js';
import { archiveModel } from '../ui/logic/archive.js';

// Owner pick 7C: the endings collection as The Daily Token's archive, one front page per ending.
test('every ending gets a front page, wins first, and an empty collection prints none', () => {
  const model = archiveModel([]);
  assert.equal(model.pages.length, Object.keys(ENDINGS).length);
  assert.deepEqual(new Set(model.pages.map((page) => page.id)), new Set(Object.keys(ENDINGS)));
  const kinds = model.pages.map((page) => page.kind);
  assert.equal(kinds.lastIndexOf('win') < kinds.indexOf('fail'), true, 'wins come before failures');
  assert.equal(model.found, 0);
  assert.equal(model.total, 11);
  assert.equal(model.printed, '0 of 11 front pages printed');
  assert.equal(model.toPrint, '11 front pages still to print');
  for (const page of model.pages) {
    assert.equal(page.found, false);
    assert.ok(page.hint.length > 0, `${page.id} has a hint`);
  }
});

test('a found ending prints its headline, era, model and how often it was found', () => {
  const model = archiveModel([
    { id: 'misalignment', era: 4, model: 'Kestrel 5', count: 2 },
    { id: 'aligned', era: 5, model: null, count: 1 },
  ]);
  const page = model.pages.find((candidate) => candidate.id === 'misalignment');
  assert.equal(page.found, true);
  assert.equal(page.title, ENDINGS.misalignment.title);
  assert.equal(page.dateline, 'Era 4 · Kestrel 5');
  assert.equal(page.times, 'Found twice');
  assert.equal(page.still, 'ui/assets/endings/stills/misalignment.jpg');
  const aligned = model.pages.find((candidate) => candidate.id === 'aligned');
  assert.equal(aligned.dateline, 'Era 5');
  assert.equal(aligned.times, 'Found once');
  assert.equal(model.printed, '2 of 11 front pages printed');
  assert.equal(model.toPrint, '9 front pages still to print');
});

test('the last tile counts down to one page, then goes away', () => {
  const ids = Object.keys(ENDINGS);
  const entries = (n) => ids.slice(0, n).map((id) => ({ id, era: 5, model: 'Kestrel 7', count: 3 }));
  assert.equal(archiveModel(entries(10)).toPrint, '1 front page still to print');
  assert.equal(archiveModel(entries(11)).toPrint, '');
  assert.equal(archiveModel(entries(11)).pages[0].times, 'Found 3 times');
});
