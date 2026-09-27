import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../sim/balance.js';
import { roundSpan } from '../sim/time.js';
import { growUsers, monthlyRevenue, projectBurn } from '../sim/economy.js';
import { eraById } from '../sim/data/eras.js';
import { computeSlices } from '../sim/split.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS, scenarioHistory } from '../ui/logic/scenarios.js';
import {
  boardPromiseOffer, byEra, defaultPlan, eraOfTurn, eraStart, futureEras, monthOfTurn, planOpinions, project, roundEras,
  roundSize, setGoal, signedAt, turnRecord,
} from '../ui/logic/finance.js';
import { makeBoardPromise } from '../sim/boardPromise.js';
import { reviewerCost } from '../sim/automation.js';

const era3 = () => SCENARIOS.era3Queue(4); // seed 4 at the first turn of era 3: one CoreFlame contract, no spot, no resale

test('turns map to eras and months the way the sim counts them', () => {
  assert.deepEqual([0, 3, 4, 8, 12, 16, 19].map(eraOfTurn), [1, 1, 2, 3, 4, 5, 5]);
  assert.deepEqual([0, 4, 8, 12, 16, 20].map(monthOfTurn), [0, 12, 24, 28, 32, 33]);
  assert.equal(eraStart(4), 12);
});

test("this turn's projected spending equals the sim's own burn", () => {
  const state = era3();
  const row = project(state, defaultPlan(state)).rows[0];
  assert.equal(row.turn, state.turn);
  assert.equal(row.planned, 0);
  assert.ok(Math.abs(row.burn - projectBurn(state)) < 1e-9, `${row.burn} vs ${projectBurn(state)}`);
});

test('signed compute drops off when a contract term ends', () => {
  const state = era3();
  const [contract] = state.compute.contracts;
  state.compute.contracts = [contract]; // this contract alone: others land and end on their own days
  state.compute.pipeline = [];
  // Terms end on days: rows the contract fully covers count its capacity and bill; a partial last row bills its share only.
  const full = contract.units * contract.price * BALANCE.unitMonthlyCost;
  const ahead = (t) => monthOfTurn(t) - monthOfTurn(state.turn);
  const rowMonths = (t) => monthOfTurn(t + 1) - monthOfTurn(t);
  const lastWhole = Array.from({ length: 12 }, (_, i) => state.turn + i)
    .filter((t) => t === state.turn || ahead(t) + rowMonths(t) <= contract.monthsLeft + 1e-9).at(-1);
  assert.equal(signedAt(state, lastWhole).units, contract.units);
  assert.ok(Math.abs(signedAt(state, lastWhole).bill - full) < 1e-9);
  const next = signedAt(state, lastWhole + 1);
  assert.equal(next.units, 0);
  const share = Math.max(0, Math.min(1, (contract.monthsLeft - ahead(lastWhole + 1)) / rowMonths(lastWhole + 1)));
  assert.ok(Math.abs(next.bill - full * share) < 1e-9);
});

test('a goal bills the unsigned compute from next turn at the base price', () => {
  const state = era3();
  const plan = setGoal(defaultPlan(state), 3, 120, futureEras(state));
  const [now, next] = project(state, plan).rows;
  assert.equal(now.planned, 0);
  assert.equal(next.planned, 120 - next.signed);
  assert.ok(Math.abs(next.planBill - (120 - next.signed) * BALANCE.unitMonthlyCost) < 1e-9);
});

test('goals never fall in later eras', () => {
  const state = era3();
  const eras = futureEras(state);
  let plan = setGoal(defaultPlan(state), 4, 400, eras);
  assert.deepEqual([plan.goals[3], plan.goals[4], plan.goals[5]], [state.compute.online, 400, 400]);
  plan = setGoal(plan, 3, 500, eras);
  assert.deepEqual([plan.goals[3], plan.goals[4], plan.goals[5]], [500, 500, 500]);
  plan = setGoal(plan, 5, 100, eras);
  assert.deepEqual([plan.goals[3], plan.goals[4], plan.goals[5]], [100, 100, 100]);
});

test('a planned round raises once, at the start of its era, at today\'s valuation', () => {
  const state = era3();
  const plan = { ...defaultPlan(state), raises: { 3: true, 4: true } };
  const rows = project(state, plan).rows;
  const raised = rows.filter((r) => r.raised > 0).map((r) => [r.turn, r.raised]);
  assert.deepEqual(raised, [[state.turn, roundSize(state)], [eraStart(4), roundSize(state)]]);
  const already = { ...state, flags: { ...state.flags, lastRoundEra: 3 } };
  assert.equal(project(already, plan).rows.filter((r) => r.raised > 0).length, 1);
});

test('the run-out month falls inside the turn where cash goes negative', () => {
  const state = era3();
  const p = project(state, setGoal(defaultPlan(state), 4, 600, futureEras(state)));
  assert.ok(p.runsOut, 'a 1 GW plan with no rounds runs out');
  assert.ok(p.runsOut.atMonth >= p.runsOut.month && p.runsOut.atMonth <= p.runsOut.month + p.runsOut.months);
  assert.ok(p.runsOut.cashStart >= 0 && p.runsOut.cashEnd < 0);
  assert.match(planOpinions(state, p, setGoal(defaultPlan(state), 4, 600, futureEras(state)))[0].text, new RegExp(`month ${Math.floor(p.runsOut.atMonth)}`));
});

test('flat revenue stays flat; the growth line follows growUsers turn by turn', () => {
  const state = era3();
  const rows = project(state, defaultPlan(state)).rows;
  assert.ok(rows.every((r) => r.revenue === rows[0].revenue));
  const sim = structuredClone(state);
  for (const row of rows) {
    sim.era = row.era;
    sim.growthBoost = sim.budget.split.product * ((sim.budget.spend * eraById(row.era).monthsPerTurn) / 30) * 0.02;
    growUsers(sim);
    assert.ok(Math.abs(row.grownRevenue - monthlyRevenue(sim)) < 1e-9, `turn ${row.turn}`);
  }
  assert.ok(rows[0].grownRevenue > rows[0].revenue);
});

test("this turn's row matches the sim's burn with spot cover, cloud credits and idle resale in play", () => {
  const state = structuredClone(era3());
  state.compute.contracts.push({ id: 'az', supplier: 'azuria', units: 12, price: 1.1, monthsLeft: 24, needsPower: false, string: 'exclusive', arrivedTurn: state.turn, scaledDown: false, troubled: false, dark: false, bumpTurn: null, exclusiveBought: false, headline: null });
  state.compute.credits = 30;
  state.compute.online += 12;
  state.compute.split = { ...state.compute.split, resellIdle: true };
  state.compute.servingUnits = state.compute.online * 2; // a shortfall, covered with spot
  const row = project(state, defaultPlan(state)).rows[0];
  assert.ok(Math.abs(row.burn - projectBurn(state)) < 1e-9, `${row.burn} vs ${projectBurn(state)}`);
  // The Azuria bill outlasts the credits, so the plan spends exactly what the lab holds, and no more.
  const used = project(state, defaultPlan(state)).rows.reduce((sum, r) => sum + r.credit * r.months, 0);
  assert.ok(Math.abs(used - 30) < 1e-6, `credits used ${used}`);
});

test("with reviewers on staff, this turn's row still equals the sim's burn, and their pay stays out of the compute bill", () => {
  const state = structuredClone(era3());
  state.automation.checks.reviewers = 2;
  const cost = reviewerCost(state);
  assert.ok(cost > 0);
  const rows = project(state, defaultPlan(state)).rows;
  assert.ok(Math.abs(rows[0].burn - projectBurn(state)) < 1e-9, `${rows[0].burn} vs ${projectBurn(state)}`);
  assert.ok(Math.abs(rows[0].people - (state.budget.spend + cost)) < 1e-9);
  // Later eras pay reviewers more, the way reviewerCost scales with the era.
  const era5 = rows.find((r) => r.era === 5);
  assert.ok(Math.abs(era5.people - (state.budget.spend + reviewerCost({ ...state, era: 5 }))) < 1e-9);
  // A played round: the record's compute bill is the burn less ops and people, reviewers included in people.
  const after = { ...state, burnHistory: [...state.burnHistory, projectBurn(state)], lastRoundBurn: projectBurn(state), lastRoundPeople: state.budget.spend + cost };
  const record = turnRecord(state, after, []);
  assert.ok(Math.abs(record.people - (state.budget.spend + cost)) < 1e-9);
  assert.ok(Math.abs(record.computeBill - (projectBurn(state) - record.ops - record.people)) < 1e-9);
  const noReviewers = structuredClone(state);
  noReviewers.automation.checks.reviewers = 0;
  assert.ok(Math.abs(record.computeBill - (projectBurn(noReviewers) - record.ops - noReviewers.budget.spend)) < 1e-9);
});

test('a warned spot contract leaves after its last turn, pooled compute is set aside, and a letter of intent counts its sure 30%', () => {
  const base = era3();
  const spot = structuredClone(base);
  spot.compute.contracts.push({ id: 's', supplier: 'spot', units: 20, price: 2.5, monthsLeft: null, needsPower: false, dark: false, bumpTurn: spot.turn + 1 });
  assert.equal(signedAt(spot, spot.turn + 1).units, signedAt(base, base.turn + 1).units + 20);
  assert.equal(signedAt(spot, spot.turn + 2).units, signedAt(base, base.turn + 2).units);
  const pooled = structuredClone(base);
  pooled.compute.pooled = 0.2;
  assert.equal(signedAt(pooled, pooled.turn).units, Math.floor(signedAt(base, base.turn).units * 0.8));
  const loi = structuredClone(base);
  loi.compute.pipeline.push({ id: 'l', supplier: 'verde', units: 100, headline: 100, price: 1, termMonths: 24, arrivesTurn: loi.turn + 2, string: 'shrinks' });
  assert.equal(signedAt(loi, loi.turn + 2).units - signedAt(base, base.turn + 2).units, 30);
});

test('a round can still be planned on the last turn of an era', () => {
  const state = { ...era3(), turn: eraStart(4) - 1, era: 3 };
  assert.deepEqual(futureEras(state), [4, 5]);
  assert.deepEqual(roundEras(state), [3, 4, 5]);
  const rows = project(state, { goals: {}, raises: { 3: true } }).rows;
  assert.equal(rows[0].raised, roundSize(state));
});

test('turn records add up to the cash the sim ended with', () => {
  const state = era3();
  const history = scenarioHistory(state);
  assert.equal(history.length, state.turn);
  history.forEach((r, i) => {
    assert.equal(r.turn, i);
    assert.ok(Math.abs(r.cashStart + r.raised + r.oneOffs + (r.revenue - r.burn) * r.months - r.cashEnd) < 1e-6);
    if (i > 0) assert.ok(Math.abs(history[i - 1].cashEnd - r.cashStart) < 1e-9);
  });
  assert.ok(Math.abs(history.at(-1).cashEnd - state.cash) < 1e-9);
  assert.ok(history.some((r) => r.raised > 0), 'the scripted run raises a round in era 2');
});

test('a turn record counts only successful raises', () => {
  const before = era3();
  const after = { ...before, cash: before.cash + 500, arr: 0, burnHistory: [...before.burnHistory, 0], lastRoundBurn: 0, lastRoundPeople: undefined, budget: before.budget };
  const record = turnRecord(before, after, [{ type: 'raise', ok: true, amount: 500 }, { type: 'raise', ok: false, error: 'x' }]);
  assert.equal(record.raised, 500);
  assert.ok(Math.abs(record.oneOffs) < 1e-9);
});

test('the game records each turn it plays, and nothing after the run ends', () => {
  const state = era3();
  const game = createGame({ seed: 4, state, history: scenarioHistory(state) });
  assert.equal(game.financeHistory.length, state.turn);
  game.endTurn();
  assert.equal(game.financeHistory.length, state.turn + 1);
  assert.equal(game.financeHistory.at(-1).turn, state.turn);
  const ended = createGame({ seed: 1, state: SCENARIOS.ending(1) });
  ended.endTurn();
  assert.equal(ended.financeHistory.length, 0);
});

test('the plan is kept by the game as a copy', () => {
  const game = createGame({ seed: 4, state: era3() });
  const plan = { goals: { 3: 50 }, raises: { 3: true } };
  game.setFinancePlan(plan);
  plan.goals[3] = 999;
  assert.deepEqual(game.financePlan, { goals: { 3: 50 }, raises: { 3: true } });
});

test('era summaries weight by months and read the actual compute bill for history', () => {
  const state = era3();
  const actual = byEra(scenarioHistory(state), { actual: true });
  assert.deepEqual(actual.map((e) => [e.era, e.months]), [[1, 12], [2, 12]]);
  assert.ok(actual.every((e) => Math.abs(e.burn - (e.signedBill + e.people + e.ops)) < 1e-6));
  const planned = byEra(project(state, defaultPlan(state)).rows);
  assert.deepEqual(planned.map((e) => [e.era, e.months]), [[3, 4], [4, 4], [5, 1]]);
});

test('an era whose last turn is now takes no goal, and the last turn has nothing to plan', () => {
  const state = era3();
  assert.deepEqual(futureEras(state), [3, 4, 5]);
  assert.deepEqual(futureEras({ ...state, turn: eraStart(5) - 1 }), [5]);
  assert.deepEqual(futureEras({ ...state, turn: 19 }), []);
});

test('with no revenue yet the CFO does not quote a multiple of it', () => {
  const state = SCENARIOS.start(4);
  const plan = defaultPlan(state);
  const [cfo] = planOpinions(state, project(state, plan), plan);
  assert.match(cfo.text, /^We earn nothing yet/);
});

test('the plan buys enough to reach its goal after pooling', () => {
  const state = structuredClone(era3());
  state.compute.pooled = 0.2;
  const eras = futureEras(state);
  const row = project(state, setGoal(defaultPlan(state), 3, 100, eras)).rows[1];
  assert.equal(row.planned, 100 - row.signed);
  const { raw } = signedAt(state, row.turn);
  assert.ok(Math.floor((raw + row.bought) * 0.8) >= 100, `bought ${row.bought} does not reach the goal`);
  assert.ok(Math.floor((raw + row.bought - 1) * 0.8) < 100, `bought ${row.bought} is more than needed`);
  assert.ok(Math.abs(row.planBill - row.bought * BALANCE.unitMonthlyCost) < 1e-9);
});

test('a usage surge scales revenue only for the turns it has left', () => {
  const state = structuredClone(era3());
  const base = monthlyRevenue(state);
  state.compute.surge = { usage: 0.7, mult: 1, turnsLeft: 2 };
  const rows = project(state, defaultPlan(state)).rows;
  assert.ok(Math.abs(rows[0].revenue - base * 0.7) < 1e-9);
  assert.ok(Math.abs(rows[1].revenue - base * 0.7) < 1e-9);
  assert.ok(Math.abs(rows[2].revenue - base) < 1e-9);
  assert.ok(rows[2].grownRevenue > rows[1].grownRevenue / 0.7 - 1e-9);
});

test("today's serving shortfall stays in later turns until planned compute covers it", () => {
  const state = structuredClone(era3());
  state.compute.servingUnits = state.compute.online + 20; // 20 units short, covered with spot
  const eras = futureEras(state);
  const flat = project(state, defaultPlan(state)).rows;
  const { shortfall } = computeSlices(state); // the 20 plus what safety and control set aside first
  const covered = project(state, setGoal(defaultPlan(state), 3, state.compute.online + shortfall, eras)).rows;
  assert.ok(flat[1].signedBill > signedAt(state, flat[1].turn).bill, 'spot cover carries on');
  assert.ok(Math.abs(covered[1].signedBill - signedAt(state, covered[1].turn).bill) < 1e-9, 'planned compute replaces it');
});

test('a played turn keeps a negative net compute bill', () => {
  const before = era3();
  const after = { ...before, arr: 0, burnHistory: [...before.burnHistory, 10], lastRoundBurn: 10, lastRoundPeople: undefined, budget: before.budget };
  assert.ok(turnRecord(before, after, []).computeBill < 0);
});

test('pooling buys no more than the goal needs, counting the fraction already signed', () => {
  const state = structuredClone(era3());
  state.compute.contracts = [{ ...state.compute.contracts[0], units: 11, monthsLeft: 24 }];
  state.compute.pooled = 0.3;
  const row = project(state, setGoal(defaultPlan(state), 3, 8, futureEras(state))).rows[1];
  assert.equal(row.signed, 7);
  assert.equal(row.bought, 1);
});

test('idle resale in later turns never earns more than a unit bills', () => {
  const state = structuredClone(era3());
  state.compute.contracts = [{ ...state.compute.contracts[0], supplier: 'rescue', units: 40, price: 0.5, monthsLeft: 24 }];
  state.compute.online = 40;
  state.compute.split = { ...state.compute.split, resellIdle: true };
  state.compute.servingUnits = 0;
  const row = project(state, defaultPlan(state)).rows[1];
  const credit = signedAt(state, row.turn).bill - row.signedBill;
  assert.ok(credit <= 40 * 0.5 * BALANCE.unitMonthlyCost + 1e-9, `resale ${credit}`);
});

test('when the lab earns more than it spends, the CFO says so instead of quoting a multiple', () => {
  const state = structuredClone(era3());
  state.compute.contracts = [];
  state.compute.online = 0;
  state.compute.servingUnits = 0; // nothing to serve, so no spot cover
  state.budget = { ...state.budget, spend: 0 };
  state.models = state.models.map((m) => ({ ...m, users: m.users * 10 })); // revenue above the running costs
  const plan = { goals: {}, raises: {} };
  const [cfo] = planOpinions(state, project(state, plan), plan);
  assert.match(cfo.text, /we earn more than we spend/);
});

test('the board promise offers the nearest era goal the board can still judge', () => {
  const state = era3();
  assert.deepEqual(boardPromiseOffer(state, { goals: { 3: 60, 4: 90, 5: 90 }, raises: {} }), { units: 60, era: 3 });
  const lastOfEra = { ...state, turn: eraStart(4) - 1, turnInEra: 3 };
  assert.deepEqual(boardPromiseOffer(lastOfEra, { goals: { 4: 90, 5: 90 }, raises: {} }), { units: 90, era: 4 });
  assert.equal(makeBoardPromise(structuredClone(lastOfEra), { units: 90, era: 4 }).ok, true);
  assert.equal(boardPromiseOffer(state, { goals: { 3: 0, 4: 0, 5: 0 }, raises: {} }), null);
  assert.equal(boardPromiseOffer({ ...state, turn: 19 }, { goals: {}, raises: {} }), null);
  const open = { ...state, boardPromise: { units: 50, era: 3, madeTurn: 8, status: 'open' } };
  assert.equal(boardPromiseOffer(open, { goals: { 3: 60 }, raises: {} }), null);
});

test('a queued board promise reaches the sim when the turn ends', () => {
  const game = createGame({ seed: 4, state: era3() });
  game.setField('boardPromise', { units: 60, era: 3 });
  const { events, errors } = game.endTurn();
  assert.deepEqual(errors, []);
  assert.ok(events.some((e) => e.type === 'boardPromise' && e.units === 60 && e.era === 3));
  assert.equal(game.queue.boardPromise, undefined);
});

test('a round with compute landing mid-round records its real spend, not a phantom one-off', () => {
  const state = structuredClone(era3());
  state.cash = 1e5;
  // A big contract due at the next mark, so it lands inside this round (sim/landings.js).
  state.compute.pipeline.push({ id: 'cbig', supplier: 'azuria', units: 400, price: 1, termMonths: 24, arrivesTurn: state.turn + 1, string: null, needsPower: false });
  const game = createGame({ seed: 4, state, history: scenarioHistory(state) });
  game.endTurn();
  const row = game.financeHistory.at(-1);
  assert.ok(game.state.compute.contracts.some((c) => c.id === 'cbig'), 'the contract landed');
  assert.ok(Math.abs(row.oneOffs) < Math.max(1, Math.abs(row.burn) * row.months * 0.02), `one-offs ${row.oneOffs} against burn ${row.burn}`);
});

test('in a later row, a delivery landing partway bills its share and adds no capacity yet', () => {
  const state = structuredClone(era3());
  const next = state.turn + 1;
  const { start, end } = roundSpan(next);
  state.compute.pipeline = [{ id: 'cx', supplier: 'azuria', units: 10, price: 1, termMonths: 24, arrivesTurn: next + 1, string: null, landsDay: start + Math.round((end - start) / 2), landsFor: next }];
  const row = signedAt(state, next);
  const whole = signedAt({ ...state, compute: { ...state.compute, pipeline: [] } }, next);
  const bill = 10 * 1 * BALANCE.unitMonthlyCost;
  assert.ok(Math.abs(row.bill - whole.bill - bill * (end - state.compute.pipeline[0].landsDay) / (end - start)) < 1e-9);
  assert.equal(row.units, whole.units);
});

test('a budget change mid-round leaves the history compute bill alone', () => {
  const play = (raise) => {
    const state = structuredClone(era3());
    const game = createGame({ seed: 4, state, history: scenarioHistory(state) });
    game.advanceDays(10);
    if (raise) game.setBudget({ ...game.state.budget, spend: 200 });
    game.endTurn();
    return game.financeHistory.at(-1);
  };
  const same = play(false);
  const raised = play(true);
  assert.ok(raised.people > same.people);
  assert.ok(Math.abs(raised.computeBill - same.computeBill) < 1, `${raised.computeBill} vs ${same.computeBill}`);
});

test('in a later row, Azuria credits are spent only for the part of the row the contract runs', () => {
  const state = structuredClone(era3());
  const next = state.turn + 1;
  const { start, end } = roundSpan(next);
  state.compute.contracts = state.compute.contracts.filter((c) => c.supplier !== 'azuria');
  state.compute.pipeline = [{ id: 'cz', supplier: 'azuria', units: 10, price: 1, termMonths: 24, arrivesTurn: next + 1, string: null, landsDay: start + Math.round((end - start) / 2), landsFor: next }];
  const months = eraById(state.era).monthsPerTurn;
  const bill = 10 * BALANCE.unitMonthlyCost;
  state.compute.credits = bill * months * 0.5; // enough for half a row at the full bill
  const row = project(state, defaultPlan(state)).rows.find((r) => r.turn === next);
  const ran = (end - state.compute.pipeline[0].landsDay) / (end - start);
  assert.ok(Math.abs(row.credit - ran * Math.min(bill, state.compute.credits / months)) < 1e-9, `${row.credit}`);
});
