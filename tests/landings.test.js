import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { roundSpan } from '../sim/time.js';
import { landingDay, stampLandings } from '../sim/landings.js';
import { createRng } from '../sim/rng.js';
import { advanceDays, applyActions } from '../sim/turn.js';
import { rivalsTurn, landRivals } from '../sim/rivals.js';
import { createPresidentPromise } from '../sim/promises.js';

function advanceTo(s, day, rng) {
  let events = [];
  while (s.day < day) {
    const r = advanceDays(s, 1, rng);
    s = r.state;
    events = r.events;
  }
  return { s, events };
}

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
  assert.equal(legal.landsFor, 3);
  assert.ok(legal.landsDay > roundSpan(3).start && legal.landsDay <= roundSpan(3).end);
  assert.equal(s.power.sites.find((x) => x.id === 'gas-t').landsDay, undefined); // sites stay on the mark
  legal.dueTurn += 1; // an event delays the case
  stampLandings(s);
  assert.equal(legal.landsFor, 4);
  assert.ok(legal.landsDay > roundSpan(4).start && legal.landsDay <= roundSpan(4).end);
});

test('a rolled launch waits for its day in the next round', () => {
  const s = createInitialState({ seed: 1 });
  const fake = { next: () => 0, int: () => 0 };
  s.rivals[0].progress = 0.99;
  const cap = s.rivals[0].capability;
  const rolled = rivalsTurn(s, fake, { deferTo: 1 });
  assert.equal(rolled.length, 1);
  assert.equal(s.rivals[0].capability, cap); // nothing yet
  const [launch] = s.rivalLaunches;
  assert.ok(launch.day > roundSpan(1).start && launch.day <= roundSpan(1).end);
  s.day = launch.day - 1;
  assert.deepEqual(landRivals(s), []);
  s.day = launch.day;
  const [landed] = landRivals(s);
  assert.equal(landed.id, 'openbrain');
  assert.ok(s.rivals[0].capability > cap);
  assert.deepEqual(s.rivalLaunchesThisRound.map((x) => x.id), ['openbrain']);
});

test('rival launches spread across the days, not only on marks', () => {
  const rng = createRng(3);
  let s = createInitialState({ seed: 3 });
  const marks = new Set(Array.from({ length: 20 }, (_, r) => roundSpan(r).end));
  const days = [];
  while (!s.ending && s.turn < 8) {
    const r = advanceDays(s, 1, rng);
    s = r.state;
    for (const e of r.events) if (e.type === 'rivalRelease') days.push(s.day);
  }
  assert.ok(days.length >= 3, `launches: ${days}`);
  assert.ok(days.some((day) => !marks.has(day)), `launch days: ${days}`);
});

test('a lawsuit is billed on its landing day, inside its round', () => {
  const rng = createRng(5);
  let s = createInitialState({ seed: 5 });
  s.legalCases.push({ cost: 50, dueTurn: 1, source: 'test' });
  s = applyActions(s, {}, rng).state;
  const due = s.legalCases.find((c) => c.source === 'test').landsDay;
  assert.ok(due > roundSpan(1).start && due <= roundSpan(1).end);
  let r = advanceTo(s, due - 1, rng);
  assert.ok(r.s.legalCases.some((c) => c.source === 'test'));
  r = advanceTo(r.s, due, rng);
  assert.ok(r.events.some((e) => e.type === 'lawsuitPaid' && e.source === 'test'));
  assert.ok(!r.s.legalCases.some((c) => c.source === 'test'));
});

test('a kept President promise is thanked on its landing day', () => {
  const rng = createRng(6);
  let s = advanceDays(createInitialState({ seed: 6 }), 91, rng).state; // the first mark sets the default constitution
  const promise = createPresidentPromise('killSwitch', 'second', s.turn, s); // due 2 rounds on; kept while 'accept-shutdown' holds
  s.promises.push(promise);
  s = applyActions(s, {}, rng).state;
  const day = s.promises.at(-1).landsDay;
  let r = advanceTo(s, day - 1, rng);
  assert.equal(r.s.promises.at(-1).status, 'open');
  r = advanceTo(r.s, day, rng);
  assert.equal(r.s.promises.at(-1).status, 'kept');
});

test('a landing between marks keeps trust and favor in range', () => {
  const rng = createRng(5);
  let s = createInitialState({ seed: 5 });
  s.legalCases.push({ cost: 50, dueTurn: 1, source: 'test' });
  s = applyActions(s, {}, rng).state;
  const due = s.legalCases.find((c) => c.source === 'test').landsDay;
  let r = advanceTo(s, due - 1, rng);
  r.s.publicTrust = 1;
  r = advanceTo(r.s, due, rng);
  assert.ok(r.events.some((e) => e.type === 'lawsuitPaid' && e.source === 'test'));
  assert.equal(r.s.publicTrust, 0);
});
