import { MEETINGS } from './data/president.js';

const meetingById = (id) => MEETINGS.find((meeting) => meeting.id === id);

function applyStake(state) {
  if (state.govFavor.us >= 70) {
    state.cash += 150;
    state.raceHeat += 5;
    return 'nationalChampion';
  }
  if (state.govFavor.us >= 62) {
    if (state.flags.statePreemption !== true) {
      state.flags.statePreemption = true;
      state.publicTrust -= 3;
    }
    return 'statePreemption';
  }
  if (state.govFavor.us >= 55) {
    state.compute.pipeline.push({
      supplier: 'federal-export-license',
      units: 8,
      costMult: 1,
      failChance: 0,
      arrivesTurn: state.turn + 1,
    });
    return 'exportLicenses';
  }
  if (state.govFavor.us >= 40) {
    state.cash += 60;
    return 'federalContract';
  }
  return 'none';
}

function finishMeeting(state, id, walkedOut, flattery, promises) {
  const stake = applyStake(state);
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
  const promises = [];
  for (const answer of answers) {
    state.meeting.patience -= answer.jargon * 3;
    flattery += answer.flattery;
    state.govFavor.us += answer.flattery * 4;
    state.staffTrust -= answer.flattery * 2;
    state.publicTrust -= answer.flattery;
    if (answer.promise) {
      const promise = { text: answer.promise, dueTurn: state.turn + 6 };
      state.promises.push(promise);
      promises.push(promise);
    }
    if (state.meeting.patience <= 0) {
      state.govFavor.us -= 10;
      walkedOut = true;
      break;
    }
  }
  if (flattery >= 4) state.flags.presidentDemand = true;
  if (flattery === 0) state.flags.supplyChainRisk = true;
  return finishMeeting(state, meeting.id, walkedOut, flattery, promises);
}

export function expireMeeting(state) {
  const meeting = meetingById(state.meeting?.id);
  if (!meeting) return { ok: false, error: 'no open President meeting' };
  state.govFavor.us -= 10;
  return finishMeeting(state, meeting.id, true, 0, []);
}
