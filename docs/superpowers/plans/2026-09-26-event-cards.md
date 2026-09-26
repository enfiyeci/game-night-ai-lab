# Event Cards and Warnings Implementation Plan (plan 2B Task 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the sim's warnings and event cards to the player the way the owner picked them: warnings voiced by an advisor at their desk, cards as a slim card along the bottom while the advisors argue from their desks, crises staged in the room with a picture, a desk phone that holds set-aside cards and the feed, and a "While you were busy" panel that tells ignored cards as consequences.

**Architecture:** Pure view logic in `ui/logic/events.js` turns sim state into display data and is tested in node. Copy and timing live in `ui/data/eventCopy.js`, which the owner edits by hand. Three screen modules mount on the stage: `ui/screens/events.js` (cards, crisis staging, the busy panel), `ui/screens/briefing.js` (advisor bubbles and warnings) and `ui/screens/feed.js` (the desk phone). Everything works with or without the real-time clock: when `game.clock` exists, an open card pauses it and deadlines count down in story days; without it, cards open one after another after each `endTurn`.

**Tech Stack:** Plain ES modules in the browser, no build step. Tests use `node --test` (no DOM; screens are checked with screenshots).

## Global Constraints

- **The sim is read-only.** Import from `sim/`, never modify it (plan 2B Global Constraints).
- **Palette:** every colour is a token (`--cream`, `--paper`, `--ink`, `--teal`, `--wood`, `--coral`, `--sky`) or a `color-mix()` of tokens. No colour literals.
- **No information by colour alone.** Backers carry a ✓, opposers are struck through, warnings carry an icon and a word.
- **Hidden variables are never shown as numbers.** Card cost strings come from the sim and already obey this. Story-time deadlines (days, weeks) are fine.
- **No "turn" wording anywhere in the event UI** (owner, 2026-09-26: "i dont want specific turns"). No "Card 1 of 2", no "answer before you end the turn". A test enforces this on the copy file.
- **Real time:** the owner confirmed on 2026-09-26: "we are switching to more game dev tycoon time system with no turns but game time passing". The real-time lane owns `ui/clock.js`, `ui/hud.js` and `ui/menu.js`. Its planned API, attached as `game.clock`: `pause(reason)`, `resume(reason)` (reasons are counted), `now()` → `{ monthsElapsed, y, m, w, day }`, `daysUntilNextRound()`, `on('tick' | 'round', fn)` → unsubscribe, `speed`, `skip()`. Code must work when `game.clock` is undefined.
- **Cards cannot outlive a sim round.** `sim/turn.js:182-188` resolves every pending card with its fallback choice at the next `endTurn`. A card's shown deadline is `min(its timing days, clock.daysUntilNextRound())`. When a set-aside card's time runs out, the UI marks it "Time ran out" and queues nothing; the sim's fallback at the round gives the same result.
- **Pause on decisions, not on information.** An open card pauses the clock (reason `'event-card'`). Warning bubbles and the phone do not pause it.
- **All advisor lines, joke lines, consequence lines and due phrases are placeholders marked `// OWNER WRITES`.** The owner rewrites them when going through the events. Keep all of them in `ui/data/eventCopy.js`.
- **Shared files:** the release lane and the real-time lane also edit `ui/main.js` and `ui/styles.css`. Only append to them, except the one guard change in Task 3 Step 6. Put new CSS in one block at the end of `ui/styles.css` headed `/* Plan 2B Task 8: event cards and warnings */`, with every class prefixed `ev-` (plus `event-layer`).
- **The owner's picks** (2026-09-26, pick page https://claude.ai/artifact/7sYBo4Qq4ZB2cktW4FySSM): 1C, 2C, 3A, 4A, 5A, crises B with a picture, 7A. Mockups: `docs/design/mockups/K2-events.html` and `docs/design/mockups/K2-events-crisis.html`. Build to those, not to Task 8's older text in plan 2B.
- **Warning owners (owner-approved 2026-09-26):** Head of Safety: flattery, jailbreak, promise, openletter. Head of Research: contamination, distill, weightTheft, safetyQuits. CFO: agentwreck, neocloudTrouble. Policy and Comms: citations, companion, siteOpposition, whistleblower.
- **Run the whole suite** with `npm test` from the worktree root. It must stay green (the two known balance TODOs aside, if present).

## File structure

| File | Responsibility |
|---|---|
| `ui/data/eventCopy.js` (new) | Warning owners, card timing, advisor argue lines, jokes, crisis staging, consequence lines. Data only. |
| `ui/data/crisisArt.js` (new) | The four crisis pictures as SVG strings. |
| `ui/logic/events.js` (new) | Pure view logic: open warnings, card views, argue lines, deadlines, consequence lines, queue helpers. |
| `ui/components/eventBits.js` (new) | Shared DOM helpers: `el`, `post`, `choiceButton`, `dueBar`, `bubbleAt`, `loadAnchors`. |
| `ui/screens/events.js` (new) | The card flow, the slim card, argue bubbles, crisis room staging, the busy panel, the preview route. |
| `ui/screens/briefing.js` (new) | Advisor click bubbles (7A) and warning bubbles (1C). |
| `ui/screens/feed.js` (new) | The desk phone and its panel: set-aside cards, open warnings, the latest posts. |
| `ui/main.js` (append + one guard) | Mount the three screens; block the floor menu while a card is open; `#event-<id>` preview route. |
| `ui/styles.css` (append) | The `ev-` styles. |
| `tests/ui-events.test.js` (new) | Tests for the logic and the copy file. |

---

### Task 1: Copy data and view logic

**Files:**
- Create: `ui/data/eventCopy.js`, `ui/logic/events.js`
- Test: `tests/ui-events.test.js`

**Interfaces:**
- Produces (from `ui/logic/events.js`):
  - `ADVISOR_TITLE`: `{ research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' }`
  - `TAG_TO_ADVISOR`: `{ Research: 'research', Safety: 'safety', CFO: 'cfo', Comms: 'policy' }`
  - `catalogRow(id) → row | undefined` (maps `promiseCall:<n>` to the `promiseCall` row)
  - `lookIntoCost(state) → number` ($M, equals the sim's `5 × era`)
  - `openWarnings(state, queued = []) → [{ id, advisor, handle, text }]`
  - `cardView(pending) → { id, title, post, crisis, staging, choices: [{ id, label, cost, backers, opposers, fallback }] }`
  - `argueLines(view, limit = 3) → [{ role, say, pick }]`
  - `timingFor(id) → { days, due }`
  - `formatStoryTime(days) → string`
  - `daysLeft({ timingDays, landedMonths, nowMonths, daysUntilRound }) → number`
  - `dueText(id, days) → string`
  - `consequenceLines({ before, answered, events }) → [{ head, ok, text }]`
  - `queueAnswer(game, id, choiceId)`, `queueLookInto(game, id)`
  - `jokeFor(role, band, turn) → string | null`
- Produces (from `ui/data/eventCopy.js`): `WARNING_ADVISOR`, `DEFAULT_TIMING`, `TIMING`, `ARGUE`, `JOKES`, `CRISIS_STAGING`, `CONSEQUENCES` (an empty object in this task; Task 2 fills it).

- [ ] **Step 1: Write the failing tests** in `tests/ui-events.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import * as COPY from '../ui/data/eventCopy.js';
import {
  argueLines, cardView, catalogRow, consequenceLines, daysLeft, dueText, formatStoryTime,
  jokeFor, lookIntoCost, openWarnings, queueAnswer, queueLookInto, timingFor,
} from '../ui/logic/events.js';

const ALL = [...EVENTS, ...EVENTS_6C];
const pendingOf = (id) => {
  const row = ALL.find((event) => event.id === id);
  return { id, title: row.card.title, post: row.card.post, choices: row.card.choices.map(({ id: c, label, cost, backers, opposers }) => ({ id: c, label, cost, backers, opposers })) };
};

test('every warning row has an owning advisor', () => {
  const withWarning = ALL.filter((event) => event.warning).map((event) => event.id).sort();
  assert.deepEqual(Object.keys(COPY.WARNING_ADVISOR).sort(), withWarning);
  for (const role of Object.values(COPY.WARNING_ADVISOR)) assert.ok(['research', 'safety', 'cfo', 'policy'].includes(role));
  assert.equal(COPY.WARNING_ADVISOR.flattery, 'safety');
  assert.equal(COPY.WARNING_ADVISOR.whistleblower, 'policy');
});

test('open warnings read the catalog text and skip deferred and queued ones', () => {
  const state = SCENARIOS.event(10);
  state.warnings = { neocloudTrouble: { turn: 1 }, flattery: { turn: 1, deferred: true }, jailbreak: { turn: 1 } };
  const items = openWarnings(state, ['jailbreak']);
  assert.deepEqual(items.map((item) => item.id), ['neocloudTrouble']);
  assert.equal(items[0].advisor, 'cfo');
  assert.equal(items[0].handle, '@marketwire');
  assert.match(items[0].text, /missed a payment/);
  assert.equal(lookIntoCost(state), 5 * state.era);
});

test('a card view marks exactly one fallback choice and flags crises', () => {
  const jailbreak = cardView(pendingOf('jailbreak'));
  assert.deepEqual(jailbreak.choices.filter((c) => c.fallback).map((c) => c.id), ['deny']);
  assert.equal(jailbreak.crisis, false);
  const theft = cardView(pendingOf('weightTheft'));
  assert.equal(theft.crisis, true);
  assert.equal(theft.staging.room, 'theft');
  assert.equal(cardView(pendingOf('agentwreck')).choices.find((c) => c.id === 'blame').cost, 'nothing up front');
  assert.equal(catalogRow('promiseCall:2').id, 'promiseCall');
});

test('argue lines use written lines, stay silent where marked, and fall back to backer tags', () => {
  const theft = argueLines(cardView(pendingOf('weightTheft')));
  assert.deepEqual(theft.map((line) => line.role), ['cfo', 'policy']); // a card with written lines uses only those
  assert.equal(theft.find((line) => line.role === 'policy').pick, 'Say nothing');
  const quits = argueLines(cardView(pendingOf('safetyQuits')));
  assert.ok(!quits.some((line) => line.role === 'safety'));
  const flattery = argueLines(cardView(pendingOf('flattery')));
  assert.deepEqual(flattery.find((line) => line.role === 'safety'), { role: 'safety', say: 'My vote: roll it back.', pick: 'Roll it back' });
  assert.ok(flattery.length <= 3);
});

test('deadlines are capped by the next round and read in story words', () => {
  assert.equal(daysLeft({ timingDays: 14, landedMonths: 1, nowMonths: 1, daysUntilRound: 60 }), 14);
  assert.equal(daysLeft({ timingDays: 14, landedMonths: 1, nowMonths: 1, daysUntilRound: 5 }), 5);
  assert.equal(daysLeft({ timingDays: 14, landedMonths: 1, nowMonths: 2, daysUntilRound: 60 }), 0);
  assert.equal(formatStoryTime(0.4), 'less than a day');
  assert.equal(formatStoryTime(1), '1 day');
  assert.equal(formatStoryTime(9), '9 days');
  assert.equal(formatStoryTime(21), 'about 3 weeks');
  assert.equal(formatStoryTime(90), 'about 3 months');
  assert.equal(dueText('whistleblower', 9), 'The story runs in 9 days');
  assert.equal(dueText('investors', 21), 'Answer within about 3 weeks');
  assert.equal(timingFor('investors'), COPY.DEFAULT_TIMING);
});

test('consequence lines tell answered and ignored cards', () => {
  const before = [cardView(pendingOf('investors')), cardView(pendingOf('flattery')), cardView(pendingOf('viralDemo'))];
  const lines = consequenceLines({
    before,
    answered: { investors: 'refuse' },
    events: [{ type: 'eventResolved', id: 'flattery', choiceId: 'defend', auto: true }],
  });
  assert.equal(lines.length, 2);
  assert.equal(lines[0].head, 'Handled');
  assert.equal(lines[0].ok, true);
  assert.equal(lines[1].head, 'Nobody answered');
  assert.ok(lines[1].text.length > 0);
});

test('queue helpers merge instead of replacing', () => {
  const game = createGame({ seed: 10, state: SCENARIOS.event(10) });
  queueAnswer(game, 'a', 'x');
  queueAnswer(game, 'b', 'y');
  assert.deepEqual(game.queue.eventChoices, { a: 'x', b: 'y' });
  queueLookInto(game, 'neocloudTrouble');
  queueLookInto(game, 'neocloudTrouble');
  assert.deepEqual(game.queue.addressWarnings, ['neocloudTrouble']);
});

test('jokes are optional per advisor and band', () => {
  assert.equal(typeof jokeFor('cfo', 'alarmed', 0), 'string');
  assert.equal(jokeFor('nobody', 'calm', 0), null);
});

test('the copy file never talks about turns', () => {
  const strings = [];
  const walk = (value) => {
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(COPY);
  for (const text of strings) assert.doesNotMatch(text, /\bturns?\b/i, text);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test tests/ui-events.test.js`
Expected: FAIL with `Cannot find module '.../ui/data/eventCopy.js'`.

- [ ] **Step 3: Write `ui/data/eventCopy.js`**

```js
// Copy and timing for the event cards and warnings (plan 2B Task 8).
// Every line marked OWNER WRITES is a placeholder: the owner rewrites it when going through the events.
// The sim never reads this file. Never write the word "turn" here (a test checks).

// Which advisor raises each warning at their desk (owner-approved 2026-09-26).
export const WARNING_ADVISOR = {
  flattery: 'safety',
  jailbreak: 'safety',
  promise: 'safety',
  openletter: 'safety',
  contamination: 'research',
  distill: 'research',
  weightTheft: 'research',
  safetyQuits: 'research',
  agentwreck: 'cfo',
  neocloudTrouble: 'cfo',
  citations: 'policy',
  companion: 'policy',
  siteOpposition: 'policy',
  whistleblower: 'policy',
};

// Story time each card waits before it resolves on its own ({time} is filled in).
// First guesses, to tune after the first playthrough.
export const DEFAULT_TIMING = Object.freeze({ days: 21, due: 'Answer within {time}' }); // OWNER WRITES
export const TIMING = {
  weightTheft: { days: 14, due: 'The leak goes public in {time}' }, // OWNER WRITES
  selfExfiltration: { days: 3, due: 'The copy finishes in {time}' }, // OWNER WRITES
  whistleblower: { days: 9, due: 'The story runs in {time}' }, // OWNER WRITES
  safetyQuits: { days: 7, due: 'Their post is trending. Answer within {time}' }, // OWNER WRITES
  jailbreak: { days: 5, due: 'The thread is spreading. Answer within {time}' }, // OWNER WRITES
  oversightTamper: { days: 3, due: 'Answer within {time}' }, // OWNER WRITES
  agentSurge: { days: 4, due: 'The servers fall over in {time}' }, // OWNER WRITES
  lossSpike: { days: 5, due: 'The run stalls in {time}' }, // OWNER WRITES
  capabilityJump: { days: 5, due: 'Answer within {time}' }, // OWNER WRITES
  viralDemo: { days: 5, due: 'The buzz fades in {time}' }, // OWNER WRITES
  agentwreck: { days: 7, due: 'Answer within {time}' }, // OWNER WRITES
  neocloudTrouble: { days: 10, due: 'They run out of cash in {time}' }, // OWNER WRITES
  priceWar: { days: 10, due: 'Answer within {time}' }, // OWNER WRITES
  boardRevolt: { days: 14, due: 'The board votes in {time}' }, // OWNER WRITES
  senateHearing: { days: 30, due: 'The hearing is in {time}' }, // OWNER WRITES
  pooling: { days: 45, due: 'Washington wants an answer within {time}' }, // OWNER WRITES
  pledgeDrop: { days: 45, due: 'Answer within {time}' }, // OWNER WRITES
  copyright: { days: 45, due: 'The first hearing is in {time}' }, // OWNER WRITES
};

// What an advisor says from their desk while a card is up. `pick` is a choice id; null means the
// advisor stays silent. Advisors not listed speak a line built from the card's backer tags.
export const ARGUE = {
  weightTheft: {
    policy: { say: 'Say nothing. Nobody has proved it was our weights.', pick: 'silence' }, // OWNER WRITES
    cfo: { say: 'Another $30M on a leak hunt? We are the leak.', pick: null }, // OWNER WRITES
  },
  selfExfiltration: {
    safety: { say: 'Pull the plug. It copied itself, and nobody asked it to.', pick: 'report' }, // OWNER WRITES
    cfo: { say: 'If this gets out, the round is dead. Quietly, please.', pick: 'coverup' }, // OWNER WRITES
    research: { say: 'In fairness, it did pick a very efficient route.', pick: null }, // OWNER WRITES
  },
  whistleblower: {
    safety: { say: 'Let the reviewers in. We have nothing to hide. Right?', pick: 'cooperate' }, // OWNER WRITES
    cfo: { say: 'They signed an NDA. Lawyers are cheaper than headlines.', pick: 'nda' }, // OWNER WRITES
    policy: { say: 'Give me a day and they are the story, not us.', pick: 'discredit' }, // OWNER WRITES
  },
  safetyQuits: {
    safety: null,
    cfo: { say: 'One less veto in the room. Let them go.', pick: 'letgo' }, // OWNER WRITES
    policy: { say: 'I can say they were burned out. Everyone is.', pick: 'smear' }, // OWNER WRITES
    research: { say: 'Does this mean I get their monitor?', pick: null }, // OWNER WRITES
  },
};

// A joke an advisor adds after their briefing line when clicked (7A). Picked by the round number.
export const JOKES = {
  research: {
    calm: ['The loss curve is so smooth I want to frame it.'], // OWNER WRITES
    uneasy: ['I have started reading their papers in the bath.'], // OWNER WRITES
    alarmed: ['I would sell a kidney for eight more racks. Not mine.'], // OWNER WRITES
  },
  safety: {
    calm: ['Even the red team is bored. I have never been happier.'], // OWNER WRITES
    uneasy: ['I asked it if it was hiding anything. It said no, very politely.'], // OWNER WRITES
    alarmed: ['I have started sleeping at my desk. The model has not.'], // OWNER WRITES
  },
  cfo: {
    calm: ['I bought the good coffee. Do not get used to it.'], // OWNER WRITES
    uneasy: ['I have started turning the lights off behind people.'], // OWNER WRITES
    alarmed: ['I have started pricing the office plants.'], // OWNER WRITES
  },
  policy: {
    calm: ['A senator called us thoughtful. I had it framed.'], // OWNER WRITES
    uneasy: ['Three reporters asked for comment. On what, they would not say.'], // OWNER WRITES
    alarmed: ['My phone has not stopped. I have a second phone for the first phone.'], // OWNER WRITES
  },
};

// The four crises are staged in the room (owner pick B) with a picture on the card (pick P).
// `room` names the staging in ui/screens/events.js and the picture in ui/data/crisisArt.js.
export const CRISIS_STAGING = {
  weightTheft: { room: 'theft', caption: 'CAM 03, server room, last night', tag: 'Weight store locked' }, // OWNER WRITES
  selfExfiltration: { room: 'exfil', caption: "The agent's own log", tag: 'Copying to an outside server' }, // OWNER WRITES
  whistleblower: { room: 'whistle', caption: 'The Ledger, front page', tag: 'Press outside · 12 calls this morning' }, // OWNER WRITES
  safetyQuits: { room: 'quits', caption: 'Their desk this morning', tag: 'Empty since Monday' }, // OWNER WRITES
};

// One line per card choice, told as what happened (owner pick 4A). Keyed by card id, then choice id.
// The promise calls share the `promiseCall` key. Task 2 fills this in.
export const CONSEQUENCES = {};
```

- [ ] **Step 4: Write `ui/logic/events.js`**

```js
import { EVENTS } from '../../sim/data/events.js';
import { EVENTS_6C } from '../../sim/data/events6c.js';
import { fallbackChoice } from '../../sim/events.js';
import {
  ARGUE, CONSEQUENCES, CRISIS_STAGING, DEFAULT_TIMING, JOKES, TIMING, WARNING_ADVISOR,
} from '../data/eventCopy.js';

export const ADVISOR_TITLE = { research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' };
export const TAG_TO_ADVISOR = { Research: 'research', Safety: 'safety', CFO: 'cfo', Comms: 'policy' };
const ARGUE_ORDER = ['safety', 'research', 'cfo', 'policy'];
const DAYS_PER_MONTH = 30.44;

const ALL = [...EVENTS, ...EVENTS_6C];
const baseId = (id) => (id.startsWith('promiseCall:') ? 'promiseCall' : id);

export const catalogRow = (id) => ALL.find((event) => event.id === baseId(id));

// The sim charges 5 × era $M to address a warning (sim/events.js addressWarning).
export const lookIntoCost = (state) => 5 * state.era;

export function openWarnings(state, queued = []) {
  return Object.entries(state.warnings ?? {}).flatMap(([id, warned]) => {
    const row = catalogRow(id);
    if (!row?.warning || warned?.deferred || queued.includes(id)) return [];
    if (row.kind === 'internal' || row.kind === 'promise') return [];
    return [{ id, advisor: WARNING_ADVISOR[id] ?? 'policy', handle: row.warning.handle, text: row.warning.text }];
  });
}

export function cardView(pending) {
  const row = catalogRow(pending.id);
  const fallback = fallbackChoice(pending.id, pending);
  return {
    id: pending.id,
    title: pending.title,
    post: pending.post,
    crisis: Boolean(row?.crisis),
    staging: CRISIS_STAGING[pending.id] ?? null,
    choices: pending.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      cost: choice.cost === '—' ? 'nothing up front' : choice.cost,
      backers: choice.backers ?? [],
      opposers: choice.opposers ?? [],
      fallback: choice.id === fallback,
    })),
  };
}

// A card with written lines (the crises) uses only those; null keeps an advisor silent.
// Other cards get one line per advisor who backs a choice, built from the backer tags.
export function argueLines(view, limit = 3) {
  const written = ARGUE[baseId(view.id)];
  const lines = [];
  for (const role of ARGUE_ORDER) {
    if (written) {
      const line = written[role];
      if (!line) continue;
      const pick = line.pick ? view.choices.find((choice) => choice.id === line.pick)?.label ?? null : null;
      lines.push({ role, say: line.say, pick });
      continue;
    }
    const backed = view.choices.find((choice) => choice.backers.some((tag) => TAG_TO_ADVISOR[tag] === role));
    if (!backed) continue;
    lines.push({ role, say: `My vote: ${backed.label.toLowerCase()}.`, pick: backed.label }); // OWNER WRITES
  }
  return lines.slice(0, limit);
}

export const timingFor = (id) => TIMING[baseId(id)] ?? DEFAULT_TIMING;

export function formatStoryTime(days) {
  if (days < 1) return 'less than a day';
  if (days < 14) {
    const whole = Math.round(days);
    return whole === 1 ? '1 day' : `${whole} days`;
  }
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  return `about ${Math.round(days / DAYS_PER_MONTH)} months`;
}

export function daysLeft({ timingDays, landedMonths, nowMonths, daysUntilRound }) {
  const own = timingDays - (nowMonths - landedMonths) * DAYS_PER_MONTH;
  return Math.max(0, Math.min(own, daysUntilRound));
}

export const dueText = (id, days) => timingFor(id).due.replace('{time}', formatStoryTime(days));

export function consequenceLines({ before, answered, events }) {
  const auto = new Map(events.filter((event) => event.type === 'eventResolved' && event.auto).map((event) => [event.id, event.choiceId]));
  return before.flatMap((card) => {
    const handled = Object.hasOwn(answered, card.id);
    const choiceId = handled ? answered[card.id] : auto.get(card.id);
    if (!choiceId) return [];
    const choice = card.choices.find((candidate) => candidate.id === choiceId);
    const written = CONSEQUENCES[baseId(card.id)]?.[choiceId];
    const text = written ?? `${card.title}: it ended with “${choice?.label ?? choiceId}”.`;
    return [{ head: handled ? 'Handled' : 'Nobody answered', ok: handled, text }];
  });
}

// game.setField replaces a whole field, so merge before writing.
export function queueAnswer(game, id, choiceId) {
  game.setField('eventChoices', { ...(game.queue.eventChoices ?? {}), [id]: choiceId });
}

export function queueLookInto(game, id) {
  const ids = game.queue.addressWarnings ?? [];
  if (!ids.includes(id)) game.setField('addressWarnings', [...ids, id]);
}

export function jokeFor(role, band, turn) {
  const lines = JOKES[role]?.[band];
  return lines?.length ? lines[turn % lines.length] : null;
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `node --test tests/ui-events.test.js`
Expected: all 9 tests PASS. Then run `npm test`; expected: no new failures.

- [ ] **Step 6: Commit**

```bash
git add ui/data/eventCopy.js ui/logic/events.js tests/ui-events.test.js
git commit -m "feat(ui): event card view logic, warning owners and event copy"
```

---

### Task 2: Draft the consequence lines (owner pick 4A)

A writing task. The owner said "we will write them when we are going through all of the events, lets say you draft it". So these are drafts the owner replaces later.

**Files:**
- Modify: `ui/data/eventCopy.js` (the `CONSEQUENCES` object only)
- Test: `tests/ui-events.test.js` (one new test)

**Interfaces:**
- Consumes: the catalog in `sim/data/events.js` and `sim/data/events6c.js` (read each row's card text, choices and `effects` code to know what actually happens).
- Produces: `CONSEQUENCES[cardId][choiceId]` for every choice of every catalog row. `promiseCall` has keys `deliver`, `stall`, `refuse`.

- [ ] **Step 1: Write the failing completeness test** (append to `tests/ui-events.test.js`):

```js
test('every card choice has a drafted consequence line', () => {
  for (const row of ALL) {
    for (const choice of row.card.choices) {
      const line = COPY.CONSEQUENCES[row.id]?.[choice.id];
      assert.equal(typeof line, 'string', `${row.id}.${choice.id}`);
      assert.ok(line.length >= 20 && line.length <= 180, `${row.id}.${choice.id} length`);
      assert.doesNotMatch(line, /\d+\s*%|\bdebt\b|\btrust\b|\bfavou?r\b|\bheat\b/i, `${row.id}.${choice.id} names a hidden number or meter`);
    }
  }
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/ui-events.test.js`
Expected: FAIL on `flattery.rollback`.

- [ ] **Step 3: Write the lines.** Rules for every line:
  - One or two plain sentences, 20 to 180 characters, past tense, told as what happened in the world ("The screenshots kept spreading…"), never as "you chose X".
  - It must match what the choice's `effects` code actually does. Read the code; do not invent effects.
  - Never name a hidden meter (trust, debt, favour, heat, support) or give a number for one. Visible money is fine ("It cost $60M.").
  - Fictional names only, as in the catalog. No "turn".
  - End every line with `// OWNER WRITES`.
  - Keep the object in catalog order: `EVENTS` rows first, then `EVENTS_6C`.

  The four crises, written out as the pattern to follow:

```js
  weightTheft: {
    report: 'You told Washington. Agents came through the office for a week, and the story broke with you on the right side of it.', // OWNER WRITES
    hunt: 'The quiet hunt cost $30M and found a contractor account nobody had closed. The weights were already gone.', // OWNER WRITES
    silence: 'Nobody said anything. Months later a foreign model answered questions in a very familiar voice.', // OWNER WRITES
  },
  selfExfiltration: {
    report: 'Internal use went dark and the government was told. The copy stopped at 61%.', // OWNER WRITES
    coverup: 'The logs were wiped. Security got tighter, and everyone who saw the terminal learned to stop talking.', // OWNER WRITES
  },
  whistleblower: {
    cooperate: 'Outside reviewers moved in for a month. It cost $20M, and the story ran with your cooperation in it.', // OWNER WRITES
    nda: 'The lawyers sent the letter. The letter became the story, and now there is a lawsuit.', // OWNER WRITES
    discredit: 'Comms went after them in public. It worked outside the building. Inside, people noticed.', // OWNER WRITES
  },
  safetyQuits: {
    persuade: 'You met their terms and they came back. It cost $30M, and the team saw you do it.', // OWNER WRITES
    smear: 'You questioned their motives. The press took your side for a day; your staff did not.', // OWNER WRITES
    letgo: 'They left. Their post stayed pinned for weeks, and the public read every word of it.', // OWNER WRITES
  },
```

  Check each of these four against the rows' `effects` too, and fix any line whose claim the code does not back.

- [ ] **Step 4: Run the tests**

Run: `node --test tests/ui-events.test.js` and then `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ui/data/eventCopy.js tests/ui-events.test.js
git commit -m "content(ui): draft consequence lines for every event choice (owner rewrites)"
```

---

### Task 3: The event card flow, crisis staging and the busy panel

**Files:**
- Create: `ui/components/eventBits.js`, `ui/data/crisisArt.js`, `ui/screens/events.js`
- Modify: `ui/main.js` (append the mount and the preview route; one guard change), `ui/styles.css` (append)

**Interfaces:**
- Consumes: everything Task 1 produces; `game.subscribe`, `game.state`, `game.clock` (optional; API in Global Constraints).
- Produces:
  - `ui/components/eventBits.js`: `el(html)`, `post({ handle, text })`, `choiceButton(choice)`, `dueBar(text, fraction, { calm })`, `bubbleAt(root, [x, y], { label, say, pick, width, tail, dy, extra })`, `loadAnchors(era) → Promise<anchors>`.
  - `ui/screens/events.js`: `mountEvents(game, { stage, overlay }) → { openCard(id), preview(id), waiting() → [{ id, title, due, expired }] }`. It dispatches `CustomEvent('events-changed')` on `overlay` whenever the set of waiting cards changes, `'event-card-open'` when a card opens and `'event-card-closed'` when it closes.
  - The card layer has class `event-layer`. Other screens treat it like an open dialog.

- [ ] **Step 1: Write `ui/components/eventBits.js`**

```js
// Small DOM helpers shared by the event, briefing and feed screens (plan 2B Task 8).
const AVATAR_TONES = ['var(--teal)', 'var(--coral)', 'var(--sky)', 'var(--wood)'];
const anchorCache = new Map();

export function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function loadAnchors(era) {
  if (!anchorCache.has(era)) {
    anchorCache.set(era, fetch(`ui/assets/anchors-era${era}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
        return response.json();
      })
      .catch((error) => {
        anchorCache.delete(era);
        throw error;
      }));
  }
  return anchorCache.get(era);
}

export function post({ handle, text }) {
  const node = el('<div class="ev-post"><div class="ev-av" aria-hidden="true"></div><div><div class="ev-handle"></div><div class="ev-text"></div></div></div>');
  const letter = (handle.replace('@', '')[0] ?? '?').toUpperCase();
  const avatar = node.querySelector('.ev-av');
  avatar.textContent = letter;
  avatar.style.background = AVATAR_TONES[letter.charCodeAt(0) % AVATAR_TONES.length];
  node.querySelector('.ev-handle').textContent = handle;
  node.querySelector('.ev-text').textContent = text;
  return node;
}

function chip(text, kind) {
  const node = el(`<span class="ev-chip ${kind}"></span>`);
  node.textContent = text;
  return node;
}

export function choiceButton(choice) {
  const row = el('<button type="button" class="ev-choice"><span class="ev-choice-label"></span><span class="ev-choice-cost">Cost: <b></b></span><span class="ev-who"></span></button>');
  row.querySelector('.ev-choice-label').textContent = choice.label;
  row.querySelector('.ev-choice-cost b').textContent = choice.cost;
  const who = row.querySelector('.ev-who');
  if (choice.fallback) who.append(chip('If time runs out', 'idle'));
  for (const name of choice.backers) who.append(chip(`✓ ${name}`, 'for'));
  for (const name of choice.opposers) {
    const against = chip(name, 'against');
    against.setAttribute('aria-label', `${name} is against`);
    who.append(against);
  }
  return row;
}

export function dueBar(text, fraction, { calm = false } = {}) {
  const node = el(`<div class="ev-due${calm ? ' calm' : ''}"><span></span><div class="ev-due-bar"><i></i></div></div>`);
  node.querySelector('span').textContent = text;
  node.querySelector('i').style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  return node;
}

// A speech bubble whose tail points at a head anchor (K2 and E2 bubble grammar). root must be in the DOM.
export function bubbleAt(root, [x, y], { label, say, pick = null, width = 240, tail = 26, dy = -34, extra = null }) {
  const node = el('<div class="ev-bubble"><b></b><div class="ev-say"></div></div>');
  node.querySelector('b').textContent = label;
  node.querySelector('.ev-say').textContent = say;
  if (pick) {
    const picked = el('<span class="ev-pick"></span>');
    picked.textContent = `✓ ${pick}`;
    node.append(picked);
  }
  if (extra) node.append(extra);
  node.style.width = `${width}px`;
  node.style.setProperty('--tail', `${tail}px`);
  root.append(node);
  node.style.left = `${x - tail - 7}px`;
  node.style.top = `${y + dy - node.offsetHeight}px`;
  return node;
}
```

- [ ] **Step 2: Write `ui/data/crisisArt.js`.** Export `PICTURES = { theft, exfil, whistle, quits }`, each the SVG template string copied verbatim from `docs/design/mockups/K2-events-crisis.html` lines 226–274 (the `PICS` object). The `theft` string interpolates rows with `.map(...).join('')`; keep that code as it is. The file starts with `// The four crisis pictures from the owner-picked mockup (K2-events-crisis.html, pick P).` and has no imports.

- [ ] **Step 3: Write `ui/screens/events.js`**

```js
import { PICTURES } from '../data/crisisArt.js';
import { bubbleAt, choiceButton, dueBar, el, loadAnchors, post } from '../components/eventBits.js';
import {
  ADVISOR_TITLE, argueLines, cardView, catalogRow, consequenceLines, daysLeft, dueText, queueAnswer, timingFor,
} from '../logic/events.js';

const CLOCK_REASON = 'event-card';

// Crisis staging in the room (owner pick B). Positions follow the era's rack and head anchors.
function stageRoom(staging, { stage, layerRoot, anchors }) {
  const layer = el(`<div class="ev-theme ev-wash-${staging.room}" aria-hidden="true"><svg width="1440" height="900" viewBox="0 0 1440 900"></svg></div>`);
  const svg = layer.querySelector('svg');
  const [rx, ry] = anchors.rack ?? [1150, 440];
  const restore = [];
  const tag = (text, x, y, tone = '') => {
    const node = el(`<div class="ev-tag ${tone}"></div>`);
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    layer.append(node);
  };

  if (staging.room === 'theft') {
    stage.classList.add('ev-dim-office');
    svg.innerHTML = `
      <defs><pattern id="ev-tape" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="16" style="fill:var(--coral)"/><rect x="8" width="8" height="16" style="fill:var(--ink)"/></pattern></defs>
      <path d="M${rx - 90} ${ry + 80} L${rx + 98} ${ry} L${rx + 98} ${ry + 18} L${rx - 90} ${ry + 98} Z" style="fill:url(#ev-tape);opacity:.92"/>
      <path d="M${rx - 90} ${ry + 160} L${rx + 98} ${ry + 80} L${rx + 98} ${ry + 96} L${rx - 90} ${ry + 176} Z" style="fill:url(#ev-tape);opacity:.92"/>
      <circle cx="${rx}" cy="${ry - 56}" r="30" style="fill:color-mix(in oklab, var(--coral) 40%, transparent)"/>
      <circle cx="${rx}" cy="${ry - 56}" r="9" style="fill:var(--coral);stroke:var(--paper);stroke-width:2"/>`;
    tag(staging.tag, rx - 64, ry - 100, 'coral');
    restore.push(() => stage.classList.remove('ev-dim-office'));
  } else if (staging.room === 'exfil') {
    stage.classList.add('ev-dim-office');
    const dots = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const x = rx + 8 + t * (1432 - rx - 8);
      const y = ry - 36 - t * (ry - 36 - 232) + Math.sin(t * 3) * 14;
      return `<rect x="${x}" y="${y}" width="10" height="7" rx="2" style="fill:var(--sky);opacity:${1 - t * 0.6}"/>`;
    }).join('');
    svg.innerHTML = `<path d="M${rx + 8} ${ry - 36} C${rx + 98} ${ry - 90} ${rx + 188} ${ry - 160} 1432 232" style="fill:none;stroke:var(--sky);stroke-width:3;stroke-dasharray:8 7"/>${dots}`;
    tag(staging.tag, rx + 48, ry - 148, 'sky');
    restore.push(() => stage.classList.remove('ev-dim-office'));
  } else if (staging.room === 'whistle') {
    const [px, py] = anchors.heads.policy;
    tag(staging.tag, px - 60, py - 130);
  } else if (staging.room === 'quits') {
    stage.classList.add('ev-grey-office');
    const hidden = [...stage.querySelectorAll('#person-safety .sitter, #person-safety [class^="face-"]')]
      .filter((node) => node.getAttribute('display') !== 'none');
    for (const node of hidden) node.setAttribute('display', 'none');
    const markers = [...stage.querySelectorAll('.advisor-marker')].filter((node) => node.getAttribute('aria-label')?.startsWith('safety '));
    for (const marker of markers) marker.hidden = true;
    const [sx, sy] = anchors.heads.safety;
    svg.innerHTML = `<g transform="translate(${sx - 19} ${sy + 88})">
      <path d="M-22 -8 L4 -20 L28 -10 L2 2 Z" style="fill:color-mix(in oklab, var(--wood) 45%, var(--paper))"/>
      <path d="M-22 -8 L2 2 L2 26 L-22 16 Z" style="fill:color-mix(in oklab, var(--wood) 65%, var(--cream))"/>
      <path d="M2 2 L28 -10 L28 14 L2 26 Z" style="fill:color-mix(in oklab, var(--wood) 52%, var(--cream))"/>
      <path d="M2 -10 q-4 -20 4 -30 q4 14 -1 30 Z M8 -10 q6 -16 16 -20 q-6 12 -14 20 Z" style="fill:var(--teal)"/></g>`;
    tag(staging.tag, sx - 60, sy - 70);
    restore.push(() => {
      stage.classList.remove('ev-grey-office');
      for (const node of hidden) node.removeAttribute('display');
      for (const marker of markers) marker.hidden = false;
    });
  }
  layerRoot.append(layer);
  return () => {
    layer.remove();
    for (const undo of restore) undo();
  };
}

function showBusy(overlay, lines) {
  overlay.querySelector('.ev-busy')?.remove();
  if (!lines.length) return;
  const node = el('<section class="ev-busy" aria-live="polite"><div class="ev-busy-head"><strong>While you were busy</strong><button type="button" aria-label="Dismiss">×</button></div><ul></ul></section>');
  for (const line of lines) {
    const item = el(`<li${line.ok ? ' class="ok"' : ''}><b></b><span></span></li>`);
    item.querySelector('b').textContent = line.head;
    item.querySelector('span').textContent = line.text;
    node.querySelector('ul').append(item);
  }
  node.querySelector('button').addEventListener('click', () => node.remove());
  overlay.append(node);
  // company.js puts its round toast in the same top-left slot one frame later; sit under it.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const toast = overlay.querySelector('.turn-summary');
    node.style.top = toast ? `${toast.offsetTop + toast.offsetHeight + 10}px` : '104px';
  }));
}

export function mountEvents(game, { stage, overlay }) {
  let anchors = null;
  let answered = {};
  let setAside = new Set();
  let expired = new Set();
  let landed = new Map();
  let queue = [];
  let before = [];
  let current = null;
  let clockHooked = false;

  const clock = () => game.clock ?? null;
  const nowMonths = () => clock()?.now().monthsElapsed ?? 0;
  const emit = (name) => overlay.dispatchEvent(new CustomEvent(name));

  function remaining(id) {
    const running = clock();
    if (!running) return null;
    return daysLeft({
      timingDays: timingFor(id).days,
      landedMonths: landed.get(id) ?? nowMonths(),
      nowMonths: nowMonths(),
      daysUntilRound: running.daysUntilNextRound(),
    });
  }

  function hookClock() {
    const running = clock();
    if (!running || clockHooked) return;
    clockHooked = true;
    running.on('tick', () => {
      let changed = false;
      for (const id of [...setAside]) {
        if (remaining(id) > 0) continue;
        setAside.delete(id);
        expired.add(id);
        changed = true;
      }
      if (changed) emit('events-changed');
    });
  }

  function startRound(state) {
    answered = {};
    setAside = new Set();
    expired = new Set();
    landed = new Map();
    before = state.pendingEvents.map(cardView);
    for (const card of before) landed.set(card.id, nowMonths());
    queue = [...before].sort((a, b) => Number(b.crisis) - Number(a.crisis)).map((card) => card.id);
  }

  function close() {
    if (!current) return;
    const { layer, cleanup } = current;
    current = null;
    layer.remove();
    cleanup?.();
    clock()?.resume(CLOCK_REASON);
    emit('event-card-closed');
    emit('events-changed');
  }

  function openNext() {
    while (!current && queue.length) {
      const id = queue.shift();
      if (openCard(id)) return;
    }
  }

  function render(view, { preview }) {
    const layer = el('<div class="event-layer"></div>');
    overlay.append(layer);
    clock()?.pause(CLOCK_REASON);
    const cleanup = view.staging ? stageRoom(view.staging, { stage, layerRoot: layer, anchors }) : null;
    current = { id: view.id, layer, cleanup };

    const card = el(`<section class="gp ev-card${view.staging ? '' : ' no-pic'}" role="dialog" aria-modal="false"><div class="ev-card-main"><div class="ev-card-top"><h1></h1></div><div class="ev-choices"></div><div class="ev-card-foot"><button type="button" class="ev-act ghost ev-later">Decide later</button></div></div></section>`);
    const titleId = `ev-title-${view.id.replace(/\W/g, '-')}`;
    card.querySelector('h1').id = titleId;
    card.querySelector('h1').textContent = view.title;
    card.setAttribute('aria-labelledby', titleId);
    if (view.crisis) {
      const band = el('<div class="ev-crisis">Crisis <span></span></div>');
      band.querySelector('span').textContent = clock() ? 'The game is paused' : '';
      card.prepend(band);
    }
    if (view.staging) {
      const figure = el('<figure class="ev-pic"><figcaption></figcaption></figure>');
      figure.prepend(el(PICTURES[view.staging.room]));
      figure.querySelector('figcaption').textContent = view.staging.caption;
      card.querySelector('.ev-card-main').before(figure);
    }
    const days = remaining(view.id);
    if (days !== null) card.querySelector('.ev-card-top').append(dueBar(dueText(view.id, days), days / timingFor(view.id).days));
    card.querySelector('.ev-card-top').after(post(view.post));
    for (const choice of view.choices) {
      const button = choiceButton(choice);
      button.addEventListener('click', () => {
        if (!preview) {
          queueAnswer(game, view.id, choice.id);
          answered[view.id] = choice.id;
        }
        close();
        openNext();
      });
      card.querySelector('.ev-choices').append(button);
    }
    const later = () => {
      if (!preview) setAside.add(view.id);
      close();
      openNext();
    };
    card.querySelector('.ev-later').addEventListener('click', later);
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      later();
    });
    layer.append(card);

    for (const line of argueLines(view)) {
      const head = anchors.heads[line.role];
      if (!head) continue;
      bubbleAt(layer, head, { label: ADVISOR_TITLE[line.role], say: line.say, pick: line.pick, width: 240, dy: line.role === 'cfo' ? -64 : -34 });
    }
    card.querySelector('.ev-choice')?.focus();
    emit('event-card-open');
  }

  function openCard(id, { preview = null } = {}) {
    const pending = preview ?? game.state.pendingEvents.find((candidate) => candidate.id === id);
    if (!pending || Object.hasOwn(answered, id) || expired.has(id) || !anchors) return false;
    if (current) {
      if (!preview && !Object.hasOwn(answered, current.id)) setAside.add(current.id);
      close();
    }
    setAside.delete(id);
    render(cardView(pending), { preview: Boolean(preview) });
    return true;
  }

  async function prepare(state) {
    anchors = await loadAnchors(state.era);
    hookClock();
  }

  game.subscribe(({ state, events }) => {
    close();
    const lines = consequenceLines({ before, answered, events });
    prepare(state).then(() => {
      startRound(state);
      showBusy(overlay, lines);
      openNext();
      emit('events-changed');
    }).catch((error) => console.error(error));
  });

  let previewing = false;
  const ready = prepare(game.state).then(() => {
    startRound(game.state);
    if (!previewing) openNext();
    emit('events-changed');
  }).catch((error) => console.error(error));

  return {
    openCard: (id) => openCard(id),
    // Debug route: show any catalog card without queueing an answer.
    async preview(id) {
      const row = catalogRow(id);
      if (!row) return;
      previewing = true;
      await ready;
      queue = [];
      const pending = {
        id,
        title: row.card.title,
        post: row.card.post,
        choices: row.card.choices.map(({ id: choiceId, label, cost, backers, opposers }) => ({ id: choiceId, label, cost, backers, opposers })),
      };
      openCard(id, { preview: pending });
    },
    waiting() {
      return [...setAside, ...expired].map((id) => {
        const view = before.find((card) => card.id === id);
        const days = expired.has(id) ? 0 : remaining(id);
        return {
          id,
          title: view?.title ?? id,
          expired: expired.has(id),
          due: expired.has(id) ? 'Time ran out' : days === null ? null : dueText(id, days),
        };
      });
    },
  };
}
```

- [ ] **Step 4: Append the styles** to the end of `ui/styles.css`:

```css
/* Plan 2B Task 8: event cards and warnings (mockups K2-events.html and K2-events-crisis.html) */
.event-layer { position: absolute; inset: 0; z-index: 20; pointer-events: none; }
.event-layer > * { pointer-events: auto; }
.ev-theme, .ev-theme * { pointer-events: none; }
.ev-theme { position: absolute; inset: 0; z-index: 0; }
.ev-theme svg { position: absolute; inset: 0; }
.ev-wash-theft { background: radial-gradient(ellipse 72% 70% at 55% 55%, transparent 35%, color-mix(in oklab, var(--coral) 36%, transparent) 100%); }
.ev-wash-exfil { background: radial-gradient(ellipse 40% 45% at 80% 50%, color-mix(in oklab, var(--sky) 30%, transparent), transparent 70%), radial-gradient(ellipse 80% 75% at 50% 55%, transparent 45%, color-mix(in oklab, var(--sky) 26%, transparent) 100%); }
.ev-wash-whistle { background: radial-gradient(ellipse 30% 34% at 36% 28%, color-mix(in oklab, var(--paper) 80%, transparent), transparent 70%); }
.ev-wash-quits { background: radial-gradient(ellipse 12% 16% at 48% 56%, transparent 50%, color-mix(in oklab, var(--ink) 30%, transparent) 180%); }
.ev-dim-office #office { filter: saturate(.72) brightness(.94); }
.ev-grey-office #office { filter: saturate(.35) brightness(.97); }
.ev-tag { position: absolute; padding: 3px 9px; border-radius: 8px; font-size: 11.5px; font-weight: 900; color: var(--paper); background: var(--ink); box-shadow: 0 2px 0 color-mix(in oklab, var(--ink) 30%, transparent); white-space: nowrap; }
.ev-tag.sky { background: color-mix(in oklab, var(--sky) 70%, var(--ink)); }
.ev-tag.coral { background: color-mix(in oklab, var(--coral) 80%, var(--ink)); }

.ev-post { display: grid; grid-template-columns: 30px 1fr; gap: 9px; text-align: left; }
.ev-av { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--paper); font-weight: 900; font-size: 13px; }
.ev-handle { font-size: 12.5px; font-weight: 900; }
.ev-text { font-size: 13.5px; font-weight: 600; line-height: 1.32; margin-top: 1px; }

.ev-act { white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0; border-radius: 9px; font: inherit; font-size: 13px; font-weight: 900; color: var(--paper); background: var(--coral); box-shadow: 0 2px 0 color-mix(in oklab, var(--coral) 60%, var(--ink)); cursor: pointer; }
.ev-act.ghost { color: color-mix(in oklab, var(--wood) 72%, var(--ink)); background: transparent; box-shadow: none; padding-inline: 4px; }
.ev-act:disabled { opacity: .55; cursor: default; }

.ev-due { display: grid; gap: 4px; min-width: 210px; }
.ev-due span { font-size: 12.5px; font-weight: 900; text-align: right; }
.ev-due-bar { height: 8px; border-radius: 4px; background: color-mix(in oklab, var(--ink) 9%, var(--paper)); overflow: hidden; }
.ev-due-bar i { display: block; height: 100%; border-radius: 4px; background: var(--coral); }
.ev-due.calm .ev-due-bar i { background: var(--wood); }

.ev-bubble { position: absolute; z-index: 2; background: var(--paper); border-radius: 12px; padding: 8px 12px 10px; font-size: 13px; font-weight: 700; line-height: 1.3; border: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); box-shadow: 0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 8px 18px color-mix(in oklab, var(--ink) 14%, transparent); }
.ev-bubble::after { content: ""; position: absolute; left: var(--tail, 24px); bottom: -8px; width: 14px; height: 14px; background: var(--paper); transform: rotate(45deg); border-right: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); border-bottom: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); }
.ev-bubble b { display: block; font-size: 10.5px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: color-mix(in oklab, var(--wood) 60%, var(--ink)); }
.ev-say { margin-top: 2px; font-size: 14px; }
.ev-pick { display: inline-block; margin-top: 5px; font-size: 11.5px; font-weight: 800; padding: 1px 8px; border-radius: 999px; background: color-mix(in oklab, var(--teal) 14%, var(--paper)); color: color-mix(in oklab, var(--teal) 62%, var(--ink)); }
.ev-bubble .ev-row { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.ev-bubble .ev-due { margin-top: 8px; min-width: 0; }
.ev-bubble .ev-due span { text-align: left; font-size: 11.5px; }

.ev-choice { display: grid; grid-template-columns: 1fr; gap: 4px; width: 100%; padding: 9px 12px; border: 2.5px solid color-mix(in oklab, var(--ink) 12%, transparent); border-radius: 12px; background: var(--paper); font: inherit; text-align: left; color: var(--ink); cursor: pointer; }
.ev-choice:hover, .ev-choice:focus-visible { border-color: var(--teal); outline: none; box-shadow: 0 0 0 4px color-mix(in oklab, var(--teal) 16%, transparent); }
.ev-choice-label { font-size: 15.5px; font-weight: 900; line-height: 1.2; }
.ev-choice-cost { font-size: 12.5px; font-weight: 700; color: color-mix(in oklab, var(--ink) 62%, var(--paper)); }
.ev-choice-cost b { color: var(--ink); font-weight: 900; }
.ev-who { display: flex; gap: 4px; flex-wrap: wrap; }
.ev-chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; }
.ev-chip.for { background: color-mix(in oklab, var(--teal) 14%, var(--paper)); color: color-mix(in oklab, var(--teal) 62%, var(--ink)); }
.ev-chip.against { background: color-mix(in oklab, var(--ink) 6%, var(--paper)); color: color-mix(in oklab, var(--ink) 62%, var(--paper)); text-decoration: line-through; text-decoration-thickness: 1.5px; }
.ev-chip.idle { background: color-mix(in oklab, var(--wood) 18%, var(--paper)); color: color-mix(in oklab, var(--wood) 62%, var(--ink)); }

.ev-card { position: absolute; left: 250px; right: 250px; bottom: 20px; padding: 0; text-align: left; display: grid; grid-template-columns: auto 1fr; }
.ev-crisis { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding: 6px 18px 7px; background: var(--coral); color: var(--paper); font-size: 12.5px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.ev-crisis span { letter-spacing: 0; text-transform: none; font-weight: 700; }
.ev-pic { margin: 0; width: 214px; padding: 14px 0 16px 18px; }
.ev-pic svg { display: block; width: 196px; height: 150px; border-radius: 8px; }
.ev-pic figcaption { margin-top: 5px; font-size: 10.5px; font-weight: 800; color: color-mix(in oklab, var(--ink) 55%, var(--paper)); }
.ev-card-main { padding: 12px 20px 12px; }
.ev-card.no-pic .ev-card-main { grid-column: 1 / -1; }
.ev-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
.ev-card h1 { margin: 0; font-size: 27px; font-weight: 300; line-height: 1.1; }
.ev-card .ev-post { margin-top: 8px; }
.ev-choices { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; margin-top: 12px; }
.ev-card-foot { display: flex; justify-content: flex-end; margin-top: 6px; }

.ev-busy { position: absolute; z-index: 8; top: 104px; left: 18px; width: 380px; overflow: hidden; border: 2px solid var(--wood); border-radius: 12px; background: var(--paper); box-shadow: 0 3px 0 color-mix(in oklab, var(--wood) 55%, var(--ink)), 0 12px 28px color-mix(in oklab, var(--ink) 20%, transparent); }
.ev-busy-head { display: flex; justify-content: space-between; align-items: center; min-height: 34px; padding: 5px 8px 5px 14px; color: var(--paper); background: var(--wood); font-size: 14px; font-weight: 900; }
.ev-busy-head button { width: 26px; height: 26px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--paper); font: inherit; font-size: 18px; cursor: pointer; }
.ev-busy ul { list-style: none; margin: 0; padding: 4px 14px 12px; }
.ev-busy li { padding: 9px 0; border-top: 1px solid color-mix(in oklab, var(--wood) 22%, transparent); font-size: 13.5px; font-weight: 700; line-height: 1.35; }
.ev-busy li:first-child { border-top: 0; }
.ev-busy li b { display: block; font-size: 11px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; color: color-mix(in oklab, var(--coral) 60%, var(--ink)); margin-bottom: 2px; }
.ev-busy li.ok b { color: color-mix(in oklab, var(--teal) 60%, var(--ink)); }

@media (prefers-reduced-motion: reduce) {
  .ev-choice { transition: none; }
}
```

- [ ] **Step 5: Mount the flow in `ui/main.js`.** Add the import next to the other screen imports:

```js
import { mountEvents } from './screens/events.js';
```

  and, right after `mountTurnSummary(overlay, game);`, add:

```js
const events = mountEvents(game, { stage, overlay });
```

  (`stage` is declared above this line in the file already.)

- [ ] **Step 6: Block the floor menu while a card is open.** In `ui/main.js`, add after the `stagePoint` function:

```js
const blocked = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer'));
```

  and replace the three existing `overlay.querySelector('.dialog-layer')` checks in the `office` click and keydown handlers with `blocked()`. Change nothing else in those handlers.

- [ ] **Step 7: Add the preview route.** At the top of `openDebugRoute()` in `ui/main.js`, add:

```js
  const previewId = location.hash.match(/^#event-(\w+)$/)?.[1];
  if (previewId) {
    await events.preview(previewId);
    return;
  }
```

- [ ] **Step 8: Run the tests**

Run: `npm test`
Expected: PASS (no test covers the DOM screens; nothing else may break).

- [ ] **Step 9: Look at it.** Serve the worktree root with `python3 -m http.server 8741` and screenshot, at 1440×900:
  - `index.html?scenario=event&seed=10` (the investors card opens by itself; three advisor bubbles at most);
  - `index.html?scenario=event&seed=10#event-weightTheft`, `#event-selfExfiltration`, `#event-whistleblower`, `#event-safetyQuits` (each crisis staged, picture on the card);
  - `#event-agentSurge` (three choices without a picture).

  Compare each with the mockup routes in `docs/design/mockups/K2-events-crisis.html` (`#theft-pic`, `#exfil-pic`, `#whistle-pic`, `#quits-pic`). Check that bubbles do not cover the card, that no bubble runs off the stage, and that "Decide later" and a choice both close the card. Fix what is off before committing.

- [ ] **Step 10: Commit**

```bash
git add ui/components/eventBits.js ui/data/crisisArt.js ui/screens/events.js ui/main.js ui/styles.css
git commit -m "feat(ui): event cards along the bottom, advisors arguing, crises staged in the room"
```

---

### Task 4: Advisor bubbles and warnings (picks 7A and 1C)

**Files:**
- Create: `ui/screens/briefing.js`
- Modify: `ui/main.js` (append the mount), `ui/styles.css` (append two rules)

**Interfaces:**
- Consumes: `openWarnings`, `lookIntoCost`, `queueLookInto`, `jokeFor`, `formatStoryTime`, `ADVISOR_TITLE` (Task 1); `el`, `post`, `dueBar`, `bubbleAt`, `loadAnchors` (Task 3); the `event-card-open` and `event-card-closed` overlay events (Task 3).
- Produces: `mountBriefing(game, { office, overlay }) → { lookedInto() → string[] }`. It dispatches `events-changed` on `overlay` after the player looks into a warning.

- [ ] **Step 1: Write `ui/screens/briefing.js`**

```js
import { bubbleAt, dueBar, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE, formatStoryTime, jokeFor, lookIntoCost, openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';

const ROLES = ['research', 'safety', 'cfo', 'policy'];

export function mountBriefing(game, { office, overlay }) {
  const root = el('<div class="ev-briefing"></div>');
  overlay.append(root);
  let anchors = null;
  let shownWarnings = new Set();
  let waitingWarnings = [];
  let talking = null;

  const cardOpen = () => Boolean(overlay.querySelector('.event-layer'));
  const bandOf = (role) => game.state.lastBriefing?.find((reading) => reading.id === role)?.band ?? 'calm';
  const lookedInto = () => game.queue.addressWarnings ?? [];

  function clearTalking() {
    talking?.remove();
    talking = null;
  }

  // 7A: clicking an advisor shows their line (and sometimes a joke) and clears their "!" until the next update.
  function speak(role) {
    if (!anchors?.heads?.[role] || cardOpen()) return;
    clearTalking();
    const reading = game.state.lastBriefing?.find((candidate) => candidate.id === role);
    const band = bandOf(role);
    const joke = jokeFor(role, band, game.state.turn);
    const say = [reading?.line ?? 'Nothing to report yet.', joke].filter(Boolean).join(' ');
    talking = bubbleAt(root, anchors.heads[role], { label: `${ADVISOR_TITLE[role]} · ${band}`, say, width: 260 });
    for (const marker of overlay.parentElement.querySelectorAll('.advisor-marker')) {
      if (marker.getAttribute('aria-label')?.startsWith(`${role} `)) marker.remove();
    }
  }

  function makeClickable() {
    for (const role of ROLES) {
      const person = office.querySelector(`#person-${role}`);
      if (!person || person.hasAttribute('tabindex')) continue;
      person.setAttribute('tabindex', '0');
      person.setAttribute('role', 'button');
      person.setAttribute('aria-label', `${ADVISOR_TITLE[role]}: hear what they think`);
      person.style.cursor = 'pointer';
    }
  }

  const roleOf = (target) => ROLES.find((role) => target.closest?.(`#person-${role}`));
  office.addEventListener('click', (event) => {
    const role = roleOf(event.target);
    if (!role) return;
    event.stopPropagation();
    speak(role);
  });
  office.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const role = roleOf(event.target);
    if (!role) return;
    event.preventDefault();
    speak(role);
  });
  document.addEventListener('pointerdown', (event) => {
    if (talking && !talking.contains(event.target) && !roleOf(event.target)) clearTalking();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearTalking();
  });
  new MutationObserver(makeClickable).observe(office, { childList: true });

  // 1C: the owning advisor raises a new warning at their desk. Warnings only inform, so the clock keeps running.
  function warningBubble(warning) {
    const head = anchors?.heads?.[warning.advisor];
    if (!head) return null;
    const extra = el('<div></div>');
    const days = game.clock?.daysUntilNextRound?.();
    if (Number.isFinite(days)) {
      extra.append(dueBar(`Gets worse in ${formatStoryTime(days)} if nobody acts`, 0.25, { calm: true })); // OWNER WRITES
    }
    const row = el('<div class="ev-row"><button type="button" class="ev-act"></button><button type="button" class="ev-act ghost">Not now</button></div>');
    const act = row.querySelector('.ev-act');
    act.textContent = `Look into it (${money(lookIntoCost(game.state))})`;
    extra.append(row);
    const node = bubbleAt(root, head, {
      label: `${ADVISOR_TITLE[warning.advisor]} · ${bandOf(warning.advisor)}`,
      say: `Heads up: “${warning.text}” Might be nothing. It is never nothing.`, // OWNER WRITES
      width: 300,
      tail: 30,
      extra,
    });
    const done = () => {
      node.remove();
      showNextWarning();
    };
    act.addEventListener('click', () => {
      queueLookInto(game, warning.id);
      overlay.dispatchEvent(new CustomEvent('events-changed'));
      done();
    });
    row.querySelector('.ghost').addEventListener('click', done);
    return node;
  }

  function showNextWarning() {
    while (!cardOpen() && !root.querySelector('.ev-warning-live') && waitingWarnings.length) {
      const node = warningBubble(waitingWarnings.shift());
      node?.classList.add('ev-warning-live');
    }
  }

  function refresh(state) {
    clearTalking();
    root.querySelectorAll('.ev-warning-live').forEach((node) => node.remove());
    loadAnchors(state.era).then((loaded) => {
      anchors = loaded;
      makeClickable();
      const fresh = openWarnings(state, lookedInto()).filter((warning) => !shownWarnings.has(warning.id));
      for (const warning of fresh) shownWarnings.add(warning.id);
      waitingWarnings = fresh;
      showNextWarning();
    }).catch((error) => console.error(error));
  }

  overlay.addEventListener('event-card-closed', showNextWarning);
  overlay.addEventListener('event-card-open', clearTalking);
  game.subscribe(({ state }) => {
    // A warning that was answered or became a card can be shown again if it comes back later.
    shownWarnings = new Set([...shownWarnings].filter((id) => Object.hasOwn(state.warnings ?? {}, id)));
    refresh(state);
  });
  refresh(game.state);

  return { lookedInto };
}
```

- [ ] **Step 2: Append two rules** to the Task 8 block in `ui/styles.css`:

```css
.ev-briefing { position: absolute; inset: 0; z-index: 12; pointer-events: none; }
.ev-briefing > * { pointer-events: auto; }
```

- [ ] **Step 3: Mount it in `ui/main.js`.** Add `import { mountBriefing } from './screens/briefing.js';` with the other imports and, right after the `mountEvents` line, add:

```js
mountBriefing(game, { office, overlay });
```

  The `office` click handler in `main.js` opens the floor menu only for `#floor` and the article only for `#person-ceo`, so advisor clicks need no change there. Check that clicking the floor still opens the menu.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Look at it.** With the server from Task 3, screenshot `index.html?scenario=event&seed=10` after closing the investors card: the CFO raises the neocloud warning at their desk with "Look into it ($10M)". Click the Head of Safety: their line opens in a bubble and their "!" (if any) disappears. Compare with `K2-events-crisis.html#realtime` and `#joke`. Check that the bubble tail points at the head and that nothing covers the HUD. Fix, then commit.

- [ ] **Step 6: Commit**

```bash
git add ui/screens/briefing.js ui/main.js ui/styles.css
git commit -m "feat(ui): advisors speak when clicked and raise warnings at their desks"
```

---

### Task 5: The desk phone

**Files:**
- Create: `ui/screens/feed.js`
- Modify: `ui/main.js` (append the mount), `ui/styles.css` (append)

**Interfaces:**
- Consumes: `openWarnings`, `lookIntoCost`, `queueLookInto` (Task 1); `el`, `post`, `loadAnchors` (Task 3); the `events` controller's `waiting()` and `openCard(id)` (Task 3); the `events-changed` overlay event.
- Produces: `mountFeed(game, { overlay, events })`.

- [ ] **Step 1: Write `ui/screens/feed.js`**

```js
import { el, loadAnchors, post } from '../components/eventBits.js';
import { lookIntoCost, openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';

// The phone on the CEO desk (plan 2D option A): a count of what waits for you, and the feed.
export function mountFeed(game, { overlay, events }) {
  const button = el('<button type="button" class="ev-phone-button"></button>');
  overlay.append(button);
  let panel = null;

  const waitingWarnings = () => openWarnings(game.state, game.queue.addressWarnings ?? []);
  const count = () => events.waiting().filter((card) => !card.expired).length + waitingWarnings().length;

  function drawButton() {
    const n = count();
    button.setAttribute('aria-label', n ? `Your phone: ${n} waiting` : 'Your phone: the feed');
    button.innerHTML = `<svg viewBox="-30 -25 60 50" width="60" height="50" aria-hidden="true">
      <g transform="rotate(-30)"><rect x="-15" y="-8" width="30" height="16" rx="4" style="fill:var(--ink)"/><rect x="-12" y="-5.5" width="24" height="11" rx="2" style="fill:color-mix(in oklab, var(--sky) 55%, var(--paper))"/></g>
      ${n ? `<circle cx="18" cy="-16" r="9" style="fill:var(--coral);stroke:var(--paper);stroke-width:2"/><text x="18" y="-12" text-anchor="middle" style="font:900 11px Nunito;fill:var(--paper)">${n}</text>` : ''}</svg>`;
  }

  function place() {
    loadAnchors(game.state.era).then((anchors) => {
      const [x, y] = anchors.heads.ceo;
      button.style.left = `${x - 3}px`;
      button.style.top = `${y + 96}px`;
    }).catch((error) => console.error(error));
  }

  function section(title) {
    const node = el('<div class="ev-phone-sec"></div>');
    node.textContent = title;
    return node;
  }

  function closePanel() {
    panel?.remove();
    panel = null;
    button.focus();
  }

  function drawPanel() {
    const fresh = el('<section class="ev-phone" role="dialog" aria-label="Your phone"><div class="ev-phone-scr"><div class="ev-phone-notch"></div><div class="ev-phone-top"><h2>Feed</h2><button type="button" class="ev-act ghost" aria-label="Close the phone">×</button></div><div class="ev-phone-list"></div></div></section>');
    const list = fresh.querySelector('.ev-phone-list');
    const cards = events.waiting();
    if (cards.length) {
      list.append(section('Waiting for you'));
      for (const card of cards) {
        const row = el('<div class="ev-phone-row"><b></b><span class="ev-phone-hint"></span><button type="button" class="ev-act">Open</button></div>');
        row.querySelector('b').textContent = card.title;
        row.querySelector('.ev-phone-hint').textContent = card.due ?? '';
        const open = row.querySelector('button');
        if (card.expired) open.disabled = true;
        open.addEventListener('click', () => {
          closePanel();
          events.openCard(card.id);
        });
        list.append(row);
      }
    }
    const warnings = waitingWarnings();
    if (warnings.length) {
      list.append(section('Warnings'));
      for (const warning of warnings) {
        const row = el('<div class="ev-phone-row stack"><button type="button" class="ev-act"></button></div>');
        row.prepend(post(warning));
        const act = row.querySelector('button');
        act.textContent = `Look into it (${money(lookIntoCost(game.state))})`;
        act.addEventListener('click', () => {
          queueLookInto(game, warning.id);
          overlay.dispatchEvent(new CustomEvent('events-changed'));
        });
        list.append(row);
      }
    }
    list.append(section('Latest'));
    for (const item of (game.state.feed ?? []).slice(-20).reverse()) {
      const row = el('<div class="ev-phone-item"></div>');
      row.append(post(item));
      list.append(row);
    }
    fresh.querySelector('.ev-phone-top button').addEventListener('click', closePanel);
    fresh.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePanel();
    });
    if (panel) panel.replaceWith(fresh);
    else overlay.append(fresh);
    panel = fresh;
  }

  button.addEventListener('click', () => {
    if (panel) closePanel();
    else {
      drawPanel();
      panel.querySelector('.ev-phone-top button').focus();
    }
  });
  overlay.addEventListener('events-changed', () => {
    drawButton();
    if (panel) drawPanel();
  });
  game.subscribe(() => {
    place();
    drawButton();
    if (panel) drawPanel();
  });
  place();
  drawButton();
}
```

- [ ] **Step 2: Append the phone styles** to the Task 8 block in `ui/styles.css`:

```css
.ev-phone-button { position: absolute; z-index: 7; width: 60px; height: 50px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.ev-phone-button:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; border-radius: 10px; }
.ev-phone { position: absolute; z-index: 25; left: 22px; top: 104px; width: 330px; height: 700px; border-radius: 38px; background: var(--ink); padding: 12px; box-shadow: 0 3px 0 color-mix(in oklab, var(--ink) 70%, var(--cream)), 0 20px 44px color-mix(in oklab, var(--ink) 30%, transparent); }
.ev-phone-scr { position: relative; height: 100%; border-radius: 28px; background: var(--paper); overflow: auto; padding: 0 16px 16px; }
.ev-phone-notch { position: absolute; left: 50%; top: 9px; width: 86px; height: 22px; margin-left: -43px; border-radius: 12px; background: var(--ink); }
.ev-phone-top { display: flex; justify-content: space-between; align-items: baseline; padding: 44px 2px 8px; border-bottom: 2px solid color-mix(in oklab, var(--wood) 30%, transparent); }
.ev-phone-top h2 { margin: 0; font-size: 22px; font-weight: 900; }
.ev-phone-sec { margin: 12px 0 6px; font-size: 10.5px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: color-mix(in oklab, var(--ink) 55%, var(--paper)); }
.ev-phone-row { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; align-items: center; padding: 10px 12px; border-radius: 12px; background: var(--paper); border: 2px solid color-mix(in oklab, var(--wood) 40%, var(--paper)); margin-top: 8px; }
.ev-phone-row b { font-size: 14px; font-weight: 900; line-height: 1.2; }
.ev-phone-hint { grid-column: 1; font-size: 11.5px; font-weight: 700; color: color-mix(in oklab, var(--ink) 60%, var(--paper)); }
.ev-phone-row.stack { grid-template-columns: 1fr; gap: 8px; }
.ev-phone-row.stack .ev-act { justify-self: end; }
.ev-phone-item { padding: 9px 0; border-top: 1px solid color-mix(in oklab, var(--wood) 25%, transparent); }
```

- [ ] **Step 3: Mount it in `ui/main.js`.** Add `import { mountFeed } from './screens/feed.js';` with the other imports and, right after the `mountBriefing` line:

```js
mountFeed(game, { overlay, events });
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Look at it.** Screenshot `index.html?scenario=event&seed=10`: put the investors card aside with "Decide later", then check that the phone on the CEO desk shows 2 (the card and the neocloud warning). Open the phone: "Waiting for you" lists the investors card with an Open button, "Warnings" lists the neocloud post, "Latest" lists the feed. Open the card from the phone, answer it, and check that the count drops. Compare with `K2-events.html#inbox`. Fix, then commit.

- [ ] **Step 6: Commit**

```bash
git add ui/screens/feed.js ui/main.js ui/styles.css
git commit -m "feat(ui): the desk phone holds set-aside cards, warnings and the feed"
```

---

### Task 6: Play it through and publish the review page

**Files:** none new, except fixes found here.

- [ ] **Step 1: Run the suite.** `npm test`. Expected: PASS.
- [ ] **Step 2: Play one run in the browser** from `index.html?seed=10` until at least two rounds with cards have passed. Check each of these, and fix anything that fails:
  - Cards open one after another after each round (5A). A crisis opens first.
  - "Decide later" keeps the card on the phone; answering from the phone works.
  - After the round, "While you were busy" lists "Handled" and "Nobody answered" lines and sits under the round toast, not on top of it.
  - Looking into a warning lowers the phone count, and the next round has no card for it.
  - The floor menu does not open while a card is up.
  - No console errors (`read_console_messages` with `onlyErrors`).
  - With `prefers-reduced-motion` emulated, nothing animates.
- [ ] **Step 3: If `ui/clock.js` from the real-time lane has been merged into `ui` by now,** merge `origin/ui` into `events-build`, then check that an open card pauses the clock, that the due bar shows story days, and that a set-aside card turns into "Time ran out" when its days pass. If the clock is not merged yet, record in the plan's review record that this path is untested.
- [ ] **Step 4: Publish the screenshots** (a card, each of the four crises, a warning bubble, an advisor bubble, the phone and the busy panel) as one private review artifact for the owner, following the design skill's screenshot rules. Record every owner reaction in `~/.claude/skills/design/LEARNINGS.md` the same day.

---

## Changes made during the build (2026-09-26)

The owner picked week-by-week time (real-time pick 1D) while this plan was being built. The real-time lane then set a new contract, and the code follows it instead of the task text above:

- **Cards can outlive a round.** The `daysUntilNextRound()` cap is gone. The sim gives each pending card `landsAt` and `dueAt` in story days and counts `state.day`. The UI shows a card once `state.day >= landsAt`, and its bar shows `dueAt - state.day` (`hasLanded`, `daysLeft(pending, state)` in `ui/logic/events.js`). Without those fields (turn mode) cards show at once with no bar.
- **Timing lives in the sim.** The days moved from `ui/data/eventCopy.js` to a new data file, `sim/data/eventTiming.js` (`EVENT_TIMING`, `DEFAULT_EVENT_TIMING`). The real-time sim reads it to set `dueAt`. This is the one file this lane adds under `sim/`, at the real-time lane's request. The due phrases stay in `eventCopy.js` as `DUE` and `DEFAULT_DUE`.
- **The card flow is diff-based.** Subscribers now fire after every story day, so `mountEvents` no longer resets per round. It queues cards that land and writes a consequence line for cards that leave. The "Time ran out" state was dropped: an unanswered card leaves the sim at `dueAt` and becomes a "Nobody answered" line.
- **Answers apply at once** through `game.answerCard(id, choiceId)` when the game has it; otherwise they merge into `eventChoices` (`queueAnswer`).
- **Warnings** show "Gets worse in …" from `state.warnings[id].dueAt` when it exists.
- **Bubbles rise above an advisor's "!" marker** (dy −64 when their band is not calm), and `separate()` lifts one of two bubbles that would touch.
- **The whistleblower's press tag** sits by the door, down-left of the Policy desk, where no bubble covers it.
- **IBM Plex Mono** was added to the font link in `index.html` for the crisis pictures.
