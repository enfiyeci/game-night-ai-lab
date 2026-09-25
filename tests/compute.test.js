import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { signDeal, computeTurn } from '../sim/compute.js';

const calm = { next: () => 0.99, chance: () => false };

test('a neocloud deal arrives the same turn', () => {
  const s = createInitialState();
  assert.equal(signDeal(s, 'coreflame').ok, true);
  computeTurn(s, calm);
  assert.equal(s.compute.online, 16);
});

test('a chip-titan order is prepaid and arrives later', () => {
  const s = createInitialState();
  const r = signDeal(s, 'verde');
  assert.equal(r.arrivesTurn, 3);
  assert.ok(Math.abs(s.cash - (1000 - 10 * 1.46 * 3)) < 1e-9);
  computeTurn(s, calm);
  assert.equal(s.compute.online, 10);
  s.turn = 3;
  computeTurn(s, calm);
  assert.equal(s.compute.online, 20);
});

test('the era bottleneck delays deals and the sovereign deal costs trust', () => {
  const s = createInitialState();
  s.era = 4; // power bottleneck: +2 turns
  const r = signDeal(s, 'gulf');
  assert.equal(r.arrivesTurn, 4);
  assert.equal(s.govFavor.us, 46);
  assert.equal(s.publicTrust, 57);
});

test('neocloud capacity can vanish', () => {
  const s = createInitialState();
  signDeal(s, 'coreflame');
  computeTurn(s, calm);
  const out = computeTurn(s, { next: () => 0, chance: () => true });
  assert.equal(out.failed.length, 1);
  assert.equal(s.compute.online, 10);
});
