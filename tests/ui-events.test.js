import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import * as COPY from '../ui/data/eventCopy.js';
import {
  argueLines, cardView, catalogRow, consequenceLines, daysLeft, dueText, formatStoryTime,
  hasLanded, jokeFor, lookIntoCost, openWarnings, queueAnswer, queueLookInto, timingFor,
} from '../ui/logic/events.js';
import { DEFAULT_EVENT_TIMING, EVENT_TIMING } from '../sim/data/eventTiming.js';

const ALL = [...EVENTS, ...EVENTS_6C];
const pendingOf = (id) => {
  const row = ALL.find((event) => event.id === id);
  return { id, title: row.card.title, post: row.card.post, choices: row.card.choices.map(({ id: c, label, cost, backers, opposers }) => ({ id: c, label, cost, backers, opposers })) };
};

test('every warning row has an owning advisor', () => {
  const withWarning = ALL.filter((event) => event.warning).map((event) => event.id).sort();
  assert.deepEqual(Object.keys(COPY.WARNING_ADVISOR).sort(), withWarning);
  for (const role of Object.values(COPY.WARNING_ADVISOR)) assert.ok(['research', 'safety', 'cfo', 'policy'].includes(role));
  assert.equal(COPY.WARNING_ADVISOR.flattery, 'safety');
  assert.equal(COPY.WARNING_ADVISOR.whistleblower, 'policy');
});

test('open warnings read the catalog text and skip deferred and queued ones', () => {
  const state = SCENARIOS.event(10);
  state.warnings = { neocloudTrouble: { turn: 1 }, flattery: { turn: 1, deferred: true }, jailbreak: { turn: 1 } };
  const items = openWarnings(state, ['jailbreak']);
  assert.deepEqual(items.map((item) => item.id), ['neocloudTrouble']);
  assert.equal(items[0].advisor, 'cfo');
  assert.equal(items[0].handle, '@marketwire');
  assert.match(items[0].text, /missed a payment/);
  assert.equal(lookIntoCost(state), 5 * state.era);
});

test('a card view marks exactly one fallback choice and flags crises', () => {
  const jailbreak = cardView(pendingOf('jailbreak'));
  assert.deepEqual(jailbreak.choices.filter((c) => c.fallback).map((c) => c.id), ['deny']);
  assert.equal(jailbreak.crisis, false);
  const theft = cardView(pendingOf('weightTheft'));
  assert.equal(theft.crisis, true);
  assert.equal(theft.staging.room, 'theft');
  assert.equal(cardView(pendingOf('agentwreck')).choices.find((c) => c.id === 'blame').cost, 'nothing up front');
  assert.equal(catalogRow('promiseCall:2').id, 'promiseCall');
});

test('argue lines use written lines, stay silent where marked, and fall back to backer tags', () => {
  const theft = argueLines(cardView(pendingOf('weightTheft')));
  assert.deepEqual(theft.map((line) => line.role), ['cfo', 'policy']); // a card with written lines uses only those
  assert.equal(theft.find((line) => line.role === 'policy').pick, 'Say nothing');
  const quits = argueLines(cardView(pendingOf('safetyQuits')));
  assert.ok(!quits.some((line) => line.role === 'safety'));
  const flattery = argueLines(cardView(pendingOf('flattery')));
  assert.deepEqual(flattery.find((line) => line.role === 'safety'), { role: 'safety', say: 'My vote: roll it back.', pick: 'Roll it back' });
  assert.ok(flattery.length <= 3);
});

test('deadlines come from the sim\'s story days and read in story words', () => {
  assert.equal(daysLeft({ landsAt: 10, dueAt: 24 }, { day: 12 }), 12);
  assert.equal(daysLeft({ landsAt: 10, dueAt: 24 }, { day: 30 }), 0);
  assert.equal(daysLeft({}, { turn: 3 }), null);
  assert.equal(hasLanded({ landsAt: 10 }, { day: 9 }), false);
  assert.equal(hasLanded({ landsAt: 10 }, { day: 10 }), true);
  assert.equal(hasLanded({}, { turn: 3 }), true);
  assert.equal(formatStoryTime(0.4), 'less than a day');
  assert.equal(formatStoryTime(1), '1 day');
  assert.equal(formatStoryTime(9), '9 days');
  assert.equal(formatStoryTime(21), 'about 3 weeks');
  assert.equal(formatStoryTime(90), 'about 3 months');
  assert.equal(dueText('whistleblower', 9), 'The story runs in 9 days');
  assert.equal(dueText('investors', 21), 'Answer within about 3 weeks');
  assert.equal(timingFor('investors').days, DEFAULT_EVENT_TIMING.days);
  assert.equal(timingFor('weightTheft').days, 14);
});

test('the sim timing table names real cards with a known class', () => {
  for (const [id, timing] of Object.entries(EVENT_TIMING)) {
    assert.ok(ALL.some((event) => event.id === id), id);
    assert.ok(['short', 'normal', 'long'].includes(timing.class), id);
    assert.ok(Number.isInteger(timing.days) && timing.days > 0, id);
  }
});

test('consequence lines tell answered and ignored cards', () => {
  const before = [cardView(pendingOf('investors')), cardView(pendingOf('flattery')), cardView(pendingOf('viralDemo'))];
  const lines = consequenceLines({
    before,
    answered: { investors: 'refuse' },
    events: [{ type: 'eventResolved', id: 'flattery', choiceId: 'defend', auto: true }],
  });
  assert.equal(lines.length, 2);
  assert.equal(lines[0].head, 'Handled');
  assert.equal(lines[0].ok, true);
  assert.equal(lines[1].head, 'Nobody answered');
  assert.ok(lines[1].text.length > 0);
});

test('every card choice has a drafted consequence line', () => {
  for (const row of ALL) {
    for (const choice of row.card.choices) {
      const line = COPY.CONSEQUENCES[row.id]?.[choice.id];
      assert.equal(typeof line, 'string', `${row.id}.${choice.id}`);
      assert.ok(line.length >= 20 && line.length <= 180, `${row.id}.${choice.id} length`);
      assert.doesNotMatch(line, /\d+\s*%|\bdebt\b|\btrust\b|\bfavou?r\b|\bheat\b/i, `${row.id}.${choice.id} names a hidden number or meter`);
    }
  }
});

test('queue helpers merge instead of replacing', () => {
  // Turn mode (no answerCard): answers wait in the queue, so helpers must merge, not replace.
  const queue = { eventChoices: {}, addressWarnings: [] };
  const game = { queue, setField(key, value) { queue[key] = value; return { ok: true }; } };
  queueAnswer(game, 'a', 'x');
  queueAnswer(game, 'b', 'y');
  assert.deepEqual(game.queue.eventChoices, { a: 'x', b: 'y' });
  queueLookInto(game, 'neocloudTrouble');
  queueLookInto(game, 'neocloudTrouble');
  assert.deepEqual(game.queue.addressWarnings, ['neocloudTrouble']);
});

test('answers go straight to the game when it can apply them at once', () => {
  const calls = [];
  const realtime = { answerCard: (id, choiceId) => { calls.push([id, choiceId]); return { ok: true }; } };
  assert.deepEqual(queueAnswer(realtime, 'investors', 'refuse'), { ok: true });
  assert.deepEqual(calls, [['investors', 'refuse']]);
});

test('jokes are optional per advisor and band', () => {
  assert.equal(typeof jokeFor('cfo', 'alarmed', 0), 'string');
  assert.equal(jokeFor('nobody', 'calm', 0), null);
});

test('the copy file never talks about turns', () => {
  const strings = [];
  const walk = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(COPY);
  for (const text of strings) assert.doesNotMatch(text, /\bturns?\b/i, text);
});
