import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  proposeSummit, voteMotion, readTheRoom, demandStatus, dealWeek, investigate, expireSuspicions, playerBreak, COMMITMENTS,
} from '../sim/summit.js';
import { CATCH, BREAK_GAIN, CAUGHT_TRUST, DEFAULT_CHECK } from '../sim/data/summit.js';
import { finalEnding } from '../sim/endings.js';
import { startRun, advanceRun } from '../sim/training.js';
import { applyActions, endTurn } from '../sim/turn.js';
import { jobLevels, setAutomation } from '../sim/automation.js';
import { recipeCost } from '../sim/recipe.js';

// No noise, and every coin flip lands "no".
const calm = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: () => 0 };
const always = { ...calm, chance: () => true };
const scripted = (answers) => ({ ...calm, chance: () => answers.shift() ?? false });
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
// A friendly era 5 room: every party's stance is comfortably above the bar once its demand is met.
const era5 = () => {
  const s = createInitialState();
  s.era = 5;
  s.turnInEra = 0;
  s.raceHeat = 10;
  s.publicTrust = 80;
  s.govFavor = { us: 70, intl: 70 };
  s.compute.online = recipeCost(s, recipe).units + 200;
  s.rivals.forEach((r) => { r.capability = s.capability; r.caution = 0.6; });
  return s;
};
const asMotions = ({ proposals, checks = {}, promises = {} }) => proposals.map((card, i) => ({
  card,
  check: checks[card] ?? DEFAULT_CHECK,
  promises: i === 0 ? promises : {},
}));
const signedAfter = (move) => {
  const s = era5();
  const r = proposeSummit(s, { type: 'summit', motions: move.motions ?? asMotions(move) }, calm);
  assert.equal(r.ok, true, r.error);
  return { s, r };
};

test('the summit opens only in era 5 week 1, once, with one to three proposals', () => {
  const move = { motions: [{ card: 'evaluators', check: 2, promises: {} }] };
  assert.equal(proposeSummit(createInitialState(), move, calm).ok, false);
  const s = era5();
  assert.equal(proposeSummit(s, { motions: [] }, calm).ok, false);
  assert.equal(proposeSummit(s, { motions: [
    { card: 'evaluators', check: 2, promises: {} },
    { card: 'sharedSafety', check: 2, promises: {} },
  ] }, calm).ok, true);
  assert.equal(proposeSummit(s, move, calm).ok, false);
});

test('bad summit input is rejected without changing the state', () => {
  for (const move of [
    { proposals: 'evaluators' },
    { proposals: ['evaluators', 'evaluators'] },
    { proposals: ['constructor'] },
    { proposals: ['evaluators'], checks: { evaluators: 4 } },
    { proposals: ['evaluators'], checks: { computeCap: 2 } },
    { proposals: ['evaluators'], promises: { martians: 'pay' } },
    { proposals: ['evaluators'], promises: { east: 'bribe' } },
    { proposals: ['evaluators'], promises: { east: 'pay', west: 'pay', qilin: 'pay', lodestar: 'pay' } },
  ]) {
    const s = era5();
    const before = structuredClone(s);
    assert.equal(proposeSummit(s, move, calm).ok, false, JSON.stringify(move));
    assert.deepEqual(s, before);
  }
  const poor = era5();
  poor.cash = 49;
  assert.equal(proposeSummit(poor, { proposals: ['evaluators'], promises: { east: 'pay' } }, calm).ok, false);
});

test('new summit motions reject repeated promises, too many promises, and an empty agenda', () => {
  const cases = [
    [{ motions: [] }, 'choose one to three summit motions'],
    [{ motions: [
      { card: 'evaluators', check: 2 },
      { card: 'evaluators', check: 3 },
    ] }, 'summit proposals cannot repeat'],
    [{ motions: [{ card: 'constructor', check: 2 }] }, 'unknown summit proposal'],
    [{ motions: [{ card: 'evaluators', check: 4 }] }, 'unknown checking level'],
    [{ motions: [{ card: 'evaluators', check: 2, promises: { martians: 'pay' } }] }, 'unknown summit delegate'],
    [{ motions: [{ card: 'evaluators', check: 2, promises: { east: 'bribe' } }] }, 'unknown summit promise'],
    [{ motions: [
      { card: 'evaluators', check: 2, promises: { east: 'goFirst' } },
      { card: 'sharedSafety', check: 2, promises: { east: 'inspectors' } },
    ] }, 'a summit delegate can receive only one promise'],
    [{ motions: [
      { card: 'evaluators', check: 2, promises: { east: 'goFirst', west: 'goFirst' } },
      { card: 'sharedSafety', check: 2, promises: { qilin: 'goFirst', lodestar: 'goFirst' } },
    ] }, 'at most 3 promises'],
  ];
  for (const [move, error] of cases) {
    const s = era5();
    const before = structuredClone(s);
    assert.deepEqual(proposeSummit(s, move, calm), { ok: false, error });
    assert.deepEqual(s, before);
  }
  const poor = era5();
  poor.cash = 99;
  assert.equal(proposeSummit(poor, { motions: [
    { card: 'evaluators', check: 2, promises: { east: 'pay' } },
    { card: 'sharedSafety', check: 2, promises: { west: 'pay' } },
  ] }, calm).error, 'not enough cash for those promises');
});

test('a promise made on a later motion cannot change an earlier vote', () => {
  const s = era5();
  const motions = [
    { card: 'evaluators', check: 2, promises: {} },
    { card: 'sharedSafety', check: 2, promises: { east: 'goFirst' } },
  ];
  const firstAtTheTime = voteMotion(s, motions.slice(0, 1), 0);
  const firstWithTheFutureKnown = voteMotion(s, motions, 0);
  assert.deepEqual(firstWithTheFutureKnown, firstAtTheTime);
  assert.equal(firstAtTheTime.signed.includes('east'), false);
  assert.equal(voteMotion(s, motions, 1).signed.includes('east'), true);

  const r = proposeSummit(s, { motions }, calm);
  assert.equal(r.ok, true);
  assert.deepEqual(r.signed.evaluators, firstAtTheTime.signed);
});

test('voteMotion is pure and matches every vote recorded by proposeSummit', () => {
  const s = era5();
  const motions = [
    { card: 'evaluators', check: 2, promises: { east: 'goFirst' } },
    { card: 'sharedSafety', check: 2, promises: { west: 'inspectors' } },
    { card: 'verification', check: 3, promises: { lodestar: 'pay' } },
  ];
  const before = structuredClone(s);
  const votes = motions.map((motion, i) => [motion.card, voteMotion(s, motions, i)]);
  assert.deepEqual(s, before);

  let usedTurnRng = false;
  const r = proposeSummit(s, { motions }, { ...calm, normal: () => { usedTurnRng = true; return 100; } });
  assert.equal(r.ok, true);
  assert.equal(usedTurnRng, false);
  for (const [card, vote] of votes) {
    assert.deepEqual(s.deal.signed[card], vote.signed);
    assert.equal(s.deal.binding.includes(card), vote.binds);
  }
  assert.deepEqual(s.deal.motions, motions);
});

test('the old summit shape still works and attaches its promises to the first motion', () => {
  const s = era5();
  const move = {
    proposals: ['evaluators', 'sharedSafety'],
    checks: { evaluators: 2, sharedSafety: 3 },
    promises: { east: 'goFirst' },
  };
  const r = proposeSummit(s, move, calm);
  assert.equal(r.ok, true);
  assert.deepEqual(s.deal.proposals, move.proposals);
  assert.deepEqual(s.deal.checks, move.checks);
  assert.deepEqual(s.deal.promises, move.promises);
  assert.deepEqual(s.deal.motions, [
    { card: 'evaluators', check: 2, promises: move.promises },
    { card: 'sharedSafety', check: 3, promises: {} },
  ]);
  assert.equal(r.signed.evaluators.includes('east'), true);
  assert.equal(r.signed.sharedSafety.includes('east'), true);
});

test('each delegate keeps its fixed demand', () => {
  // Checked by testers, no promises: the East waits for a promise, so Qilin and OpenBrain stay out.
  const room = readTheRoom(era5(), { proposals: ['evaluators', 'computeCap', 'verification'], checks: { evaluators: 2, computeCap: 2, verification: 2 } });
  assert.equal(room.evaluators.lodestar, 'yes');
  assert.equal(room.evaluators.west, 'yes');
  assert.equal(room.evaluators.east, 'no');
  assert.equal(room.evaluators.qilin, 'no');
  assert.equal(room.evaluators.openbrain, 'no');
  assert.equal(room.computeCap.deepthink, 'no');
  assert.equal(room.verification.west, 'no');
  // Lodestar wants testers or better.
  assert.equal(readTheRoom(era5(), { proposals: ['evaluators'], checks: { evaluators: 1 } }).evaluators.lodestar, 'no');
});

test('a promise to the East starts the chain, and OpenBrain draws the line at testers', () => {
  const plan = { proposals: ['evaluators', 'sharedSafety'], checks: { evaluators: 2, sharedSafety: 3 }, promises: { east: 'goFirst' } };
  const room = readTheRoom(era5(), plan);
  assert.equal(room.evaluators.east, 'yes');
  assert.equal(room.evaluators.qilin, 'yes');
  assert.equal(room.evaluators.openbrain, 'yes');
  assert.equal(room.sharedSafety.qilin, 'yes');
  assert.equal(room.sharedSafety.openbrain, 'no');
  assert.equal(demandStatus(plan).east, true);
  assert.equal(demandStatus(plan).openbrain, null);
});

test('the vote follows the room, and a card binds with one lab and one government', () => {
  const { s, r } = signedAfter({ proposals: ['evaluators', 'computeCap'], checks: { evaluators: 2, computeCap: 1 }, promises: { east: 'goFirst' } });
  assert.ok(r.signed.evaluators.includes('openbrain'));
  assert.ok(r.binding.includes('evaluators'));
  // The cap at self-reports: Lodestar wants testers, DeepThink refuses caps, the East and its followers sign.
  assert.equal(r.signed.computeCap.includes('lodestar'), false);
  assert.equal(r.signed.computeCap.includes('deepthink'), false);
  assert.ok(r.signed.computeCap.includes('qilin'));
  assert.ok(r.binding.includes('computeCap'));
  assert.deepEqual(s.deal.checks, { evaluators: 2, computeCap: 1 });
});

test('promises cost what they say', () => {
  const s = era5();
  s.concealedDebt = 20;
  s.alignmentDebt = 10;
  const cash = s.cash;
  proposeSummit(s, { motions: [
    { card: 'releaseDelay', check: 2, promises: { east: 'pay' } },
    { card: 'computeCap', check: 2, promises: { west: 'goFirst' } },
    { card: 'pauseAutomation', check: 2, promises: { lodestar: 'inspectors' } },
  ] }, calm);
  assert.equal(s.cash, cash - 50);
  assert.equal(s.concealedDebt, 10);
  assert.equal(s.deal.playerInspected, true);
});

test('the President is angered when the West-East inspection line binds after his call', () => {
  const s = era5();
  s.meetingsHeld = ['first', 'second'];
  const r = proposeSummit(s, { motions: [
    { card: 'verification', check: 3, promises: { west: 'pay', east: 'inspectors' } },
  ] }, calm);
  assert.ok(r.binding.includes('verification'));
  assert.equal(s.govFavor.us, 60);
  assert.ok(r.events.some((e) => e.type === 'presidentAngry'));
});

test('a caught rival is expelled and the deal stands, binding unchanged', () => {
  const { s } = signedAfter({ proposals: ['evaluators', 'sharedSafety'], checks: { evaluators: 3, sharedSafety: 2 }, promises: { east: 'goFirst' } });
  s.turnInEra = 1;
  const trust = s.publicTrust;
  const binding = [...s.deal.binding];
  const events = dealWeek(s, always);
  const caught = events.filter((e) => e.type === 'dealBreakCaught');
  assert.ok(caught.length > 0);
  assert.equal(s.deal.collapsed, false);
  assert.deepEqual(s.deal.binding, binding);
  for (const { party } of caught) {
    assert.ok(s.deal.expelled.includes(party));
    assert.equal(Object.values(s.deal.signed).some((list) => list.includes(party)), false);
  }
  assert.equal(s.publicTrust, Math.min(100, trust + CAUGHT_TRUST * caught.length));
  assert.equal(finalEnding(s), 'pacingDeal');
});

test('stricter checks deter breaks', () => {
  const firstChance = (level) => {
    const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: level }, promises: { lodestar: 'goFirst', west: 'goFirst' } });
    s.turnInEra = 1;
    const seen = [];
    dealWeek(s, { ...calm, chance: (p) => { seen.push(p); return false; } });
    return seen[0];
  };
  assert.ok(firstChance(3) < firstChance(0));
});

test('an uncaught break buys the rival capability and leaves a suspicion you can investigate', () => {
  const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: 2 }, promises: { east: 'goFirst' } });
  s.turnInEra = 1;
  const openbrain = s.rivals.find((r) => r.id === 'openbrain');
  const before = openbrain.capability;
  // Break rolls in party order (OpenBrain first): OpenBrain breaks; then it is not caught, its sign is seen.
  const rivals = ['openbrain', 'lodestar', 'deepthink', 'qilin'].filter((id) => s.deal.signed.evaluators.includes(id));
  const events = dealWeek(s, scripted([true, ...rivals.slice(1).map(() => false), false, true]));
  assert.ok(events.some((e) => e.type === 'defection' && e.party === 'openbrain'));
  assert.equal(openbrain.capability, before + BREAK_GAIN);
  const suspicion = s.deal.suspicions.find((entry) => entry.party === 'openbrain');
  assert.equal(suspicion.real, true);
  const found = investigate(s, suspicion.id, always);
  assert.equal(found.found, true);
  assert.equal(openbrain.capability, before);
  assert.ok(s.deal.expelled.includes('openbrain'));
  assert.equal(s.deal.collapsed, false);
});

test('investigating a false alarm insults the lab; suspicions go cold at their deadline', () => {
  const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: 2 }, promises: { east: 'goFirst' } });
  s.deal.suspicions.push({ id: 's9', party: 'lodestar', real: false, day: s.day, dueAt: s.day + 5 });
  const r = investigate(s, 's9', always);
  assert.equal(r.found, false);
  assert.equal(s.deal.insulted.lodestar, true);
  s.deal.suspicions.push({ id: 's10', party: 'qilin', real: true, day: s.day, dueAt: s.day + 5 });
  s.day += 5;
  expireSuspicions(s);
  assert.equal(s.deal.suspicions.length, 0);
  assert.equal(investigate(s, 's10', always).ok, false);
});

test('breaking the cap is a choice at the start of a run, caught at the next weekly check', () => {
  const { s } = signedAfter({ proposals: ['computeCap'], checks: { computeCap: 3 }, promises: { east: 'goFirst' } });
  assert.ok(s.deal.binding.includes('computeCap'));
  const kept = structuredClone(s);
  assert.equal(startRun(kept, recipe).ok, true);
  kept.activeRun.bonus = 100;
  assert.equal(advanceRun(kept, calm).gain, 5);

  const out = applyActions(s, { moves: [{ type: 'startRun', recipe, breakDeal: true }] }, calm);
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.deal.playerShipped, true);
  assert.equal(out.state.activeRun.uncapped, true);
  const caught = structuredClone(out.state);
  caught.turnInEra = 1;
  const events = dealWeek(caught, { ...calm, chance: (p) => p === CATCH[3] });
  assert.ok(events.some((e) => e.type === 'playerCaught'));
  assert.equal(caught.deal.collapsed, true);
  assert.notEqual(finalEnding(caught), 'pacingDeal');
});

test('breaking is only possible where the card binds', () => {
  const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: 2 }, promises: { east: 'goFirst' } });
  playerBreak(s, 'computeCap');
  assert.equal(s.deal.playerShipped, false);
});

test('skipping the summit costs race heat and favor once', () => {
  const s = era5();
  const first = endTurn(s, {}, calm);
  assert.equal(first.events.some((e) => e.type === 'summitSkipped'), true);
  const second = endTurn(first.state, {}, calm);
  assert.equal(second.events.some((e) => e.type === 'summitSkipped'), false);
});

test('endTurn runs the summit and takes investigate actions', () => {
  const s = era5();
  const out = endTurn(s, { moves: [{
    type: 'summit', motions: [{ card: 'evaluators', check: 2, promises: { east: 'goFirst' } }],
  }] }, calm);
  assert.deepEqual(out.errors, []);
  assert.ok(out.events.some((e) => e.type === 'summit'));
  const next = structuredClone(out.state);
  next.deal.suspicions.push({ id: 's1', party: 'lodestar', real: false, day: next.day, dueAt: next.day + 5 });
  const after = endTurn(next, { investigate: ['s1'] }, calm);
  assert.ok(after.events.some((e) => e.type === 'investigated' && e.party === 'lodestar' && e.found === false));
  assert.ok(endTurn(after.state, { investigate: ['nope'] }, calm).errors.includes('that suspicion has gone cold'));
});

test('six commitments remain on offer', () => {
  assert.equal(Object.keys(COMMITMENTS).length, 6);
});

test('the President calls as era 5 begins, before the summit', () => {
  const s = createInitialState();
  s.era = 4;
  s.turnInEra = 3;
  s.meetingsHeld = ['first'];
  const out = endTurn(s, {}, calm);
  if (out.state.ending) return; // an era 4 gate can end a bare test run; the meeting timing is what matters
  assert.equal(out.state.era, 5);
  assert.equal(out.state.meeting?.id, 'second');
  assert.equal(out.state.turnInEra, 0);
});

test('catching after an investigation undoes exactly what the break gained', () => {
  const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: 2 }, promises: { east: 'goFirst' } });
  s.turnInEra = 1;
  const openbrain = s.rivals.find((r) => r.id === 'openbrain');
  openbrain.capability = 98;
  const rivals = ['openbrain', 'lodestar', 'deepthink', 'qilin'].filter((id) => s.deal.signed.evaluators.includes(id));
  dealWeek(s, scripted([true, ...rivals.slice(1).map(() => false), false, true]));
  assert.equal(openbrain.capability, 100);
  const suspicion = s.deal.suspicions.find((entry) => entry.party === 'openbrain');
  investigate(s, suspicion.id, always);
  assert.equal(openbrain.capability, 98);
});

test('pauseAutomation hands choosing and direction back to people while the deal holds', () => {
  const { s } = signedAfter({ proposals: ['evaluators'], checks: { evaluators: 2 } });
  s.deal.binding = ['pauseAutomation'];
  s.models.push({ capability: 50 });
  s.automation.stage = 2;
  assert.deepEqual(jobLevels(s).slice(3), [0, 0]);
  assert.equal(s.automation.stage, 2);
  assert.equal(setAutomation(s, { levels: { choosing: 1 } }).error, 'choosing and direction are back with people');
  s.deal.collapsed = true;
  assert.deepEqual(jobLevels(s).slice(3), [2, 1]);
});
