import { inDangerZone, monthlyRevenue, projectBurn } from '../../sim/economy.js';

export const CASH_WARNING_MONTHS = { watch: 6, urgent: 3, critical: 1 };

export function cashWarning(state) {
  if (state.ending) return null;
  // Actions change costs immediately; burnPlanned is refreshed only when a day passes.
  const netBurn = projectBurn(state) - monthlyRevenue(state);
  const runway = state.cash <= 0 ? 0 : netBurn <= 0 ? Infinity : state.cash / netBurn;
  if (runway > CASH_WARNING_MONTHS.watch) return null;
  const level = runway <= CASH_WARNING_MONTHS.critical ? 'critical'
    : runway <= CASH_WARNING_MONTHS.urgent ? 'urgent' : 'watch';
  const emergency = inDangerZone(state);
  const roundAvailable = state.era >= 2 && state.flags.lastRoundEra !== state.era;
  return { level, runway, netBurn, cash: state.cash, emergency, fundingAvailable: emergency || roundAvailable };
}

// Escalation interrupts once per severity; recovery above six months starts a new warning episode.
export function cashWarningCheckpoint(previous, warning) {
  if (!warning) return { checkpoint: 0, pause: false };
  const checkpoint = { watch: 1, urgent: 2, critical: 3 }[warning.level];
  return { checkpoint: Math.max(previous, checkpoint), pause: checkpoint >= 2 && checkpoint > previous };
}
