import { MEETINGS } from './data/president.js';
import { createPresidentPromise } from './promises.js';

const meetingById = (id) => MEETINGS.find((meeting) => meeting.id === id);

const STAKES = ['none', 'federalContract', 'exportLicenses', 'statePreemption', 'nationalChampion'];

function applyStake(state, tierUp) {
  let tier = state.govFavor.us >= 70 ? 4
    : state.govFavor.us >= 62 ? 3
      : state.govFavor.us >= 55 ? 2
        : state.govFavor.us >= 40 ? 1 : 0;
  if (tierUp) tier = Math.min(tier + 1, STAKES.length - 1);
  const stake = STAKES[tier];
  if (stake === 'nationalChampion') {
    state.cash += 150;
    state.raceHeat += 5;
  } else if (stake === 'statePreemption') {
    if (state.flags.statePreemption !== true) {
      state.flags.statePreemption = true;
      state.publicTrust -= 3;
    }
  } else if (stake === 'exportLicenses') {
    state.compute.pipeline.push({
      supplier: 'federal-export-license',
      units: 8,
      costMult: 1,
      failChance: 0,
      arrivesTurn: state.turn + 1,
    });
  } else if (stake === 'federalContract') {
    state.cash += 60;
  }
  return stake;
}

function finishMeeting(state, id, walkedOut, flattery, promises, bargain = false) {
  const stake = applyStake(state, bargain && !walkedOut);
  if (!state.meetingsHeld.includes(id)) state.meetingsHeld.push(id);
  state.meeting = null;
  return { ok: true, outcome: { walkedOut, flattery, promises, stake } };
}

export function meetingDue(state) {
  const meeting = MEETINGS.find((entry) =>
    entry.era === state.era
    && entry.turnInEra === state.turnInEra
    && !state.meetingsHeld.includes(entry.id));
  return meeting?.id ?? null;
}

export function runMeeting(state, answerIds) {
  const meeting = meetingById(state.meeting?.id);
  if (!meeting) return { ok: false, error: 'no open President meeting' };
  if (!Array.isArray(answerIds) || answerIds.length !== meeting.exchanges.length) {
    return { ok: false, error: 'president answers must include one answer id per exchange' };
  }
  const answers = meeting.exchanges.map((exchange, index) =>
    Object.hasOwn(answerIds, index)
      ? exchange.answers.find((answer) => answer.id === answerIds[index])
      : null);
  if (answers.some((answer) => !answer)) {
    return { ok: false, error: 'president answers must match the choices for each exchange' };
  }

  let flattery = 0;
  let walkedOut = false;
  let bargain = false;
  const promises = [];
  for (const answer of answers) {
    state.meeting.patience -= answer.jargon * 3;
    if (answer.patience && state.meeting.patience < 10) {
      state.meeting.patience = Math.min(10, state.meeting.patience + answer.patience);
    }
    flattery += answer.flattery;
    state.govFavor.us += answer.flattery * 4;
    state.govFavor.us += answer.favor ?? 0;
    state.raceHeat += answer.raceHeat ?? 0;
    state.staffTrust -= answer.flattery * 2;
    state.publicTrust -= answer.flattery;
    if (answer.bargain) bargain = true;
    if (answer.promise) {
      const alreadyMade = state.promises.some((promise) =>
        promise.source === 'president' && promise.meeting === meeting.id && promise.id === answer.promise);
      if (!alreadyMade) {
        const promise = createPresidentPromise(answer.promise, meeting.id, state.turn, state);
        state.promises.push(promise);
        promises.push(promise);
      }
    }
    if (state.meeting.patience <= 0) {
      state.govFavor.us -= 10;
      walkedOut = true;
      break;
    }
  }
  if (flattery >= 4) state.flags.presidentDemand = true;
  if (flattery === 0) state.flags.supplyChainRisk = true;
  return finishMeeting(state, meeting.id, walkedOut, flattery, promises, bargain);
}

export function expireMeeting(state) {
  const meeting = meetingById(state.meeting?.id);
  if (!meeting) return { ok: false, error: 'no open President meeting' };
  state.govFavor.us -= 10;
  return finishMeeting(state, meeting.id, true, 0, []);
}
