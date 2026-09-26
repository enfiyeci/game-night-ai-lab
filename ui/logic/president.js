import { MEETINGS } from '../../sim/data/president.js';

export function meetingFor(state) {
  const id = state?.meeting?.id;
  return id ? MEETINGS.find((meeting) => meeting.id === id) ?? null : null;
}

export function patienceTrail(state, answerIds = []) {
  const meeting = meetingFor(state);
  if (!meeting) return { trail: [], walkedOutAt: null };
  let patience = state.meeting.patience;
  const trail = [patience];
  let walkedOutAt = null;
  for (let index = 0; index < answerIds.length && index < meeting.exchanges.length; index += 1) {
    const answer = meeting.exchanges[index].answers.find((choice) => choice.id === answerIds[index]);
    if (!answer) break;
    patience -= answer.jargon * 3;
    if (answer.patience && patience < 10) patience = Math.min(10, patience + answer.patience);
    trail.push(patience);
    if (patience <= 0) {
      walkedOutAt = index;
      break;
    }
  }
  return { trail, walkedOutAt };
}

export function answersPayload(meeting, picked = []) {
  if (!meeting) return [];
  return meeting.exchanges.map((exchange, index) => picked[index] ?? exchange.answers[0].id);
}

export function moodFor(patience) {
  return patience >= 6 ? 'calm' : 'uneasy';
}

export function hatedWord(answer) {
  if (!answer || answer.jargon <= 0) return null;
  return answer.text
    .split(/[\s-]+/u)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .reduce((longest, word) => (word.length > longest.length ? word : longest), '');
}

const STAKE_CLAUSES = {
  nationalChampion: 'named you his national champion.',
  statePreemption: 'backed federal rules over state AI laws.',
  exportLicenses: 'cleared export licenses for your chips.',
  federalContract: 'steered a federal contract your way.',
};

export function outcomeLine(event, { skipped = false } = {}) {
  if (event?.walkedOut) return skipped ? 'The President left without meeting you.' : 'The President walked out of the meeting.';
  const clause = STAKE_CLAUSES[event?.stake];
  return clause ? `The President ${clause}` : 'The President thanked you for your time. Nothing came of it.';
}
