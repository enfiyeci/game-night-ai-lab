import { ERAS, eraById } from './data/eras.js';

// Story days per hidden round mark: a quarter, a month, a week (today's turn lengths).
export const ROUND_DAYS = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 };

export const roundDays = (state) => ROUND_DAYS[state.era];
export const nextRoundDay = (state) => state.day + ROUND_DAYS[state.era] - state.dayInRound;
export const roundWord = (era) => ({ 3: 'quarter', 1: 'month', 0.25: 'week' })[eraById(era).monthsPerTurn];
// Story months that one day covers in this era's money and growth maths.
export const monthsPerDay = (state) => eraById(state.era).monthsPerTurn / ROUND_DAYS[state.era];

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Game Dev Tycoon style: year, month, week of the month (weeks 1-4; days 29-31 count as week 4).
export function storyDate(day) {
  const y = Math.floor(day / 365) + 1;
  let rest = day - (y - 1) * 365;
  let m = 0;
  while (rest >= MONTH_DAYS[m]) { rest -= MONTH_DAYS[m]; m += 1; }
  const w = Math.min(4, Math.floor(rest / 7) + 1);
  return { y, m: m + 1, w, label: `Y${y} M${m + 1} W${w}` };
}

// The story day of the round mark `rounds` marks from now, walking era changes (4 rounds per era).
export function roundMarkDay(state, rounds) {
  let day = nextRoundDay(state);
  let era = state.era;
  let inEra = state.turnInEra + 1;
  for (let k = 1; k < rounds; k += 1) {
    if (inEra >= ERAS[era - 1].turns && era < ERAS.length) { era += 1; inEra = 0; }
    day += ROUND_DAYS[era];
    inEra += 1;
  }
  return day;
}

// The era a round belongs to (ERAS[].turns rounds each); rounds past the run count as the last era.
export function eraOfRound(round) {
  let left = round;
  for (const era of ERAS) {
    if (left < era.turns) return era.id;
    left -= era.turns;
  }
  return ERAS.at(-1).id;
}

// Round `round` runs from the day after `start` to its mark on day `end`.
export function roundSpan(round) {
  let start = 0;
  for (let r = 0; r < round; r += 1) start += ROUND_DAYS[eraOfRound(r)];
  return { start, end: start + ROUND_DAYS[eraOfRound(round)] };
}
