import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { TEAM_OF, teamBusyError } from '../sim/teams.js';

test('every move type has a team', () => {
  for (const type of ['startRun', 'release', 'deal', 'queueOrder', 'buildSite', 'raise', 'research', 'emergency', 'summit', 'meeting']) {
    assert.ok(TEAM_OF[type], type);
  }
});

test('a team that acted this round is busy until the next round mark', () => {
  const s = createInitialState({ seed: 1 });
  s.round.teams.cfo = 'deal';
  assert.match(teamBusyError(s, { type: 'raise' }), /finance team is busy until Apr 2023/);
});

test('research is busy while a training run is under way', () => {
  const s = createInitialState({ seed: 1 });
  s.activeRun = { turnsLeft: 1 };
  assert.match(teamBusyError(s, { type: 'research', techId: 'x' }), /research team is busy/);
});

test('when you are the busy one, the message says "you are", not "the you is"', () => {
  const s = createInitialState({ seed: 1 });
  s.round.teams.ceo = 'meeting';
  assert.equal(teamBusyError(s, { type: 'meeting' }), 'you are busy until Apr 2023');
});
