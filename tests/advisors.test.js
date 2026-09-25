import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { advisorReadings, recordAdvisors } from '../sim/advisors.js';
import { ADVISOR_LINES } from '../sim/data/advisorLines.js';

const quiet = { normal: (mean) => mean };
const byId = (rs) => Object.fromEntries(rs.map((r) => [r.id, r]));

test('Head of Safety reads high and can be fooled', () => {
  const s = createInitialState();
  assert.equal(byId(advisorReadings(s, quiet)).safety.band, 'calm'); // 5 + 10
  s.alignmentDebt = 55;
  assert.equal(byId(advisorReadings(s, quiet)).safety.band, 'alarmed'); // 65
  s.alignmentDebt = 45;
  s.perceivedAdOffset = 20;
  const r = byId(advisorReadings(s, quiet)).safety;
  assert.equal(r.band, 'uneasy'); // 35
  assert.equal(r.truth, 45);
});

test('CFO argues from trailing burn', () => {
  const s = createInitialState();
  s.burnTrailing = 50;
  s.burnPlanned = 200;
  const cfo = byId(advisorReadings(s, quiet)).cfo;
  assert.equal(cfo.estimate, 20);
  assert.equal(cfo.band, 'calm');
  assert.equal(cfo.truth, 5);
});

test('Head of Research is optimistic and notices weird results only late', () => {
  const s = createInitialState();
  s.capability = 20; // leader 26, gap 6, reads −4
  assert.equal(byId(advisorReadings(s, quiet)).research.band, 'calm');
  s.alignmentDebt = 70;
  assert.ok(byId(advisorReadings(s, quiet)).research.line.includes(ADVISOR_LINES.research.weird));
});

test('advisor lines never contain numbers', () => {
  for (const [id, bands] of Object.entries(ADVISOR_LINES)) {
    for (const line of Object.values(bands).flat()) assert.ok(!/\d/.test(line), `${id}: ${line}`);
  }
});

test('readings are recorded for the end-of-run reveal', () => {
  const s = createInitialState();
  recordAdvisors(s, quiet);
  assert.equal(s.advisorHistory.length, 1);
  assert.equal(s.advisorHistory[0].readings.length, 4);
  assert.equal(s.lastBriefing.length, 4);
});
