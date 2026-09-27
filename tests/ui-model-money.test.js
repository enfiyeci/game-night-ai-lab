import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { moneyRows } from '../ui/logic/modelMoney.js';

const released = (name, turn, fields) => ({
  name, channel: 'consumer', active: true, activeFromTurn: turn, releasedTurn: turn, users: 1e6, ...fields,
});

test('each released model gets a row, oldest first, with what it earned minus what it cost', () => {
  const s = createInitialState();
  s.turn = 6;
  s.models.push(
    released('B 2 Core', 4, { trainingCost: 90, launchCost: 10, earned: 50, servingSpent: 5, monthsOnSale: 2 }),
    released('A 1 Core', 1, { trainingCost: 80, launchCost: 0, earned: 300, servingSpent: 100, monthsOnSale: 9, active: false }),
  );
  const { rows, total, paidBack, released: count } = moneyRows(s);
  assert.deepEqual(rows.map((r) => r.name), ['A 1 Core', 'B 2 Core']);
  assert.equal(rows[0].status, 'retired');
  assert.equal(rows[1].status, 'serving');
  assert.equal(rows[0].net, 120);
  assert.equal(rows[1].made, 100);
  assert.equal(rows[1].net, -55);
  assert.equal(total.net, 65);
  assert.equal(paidBack, 1);
  assert.equal(count, 2);
});

test('a model from before the books shows no training figure instead of a made-up one', () => {
  const s = createInitialState();
  s.models.push(released('Old 1 Core', 0, { earned: 40, servingSpent: 10 }));
  const [row] = moneyRows(s).rows;
  assert.equal(row.made, null);
  assert.equal(row.net, null);
  assert.equal(moneyRows(s).total.net, 0);
});

test('the run in training and a trained model waiting for launch show what they cost so far', () => {
  const s = createInitialState();
  s.pendingModel = { trainingCost: 70 };
  s.activeRun = { spent: { cash: 20, compute: 15 } };
  const { rows, total } = moneyRows(s);
  assert.deepEqual(rows.map((r) => [r.kind, r.made, r.net]), [['pending', 70, -70], ['training', 35, -35]]);
  assert.equal(total.made, 105);
});
