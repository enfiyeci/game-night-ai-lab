import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { roundSpan } from '../sim/time.js';
import { landingDay, stampLandings } from '../sim/landings.js';

test('a landing day falls inside its round and never in the past', () => {
  const s = createInitialState({ seed: 4 });
  const { start, end } = roundSpan(2);
  for (const key of ['a', 'b', 'c', 'd']) {
    const day = landingDay(s, key, 2);
    assert.ok(day > start && day <= end, `${key}: ${day}`);
    assert.equal(landingDay(s, key, 2), day); // same seed and key, same day
  }
  s.day = 150;
  const late = landingDay(s, 'a', 1);
  assert.ok(late > 150 && late <= roundSpan(1).end);
  s.day = 400;
  assert.equal(landingDay(s, 'a', 1), roundSpan(1).end); // a round already over lands at once
});

test('stamping gives each scheduled item a day and restamps a moved one', () => {
  const s = createInitialState({ seed: 4 });
  s.legalCases.push({ cost: 50, dueTurn: 3, source: 'test' });
  s.power.sites.push({ id: 'gas-t', source: 'gas', units: 40, arrivesTurn: 3, online: false, oppositionCut: null });
  stampLandings(s);
  const [legal] = s.legalCases;
  const site = s.power.sites.find((x) => x.id === 'gas-t');
  assert.equal(legal.landsFor, 3);
  assert.ok(legal.landsDay > roundSpan(3).start && legal.landsDay <= roundSpan(3).end);
  assert.equal(site.landsFor, 2);
  site.arrivesTurn += 1; // an event delays the build
  stampLandings(s);
  assert.equal(site.landsFor, 3);
  assert.ok(site.landsDay > roundSpan(3).start);
});
