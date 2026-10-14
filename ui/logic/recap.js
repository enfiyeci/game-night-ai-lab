// The Daily Token's era-in-review page (owner pick RC, with RA2's click-to-explain): what the page prints about the era
// that just ended, from the sim's decision log (sim/events.js logDecision). The words live in ui/data/recapCopy.js.
import { createInitialState } from '../../sim/state.js';
import { ERAS } from '../../sim/data/eras.js';
import { rank, gapToLeader } from '../../sim/rivals.js';
import { activeModels } from '../../sim/serving.js';
import { storyDate } from '../../sim/time.js';
import { CONSEQUENCES } from '../data/eventCopy.js';
import * as COPY from '../data/recapCopy.js';
import { catalogRow, TAG_TO_ADVISOR } from './events.js';
import { historyRows } from './history.js';
import { money, users as formatUsers } from './format.js';

export const fill = (template, values = {}) =>
  template.replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthOf = (day) => MONTHS[storyDate(day).m - 1];
const LEAD_ORDER = ['safety', 'research', 'cfo', 'policy'];
const LEAD_TAG = Object.fromEntries(Object.entries(TAG_TO_ADVISOR).map(([tag, role]) => [role, tag]));
const oneDecimal = (value) => (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '');

const choicesOf = (eventId) => catalogRow(eventId)?.card?.choices ?? [];
const choiceOf = (decision) => choicesOf(decision.eventId).find((choice) => choice.id === decision.choiceId) ?? null;
const leadsIn = (tags = []) => tags.map((tag) => TAG_TO_ADVISOR[tag]).filter(Boolean);

// ---------- Verdicts ----------
// Rule (stated for the owner): a choice's verdict comes from what its effects really do, run once on a probe lab with
// one live model. Each measure the player can see (users, public trust, staff trust, research progress, investor
// mood, board support, Washington's and the world's favour, model capability, cash coming in) or that the card itself
// names in words (safety debt, hidden risk, misuse risk, security, race pressure, a training hold, a lawsuit) counts as
// a gain or a loss by its direction. Cash the choice spends is its price and is not counted. Gains and no losses:
// Paid off. Losses and no gains: Still costing you. Both, or neither: Mixed.
const UP = {
  users: (s) => s.models.reduce((sum, model) => sum + (model.users ?? 0), 0),
  publicTrust: (s) => s.publicTrust,
  staffTrust: (s) => s.staffTrust,
  research: (s) => s.researchPoints,
  sentiment: (s) => s.sentiment,
  security: (s) => s.security,
  board: (s) => s.board.reduce((sum, support) => sum + support, 0),
  usFavor: (s) => s.govFavor.us,
  intlFavor: (s) => s.govFavor.intl,
  capability: (s) => s.capability + s.models.reduce((sum, model) => sum + (model.capability ?? 0), 0),
};
const DOWN = {
  alignmentDebt: (s) => s.alignmentDebt,
  concealedDebt: (s) => s.concealedDebt,
  misuseExposure: (s) => s.misuseExposure,
  raceHeat: (s) => s.raceHeat,
  legalCases: (s) => s.legalCases.length,
  trainingHold: (s) => s.flags.trainingPausedUntilDay ?? 0,
};

let probeBase = null;
function probe(era) {
  probeBase ??= (() => {
    const state = createInitialState({ seed: 1 });
    Object.assign(state, { publicTrust: 50, staffTrust: 50, security: 50, raceHeat: 50, alignmentDebt: 30, concealedDebt: 10, misuseExposure: 30, researchPoints: 20 });
    state.models.push({ name: 'Probe 1', family: 'Probe', active: true, activated: true, activeFromTurn: 0, releasedTurn: 0,
      channel: 'consumer', users: 1e6, userCap: 1e7, priceStance: 'market', capability: 20, flags: [],
      spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: true, channel: 'consumer', reasoning: 'off' } });
    return state;
  })();
  const state = structuredClone(probeBase);
  state.era = era;
  return state;
}

const verdicts = new Map();
export function verdictOf(eventId, choiceId) {
  const key = `${eventId}:${choiceId}`;
  if (verdicts.has(key)) return verdicts.get(key);
  const row = catalogRow(eventId);
  const choice = row?.card?.choices.find((candidate) => candidate.id === choiceId);
  let verdict = 'mixed';
  if (choice) {
    const before = probe(row.eras?.[0] ?? 3);
    const after = structuredClone(before);
    try {
      choice.effects(after, [0]);
      let gains = 0;
      let losses = 0;
      for (const measure of Object.values(UP)) {
        const delta = measure(after) - measure(before);
        if (delta > 1e-9) gains += 1;
        else if (delta < -1e-9) losses += 1;
      }
      for (const measure of Object.values(DOWN)) {
        const delta = measure(after) - measure(before);
        if (delta < -1e-9) gains += 1;
        else if (delta > 1e-9) losses += 1;
      }
      if (after.cash > before.cash + 1e-9) gains += 1;
      verdict = gains && !losses ? 'paid' : losses && !gains ? 'costing' : 'mixed';
    } catch {
      verdict = 'mixed'; // an effect that needs more of a real run than the probe has: no claim either way
    }
  }
  verdicts.set(key, verdict);
  return verdict;
}

// ---------- The era's biggest calls ----------
// Rule (stated for the owner): a call is trivial, and skipped, when its card has fewer than two choices or none of its
// choices costs cash or has a lead for or against it. The rest rank by: scenario and crisis cards first; then the
// card's biggest price (the most cash any of its choices asks); then how many of the four leads took a side on it;
// then the earliest. The top three print in date order.
function weight(decision) {
  const row = catalogRow(decision.eventId);
  const choices = choicesOf(decision.eventId);
  const sides = new Set(choices.flatMap((choice) => leadsIn([...(choice.backers ?? []), ...(choice.opposers ?? [])])));
  return {
    tier: row?.kind === 'scenario' || row?.crisis ? 0 : 1,
    stakes: Math.max(0, ...choices.map((choice) => choice.cashCost ?? 0)),
    sides: sides.size,
  };
}

export function isTrivial(decision) {
  const choices = choicesOf(decision.eventId);
  if (choices.length < 2 || !choiceOf(decision)) return true;
  return choices.every((choice) => !(choice.cashCost > 0) && !leadsIn(choice.backers).length && !leadsIn(choice.opposers).length);
}

export function bigCalls(decisions, count = 3) {
  return decisions
    .filter((decision) => !isTrivial(decision))
    .map((decision, index) => ({ decision, index, ...weight(decision) }))
    .sort((a, b) => a.tier - b.tier || b.stakes - a.stakes || b.sides - a.sides || a.decision.day - b.decision.day || a.index - b.index)
    .slice(0, count)
    .sort((a, b) => a.decision.day - b.decision.day || a.index - b.index)
    .map(({ decision }) => decision);
}

// ---------- One story ----------
// Written copy for the scenario cards; any other card prints its title over its consequence line (ui/data/eventCopy.js)
// or, without one, over the choice it ended with.
export function storyFor(decision) {
  const row = catalogRow(decision.eventId);
  const choice = choiceOf(decision);
  const label = decision.label ?? choice?.label ?? decision.choiceId;
  const cost = choice?.cashCost > 0 ? money(choice.cashCost) : '';
  const written = COPY.STORIES[decision.eventId]?.[decision.choiceId];
  const title = decision.title ?? row?.card?.title ?? decision.eventId;
  const head = written ? written[0] : title;
  const consequence = CONSEQUENCES[decision.eventId]?.[decision.choiceId];
  const body = written ? fill(written[1], { cost }) : consequence ?? fill(COPY.FALLBACK_STORY, { title, label });
  return {
    eventId: decision.eventId,
    choiceId: decision.choiceId,
    head,
    story: body,
    auto: decision.auto ? fill(COPY.AUTO_NOTE, { label }) : null,
    verdict: verdictOf(decision.eventId, decision.choiceId),
    written: Boolean(written),
    month: monthOf(decision.day),
    label,
  };
}

const namesOf = (roles) => {
  const names = roles.map((role) => COPY.LEADS[role].name);
  return names.length < 2 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
};

// What the click-to-explain panel says: the card in plain words, then who would have chosen what.
export function explainFor(decision) {
  const row = catalogRow(decision.eventId);
  const post = row?.card?.post?.text;
  const about = COPY.STORIES[decision.eventId]?.about ?? (post ? fill(COPY.EXPLAIN.fallbackAbout, { post }) : null);
  const choices = choicesOf(decision.eventId);
  const yours = choiceOf(decision);
  const lines = [];
  const backedYou = [...new Set(leadsIn(yours?.backers))];
  if (backedYou.length) lines.push(fill(COPY.EXPLAIN.backed, { names: namesOf(backedYou) }));
  for (const choice of choices) {
    if (choice.id === decision.choiceId) continue;
    const roles = [...new Set(leadsIn(choice.backers))];
    if (!roles.length) continue;
    lines.push(fill(COPY.EXPLAIN.would, { name: namesOf(roles), label: choice.label, cost: choice.cashCost > 0 ? ` (${money(choice.cashCost)})` : '' }));
  }
  if (!lines.length) lines.push(COPY.EXPLAIN.nobody);
  return { heading: COPY.EXPLAIN.heading, about, lines };
}

// ---------- The year's numbers ----------
function standingOf(state) {
  const place = rank(state);
  const top = [...state.rivals].sort((a, b) => b.capability - a.capability)[0];
  if (place === 1) {
    const lead = state.capability - top.capability;
    return { place, leader: null, second: top.name, gap: Math.max(0, lead), tied: oneDecimal(Math.max(0, lead)) === '0' };
  }
  const gap = gapToLeader(state);
  return { place, leader: top.name, second: null, gap, tied: oneDecimal(gap) === '0' };
}

function bestModel(state) {
  const rows = historyRows(state);
  if (!rows.length) return null;
  return rows.reduce((best, row) => (row.pressAvg > best.pressAvg ? row : best));
}

const countWord = (n) => COPY.NUMBER_WORDS[n] ?? `${n}`;
const plural = (entry, n) => (typeof entry === 'string' ? fill(entry, { n: countWord(n) }) : fill(n === 1 ? entry.one : entry.many, { n: countWord(n) }));

function dek(stories, stats) {
  const parts = [];
  const count = (verdict) => stories.filter((story) => story.verdict === verdict).length;
  if (count('paid')) parts.push(plural(COPY.DEK.paid, count('paid')));
  if (count('costing')) parts.push(plural(COPY.DEK.costing, count('costing')));
  if (count('mixed')) parts.push(plural(COPY.DEK.mixed, count('mixed')));
  const joined = parts.length < 2 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  const calls = stories.length ? fill(COPY.DEK.calls, { parts: joined }) : COPY.DEK.noCalls;
  const model = stats.model ? fill(COPY.DEK.model, { model: stats.model, press: stats.press }) : COPY.DEK.noModel;
  const money = stats.users > 0 ? fill(COPY.DEK.money, { users: formatUsers(stats.users), cash: stats.cash }) : fill(COPY.DEK.moneyNoUsers, { cash: stats.cash });
  return `${calls} ${model} ${money}`;
}

// ---------- The critics' corner ----------
// Each lead speaks about one call they took a side on: first one they opposed that is still costing, then one they
// backed that paid off, then any they opposed, then any they backed, then one where they wanted another choice. A call
// another lead already spoke about is passed over; a lead with nothing left to talk about gives their year's number.
function criticFor(role, calls, decisions, ctx, used) {
  const tag = LEAD_TAG[role];
  const pool = [...calls, ...decisions.filter((decision) => !calls.includes(decision) && !isTrivial(decision))];
  const takes = pool.flatMap((decision) => {
    const choice = choiceOf(decision);
    const verdict = verdictOf(decision.eventId, decision.choiceId);
    const other = choicesOf(decision.eventId).find((item) => item.id !== decision.choiceId && item.backers?.includes(tag));
    if (choice?.opposers?.includes(tag)) return [{ decision, rank: verdict === 'costing' ? 0 : 2, key: verdict === 'costing' ? 'opposedCosting' : 'opposed', mood: verdict === 'costing' ? 'worried' : 'flat' }];
    if (choice?.backers?.includes(tag)) {
      return [{ decision, rank: verdict === 'paid' ? 1 : 3, key: { paid: 'backedPaid', costing: 'backedCosting', mixed: 'backedMixed' }[verdict], mood: verdict === 'costing' ? 'flat' : 'happy' }];
    }
    return other ? [{ decision, rank: 4, key: 'preferred', mood: 'flat', other: other.label }] : [];
  }).filter((take) => !used.has(take.decision)).sort((a, b) => a.rank - b.rank);
  if (takes.length) {
    const { decision, key, mood, other } = takes[0];
    used.add(decision);
    return { role, mood, eventId: decision.eventId, text: fill(COPY.CRITIC[key], { label: decision.label ?? choiceOf(decision)?.label, month: monthOf(decision.day), other }) };
  }
  const line = COPY.CRITIC[role];
  if (role === 'research') {
    return { role, mood: ctx.standing.place === 1 ? 'happy' : 'flat', text: ctx.standing.place === 1 ? line.lead : fill(line.behind, { leader: ctx.standing.leader, gap: oneDecimal(ctx.standing.gap) }) };
  }
  if (role === 'cfo') return { role, mood: 'flat', text: fill(ctx.cashM < 100 ? line.low : line.cash, { cash: ctx.cash }) };
  if (role === 'policy') return { role, mood: ctx.users > 0 ? 'happy' : 'flat', text: ctx.users > 0 ? fill(line.users, { users: formatUsers(ctx.users) }) : line.none };
  return { role, mood: 'flat', text: line.quiet };
}

// The whole page for the era that just ended. `state` is the state when the next era began (the era's end).
export function recapModel(state, era, { lab = state.labName || 'Your lab' } = {}) {
  const decisions = (state.decisions ?? []).filter((decision) => decision.era === era);
  const calls = bigCalls(decisions);
  const stories = calls.map(storyFor);
  const standing = standingOf(state);
  const best = bestModel(state);
  const usersNow = activeModels(state).reduce((sum, model) => sum + (model.users ?? 0), 0);
  const cash = money(state.cash);
  const year = storyDate(Math.max(0, state.day - 1)).y;
  const rankWord = COPY.RANK_WORDS[standing.place - 1] ?? `number ${standing.place}`;
  const key = standing.place === 1 ? (standing.tied ? 'firstTied' : 'first') : standing.tied ? 'behindTied' : 'behind';
  const headline = fill(COPY.HEADLINE[key], { lab, year, rank: rankWord, gap: oneDecimal(standing.gap), leader: standing.leader, second: standing.second });
  const stats = { model: best?.name, press: best ? best.pressAvg.toFixed(1) : null, users: usersNow, cash };
  const ctx = { standing, cash, cashM: state.cash, users: usersNow };
  const used = new Set();
  return {
    era,
    masthead: COPY.MASTHEAD,
    dateline: [
      fill(COPY.DATELINE.kicker, { year }),
      fill(COPY.DATELINE.edition, { lab }),
      fill(COPY.DATELINE.era, { era, name: ERAS[era - 1].name }),
    ],
    headline,
    dek: dek(stories, stats),
    stories: stories.map((story, index) => ({ ...story, explain: explainFor(calls[index]) })),
    critics: LEAD_ORDER.map((role) => ({ ...criticFor(role, calls, decisions, ctx, used), name: COPY.LEADS[role].name, title: COPY.LEADS[role].role })),
    verdictWords: COPY.VERDICT,
    hint: COPY.OPEN_HINT,
    next: fill(COPY.NEXT, { next: era + 1 }),
    stats,
    standing,
  };
}
