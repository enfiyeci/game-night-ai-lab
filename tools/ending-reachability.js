import { enableScenarios } from '../sim/scenarios.js';
import { playRound } from './play-round.js';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, endTurn } from '../sim/turn.js';
import { cardById } from '../sim/recipe.js';
import { ENDINGS } from '../sim/endings.js';
import { STRATEGIES, eventChoices, dailyRelease } from './balance.js';
import { budgetFromSliders, levelFor, sanitizeDraft } from '../ui/logic/actions.js';
import { projectQueue } from '../ui/logic/compute.js';
import { releaseDraft, releasePayload } from '../ui/logic/release.js';

export const POLICIES = [...Object.keys(STRATEGIES), 'unchecked', 'noSummit', 'unguarded', 'diplomat'];

function uiActions(state, proposed) {
  const actions = structuredClone(proposed);
  if (actions.budget) actions.budget = budgetFromSliders(actions.budget.split, levelFor(actions.budget.spend, state.era), state.era);
  const moves = actions.moves ?? [];
  actions.moves = [];
  for (const move of moves) {
    const projected = projectQueue(state, actions);
    if (move.type === 'startRun') move.recipe = sanitizeDraft(projected, move.recipe);
    if (move.type === 'release') move.release = releasePayload(projected, releaseDraft(projected, move.release));
    actions.moves.push(move);
  }
  return actions;
}

export function endingRun(policy, seed) {
  if (!POLICIES.includes(policy)) throw new Error(`Unknown policy: ${policy}`);
  let state = enableScenarios(createInitialState({ seed }));
  // Policy exploration cannot consume the world's dice: the recorded actions replay with just the world seed.
  const decisions = createRng(seed ^ 0x514ab7);
  const world = createRng(seed);
  const transcript = [];
  const errors = [];
  for (let step = 0; step < 30 && !state.ending; step += 1) {
    const base = policy === 'diplomat' ? 'careful' : policy === 'unchecked' ? 'balancedPush' : policy === 'noSummit' ? 'balanced' : policy === 'unguarded' ? 'balancedNoGrid' : policy;
    const proposed = STRATEGIES[base](state, decisions);
    if (policy === 'diplomat') {
      for (const move of proposed.moves) if (move.type === 'summit') Object.assign(move, { proposals: ['evaluators', 'sharedSafety', 'verification'], checks: { evaluators: 3, sharedSafety: 3, verification: 3 }, promises: { east: 'inspectors', west: 'pay' } });
    }
    if (policy === 'noSummit') proposed.moves = proposed.moves.filter((move) => move.type !== 'summit');
    if (policy === 'unguarded') {
      if (state.pendingModel?.hazard) proposed.hazardChoice = 'fix';
      for (const move of proposed.moves) if (move.type === 'startRun') {
        move.recipe.picks.post = ['no-safeguards', ...move.recipe.picks.post.filter((id) => cardById(id)?.group !== 'safeguards')];
      }
    }
    if (policy === 'unchecked') {
      proposed.computeSplit.safety = 0;
      for (const move of proposed.moves) if (move.type === 'startRun') move.recipe.sliders.alignShare = 0.3;
      if (state.era >= 4) proposed.moves = proposed.moves.filter((move) => move.type !== 'release');
      proposed.addressWarnings = [];
      if (state.pendingModel?.hazard) proposed.hazardChoice = 'fix';
      proposed.eventChoices = Object.fromEntries(state.pendingEvents.map((event) => [event.id, event.choices.at(-1).id]));
      if (proposed.automation) proposed.automation.checks = { reviewers: 0, monitors: 0, aiReview: false };
    }
    const actions = uiActions(state, proposed);
    const result = playRound(state, actions, world, (current) => eventChoices(current, policy === 'unchecked' ? 'speed' : ['careful', 'carefulNoGrid'].includes(base) ? 'careful' : base === 'safety' ? 'safety' : ['speed', 'random'].includes(base) ? base : 'balanced', decisions), { dailyActions: (current) => dailyRelease(base, current) });
    transcript.push(...result.transcript);
    errors.push(...result.errors.map((error) => ({ turn: state.turn, error })));
    state = result.state;
  }
  return { policy, seed, ending: state.ending, era: state.era, turns: state.turn, errors, transcript };
}

export function replayEnding({ seed, transcript }) {
  const rng = createRng(seed);
  let state = enableScenarios(createInitialState({ seed }));
  const errors = [];
  for (const step of transcript) {
    if (state.day < step.day) {
      const moved = advanceDays(state, step.day - state.day, rng);
      state = moved.state; errors.push(...moved.errors);
    }
    if (step.actions) {
      const result = applyActions(state, step.actions, rng);
      errors.push(...result.errors); state = result.state;
    }
  }
  return { ending: state.ending, errors };
}

export function probeEndings(seeds = 100) {
  const witnesses = {};
  const counts = {};
  let rejectedRuns = 0;
  for (const policy of POLICIES) {
    counts[policy] = {};
    for (let seed = 1; seed <= seeds; seed += 1) {
      const run = endingRun(policy, seed);
      if (run.errors.length) { rejectedRuns += 1; continue; }
      counts[policy][run.ending ?? 'unfinished'] = (counts[policy][run.ending ?? 'unfinished'] ?? 0) + 1;
      if (run.ending && !witnesses[run.ending]) {
        const replay = replayEnding(run);
        if (replay.errors.length || replay.ending !== run.ending) throw new Error(`Replay mismatch: ${policy}/${seed}`);
        witnesses[run.ending] = { policy, seed, era: run.era, turns: run.turns, actions: run.transcript };
      }
    }
  }
  return { seedsPerPolicy: seeds, policies: POLICIES, rejectedRuns, witnesses, missing: Object.keys(ENDINGS).filter((ending) => !witnesses[ending]), counts };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(probeEndings(Number(process.argv[2] ?? 100)), null, 2));
