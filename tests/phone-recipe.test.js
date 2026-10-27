import assert from 'node:assert/strict';
import test from 'node:test';

import { pickPrice, teamSummary } from '../ui/phoneRecipe.js';

const row = (name, mood) => ({ name, mood });

test('team row names the leads who are not calm and counts the rest', () => {
  assert.equal(teamSummary([row('Head of Research', 'Calm'), row('Head of Safety', 'Calm'), row('CFO', 'Alarmed'), row('Policy and Comms', 'Calm')]),
    'Team · CFO alarmed, three calm');
  assert.equal(teamSummary([row('Head of Research', 'Worried'), row('Head of Safety', 'Calm'), row('CFO', 'Alarmed'), row('Policy and Comms', 'Calm')]),
    'Team · Head of Research worried, CFO alarmed, two calm');
  assert.equal(teamSummary([row('Head of Research', 'Uneasy'), row('CFO', 'Alarmed')]), 'Team · Head of Research uneasy, CFO alarmed');
});

test('team row when everyone is calm, or before the first briefing', () => {
  const four = ['Head of Research', 'Head of Safety', 'CFO', 'Policy and Comms'];
  assert.equal(teamSummary(four.map((name) => row(name, 'Calm'))), 'Team · all four calm');
  assert.equal(teamSummary(four.map((name) => row(name, 'No briefing yet'))), 'Team · no briefing yet');
  assert.equal(teamSummary([row('Head of Research', 'Calm'), row('CFO', 'No briefing yet')]), 'Team · one calm');
});

test('a pick row shows the price part of the socket line, dots and all', () => {
  assert.equal(pickPrice('Instruction data · $15M'), '$15M');
  assert.equal(pickPrice('Feedback · $20M · +15% compute'), '$20M · +15% compute');
  assert.equal(pickPrice('Reinforcement learning · Free'), 'Free');
  assert.equal(pickPrice('No dot here'), '');
});
