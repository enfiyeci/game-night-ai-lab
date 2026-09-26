import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEETINGS } from '../sim/data/president.js';
import { runMeeting } from '../sim/president.js';
import { createInitialState } from '../sim/state.js';
import {
  answersPayload,
  hatedWord,
  meetingFor,
  moodFor,
  outcomeLine,
  patienceTrail,
} from '../ui/logic/president.js';

function combinations(exchanges, index = 0, picked = []) {
  if (index === exchanges.length) return [picked];
  return exchanges[index].answers.flatMap((answer) => (
    combinations(exchanges, index + 1, [...picked, answer.id])
  ));
}

function observedRun(state, answerIds) {
  const clone = structuredClone(state);
  let meeting = clone.meeting;
  let finalPatience = meeting.patience;
  Object.defineProperty(clone, 'meeting', {
    configurable: true,
    enumerable: true,
    get: () => meeting,
    set(value) {
      if (value === null && meeting) finalPatience = meeting.patience;
      meeting = value;
    },
  });
  const result = runMeeting(clone, answerIds);
  return { result, finalPatience };
}

test('patience and padded answer payloads match the sim for every meeting answer combination', () => {
  const states = {
    first: { id: 'first', patience: 10 },
    second: { id: 'second', patience: 6, grudges: ['A promise was broken.'] },
  };
  for (const meeting of MEETINGS) {
    for (const ids of combinations(meeting.exchanges)) {
      const state = createInitialState();
      state.meeting = structuredClone(states[meeting.id]);
      const expected = patienceTrail(state, ids);
      const picked = expected.walkedOutAt === null ? ids : ids.slice(0, expected.walkedOutAt + 1);
      const payload = answersPayload(meeting, picked);
      const direct = observedRun(state, ids);
      const padded = observedRun(state, payload);

      assert.equal(direct.result.ok, true, `${meeting.id}: ${ids.join(', ')}`);
      assert.equal(direct.result.outcome.walkedOut, expected.walkedOutAt !== null);
      assert.equal(direct.finalPatience, expected.trail.at(-1));
      assert.equal(payload.length, meeting.exchanges.length);
      assert.equal(padded.result.outcome.walkedOut, direct.result.outcome.walkedOut);
      assert.equal(padded.finalPatience, direct.finalPatience);
    }
  }
});

test('meeting helpers handle partial answers and preserve patience recovery order', () => {
  const state = createInitialState();
  state.meeting = { id: 'first', patience: 5 };
  const meeting = meetingFor(state);
  const comedian = meeting.exchanges[1].answers.find((answer) => answer.style === 'comedian');
  const ids = [meeting.exchanges[0].answers[0].id, comedian.id];
  assert.equal(meeting.id, 'first');
  assert.deepEqual(patienceTrail(state, ids), { trail: [5, 5, 7], walkedOutAt: null });
  assert.deepEqual(answersPayload(meeting, ids), [ids[0], ids[1], meeting.exchanges[2].answers[0].id]);
  assert.equal(meetingFor({ meeting: null }), null);
});

test('mood, hated word and outcome copy use the President UI contract', () => {
  assert.equal(moodFor(6), 'calm');
  assert.equal(moodFor(5), 'uneasy');
  assert.equal(hatedWord({ jargon: 0, text: 'No hidden label.' }), null);
  assert.equal(hatedWord({ jargon: 1, text: 'Plain words, then corrigibility!' }), 'corrigibility');
  assert.equal(hatedWord({ jargon: 2, text: 'Constitution-based harmlessness training.' }), 'Constitution');
  assert.equal(outcomeLine({ walkedOut: true, stake: 'none' }), 'The President walked out of the meeting.');
  assert.equal(outcomeLine({ walkedOut: false, stake: 'nationalChampion' }), 'The President named you his national champion.');
  assert.equal(outcomeLine({ walkedOut: false, stake: 'statePreemption' }), 'The President backed federal rules over state AI laws.');
  assert.equal(outcomeLine({ walkedOut: false, stake: 'exportLicenses' }), 'The President cleared export licenses for your chips.');
  assert.equal(outcomeLine({ walkedOut: false, stake: 'federalContract' }), 'The President steered a federal contract your way.');
  assert.equal(outcomeLine({ walkedOut: false, stake: 'none' }), 'The President thanked you for your time. Nothing came of it.');
});

test('the President asset contains both moods, addressable advisors and stage anchors', () => {
  const svg = readFileSync('ui/assets/president.svg', 'utf8');
  const anchors = JSON.parse(readFileSync('ui/assets/president-anchors.json', 'utf8'));
  const ordered = [
    'class="pres-body" data-mood="calm"',
    'class="pres-body" data-mood="uneasy"',
    '<rect x="450.0" y="500.0"',
    'class="pres-hands" data-mood="calm"',
    'class="pres-hands" data-mood="uneasy"',
    'id="advisor-ceo"',
    'id="advisor-policy"',
    'fill:url(#bvig)',
  ].map((marker) => svg.indexOf(marker));

  assert.ok(ordered.every((index) => index >= 0));
  assert.deepEqual([...ordered].sort((a, b) => a - b), ordered);
  assert.deepEqual(svg.match(/#[0-9a-fA-F]{3,8}\b|rgb\(/g) ?? [], []);
  for (const point of [anchors.president.calm, anchors.president.uneasy, anchors.policy, anchors.ceo]) {
    assert.ok(point[0] > 0 && point[0] < 1440);
    assert.ok(point[1] > 0 && point[1] < 900);
  }
});
