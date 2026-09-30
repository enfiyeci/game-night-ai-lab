import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { ERAS, eraById } from '../sim/data/eras.js';
import { rank, gapToLeader, rivalsTurn, leastCarefulRival } from '../sim/rivals.js';
import { BALANCE } from '../sim/balance.js';
import { SIZE_CAP } from '../sim/recipe.js';
import { RIVAL_EDGE } from '../sim/data/race.js';

test('five eras with accelerating turn length', () => {
  assert.equal(ERAS.length, 5);
  assert.deepEqual(ERAS.map((e) => e.monthsPerTurn), [3, 3, 1, 1, 0.25]);
  assert.equal(eraById(3).name, 'Reasoning and agents');
  assert.deepEqual(ERAS.map((e) => e.boardVoteAtGate), [false, true, true, true, false]);
});

test('initial state matches the spec', () => {
  const s = createInitialState({ seed: 9 });
  assert.equal(s.cash, 1000);
  assert.equal(s.compute.online, 10);
  assert.equal(s.capability, 20);
  assert.deepEqual(s.board, [70, 65, 60, 65, 70, 60, 70]);
  assert.equal(s.alignmentDebt, 5);
  assert.equal(s.raceHeat, 20);
  assert.equal(s.era, 1);
  assert.equal(s.rivals.length, 4);
  assert.equal(s.deal, null);
  assert.equal(s.ending, null);
});

test('rank and gap against rivals', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 25;
  assert.equal(rank(s), 2); // only OpenBrain (26) is ahead
  assert.equal(gapToLeader(s), 1);
  assert.equal(leastCarefulRival(s).id, 'openbrain');
});

test('a rival that finishes its cycle releases and heats the race', () => {
  const s = createInitialState({ seed: 1 });
  const fake = { next: () => 0, int: () => 0 };
  s.rivals[0].progress = 0.99;
  const heat = s.raceHeat;
  const out = rivalsTurn(s, fake);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'openbrain');
  const size = 'medium'; // OpenBrain's 14 starting units train about 8.7: Medium
  const gain = (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + 2 - 2) * (1 - 0.5 * (0.1 + 0.2 * 0.25));
  assert.ok(Math.abs(s.rivals[0].capability - (26 + gain)) < 1e-9);
  assert.ok(s.raceHeat > heat);
});

test('rival capability and reported gain keep counting past 100', () => {
  const s = createInitialState({ seed: 1 });
  const fake = { next: () => 0, int: () => 0 };
  s.rivals[0].capability = 99;
  s.rivals[0].progress = 0.99;
  const [release] = rivalsTurn(s, fake);
  assert.ok(release.gain > 1);
  assert.ok(Math.abs(s.rivals[0].capability - (99 + release.gain)) < 1e-9);
});
