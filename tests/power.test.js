import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { ERAS } from '../sim/data/eras.js';
import {
  SITE_TYPES, FACILITY_PER_UNIT, LEASE_RATE, reserveGrid, buildSite, powerTurn, sitePower, leaseBills, leaseMonthly,
  poweredUnits, eraStartTurn, siteUnits,
} from '../sim/power.js';
import { ERA_SCALE, eraScale } from '../sim/data/compute.js';

// Tests check behaviour against the modules' own exports, not tuned constants (compute spec §11b).
const fresh = (era = 1) => { const s = createInitialState(); s.era = era; s.power ??= { sites: [], nextId: 1 }; return s; };

test('the era scale grows by era and era start turns follow the era table', () => {
  assert.equal(ERA_SCALE.length, 5);
  assert.equal(ERA_SCALE[0], 1);
  for (let e = 2; e <= 5; e++) assert.ok(eraScale(e) > eraScale(e - 1));
  assert.equal(eraStartTurn(1), 0);
  assert.equal(eraStartTurn(4), ERAS[0].turns + ERAS[1].turns + ERAS[2].turns);
});

// No dice (Task A6): an era 2 grid reservation arrives one round into era 4, the rounded average of the old draw.
test('a grid reservation in era 2 comes online one round into era 4, once per game', () => {
  const s = fresh(2);
  const cash = s.cash;
  const r = reserveGrid(s);
  assert.equal(r.ok, true);
  assert.equal(s.cash, cash - SITE_TYPES.grid.upfront);
  assert.equal(r.arrivesTurn, eraStartTurn(4) + 1);
  assert.equal(s.power.sites[0].units, siteUnits(SITE_TYPES.grid));
  assert.equal(reserveGrid(s).ok, false);
  assert.equal(reserveGrid(fresh(4)).ok, false);
});

// No dice (Task A6): an era 3 reservation lands three rounds into era 4, the average of the old draws (no era 5 slip).
test('a late grid reservation arrives late in era 4', () => {
  const late = reserveGrid(fresh(3)).arrivesTurn;
  assert.ok(late > eraStartTurn(4) && late < eraStartTurn(5));
  assert.equal(late, eraStartTurn(4) + 3);
});

// No dice (Task A6, D8): a nuclear restart runs one round late while US favor is under 60 (a fresh game starts at 50).
test('gas costs public trust; nuclear gains it and runs late without US favor', () => {
  const s = fresh(4); s.turn = eraStartTurn(4);
  const pt = s.publicTrust;
  assert.equal(buildSite(s, 'gas').arrivesTurn, s.turn + SITE_TYPES.gas.turns);
  assert.equal(s.publicTrust, pt + SITE_TYPES.gas.trust);
  assert.equal(buildSite(s, 'nuclear').arrivesTurn, s.turn + SITE_TYPES.nuclear.turns + SITE_TYPES.nuclear.slip);
  assert.equal(s.publicTrust, pt + SITE_TYPES.gas.trust + SITE_TYPES.nuclear.trust);
  assert.equal(buildSite(s, 'coal').ok, false);
  assert.equal(buildSite(fresh(3), 'gas').ok, false);
});

test('sites come online on time; only online sites give power and bill a lease', () => {
  const s = fresh(4); s.turn = eraStartTurn(4);
  const { arrivesTurn } = buildSite(s, 'gas');
  const units = siteUnits(SITE_TYPES.gas);
  assert.equal(sitePower(s), 0);
  assert.equal(leaseBills(s), 0);
  s.turn = arrivesTurn;
  assert.equal(powerTurn(s)[0].type, 'siteOnline');
  assert.equal(sitePower(s), units);
  assert.ok(Math.abs(leaseMonthly(units) - (units * FACILITY_PER_UNIT * LEASE_RATE) / 12) < 1e-9);
  assert.ok(Math.abs(leaseBills(s) - leaseMonthly(units)) < 1e-9);
  assert.equal(powerTurn(s).length, 0);
});

test('chips that need power run only up to site power; dark contracts do not count', () => {
  const s = fresh(4);
  s.compute.contracts = [
    { id: 'a', units: 100, needsPower: false, dark: false },
    { id: 'b', units: 700, needsPower: true, dark: false },
    { id: 'c', units: 50, needsPower: false, dark: true },
  ];
  s.power.sites.push({ id: 'grid-1', source: 'grid', units: 500, arrivesTurn: 0, online: true, oppositionCut: null });
  assert.deepEqual(poweredUnits(s), { online: 600, unpowered: 200 });
});

test('sites have fixed sizes and dates: the middle of the old ranges', () => {
  const s = createInitialState();
  s.era = 2;
  s.cash = 1000;
  assert.equal(reserveGrid(s).arrivesTurn, eraStartTurn(4) + 1);
  assert.equal(s.power.sites[0].units, 350);
  const t = createInitialState();
  t.era = 3;
  t.cash = 1000;
  assert.equal(reserveGrid(t).arrivesTurn, eraStartTurn(4) + 3);
  const u = createInitialState();
  u.era = 4;
  assert.equal(buildSite(u, 'gas').arrivesTurn, u.turn + SITE_TYPES.gas.turns);
  u.govFavor.us = 50;
  assert.equal(buildSite(u, 'nuclear').arrivesTurn, u.turn + SITE_TYPES.nuclear.turns + 1);
  assert.deepEqual(u.power.sites.map((site) => site.units), [450, 300]);
});

test('a nuclear restart opens on time when US favor is 60 or more', () => {
  const s = createInitialState();
  s.era = 4;
  s.govFavor.us = 60;
  assert.equal(buildSite(s, 'nuclear').arrivesTurn, s.turn + SITE_TYPES.nuclear.turns);
});
