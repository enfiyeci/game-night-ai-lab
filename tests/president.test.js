import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { meetingDue, openMeeting, runMeeting } from '../sim/president.js';
import { MEETINGS } from '../sim/data/president.js';
import { PROMISES } from '../sim/data/promises.js';
import { endTurn } from '../sim/turn.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const meeting = (id = 'first') => MEETINGS.find((entry) => entry.id === id);
const open = (state, id = 'first') => {
  state.meeting = { id, patience: 10 };
  return state;
};
const ids = (pick, id = 'first') => meeting(id).exchanges.map((exchange) => pick(exchange.answers).id);
const styleIds = (style, id = 'first') => ids((answers) => answers.find((answer) => answer.style === style), id);
const plainIds = (id = 'first') => styleIds('plain', id);
const flatteringIds = (id = 'first') => styleIds('flatter', id);
const jargonIds = (id = 'first') => styleIds('jargon', id);

test('the President meeting script has the required exchanges and answer mix', () => {
  assert.deepEqual(MEETINGS.map(({ id, era, turnInEra }) => ({ id, era, turnInEra })), [
    { id: 'first', era: 2, turnInEra: 2 },
    { id: 'second', era: 5, turnInEra: 1 },
  ]);
  for (const entry of MEETINGS) {
    assert.equal(entry.exchanges.length, 3);
    for (const exchange of entry.exchanges) {
      assert.equal(exchange.answers.length, 5);
      assert.deepEqual(exchange.answers.slice(0, 3).map((answer) => answer.style), ['plain', 'flatter', 'jargon']);
      for (const answer of exchange.answers) {
        assert.equal(answer.id, `${entry.id}-${exchange.topic}-${answer.style}`);
        if (answer.promise) assert.equal(PROMISES[answer.promise]?.id, answer.promise);
      }
    }
  }
  const optionalStyles = MEETINGS.flatMap((entry) => entry.exchanges)
    .flatMap((exchange) => exchange.answers.slice(3).map((answer) => answer.style));
  assert.deepEqual(Object.fromEntries([...new Set(optionalStyles)].sort().map((style) => [
    style,
    optionalStyles.filter((candidate) => candidate === style).length,
  ])), {
    bargainer: 2,
    comedian: 2,
    corporate: 2,
    hawk: 2,
    mirror: 2,
    salesman: 2,
  });
});

test('answer extra fields apply favor, patience and race heat in answer order', () => {
  const hawk = open(createInitialState());
  const hawkIds = plainIds();
  hawkIds[0] = meeting().exchanges[0].answers.find((answer) => answer.style === 'hawk').id;
  runMeeting(hawk, hawkIds);
  assert.equal(hawk.govFavor.us, 56);
  assert.equal(hawk.raceHeat, 23);

  const bargain = open(createInitialState());
  const bargainIds = plainIds();
  bargainIds[2] = meeting().exchanges[2].answers.find((answer) => answer.style === 'bargainer').id;
  runMeeting(bargain, bargainIds);
  assert.equal(bargain.govFavor.us, 46);

  const comedian = open(createInitialState());
  comedian.meeting.patience = 5;
  const comedianIds = plainIds();
  comedianIds[1] = meeting().exchanges[1].answers.find((answer) => answer.style === 'comedian').id;
  comedianIds[2] = meeting().exchanges[2].answers.find((answer) => answer.style === 'jargon').id;
  assert.equal(runMeeting(comedian, comedianIds).outcome.walkedOut, false);
});

test('a bargain raises the stake one tier only when the meeting does not end in a walkout', () => {
  const completed = open(createInitialState());
  completed.govFavor.us = 43;
  const completedIds = plainIds();
  completedIds[2] = meeting().exchanges[2].answers.find((answer) => answer.style === 'bargainer').id;
  const completedResult = runMeeting(completed, completedIds);
  assert.equal(completedResult.outcome.walkedOut, false);
  assert.equal(completedResult.outcome.stake, 'federalContract');
  assert.equal(completed.cash, 1060);

  const walkedOut = open(createInitialState());
  walkedOut.govFavor.us = 43;
  const walkedOutIds = jargonIds();
  walkedOutIds[2] = meeting().exchanges[2].answers.find((answer) => answer.style === 'bargainer').id;
  const walkedOutResult = runMeeting(walkedOut, walkedOutIds);
  assert.equal(walkedOutResult.outcome.walkedOut, true);
  assert.equal(walkedOutResult.outcome.stake, 'none');
  assert.equal(walkedOut.cash, 1000);
});

test('the first meeting is due in era 2, turn 2', () => {
  const state = createInitialState();
  assert.equal(meetingDue(state), null);
  state.era = 2;
  state.turnInEra = 2;
  assert.equal(meetingDue(state), 'first');
  state.meetingsHeld.push('first');
  assert.equal(meetingDue(state), null);
});

test('jargon drains patience until the President walks out', () => {
  const state = open(createInitialState());
  const result = runMeeting(state, jargonIds());
  assert.equal(result.ok, true);
  assert.equal(result.outcome.walkedOut, true);
  assert.equal(state.meeting, null);
  assert.deepEqual(state.meetingsHeld, ['first']);
  assert.equal(state.govFavor.us, 40);
});

test('answers after a walkout have no effect', () => {
  const state = open(createInitialState());
  const answerIds = jargonIds();
  answerIds[2] = meeting().exchanges[2].answers.find((answer) => answer.flattery === 2).id;
  const result = runMeeting(state, answerIds);
  assert.equal(result.outcome.walkedOut, true);
  assert.equal(result.outcome.flattery, 0);
  assert.deepEqual(result.outcome.promises, []);
  assert.equal(state.staffTrust, 70);
  assert.equal(state.publicTrust, 60);
});

test('flattery buys government favour at a cost to staff and public trust', () => {
  const state = open(createInitialState());
  const before = { gov: state.govFavor.us, staff: state.staffTrust, public: state.publicTrust };
  const result = runMeeting(state, flatteringIds());
  assert.ok(result.outcome.flattery > 0);
  assert.ok(state.govFavor.us > before.gov);
  assert.ok(state.staffTrust < before.staff);
  assert.ok(state.publicTrust < before.public);
  assert.ok(['nationalChampion', 'statePreemption', 'exportLicenses', 'federalContract', 'none'].includes(result.outcome.stake));
});

test('answering with plain honesty risks the supply-chain designation', () => {
  const state = open(createInitialState());
  runMeeting(state, plainIds());
  assert.equal(state.flags.supplyChainRisk, true);
});

test('answer ids are validated per exchange before the meeting changes state', () => {
  const state = open(createInitialState());
  const before = structuredClone(state);
  const answerIds = plainIds();
  answerIds[1] = meeting().exchanges[0].answers[1].id;
  const result = runMeeting(state, answerIds);
  assert.equal(result.ok, false);
  assert.deepEqual(state, before);
});

test('inherited array entries do not count as President answers', () => {
  const state = open(createInitialState());
  const before = structuredClone(state);
  const answerIds = plainIds();
  const inheritedId = answerIds[1];
  delete answerIds[1];
  Object.setPrototypeOf(answerIds, { 1: inheritedId });
  const result = runMeeting(state, answerIds);
  assert.equal(result.ok, false);
  assert.deepEqual(state, before);
});

test('answer promise values are promise ids', () => {
  const state = open(createInitialState());
  state.turn = 9;
  const answerIds = ids((answers) => answers.find((answer) => answer.promise) ?? answers[0]);
  const expected = meeting().exchanges
    .map((exchange, index) => exchange.answers.find((answer) => answer.id === answerIds[index]).promise)
    .filter(Boolean)
    .map((id) => ({
      source: 'president',
      id,
      text: PROMISES[id].text,
      meeting: 'first',
      madeTurn: 9,
      dueTurn: 13,
      status: 'open',
      stalled: false,
      leaked: false,
    }));
  const result = runMeeting(state, answerIds);
  assert.deepEqual(state.promises, expected);
  assert.deepEqual(result.outcome.promises, expected);
});

test('meeting stakes use each final government-favour threshold', () => {
  const cases = [
    { favor: 70, stake: 'nationalChampion', cash: 150, heat: 5, trust: 0, pipeline: 0 },
    { favor: 62, stake: 'statePreemption', cash: 0, heat: 0, trust: -3, pipeline: 0 },
    { favor: 55, stake: 'exportLicenses', cash: 0, heat: 0, trust: 0, pipeline: 1 },
    { favor: 40, stake: 'federalContract', cash: 60, heat: 0, trust: 0, pipeline: 0 },
    { favor: 39, stake: 'none', cash: 0, heat: 0, trust: 0, pipeline: 0 },
  ];
  for (const expected of cases) {
    const state = open(createInitialState());
    state.govFavor.us = expected.favor;
    const before = { cash: state.cash, heat: state.raceHeat, trust: state.publicTrust };
    const result = runMeeting(state, plainIds());
    assert.equal(result.outcome.stake, expected.stake);
    assert.equal(state.cash, before.cash + expected.cash);
    assert.equal(state.raceHeat, before.heat + expected.heat);
    assert.equal(state.publicTrust, before.trust + expected.trust);
    assert.equal(state.flags.statePreemption === true, expected.stake === 'statePreemption');
    assert.equal(state.compute.pipeline.length, expected.pipeline);
    if (expected.stake === 'exportLicenses') {
      assert.deepEqual(state.compute.pipeline[0], {
        id: 'c1', supplier: 'verde', units: 8, price: 0.9, termMonths: 24,
        arrivesTurn: state.turn + 1, string: null, needsPower: false,
      });
    }
  }
});

test('state-law preemption charges its public-trust cost only once', () => {
  const state = open(createInitialState());
  state.govFavor.us = 62;
  assert.equal(runMeeting(state, plainIds()).outcome.stake, 'statePreemption');
  assert.equal(state.publicTrust, 57);
  state.meeting = { id: 'second', patience: 10 };
  assert.equal(runMeeting(state, plainIds('second')).outcome.stake, 'statePreemption');
  assert.equal(state.publicTrust, 57);
});

test('four points of flattery queue the President amendment demand', () => {
  const below = open(createInitialState());
  const belowIds = plainIds();
  belowIds[0] = meeting().exchanges[0].answers.find((answer) => answer.flattery === 2).id;
  runMeeting(below, belowIds);
  assert.equal(Object.hasOwn(below.flags, 'presidentDemand'), false);

  const state = open(createInitialState());
  const answerIds = plainIds();
  answerIds[0] = meeting().exchanges[0].answers.find((answer) => answer.flattery === 2).id;
  answerIds[1] = meeting().exchanges[1].answers.find((answer) => answer.flattery === 2).id;
  const result = runMeeting(state, answerIds);
  assert.equal(result.outcome.flattery, 4);
  assert.equal(state.flags.presidentDemand, true);
});

test('second-meeting grudges lower patience and are exposed on the meeting state', () => {
  const state = createInitialState();
  state.turn = 17;
  state.era = 5;
  state.turnInEra = 1;
  state.promises = [
    { source: 'president', id: 'beatRivals', text: PROMISES.beatRivals.text, meeting: 'first', dueTurn: 11, status: 'refused' },
    { source: 'president', id: 'domesticChips', text: PROMISES.domesticChips.text, meeting: 'first', dueTurn: 11, status: 'open' },
    { source: 'president', id: 'noWokeFilters', text: PROMISES.noWokeFilters.text, meeting: 'first', dueTurn: 11, status: 'kept' },
    { source: 'president', id: 'leadNextQuarter', text: PROMISES.leadNextQuarter.text, meeting: 'first', dueTurn: 11, status: 'delivered' },
  ];
  const out = endTurn(state, {}, no);
  assert.deepEqual(out.state.meeting, {
    id: 'second',
    patience: 8,
    grudges: [PROMISES.beatRivals.text, PROMISES.domesticChips.text],
  });
});

test('second-meeting patience is clamped between four and twelve', () => {
  const low = createInitialState();
  low.turn = 17;
  low.promises = ['beatRivals', 'domesticChips', 'noWokeFilters'].map((id) => ({
    source: 'president', id, text: PROMISES[id].text, meeting: 'first', dueTurn: 11, status: 'refused',
  }));
  assert.equal(openMeeting(low, 'second').patience, 4);

  const high = createInitialState();
  high.turn = 17;
  high.promises = ['beatRivals', 'domesticChips', 'noWokeFilters'].map((id) => ({
    source: 'president', id, text: PROMISES[id].text, meeting: 'first', dueTurn: 11, status: 'kept',
  }));
  assert.equal(openMeeting(high, 'second').patience, 12);
});

test('a second-meeting grudge lowers the amendment-demand threshold to two flattery', () => {
  const answerIds = plainIds('second');
  answerIds[0] = meeting('second').exchanges[0].answers.find((answer) => answer.style === 'flatter').id;

  const noGrudge = open(createInitialState(), 'second');
  runMeeting(noGrudge, answerIds);
  assert.equal(Object.hasOwn(noGrudge.flags, 'presidentDemand'), false);

  const withGrudge = createInitialState();
  withGrudge.meeting = { id: 'second', patience: 8, grudges: [PROMISES.beatRivals.text] };
  runMeeting(withGrudge, answerIds);
  assert.equal(withGrudge.flags.presidentDemand, true);
});

test('endTurn opens a due meeting and answers it on the next turn', () => {
  const previous = createInitialState();
  previous.era = 2;
  previous.turnInEra = 2;
  const due = endTurn(previous, {}, no);
  assert.deepEqual(previous.meeting, null);
  assert.deepEqual(due.state.meeting, { id: 'first', patience: 10 });
  assert.deepEqual(due.events.filter((event) => event.type === 'meetingDue'), [{ type: 'meetingDue', id: 'first' }]);

  const answered = endTurn(due.state, { moves: [{ type: 'meeting' }], presidentAnswers: plainIds() }, no);
  assert.equal(answered.state.meeting, null);
  assert.equal(answered.state.meetingsHeld.includes('first'), true);
  assert.equal(answered.events.filter((event) => event.type === 'meetingOutcome').length, 1);
  assert.deepEqual(answered.errors, []);
});

test('an unanswered open meeting expires with one walkout penalty and is held', () => {
  const state = open(createInitialState());
  state.era = 2;
  state.turnInEra = 2;
  const out = endTurn(state, {}, no);
  assert.equal(out.state.meeting, null);
  assert.deepEqual(out.state.meetingsHeld, ['first']);
  assert.equal(out.state.govFavor.us, 40);
  assert.equal(out.errors.length, 1);
  assert.match(out.errors[0], /meeting move/i);
  assert.deepEqual(out.events.filter((event) => event.type === 'meetingOutcome'), [
    { type: 'meetingOutcome', id: 'first', walkedOut: true, stake: 'federalContract' },
  ]);
});

function assertInvalidAnswersExpire(actions) {
  const state = open(createInitialState());
  const out = endTurn(state, { moves: [{ type: 'meeting' }], ...actions }, no);
  assert.equal(out.state.meeting, null);
  assert.deepEqual(out.state.meetingsHeld, ['first']);
  assert.equal(out.state.govFavor.us, 40);
  assert.equal(out.errors.length, 1);
  assert.match(out.errors[0], /president answers/i);
  assert.deepEqual(out.events.filter((event) => event.type === 'meetingOutcome'), [
    { type: 'meetingOutcome', id: 'first', walkedOut: true, stake: 'federalContract' },
  ]);
}

test('undefined presidentAnswers expires the open meeting', () => {
  assertInvalidAnswersExpire({ presidentAnswers: undefined });
});

test('inherited presidentAnswers expires the open meeting', () => {
  assertInvalidAnswersExpire(Object.create({ presidentAnswers: plainIds() }));
});

test('two President answer ids for three exchanges expires the open meeting', () => {
  assertInvalidAnswersExpire({ presidentAnswers: plainIds().slice(0, 2) });
});

test('an unknown President answer id expires the open meeting', () => {
  const answerIds = plainIds();
  answerIds[1] = 'unknown-answer';
  assertInvalidAnswersExpire({ presidentAnswers: answerIds });
});

test('meeting flattery causes the President demand card to be queued', () => {
  const state = open(createInitialState());
  state.turn = 1;
  const out = endTurn(state, { moves: [{ type: 'meeting' }], presidentAnswers: flatteringIds() }, no);
  assert.equal(out.state.flags.presidentDemand, true);
  assert.equal(out.state.pendingEvents.some((event) => event.id === 'president'), true);
});

test('President answers without a meeting move are rejected and the meeting expires', () => {
  const state = open(createInitialState());
  const out = endTurn(state, { presidentAnswers: plainIds() }, no);
  assert.equal(out.state.meeting, null);
  assert.deepEqual(out.state.meetingsHeld, ['first']);
  assert.equal(out.state.govFavor.us, 40);
  assert.ok(out.errors.some((error) => /meeting move/i.test(error)));
});

test('a meeting move needs an open meeting and consumes one of the two round actions', () => {
  const closed = endTurn(createInitialState(), { moves: [{ type: 'meeting' }] }, no);
  assert.ok(closed.errors.some((error) => /no open President meeting/i.test(error)));

  const state = open(createInitialState());
  const coreflame = state.compute.offers.find((offer) => offer.supplier === 'coreflame');
  const out = endTurn(state, {
    moves: [
      { type: 'meeting' },
      { type: 'deal', offerId: coreflame.id },
      { type: 'deal', offerId: coreflame.id },
    ],
    presidentAnswers: plainIds(),
  }, no);
  assert.ok(out.errors.some((error) => error.includes('2 actions per round')));
  assert.equal(out.events.filter((event) => event.type === 'deal').length, 1);
});

test('a meeting uses government favour after moves that precede it', () => {
  const state = open(createInitialState());
  state.govFavor.us = 63;
  const out = endTurn(state, {
    moves: [
      { type: 'amendConstitution', change: { remove: 'accept-shutdown', add: 'no-power-grab' } },
      { type: 'meeting' },
    ],
    presidentAnswers: plainIds(),
  }, no);

  assert.deepEqual(out.errors, []);
  assert.equal(out.state.flags.statePreemption, undefined);
  assert.equal(out.events.find((event) => event.type === 'meetingOutcome')?.stake, 'exportLicenses');
});
