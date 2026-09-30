import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { PROMISES } from '../sim/data/promises.js';
import { MEETINGS } from '../sim/data/president.js';
import { LEAK_ROUNDS, createPresidentPromise, promiseUpkeep } from '../sim/promises.js';
import { runMeeting } from '../sim/president.js';
import { addressWarning, eventsTick, isAnchorId, resolveEvent, stampNewCards } from '../sim/events.js';
import { generateOffers, signOffer } from '../sim/contracts.js';
import { advanceDays, applyActions, endTurn } from '../sim/turn.js';
import { MISUSE_ROUNDS } from '../sim/endings.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const nonAnchors = (state) => state.pendingEvents.filter((event) => !isAnchorId(event.eventId ?? event.id));
const promiseCalls = (state) => nonAnchors(state).filter((event) => event.eventId === 'promiseCall');
const signGulf = (state) => {
  state.era = 3;
  state.govFavor.us = 60;
  state.cash = 1e6;
  state.compute.offers = generateOffers(state, no);
  return signOffer(state, state.compute.offers.find((offer) => offer.supplier === 'gulf').id, no);
};
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

function failedCall(id = 'beatRivals', overrides = {}, prepare = () => {}) {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  prepare(state);
  state.promises.push(presidentPromise(id, overrides));
  promiseUpkeep(state);
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
      state.constitution.amendments.push({ turn: 3, change: { ruling: { caseId: 'feedback', optionId: 'encourage' } } });
    }],
    ['domesticChips', () => {}],
    ['killSwitch', (state) => { state.constitution.hardLines.push('accept-shutdown'); }],
    ['humanSignoff', (state) => { state.models.push({ releasedTurn: 3, flags: ['fullEval'] }); }],
    ['favorableModel', (state) => { state.constitution.rulings.report = 'quiet'; }],
    ['bigClaim', (state) => { state.models.push({ releasedTurn: 3, launch: { pressAvg: 8 } }); }],
  ];
  for (const [id, arrange] of cases) {
    const state = createInitialState();
    state.turn = 5;
    arrange(state);
    state.promises.push(presidentPromise(id));
    const favor = state.govFavor.us;
    promiseUpkeep(state);
    assert.equal(state.promises[0].status, 'kept', id);
    assert.equal(state.govFavor.us, favor + 5, id);
    assert.equal(state.feed.at(-1).handle, '@executive_office', id);
    assert.doesNotMatch(state.feed.at(-1).text, /\d/, id);
  }
});

test('the kill-switch promise counts only a stored draft or the live constitution', () => {
  const state = createInitialState();
  assert.equal(PROMISES.killSwitch.check(state, presidentPromise('killSwitch')), false, 'Safety’s unadopted proposal does not count');
  state.constitutionDraft = { hardLines: ['no-wmd', 'accept-shutdown', 'honest'], rulings: {}, changes: [] };
  assert.equal(PROMISES.killSwitch.check(state, presidentPromise('killSwitch')), true);
});

test('a Gulf deal signed since the domestic-chips promise fails its check', () => {
  const state = createInitialState();
  state.turn = 3;
  assert.equal(signGulf(state).ok, true);
  assert.equal(PROMISES.domesticChips.check(state, presidentPromise('domesticChips')), false);
});

test('same-turn history before a promise does not count but history after it does', () => {
  const state = createInitialState();
  state.turn = 7;
  assert.equal(signGulf(state).ok, true);
  const domestic = createPresidentPromise('domesticChips', 'first', state.turn, state);
  assert.equal(PROMISES.domesticChips.check(state, domestic), true);
  assert.equal(signGulf(state).ok, true);
  assert.equal(PROMISES.domesticChips.check(state, domestic), false);

  state.constitution.amendments.push({ turn: 7, change: { remove: 'honest' } });
  const filters = createPresidentPromise('noWokeFilters', 'first', state.turn, state);
  assert.equal(PROMISES.noWokeFilters.check(state, filters), false);
  state.constitution.amendments.push({ turn: 7, change: { ruling: { caseId: 'feedback', optionId: 'encourage' } } });
  assert.equal(PROMISES.noWokeFilters.check(state, filters), true);
});

test('a failed due promise produces a repeatable promise card with its identity', () => {
  const state = failedCall();
  assert.equal(promiseCalls(state).length, 1);
  const [card] = promiseCalls(state);
  assert.deepEqual(card.choices.map(({ id }) => id), ['deliver', 'stall', 'refuse']);
  assert.equal(card.eventId, 'promiseCall');
  assert.equal(card.id, 'promiseCall:0');
  assert.equal(card.promiseIndex, 0);
  assert.equal(card.promiseId, 'beatRivals');
  assert.equal(card.promiseMeeting, 'first');
  assert.equal(card.title, "The President's office is calling in your promise");
  assert.match(card.post.text, /Beat every rival to the next model\./);
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
  promiseUpkeep(state);
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
  // No dice (A2, stated condition): misuse ends on the second round in a row over both lines, so the round before was
  // already over them and this round is the second.
  state.flags.misuseRounds = MISUSE_ROUNDS - 1;
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
  promiseUpkeep(state);
  eventsTick(state, no);
  assert.deepEqual(promiseCalls(state).map(({ id }) => id), [
    'promiseCall:0',
    'promiseCall:1',
  ]);
  assert.equal(resolveEvent(state, 'promiseCall:1', 'refuse').ok, true);
  assert.deepEqual(state.promises.map(({ status }) => status), ['open', 'refused']);
  assert.deepEqual(promiseCalls(state).map(({ id }) => id), ['promiseCall:0']);
});

test('eventChoices routes a promise answer only through its unique call id', () => {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(presidentPromise('beatRivals'), presidentPromise('beatChina'));
  promiseUpkeep(state);
  eventsTick(state, no);
  stampNewCards(state);
  const acted = applyActions(state, { eventChoices: { 'promiseCall:1': 'refuse' } }, no);
  const due = promiseCalls(acted.state)[0].dueAt - acted.state.day;
  const out = advanceDays(acted.state, due, no);
  assert.deepEqual([...acted.errors, ...out.errors], []);
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
  assert.equal(promiseCalls(state).length, 1);
});

test('fallback resolves simultaneous promise calls separately', () => {
  const state = createInitialState();
  state.turn = 5;
  state.capability = 10;
  state.promises.push(presidentPromise('beatRivals'), presidentPromise('beatChina'));
  promiseUpkeep(state);
  eventsTick(state, no);
  const favor = state.govFavor.us;
  stampNewCards(state);
  const days = Math.max(...promiseCalls(state).map((event) => event.dueAt)) - state.day;
  const out = advanceDays(state, days, no);
  assert.deepEqual(out.state.promises.map(({ status, stalled, dueTurn }) => ({ status, stalled, dueTurn })), [
    { status: 'open', stalled: true, dueTurn: 7 },
    { status: 'open', stalled: true, dueTurn: 7 },
  ]);
  assert.equal(out.state.govFavor.us, favor - 12);
  assert.deepEqual(out.events
    .filter(({ type, id }) => type === 'eventResolved' && !isAnchorId(id))
    .map(({ id }) => id), [
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
  promiseUpkeep(state);
  eventsTick(state, no);
  assert.deepEqual(promiseCalls(state)[0].choices.map(({ id }) => id), ['deliver', 'refuse']);
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
  stampNewCards(first);
  const stalled = advanceDays(first, promiseCalls(first)[0].dueAt - first.day, no);
  assert.equal(stalled.state.promises[0].status, 'open');
  assert.equal(stalled.state.promises[0].stalled, true);
  assert.equal(stalled.events.find((event) => event.type === 'eventResolved')?.choiceId, 'stall');

  const second = failedCall('beatRivals', { stalled: true });
  stampNewCards(second);
  const refused = advanceDays(second, promiseCalls(second)[0].dueAt - second.day, no);
  assert.equal(refused.state.promises[0].status, 'refused');
  assert.equal(refused.events.find((event) => event.type === 'eventResolved')?.choiceId, 'refuse');
});

test('a promise call is deferred by the two-card cap and queued when space opens', () => {
  const state = createInitialState();
  state.turn = 5;
  state.pendingEvents.push({ id: 'jailbreak' }, { id: 'citations' });
  state.promises.push(presidentPromise('beatRivals'));
  promiseUpkeep(state);
  eventsTick(state, no);
  assert.equal(state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
  assert.ok(Object.hasOwn(state.warnings, 'promiseCall:0'));
  assert.ok(Object.values(state.warnings).some((warning) =>
    warning.eventId === 'promiseCall' && warning.promiseId === 'beatRivals' && warning.deferred));

  state.pendingEvents.splice(state.pendingEvents.findIndex((event) => !isAnchorId(event.id)), 1);
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
  promiseUpkeep(state);
  eventsTick(state, no);
  assert.deepEqual(state.promises, [commitment]);
  assert.equal(state.pendingEvents.some((event) => event.eventId === 'promiseCall'), false);
});

test('forced promise deliveries use President-sourced constitution amendments', () => {
  const cases = [
    ['noWokeFilters', ['honest', 'privacy', 'no-wmd'], { report: 'full' }],
    ['killSwitch', ['honest', 'privacy', 'no-power-grab'], { report: 'full' }],
    ['favorableModel', ['honest', 'privacy', 'no-wmd'], { report: 'full' }],
  ];
  for (const [id, hardLines, rulings] of cases) {
    const state = failedCall(id, {}, (candidate) => {
      candidate.constitutionDraft = { hardLines, rulings, changes: [] };
    });
    assert.equal(resolveEvent(state, 'promiseCall:0', 'deliver').ok, true, id);
    assert.equal(state.constitutionDraft.changes.at(-1).source, 'president', id);
  }
});

// An open President promise (noWokeFilters) whose definition contradicts the held 'honest' line.
function contradictingPromiseState() {
  const state = createInitialState();
  state.turn = 2;
  state.constitution.hardLines = ['honest'];
  state.promises.push(presidentPromise('noWokeFilters', { dueTurn: 8 }));
  return state;
}

test('a contradictory open promise can leak only once', () => {
  const state = contradictingPromiseState();
  state.promises[0].contradictRounds = LEAK_ROUNDS - 1; // one more contradicting round leaks (stated term)
  promiseUpkeep(state);
  assert.equal(state.promises[0].leaked, true);
  assert.equal(state.publicTrust, 56);
  assert.equal(state.staffTrust, 64);
  assert.equal(state.feed.at(-1).handle, '@leakwire');
  assert.match(state.feed.at(-1).text, /memo: lab promised the President it would/);
  assert.match(state.feed.at(-1).text, /woke.*filters/i);

  promiseUpkeep(state);
  assert.equal(state.promises[0].contradictRounds, LEAK_ROUNDS); // a leaked promise stops counting
  assert.equal(state.publicTrust, 56);
  assert.equal(state.staffTrust, 64);
});

test('a promise without a currently held contradicting line cannot leak', () => {
  const state = createInitialState();
  state.turn = 2;
  state.constitution.hardLines = ['privacy'];
  state.promises.push(presidentPromise('noWokeFilters', { dueTurn: 8, contradictRounds: LEAK_ROUNDS - 1 }));
  promiseUpkeep(state);
  assert.equal(state.promises[0].contradictRounds, LEAK_ROUNDS - 1); // no held contradicting line: no round counts
  assert.equal(state.promises[0].leaked, false);
  assert.equal(state.feed.length, 0);
});

test('a promise that contradicts a held line leaks on its LEAK_ROUNDS-th such round, not before', () => {
  const s = contradictingPromiseState();
  for (let round = 1; round < LEAK_ROUNDS; round++) {
    promiseUpkeep(s);
    assert.equal(s.promises[0].leaked ?? false, false, `round ${round}`);
  }
  promiseUpkeep(s);
  assert.equal(s.promises[0].leaked, true);
});

test('removing a non-presidential pledge cannot orphan or duplicate a queued presidential call', () => {
  const state = failedCall();
  const original = promiseCalls(state)[0];
  state.promises.unshift({ type: 'safetyCompute', share: 0.2 });
  original.promiseIndex += 1;
  state.promises = state.promises.filter(promise => promise.type !== 'safetyCompute');
  eventsTick(state, no);
  assert.equal(promiseCalls(state).length, 1);
  assert.equal(resolveEvent(state, original.id, 'deliver').ok, true);
  assert.equal(promiseCalls(state).length, 0);
});

test('fulfilling a promise cancels its queued follow-up before it lands', () => {
  const state = failedCall();
  eventsTick(state, no);
  assert.equal(promiseCalls(state).length, 1);
  state.capability = 1000;
  promiseUpkeep(state);
  assert.equal(state.promises[0].status, 'kept');
  assert.equal(promiseCalls(state).length, 0);
});
