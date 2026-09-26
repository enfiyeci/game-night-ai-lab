import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, nextRound, resolveEvent, stampNewCards } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { REAL_EVENTS } from '../sim/data/realEvents.js';
import { EVENT_TIMING } from '../sim/data/eventTiming.js';
import { ROUND_DAYS } from '../sim/time.js';

const text = JSON.parse(readFileSync(new URL('../docs/superpowers/plans/2026-09-26-real-event-cards-text.json', import.meta.url)));
const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { ...no, next: () => 0, chance: () => true };
const idMap = { rightToWarn: 'openletter', forumBreach: 'weightTheft' };
const rows = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS];
const rowFor = (textId) => rows.find((row) => row.id === (idMap[textId] ?? textId));
const fallbackFor = (card) => card.choices.find((choice) => choice.fallback).id;
const publicChoice = ({ id, label, cost, backers, opposers }) => ({ id, label, cost, backers, opposers });

const liveModel = (extra = {}) => ({
  name: 'Kestrel 1 Core', active: true, activated: true, activeFromTurn: 0, channel: 'consumer',
  flags: [], users: 1e6, userCap: 4e6, priceStance: 'market', spec: {}, ...extra,
});

test('nextRound walks ordinary rounds and era changes', () => {
  const s = createInitialState();
  s.turnInEra = 2;
  assert.deepEqual(nextRound(s), { era: 1, round: 3 });
  s.turnInEra = 3;
  assert.deepEqual(nextRound(s), { era: 2, round: 0 });
  s.era = 5;
  assert.deepEqual(nextRound(s), { era: 5, round: 4 });
});

test('every approved text card maps to one sim row with verbatim copy', () => {
  for (const [textId, copy] of Object.entries(text)) {
    if (textId === 'boardFires') continue;
    const id = idMap[textId] ?? textId;
    const matches = rows.filter((row) => row.id === id);
    assert.equal(matches.length, 1, textId);
    const row = matches[0];
    assert.equal(row.card.title, copy.title, `${textId}.title`);
    assert.deepEqual(row.card.post, copy.post, `${textId}.post`);
    if (textId === 'oversightTamper') continue;
    assert.deepEqual(row.warning, copy.warning, `${textId}.warning`);
    assert.deepEqual(
      row.card.choices.map(publicChoice).sort((a, b) => a.id.localeCompare(b.id)),
      copy.choices.map(publicChoice).sort((a, b) => a.id.localeCompare(b.id)),
      `${textId}.choices`,
    );
  }
});

test('every approved row declares the JSON fallback and puts it last', () => {
  for (const [textId, copy] of Object.entries(text)) {
    if (textId === 'boardFires') continue;
    const row = rowFor(textId);
    const fallback = fallbackFor(copy);
    assert.equal(row.fallback, fallback, textId);
    assert.equal(row.card.choices.at(-1).id, fallback, `${textId} fallback order`);
  }
});

const anchors = {
  pauseLetter: [1, 1, 0.23],
  senateHearing1: [1, 1, 0.83],
  whiteHouseCommitments: [1, 2, 0.55],
  openletter: [2, 1, 0.04],
  preReleaseTests: [2, 2, 0.66],
  stateBill: [2, 2, 0.97],
  qilinshock: [3, 0, 0.3],
  poached: [3, 1, 0.5],
  unbiasedOrder: [3, 2, 0.75],
  pentagon: [4, 0, 0.15],
  agentBreakout: [4, 2, 0.4],
  pooling: [4, 2, 0.7],
  paceEssay: [5, 0, 0.2],
  pacingLetter: [5, 1, 0.3],
};

test('anchors fire once for their fixed era and round and use their fixed landing day', () => {
  for (const [id, [era, round, at]] of Object.entries(anchors)) {
    const s = createInitialState();
    s.seenEvents = rows.filter((row) => row.id !== id && row.kind !== 'internal').map((row) => row.id);
    s.era = round === 0 ? era - 1 : era;
    s.turnInEra = round === 0 ? 3 : round - 1;
    s.turn = (s.era - 1) * 4 + s.turnInEra;
    s.day = 100;

    eventsTick(s, no);
    assert.equal(s.seenEvents.filter((seen) => seen === id).length, 1, `${id} seen`);
    assert.equal(s.pendingEvents.filter((card) => card.id === id).length, 1, `${id} card`);

    s.era = era;
    s.turnInEra = round;
    stampNewCards(s);
    const card = s.pendingEvents.find((pending) => pending.id === id);
    assert.equal(card.landsAt, 100 + Math.floor(ROUND_DAYS[era] * at), `${id} landsAt`);

    s.pendingEvents = [];
    s.era = round === 0 ? era - 1 : era;
    s.turnInEra = round === 0 ? 3 : round - 1;
    eventsTick(s, no);
    assert.equal(s.pendingEvents.some((pending) => pending.id === id), false, `${id} repeats`);
  }
});

const reactionCases = [
  ['unhinged',
    (s) => { s.models.push(liveModel({ flags: ['quickEval', 'jailbreakWaiting'] })); },
    (s) => { s.models.push(liveModel({ flags: ['quickEval'] })); }],
  ['countryBan',
    (s) => { s.models.push(liveModel({ flags: ['scraped'] })); },
    (s) => { s.era = 3; s.models.push(liveModel({ flags: ['scraped'] })); }],
  ['redTeamLie',
    (s) => { s.models.push({ id: 'r', capability: 30, active: true, activated: false, activeFromTurn: s.turn, flags: ['fullEval'] }); },
    (s) => { s.models.push({ id: 'r', capability: 30, active: true, activated: true, activeFromTurn: s.turn, flags: ['fullEval'] }); }],
  ['exitGag',
    (s) => { s.era = 2; s.seenEvents.push('safetyQuits'); },
    (s) => { s.era = 2; }],
  ['voiceLikeness',
    (s) => { s.era = 2; s.models.push(liveModel()); },
    (s) => { s.era = 3; s.models.push(liveModel()); }],
  ['alignmentFaking',
    (s) => { s.era = 2; s.compute.split.safety = 0.2; s.pendingModel = { releaseDelay: 0 }; },
    (s) => { s.era = 2; s.compute.split.safety = 0.19; s.pendingModel = { releaseDelay: 0 }; }],
  ['hateMeltdown',
    (s) => { s.era = 3; s.flags.retuned = true; s.models.push(liveModel()); },
    (s) => { s.era = 3; s.constitution.hardLines = ['honest']; s.models.push(liveModel()); }],
  ['evalAwareness',
    (s) => { s.era = 3; s.compute.split.safety = 0.2; s.pendingModel = {}; },
    (s) => { s.era = 3; s.compute.split.safety = 0.19; s.pendingModel = {}; }],
  ['agConditions',
    (s) => { s.flags.conversionDeadline = 5; },
    (s) => { s.flags.conversionDeadline = 5; s.flags.converted = true; }],
  ['copyrightDue',
    (s) => { s.era = 3; s.legalCases.push({ source: 'copyright', cost: 120, dueTurn: 9 }); },
    (s) => { s.era = 2; s.legalCases.push({ source: 'copyright', cost: 120, dueTurn: 9 }); }],
  ['droneGenerators',
    (s) => { s.era = 4; s.power.sites.push({ id: 'gas-1', source: 'gas', units: 300, online: true, arrivesTurn: 10 }); },
    (s) => { s.era = 4; }],
  ['strandedBuild',
    (s) => { s.era = 4; s.power.sites.push({ id: 'grid-1', source: 'grid', units: 300, online: false, arrivesTurn: 8 }); },
    (s) => { s.era = 4; s.power.sites.push({ id: 'grid-1', source: 'grid', units: 300, online: false, arrivesTurn: 2 }); }],
  ['stateSues',
    (s) => { s.era = 4; s.seenEvents.push('companion'); s.models.push(liveModel()); },
    (s) => { s.era = 4; s.models.push(liveModel()); }],
  ['blacklistAppeal',
    (s) => { s.era = 4; s.turnInEra = 2; s.flags.pentagonRefused = true; },
    (s) => { s.era = 4; s.turnInEra = 1; s.flags.pentagonRefused = true; }],
  ['ratepayer',
    (s) => { s.era = 4; s.turnInEra = 2; s.power.sites.push({ id: 'grid-1', source: 'grid', units: 300 }); },
    (s) => { s.era = 4; s.turnInEra = 2; }],
  ['rivalShips',
    (s) => { s.era = 5; s.seenEvents.push('paceEssay'); },
    (s) => { s.era = 5; }],
  ['agentWorkdays',
    (s) => { s.era = 5; },
    (s) => { s.era = 4; }],
  ['clusterSpeedup',
    (s) => { s.era = 5; },
    (s) => { s.era = 4; }],
  ['usChinaChannel',
    (s) => { s.era = 5; s.turnInEra = 2; },
    (s) => { s.era = 5; s.turnInEra = 2; s.deal = { collapsed: false, binding: ['usChina'] }; }],
  ['pauseTraining',
    (s) => { s.era = 5; s.alignmentDebt = 30; s.concealedDebt = 10; },
    (s) => { s.era = 5; s.alignmentDebt = 29; s.concealedDebt = 10; }],
];

test('every reaction fires for its state and not for the missing condition', () => {
  for (const [id, positive, negative] of reactionCases) {
    const event = REAL_EVENTS.find((row) => row.id === id);
    const on = createInitialState();
    positive(on);
    assert.equal(event.trigger(on, yes), true, `${id} positive`);
    const off = createInitialState();
    negative(off);
    assert.equal(event.trigger(off, yes), false, `${id} negative`);
  }
});

function resolvableState() {
  const s = createInitialState();
  s.era = 4;
  s.turn = 12;
  s.turnInEra = 2;
  s.cash = 1000;
  s.alignmentDebt = 50;
  s.concealedDebt = 20;
  s.constitution.hardLines = ['honest', 'privacy', 'no-wmd'];
  s.flags.conversionDeadline = 20;
  s.flags.pentagonRefused = true;
  s.flags.supplyChainRisk = true;
  s.models.push(liveModel({ flags: ['quickEval', 'jailbreakWaiting', 'scraped'] }));
  s.pendingModel = { capability: 60, flags: ['fullEval'], releaseDelay: 0 };
  s.legalCases.push({ source: 'copyright', cost: 120, dueTurn: 18 });
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 300, price: 1, needsPower: true, dark: false });
  s.power.sites.push({ id: 'gas-1', source: 'gas', units: 300, online: true, arrivesTurn: 12 });
  return s;
}

test('every choice on every new card resolves without throwing', () => {
  for (const event of REAL_EVENTS) {
    for (const choice of event.card.choices) {
      const s = resolvableState();
      s.pendingEvents.push({ id: event.id, targets: [0] });
      assert.doesNotThrow(() => resolveEvent(s, event.id, choice.id), `${event.id}.${choice.id}`);
      assert.equal(s.pendingEvents.length, 0, `${event.id}.${choice.id}`);
    }
  }
});

test('real-event deadlines use the planned classes and cap era 5 at six days', () => {
  const short = ['unhinged', 'hateMeltdown', 'agentBreakout', 'droneGenerators'];
  const normal = ['countryBan', 'redTeamLie', 'exitGag', 'voiceLikeness', 'alignmentFaking', 'evalAwareness',
    'stateSues', 'rivalShips', 'agentWorkdays', 'clusterSpeedup', 'pauseTraining', 'pacingLetter'];
  const long = ['pauseLetter', 'senateHearing1', 'whiteHouseCommitments', 'preReleaseTests', 'stateBill',
    'unbiasedOrder', 'pentagon', 'agConditions', 'copyrightDue', 'strandedBuild', 'blacklistAppeal', 'ratepayer',
    'usChinaChannel', 'paceEssay'];
  for (const id of short) assert.deepEqual(EVENT_TIMING[id], { class: 'short', days: 5 }, id);
  for (const id of normal) assert.deepEqual(EVENT_TIMING[id], { class: 'normal', days: 14 }, id);
  for (const id of long) assert.deepEqual(EVENT_TIMING[id], { class: 'long', days: 30 }, id);

  const s = createInitialState();
  s.era = 5;
  s.pendingEvents.push({ id: 'paceEssay' });
  stampNewCards(s);
  assert.equal(s.pendingEvents[0].dueAt - s.pendingEvents[0].landsAt, 6);
});

// Review round 1 fixes (Codex adversarial pass, 2026-09-26).
const row = (id) => [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS].find((event) => event.id === id);

test('an era-1 fake-citation card targets the quickly checked consumer model it came from', () => {
  const s = createInitialState();
  s.era = 1;
  s.models.push({ id: 'm', capability: 30, users: 1000, channel: 'consumer', active: true, superseded: false, activeFromTurn: 0, flags: ['quickEval'] });
  assert.equal(row('citations').targets(s).length, 1);
  s.pendingEvents.push({ id: 'citations', targets: row('citations').targets(s) });
  resolveEvent(s, 'citations', 'recall');
  assert.ok(s.models[0].users < 1000);
});

test('the stranded build-out cancels the site that raised it, even after the round moves on', () => {
  const s = createInitialState();
  s.era = 4;
  s.turn = 12;
  s.compute.contracts.push({ id: 'c', supplier: 'verde', units: 100, price: 1 });
  s.power.sites.push({ id: 'gas-9', source: 'gas', units: 300, online: false, arrivesTurn: 15 });
  assert.equal(row('strandedBuild').trigger(s), true);
  s.turn = 13; // the round mark passes before the card is answered
  s.pendingEvents.push({ id: 'strandedBuild' });
  resolveEvent(s, 'strandedBuild', 'cancel');
  assert.equal(s.power.sites.some((site) => site.id === 'gas-9'), false);
});

test('settling a copyright case that was already paid costs nothing', () => {
  const s = createInitialState();
  s.era = 3;
  const cash = s.cash;
  s.pendingEvents.push({ id: 'copyrightDue' });
  resolveEvent(s, 'copyrightDue', 'settle');
  assert.equal(s.cash, cash);
});

test('holding your release after a rival ships does not heat the race', () => {
  const s = createInitialState();
  s.era = 5;
  const heat = s.raceHeat;
  s.pendingEvents.push({ id: 'rivalShips' });
  resolveEvent(s, 'rivalShips', 'hold');
  assert.equal(s.raceHeat, heat);
});
