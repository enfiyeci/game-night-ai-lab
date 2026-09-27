import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { scoreLaunch, evalGaming, testFor, testScore, retiredTests } from '../sim/launch.js';
import { BENCHMARKS, TEST_WIDTH } from '../sim/data/launch.js';
import { safetySpend } from '../sim/economy.js';
import { eraScale } from '../sim/data/compute.js';

const zeroRng = { next: () => 0.5, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const plain = { capability: 60, spec: { reasoningCapable: false }, flags: [] };

test('capability benchmarks scale with capability and recipe fit', () => {
  const s = createInitialState();
  const a = scoreLaunch(s, plain, zeroRng);
  const b = scoreLaunch(s, { ...plain, spec: { reasoningCapable: true } }, zeroRng);
  const doc = (r) => r.benchmarks.find((x) => x.id === 'doctorate').shown;
  assert.equal(doc(a), testScore(30, 60 * 0.75)); // era 1 science: the Pub Quiz, mid 30
  assert.ok(doc(b) > doc(a));
  assert.equal(a.benchmarks.length, 5);
  assert.equal(a.benchmarks[0].flagship, null);
});

test('contamination inflates shown but not true coding and science scores', () => {
  const s = createInitialState();
  s.era = 2; // Patchwork scores this model in the 20s, so the bonus is not cut off at 100
  const r = scoreLaunch(s, { ...plain, flags: ['contaminated'] }, zeroRng);
  const p = r.benchmarks.find((x) => x.id === 'patchwork');
  assert.equal(p.shown - p.truth, 8);
});

test('the safety benchmark does not lie in eras 1 and 2', () => {
  for (const era of [1, 2]) {
    const s = createInitialState();
    s.era = era; s.concealedDebt = 40; s.alignmentDebt = 30;
    assert.equal(evalGaming(s, 90, []), 0);
    const g = scoreLaunch(s, { ...plain, capability: 90 }, zeroRng).benchmarks.find((x) => x.id === 'gauntlet');
    assert.equal(g.shown, g.truth);
  }
});

test('from era 3 the safety benchmark overstates safety, more with capability and era', () => {
  const s = createInitialState();
  s.concealedDebt = 40; s.alignmentDebt = 30;
  s.era = 3;
  const e3lo = evalGaming(s, 50, []);
  const e3hi = evalGaming(s, 80, []);
  s.era = 4;
  const e4hi = evalGaming(s, 80, []);
  assert.ok(e3lo > 0);
  assert.ok(e3hi > e3lo);
  assert.ok(e4hi > e3hi);
  assert.ok(e4hi <= 40, 'gaming is capped by the concealed debt');
});

test('an outside or government eval gate cuts eval gaming', () => {
  const s = createInitialState();
  s.era = 4; s.concealedDebt = 40;
  assert.ok(evalGaming(s, 80, ['thirdPartyEval']) < evalGaming(s, 80, []));
  assert.ok(evalGaming(s, 80, ['govEval']) < evalGaming(s, 80, []));
});

test('a binding evaluators deal keeps cutting eval gaming', () => {
  const s = createInitialState();
  s.era = 4;
  s.concealedDebt = 40;
  const base = evalGaming(s, 80, []);
  s.deal = { signed: {}, binding: ['evaluators'], trust: 2, collapsed: false, playerShipped: false };
  assert.equal(evalGaming(s, 80, []), base * 0.4);
});

test('interpretability spend cuts eval gaming', () => {
  const s = createInitialState();
  s.era = 4; s.concealedDebt = 40;
  const base = evalGaming(s, 80, []);
  s.compute.online = 10 * eraScale(s.era);
  s.compute.split.safety = 0.5;
  assert.ok(safetySpend(s) >= 5);
  assert.ok(evalGaming(s, 80, []) < base);
});

test('press scores are 1 to 10 with quips, and reactions are picked from flags', () => {
  const s = createInitialState();
  const r = scoreLaunch(s, { ...plain, flags: ['sycophancy', 'jailbreakWaiting'] }, zeroRng);
  assert.equal(r.press.length, 4);
  assert.ok(r.press.every((p) => p.score >= 1 && p.score <= 10 && typeof p.quip === 'string'));
  assert.ok(r.reactions.length >= 2 && r.reactions.length <= 5);
  assert.equal(r.reactions[0].handle, '@devnull_ops');
});

test('beating the last flagship is counted per capability benchmark', () => {
  const s = createInitialState();
  const [patchwork, doctorate, horizon, finalexam, gauntlet] = BENCHMARKS.map((b) => testFor(b, 1).name);
  s.lastFlagship = { name: 'Kestrel 1 Core', benchmarks: [
    { id: 'patchwork', name: patchwork, shown: 10 }, { id: 'doctorate', name: doctorate, shown: 10 },
    { id: 'horizon', name: horizon, shown: 99 }, { id: 'finalexam', name: finalexam, shown: 99 }, { id: 'gauntlet', name: gauntlet, shown: 50 },
  ] };
  const r = scoreLaunch(s, plain, zeroRng);
  assert.equal(r.beats, 2);
  assert.equal(r.benchmarks[0].flagship, 10);
});

test('capability benchmark fit stays within 0.6 to 1.0', () => {
  const s = createInitialState();
  for (const m of [plain, { ...plain, spec: { reasoningCapable: true } }, { ...plain, flags: ['agentic'] },
    { ...plain, spec: { reasoningCapable: true }, flags: ['agentic'] }]) {
    for (const b of scoreLaunch(s, m, zeroRng).benchmarks.filter((x) => x.kind === 'cap')) {
      assert.ok(b.skill >= m.capability * 0.6 && b.skill <= m.capability * 1.0, `${b.id} ${b.skill}`);
    }
  }
});

test('bugs lower the true score but not the rival bar', () => {
  const s = createInitialState();
  const patch = (r) => r.benchmarks.find((x) => x.id === 'patchwork');
  const clean = patch(scoreLaunch(s, plain, zeroRng));
  const buggy = patch(scoreLaunch(s, { ...plain, flags: ['quickEval', 'scraped'] }, zeroRng));
  assert.ok(buggy.truth < clean.truth);
  assert.equal(buggy.rival, clean.rival);
});

test('a plain launch draws four or five reactions', () => {
  const s = createInitialState();
  const r = scoreLaunch(s, plain, zeroRng);
  assert.ok(r.reactions.length >= 4 && r.reactions.length <= 5);
});

// Era-1 tests, so the flagship's scores are on the same tests as the new launch and carry over as they are.
const flagshipAt = (score) => ({
  name: 'Kestrel 3 Core',
  benchmarks: BENCHMARKS.map((b) => ({ id: b.id, name: testFor(b, 1).name, shown: b.kind === 'safety' ? 80 : score })),
});
const named = { ...plain, name: 'Kestrel 5 Core', generation: 5 };
const plainAvg = () => scoreLaunch(createInitialState(), plain, zeroRng).capAvg;

test('each skipped version number raises the critics bar by one benchmark point', () => {
  const s = createInitialState();
  for (const r of s.rivals) r.capability = 65; // a close race, so no critic sits at the 1 or 10 clamp
  s.lastFlagship = flagshipAt(plainAvg() + 3);
  const a = scoreLaunch(s, { ...named, generation: 4, skipped: 0 }, zeroRng);
  const b = scoreLaunch(s, { ...named, generation: 7, skipped: 3 }, zeroRng);
  // Precondition: no critic sits at the 1 or 10 clamp, so a shift of exactly one point shows.
  assert.ok(a.press.every((p) => p.score > 1 && p.score < 10), a.press.map((p) => p.score).join(' '));
  // Three skipped numbers raise the bar by 3 points; the press base is (capAvg - bar) / 3, so it drops by exactly 1.
  a.press.forEach((p, i) => assert.equal(b.press[i].score, p.score - 1));
});

test('a skipped number that is earned draws impressed posts first', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(plainAvg() - 22); // a gain of 22
  const r = scoreLaunch(s, { ...named, skipped: 1 }, zeroRng);
  assert.equal(r.reactions[0].handle, '@benchwatch');
  assert.equal(r.reactions[0].text, 'ok, the jump to 5 is earned. this is not a point release.');
  assert.ok(r.reactions.some((x) => x.text === "if we're skipping numbers now, our next one is 7."));
});

test('a skipped number without a real gain draws mocking posts first', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(plainAvg() - 1); // a gain of 1
  const r = scoreLaunch(s, { ...named, skipped: 1 }, zeroRng);
  assert.equal(r.reactions[0].text, 'Kestrel 5 Core? the evals read more like a 3.1');
  assert.equal(r.reactions[1].text, 'so the version number is marketing now. cool cool.');
});

test('no jump posts when no number was skipped', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(plainAvg() - 1);
  const r = scoreLaunch(s, { ...named, skipped: 0 }, zeroRng);
  assert.ok(!r.reactions.some((x) => /skipping|jump to|evals read|version number/.test(x.text)));
});

test('back-to-back launches with the same scores quote different lines', async () => {
  const { CRITICS, GENERIC_REACTIONS } = await import('../sim/data/launch.js');
  for (const critic of CRITICS) {
    for (const tier of ['high', 'mid', 'low']) assert.ok(critic.quips[tier].length >= 2, `${critic.id} ${tier}`);
  }
  assert.ok(GENERIC_REACTIONS.length >= 6);
});

// Owner 2026-09-26: the named tests change with the era, harder tests score lower, and tests last long enough to fill up.
const at = (era) => { const s = createInitialState(); s.era = era; return s; };
const row = (r, id) => r.benchmarks.find((x) => x.id === id);
const reasoning = { capability: 60, spec: { reasoningCapable: true }, flags: [] };

test('every era has exactly one test per row, and most tests run more than one era', () => {
  for (const b of BENCHMARKS) {
    for (let era = 1; era <= 5; era += 1) assert.equal(b.tests.filter((t) => era >= t.from && era <= t.to).length, 1, `${b.id} era ${era}`);
  }
  const lasting = BENCHMARKS.flatMap((b) => b.tests).filter((t) => t.to > t.from);
  assert.ok(lasting.length >= 5, `${lasting.length} tests run more than one era`);
  assert.ok(BENCHMARKS.every((b) => b.label && testFor(b, 5).from === 5), 'era 5 brings a new test on every row');
});

test('each launch row carries the name of its era\'s test', () => {
  assert.equal(row(scoreLaunch(at(1), plain, zeroRng), 'patchwork').name, 'Hello Function (coding)');
  assert.equal(row(scoreLaunch(at(3), plain, zeroRng), 'patchwork').name, 'Patchwork (coding)');
  assert.equal(row(scoreLaunch(at(3), plain, zeroRng), 'gauntlet').name, 'Scheming Sandbox (safety)');
  assert.equal(row(scoreLaunch(at(5), plain, zeroRng), 'finalexam').name, "Humanity's Actually Final Exam");
});

test('scores follow an S-curve: 50 at the test\'s mid, near 12 and 88 two widths either side', () => {
  assert.equal(testScore(55, 55), 50);
  assert.ok(testScore(55, 55 - 2 * TEST_WIDTH) <= 12 && testScore(55, 55 + 2 * TEST_WIDTH) >= 88);
  // Pub Quiz (mid 30) at a science skill of exactly 30: capability 40 x fit 0.75.
  assert.equal(row(scoreLaunch(at(1), { ...plain, capability: 40 }, zeroRng), 'doctorate').truth, 50);
});

test('a harder test scores the same model lower, and the skill behind it does not change', () => {
  const coding = [1, 2, 4, 5].map((era) => row(scoreLaunch(at(era), { ...reasoning, capability: 80 }, zeroRng), 'patchwork'));
  for (let k = 1; k < coding.length; k += 1) assert.ok(coding[k].truth < coding[k - 1].truth, coding.map((x) => x.truth).join(' '));
  assert.ok(coding.every((x) => x.skill === coding[0].skill));
  const early = scoreLaunch(at(1), reasoning, zeroRng);
  const late = scoreLaunch(at(4), reasoning, zeroRng);
  assert.equal(late.skill, early.skill);
  assert.ok(late.capAvg < early.capAvg);
});

test('a test fills up over its life: Patchwork starts low in era 2 and nears the top by the end of era 3', () => {
  const start = row(scoreLaunch(at(2), { ...reasoning, capability: 50 }, zeroRng), 'patchwork');
  const end = row(scoreLaunch(at(3), { ...reasoning, capability: 90 }, zeroRng), 'patchwork');
  assert.ok(start.truth >= 20 && start.truth <= 45, `start ${start.truth}`);
  assert.ok(end.truth >= 90, `end ${end.truth}`);
});

test('the last flagship is re-scored on a new test, and keeps its published score on a test it took', () => {
  const s = at(2);
  const old = scoreLaunch(s, reasoning, zeroRng);
  s.lastFlagship = { name: 'Kestrel 2 Core', benchmarks: old.benchmarks.map(({ id, name, shown, skill }) => ({ id, name, shown, skill })) };
  s.era = 3;
  const r = scoreLaunch(s, { ...reasoning, capability: 70 }, zeroRng);
  const coding = row(r, 'patchwork'); // Patchwork runs in eras 2 and 3
  assert.equal(coding.flagship, row(old, 'patchwork').shown);
  assert.equal(coding.newTest, false);
  const science = row(r, 'doctorate'); // the Pub Quiz retired; Frontier Sums is new in era 3
  assert.equal(science.newTest, true);
  assert.equal(science.flagship, testScore(72, row(old, 'doctorate').skill));
  assert.ok(science.flagship < row(old, 'doctorate').shown, 'the old model does worse on the harder test');
  const caps = r.benchmarks.filter((x) => x.kind === 'cap');
  assert.equal(r.flagshipAvg, caps.reduce((sum, x) => sum + x.flagship, 0) / caps.length);
});

test('at an era change, the tests that retire are listed with their replacements', () => {
  assert.deepEqual(retiredTests(1), []);
  assert.deepEqual(retiredTests(2).map((t) => t.id), ['patchwork', 'horizon', 'gauntlet']);
  assert.deepEqual(retiredTests(3).map((t) => t.id), ['doctorate', 'finalexam', 'gauntlet']);
  assert.equal(retiredTests(5).length, 5);
  const [first] = retiredTests(2);
  assert.equal(first.from, 'Hello Function (coding)');
  assert.equal(first.to, 'Patchwork (coding)');
});
