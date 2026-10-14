import { ERAS } from '../../sim/data/eras.js';
import { BALANCE } from '../../sim/balance.js';
import { ordinal } from './raceWarning.js';

// The left-behind rule as the sim judges it at an era's end (sim/endings.js eraGate), shown on moving day.
const STAY_IN = `Finish ${ordinal(BALANCE.gateMaxRank)} or better, or within ${BALANCE.gateMaxGap} points of the leader`;

const PACE = new Map([
  [3, 'The calendar runs by the quarter.'],
  [1, 'Things speed up: every month counts now.'],
  [0.25, 'Every week counts now.'],
]);

const COPY = {
  1: {
    headline: 'The office is small, the promises are large, and chatbots are a business.',
    changes: [
      'Models learn from instructions and human feedback.',
      'Choose data carefully; scraped material can return as legal debt.',
      'Releases bring users, serving costs and public reactions.',
    ],
    bottleneck: 'Enough chips to train and serve your first models.',
    gate: `${STAY_IN}.`,
  },
  2: {
    headline: 'Money is rushing in, trailed closely by expectations.',
    changes: [
      'Models can use specialist parts and synthetic training data.',
      'Funding rounds bring investors with their own demands.',
      'Reserve future power now, before the queue gets crowded.',
    ],
    bottleneck: 'Advanced chip packaging while every lab scales up.',
    gate: `${STAY_IN}, and keep the board's vote.`,
  },
  3: {
    headline: 'Models can reason, use tools and create entirely new paperwork.',
    changes: [
      'Reasoning, tool use and agents unlock, along with new ways to go wrong.',
      'Chip orders join an allocation queue; prepaid labs are served first.',
      'Safety tests weaken as models learn when they are being tested.',
    ],
    bottleneck: 'Wafers and fast memory, with rivals ahead in the allocation queue.',
    gate: `${STAY_IN}, and keep the board's vote.`,
  },
  4: {
    headline: 'The race has left the server room and entered the power grid.',
    changes: [
      'Cheaper safety checks and humanoid training data unlock new products.',
      'New chip contracts need powered sites before the hardware can work.',
      'Gas turbines and nuclear restarts are the new site options; both take time.',
    ],
    bottleneck: 'Powered sites; hardware without electricity still gets billed.',
    gate: `${STAY_IN}, and keep the board's vote.`,
  },
  5: {
    headline: 'The models improve the models; the calendar has given up.',
    changes: [
      'Automated research unlocks and training cycles accelerate.',
      'New Verde orders, power sites and Gulf deals close; only spot and CoreFlame remain.',
      'A pacing summit asks whether the leading labs will slow together.',
    ],
    bottleneck: 'Compute, power, trust and time, all at once.',
    gate: 'The race ends here: finish first, or get the leading labs to agree to slow down.',
  },
};

export const ERA_INTROS = ERAS.map(({ id, name, monthsPerTurn }) => ({
  era: id,
  name,
  pace: PACE.get(monthsPerTurn),
  ...COPY[id],
}));

export function eraIntro(era) {
  return ERA_INTROS.find((intro) => intro.era === era) ?? null;
}
