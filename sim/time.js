import { ERAS, eraById } from './data/eras.js';

// Story days per hidden round mark: a quarter, a month, a week (today's turn lengths).
export const ROUND_DAYS = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 };

export const roundDays = (state) => ROUND_DAYS[state.era];
export const nextRoundDay = (state) => state.day + ROUND_DAYS[state.era] - state.dayInRound;
export const roundWord = (era) => ({ 3: 'quarter', 1: 'month', 0.25: 'week' })[eraById(era).monthsPerTurn];
// Story months that one day covers in this era's money and growth maths.
export const monthsPerDay = (state) => eraById(state.era).monthsPerTurn / ROUND_DAYS[state.era];

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Each era opens on 1 January of its real year (owner, 2026-09-26: "actual date and year ... fit with actual
// timelines"): the chat assistants of 2023, the 2024 scale-up, 2025's reasoning models and agents, the 2026 gigawatt
// campuses, and 2027 for self-improvement. The calendar runs on within an era and jumps ahead at the next one.
const ERA_YEAR = { 1: 2023, 2: 2024, 3: 2025, 4: 2026, 5: 2027 };
const ERA_START_DAY = ERAS.reduce((starts, era, i) => ({ ...starts, [era.id]: i === 0 ? 0 : starts[era.id - 1] + ERAS[i - 1].turns * ROUND_DAYS[era.id - 1] }), {});

// The real date of a story day: year, month and week of the month (days 29-31 are week 5, so era 5's weekly marks
// never share a label).
export function storyDate(day) {
  const era = ERAS.findLast((entry) => day >= ERA_START_DAY[entry.id]) ?? ERAS[0];
  const date = new Date(Date.UTC(ERA_YEAR[era.id], 0, 1 + day - ERA_START_DAY[era.id]));
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const w = Math.floor((date.getUTCDate() - 1) / 7) + 1;
  const month = `${MONTH_NAMES[m - 1]} ${y}`;
  // Era 5 moves a week at a time, so its dates name the week.
  return { y, m, w, label: era.id === 5 ? `${month}, week ${w}` : month };
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
