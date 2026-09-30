import { enableScenarios } from '../sim/scenarios.js';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, endTurn } from '../sim/turn.js';
import { cardById } from '../sim/recipe.js';
import { sanitizeDraft, spendFor } from '../ui/logic/actions.js';
import { projectQueue } from '../ui/logic/compute.js';
import { endingRun, replayEnding } from '../tools/ending-reachability.js';

test('an ending witness replays from its initial seed without policy dice or state injection', () => {
  const witness = endingRun('balanced', 1);
  assert.deepEqual(witness.errors, []);
  assert.ok(witness.ending);
  assert.deepEqual(replayEnding(witness), { ending: witness.ending, errors: [] });
  assert.deepEqual(endingRun('balanced', 1), witness);
});

test('ending probes use selectable budgets and sanitized, visible recipe and release cards', () => {
  const witness = endingRun('unguarded', 2);
  const rng = createRng(witness.seed);
  let state = enableScenarios(createInitialState({ seed: witness.seed }));
  for (const step of witness.transcript) {
    if (state.day < step.day) state = advanceDays(state, step.day - state.day, rng).state;
    const actions = step.actions;
    if (!actions) continue;
    if (actions.budget) assert.ok(['lean', 'steady', 'aggressive'].some((level) => spendFor(level, state.era) === actions.budget.spend));
    const previous = [];
    for (const move of actions.moves) {
      const projected = projectQueue(state, { ...actions, moves: previous });
      if (move.type === 'startRun') {
        assert.deepEqual(sanitizeDraft(projected, move.recipe), move.recipe);
        assert.ok(Object.values(move.recipe.picks).flat().every((id) => !cardById(id).hidden));
      }
      if (move.type === 'release') assert.ok(move.release.picks.every((id) => !cardById(id).hidden));
      previous.push(move);
    }
    const result = applyActions(state, actions, rng);
    assert.deepEqual(result.errors, []);
    state = result.state;
  }
  assert.equal(state.ending, witness.ending);
});


test('all eleven endings are reachable by recorded legal player actions', () => {
  const witnesses = JSON.parse(readFileSync(new URL('./fixtures/ending-witnesses.json', import.meta.url), 'utf8'));
  const expected = ['acquihire', 'boardRemoved', 'misalignment', 'misuse', 'leftBehind', 'quietTakeover', 'rivalDisaster', 'aligned', 'pacingDeal', 'pyrrhic', 'overtaken'];
  assert.deepEqual(Object.keys(witnesses).sort(), expected.sort());
  for (const [ending, witness] of Object.entries(witnesses)) {
    assert.deepEqual(replayEnding(witness), { ending, errors: [] }, `${ending}: ${witness.policy}/${witness.seed}`);
  }
});
