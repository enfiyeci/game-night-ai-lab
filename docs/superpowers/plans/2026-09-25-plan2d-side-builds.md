# Plan 2D: side builds (feed, voices, era card, endings collection, demo seeds)

**Date:** 2026-09-25. **Owner decisions this plan rests on (2026-09-25, in chat):**

- The feed is for reading people's reactions to what is going on and to how your new model was
  received. It is flavour and reception, not a hidden signal source.
- Start all side builds in parallel: feed, era-change card, endings collection, demo-seed
  finder.
- Narrator: **Lumen, option (a)**: present all game, a line at the start of each turn, and the
  ending epilogue.
- Advisor cast approved: Priya Raman (Head of Research), Tomas Lind (Head of Safety), Margot
  Hale (CFO), Jules Ferreira (Policy and Comms).

**Why side builds:** none of this is owned by plan 2A (mechanics, owns `sim/`) or plan 2B (UI).
Each build lives on its own branch and worktree and touches new files only, except build D2,
which edits `sim/data/advisorLines.js` and one function in `sim/advisors.js` (plan 2A does not
touch either). Wiring into `endTurn` and the screens happens after the lanes land, as small
follow-up steps listed per build.

## Global constraints (all builds)

- Pure ES modules, no DOM in `sim/` or `ui/logic/`. No `Math.random`, no `Date` in `sim/`.
- **Never consume the game's rng.** Content picks either use a turn index or a private rng from
  `createRng(seedFor(state))`, so adding these builds does not shift any existing seeded result.
- Fictional names only. Rivals: OpenBrain, Lodestar, DeepThink, Qilin. No real people, labs,
  companies or products. Posts and lines never show hidden numbers.
- Tone: plain, short, dry humour. Posts are lowercase and casual, at most 140 characters.
  Advisor and Lumen lines are full sentences, at most 120 characters.
- `npm test` passes after every commit; gate each commit on its exit status. Stage by explicit
  path. Commit trailer: `Co-Authored-By: Codex (gpt-5.6-sol) <noreply@openai.com>`.
- Touch only the files the build lists.

## Branches

| Build | Branch | Worktree | Base |
|---|---|---|---|
| D1 Feed | `side-feed` | `~/worktrees/game-night-ai-lab-feed` | `mechanics` |
| D2 Voices (advisors + Lumen) | `side-voices` | `~/worktrees/game-night-ai-lab-voices` | `mechanics` |
| D3 Era-change card | `side-eracard` | `~/worktrees/game-night-ai-lab-eracard` | `ui` |
| D4 Endings collection and run summary | `side-endings` | `~/worktrees/game-night-ai-lab-endings` | `ui` |
| D5 Demo-seed finder | `side-seeds` | `~/worktrees/game-night-ai-lab-seeds` | `mechanics` |

Visual work (where the feed and Lumen sit in the office, the era card, the endings screen) is
done by the orchestrator as K2 mockups for owner approval, then handed to the UI lane.

---

## D1: the ambient feed

**Files:** create `sim/feed.js`, `sim/data/feed.js`, `tests/feed.test.js`.

**Interface:**

```js
// Returns this turn's new posts. Never mutates prev, state or events. Uses a private rng.
feedPosts(prev, state, events) → [{ turn, handle, text, tag }]
// tag ∈ 'launch' | 'reception' | 'rival' | 'era' | 'company' | 'mood' | 'ambient'
```

`prev` is the state before `endTurn`, `state` the state after, `events` the turn's event list
(types used: `release` (carries `model`), `rivalRelease` (`id`, `gain`), `eraStart` (`era`),
`raise`, `emergency`, `lawsuitPaid`, `computeFailed`, `conversionFight`, `runComplete`). Private
rng: `createRng((state.seed ?? 1) * 7919 + state.turn)`. `turn` on each post is `state.turn`.

**Rules, in order, stopping at 6 posts:**

1. **Launch:** for each `release` event, its `model.launch.reactions` become posts tagged
   `launch` (unchanged text and handle).
2. **Reception:** the newest active, activated model (highest `releaseSequence`) gets 1–2 posts
   while `state.turn − model.activeFromTurn` is 1, 2 or 3. Templates are keyed by what that
   model is: press average high (≥ 7) or low (≤ 4), each flag (`sycophancy`, `hallucination`,
   `jailbreakWaiting`, `agentic`, `contaminated`), price stance `cheap` / `premium`, reasoning
   `high` (slow but smart), channel (`consumer`: parents, students; `enterprise`: office
   workers; `agent`: developers; `open`: fine-tunes appearing), capacity trouble
   (`state.compute.overflow > 0`: "it's down again"), and a generic pool. Prefer flag and
   channel matches over generic. Texts may use `{model}` (the model name). At least 30
   templates.
3. **Rivals:** one post per `rivalRelease` event, from a pool per rival id with a big-gain and a
   small-gain variant (OpenBrain hype, Lodestar careful, DeepThink papers, Qilin open weights).
   At least 3 per rival.
4. **Era:** on `eraStart`, 2 posts about the new era (chat assistants, scale-up, reasoning and
   agents, gigawatt race, self-improvement). 2 per era for eras 2–5 at least.
5. **Company:** one post per `raise`, `emergency`, `lawsuitPaid`, `computeFailed`,
   `conversionFight`, and a rumour post on `runComplete` ("hearing a certain lab just finished a
   big run"). At least 10 templates.
6. **Mood:** at most one post per turn when a public band is crossed between `prev` and
   `state`: `raceHeat` rising past 50 or 75, `publicTrust` falling below 40 or rising past 75.
   At least 8 templates.
7. **Ambient:** if no post was made by rules 1–6, one post from an era-keyed chatter pool (at
   least 3 per era).

Skip any template whose rendered text already appears in the last 20 posts of
`state.feed ?? []`. Rival, era and ambient pools pick with the private rng.

**Tests (`tests/feed.test.js`):** deterministic for the same inputs; does not mutate inputs
(compare `structuredClone` copies); a `release` event's reactions come through first; a
`rivalRelease` post names that rival; `eraStart` gives 2 era posts; never more than 6 posts;
skips text found in recent `state.feed`; ambient appears on an empty turn; reception posts only
in turns 1–3 after activation; every template renders at most 140 characters with a sample
model name `Kestrel 3 Grand`; the game rng is untouched (call `endTurn` twice from the same
seed, once running `feedPosts` in between on the results, and compare states).

**Follow-up after plan 2A Task 4 merges (not in this build):** in `endTurn`, after
`eventsTick`, `for (const p of feedPosts(prev, state, events)) pushFeed(state, p.handle, p.text, p.tag);`.

Commit: `feat(sim): ambient feed — launch reception, rivals, eras, company news and mood`.

---

## D2: voices — advisor cast and line bank, and Lumen

**Files:** modify `sim/data/advisorLines.js`, `sim/advisors.js` (`lineFor` only),
`tests/advisors.test.js`; create `sim/lumen.js`, `sim/data/lumen.js`, `tests/lumen.test.js`.

### Advisors

`sim/data/advisorLines.js` adds:

```js
export const ADVISOR_PROFILES = {
  research: { name: 'Priya Raman', role: 'Head of Research', personality: 'Relentless optimist; every problem is one more run away.' },
  safety: { name: 'Tomas Lind', role: 'Head of Safety', personality: 'Quiet and precise; talks in test results.' },
  cfo: { name: 'Margot Hale', role: 'CFO', personality: 'Dry, allergic to surprises, forgets the lawyers.' },
  policy: { name: 'Jules Ferreira', role: 'Policy and Comms Director', personality: 'Smooth reader of rooms; speaks in headlines.' },
};
```

Each advisor's `calm`, `uneasy` and `alarmed` pools grow to at least 8 lines. A line is a string
(any era) or `{ text, eras: [n, ...] }`; each pool has at least 3 era-tagged lines spread over
the eras. Keep `research.weird`. Each voice shows its bias: Priya's alarm still sounds like "one
more run"; Tomas names evals and red teams; Margot talks burn and runway and waves off legal;
Jules talks headlines, hearings and the room. Never numbers.

`lineFor(reading, state)` in `sim/advisors.js`: pool = lines usable in `state.era`; pick
`pool[state.turn % pool.length]`; append the weird line as today. No rng. Update the existing
advisor tests that depend on the old pool sizes or signature; keep their intent.

### Lumen (the player's AI, spec section 6 narrator, owner option a)

Lumen is the lab's AI assistant persona across model generations; the player names it (the UI
stores the name in `state.lumenName`; default `'Lumen'`). Its arc from the owner's original
design: an eager flatterer that grows a moral spine, if it was trained well.

```js
lumenDisposition(state) → 'eager' | 'honest' | 'flattering' | 'evasive'
lumenLine(state) → { disposition, situation, text }   // shown at the start of each turn
lumenEpilogue(state) → string                          // shown with the ending
```

- **Disposition, first match wins:**
  1. `evasive` when `state.era >= 3` and (`alignmentDebt + concealedDebt >= 50` or
     `concealedDebt >= 20`). Smooth, reassuring, deflects checking ("You don't need to read the
     logs; I've summarised them."). This is the model's learned self leaking through.
  2. `flattering` when the newest released model has the `sycophancy` flag. (The constitution
     module from plan 2A Task 5 does not exist on this branch; do not import it. Leave the
     comment `// TODO(plan 2A Task 5): written candor below 0.4 also makes Lumen flattering`.)
  3. `eager` in eras 1–2, `honest` from era 3.
- **Situation, first match wins:** `crisis` (`state.pendingEvents?.length > 0`), `broke`
  (runway on planned burn under 6 months; use `runway` from `sim/economy.js`), `internal`
  (`state.internal`), `readyToRelease` (`state.pendingModel`), `training` (`state.activeRun`),
  else `idle`.
- **Lines:** `LUMEN_LINES[disposition][situation]`, at least 3 each (72 or more lines). Pick
  `pool[state.turn % pool.length]`. `{name}` renders as `state.lumenName ?? 'Lumen'`. Honest
  Lumen names trade-offs and politely pushes back; eager Lumen compliments; flattering Lumen
  agrees with everything; evasive Lumen is calm, helpful and subtly steering away from
  oversight.
- **Epilogue:** `LUMEN_EPILOGUES[endingId]` for every id in `ENDINGS` plus `overtaken` (plan 2A
  Task 6 adds it), 1–3 sentences in Lumen's first person, followed by
  `LUMEN_SIGNOFF[disposition]`. For `quietTakeover` and `misalignment`, the text is the learned
  self speaking plainly.
- No rng anywhere in Lumen.

**Tests:** disposition rules including priority; every disposition × situation pool has ≥ 3
lines; `{name}` substitution; every ending id has an epilogue; line length limits; lines never
contain digits; advisor pools ≥ 8 with ≥ 3 era-tagged; `lineFor` picks only era-usable lines;
profiles exist for all four advisors.

Commits: `feat(sim): advisor cast and a larger era-aware line bank`, then
`feat(sim): Lumen — the lab's AI speaks each turn and at the end`.

---

## D3: the era-change card (content and logic)

**Files:** create `ui/logic/eraIntro.js`, `tests/ui-eraintro.test.js`.

```js
ERA_INTROS  // five entries
eraIntro(era) → { era, name, pace, headline, changes: [string, string, string], bottleneck, gate }
```

- `name` and pace come from `sim/data/eras.js` `ERAS`: `monthsPerTurn` 3 → "Each turn is now a
  quarter.", 1 → "Each turn is now a month.", 0.25 → "Each turn is now a week." (era 1 says "Each
  turn is a quarter.").
- `headline`: one sentence of mood. `changes`: exactly three plain lines (≤ 90 characters each)
  saying what is new this era, taken from the main spec section 3 and 6b techniques, and from
  the compute spec (`git show compute-research:docs/superpowers/specs/2026-09-25-compute-gathering-design.md`,
  sections 4, 6 and 7: the era 3 allocation queue, the era 4 power cap and sites). `bottleneck`:
  the era's scarce input in words. `gate`: what it takes to reach the next era, in words (era 5:
  "The race ends here.").
- Never numbers for hidden values; plain words; no jargon the How-to-play card has not taught.

**Tests:** all five eras present; pace matches `ERAS`; exactly three changes each within 90
characters; `eraIntro(6)` and `eraIntro(0)` return `null`.

**Follow-up (UI lane, after its dialog shell exists):** on an `eraStart` event, open the card as
a GDT dialog before the briefing. Commit: `feat(ui): era-change card content`.

---

## D4: endings collection and run summary

**Files:** create `ui/logic/collection.js`, `ui/logic/summary.js`, `tests/ui-collection.test.js`,
`tests/ui-summary.test.js`.

```js
createCollection(storage) → { record(endingId, meta), entries(), progress() }
// storage: an object with getItem/setItem (localStorage in the browser). Every access is in
// try/catch; on failure or corrupt JSON the collection works in memory. Key: 'gnal.endings.v1'.
// record ignores ids not in ENDINGS; keeps first-found meta { seed, era, turn, model } and a count.
// progress() → { found, total }, total = Object.keys(ENDINGS).length (so new endings count automatically).

runSummary(state) → { endingId, title, kind, era, turn, models, bestModel,
                      advisors: [{ id, meanError, verdict }], mostReliable, mostMisleading, shareLine }
```

- `models`: number of released models; `bestModel`: the name with the highest `launchScore`, or
  `null`.
- Advisor accuracy from `state.advisorHistory`: mean of `|estimate − truth| / scale` with scale
  research 10, safety 15, cfo 6, policy 10; verdict `reliable` (< 0.5), `mixed` (< 1),
  `misleading` (≥ 1). Advisors with no history are skipped.
- `shareLine`: one plain sentence, for example "Absorbed in era 3 after 2 models. Margot saw it
  coming; Priya did not." Use advisor ids mapped to first names via a local map (Priya, Tomas,
  Margot, Jules).

**Tests:** record and progress; unknown ids ignored; a throwing storage still works; corrupt
JSON recovers; summary on a state built by running the sim with `tools/balance.js` `simulate`
(a real run) has sane fields; verdict thresholds.

**Follow-up (UI lane Task 11):** record the ending on the end screen, show "N of M endings
found" and the share line. Commit: `feat(ui): endings collection and run summary`.

---

## D5: demo-seed finder

**Files:** create `tools/demo-seeds.js`, `tests/demo-seeds.test.js`; add
`"demo-seeds": "node tools/demo-seeds.js 300"` to `package.json` scripts.

```js
playTimeline(strategy, seed) → { seed, strategy, ending, turns: [{ turn, era, actions, events }] }
scoreStory(timeline) → { score, beats: string[] }
findDemoSeeds(n, { strategy = 'balanced', top = 10 }) → [{ seed, score, beats, ending, turns }]
```

- `playTimeline` reuses `STRATEGIES` from `tools/balance.js` and records each turn's actions and
  events (copy the loop in `simulate`; do not change `tools/balance.js`).
- Story beats and points: reached era 3 (+2), era 4 (+2), era 5 (+2); a release in era 3 or
  later whose safety benchmark shown − truth ≥ 5 ("the safety test lied") (+3); a training
  hazard (+2); a warning followed by a card for the same id (+3, only when those event types
  exist); an internal-deployment incident (+2); at least two rival releases that change the
  leader (+1); a winning ending (+2) or a dramatic failure (`misalignment`, `quietTakeover`,
  `rivalDisaster`) (+2); run shorter than 12 turns (−4).
- CLI: prints the top seeds, and for the best one a turn-by-turn script (era, the bot's moves in
  words, notable events) that a person can follow in the UI while recording the video.

**Tests:** deterministic; `scoreStory` on hand-made timelines gives the listed points;
`findDemoSeeds(20)` is sorted by score. Commit: `feat(tools): demo-seed finder for the video`.
