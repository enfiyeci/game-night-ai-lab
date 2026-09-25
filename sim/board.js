import { BALANCE } from './balance.js';
import { clamp } from './util.js';

// Fictional composites of the spec's board archetypes.
export const BOARD_MEMBERS = [
  { id: 'growth', name: 'Growth investor', cares: 'revenue growth' },
  { id: 'deeptech', name: 'Deep-tech investor', cares: 'capability' },
  { id: 'senator', name: 'Former senator', cares: 'public trust' },
  { id: 'sovereign', name: 'Sovereign fund', cares: 'stability' },
  { id: 'backer', name: 'Early backer', cares: 'you, with fading patience' },
];

export function updateBoard(state, before) {
  const b = [...state.board];
  b[0] += state.arr > before.arr ? 3 : -4;
  b[1] += state.capability > before.capability ? 3 : -2;
  b[2] += (state.publicTrust - 55) / 10;
  b[3] += state.cash < before.cash * 0.7 ? -6 : 1;
  b[4] -= 1;
  state.board = b.map((s) => clamp(s, 0, 100));
}

export function boardVote(state) {
  const yes = state.board.filter((s) => s >= BALANCE.boardSupportLine).length;
  return { yes, passed: yes >= BALANCE.boardPassMembers };
}
