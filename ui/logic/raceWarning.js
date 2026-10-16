// The "left behind" warning (owner pick B + D, 2026-10-14): playtesters lost at an era's end with no warning. The rule
// is the sim's (sim/endings.js eraGate): when an era ends, a lab ranked below BALANCE.gateMaxRank and more than
// BALANCE.gateMaxGap points behind the leader is out. Pure: reads the state, never changes it.
import { BALANCE } from '../../sim/balance.js';
import { eraById } from '../../sim/data/eras.js';
import { gapToLeader, rank } from '../../sim/rivals.js';
import { ROUND_DAYS, nextRoundDay } from '../../sim/time.js';
import { lead } from '../../sim/leads.js';

// Priya warns a little before the line: from 3 points short of it, so a lab still inside by a hair hears it too.
export const RACE_WARN_MARGIN = 3;
// The two warnings in story days before the era ends: 6 and 2 weeks of a 13-week quarter, kept at the same share of
// the last round in every era (the clock gives each round the same real time), so 42 and 14 days in eras 1-2, 14 and
// 5 in eras 3-4, 3 and 1 in era 5.
export const raceWarnDays = (era) => ({
  first: Math.round((ROUND_DAYS[era] * 6) / 13),
  second: Math.max(1, Math.round((ROUND_DAYS[era] * 2) / 13)),
});

// Story days until the era's last round mark, where the gate is judged.
export function eraDaysLeft(state) {
  return nextRoundDay(state) - state.day + (eraById(state.era).turns - 1 - state.turnInEra) * ROUND_DAYS[state.era];
}

export const ordinal = (n) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const PLACE_WORD = { 3: 'third', 4: 'fourth', 5: 'fifth' };
const NUMBER_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
const tenths = (n) => Math.round(n * 10) / 10;

// Time left in whole weeks from two weeks up, in days below.
export function timeLeft(days) {
  const left = Math.max(1, Math.round(days));
  return left >= 14 ? { n: Math.round(left / 7), unit: 'week' } : { n: left, unit: 'day' };
}
const timeWords = (days) => {
  const { n, unit } = timeLeft(days);
  const words = `${NUMBER_WORD[n] ?? n} ${unit}${n === 1 ? '' : 's'}`;
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// The race in written numbers: the stated gap and every lab's score. The lab's score is the leader's minus the stated
// gap, so the two never disagree about the line. Whole points, as the race tab shows scores, unless whole numbers would
// put an out lab on the safe side (15.3 reads 15) or contradict the lane order; then tenths throughout, an out gap
// rounded up so it still reads past the line.
function writtenRace(state, leader, gap, out) {
  const labs = [{ id: 'you', capability: state.capability }, ...state.rivals]
    .sort((a, b) => b.capability - a.capability || Number(a.id === 'you') - Number(b.id === 'you'));
  for (const round of [Math.round, tenths]) {
    const raw = round(gap);
    const shownGap = !out ? Math.min(BALANCE.gateMaxGap, raw)
      : raw > BALANCE.gateMaxGap ? raw : round === tenths ? tenths(Math.ceil(gap * 10) / 10) : null;
    if (shownGap === null) continue;
    const top = round(leader.capability);
    const scores = labs.map((lab) => (lab.id === 'you' ? tenths(top - shownGap) : round(lab.capability)));
    if (round === tenths || scores.every((score, i) => i === 0 || score <= scores[i - 1])) {
      return { shownGap, scores: Object.fromEntries(labs.map((lab, i) => [lab.id, scores[i]])) };
    }
  }
  return null; // not reached: the tenths pass always returns
}

// Where the lab stands against the rule, with the numbers as written (writtenRace).
export function raceStanding(state) {
  const place = rank(state);
  const gap = gapToLeader(state);
  const leader = state.rivals.reduce((best, rival) => (rival.capability > best.capability ? rival : best));
  const out = place > BALANCE.gateMaxRank && gap > BALANCE.gateMaxGap;
  const near = place > BALANCE.gateMaxRank && gap > BALANCE.gateMaxGap - RACE_WARN_MARGIN;
  const { shownGap, scores } = writtenRace(state, leader, gap, out);
  return { place, gap, shownGap, scores, leader, out, near, fromLine: tenths(shownGap - BALANCE.gateMaxGap) };
}

// Which warning is due: 'first' from about 6 weeks before the era ends, 'second' from about 2 weeks, while the lab is
// in danger (ranked below 2nd and more than 12 points behind). Null otherwise.
export function raceWarningStage(state) {
  if (state.ending || !raceStanding(state).near) return null;
  const days = eraDaysLeft(state);
  const at = raceWarnDays(state.era);
  if (days <= at.second) return 'second';
  if (days <= at.first) return 'first';
  return null;
}

// The Head of Research raises it at her desk (frames B1, B2); at the second warning the CFO adds his line.
export function raceWarning(state) {
  const stage = raceWarningStage(state);
  if (!stage) return null;
  const standing = raceStanding(state);
  const lead = `${standing.leader.name} is ${standing.shownGap} points ahead and we are ${PLACE_WORD[standing.place] ?? ordinal(standing.place)}.`;
  const say = stage === 'second'
    ? `${timeWords(eraDaysLeft(state))} left in the era. We need a model out that beats theirs, or we are the lab people used to talk about.`
    : standing.out
      ? `${lead} If the era closes like this, nobody returns our calls.`
      : `${lead} More than ${BALANCE.gateMaxGap} behind when the era closes, and nobody returns our calls.`;
  return {
    id: `race:${state.era}:${stage}`,
    race: true,
    stage,
    advisor: 'research',
    say,
    aside: stage === 'second' ? { advisor: 'cfo', say: 'I have drafted the press release. Both versions.' } : null,
  };
}

// The race as Priya draws it on the office whiteboard (frames D1, D2), from the first warning to the era's end while the
// danger holds. Lanes run from the top score down; the line sits gateMaxGap points behind the leader.
export function raceBoardView(state) {
  if (!raceWarningStage(state)) return null;
  const standing = raceStanding(state);
  const lab = typeof state.labName === 'string' && state.labName.trim() ? state.labName.trim() : 'us';
  const lanes = [
    { id: 'you', name: lab, capability: state.capability, you: true },
    ...state.rivals.map((rival) => ({ id: rival.id, name: rival.name, capability: rival.capability, you: false })),
  ].sort((a, b) => b.capability - a.capability || Number(a.you) - Number(b.you))
    .map((lane) => ({ ...lane, score: standing.scores[lane.id] }));
  const spare = tenths(BALANCE.gateMaxGap - standing.shownGap);
  const { n, unit } = timeLeft(eraDaysLeft(state));
  return {
    lanes,
    leader: standing.leader.name,
    leaderCapability: standing.leader.capability,
    line: standing.leader.capability - BALANCE.gateMaxGap,
    lineLabel: `${BALANCE.gateMaxGap} behind ${standing.leader.name}`,
    ends: `era ends in ${plural(n, unit)}!!`,
    signer: lead(state, 'research').first, // the board is the Head of Research's, whoever the player hired
    note: standing.out ? `${plural(standing.fromLine, 'point')} past the line!`
      : spare > 0 ? `only ${plural(spare, 'point')} to spare!` : 'right on the line!',
    out: standing.out,
  };
}

// The board's call when the era ends with the lab left behind (frame E-left). An era whose gate holds no vote (1, 5)
// has no vote to call off, and neither has a meeting that just held a called vote (voteHeld).
export function leftBehindCall(state, { voteHeld = false } = {}) {
  const standing = raceStanding(state);
  const lab = typeof state.labName === 'string' && state.labName.trim() ? state.labName.trim() : 'Your lab';
  return {
    line: `The era is over · ${lab} finished ${ordinal(standing.place)}, ${standing.shownGap} points behind ${standing.leader.name}`,
    verdict: eraById(state.era).boardVoteAtGate && !voteHeld ? 'No vote today. The rivals moved on without you.' : 'The rivals moved on without you.',
  };
}
