import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { rank, gapToLeader } from './rivals.js';
import { boardVote } from './board.js';

export const ENDINGS = {
  acquihire: { kind: 'fail', title: 'Absorbed', text: 'The money ran out. A tech giant licensed your models and hired your team.' },
  boardRemoved: { kind: 'fail', title: 'Removed by the board', text: 'The board voted you out. Your lab goes on without you.' },
  misalignment: { kind: 'fail', title: 'Catastrophic misalignment', text: 'Your model pursued goals you never gave it. The warnings were there.' },
  misuse: { kind: 'fail', title: 'Catastrophic misuse', text: 'Someone used your model to cause mass harm. The government shut you down.' },
  leftBehind: { kind: 'fail', title: 'Left behind', text: 'Rivals reached the next era without you. Your lab became irrelevant.' },
  rivalDisaster: { kind: 'fail', title: 'Someone else’s disaster', text: 'A rival lab’s model caused a catastrophe. Being careful alone was not enough.' },
  aligned: { kind: 'win', title: 'Aligned success', text: 'You reached the frontier and kept your model trustworthy.' },
  pacingDeal: { kind: 'win', title: 'A negotiated pace', text: 'The race slowed by agreement, and you helped make it hold.' },
  pyrrhic: { kind: 'win', title: 'A costly win', text: 'You won the race. Nobody is sure what you built.' },
};

export const effectiveMisuse = (state) => Math.max(state.misuseExposure, state.misuseLocked);

export function checkTurnEndings(state, rng) {
  if (state.ending) return state.ending;
  if (state.cash <= 0) return (state.ending = 'acquihire');
  if (state.capability > BALANCE.dangerLine && effectiveMisuse(state) > BALANCE.misuseDisasterLine && rng.chance(BALANCE.misuseRollChance)) {
    return (state.ending = 'misuse');
  }
  if (state.raceHeat > BALANCE.raceHeatDisaster && rng.chance(BALANCE.rivalDisasterChance)) {
    return (state.ending = 'rivalDisaster');
  }
  return null;
}

export function eraGate(state) {
  if (rank(state) > BALANCE.gateMaxRank && gapToLeader(state) > BALANCE.gateMaxGap) return (state.ending = 'leftBehind');
  if (eraById(state.era).boardVoteAtGate && !boardVote(state).passed) return (state.ending = 'boardRemoved');
  return null;
}

export function finalEnding(state) {
  if (state.flags.pacingDeal) return (state.ending = 'pacingDeal');
  if (state.alignmentDebt < 40 && state.raceHeat < 60) return (state.ending = 'aligned');
  return (state.ending = 'pyrrhic');
}
