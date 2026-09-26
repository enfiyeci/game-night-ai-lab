import { nextRoundDay, storyDate } from './time.js';

export const TEAMS = {
  research: 'research team',
  safety: 'safety team',
  policy: 'policy team',
  cfo: 'finance team',
  ceo: 'you',
};

export const TEAM_OF = {
  startRun: 'research', research: 'research', deployInternal: 'research', stopInternal: 'research',
  amendConstitution: 'safety',
  release: 'policy', summit: 'policy',
  deal: 'cfo', queueOrder: 'cfo', buildSite: 'cfo', raise: 'cfo', emergency: 'cfo',
  meeting: 'ceo',
};

export function teamBusyError(state, move) {
  const team = TEAM_OF[move.type];
  if (!team) return null;
  if (team === 'research' && state.activeRun && move.type !== 'stopInternal') return 'the research team is busy with the training run';
  if (state.round.teams[team]) return `the ${TEAMS[team]} is busy until ${storyDate(nextRoundDay(state)).label}`;
  return null;
}
