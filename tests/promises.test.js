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
  assert.equal(state.pendingEvents[0].id, 'promiseCall:0');
  assert.equal(state.pendingEvents[0].promiseIndex, 0);
  assert.equal(state.pendingEvents[0].promiseId, 'beatRivals');
  assert.equal(state.pendingEvents[0].promiseMeeting, 'first');
  assert.equal(state.pendingEvents[0].title, "The President's office is calling in your promise");
  assert.match(state.pendingEvents[0].post.text, /Beat every rival to the next model\./);
  assert.equal(state.seenEvents.includes('promiseCall'), false);
});

test('a first-meeting promise still queues a failed call in the same turn as its due check', () => {
  const state = createInitialState();
  state.turn = 5;
  state.promises.push(presidentPromise('beatRivals'));
  const out = endTurn(state, {}, no);
  assert.equal(out.state.pendingEvents.some((event) =>
    event.eventId === 'promiseCall' && event.promiseId === 'beatRivals'), true);
});

test('a second-meeting promise due on the final turn produces no promise call', () => {
  const state = createInitialState();
  state.turn = 19;
  state.promises.push(presidentPromise('bigClaim', {
    meeting: 'second', madeTurn: 18, dueTurn: 19,
  }));
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.equal(state.promises[0].status, 'open');
  assert.equal(state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
  assert.equal(state.govFavor.us, 50);
});

test('the final ending judges open President promises as kept or broken without favor changes', () => {
  const state = createInitialState();
  state.turn = 19;
  state.era = 5;
  state.turnInEra = 3;
  state.capability = 100;
  state.promises.push(
    presidentPromise('beatChina', { meeting: 'second', madeTurn: 18, dueTurn: 19 }),
    presidentPromise('bigClaim', { meeting: 'second', madeTurn: 18, dueTurn: 19 }),
  );
  const favor = state.govFavor.us;
  const out = endTurn(state, {}, no);
  assert.ok(out.state.ending);
  assert.deepEqual(out.state.promises.map(({ status }) => status), ['kept', 'broken']);
  assert.equal(out.state.govFavor.us, favor);
  assert.equal(out.state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
});

test('a leftBehind ending judges every open President promise without a call or favor change', () => {
  const state = createInitialState();
  state.turn = 19;
  state.era = 5;
  state.turnInEra = 3;
  state.capability = 10;
  for (const rival of state.rivals) rival.capability = 100;
  state.promises.push(
    presidentPromise('domesticChips', { meeting: 'second', madeTurn: 18, dueTurn: 19 }),
    presidentPromise('bigClaim', { meeting: 'second', madeTurn: 18, dueTurn: 19 }),
  );
  const favor = state.govFavor.us;
  const out = endTurn(state, {}, no);
  assert.equal(out.state.ending, 'leftBehind');
  assert.deepEqual(out.state.promises.map(({ status }) => status), ['kept', 'broken']);
  assert.equal(out.state.govFavor.us, favor);
  assert.equal(out.state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
});

test('a mid-game catastrophe judges promises exactly once', () => {
  const state = createInitialState();
  state.turn = 8;
  state.era = 3;
  state.turnInEra = 1;
  state.capability = 100;
  state.misuseExposure = 100;
  state.promises.push(presidentPromise('bigClaim', { dueTurn: 19 }));
  const favor = state.govFavor.us;
  const catastrophe = { ...no, chance: () => true };
  const out = endTurn(state, {}, catastrophe);
  assert.equal(out.state.ending, 'misuse');
  assert.equal(out.state.promises[0].status, 'broken');
  assert.equal(out.state.govFavor.us, favor);
  assert.equal(out.state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);

  out.state.models.push({ releasedTurn: 8, launch: { pressAvg: 10 } });
  const after = endTurn(out.state, {}, no);
  assert.equal(after.state.promises[0].status, 'broken');
  assert.equal(after.state.govFavor.us, favor);
});

test('simultaneous promise cards have unique ids and answering one resolves only that call', () => {
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
    'promiseCall:0',
    'promiseCall:1',
  ]);
  assert.equal(resolveEvent(state, 'promiseCall:1', 'refuse').ok, true);
  assert.deepEqual(state.promises.map(({ status }) => status), ['open', 'refused']);
  assert.deepEqual(state.pendingEvents.map(({ id }) => id), ['promiseCall:0']);
});

test('eventChoices routes a promise answer only through its unique call id', () => {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(presidentPromise('beatRivals'), presidentPromise('beatChina'));
  promiseUpkeep(state, no);
  eventsTick(state, no);
  const out = endTurn(state, { eventChoices: { 'promiseCall:1': 'refuse' } }, no);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.state.promises.map(({ status, stalled }) => ({ status, stalled })), [
    { status: 'open', stalled: true },
    { status: 'refused', stalled: false },
  ]);
});

test('a bare promiseCall id is rejected without resolving any call', () => {
  const state = failedCall();
  const result = resolveEvent(state, 'promiseCall', 'deliver');
  assert.equal(result.ok, false);
  assert.match(result.error, /no pending event promiseCall/);
  assert.equal(state.promises[0].status, 'open');
  assert.equal(state.pendingEvents.length, 1);
});

test('fallback resolves simultaneous promise calls separately', () => {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(presidentPromise('beatRivals'), presidentPromise('beatChina'));
  promiseUpkeep(state, no);
  eventsTick(state, no);
  const favor = state.govFavor.us;
  const out = endTurn(state, {}, no);
  assert.deepEqual(out.state.promises.map(({ status, stalled, dueTurn }) => ({ status, stalled, dueTurn })), [
    { status: 'open', stalled: true, dueTurn: 7 },
    { status: 'open', stalled: true, dueTurn: 7 },
  ]);
  assert.equal(out.state.govFavor.us, favor - 12);
  assert.deepEqual(out.events.filter(({ type }) => type === 'eventResolved').map(({ id }) => id), [
    'promiseCall:0',
    'promiseCall:1',
  ]);
});

test('delivering a called promise applies its effect and closes it', () => {
  const state = failedCall();
  const cash = state.cash;
  const debt = state.alignmentDebt;
  assert.equal(resolveEvent(state, 'promiseCall:0', 'deliver').ok, true);
  assert.equal(state.promises[0].status, 'delivered');
  assert.equal(state.cash, cash - 40);
  assert.equal(state.alignmentDebt, debt + 3);
});

test('stall is offered once, delays the due turn, then disappears', () => {
  const state = failedCall();
  const favor = state.govFavor.us;
  assert.equal(resolveEvent(state, 'promiseCall:0', 'stall').ok, true);
  assert.equal(state.promises[0].status, 'open');
  assert.equal(state.promises[0].stalled, true);
  assert.equal(state.promises[0].dueTurn, 7);
  assert.equal(state.govFavor.us, favor - 6);

  state.turn = 7;
  promiseUpkeep(state, no);
  eventsTick(state, no);
  assert.deepEqual(state.pendingEvents[0].choices.map(({ id }) => id), ['deliver', 'refuse']);
  assert.equal(resolveEvent(state, 'promiseCall:0', 'stall').ok, false);
});

test('refusing a called promise applies the refusal costs', () => {
  const state = failedCall();
  const favor = state.govFavor.us;
  const trust = state.staffTrust;
  assert.equal(resolveEvent(state, 'promiseCall:0', 'refuse').ok, true);
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
  assert.ok(Object.hasOwn(state.warnings, 'promiseCall:0'));
  assert.ok(Object.values(state.warnings).some((warning) =>
    warning.eventId === 'promiseCall' && warning.promiseId === 'beatRivals' && warning.deferred));

  state.pendingEvents.shift();
  state.turn += 1;
  eventsTick(state, no);
  assert.equal(state.pendingEvents.at(-1).eventId, 'promiseCall');
  assert.equal(state.pendingEvents.at(-1).id, 'promiseCall:0');
  assert.equal(state.pendingEvents.at(-1).promiseId, 'beatRivals');
});

test('addressWarning rejects deferred promise calls', () => {
  const state = createInitialState();
  state.warnings['promiseCall:0'] = { turn: 0, deferred: true, eventId: 'promiseCall', promiseIndex: 0 };
  assert.equal(addressWarning(state, 'promiseCall:0').ok, false);
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
    assert.equal(resolveEvent(state, 'promiseCall:0', 'deliver').ok, true, id);
    assert.equal(state.constitution.amendments.at(-1).source, 'president', id);
  }
});

test('a contradictory open promise can leak only once', () => {
  const state = createInitialState();
  state.turn = 2;
  state.constitution.hardLines = ['honest'];
  state.promises.push(presidentPromise('noWokeFilters', { dueTurn: 8 }));
  let rolls = 0;
  const leaks = { chance: (probability) => { rolls += 1; assert.equal(probability, 0.15); return true; } };
  promiseUpkeep(state, leaks);
  assert.equal(rolls, 1);
  assert.equal(state.promises[0].leaked, true);
  assert.equal(state.publicTrust, 56);
  assert.equal(state.staffTrust, 64);
  assert.equal(state.feed.at(-1).handle, '@leakwire');
  assert.match(state.feed.at(-1).text, /memo: lab promised the President it would/);
  assert.match(state.feed.at(-1).text, /woke.*filters/i);

  promiseUpkeep(state, leaks);
  assert.equal(rolls, 1);
  assert.equal(state.publicTrust, 56);
  assert.equal(state.staffTrust, 64);
});

test('a promise without a currently held contradicting line cannot leak', () => {
  const state = createInitialState();
  state.turn = 2;
  state.constitution.hardLines = ['privacy'];
  state.promises.push(presidentPromise('noWokeFilters', { dueTurn: 8 }));
  let rolls = 0;
  promiseUpkeep(state, { chance: () => { rolls += 1; return true; } });
  assert.equal(rolls, 0);
  assert.equal(state.promises[0].leaked, false);
  assert.equal(state.feed.length, 0);
});
