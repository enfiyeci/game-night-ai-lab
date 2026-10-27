import { activeModels } from './serving.js';
import { rank } from './rivals.js';

// Earned beats from the player's own models (reward-loops O3, Arda's pick 2026-10-26): users passing 1M, 10M and
// 100M, a model paying back what it cost to train and launch, taking the top of the leaderboard and losing it. Each
// fires once, as an event the "Just now" toast, the feed and the pacing director read; none stops the clock. The
// leaderboard place is watched from the start, so a first release that takes #1 counts.
const USER_MARKS = [1e6, 1e7, 1e8];

const leaderName = (state) => state.rivals.reduce((top, rival) => (rival.capability > top.capability ? rival : top)).name;

export function milestonesTick(state) {
  if (state.ending) return [];
  const book = (state.milestones ??= { users: 0, paidBack: [], rank: null });
  const events = [];
  const released = state.models.some((model) => Number.isFinite(model.releasedTurn));
  const place = rank(state);
  if (released && book.rank != null && place !== book.rank && (place === 1 || book.rank === 1)) {
    events.push(place === 1 ? { type: 'tookFirst' } : { type: 'lostFirst', leader: leaderName(state) });
  }
  book.rank = place;
  if (!released) return events;
  const users = activeModels(state).reduce((sum, model) => sum + (model.users ?? 0), 0);
  const passed = USER_MARKS.filter((mark) => users >= mark).at(-1) ?? 0;
  if (passed > book.users) {
    book.users = passed;
    events.push({ type: 'usersMilestone', users: passed });
  }
  // Only models with a training figure: older saves have none, and a missing cost is not a paid-back one.
  for (const model of state.models) {
    if (!Number.isFinite(model.trainingCost) || book.paidBack.includes(model.name)) continue;
    if ((model.earned ?? 0) - (model.servingSpent ?? 0) - model.trainingCost - (model.launchCost ?? 0) < 0) continue;
    book.paidBack.push(model.name);
    events.push({ type: 'paidBack', name: model.name });
  }
  return events;
}
