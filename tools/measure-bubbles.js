// Running-clock seconds at x1; paused dialogs/decisions are excluded, as in ui/clock.js.
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, MAX_MOVES } from '../sim/turn.js';
import { ROUND_DAYS } from '../sim/time.js';
import { STRATEGIES } from './balance.js';
import { badgeCounts, bubbleCounts, bubbleSpawns } from '../ui/logic/training.js';

const seeds = Number(process.argv[2] ?? 20);
assert.ok(Number.isInteger(seeds) && seeds > 0);
const names = ['balanced', 'safety', 'speed'];
const totals = new Map([1, 3].map((era) => [era, { seconds: 0, trainingSeconds: 0, before: 0, after: 0, completed: 0 }]));
const grows = (from, to) => to.capability >= from.capability && to.alignment >= from.alignment;
const delta = (from, to) => grows(from, to) ? to.capability - from.capability + to.alignment - from.alignment : 0;

for (const name of names) {
  const strategy = STRATEGIES[name];
  for (let seed = 1; seed <= seeds; seed += 1) {
    const rng = createRng(seed);
    let state = createInitialState({ seed });
    let lastTurn = -1;
    let share = 0;
    let shown = badgeCounts(state, share);
    let visual = bubbleCounts(state, share);
    const count = () => {
      if (state.activeRun) share = state.activeRun.recipe.sliders.alignShare;
      const badges = badgeCounts(state, share);
      const bubbles = bubbleCounts(state, share);
      const row = totals.get(state.era);
      if (row) {
        row.before += delta(shown, badges);
        if (grows(shown, badges) && grows(visual, bubbles)) row.after += bubbleSpawns(visual, bubbles).length;
      }
      shown = badges;
      visual = bubbles;
    };
    for (let guard = 0; guard < 5000 && !state.ending && state.era <= 3; guard += 1) {
      const first = lastTurn !== state.turn;
      const landed = (card) => card.landsAt == null || card.landsAt <= state.day;
      if (first || state.pendingModel || !state.activeRun || state.meeting || state.pendingEvents.some(landed)) {
        lastTurn = state.turn;
        const full = strategy(state, rng);
        const actions = { moves: [], eventChoices: {} };
        if (first) {
          for (const key of ['budget', 'computeSplit', 'automation', 'pledge', 'constitutionDraft', 'addressWarnings']) {
            if (full[key] !== undefined) actions[key] = full[key];
          }
        }
        for (const key of ['presidentAnswers', 'hazardChoice']) if (full[key] !== undefined) actions[key] = full[key];
        for (const [id, choice] of Object.entries(full.eventChoices ?? {})) {
          if (state.pendingEvents.some((card) => card.id === id && landed(card))) actions.eventChoices[id] = choice;
        }
        actions.moves = (full.moves ?? []).filter((move) => first || ['startRun', 'release', 'meeting'].includes(move.type)).slice(0, MAX_MOVES - state.round.moves);
        state = applyActions(state, actions, rng).state;
        count();
      }
      const row = totals.get(state.era);
      const dt = 90 / ROUND_DAYS[state.era];
      const training = Boolean(state.activeRun);
      const result = advanceDays(state, 1, rng);
      state = result.state;
      count();
      if (row) {
        row.seconds += dt;
        if (training) row.trainingSeconds += dt;
        row.completed += result.events.filter((e) => e.type === 'runComplete').length;
      }
    }
  }
}
console.log(`Seeds 1-${seeds}; strategies ${names.join(', ')}; x1 (90 seconds/round).`);
console.log('Before: original one-per-badge-increase behavior. After: fractional-progress spawns, with the same reset rules.');
console.log('| Era | Completed runs | Training minutes | All running minutes | Before bubbles | After bubbles | Before/min training | After/min training | Before/min overall | After/min overall |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const [era, row] of totals) {
  const rate = (count, seconds) => (count * 60 / seconds).toFixed(2);
  console.log(`| ${era} | ${row.completed} | ${(row.trainingSeconds / 60).toFixed(2)} | ${(row.seconds / 60).toFixed(2)} | ${row.before} | ${row.after} | ${rate(row.before, row.trainingSeconds)} | ${rate(row.after, row.trainingSeconds)} | ${rate(row.before, row.seconds)} | ${rate(row.after, row.seconds)} |`);
}
