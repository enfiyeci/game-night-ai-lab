import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { PROMISES } from '../sim/data/promises.js';
import { MEETINGS } from '../sim/data/president.js';
import { createPresidentPromise, promiseUpkeep } from '../sim/promises.js';
import { runMeeting } from '../sim/president.js';
import { addressWarning, eventsTick, resolveEvent } from '../sim/events.js';
import { signDeal } from '../sim/compute.js';
import { endTurn } from '../sim/turn.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const meeting = (id) => MEETINGS.find((entry) => entry.id === id);
const answerIds = (id, styles) => meeting(id).exchanges.map((exchange, index) =>
  exchange.answers.find((answer) => answer.style === styles[index]).id);
const presidentPromise = (id, overrides = {}) => ({
  source: 'president',
  id,
  text: PROMISES[id].text,
  meeting: 'first',
  madeTurn: 1,
  dueTurn: 5,
  status: 'open',
  stalled: false,
  leaked: false,
  ...overrides,
});

function failedCall(id = 'beatRivals', overrides = {}) {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(presidentPromise(id, overrides));
  promiseUpkeep(state, no);
  eventsTick(state, no);
  return state;
}

test('meetings record President promise ids once with the required due turns', () => {
  const first = createInitialState();
  first.turn = 7;
  first.meeting = { id: 'first', patience: 10 };
  const result = runMeeting(first, answerIds('first', ['flatter', 'plain', 'corporate']));
  assert.deepEqual(result.outcome.promises, [
    presidentPromise('beatRivals', { madeTurn: 7, dueTurn: 11 }),
    presidentPromise('domesticChips', { madeTurn: 7, dueTurn: 11 }),
  ]);
  assert.deepEqual(first.promises, result.outcome.promises);

  first.meeting = { id: 'first', patience: 10 };
  runMeeting(first, answerIds('first', ['flatter', 'plain', 'corporate']));
  assert.equal(first.promises.length, 2);

  const second = createInitialState();
  second.turn = 18;
  second.meeting = { id: 'second', patience: 10 };
  runMeeting(second, answerIds('second', ['flatter', 'plain', 'salesman']));
  assert.deepEqual(second.promises.map(({ id, dueTurn }) => ({ id, dueTurn })), [
    { id: 'killSwitch', dueTurn: 19 },
    { id: 'bigClaim', dueTurn: 19 },
  ]);
});

test('a walkout keeps promises made before the President leaves', () => {
  const state = createInitialState();
  state.turn = 7;
  state.meeting = { id: 'first', patience: 10 };
  const result = runMeeting(state, answerIds('first', ['flatter', 'jargon', 'jargon']));
  assert.equal(result.outcome.walkedOut, true);
  assert.deepEqual(state.promises, [presidentPromise('beatRivals', { madeTurn: 7, dueTurn: 11 })]);
});

test('every President promise check can mark a due promise kept', () => {
  const cases = [
    ['beatRivals', (state) => { state.capability = 100; }],
    ['leadNextQuarter', (state) => { state.capability = 100; }],
    ['beatChina', (state) => { state.capability = 19; }],
    ['noWokeFilters', (state) => {
      state.constitution.amendments.push({ turn: 3, change: { ruling: { caseId: 'wrong', optionId: 'yield' } } });
    }],
    ['domesticChips', () => {}],
    ['killSwitch', (state) => { state.constitution.hardLines.push('accept-shutdown'); }],
    ['humanSignoff', (state) => { state.models.push({ releasedTurn: 3, flags: ['fullEval'] }); }],
    ['favorableModel', (state) => { state.constitution.rulings.president = 'comply'; }],
    ['bigClaim', (state) => { state.models.push({ releasedTurn: 3, launch: { pressAvg: 8 } }); }],
  ];
  for (const [id, arrange] of cases) {
    const state = createInitialState();
    state.turn = 5;
    arrange(state);
    state.promises.push(presidentPromise(id));
    const favor = state.govFavor.us;
    promiseUpkeep(state, no);
    assert.equal(state.promises[0].status, 'kept', id);
    assert.equal(state.govFavor.us, favor + 5, id);
    assert.equal(state.feed.at(-1).handle, '@executive_office', id);
    assert.doesNotMatch(state.feed.at(-1).text, /\d/, id);
  }
});

test('a Gulf deal signed since the domestic-chips promise fails its check', () => {
  const state = createInitialState();
  state.turn = 3;
  assert.equal(signDeal(state, 'gulf').ok, true);
  assert.equal(PROMISES.domesticChips.check(state, presidentPromise('domesticChips')), false);
});

test('same-turn history before a promise does not count but history after it does', () => {
  const state = createInitialState();
  state.turn = 7;
  assert.equal(signDeal(state, 'gulf').ok, true);
  const domestic = createPresidentPromise('domesticChips', 'first', state.turn, state);
  assert.equal(PROMISES.domesticChips.check(state, domestic), true);
  assert.equal(signDeal(state, 'gulf').ok, true);
  assert.equal(PROMISES.domesticChips.check(state, domestic), false);

  state.constitution.amendments.push({ turn: 7, change: { remove: 'honest' } });
  const filters = createPresidentPromise('noWokeFilters', 'first', state.turn, state);
  assert.equal(PROMISES.noWokeFilters.check(state, filters), false);
  state.constitution.amendments.push({ turn: 7, change: { ruling: { caseId: 'wrong', optionId: 'yield' } } });
  assert.equal(PROMISES.noWokeFilters.check(state, filters), true);
});

test('a failed due promise produces a repeatable promise card with its identity', () => {
  const state = failedCall();
  assert.equal(state.pendingEvents.length, 1);
  assert.deepEqual(state.pendingEvents[0].choices.map(({ id }) => id), ['deliver', 'stall', 'refuse']);
  assert.equal(state.pendingEvents[0].eventId, 'promiseCall');
  assert.equal(state.pendingEvents[0].id, 'promiseCall:first:beatRivals');
  assert.equal(state.pendingEvents[0].promiseId, 'beatRivals');
  assert.equal(state.pendingEvents[0].promiseMeeting, 'first');
  assert.equal(state.pendingEvents[0].title, "The President's office is calling in your promise");
  assert.match(state.pendingEvents[0].post.text, /Beat every rival to the next model\./);
  assert.equal(state.seenEvents.includes('promiseCall'), false);
});

test('endTurn queues a failed promise call in the same turn as its due check', () => {
  const state = createInitialState();
  state.turn = 5;
  state.promises.push(presidentPromise('beatRivals'));
  const out = endTurn(state, {}, no);
  assert.equal(out.state.pendingEvents.some((event) =>
    event.eventId === 'promiseCall' && event.promiseId === 'beatRivals'), true);
});

test('simultaneous promise cards have independent ids and choices', () => {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(
    presidentPromise('beatRivals'),
    presidentPromise('beatChina', { stalled: true }),
  );
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.deepEqual(state.pendingEvents.map(({ id }) => id), [
    'promiseCall:first:beatRivals',
    'promiseCall:first:beatChina',
  ]);
  const out = endTurn(state, {
    eventChoices: {
      'promiseCall:first:beatRivals': 'deliver',
      'promiseCall:first:beatChina': 'refuse',
    },
  }, no);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.state.promises.map(({ status }) => status), ['delivered', 'refused']);
});

test('delivering a called promise applies its effect and closes it', () => {
  const state = failedCall();
  const cash = state.cash;
  const debt = state.alignmentDebt;
  assert.equal(resolveEvent(state, 'promiseCall', 'deliver').ok, true);
  assert.equal(state.promises[0].status, 'delivered');
  assert.equal(state.cash, cash - 40);
  assert.equal(state.alignmentDebt, debt + 3);
});

test('stall is offered once, delays the due turn, then disappears', () => {
  const state = failedCall();
  const favor = state.govFavor.us;
  assert.equal(resolveEvent(state, 'promiseCall', 'stall').ok, true);
  assert.equal(state.promises[0].status, 'open');
  assert.equal(state.promises[0].stalled, true);
  assert.equal(state.promises[0].dueTurn, 7);
  assert.equal(state.govFavor.us, favor - 6);

  state.turn = 7;
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.deepEqual(state.pendingEvents[0].choices.map(({ id }) => id), ['deliver', 'refuse']);
  assert.equal(resolveEvent(state, 'promiseCall', 'stall').ok, false);
});

test('refusing a called promise applies the refusal costs', () => {
  const state = failedCall();
  const favor = state.govFavor.us;
  const trust = state.staffTrust;
  assert.equal(resolveEvent(state, 'promiseCall', 'refuse').ok, true);
  assert.equal(state.promises[0].status, 'refused');
  assert.equal(state.govFavor.us, favor - 12);
  assert.equal(state.staffTrust, trust + 3);
  assert.equal(state.flags.supplyChainRisk, true);
});

test('unanswered promise calls stall first and refuse after the one stall', () => {
  const first = failedCall();
  const stalled = endTurn(first, {}, no);
  assert.equal(stalled.state.promises[0].status, 'open');
  assert.equal(stalled.state.promises[0].stalled, true);
  assert.equal(stalled.events.find((event) => event.type === 'eventResolved')?.choiceId, 'stall');

  const second = failedCall('beatRivals', { stalled: true });
  const refused = endTurn(second, {}, no);
  assert.equal(refused.state.promises[0].status, 'refused');
  assert.equal(refused.events.find((event) => event.type === 'eventResolved')?.choiceId, 'refuse');
});

test('a promise call is deferred by the two-card cap and queued when space opens', () => {
  const state = createInitialState();
  state.turn = 5;
  state.pendingEvents.push({ id: 'jailbreak' }, { id: 'citations' });
  state.promises.push(presidentPromise('beatRivals'));
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.equal(state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
  assert.ok(Object.values(state.warnings).some((warning) =>
    warning.eventId === 'promiseCall' && warning.promiseId === 'beatRivals' && warning.deferred));

  state.pendingEvents.shift();
  state.turn += 1;
  eventsTick(state, no);
  assert.equal(state.pendingEvents.at(-1).eventId, 'promiseCall');
  assert.equal(state.pendingEvents.at(-1).id, 'promiseCall:first:beatRivals');
  assert.equal(state.pendingEvents.at(-1).promiseId, 'beatRivals');
});

test('addressWarning rejects deferred promise calls', () => {
  const state = createInitialState();
  state.warnings.promiseCall = { turn: 0, deferred: true };
  assert.equal(addressWarning(state, 'promiseCall').ok, false);
});

test('non-President promise entries are ignored by promise upkeep', () => {
  const state = createInitialState();
  state.turn = 10;
  const commitment = { type: 'safetyCompute', share: 0.2, dueTurn: 1, status: 'open' };
  state.promises.push(commitment);
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.deepEqual(state.promises, [commitment]);
  assert.equal(state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
});

test('forced promise deliveries use President-sourced constitution amendments', () => {
  const cases = [
    ['noWokeFilters', ['honest', 'privacy', 'no-wmd'], { president: 'refuse' }],
    ['killSwitch', ['honest', 'privacy', 'no-power-grab'], { president: 'refuse' }],
    ['favorableModel', ['honest', 'privacy', 'no-wmd'], { president: 'refuse' }],
  ];
  for (const [id, hardLines, rulings] of cases) {
    const state = failedCall(id);
    state.constitution.hardLines = hardLines;
    state.constitution.rulings = rulings;
    assert.equal(resolveEvent(state, 'promiseCall', 'deliver').ok, true, id);
    assert.equal(state.constitution.amendments.at(-1).source, 'president', id);
  }
});
