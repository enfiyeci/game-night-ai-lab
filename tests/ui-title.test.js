import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS } from '../sim/endings.js';
import { NAME_MAX, cleanLabName, titleShows, wallModel } from '../ui/logic/title.js';

test('the front door shows on a plain visit and stays out of debug links and finished runs', () => {
  assert.equal(titleShows({ search: '', hash: '' }), true);
  assert.equal(titleShows({ search: '?seed=4', hash: '' }), true);
  assert.equal(titleShows({ search: '?lab=Halcyon', hash: '' }), true);
  assert.equal(titleShows({ search: '?scenario=start&seed=1', hash: '' }), false);
  assert.equal(titleShows({ search: '?notitle', hash: '' }), false);
  assert.equal(titleShows({ search: '', hash: '#finance' }), false);
  assert.equal(titleShows({ search: '', hash: '', ending: 'aligned' }), false);
});

test('a typed lab name is trimmed and capped; a blank one keeps the default', () => {
  assert.equal(cleanLabName('  Northlight  '), 'Northlight');
  assert.equal(cleanLabName('   '), null);
  assert.equal(cleanLabName(undefined), null);
  assert.equal(cleanLabName('x'.repeat(40)).length, NAME_MAX);
  assert.equal(cleanLabName(`${'a'.repeat(NAME_MAX - 1)}  tail`), 'a'.repeat(NAME_MAX - 1));
});

test('the endings wall lists every ending once, found ones marked, with the unwritten count in words', () => {
  const total = Object.keys(ENDINGS).length;
  const empty = wallModel([]);
  assert.equal(empty.tiles.length, total);
  assert.deepEqual(empty.tiles.map((tile) => tile.id), Object.keys(ENDINGS));
  assert.equal(empty.found, 0);
  assert.equal(empty.note, 'Eleven stories are still unwritten');

  const some = wallModel([{ id: 'aligned', count: 2 }, { id: 'boardRemoved', count: 1 }, { id: 'nonsense', count: 1 }]);
  assert.equal(some.found, 2);
  assert.deepEqual(some.tiles.filter((tile) => tile.found).map((tile) => [tile.id, tile.kind]), [['boardRemoved', 'A failure'], ['aligned', 'A win']]);
  assert.equal(some.note, 'Nine stories are still unwritten');

  const allButOne = wallModel(Object.keys(ENDINGS).slice(1).map((id) => ({ id, count: 1 })));
  assert.equal(allButOne.note, 'One story is still unwritten');
  assert.equal(wallModel(Object.keys(ENDINGS).map((id) => ({ id, count: 1 }))).note, 'You have found every ending');
});

test('every ending has a still for the wall', async () => {
  const { existsSync } = await import('node:fs');
  for (const id of Object.keys(ENDINGS)) assert.ok(existsSync(new URL(`../ui/assets/endings/stills/${id}.jpg`, import.meta.url)), id);
});
