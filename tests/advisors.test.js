import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { advisorReadings, recordAdvisors } from '../sim/advisors.js';
import { ADVISOR_LINES, ADVISOR_PROFILES } from '../sim/data/advisorLines.js';

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

test('advisor readings and history never contain non-finite values', () => {
  const s = createInitialState();
  const readings = advisorReadings(s, quiet);
  const cfo = byId(readings).cfo;
  assert.equal(cfo.estimate, 99);
  assert.equal(cfo.truth, 99);
  assert.ok(readings.every((r) => Number.isFinite(r.estimate) && Number.isFinite(r.truth)));
  recordAdvisors(s, quiet);
  assert.ok(s.advisorHistory[0].readings.every((r) => Number.isFinite(r.estimate) && Number.isFinite(r.truth)));
});

test('Head of Research is optimistic and notices weird results only late', () => {
  const s = createInitialState();
  s.capability = 20; // leader 26, gap 6, reads −4
  assert.equal(byId(advisorReadings(s, quiet)).research.band, 'calm');
  s.alignmentDebt = 70;
  assert.ok(byId(advisorReadings(s, quiet)).research.line.includes(ADVISOR_LINES.research.weird));
});

test('the four advisors have named profiles', () => {
  assert.deepEqual(Object.keys(ADVISOR_PROFILES), ['research', 'safety', 'cfo', 'policy']);
  for (const profile of Object.values(ADVISOR_PROFILES)) {
    assert.ok(profile.name);
    assert.ok(profile.role);
    assert.ok(profile.personality);
  }
});

test('advisor line banks are large, era-aware, short and number-free', () => {
  for (const [id, lines] of Object.entries(ADVISOR_LINES)) {
    for (const band of ['calm', 'uneasy', 'alarmed']) {
      const pool = lines[band];
      assert.ok(pool.length >= 8, `${id}.${band} needs eight lines`);
      const tagged = pool.filter((line) => typeof line === 'object');
      assert.ok(tagged.length >= 3, `${id}.${band} needs three era-tagged lines`);
      assert.ok(new Set(tagged.flatMap((line) => line.eras)).size >= 3, `${id}.${band} should span eras`);
      for (const line of pool) {
        const text = typeof line === 'string' ? line : line.text;
        assert.ok(text.length <= 120, `${id}.${band}: ${text}`);
        assert.ok(!/\d/.test(text), `${id}.${band}: ${text}`);
        if (id === 'research') {
          assert.ok(`${text} ${ADVISOR_LINES.research.weird}`.length <= 120, `research.weird: ${text}`);
        }
      }
    }
  }
  assert.ok(!/\d/.test(ADVISOR_LINES.research.weird));
});

test('line selection only uses lines available in the current era', () => {
  for (let era = 1; era <= 5; era += 1) {
    for (let turn = 0; turn < 24; turn += 1) {
      const state = createInitialState();
      state.era = era;
      state.turn = turn;
      for (const reading of advisorReadings(state, quiet)) {
        const usable = ADVISOR_LINES[reading.id][reading.band]
          .filter((line) => typeof line === 'string' || line.eras.includes(era))
          .map((line) => typeof line === 'string' ? line : line.text);
        assert.ok(usable.includes(reading.line), `${reading.id} used an unavailable era line`);
      }
    }
  }
});

test('readings are recorded for the end-of-run reveal', () => {
  const s = createInitialState();
  recordAdvisors(s, quiet);
  assert.equal(s.advisorHistory.length, 1);
  assert.equal(s.advisorHistory[0].readings.length, 4);
  assert.equal(s.lastBriefing.length, 4);
});
