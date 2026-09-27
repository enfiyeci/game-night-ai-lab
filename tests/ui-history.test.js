import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENERIC_REACTIONS, REACTIONS } from '../sim/data/launch.js';
import { createInitialState } from '../sim/state.js';
import { activeModels } from '../sim/serving.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import {
  CONTROVERSY_HANDLES,
  HISTORY_CHANNEL_WORDS,
  HISTORY_PRICE_WORDS,
  NON_CRITICAL_REACTION_HANDLES,
  article,
  historyRows,
  labSummary,
  raceSeries,
} from '../ui/logic/history.js';
import { layoutRaceCards } from '../ui/screens/history.js';
import { storyDate } from '../sim/time.js';

test('every generated release reaction handle has an explicit editorial classification', () => {
  const critical = new Set(CONTROVERSY_HANDLES);
  const nonCritical = new Set(NON_CRITICAL_REACTION_HANDLES);
  assert.deepEqual([...critical].filter((handle) => nonCritical.has(handle)), []);
  const generated = [...new Set([...REACTIONS, ...GENERIC_REACTIONS].map((reaction) => reaction.handle))].sort();
  assert.deepEqual(generated.filter((handle) => !critical.has(handle) && !nonCritical.has(handle)), []);
  assert.deepEqual([...new Set([...critical, ...nonCritical])].sort(), generated);
});

test('history rows expose release details and public benchmark averages in release order', () => {
  // Expectations come from the scenario's own models, so a balance change does not break the test.
  const state = SCENARIOS.summit(5);
  const rows = historyRows(state);
  const eraNames = ['Chat assistants', 'The scale-up', 'Reasoning and agents', 'The gigawatt race', 'Self-improvement and pacing'];
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const capMean = (model, key) => mean(model.launch.benchmarks.filter((b) => b.kind === 'cap').map((b) => b[key]));
  assert.ok(rows.length >= 2);
  assert.deepEqual(rows.map((row) => row.name), state.models.map((model) => model.name));
  // Each era is four turns long.
  assert.deepEqual(rows.map((row) => row.era), state.models.map((model) => eraNames[Math.floor(model.releasedTurn / 4)]));
  assert.deepEqual(rows.map((row) => row.youAvg), state.models.map((model) => capMean(model, 'shown')));
  assert.deepEqual(rows.map((row) => row.rivalAvg), state.models.map((model) => capMean(model, 'rival')));
  assert.deepEqual(rows.map((row) => row.channelWords), state.models.map((model) => HISTORY_CHANNEL_WORDS[model.channel]));
  assert.deepEqual(rows.map((row) => row.priceWords), state.models.map((model) => HISTORY_PRICE_WORDS[model.priceStance]));
  assert.deepEqual(labSummary(rows), {
    released: state.models.length,
    bestPress: Math.max(...state.models.map((model) => model.launch.pressAvg)),
    biggestLaunch: Math.max(...state.models.map((model) => model.newUsers)),
    stillServing: activeModels(state).length,
  });
});

test('history rows use a model\'s recorded story release day when available', () => {
  const state = structuredClone(SCENARIOS.summit(5));
  state.models[0].releasedDay = 123;
  assert.equal(historyRows(state)[0].releasedDate, storyDate(123).label);
});

test('article lead uses the five public benchmark hand counts', () => {
  // Under the compute race plan (docs/superpowers/plans/2026-09-26-compute-race.md) Task 5, seed 4's latest model leads on four of five at launch; seed 5's leads on all five.
  const state = SCENARIOS.summit(5);
  const result = article(state, historyRows(state));
  const lead = result.lead.join('');
  assert.match(lead, /Kestrel 1 Core.*all five/);
  assert.match(lead, new RegExp(`${state.models.at(-1).name}.*all five`));
});

test('article controversies quote only criticism reactions that occurred', () => {
  const state = SCENARIOS.summit(5);
  const rows = historyRows(state);
  const result = article(state, rows);
  const text = result.controversies.filter((part) => typeof part === 'string').join('');
  const present = rows.flatMap((row) => row.reactions);
  const critical = new Set(CONTROVERSY_HANDLES);
  // The article quotes each critic once: their first critical post.
  const expected = present.filter((entry) => critical.has(entry.handle)
    && (entry.handle !== '@marketwire' || entry.text.includes('underwhelms; analysts question the spend')))
    .filter((entry, index, list) => list.findIndex((other) => other.handle === entry.handle) === index);
  assert.ok(expected.length > 0, 'the scenario should contain at least one critical reaction');
  for (const reaction of expected) assert.ok(text.includes(reaction.text), reaction.handle);
  const citedReactions = result.references.slice(2);
  assert.equal(citedReactions.length, expected.length);
  assert.ok(citedReactions.every((reference) => present.some((reaction) => reference.includes(reaction.text))));
  for (const reaction of present.filter((entry) => !critical.has(entry.handle))) assert.ok(!text.includes(reaction.text), reaction.handle);
});

test('article records rule-skipping and behavioural concerns as controversies', () => {
  const state = structuredClone(SCENARIOS.summit(5));
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
  const state = structuredClone(SCENARIOS.summit(5));
  for (const model of state.models) model.launch.reactions = [];
  const result = article(state, historyRows(state));
  assert.deepEqual(result.controversies, ['No controversies are recorded.']);
  assert.equal(result.references.length, 2);
});

test('player-entered lab markup remains an ordinary article string', () => {
  const state = SCENARIOS.summit(5);
  state.labName = '<b>Halcyon</b>';
  const result = article(state, historyRows(state));
  assert.ok(result.lead.some((part) => typeof part === 'string' && part.includes('<b>Halcyon</b>')));
  assert.equal(result.infobox.developer, '<b>Halcyon</b>');
});

test('article uses the latest family and lists earlier model families', () => {
  const state = SCENARIOS.summit(5);
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
  const rows = historyRows(SCENARIOS.summit(5));
  const series = raceSeries(rows, [
    { turn: 1, id: 'openbrain' },
    { turn: 4, id: 'qilin' },
    { turn: 7, id: 'openbrain' },
  ]);
  assert.deepEqual(series.you.map(({ turn, value }) => ({ turn, value })), rows.map((row) => ({ turn: row.releasedTurn, value: row.youAvg })));
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
  const scenarioGame = createGame({ seed: 4, state: SCENARIOS.summit(5) });
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
  game.endTurn();
  assert.equal(sawRelease, true);
});

test('history status follows what the sim serves: open weights and not-yet-online models are not serving', () => {
  const state = structuredClone(SCENARIOS.summit(5));
  const [first, second, third] = state.models;
  first.active = true; first.channel = 'open';
  second.active = true; second.activeFromTurn = state.turn + 2;
  third.active = false;
  const rows = historyRows(state);
  assert.deepEqual(rows.slice(0, 3).map((row) => [row.status, row.active]), [['open', false], ['upcoming', false], ['retired', false]]);
  assert.equal(labSummary(rows).stillServing, activeModels(state).length);
});

test('article table columns are headed by each benchmark row\'s job, since the named tests change with the era', () => {
  const state = SCENARIOS.summit(5);
  const result = article(state, historyRows(state));
  assert.deepEqual(result.table.benchmarks, ['Coding', 'Science', 'Agents', 'Final exam', 'Safety']);
});
