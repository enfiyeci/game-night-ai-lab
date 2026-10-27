// Pacing measurement: plays whole games with the repo's bots (scenario mode, as a new player gets) and logs, day by
// day, every moment the game interrupts or asks the player something. Re-run after changes:
//   node tools/pacing/measure.mjs [seeds=40] [strategies=careful,balanced] > out.json   (summary also printed to stderr)
// FAST=1 uses the skimmer time model. Report: docs/playtests/2026-10-14-pacing-measurement.md.
const REPO = process.env.REPO ?? new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const m = async (p) => import(`${REPO}/${p}`);

const { STRATEGIES, eventChoices, dailyRelease } = await m('tools/balance.js');
const { TEAM_OF, teamBusyError } = await m('sim/teams.js');
const turnModule = await m('sim/turn.js');
const { applyActions, advanceDays } = turnModule;
// The set pieces never use an action (2026-10-14 review fix); older builds lack usesAction and count every move.
const usesAction = turnModule.usesAction ?? (() => true);
const { createInitialState } = await m('sim/state.js');
const { enableScenarios } = await m('sim/scenarios.js');
const { createRng } = await m('sim/rng.js');
const { ROUND_DAYS, nextRoundDay } = await m('sim/time.js');
const { ERAS } = await m('sim/data/eras.js');
const { cardView, argueLines, openWarnings, hasLanded } = await m('ui/logic/events.js');
const { boardWarning, meetingDueNow, meetingInfo } = await m('ui/logic/board.js');
const { cashWarning, cashWarningCheckpoint } = await m('ui/logic/cashWarning.js');
const { summaryItems } = await m('ui/logic/compute.js');
const { SCENARIO_EVENTS } = await m('sim/data/scenarioEvents.js');
const { BOARD_EVENTS } = await m('sim/data/boardEvents.js');
const { EVENTS } = await m('sim/data/events.js');
const { EVENTS_6C } = await m('sim/data/events6c.js');
const { REAL_EVENTS } = await m('sim/data/realEvents.js');
const { MEETINGS } = await m('sim/data/president.js');
const { TOUR } = await m('ui/logic/intro.js');
const { eraIntro } = await m('ui/logic/eraIntro.js');
// Pacing fixes (2026-10-14); absent on older builds, where the old rules apply.
const { summitOpensNow } = await m('sim/summit.js');

const SECONDS_PER_ROUND = 90; // ui/clock.js default, speed x1
const secPerDay = (era) => SECONDS_PER_ROUND / ROUND_DAYS[era];
const ERA_DAYS = Object.fromEntries(ERAS.map((e) => [e.id, e.turns * ROUND_DAYS[e.id]]));
const ERA_START = {};
{ let d = 0; for (const e of ERAS) { ERA_START[e.id] = d; d += ERA_DAYS[e.id]; } }

const words = (s) => (String(s ?? '').match(/\S+/g) ?? []).length;
const ALL = [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS, ...BOARD_EVENTS, ...SCENARIO_EVENTS];
const kindOf = (id) => {
  const base = id.startsWith('promiseCall:') ? 'promiseCall' : id;
  return ALL.find((e) => e.id === base)?.kind ?? 'unknown';
};
function cardWords(pending) {
  const view = cardView(pending);
  let n = words(view.title) + words(view.post?.text) + words(view.kicker);
  for (const c of view.choices) n += words(c.label) + words(c.cost);
  for (const line of argueLines(view)) n += words(line.say) + words(line.pick);
  return n;
}
const presidentWords = Object.fromEntries(MEETINGS.map((mt) => [mt.id,
  mt.exchanges.reduce((s, x) => s + words(x.prompt) + x.answers.reduce((a, ans) => a + words(ans.text), 0), 0)]));
const tourWords = TOUR.reduce((s, t) => s + words(t.title) + words(t.say), 0);
const eraIntroWords = (era) => { const i = eraIntro(era); return words(i?.name) + words(i?.headline) + 12; };

// Prompt types. pausing: the UI stops the clock until the player answers (ui/clock.js reasons, or a .dialog-layer).
const TYPES = {
  scenarioCard: { pausing: true, label: 'Event card (scenario)' },
  boardCard: { pausing: true, label: 'Event card (board, before a vote)' },
  otherCard: { pausing: true, label: 'Event card (internal/training/promise/contract)' },
  screenwall: { pausing: true, label: 'Screen wall (own-line card)' },
  boardMeeting: { pausing: true, label: 'Board meeting' },
  president: { pausing: true, label: 'President meeting' },
  summit: { pausing: true, label: 'Geneva summit' },
  eraTransition: { pausing: true, label: 'Era transition ("Moving day")' },
  hazard: { pausing: true, label: 'Training hazard (cheating trace)' },
  hazardPill: { pausing: false, label: 'Training hazard, later ones: choices under the HUD pill' },
  cashWarning: { pausing: true, label: 'Cash warning (urgent/critical)' },
  dealDialog: { pausing: true, label: 'Geneva deal outcome dialog' },
  warning: { pausing: false, label: 'Advisor warning bubble (look into it for $)' },
  boardWarning: { pausing: false, label: 'Board warning bubble' },
  releaseReady: { pausing: false, label: 'Training finished: release / polish waits' },
  aiProposals: { pausing: false, label: '"Your AI wants to" panel' },
  dealSuspicion: { pausing: false, label: 'Geneva suspicion bubble' },
};

function playGame(name, seed) {
  const rng = createRng(seed);
  let state = enableScenarios(createInitialState({ seed }));
  const log = []; // { day, era, type, words }
  const info = { toasts: [], feed: [], playerMoves: [], reveals: [], runs: [] };
  const seen = { cards: new Set(), warnings: new Set(), boardWarn: new Set(), boardMeet: new Set(), hazard: false,
    proposals: '', suspicions: new Set(), feed: new Set(), cashCheckpoint: 0, summit: false, dealDay: null };
  const add = (type, extra = {}) => log.push({ day: state.day, era: state.era, type, ...extra });

  // Called after every state change the UI would publish (an action applied, or a story day passed).
  function observe(events) {
    for (const e of events) {
      if (e.type === 'eraStart') {
        add('eraTransition', { words: eraIntroWords(e.era) });
        if (e.era === 5 && !summitOpensNow) { seen.summit = true; add('summit', { words: 400 }); } // old build: opens with the transition (assumed text, see report)
      }
      if (e.type === 'summit' && !seen.summit) { seen.summit = true; add('summit', { words: 400, byPlayer: true }); } // taken from the menu before it opened by itself
      if (e.type === 'meetingDue') add('president', { words: presidentWords[e.id] ?? 150 });
      // One dialog per story day on the new build (ui/screens/deal.js merges a day's news); one per event on the old.
      if ((['dealBreakCaught', 'playerCaught', 'presidentAngry'].includes(e.type)
        || (e.type === 'dealCollapsed' && e.reason === 'noCoalition')) && !(summitOpensNow && seen.dealDay === state.day)) {
        seen.dealDay = state.day;
        add('dealDialog', { words: 45 });
      }
      if (e.type === 'runComplete') add('releaseReady', { words: 6 });
      if (e.type === 'release' && e.ok) info.reveals.push({ day: state.day, era: state.era });
      if (e.type === 'startRun' && e.ok) info.runs.push({ start: state.day, era: state.era });
      if (e.type === 'runComplete') { const run = info.runs.findLast((x) => x.end == null); if (run) run.end = state.day; }
    }
    const toastN = summaryItems(events, state).length;
    if (toastN) info.toasts.push({ day: state.day, era: state.era, n: toastN });
    if (state.ending) return;
    if (summitOpensNow && !seen.summit && summitOpensNow(state) && !state.meeting) { seen.summit = true; add('summit', { words: 400 }); }
    for (const pending of state.pendingEvents) {
      const key = `${pending.id}@${pending.landsAt ?? 'now'}`;
      if (seen.cards.has(key) || !hasLanded(pending, state)) continue;
      seen.cards.add(key);
      const kind = kindOf(pending.id);
      const type = pending.id === 'ownLine' ? 'screenwall' : kind === 'scenario' ? 'scenarioCard' : kind === 'board' ? 'boardCard' : 'otherCard';
      add(type, { id: pending.id, words: cardWords(pending), window: (pending.dueAt ?? NaN) - (pending.landsAt ?? state.day) });
    }
    for (const w of openWarnings(state, [])) {
      const key = `${w.id}@${state.warnings[w.id]?.turn}`;
      if (seen.warnings.has(key)) continue;
      seen.warnings.add(key);
      add('warning', { id: w.id, words: words(w.say) + 6 });
    }
    const mi = meetingInfo(state);
    const bw = mi ? boardWarning(state) : null;
    if (bw) {
      const key = `${state.era}:${mi.kind}`;
      if (!seen.boardWarn.has(key)) { seen.boardWarn.add(key); add('boardWarning', { words: words(bw.text) }); }
    }
    if (meetingDueNow(state)) {
      const mark = nextRoundDay(state);
      if (!seen.boardMeet.has(mark)) { seen.boardMeet.add(mark); add('boardMeeting', { words: 300 }); }
    }
    const hz = Boolean(state.pendingModel?.hazard);
    // New build: the full card only for the run's first trace (state.flags.hazardsMet), later ones under the HUD pill.
    if (hz && !seen.hazard) add(summitOpensNow && state.flags.hazardsMet > 0 ? 'hazardPill' : 'hazard', { words: 135 }); // counted from ui/screens/hazard.js copy
    seen.hazard = hz;
    if (state.pacing) {
      // The pacing director (sim/pacing.js) decides the cash warning's pause; on moving day it folds into the recap.
      const pause = state.pacing.cash.pause;
      const key = pause ? `${pause.day}:${pause.level}` : null;
      if (key && key !== seen.cashPause) { seen.cashPause = key; add('cashWarning', { level: pause.level, words: 45 }); }
    } else {
      const cw = cashWarning(state);
      const next = cashWarningCheckpoint(seen.cashCheckpoint, cw);
      seen.cashCheckpoint = next.checkpoint;
      if (next.pause) add('cashWarning', { level: cw.level, words: 45 });
    }
    const props = JSON.stringify(state.automation?.proposals ?? []);
    if (props !== seen.proposals) {
      if ((state.automation?.proposals ?? []).length && !state.automation.autoApprove) add('aiProposals', { words: 30 });
      seen.proposals = props;
    }
    for (const s of state.deal?.suspicions ?? []) {
      if (seen.suspicions.has(s.id)) continue;
      seen.suspicions.add(s.id);
      add('dealSuspicion', { words: 30 });
    }
    let fresh = 0;
    for (const post of state.feed.slice(-60)) {
      const key = `${post.turn}|${post.day}|${post.handle}|${post.text}`;
      if (seen.feed.has(key)) continue;
      seen.feed.add(key); fresh += 1;
    }
    if (fresh) info.feed.push({ day: state.day, era: state.era, n: fresh });
  }

  // tools/play-round.js, with observe() after each step. Bots answer cards the day they land.
  const choose = (s) => eventChoices(s, ['careful', 'carefulNoGrid'].includes(name) ? 'careful' : ['speed', 'safety', 'random'].includes(name) ? name : 'balanced', rng);
  observe([]);
  for (let i = 0; i < 30 && !state.ending; i++) {
    const actions = STRATEGIES[name](state, rng);
    const act = (chosen) => {
      const occupied = new Set(Object.keys(state.round.teams));
      let slots = 2 - state.round.moves;
      chosen = { ...chosen, moves: (chosen.moves ?? []).filter((move) => {
        const team = TEAM_OF[move.type];
        if ((usesAction(move) && slots <= 0) || occupied.has(team) || teamBusyError(state, move)) return false;
        if (usesAction(move)) slots--;
        occupied.add(team); return true;
      }) };
      for (const mv of chosen.moves) info.playerMoves.push({ day: state.day, era: state.era, type: mv.type });
      const r = applyActions(state, chosen, rng);
      state = r.state; observe(r.events);
    };
    const turn = state.turn;
    act(actions);
    while (!state.ending && state.turn === turn) {
      const choices = choose(state);
      if (Object.keys(choices).length) act({ eventChoices: choices });
      if (state.ending) break;
      const daily = dailyRelease(name, state);
      if (daily) act(daily);
      if (state.ending) break;
      const r = advanceDays(state, 1, rng);
      state = r.state; observe(r.events);
    }
  }
  return { name, seed, ending: state.ending, endEra: state.era, endDay: state.day, log, info };
}

// ---- statistics ----
const pct = (xs, p) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const r1 = (x) => Math.round(x * 10) / 10;

function eraStats(games, era, filter) {
  const rows = [];
  for (const g of games) {
    const start = ERA_START[era];
    const full = ERA_DAYS[era];
    if (g.endEra < era) continue;
    const played = Math.min(full, (g.endEra === era ? g.endDay : start + full) - start);
    if (played <= 0) continue;
    const ps = g.log.filter((p) => p.era === era && filter(p));
    const days = ps.map((p) => p.day - start);
    // weeks: 7-day bins from era start; only complete weeks count (era 3/4's 120 days leave a 1-day tail, folded in)
    const nWeeks = Math.floor(played / 7);
    const weeks = Array(nWeeks).fill(0);
    for (const d of days) { const w = Math.min(Math.floor(Math.max(0, d - 1) / 7), nWeeks - 1); if (w >= 0) weeks[w] += 1; }
    // longest gap with no prompt (era start and end count as edges), in story days
    const sorted = [0, ...days.sort((a, b) => a - b), played];
    let gap = 0; for (let i = 1; i < sorted.length; i++) gap = Math.max(gap, sorted[i] - sorted[i - 1]);
    // burst: most prompts in any 7 story days, and in any 60 s of running clock
    const burstIn = (span) => { let best = 0, at = null; for (let i = 0; i < days.length; i++) { let n = 0; for (let j = i; j < days.length && days[j] - days[i] < span; j++) n++; if (n > best) { best = n; at = i; } } return { best, at }; };
    const b7 = burstIn(7);
    const span60 = 60 / secPerDay(era);
    const b60 = burstIn(span60);
    const burstTypes = b7.at == null ? [] : ps.filter((p) => p.day - start >= days[b7.at] && p.day - start < days[b7.at] + 7).map((p) => p.type);
    const burst60Types = b60.at == null ? [] : ps.filter((p) => p.day - start >= days[b60.at] && p.day - start < days[b60.at] + span60).map((p) => p.type);
    rows.push({ seed: g.seed, played, n: ps.length, weeks, gap, burst7: b7.best, burst60: b60.best, burstTypes, burst60Types,
      words: ps.reduce((s, p) => s + (p.words ?? 0), 0), pausing: ps.filter((p) => TYPES[p.type].pausing).length,
      types: ps.reduce((o, p) => ((o[p.type] = (o[p.type] ?? 0) + 1), o), {}), completed: played === full });
  }
  if (!rows.length) return null;
  const allWeeks = rows.flatMap((r) => r.weeks);
  const typeTotals = {};
  for (const r of rows) for (const [k, v] of Object.entries(r.types)) typeTotals[k] = (typeTotals[k] ?? 0) + v;
  const burstMix = {}; for (const r of rows) for (const t of r.burstTypes) burstMix[t] = (burstMix[t] ?? 0) + 1;
  const burst60Mix = {}; for (const r of rows) for (const t of r.burst60Types) burst60Mix[t] = (burst60Mix[t] ?? 0) + 1;
  const clockMin = (r) => (r.played * secPerDay(era)) / 60;
  return {
    games: rows.length, completed: rows.filter((r) => r.completed).length,
    eraDays: ERA_DAYS[era], secPerDay: r1(secPerDay(era)), clockMinutesFullEra: r1((ERA_DAYS[era] * secPerDay(era)) / 60),
    promptsPerGame: r1(mean(rows.map((r) => r.n))), pausingPerGame: r1(mean(rows.map((r) => r.pausing))),
    perWeekMean: r1(mean(allWeeks)), weeksTotal: allWeeks.length,
    weeksZeroShare: r1((100 * allWeeks.filter((w) => w === 0).length) / allWeeks.length),
    weeksFourPlusShare: r1((100 * allWeeks.filter((w) => w >= 4).length) / allWeeks.length),
    weekDist: [0, 1, 2, 3].map((k) => allWeeks.filter((w) => w === k).length).concat(allWeeks.filter((w) => w >= 4).length),
    perClockMinute: r1(mean(rows.map((r) => r.n / clockMin(r)))),
    longestGapDays: { median: pct(rows.map((r) => r.gap), 0.5), p90: pct(rows.map((r) => r.gap), 0.9), max: Math.max(...rows.map((r) => r.gap)) },
    longestGapSeconds: { median: r1(pct(rows.map((r) => r.gap), 0.5) * secPerDay(era)), max: r1(Math.max(...rows.map((r) => r.gap)) * secPerDay(era)) },
    burst7: { median: pct(rows.map((r) => r.burst7), 0.5), max: Math.max(...rows.map((r) => r.burst7)) },
    burst60s: { median: pct(rows.map((r) => r.burst60), 0.5), max: Math.max(...rows.map((r) => r.burst60)) },
    burstMix, burst60Mix,
    wordsPerGame: Math.round(mean(rows.map((r) => r.words))),
    typesPerGame: Object.fromEntries(Object.entries(typeTotals).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v / rows.length)])),
  };
}

// Where prompts fall inside an era: per round, and per quarter of each round (does the end of a round pile up?).
function roundShape(games, era, filter) {
  const perRound = [0, 0, 0, 0];
  const lastDay = [0, 0, 0, 0];
  const byType = {};
  let n = 0;
  for (const g of games) {
    if (g.endEra < era || (g.endEra === era && g.endDay < ERA_START[era] + ERA_DAYS[era])) continue;
    n += 1;
    for (const p of g.log.filter((q) => q.era === era && filter(q))) {
      const d = p.day - ERA_START[era];
      const r = Math.min(3, Math.floor(Math.max(0, d - 1) / ROUND_DAYS[era]));
      perRound[r] += 1;
      (byType[p.type] ??= [0, 0, 0, 0])[r] += 1;
      if (d - r * ROUND_DAYS[era] >= ROUND_DAYS[era] - Math.max(1, Math.round(ROUND_DAYS[era] / 10))) lastDay[r] += 1;
    }
  }
  return n ? { games: n, perRound: perRound.map((x) => r1(x / n)), inLastTenthOfRound: lastDay.map((x) => r1(x / n)),
    perRoundByType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, v.map((x) => r1(x / n))])) } : null;
}

const clockSec = (day) => { let era = ERAS.findLast((e) => day >= ERA_START[e.id]).id; return ERAS.filter((e) => e.id < era).reduce((s, e) => s + ERA_DAYS[e.id] * secPerDay(e.id), 0) + (day - ERA_START[era]) * secPerDay(era); };
function minuteBins(games, filter) {
  const bins = [];
  const crowded = {};
  for (const g of games) {
    const end = clockSec(g.endDay);
    const n = Math.floor(end / 60);
    const b = Array(Math.max(1, n)).fill(0);
    const types = Array(b.length).fill(null).map(() => []);
    for (const p of g.log.filter(filter)) { const i = Math.min(b.length - 1, Math.floor(clockSec(p.day) / 60)); b[i] += 1; types[i].push(p.type); }
    bins.push(...b);
    b.forEach((v, i) => { if (v >= 4) for (const t of types[i]) crowded[t] = (crowded[t] ?? 0) + 1; });
  }
  return { minutes: bins.length, mean: r1(mean(bins)), dist: [0, 1, 2, 3].map((k) => bins.filter((x) => x === k).length).concat(bins.filter((x) => x >= 4).length), crowdedMinuteMix: crowded };
}
// Pausing prompts within the last 2 story days of an era and the first story day of the next.
function boundary(games, era) {
  const edge = ERA_START[era] + ERA_DAYS[era];
  const rows = games.filter((g) => g.endEra > era).map((g) => g.log.filter((p) => TYPES[p.type].pausing && p.day >= edge - 2 && p.day <= edge + 1).map((p) => p.type));
  if (!rows.length) return null;
  const mix = {}; for (const r of rows) for (const t of r) mix[t] = (mix[t] ?? 0) + 1;
  return { games: rows.length, meanPausing: r1(mean(rows.map((r) => r.length))), max: Math.max(...rows.map((r) => r.length)), mix: Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, r1(v / rows.length)])) };
}

// The two numbers the pacing director is judged by (reward-loops build, step 0, 2026-10-27). Story-day resolution:
// everything on one day sits at that day's clock time.
// Most clock-stopping prompts in any 30 s of running clock (target: at most 2).
const CROWD_WINDOW_S = 30;
// byPlayer false leaves out a summit the player opened from the menu (a bot does that on era 5's first day): the game
// did not interrupt for it.
function crowd30(g, { byPlayer = true, mix = false } = {}) {
  const ps = g.log.filter((p) => TYPES[p.type].pausing && (byPlayer || !p.byPlayer)).map((p) => ({ t: clockSec(p.day), p })).sort((a, b) => a.t - b.t);
  let best = 0;
  let at = [];
  for (let i = 0, j = 0; j < ps.length; j++) {
    while (ps[j].t - ps[i].t >= CROWD_WINDOW_S) i++;
    if (j - i + 1 > best) { best = j - i + 1; at = ps.slice(i, j + 1).map((x) => `e${x.p.era}:${x.p.type}`); }
  }
  return mix ? at.join('+') : best;
}
// Longest stretch of running clock with neither a decision nor a visible payoff (target: about 90 s), for the whole
// game or one era. A decision is any logged prompt or one of the player's own moves; a payoff is a release reveal, a
// "Just now" toast or a finished run (logged as releaseReady). Feed posts do not count.
function quietest(g, era = null) {
  const from = era == null ? 0 : clockSec(ERA_START[era]);
  const to = era == null ? clockSec(g.endDay) : Math.min(clockSec(g.endDay), clockSec(ERA_START[era] + ERA_DAYS[era]));
  const days = [...g.log, ...g.info.playerMoves, ...g.info.reveals, ...g.info.toasts].map((x) => x.day);
  const t = [from, ...days.map(clockSec).filter((s) => s >= from && s <= to), to].sort((a, b) => a - b);
  let gap = 0;
  for (let i = 1; i < t.length; i++) gap = Math.max(gap, t[i] - t[i - 1]);
  return gap;
}
const spread = (xs) => (xs.length ? { median: r1(pct(xs, 0.5)), p90: r1(pct(xs, 0.9)), max: r1(Math.max(...xs)) } : null);

// ---- real-time estimate (ASSUMPTIONS, see report) ----
// FAST=1 models a skimmer (400 wpm, quick clicks, half-length set pieces); default models a first-time reader.
const FAST = process.env.FAST === '1';
const READ_WPM = FAST ? 400 : 230; // assumed silent reading speed
const DECIDE_S = FAST ? 2 : 5; // assumed thinking time per pausing prompt that offers choices
const FIXED_S = FAST ? { boardMeeting: 45, summit: 75, eraTransition: 5, dealDialog: 4, cashWarning: 4 } : { boardMeeting: 90, summit: 150, eraTransition: 15, dealDialog: 10, cashWarning: 10 }; // assumed whole-dialog times
const REVEAL_S = FAST ? 12 : 30; // release show: ~18 s of timed beats in ui/screens/reveal.js (clicks hurry it) plus its summary (assumed)
const MOVE_S = FAST ? 15 : 30; // the player's own action through the floor menu and a screen (assumed; menus and dialogs pause the clock)
const TOUR_S = 180; // first-run tour: 593 words + 16 clicks (assumed reading speed)
function timeEstimate(games, era) {
  const rows = games.filter((g) => g.endEra > era || (g.endEra === era && g.endDay >= ERA_START[era] + ERA_DAYS[era] - 1));
  if (!rows.length) return null;
  const per = rows.map((g) => {
    const ps = g.log.filter((p) => p.era === era && TYPES[p.type].pausing);
    const promptS = ps.reduce((sum, p) => sum + (FIXED_S[p.type] ?? ((p.words ?? 0) / READ_WPM) * 60 + DECIDE_S), 0);
    const ownS = g.info.playerMoves.filter((x) => x.era === era).length * MOVE_S + g.info.reveals.filter((x) => x.era === era).length * REVEAL_S;
    return { clock: ERA_DAYS[era] * secPerDay(era) / 60, prompts: promptS / 60, own: ownS / 60 };
  });
  const c = mean(per.map((x) => x.clock)), pr = mean(per.map((x) => x.prompts)), ow = mean(per.map((x) => x.own));
  return { clockMin: r1(c), promptPauseMin: r1(pr), ownActionsMin: r1(ow), totalMin: r1(c + pr + ow) };
}

const seeds = Number(process.argv[2] ?? 40);
const names = (process.argv[3] ?? 'careful,balanced').split(',');
const out = { seeds, secondsPerRound: SECONDS_PER_ROUND, tourWords, presidentWords, strategies: {} };
for (const name of names) {
  const games = [];
  for (let seed = 1; seed <= seeds; seed++) games.push(playGame(name, seed));
  const endings = {};
  for (const g of games) endings[`${g.ending ?? 'none'}@era${g.endEra}`] = (endings[`${g.ending ?? 'none'}@era${g.endEra}`] ?? 0) + 1;
  const all = () => true;
  const pausing = (p) => TYPES[p.type].pausing;
  const res = { endings, endDay: { median: pct(games.map((g) => g.endDay), 0.5) }, eras: {}, erasPausingOnly: {}, roundShape: {}, info: {} };
  for (const era of [1, 2, 3, 4, 5]) {
    res.eras[era] = eraStats(games, era, all);
    res.erasPausingOnly[era] = eraStats(games, era, pausing);
    res.roundShape[era] = roundShape(games, era, all);
    const inEra = (xs) => xs.filter((x) => x.era === era);
    const playedGames = games.filter((g) => g.endEra >= era).length || 1;
    res.info[era] = {
      toastsPerGame: r1(games.reduce((s, g) => s + inEra(g.info.toasts).reduce((a, t) => a + t.n, 0), 0) / playedGames),
      feedPostsPerGame: r1(games.reduce((s, g) => s + inEra(g.info.feed).reduce((a, t) => a + t.n, 0), 0) / playedGames),
      playerMovesPerGame: r1(games.reduce((s, g) => s + inEra(g.info.playerMoves).length, 0) / playedGames),
      revealsPerGame: r1(games.reduce((s, g) => s + inEra(g.info.reveals).length, 0) / playedGames),
    };
  }
  // Same-day stacks: days with 2+ pausing prompts (the player closes one and the next opens at once).
  const stacks = {};
  let stackDays = 0;
  for (const g of games) {
    const byDay = new Map();
    for (const p of g.log.filter(pausing)) byDay.set(p.day, [...(byDay.get(p.day) ?? []), p.type]);
    for (const types of byDay.values()) if (types.length >= 2) { stackDays += 1; const k = types.sort().join('+'); stacks[k] = (stacks[k] ?? 0) + 1; }
  }
  res.timeEstimate = Object.fromEntries([1, 2, 3, 4, 5].map((era) => [era, timeEstimate(games, era)]));
  res.typeWords = {}; { const acc = {}; for (const g of games) for (const p of g.log) { (acc[p.type] ??= []).push(p.words ?? 0); } for (const [k, v] of Object.entries(acc)) res.typeWords[k] = Math.round(mean(v)); }
  res.minuteBinsAll = minuteBins(games, all);
  res.minuteBinsPausing = minuteBins(games, pausing);
  res.eraBoundaries = Object.fromEntries([1, 2, 3, 4].map((era) => [`${era}->${era + 1}`, boundary(games, era)]));
  res.clockMinutesToEnd = { median: r1(pct(games.map((g) => clockSec(g.endDay) / 60), 0.5)), min: r1(Math.min(...games.map((g) => clockSec(g.endDay) / 60))), max: r1(Math.max(...games.map((g) => clockSec(g.endDay) / 60))) };
  res.runs = Object.fromEntries([1, 2, 3, 4, 5].map((era) => { const rs = games.flatMap((g) => g.info.runs.filter((x) => x.era === era && x.end != null)); const d = rs.map((x) => x.end - x.start); return [era, { runs: rs.length, medianDays: pct(d, 0.5), medianSeconds: r1(pct(d, 0.5) * secPerDay(era)) }]; }));
  res.sameDayPausingStacksPerGame = r1(stackDays / games.length);
  res.sameDayStackKinds = Object.fromEntries(Object.entries(stacks).sort((a, b) => b[1] - a[1]).slice(0, 12));
  res.crowd30s = spread(games.map((g) => crowd30(g)));
  res.crowd30sGameOpened = spread(games.map((g) => crowd30(g, { byPlayer: false })));
  // What fills each game's most crowded 30 s (the first such window), counted over games.
  res.crowd30sGameOpenedMix = games.map((g) => crowd30(g, { byPlayer: false, mix: true })).reduce((o, k) => ((o[k] = (o[k] ?? 0) + 1), o), {});
  res.quietSeconds = {
    game: spread(games.map((g) => quietest(g))),
    byEra: Object.fromEntries(ERAS.map((e) => [e.id, spread(games.filter((g) => g.endEra >= e.id).map((g) => quietest(g, e.id)))])),
  };
  // Card answer windows (dueAt - landsAt) for scenario cards, per era
  res.scenarioWindows = Object.fromEntries([1, 2, 3, 4, 5].map((era) => [era, [...new Set(games.flatMap((g) => g.log.filter((p) => p.era === era && p.type === 'scenarioCard').map((p) => p.window)))].sort((a, b) => a - b)]));
  res.sampleTimeline = games.slice(0, 2).map((g) => ({ seed: g.seed, ending: g.ending, endEra: g.endEra, log: g.log.map((p) => `${p.day}:e${p.era}:${p.type}${p.id ? `(${p.id})` : ''}`) }));
  out.strategies[name] = res;
}
console.log(JSON.stringify(out, null, 1));
