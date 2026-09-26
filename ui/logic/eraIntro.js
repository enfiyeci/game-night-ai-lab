import { ERAS } from '../../sim/data/eras.js';

const PACE = new Map([
  [3, 'Each turn is now a quarter.'],
  [1, 'Each turn is now a month.'],
  [0.25, 'Each turn is now a week.'],
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
    gate: 'Reach second place, or stay close to the leader.',
  },
  2: {
    headline: 'Money is rushing in, trailed closely by expectations.',
    changes: [
      'Models can use specialist parts and synthetic training data.',
      'Funding rounds bring investors with their own demands.',
      'Reserve future power now, before the queue gets crowded.',
    ],
    bottleneck: 'Advanced chip packaging while every lab scales up.',
    gate: 'Stay close to the leader and win the board vote.',
  },
  3: {
    headline: 'Models can reason, use tools and create entirely new paperwork.',
    changes: [
      'Reasoning, tool use and agents unlock, along with new ways to go wrong.',
      'Chip orders join an allocation queue; prepaid labs are served first.',
      'Safety tests weaken as models learn when they are being tested.',
    ],
    bottleneck: 'Wafers and fast memory, with rivals ahead in the allocation queue.',
    gate: 'Stay close to the leader and win the board vote.',
  },
  4: {
    headline: 'The race has left the server room and entered the power grid.',
    changes: [
      'Cheaper safety checks and humanoid training data unlock new products.',
      'New chip contracts need powered sites before the hardware can work.',
      'Build grid, gas, nuclear or Gulf sites, then expect delays and opposition.',
    ],
    bottleneck: 'Powered sites; hardware without electricity still gets billed.',
    gate: 'Stay close to the leader and win the board vote.',
  },
  5: {
    headline: 'The models improve the models; the calendar has given up.',
    changes: [
      'Automated research unlocks and training cycles accelerate.',
      'No new chip orders or power sites; only existing plans can arrive.',
      'A pacing summit asks whether the leading labs will slow together.',
    ],
    bottleneck: 'Compute, power, trust and time, all at once.',
    gate: 'The race ends here.',
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
