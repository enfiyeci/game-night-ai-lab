import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { scoreLaunch, evalGaming } from '../sim/launch.js';

const zeroRng = { next: () => 0.5, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const plain = { capability: 60, spec: { reasoningCapable: false }, flags: [] };

test('capability benchmarks scale with capability and recipe fit', () => {
  const s = createInitialState();
  const a = scoreLaunch(s, plain, zeroRng);
  const b = scoreLaunch(s, { ...plain, spec: { reasoningCapable: true } }, zeroRng);
  const doc = (r) => r.benchmarks.find((x) => x.id === 'doctorate').shown;
  assert.equal(doc(a), Math.round(60 * 0.75));
  assert.ok(doc(b) > doc(a));
  assert.equal(a.benchmarks.length, 5);
  assert.equal(a.benchmarks[0].flagship, null);
});

test('contamination inflates shown but not true coding and science scores', () => {
  const s = createInitialState();
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
  s.budget.split = { training: 0.2, safety: 0.3, security: 0.1, product: 0.2, talent: 0.2 };
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
  s.lastFlagship = { name: 'Kestrel 1 Core', benchmarks: [
    { id: 'patchwork', shown: 10 }, { id: 'doctorate', shown: 10 }, { id: 'horizon', shown: 99 }, { id: 'finalexam', shown: 99 }, { id: 'gauntlet', shown: 50 },
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
      assert.ok(b.truth >= Math.round(m.capability * 0.6) && b.truth <= Math.round(m.capability * 1.0), `${b.id} ${b.truth}`);
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
