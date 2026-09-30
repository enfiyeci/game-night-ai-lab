import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  for (const item of ITEMS) if (!item.divider && !item.hidden?.(state, game)) lines.push(item.label, `${item.unavailable?.(state, game) || ''}`);
  for (const line of lines) {
    assert.doesNotMatch(line, /\bera \d/i, line);
    for (const name of names) assert.equal(line.toLowerCase().includes(name), false, line);
  }
  assert.equal(ITEMS.some((item) => item.id === 'constitution'), false); // the constitution is a recipe card from era 3, not a menu item
});

test('a bounded finance projection stops at the visible planning horizon', async () => {
  const { defaultPlan, eraStart, project } = await import('../ui/logic/finance.js');
  const state = createInitialState({ seed: 1 });
  const until = eraStart(2);
  const projection = project(state, defaultPlan(state), { until });
  assert.equal(projection.rows.at(-1).turn, until);
  assert.equal(projection.rows.filter((row) => row.era > state.era).length, 1, 'Later is one generic planning row');
});

test('the planner UI does not expose the future calendar or future funding rounds', () => {
  const source = readFileSync(new URL('../ui/screens/finance.js', import.meta.url), 'utf8');
  const planner = source.match(/function showTimeline\(\)[\s\S]*?function showBooks\(\)/)[0];
  assert.match(source, /const planLabel = \(era\) => \(era === state\.era \? 'Current era' : 'Later'\)/);
  assert.match(source, /const rounds = state\.era >= 2 \? \[state\.era\] : \[\]/);
  assert.doesNotMatch(planner, /Plan the years ahead/);
  assert.doesNotMatch(planner, /`Year \$\{/);
});

test('the feature tour previews each core tool and explains where to find it', () => {
  const screens = TOUR.filter((step) => step.screen);
  assert.deepEqual(screens.map((step) => step.screen), [
    'finance', 'budget', 'deals', 'training', 'history', 'automation', 'research', 'raise', 'board',
  ]);
  for (const step of screens) {
    assert.ok(step.title);
    assert.match(step.path, /^Floor → /);
  }
  assert.ok(TOUR.some((step) => step.say.includes('Release a model')));
  assert.ok(TOUR.some((step) => step.say.includes('Geneva summit')));
});
