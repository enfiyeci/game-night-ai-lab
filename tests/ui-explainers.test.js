import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ERAS } from '../sim/data/eras.js';
import { ADVISORS } from '../sim/advisors.js';
import {
  COMPUTE_ADVISOR, COMPUTE_SEEN_KEY, COMPUTE_TAB_LINES, MONEY_ADVISOR, MONEY_EXPLAINER, MONEY_SEEN_KEY, MONEY_TAB_LINES, computeExplainer, firstOpen,
} from '../ui/logic/explainers.js';
import { TOUR } from '../ui/logic/intro.js';

const memory = () => {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
// The tab keys a screen actually draws, read from its source so a new tab without a line fails here.
const tabKeys = (file, pattern) => [...readFileSync(new URL(`../ui/screens/${file}`, import.meta.url), 'utf8').match(pattern)[1].matchAll(/\['(\w+)',/g)].map((m) => m[1]);

test('each screen explanation appears the first time only, and survives blocked storage', () => {
  const storage = memory();
  assert.equal(firstOpen(storage, MONEY_SEEN_KEY), true);
  assert.equal(firstOpen(storage, MONEY_SEEN_KEY), false);
  assert.equal(firstOpen(storage, COMPUTE_SEEN_KEY), true, 'each screen remembers on its own');
  assert.equal(storage.values.get(MONEY_SEEN_KEY), '1');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(firstOpen(blocked, MONEY_SEEN_KEY), true);
  assert.equal(firstOpen(undefined, MONEY_SEEN_KEY), true);
});

test('every Money and Compute tab has its one line from the advisor', () => {
  const money = tabKeys('finance.js', /const VIEWS = \[(.*)\];/);
  assert.deepEqual(money.sort(), Object.keys(MONEY_TAB_LINES).sort());
  const compute = tabKeys('computeInfo.js', /for \(const \[key, label\] of \[(.*)\]\)/);
  assert.deepEqual(compute.sort(), Object.keys(COMPUTE_TAB_LINES).sort());
  for (const line of [...Object.values(MONEY_TAB_LINES), ...Object.values(COMPUTE_TAB_LINES)]) assert.equal(sentences(line).length, 1, line);
});

test('the explanations are three to five plain sentences, with no numbers and no era named', () => {
  assert.ok(ADVISORS.includes(MONEY_ADVISOR));
  assert.ok(ADVISORS.includes(COMPUTE_ADVISOR));
  assert.notEqual(MONEY_ADVISOR, COMPUTE_ADVISOR);
  const names = ERAS.map((era) => era.name.toLowerCase());
  const lines = [MONEY_EXPLAINER, ...ERAS.map((era) => computeExplainer(era.id)), ...Object.values(MONEY_TAB_LINES), ...Object.values(COMPUTE_TAB_LINES)];
  for (const [i, text] of [MONEY_EXPLAINER, computeExplainer(1)].entries()) {
    const n = sentences(text).length;
    assert.ok(n >= 3 && n <= 5, `explainer ${i}: ${n} sentences`);
  }
  for (const line of lines) {
    assert.doesNotMatch(line, /\d/, line);
    assert.doesNotMatch(line, /\bera \d/i, line);
    for (const name of names) assert.equal(line.toLowerCase().includes(name), false, line);
  }
});

test('power sites are named only in the era they can be built', () => {
  for (const era of ERAS) assert.equal(computeExplainer(era.id).includes('sites'), era.id === 4, `era ${era.id}`);
});

test('the tour introduces money and compute through the advisors who own them', () => {
  const money = TOUR.find((step) => step.point === 'money');
  const compute = TOUR.find((step) => step.point === 'compute');
  assert.equal(money.who, 'cfo');
  assert.equal(compute.who, 'research');
  assert.match(money.say, /Money/);
  assert.match(compute.say, /online/i);
  assert.match(compute.say, /arriving/);
  assert.equal(TOUR.indexOf(compute), TOUR.indexOf(money) + 1, 'compute follows money');
});
