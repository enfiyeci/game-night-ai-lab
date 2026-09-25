import { ADVISOR_LINES } from './data/advisorLines.js';
import { leaderCapability } from './rivals.js';
import { runway } from './economy.js';
import { effectiveMisuse } from './endings.js';

export const ADVISORS = ['research', 'safety', 'cfo', 'policy'];

const band = (x, calmBelow, alarmedAt) => (x < calmBelow ? 'calm' : x < alarmedAt ? 'uneasy' : 'alarmed');
const finite = (x) => (Number.isFinite(x) ? x : 99);
const cappedMonths = (x) => Math.min(99, finite(x));

function lineFor(reading, turn) {
  const lines = ADVISOR_LINES[reading.id][reading.band];
  const line = lines[turn % lines.length];
  return reading.weird ? `${line} ${ADVISOR_LINES.research.weird}` : line;
}

export function advisorReadings(state, rng) {
  const gap = leaderCapability(state) - state.capability;
  const researchEst = gap - 10 + rng.normal(0, 3);
  const research = { id: 'research', truth: gap, estimate: researchEst, band: band(researchEst, 0, 10), weird: state.alignmentDebt > 60 };

  const sd = Math.max(2, 12 - 20 * state.budget.split.safety + state.capability / 10);
  const misuse = effectiveMisuse(state);
  const safetyEst = Math.max(state.alignmentDebt - state.perceivedAdOffset, misuse) + 10 + rng.normal(0, sd);
  const safety = { id: 'safety', truth: Math.max(state.alignmentDebt, misuse), estimate: safetyEst, band: band(safetyEst, 30, 60) };

  const cfoEst = cappedMonths(runway(state, 'trailing'));
  const cfoTruth = cappedMonths(runway(state, 'planned'));
  const cfo = { id: 'cfo', truth: cfoTruth, estimate: cfoEst, band: cfoEst > 18 ? 'calm' : cfoEst > 9 ? 'uneasy' : 'alarmed' };

  const policyTruth = Math.max(state.raceHeat, 100 - state.govFavor.us, 100 - state.publicTrust);
  const policyEst = policyTruth + rng.normal(0, 8);
  const policy = { id: 'policy', truth: policyTruth, estimate: policyEst, band: band(policyEst, 50, 75) };

  return [research, safety, cfo, policy].map((r) => ({
    ...r,
    truth: finite(r.truth),
    estimate: finite(r.estimate),
    line: lineFor(r, state.turn),
  }));
}

export function recordAdvisors(state, rng) {
  const readings = advisorReadings(state, rng);
  state.advisorHistory.push({ turn: state.turn, readings: readings.map(({ id, band: b, estimate, truth }) => ({ id, band: b, estimate, truth })) });
  state.lastBriefing = readings;
  return readings;
}
