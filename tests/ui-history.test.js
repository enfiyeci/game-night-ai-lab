import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REACTIONS } from '../sim/data/launch.js';
import { createInitialState } from '../sim/state.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import {
  CONTROVERSY_HANDLES,
  NON_CRITICAL_REACTION_HANDLES,
  article,
  historyRows,
  labSummary,
  raceSeries,
} from '../ui/logic/history.js';
import { layoutRaceCards } from '../ui/screens/history.js';

test('every generated release reaction handle has an explicit editorial classification', () => {
  const critical = new Set(CONTROVERSY_HANDLES);
  const nonCritical = new Set(NON_CRITICAL_REACTION_HANDLES);
  assert.deepEqual([...critical].filter((handle) => nonCritical.has(handle)), []);
  const generated = [...new Set(REACTIONS.map((reaction) => reaction.handle))].sort();
  assert.deepEqual(generated.filter((handle) => !critical.has(handle) && !nonCritical.has(handle)), []);
  assert.deepEqual([...new Set([...critical, ...nonCritical])].sort(), generated);
});

test('history rows expose release details and public benchmark averages in release order', () => {
  const rows = historyRows(SCENARIOS.summit(4));
  assert.deepEqual(rows.map((row) => row.name), [
    'Kestrel 1 Core',
    'Kestrel 2 Core',
    'Kestrel 3 Swift',
    'Kestrel 4 Core',
  ]);
  assert.deepEqual(rows.map((row) => row.era), [
    'Chat assistants',
    'The scale-up',
    'Reasoning and agents',
    'The gigawatt race',
  ]);
  assert.deepEqual(rows.map((row) => row.youAvg), [22.25, 40.75, 56.5, 74.75]);
  assert.deepEqual(rows.map((row) => row.rivalAvg), [23, 37, 47.75, 67.25]);
  assert.equal(rows[0].channelWords, 'API');
  assert.equal(rows[0].priceWords, 'Cheap');
  assert.equal(rows[1].priceWords, 'Market price');
  assert.deepEqual(labSummary(rows), {
    released: 4,
    bestPress: 10,
    biggestLaunch: 1875000,
    stillServing: 1,
  });
});

test('article lead uses the five public benchmark hand counts', () => {
  const state = SCENARIOS.summit(4);
  const result = article(state, historyRows(state));
  const lead = result.lead.join('');
  assert.match(lead, /Kestrel 1 Core.*two of five/);
  assert.match(lead, /Kestrel 4 Core.*all five/);
});

test('article controversies quote only criticism reactions that occurred', () => {
  const state = SCENARIOS.summit(4);
  const rows = historyRows(state);
  const result = article(state, rows);
  const text = result.controversies.filter((part) => typeof part === 'string').join('');
  const present = rows.flatMap((row) => row.reactions);
  const expectedHandles = ['@ml_hobbyist', '@pm_everywhere', '@skeptic_sam', '@benchwatch', '@lawyer_lena'];
  for (const handle of expectedHandles) {
    const reaction = present.find((entry) => entry.handle === handle);
    assert.ok(text.includes(reaction.text), handle);
  }
  const citedReactions = result.references.slice(2);
  assert.equal(citedReactions.length, expectedHandles.length);
  assert.ok(citedReactions.every((reference) => present.some((reaction) => reference.includes(reaction.text))));
  assert.ok(!text.includes('tops the leaderboards'));
});

test('article records rule-skipping and behavioural concerns as controversies', () => {
  const state = structuredClone(SCENARIOS.summit(4));
  state.models[0].launch.reactions = [
    { handle: '@devnull_ops', text: 'already found a way to make it skip its rules lol' },
    { handle: '@tired_parent', text: "it's so nice to talk to. maybe too nice?" },
    { handle: '@marketwire', text: 'Kestrel underwhelms; analysts question the spend' },
  ];
  for (const model of state.models.slice(1)) model.launch.reactions = [];
  const result = article(state, historyRows(state));
  const text = result.controversies.filter((part) => typeof part === 'string').join('');
  assert.match(text, /skip its rules/);
  assert.match(text, /maybe too nice/);
  assert.match(text, /underwhelms/);
});

test('article records no controversy when model reactions contain none', () => {
  const state = structuredClone(SCENARIOS.summit(4));
  for (const model of state.models) model.launch.reactions = [];
  const result = article(state, historyRows(state));
  assert.deepEqual(result.controversies, ['No controversies are recorded.']);
  assert.equal(result.references.length, 2);
});

test('player-entered lab markup remains an ordinary article string', () => {
  const state = SCENARIOS.summit(4);
  state.labName = '<b>Halcyon</b>';
  const result = article(state, historyRows(state));
  assert.ok(result.lead.some((part) => typeof part === 'string' && part.includes('<b>Halcyon</b>')));
  assert.equal(result.infobox.developer, '<b>Halcyon</b>');
});

test('article uses the latest family and lists earlier model families', () => {
  const state = SCENARIOS.summit(4);
  state.models.at(-1).family = 'Halcyon';
  const result = article(state, historyRows(state));
  assert.equal(result.title, 'Halcyon (language model)');
  assert.match(result.lead.join(''), /earlier models.*Kestrel/);
});

test('article is a stub before the first model is released', () => {
  const state = createInitialState();
  assert.deepEqual(article(state, historyRows(state)), { title: 'Your lab', stub: true });
});

test('race series places rival release ticks into their lab rows', () => {
  const rows = historyRows(SCENARIOS.summit(4));
  const series = raceSeries(rows, [
    { turn: 1, id: 'openbrain' },
    { turn: 4, id: 'qilin' },
    { turn: 7, id: 'openbrain' },
  ]);
  assert.deepEqual(series.you.map(({ turn, value }) => ({ turn, value })), [
    { turn: 2, value: 22.25 },
    { turn: 6, value: 40.75 },
    { turn: 9, value: 56.5 },
    { turn: 12, value: 74.75 },
  ]);
  assert.deepEqual(series.ticks, [
    { id: 'openbrain', name: 'OpenBrain', turns: [1, 7] },
    { id: 'lodestar', name: 'Lodestar', turns: [] },
    { id: 'deepthink', name: 'DeepThink', turns: [] },
    { id: 'qilin', name: 'Qilin', turns: [4] },
  ]);
});

test('race cards alternate rows when minimum-gap releases would overlap', () => {
  const noOverlap = (layout, width = 1280) => {
    for (const row of [0, 1]) {
      const cards = layout.cards.filter((card) => card.row === row);
      for (const card of cards) assert.ok(card.left >= 0 && card.left + card.width <= width, JSON.stringify(card));
      for (let index = 1; index < cards.length; index += 1) {
        assert.ok(cards[index].left >= cards[index - 1].left + cards[index - 1].width + 8, JSON.stringify(cards));
      }
    }
  };
  // Consecutive-turn releases (about 58px apart), a full run of them, and a late cluster at the right edge.
  const step = (1280 - 110 - 16) / 20;
  const at = (turns) => turns.map((turn) => 110 + turn * step);
  noOverlap(layoutRaceCards(at([1, 2, 3])));
  noOverlap(layoutRaceCards(at(Array.from({ length: 19 }, (_, i) => i + 1))));
  noOverlap(layoutRaceCards(at([15, 16, 17, 18, 19])));
  noOverlap(layoutRaceCards(at([1, 4, 7, 10, 13, 14, 15, 16, 17, 18, 19])));
  const layout = layoutRaceCards([100, 217, 334, 451]);
  assert.deepEqual(layout.cards.map((card) => card.row), [0, 1, 0, 1]);
  assert.equal(layout.rowsUsed, 2);
  for (const row of [0, 1]) {
    const cards = layout.cards.filter((card) => card.row === row);
    for (let index = 1; index < cards.length; index += 1) {
      assert.ok(cards[index].left >= cards[index - 1].left + 164 + 8);
    }
  }
});

test('game logs rival releases with the pre-advance turn over multiple turns', () => {
  const scenarioGame = createGame({ seed: 4, state: SCENARIOS.summit(4) });
  assert.deepEqual(scenarioGame.rivalReleases, []);

  const game = createGame({ seed: 4 });
  const expected = [];
  for (let turn = 0; turn < 2; turn += 1) {
    const result = game.endTurn();
    expected.push(...result.events
      .filter((event) => event.type === 'rivalRelease')
      .map((event) => ({ turn, id: event.id })));
  }
  assert.deepEqual(game.rivalReleases, expected);
  const copy = game.rivalReleases;
  copy.push({ turn: 99, id: 'openbrain' });
  assert.deepEqual(game.rivalReleases, expected);
});

test('endTurn subscribers see the rival release log after it is updated', () => {
  const game = createGame({ seed: 4 });
  const expected = [];
  let turn = 0;
  let sawRelease = false;
  game.subscribe(({ events }) => {
    const releases = events
      .filter((event) => event.type === 'rivalRelease')
      .map((event) => ({ turn, id: event.id }));
    expected.push(...releases);
    sawRelease ||= releases.length > 0;
    assert.deepEqual(game.rivalReleases, expected);
    turn += 1;
  });
  game.endTurn();
  game.endTurn();
  assert.equal(sawRelease, true);
});
