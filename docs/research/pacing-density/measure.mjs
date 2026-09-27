// Pacing density: how much real time passes between things that ask for the player or show change.
// Run from the worktree root:  node docs/research/pacing-density/measure.mjs [seeds] [strategy,strategy,...] [attentive|bot]
// Defaults: 20 seeds, strategies balanced, safety, speed (the bots in tools/balance.js), the attentive player.
//
// Model of a player (assumptions, also listed in measurements.md):
// - The clock runs at x1: 90 real seconds per round (ui/clock.js secondsPerRound), so one story day takes
//   90 / ROUND_DAYS[era] seconds (about 1 s in eras 1-2, 3 s in eras 3-4, 12.9 s in era 5).
// - Seconds are running-clock seconds. Time spent inside a paused card, dialog or meeting is not counted, because the
//   clock is stopped then (ui/clock.js pauses on .dialog-layer, .menu-layer and the event-card reason).
// - The bot is asked what to do on the first day of every round, and again on any day when a card has just landed,
//   a trained model is waiting, or no run is training. Its choices come from tools/balance.js STRATEGIES; cards are
//   answered on the day they land (not ahead of time, as the turn-based balance bot does); moves still obey the
//   2-per-round cap and the one-job-per-team rule. The attentive player releases and starts the next run first; the
//   'bot' mode keeps the balance bot's own order (see the comment in playRun).
// - Nothing here changes the game. It imports the sim and the UI's pure logic helpers only.

import { createInitialState } from '../../../sim/state.js';
import { createRng } from '../../../sim/rng.js';
import { applyActions, advanceDays, MAX_MOVES } from '../../../sim/turn.js';
import { ROUND_DAYS, nextRoundDay } from '../../../sim/time.js';
import { boardVoteThisRound } from '../../../sim/board.js';
import { teamBusyError } from '../../../sim/teams.js';
import { STRATEGIES } from '../../../tools/balance.js';
import { badgeCounts } from '../../../ui/logic/training.js';
import { turnSummary } from '../../../ui/logic/compute.js';
import { openWarnings } from '../../../ui/logic/events.js';
import { activeModels } from '../../../sim/economy.js';

const SECONDS_PER_ROUND = 90;
const seeds = Number(process.argv[2] ?? 20);
const names = (process.argv[3] ?? 'balanced,safety,speed').split(',');
const MODE = process.argv[4] ?? 'attentive'; // 'attentive' (default) or 'bot'
const PRIORITY = ['release', 'startRun', 'meeting'];
const SIZES = ['xl', 'large', 'medium', 'small'];
const ERROR_TEXT = new Map(); // rejected actions by message, for the report

const secondsPerDay = (era) => SECONDS_PER_ROUND / ROUND_DAYS[era];
const meetingDueNow = (state) => !state.ending && nextRoundDay(state) - state.day === 1 && boardVoteThisRound(state);
const landed = (card, state) => card.landsAt == null || state.day >= card.landsAt;
const feedKey = (p) => `${p.turn}|${p.day}|${p.handle}|${p.text}`;

// The kinds of beat, grouped in three tiers.
const ASKS = ['card', 'warning', 'runComplete', 'president', 'boardMeeting']; // tier 1: something asks for you
const SHOWS = ['toast', 'bubbles']; // tier 2 adds: something visibly changes on the main screen
const AMBIENT = ['feed', 'moneyFloat']; // tier 3 adds: the phone badge ticks up, or the weekly money floats rise
const TIERS = { asks: ASKS, shows: [...ASKS, ...SHOWS], anything: [...ASKS, ...SHOWS, ...AMBIENT] };

function playRun(name, seed) {
  const rng = createRng(seed);
  const strategy = STRATEGIES[name];
  let state = createInitialState({ seed });
  let t = 0; // running-clock seconds
  const beats = []; // { t, era, kind, n }
  const eraSpans = {}; // era -> { start, end }
  const runs = []; // { era, start, end }
  const extra = { rivalReleases: [], releases: [], roundMarks: [], blockedReleaseSeconds: {}, idleResearchSeconds: {}, researchPoints: {}, usersGained: {}, errors: 0, feedByTag: {} };
  let lastAlignShare = null;
  let seenLanded = new Set();
  let seenWarnings = new Set();
  let feedSeen = new Map();
  let wasMeetingDue = false;
  let roundAsked = -1;
  let runStartT = null;

  const noteErrors = (errors) => {
    for (const e of errors) {
      extra.errors += 1;
      const key = e.replace(/\d+/g, 'N');
      ERROR_TEXT.set(key, (ERROR_TEXT.get(key) ?? 0) + 1);
    }
  };
  const add = (kind, n = 1, at = t) => { if (n > 0) beats.push({ t: at, era: state.era, kind, n }); };
  const countFeed = (s, at) => {
    const now = new Map();
    for (const p of s.feed) now.set(feedKey(p), (now.get(feedKey(p)) ?? 0) + 1);
    let fresh = 0;
    for (const [k, c] of now) {
      const d = c - (feedSeen.get(k) ?? 0);
      if (d > 0) {
        fresh += d;
        const tag = s.feed.find((p) => feedKey(p) === k)?.tag ?? 'feed';
        extra.feedByTag[tag] = (extra.feedByTag[tag] ?? 0) + d;
      }
    }
    feedSeen = now;
    add('feed', fresh, at);
  };
  const noteCardsAndWarnings = (s, at) => {
    for (const card of s.pendingEvents) {
      const key = `${card.id}@${card.landsAt}`;
      if (landed(card, s) && !seenLanded.has(key)) { seenLanded.add(key); add('card', 1, at); }
    }
    const open = new Set(openWarnings(s).map((w) => w.id));
    for (const id of open) if (!seenWarnings.has(id)) add('warning', 1, at);
    seenWarnings = open;
  };
  // Seed the trackers with the opening state.
  for (const p of state.feed) feedSeen.set(feedKey(p), (feedSeen.get(feedKey(p)) ?? 0) + 1);

  eraSpans[1] = { start: 0, end: 0 };
  let guard = 0;
  while (!state.ending && guard++ < 5000) {
    // 1. The player acts (while the clock is at this moment).
    const cardsWaiting = state.pendingEvents.some((c) => landed(c, state));
    const modelWaiting = Boolean(state.pendingModel);
    const idle = !state.activeRun && !state.pendingModel;
    const movesLeft = MAX_MOVES - state.round.moves;
    const newRound = roundAsked !== state.turn;
    if (newRound || cardsWaiting || state.meeting || ((modelWaiting || idle) && movesLeft > 0)) {
      // The attentive player: the release and the next run come first (the bot is asked again after each one, the
      // same day), and the bot's other moves (compute deals, raises, the summit) only use moves left over at a round's
      // start. The "bot" mode keeps tools/balance.js's own order, where a deal can take the move the next run needed.
      const first = newRound;
      if (first) roundAsked = state.turn;
      let leftover = [];
      for (let pass = 0; pass < 3; pass += 1) {
        const full = strategy(state, rng);
        const actions = { moves: [], eventChoices: {} };
        if (first && pass === 0) {
          for (const key of ['budget', 'computeSplit', 'automation', 'pledge', 'constitutionDraft', 'addressWarnings']) {
            if (full[key] !== undefined) actions[key] = full[key];
          }
        }
        if (full.presidentAnswers) actions.presidentAnswers = full.presidentAnswers;
        if (full.hazardChoice) actions.hazardChoice = full.hazardChoice;
        for (const [id, choice] of Object.entries(full.eventChoices ?? {})) {
          const card = state.pendingEvents.find((c) => c.id === id);
          if (card && landed(card, state)) actions.eventChoices[id] = choice;
        }
        const left = MAX_MOVES - state.round.moves;
        const moves = full.moves ?? [];
        if (MODE === 'bot') actions.moves = moves.filter((m) => first || PRIORITY.includes(m.type)).slice(0, left);
        else {
          actions.moves = moves.filter((m) => PRIORITY.includes(m.type)).slice(0, left);
          if (first && pass === 0) leftover = moves.filter((m) => !PRIORITY.includes(m.type));
        }
        // A person whose run does not fit picks a smaller size; the bot's own compute estimate is sometimes off.
        const run = actions.moves.find((m) => m.type === 'startRun');
        actions.moves = actions.moves.filter((m) => m !== run);
        const movesBefore = state.round.moves;
        const events = [];
        const result = applyActions(state, actions, rng);
        noteErrors(result.errors);
        state = result.state;
        events.push(...result.events);
        if (run && MAX_MOVES - state.round.moves > 0 && !state.ending) {
          const sizes = SIZES.slice(SIZES.indexOf(run.recipe.sliders.size));
          let tried = null;
          for (const size of sizes) {
            const move = { ...run, recipe: { ...run.recipe, sliders: { ...run.recipe.sliders, size } } };
            tried = applyActions(state, { moves: [move], eventChoices: {} }, rng);
            if (!tried.errors.length) break;
          }
          noteErrors(tried.errors);
          if (!tried.errors.length) { state = tried.state; events.push(...tried.events); }
        }
        if (state.activeRun) lastAlignShare = state.activeRun.recipe.sliders.alignShare;
        for (const e of events) {
          if (e.type === 'release') extra.releases.push({ t, era: state.era });
          if (e.type === 'startRun') runStartT = { t, era: state.era };
        }
        if (MODE === 'bot' || state.round.moves === movesBefore) break;
      }
      const left = MAX_MOVES - state.round.moves;
      if (leftover.length && left > 0 && !state.ending) {
        const result = applyActions(state, { moves: leftover.slice(0, left), eventChoices: {} }, rng);
        noteErrors(result.errors);
        state = result.state;
      }
      countFeed(state, t);
    }

    // 2. One story day passes.
    const era = state.era;
    const dt = secondsPerDay(era);
    const beforeCounts = badgeCounts(state, lastAlignShare);
    const hadRun = Boolean(state.activeRun);
    const beforeWeek = Math.floor(state.day / 7);
    const beforeTurn = state.turn;
    const blockedRelease = Boolean(state.pendingModel && !state.pendingModel.hazard) && (MAX_MOVES - state.round.moves <= 0 || teamBusyError(state, { type: 'release' }));
    const researchIdle = !state.activeRun && !state.pendingModel;
    const rpBefore = state.researchPoints;
    const usersBefore = activeModels(state).reduce((sum, m) => sum + m.users, 0);
    const result = advanceDays(state, 1, rng);
    state = result.state;
    t += dt;
    eraSpans[era].end = t;
    if (blockedRelease) extra.blockedReleaseSeconds[era] = (extra.blockedReleaseSeconds[era] ?? 0) + dt;
    if (researchIdle) extra.idleResearchSeconds[era] = (extra.idleResearchSeconds[era] ?? 0) + dt;
    const grow = (key, x) => { extra[key][era] = (extra[key][era] ?? 0) + Math.max(0, x); };
    grow('researchPoints', state.researchPoints - rpBefore);
    grow('usersGained', activeModels(state).reduce((sum, m) => sum + m.users, 0) - usersBefore);
    if (state.activeRun) lastAlignShare = state.activeRun.recipe.sliders.alignShare;

    const events = result.events;
    noteErrors(result.errors);
    for (const e of events) {
      if (e.type === 'runComplete') {
        add('runComplete');
        if (runStartT) runs.push({ era: runStartT.era, start: runStartT.t, end: t, endEra: era });
        runStartT = null;
      }
      if (e.type === 'meetingDue') add('president');
      if (e.type === 'rivalRelease') extra.rivalReleases.push({ t, era });
    }
    // Everything the "Just now" toast would list for this day (world events only; the player's own moves are not counted).
    const lines = turnSummary(events, state);
    add('toast', lines.length ? 1 : 0);
    const afterCounts = badgeCounts(state, lastAlignShare);
    if (hadRun || state.activeRun) {
      const grown = Math.max(0, afterCounts.capability - beforeCounts.capability) + Math.max(0, afterCounts.alignment - beforeCounts.alignment);
      add('bubbles', grown);
    }
    if (Math.floor(state.day / 7) > beforeWeek) add('moneyFloat');
    noteCardsAndWarnings(state, t);
    const due = meetingDueNow(state);
    if (due && !wasMeetingDue) add('boardMeeting');
    wasMeetingDue = due;
    countFeed(state, t);
    if (state.turn !== beforeTurn) extra.roundMarks.push({ t, era });
    if (state.era !== era && !state.ending) eraSpans[state.era] = { start: t, end: t };
  }
  return { name, seed, ending: state.ending, lastEra: state.era, beats, eraSpans, runs, extra, total: t };
}

// Gaps between beats of the given kinds inside one era, with the era's start and end as walls.
function eraGaps(run, era, kinds) {
  const span = run.eraSpans[era];
  if (!span) return null;
  const times = run.beats.filter((b) => kinds.includes(b.kind) && b.t > span.start && b.t <= span.end).map((b) => b.t);
  const walls = [span.start, ...new Set(times), span.end].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < walls.length; i += 1) gaps.push(walls[i] - walls[i - 1]);
  return { gaps: gaps.filter((g) => g > 1e-9), length: span.end - span.start };
}

const median = (xs) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const r0 = (x) => (Number.isFinite(x) ? Math.round(x) : '-');
const r1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : '-');

const allRuns = [];
for (const name of names) for (let seed = 1; seed <= seeds; seed += 1) allRuns.push(playRun(name, seed));

console.log(`# Pacing density measurement\n`);
console.log(`Seeds 1-${seeds}; strategies: ${names.join(', ')}; player: ${MODE}; x1 speed (${SECONDS_PER_ROUND} s per round); running-clock seconds.\n`);

// How far runs got.
console.log('## How far the runs got\n');
console.log('| Strategy | Runs | Reached era 5 | Median running minutes | Rejected actions per run |');
console.log('|---|---|---|---|---|');
for (const name of names) {
  const rs = allRuns.filter((r) => r.name === name);
  console.log(`| ${name} | ${rs.length} | ${rs.filter((r) => r.eraSpans[5]).length} | ${r1(median(rs.map((r) => r.total / 60)))} | ${r1(rs.reduce((s, r) => s + r.extra.errors, 0) / rs.length)} |`);
}

// Beats per running minute, by kind and era (all strategies pooled).
console.log('\n## Beats per running minute, by era (all runs pooled)\n');
const kinds = [...ASKS, ...SHOWS, ...AMBIENT];
console.log(`| Era | Running minutes (sum) | ${kinds.join(' | ')} | rival releases | player releases | round marks |`);
console.log(`|---|---|${kinds.map(() => '---').join('|')}|---|---|---|`);
for (let era = 1; era <= 5; era += 1) {
  const rs = allRuns.filter((r) => r.eraSpans[era]);
  const minutes = rs.reduce((s, r) => s + (r.eraSpans[era].end - r.eraSpans[era].start), 0) / 60;
  if (minutes <= 0) continue;
  const per = (kind) => rs.reduce((s, r) => s + r.beats.filter((b) => b.kind === kind && b.t > r.eraSpans[era].start && b.t <= r.eraSpans[era].end).reduce((x, b) => x + b.n, 0), 0) / minutes;
  const count = (list) => rs.reduce((s, r) => s + r.extra[list].filter((x) => x.era === era).length, 0) / minutes;
  console.log(`| ${era} | ${r1(minutes)} | ${kinds.map((k) => r1(per(k))).join(' | ')} | ${r1(count('rivalReleases'))} | ${r1(count('releases'))} | ${r1(count('roundMarks'))} |`);
}

// Dead gaps.
for (const [tier, tierKinds] of Object.entries(TIERS)) {
  console.log(`\n## Dead gaps, tier "${tier}" (${tierKinds.join(', ')})\n`);
  console.log('| Strategy | Era | Median gap (s) | Median of each run\'s longest gap (s) | Longest gap in any run (s) | Share of era time inside gaps over 20 s | over 45 s |');
  console.log('|---|---|---|---|---|---|---|');
  for (const name of [...names, 'all']) {
    for (let era = 1; era <= 5; era += 1) {
      const rs = allRuns.filter((r) => (name === 'all' || r.name === name) && r.eraSpans[era]);
      if (!rs.length) continue;
      const per = rs.map((r) => eraGaps(r, era, tierKinds)).filter(Boolean);
      const gaps = per.flatMap((p) => p.gaps);
      const time = per.reduce((s, p) => s + p.length, 0);
      const over = (limit) => per.reduce((s, p) => s + p.gaps.filter((g) => g > limit).reduce((x, g) => x + g, 0), 0) / time;
      console.log(`| ${name} | ${era} | ${r0(median(gaps))} | ${r0(median(per.map((p) => Math.max(...p.gaps))))} | ${r0(Math.max(...gaps))} | ${Math.round(over(20) * 100)}% | ${Math.round(over(45) * 100)}% |`);
    }
  }
}

// Training runs.
console.log('\n## Training runs (start to "Training complete"), running seconds\n');
console.log('| Era the run started in | Runs | Median length (s) | Shortest | Longest | Bubbles per run (median) | Bubbles per running minute while training (median) | Median seconds between bubble moments |');
console.log('|---|---|---|---|---|---|---|---|');
for (let era = 1; era <= 5; era += 1) {
  const rs = allRuns.flatMap((r) => r.runs.filter((x) => x.era === era).map((x) => ({ ...x, run: r })));
  if (!rs.length) continue;
  const lens = rs.map((x) => x.end - x.start);
  const bubbles = rs.map((x) => x.run.beats.filter((b) => b.kind === 'bubbles' && b.t > x.start && b.t <= x.end).reduce((s, b) => s + b.n, 0));
  const rates = rs.map((x, i) => bubbles[i] / ((x.end - x.start) / 60));
  const spacing = rs.flatMap((x) => {
    const ts = x.run.beats.filter((b) => b.kind === 'bubbles' && b.t > x.start && b.t <= x.end).map((b) => b.t);
    return ts.slice(1).map((v, i) => v - ts[i]);
  });
  console.log(`| ${era} | ${rs.length} | ${r0(median(lens))} | ${r0(Math.min(...lens))} | ${r0(Math.max(...lens))} | ${r0(median(bubbles))} | ${r1(median(rates))} | ${r1(median(spacing))} |`);
}

// Research idle and blocked releases.
console.log('\n## Time with nothing training, and time a trained model waited for a free move (share of era time, all runs)\n');
console.log('| Era | Nothing training | Model ready but no move or team free |');
console.log('|---|---|---|');
for (let era = 1; era <= 5; era += 1) {
  const rs = allRuns.filter((r) => r.eraSpans[era]);
  const time = rs.reduce((s, r) => s + (r.eraSpans[era].end - r.eraSpans[era].start), 0);
  if (time <= 0) continue;
  const idle = rs.reduce((s, r) => s + (r.extra.idleResearchSeconds[era] ?? 0), 0);
  const blocked = rs.reduce((s, r) => s + (r.extra.blockedReleaseSeconds[era] ?? 0), 0);
  console.log(`| ${era} | ${Math.round((idle / time) * 100)}% | ${Math.round((blocked / time) * 100)}% |`);
}

// Progress that happens today without any bubble.
console.log('\n## Progress with no bubble today, per running minute (all runs pooled)\n');
console.log('| Era | Research points gained | Users gained (millions) |');
console.log('|---|---|---|');
for (let era = 1; era <= 5; era += 1) {
  const rs = allRuns.filter((r) => r.eraSpans[era]);
  const minutes = rs.reduce((s, r) => s + (r.eraSpans[era].end - r.eraSpans[era].start), 0) / 60;
  if (minutes <= 0) continue;
  const sum = (key) => rs.reduce((s, r) => s + (r.extra[key][era] ?? 0), 0) / minutes;
  console.log(`| ${era} | ${r1(sum('researchPoints'))} | ${r1(sum('usersGained') / 1e6)} |`);
}

// Feed tags.
const tags = {};
for (const r of allRuns) for (const [k, v] of Object.entries(r.extra.feedByTag)) tags[k] = (tags[k] ?? 0) + v;
console.log('\n## Feed posts by tag (all runs, total)\n');
console.log(Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', '));

// One example timeline (first run of the first strategy): the 8 longest "shows" gaps with what ended them.
const sample = allRuns[0];
console.log(`\n## Example: ${sample.name} seed ${sample.seed}, the 8 longest gaps with nothing asking and nothing visibly changing\n`);
const showTimes = sample.beats.filter((b) => TIERS.shows.includes(b.kind)).sort((a, b) => a.t - b.t);
const rows = [];
for (let i = 1; i < showTimes.length; i += 1) {
  const g = showTimes[i].t - showTimes[i - 1].t;
  if (g > 1e-9) rows.push({ from: showTimes[i - 1].t, to: showTimes[i].t, g, era: showTimes[i].era, ended: showTimes[i].kind });
}
console.log('| Era | From (running min:s) | Gap (s) | Ended by |');
console.log('|---|---|---|---|');
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
for (const row of rows.sort((a, b) => b.g - a.g).slice(0, 8)) console.log(`| ${row.era} | ${mmss(row.from)} | ${r0(row.g)} | ${row.ended} |`);

console.log('\n## Rejected actions by message (all runs, top 8)\n');
for (const [text, n] of [...ERROR_TEXT].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`- ${n}: ${text}`);
