import { accrue, clamp } from './util.js';
import { RIVAL_TEMPLATES, leaderCapability } from './rivals.js';
import { exposeConcealed } from './hazards.js';
import {
  CATCH, CAUGHT_TRUST, CHECK_LEAN, CHECK_LEVELS, DEFAULT_CHECK, DEMANDS, DETERRENCE, FALSE_ACCUSATION_TRUST,
  FALSE_ALARM, INVESTIGATE, MAX_PROMISES, PRESIDENT_VERIFICATION_FAVOR, PROMISE_BONUS, PROMISES, READ_BAND,
  SIGN_AT, SIGN_SEEN, SUSPICION_DAYS, BREAK_GAIN,
} from './data/summit.js';

export const COMMITMENTS = Object.freeze({
  evaluators: { base: 0.1 },
  computeCap: { base: -0.1 },
  releaseDelay: { base: 0 },
  sharedSafety: { base: 0.15 },
  pauseAutomation: { base: -0.05 },
  verification: { base: -0.2 },
});

export const PARTIES = Object.freeze([...RIVAL_TEMPLATES.map((rival) => rival.id), 'west', 'east']);
export const SUMMIT_SKIP_RACE_HEAT = 8;
export const SUMMIT_SKIP_US_FAVOR = 5;
export const SUMMIT_SKIP_INTL_FAVOR = 5;

// Parties whose demand does not depend on anyone else come first; followers after the party they follow.
const RESOLVE_ORDER = Object.freeze(['east', 'west', 'deepthink', 'lodestar', 'qilin', 'openbrain']);
const GOVERNMENTS = Object.freeze({
  west: { id: 'west', caution: 0.5 },
  east: { id: 'east', caution: 0.4 },
});
const isGovernment = (id) => Object.hasOwn(GOVERNMENTS, id);

export const dealStands = (state) => Boolean(state.deal) && state.deal.collapsed === false;
export const dealBinds = (state, card) => dealStands(state) && state.deal.binding.includes(card);

function partyById(state, id) {
  if (isGovernment(id)) return GOVERNMENTS[id];
  return state.rivals.find((rival) => rival.id === id);
}

function gapBehind(state, party) {
  if (isGovernment(party.id)) return 0;
  return Math.max(0, Math.max(state.capability, leaderCapability(state)) - party.capability);
}

// A party's willingness to sign one card, before its demand is checked.
function stance(state, card, partyId, plan) {
  const party = partyById(state, partyId);
  let favor = 0;
  if (partyId === 'west') favor = (state.govFavor.us - 50) / 100;
  if (partyId === 'east') favor = (state.govFavor.intl - 50) / 100;
  return COMMITMENTS[card].base
    + (party.caution ?? 0.5)
    - gapBehind(state, party) / 100
    - state.raceHeat / 200
    + (state.publicTrust - 50) / 200
    + favor
    + (state.flags.pooled ? 0.1 : 0)
    + CHECK_LEAN[partyId] * (plan.checks[card] ?? DEFAULT_CHECK)
    + (Object.hasOwn(plan.promises, partyId) ? PROMISE_BONUS : 0);
}

function normalizePlan(plan) {
  return {
    proposals: [...(plan?.proposals ?? [])],
    checks: { ...(plan?.checks ?? {}) },
    promises: { ...(plan?.promises ?? {}) },
  };
}

function normalizeMotions(move) {
  if (Object.hasOwn(move ?? {}, 'motions')) {
    if (!Array.isArray(move.motions)) return move.motions;
    return move.motions.map((motion) => ({
      card: motion?.card,
      check: motion?.check,
      promises: { ...(motion?.promises ?? {}) },
    }));
  }
  if (!Array.isArray(move?.proposals)) return move?.proposals;
  return move.proposals.map((card, i) => ({
    card,
    check: move.checks?.[card] ?? DEFAULT_CHECK,
    promises: i === 0 ? { ...(move.promises ?? {}) } : {},
  }));
}

// Whether each party's own demand is met by the plan (a promise always meets it).
// A follower's demand depends on the vote, so it is null here; see readTheRoom per card.
export function demandStatus(plan) {
  const p = normalizePlan(plan);
  return Object.fromEntries(PARTIES.map((party) => {
    if (Object.hasOwn(p.promises, party)) return [party, true];
    const rule = DEMANDS[party].rule;
    if (rule.promiseOnly) return [party, false];
    if (rule.refuses) return [party, !p.proposals.includes(rule.refuses)];
    if (rule.minCheck != null) return [party, p.proposals.some((card) => (p.checks[card] ?? DEFAULT_CHECK) >= rule.minCheck)];
    return [party, null];
  }));
}

// Each party's lean on one card: 'yes' | 'maybe' | 'no'. With noise it is a vote; without, Jules's read.
function resolveCard(state, card, plan, noise, vote = false) {
  const out = {};
  const level = plan.checks[card] ?? DEFAULT_CHECK;
  for (const party of RESOLVE_ORDER) {
    const rule = DEMANDS[party].rule;
    const willing = stance(state, card, party, plan) + noise(party);
    const byStance = vote ? (willing > SIGN_AT ? 'yes' : 'no')
      : willing > SIGN_AT + READ_BAND ? 'yes' : willing > SIGN_AT - READ_BAND ? 'maybe' : 'no';
    let lean;
    if (Object.hasOwn(plan.promises, party)) lean = byStance;
    else if (rule.follows) lean = rule.maxCheck != null && level > rule.maxCheck ? 'no' : out[rule.follows];
    else if (rule.promiseOnly) lean = 'no';
    else if (rule.refuses === card) lean = 'no';
    else if (rule.minCheck != null && level < rule.minCheck) lean = 'no';
    else lean = byStance;
    out[party] = lean;
  }
  return Object.fromEntries(PARTIES.map((party) => [party, out[party]]));
}

export function readTheRoom(state, plan) {
  const p = normalizePlan(plan);
  const cards = p.proposals.length ? p.proposals : Object.keys(COMMITMENTS);
  return Object.fromEntries(cards.map((card) => [card, resolveCard(state, card, p, () => 0)]));
}

function proposalError(state, move) {
  if (state.era !== 5 || state.turnInEra !== 0) return 'the summit only opens at the start of era 5';
  if (state.deal) return 'the summit has already happened';
  let motions;
  if (Object.hasOwn(move ?? {}, 'motions')) {
    motions = move.motions;
    if (!Array.isArray(motions) || motions.length < 1 || motions.length > 3) return 'choose one to three summit motions';
    if (motions.some((motion) => typeof motion !== 'object' || motion === null || Array.isArray(motion))) return 'summit motions must be objects';
    const proposals = motions.map((motion) => motion.card);
    if (new Set(proposals).size !== proposals.length) return 'summit proposals cannot repeat';
    if (proposals.some((id) => typeof id !== 'string' || !Object.hasOwn(COMMITMENTS, id))) return 'unknown summit proposal';
    if (motions.some((motion) => !Number.isInteger(motion.check) || motion.check < 0 || motion.check >= CHECK_LEVELS.length)) return 'unknown checking level';
  } else {
    const proposals = move?.proposals;
    if (!Array.isArray(proposals) || proposals.length < 1 || proposals.length > 3) return 'choose one to three summit proposals';
    if (new Set(proposals).size !== proposals.length) return 'summit proposals cannot repeat';
    if (proposals.some((id) => typeof id !== 'string' || !Object.hasOwn(COMMITMENTS, id))) return 'unknown summit proposal';
    const checks = move.checks ?? {};
    if (typeof checks !== 'object' || checks === null || Array.isArray(checks)) return 'summit checks must be an object';
    for (const [card, level] of Object.entries(checks)) {
      if (!proposals.includes(card)) return 'a checking level needs its proposal';
      if (!Number.isInteger(level) || level < 0 || level >= CHECK_LEVELS.length) return 'unknown checking level';
    }
    const promises = move.promises ?? {};
    if (typeof promises !== 'object' || promises === null || Array.isArray(promises)) return 'summit promises must be an object';
    motions = normalizeMotions(move);
  }
  const entries = [];
  const promised = new Set();
  for (const motion of motions) {
    const promises = motion.promises ?? {};
    if (typeof promises !== 'object' || promises === null || Array.isArray(promises)) return 'summit promises must be an object';
    for (const entry of Object.entries(promises)) {
      if (promised.has(entry[0])) return 'a summit delegate can receive only one promise';
      promised.add(entry[0]);
      entries.push(entry);
    }
  }
  if (entries.length > MAX_PROMISES) return `at most ${MAX_PROMISES} promises`;
  for (const [party, type] of entries) {
    if (!PARTIES.includes(party)) return 'unknown summit delegate';
    if (typeof type !== 'string' || !Object.hasOwn(PROMISES, type)) return 'unknown summit promise';
  }
  const cash = entries.reduce((sum, [, type]) => sum + (PROMISES[type].cash ?? 0), 0);
  if (cash > 0 && cash > state.cash) return 'not enough cash for those promises';
  return null;
}

export function voteMotion(state, motions, i) {
  const plan = { proposals: [], checks: {}, promises: {} };
  for (const motion of motions.slice(0, i + 1)) {
    plan.proposals.push(motion.card);
    plan.checks[motion.card] = motion.check;
    Object.assign(plan.promises, motion.promises ?? {});
  }
  const card = motions[i].card;
  // Owner 2026-09-26, no dice: no noise on the vote; stances and check levels decide it.
  const vote = resolveCard(state, card, plan, () => 0, true);
  let signed = PARTIES.filter((party) => vote[party] === 'yes');
  // A follower keeps its word: it signs exactly when the party it follows signed.
  for (const party of RESOLVE_ORDER) {
    const rule = DEMANDS[party].rule;
    if (!rule.follows || Object.hasOwn(plan.promises, party)) continue;
    const ok = signed.includes(rule.follows) && !(rule.maxCheck != null && plan.checks[card] > rule.maxCheck);
    signed = signed.filter((id) => id !== party);
    if (ok) signed.push(party);
  }
  signed = PARTIES.filter((party) => signed.includes(party));
  const labIds = new Set(state.rivals.map((rival) => rival.id));
  return {
    signed,
    binds: signed.some((id) => labIds.has(id)) && signed.some((id) => isGovernment(id)),
  };
}

export function proposeSummit(state, move, _rng) {
  const error = proposalError(state, move);
  if (error) return { ok: false, error };
  const motions = normalizeMotions(move);
  const plan = { proposals: [], checks: {}, promises: {} };
  for (const motion of motions) {
    plan.proposals.push(motion.card);
    plan.checks[motion.card] = motion.check;
    Object.assign(plan.promises, motion.promises);
  }

  const signed = Object.fromEntries(Object.keys(COMMITMENTS).map((id) => [id, []]));
  const binding = [];
  motions.forEach((motion, i) => {
    const result = voteMotion(state, motions, i);
    signed[motion.card] = result.signed;
    if (result.binds) binding.push(motion.card);
  });

  state.deal = {
    motions,
    proposals: plan.proposals,
    checks: plan.checks,
    promises: plan.promises,
    signed,
    binding,
    expelled: [],
    suspicions: [],
    nextSuspicion: 1,
    insulted: {},
    playerBreaks: [],
    playerInspected: Object.values(plan.promises).includes('inspectors'),
    collapsed: false,
    playerShipped: false,
  };
  const events = [];
  for (const type of Object.values(plan.promises)) {
    if (type === 'pay') state.cash -= PROMISES.pay.cash;
    if (type === 'goFirst') exposeConcealed(state, 0.5);
  }
  if (binding.includes('evaluators')) exposeConcealed(state, 0.5);
  if (binding.includes('sharedSafety')) {
    state.cash -= 40;
    state.alignmentDebt = clamp(state.alignmentDebt - 6, 0, 100);
    for (const rival of state.rivals) rival.caution = Math.min(1, rival.caution + 0.1);
  }
  if (binding.includes('verification') && state.meetingsHeld?.includes('second')) {
    state.govFavor.us = clamp(state.govFavor.us - PRESIDENT_VERIFICATION_FAVOR, 0, 100);
    events.push({ type: 'presidentAngry' });
  }
  state.raceHeat = clamp(state.raceHeat - 5 * binding.length, 0, 100);
  return { ok: true, signed, binding, events };
}

// ---------- after the vote ----------

// The strictest check on any card this party signed.
function levelFor(state, party) {
  const deal = state.deal;
  let level = 0;
  for (const card of deal.proposals) {
    if (deal.signed[card]?.includes(party)) level = Math.max(level, deal.checks[card] ?? DEFAULT_CHECK);
  }
  return level;
}

function signingRivals(state) {
  const rivalIds = new Set(state.rivals.map((rival) => rival.id));
  const signers = new Set(Object.values(state.deal.signed).flat());
  return PARTIES.filter((id) => rivalIds.has(id) && signers.has(id));
}

// Catching helps you: the cheater scraps what it gained, leaves the deal, and the deal stands.
// Binding is fixed at the vote, so expelling a signer never unbinds a card.
function catchRival(state, party, gained = 0) {
  const level = levelFor(state, party);
  for (const card of Object.keys(state.deal.signed)) {
    state.deal.signed[card] = state.deal.signed[card].filter((id) => id !== party);
  }
  if (!state.deal.expelled.includes(party)) state.deal.expelled.push(party);
  state.deal.suspicions = state.deal.suspicions.filter((s) => s.party !== party);
  if (gained > 0) {
    const rival = state.rivals.find((r) => r.id === party);
    rival.capability = clamp(rival.capability - gained, 0, 100);
  }
  state.publicTrust = clamp(state.publicTrust + CAUGHT_TRUST, 0, 100);
  return level;
}

function addSuspicion(state, party, real, gain = 0) {
  if (state.deal.suspicions.some((s) => s.party === party)) return null;
  const suspicion = { id: `s${state.deal.nextSuspicion}`, party, real, gain, day: state.day, dueAt: state.day + SUSPICION_DAYS };
  state.deal.nextSuspicion += 1;
  state.deal.suspicions.push(suspicion);
  return suspicion;
}

// Owner 2026-09-26, no dice: a check level decides each one-off outcome (a table value of one half or more is a yes);
// a rival's weekly urge to break and a false alarm add up week by week (sim/util.js accrue).
// With CATCH that means your break is always caught under outside testers or inspectors, never under trust or
// self-reports (spec section 4).
const sure = (table, level) => table[level] >= 0.5;

// Once a week after the summit: your own breaks may come out, then every signing rival may break the deal.
export function dealWeek(state) {
  if (!dealStands(state)) return [];
  const deal = state.deal;
  const events = [];

  const breaks = deal.playerBreaks;
  deal.playerBreaks = [];
  for (const card of breaks) {
    const level = deal.playerInspected ? CHECK_LEVELS.length - 1 : deal.checks[card] ?? DEFAULT_CHECK;
    if (!sure(CATCH, level)) continue;
    state.publicTrust = clamp(state.publicTrust - 8, 0, 100);
    state.govFavor.us = clamp(state.govFavor.us - 6, 0, 100);
    deal.collapsed = true;
    deal.suspicions = [];
    events.push({ type: 'playerCaught', card }, { type: 'dealCollapsed' });
    return events;
  }

  const leader = Math.max(state.capability, ...state.rivals.map((rival) => rival.capability));
  const verification = deal.binding.includes('verification');
  deal.breakPressure ??= {};
  deal.alarmPressure ??= {};
  const outcomes = signingRivals(state).map((party) => {
    const rival = state.rivals.find((r) => r.id === party);
    const level = levelFor(state, party);
    let chance = 0.15 + state.raceHeat / 200 + Math.max(0, leader - rival.capability) / 100
      + (rival.capability >= leader ? 0.1 : 0)
      + (deal.insulted[party] ? 0.1 : 0)
      - DETERRENCE * level;
    if (party === 'qilin' && verification) chance *= 0.3;
    return { party, level, broke: accrue(deal.breakPressure, party, clamp(chance, 0, 1)) };
  });
  deal.insulted = {};
  for (const { party, level, broke } of outcomes) {
    if (broke) {
      if (sure(CATCH, level)) {
        catchRival(state, party);
        events.push({ type: 'dealBreakCaught', party, how: 'checks', level });
        continue;
      }
      const rival = state.rivals.find((r) => r.id === party);
      const before = rival.capability;
      rival.capability = clamp(rival.capability + BREAK_GAIN, 0, 100);
      events.push({ type: 'defection', party, detected: false });
      if (sure(SIGN_SEEN, level)) {
        const suspicion = addSuspicion(state, party, true, rival.capability - before);
        if (suspicion) events.push({ type: 'dealSuspicion', party, id: suspicion.id, level });
      }
    } else if (accrue(deal.alarmPressure, party, FALSE_ALARM[level])) {
      const suspicion = addSuspicion(state, party, false);
      if (suspicion) events.push({ type: 'dealSuspicion', party, id: suspicion.id, level });
    }
  }
  return events;
}

// Look into a suspicion. The UI names it by level (accuse, demand the report, ask the testers, inspectors
// check); the rule is the same.
export function investigate(state, suspicionId) {
  if (!dealStands(state)) return { ok: false, error: 'there is no Geneva deal to enforce' };
  const suspicion = state.deal.suspicions.find((s) => s.id === suspicionId);
  if (!suspicion) return { ok: false, error: 'that suspicion has gone cold' };
  state.deal.suspicions = state.deal.suspicions.filter((s) => s.id !== suspicionId);
  const level = levelFor(state, suspicion.party);
  if (suspicion.real && sure(INVESTIGATE, level)) {
    catchRival(state, suspicion.party, suspicion.gain ?? BREAK_GAIN);
    return { ok: true, party: suspicion.party, found: true, level };
  }
  if (!suspicion.real) {
    state.deal.insulted[suspicion.party] = true;
    if (level === 0) state.publicTrust = clamp(state.publicTrust - FALSE_ACCUSATION_TRUST, 0, 100);
  }
  // A real break that slipped past the check leaves no insult: the lab knows why you looked.
  return { ok: true, party: suspicion.party, found: false, insulted: !suspicion.real, level };
}

export function expireSuspicions(state) {
  if (!state.deal?.suspicions?.length) return;
  state.deal.suspicions = state.deal.suspicions.filter((s) => s.dueAt > state.day);
}

// The player breaks the deal by doing what it forbids. The catch comes (or not) at the next weekly check.
export function playerBreak(state, card) {
  if (!dealBinds(state, card)) return;
  state.deal.playerShipped = true;
  state.deal.playerBreaks.push(card);
}
