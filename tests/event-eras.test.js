import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { eraAllows, eventsTick } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { REAL_EVENTS } from '../sim/data/realEvents.js';
import { BOARD_EVENTS } from '../sim/data/boardEvents.js';
import { STRATEGIES } from '../tools/balance.js';
import { WARNING_SAY } from '../ui/data/eventCopy.js';
import { openWarnings } from '../ui/logic/events.js';

const ALL = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS, ...BOARD_EVENTS];
const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };

// The eras each card was kept to by the era audit (docs/research/event-cards/era-audit-2026-09-26.md).
const HOME_ERAS = {
  promise: [2, 3, 4, 5],
  safetyQuits: [2, 3],
  exitGag: [2, 3],
  exportFlip: [2, 3],
  priceWar: [2, 3, 4],
  copyright: [1, 2, 3],
  unhinged: [1, 2],
  countryBan: [1, 2],
  redTeamLie: [1, 2],
  voiceLikeness: [2],
};

test('each era has its own card pool, without the cards the audit placed in other eras', () => {
  for (const [id, eras] of Object.entries(HOME_ERAS)) assert.deepEqual(ALL.find((event) => event.id === id).eras, eras, id);
  for (const era of [1, 2, 3, 4, 5]) {
    const pool = ALL.filter((event) => eraAllows(event, era)).map((event) => event.id);
    assert.ok(pool.length >= 8, `era ${era} pool: ${pool.length}`);
    for (const [id, eras] of Object.entries(HOME_ERAS)) assert.equal(pool.includes(id), eras.includes(era), `${id} in era ${era}`);
  }
});

// A new player who keeps every default recipe card (scrape, skip hardening, quick checks) and ships a consumer app.
const defaults = (state, rng) => {
  const actions = STRATEGIES.speed(state, rng);
  for (const move of actions.moves) {
    if (move.type === 'startRun') move.recipe = { ...move.recipe, picks: { pre: [], mid: [], post: [] } };
    if (move.type === 'release') move.release = { ...move.release, picks: ['channel-app'] };
  }
  return actions;
};

test('in played runs every era lands cards, and cards land only in their own eras', () => {
  const landed = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
  const warned = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
  const players = { ...STRATEGIES, defaults };
  for (const name of ['speed', 'safety', 'balanced', 'random', 'defaults']) {
    for (let seed = 1; seed <= 6; seed += 1) {
      const rng = createRng(seed);
      let state = createInitialState({ seed });
      while (!state.ending && state.turn < 30) {
        const result = endTurn(state, players[name](state, rng), rng);
        state = result.state;
        if (state.ending) break;
        // The tick runs before the era changes, so what it makes lands in (and shows in) the era the round ends in.
        for (const event of result.events) {
          if (event.type === 'eventCard') landed[state.era].add(event.eventId ?? event.id);
          if (event.type === 'warning') warned[state.era].add(event.id);
        }
      }
    }
  }
  for (const era of [1, 2, 3, 4, 5]) {
    assert.ok(landed[era].size > 0, `era ${era} landed no cards`);
    for (const [id, eras] of Object.entries(HOME_ERAS)) {
      if (!eras.includes(era)) {
        assert.ok(!landed[era].has(id), `${id} landed in era ${era}`);
        assert.ok(!warned[era].has(id), `${id} warned in era ${era}`);
      }
    }
  }
});

const withPromiseFlag = (era, turnInEra) => {
  const state = createInitialState();
  Object.assign(state, { era, turnInEra });
  state.flags.brokenPromise = true;
  return state;
};

test('a broken promise in era 1 waits: its warning shows in era 2 at the earliest', () => {
  const early = withPromiseFlag(1, 2); // the warning would show in era 1's last round
  eventsTick(early, no);
  assert.ok(!early.warnings.promise);
  const last = withPromiseFlag(1, 3); // the warning shows in era 2's first round, the card in its second
  eventsTick(last, no);
  assert.ok(last.warnings.promise);
});

test('a card deferred past its eras lapses instead of landing late', () => {
  const state = createInitialState();
  Object.assign(state, { era: 2, turnInEra: 3, turn: 7 });
  state.warnings.voiceLikeness = { turn: 6, deferred: true };
  eventsTick(state, no);
  assert.ok(!state.pendingEvents.some((card) => card.id === 'voiceLikeness'));
  assert.ok(!Object.hasOwn(state.warnings, 'voiceLikeness'));
});

test('every warning has an advisor line that names the cost of looking into it', () => {
  for (const event of ALL.filter((row) => row.warning)) {
    const written = WARNING_SAY[event.id];
    assert.ok(written, event.id);
    for (const line of typeof written === 'string' ? [written] : Object.values(written)) assert.match(line, /\{cost\}/, event.id);
  }
  const state = createInitialState();
  state.era = 3;
  state.warnings = { promise: { turn: 1 }, citations: { turn: 1 } };
  state.flags.brokenPromise = true;
  const items = openWarnings(state);
  assert.match(items.find((item) => item.id === 'promise').say, /public safety promise.*\$15M pays/);
  assert.match(items.find((item) => item.id === 'citations').say, /quick checks.*\$15M pays/);
});
