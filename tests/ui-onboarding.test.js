import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { familyName, needsFamilyName, workingName, cleanFamily } from '../ui/logic/naming.js';
import { TOUR, TOUR_SEEN_KEY, isFreshStart, markTourSeen, tourSeen } from '../ui/logic/intro.js';
import { project } from '../ui/logic/format.js';
import { releaseDraft } from '../ui/logic/release.js';
import { ITEMS } from '../ui/menu.js';
import { ERAS } from '../sim/data/eras.js';

const run = { recipe: { sliders: { size: 'medium', length: 'optimal', alignShare: 0.4 }, picks: { pre: [], mid: [], post: [] } }, turnsLeft: 2 };

test('a new lab has no family name until the player types one', () => {
  const state = createInitialState({ seed: 1 });
  assert.equal(familyName(state), '');
  assert.equal(needsFamilyName(state), true);
  state.modelFamily = '  Aurora  ';
  assert.equal(familyName(state), 'Aurora');
  assert.equal(needsFamilyName(state), false);
});

test('the latest release family wins over the name typed before the first run', () => {
  const state = createInitialState({ seed: 1 });
  state.modelFamily = 'Aurora';
  state.models.push({ family: 'Borealis', generation: 1 });
  assert.equal(familyName(state), 'Borealis');
  assert.equal(workingName(state, 'small').startsWith('Borealis 2 '), true);
});

test('the typed name is trimmed and capped at 24 characters', () => {
  assert.equal(cleanFamily('  x'.padEnd(40, 'y')).length, 24);
  assert.equal(cleanFamily(42), '');
});

test('the top bar and the release dialog use the typed name, not a placeholder', () => {
  const state = createInitialState({ seed: 1 });
  state.modelFamily = 'Aurora';
  state.activeRun = run;
  assert.match(project(state).name, /^Aurora 1 /);
  assert.equal(releaseDraft(state).family, 'Aurora');
});

test('the tour runs on a fresh normal start only', () => {
  const state = createInitialState({ seed: 1 });
  assert.equal(isFreshStart(state), true);
  assert.equal(isFreshStart(state, { scenario: 'midEra3' }), false);
  assert.equal(isFreshStart(state, { hash: '#menu' }), false);
  assert.equal(isFreshStart({ ...state, day: 5 }), false);
});

test('the tour remembers it was seen, and survives blocked storage', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(tourSeen(storage), false);
  markTourSeen(storage);
  assert.equal(values.get(TOUR_SEEN_KEY), '1');
  assert.equal(tourSeen(storage), true);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(tourSeen(blocked), false);
  assert.doesNotThrow(() => markTourSeen(blocked));
});

test('the tour visits each advisor and ends on the floor', () => {
  assert.deepEqual(new Set(TOUR.map((step) => step.who)), new Set(['research', 'safety', 'cfo', 'policy']));
  assert.equal(TOUR.at(-1).point, 'floor');
});

test('no tour line and no era-1 menu reason names an era', () => {
  const names = ERAS.map((era) => era.name.toLowerCase());
  const state = createInitialState({ seed: 1 });
  const game = { state, queue: { moves: [] }, movesLeft: () => 2 };
  const lines = [...TOUR.map((step) => step.say)];
  for (const item of ITEMS) if (!item.hidden?.(state, game)) lines.push(item.label, `${item.unavailable?.(state, game) || ''}`);
  for (const line of lines) {
    assert.doesNotMatch(line, /\bera \d/i, line);
    for (const name of names) assert.equal(line.toLowerCase().includes(name), false, line);
  }
  assert.equal(ITEMS.find((item) => item.id === 'constitution').hidden(state), true);
});

test('the finance planner calls a later era by the month it starts, never by its number or name', async () => {
  const { eraLabel, eraTitle, eraEndWords } = await import('../ui/logic/finance.js');
  const state = createInitialState({ seed: 1 });
  assert.equal(eraLabel(state, 1), 'Era 1');
  assert.equal(eraTitle(state, 1), ERAS[0].name);
  assert.equal(eraLabel(state, 2), 'From Jan 2024'); // the HUD clock's date for era 2's first day
  assert.equal(eraTitle(state, 2), '');
  assert.equal(eraEndWords(state, 1), 'the end of era 1');
  assert.doesNotMatch(eraEndWords(state, 3), /era/i);
  assert.notEqual(eraLabel(state, 4), eraLabel(state, 5)); // eras 3 to 5 all start in year 3
});
