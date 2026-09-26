import { clamp } from './util.js';
import { RIVAL_TEMPLATES, leaderCapability } from './rivals.js';
import { exposeConcealed } from './hazards.js';
import { stopInternal } from './internal.js';

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

const SWEETENERS = Object.freeze({ research: true, evaluatorsFirst: true });
const HOLD_OR_SHIP = Object.freeze({ hold: true, ship: true });
const GOVERNMENTS = Object.freeze({
  west: { id: 'west', caution: 0.5 },
  east: { id: 'east', caution: 0.4 },
});

const hasBinding = (state, id) => state.deal?.collapsed === false && state.deal.binding.includes(id);

function partyById(state, id) {
  if (Object.hasOwn(GOVERNMENTS, id)) return GOVERNMENTS[id];
  return state.rivals.find((rival) => rival.id === id);
}

function gapBehind(state, party) {
  if (Object.hasOwn(GOVERNMENTS, party.id)) return 0;
  return Math.max(0, Math.max(state.capability, leaderCapability(state)) - party.capability);
}

function sweetenerBonus(commitmentId, sweetener) {
  if (sweetener === 'research') return commitmentId === 'sharedSafety' || commitmentId === 'verification' ? 0.15 : 0;
  if (sweetener === 'evaluatorsFirst') return 0.1 + (commitmentId === 'evaluators' ? 0.2 : 0);
  return 0;
}

function stance(state, commitmentId, partyId, sweetener, rng) {
  const party = partyById(state, partyId);
  let favor = 0;
  if (partyId === 'west') favor = (state.govFavor.us - 50) / 100;
  if (partyId === 'east') favor = (state.govFavor.intl - 50) / 100;
  return COMMITMENTS[commitmentId].base
    + (party.caution ?? 0.5)
    - gapBehind(state, party) / 100
    - state.raceHeat / 200
    + (state.publicTrust - 50) / 200
    + favor
    + sweetenerBonus(commitmentId, sweetener)
    + rng.normal(0, 0.1);
}

export function readTheRoom(state, rng) {
  return Object.fromEntries(Object.keys(COMMITMENTS).map((commitmentId) => [
    commitmentId,
    Object.fromEntries(PARTIES.map((partyId) => {
      const score = stance(state, commitmentId, partyId, null, rng);
      return [partyId, score > 0.6 ? 'likely' : score > 0.4 ? 'unsure' : 'unlikely'];
    })),
  ]));
}

function proposalError(state, move) {
  if (state.era !== 5 || state.turnInEra !== 0) return 'the summit only opens at the start of era 5';
  if (state.deal) return 'the summit has already happened';
  const proposals = move?.proposals;
  if (!Array.isArray(proposals) || proposals.length < 1 || proposals.length > 3) {
    return 'choose one to three summit proposals';
  }
  if (new Set(proposals).size !== proposals.length) return 'summit proposals cannot repeat';
  if (proposals.some((id) => typeof id !== 'string' || !Object.hasOwn(COMMITMENTS, id))) return 'unknown summit proposal';
  const sweetener = move.sweetener ?? null;
  if (sweetener !== null && (typeof sweetener !== 'string' || !Object.hasOwn(SWEETENERS, sweetener))) {
    return 'unknown summit sweetener';
  }
  if (sweetener === 'research' && state.cash < 50) return 'not enough cash for the research sweetener';
  return null;
}

export function proposeSummit(state, move, rng) {
  const error = proposalError(state, move);
  if (error) return { ok: false, error };
  const sweetener = move.sweetener ?? null;
  const signed = Object.fromEntries(Object.keys(COMMITMENTS).map((id) => [id, []]));
  for (const commitmentId of move.proposals) {
    signed[commitmentId] = PARTIES.filter((partyId) => stance(state, commitmentId, partyId, sweetener, rng) > 0.5);
  }
  if (move.proposals.includes('verification')
    && (!signed.verification.includes('west') || !signed.verification.includes('east'))) {
    signed.verification = [];
  }

  const labIds = new Set(state.rivals.map((rival) => rival.id));
  const binding = move.proposals.filter((commitmentId) => {
    const signers = signed[commitmentId];
    return signers.some((id) => labIds.has(id)) && signers.some((id) => id === 'west' || id === 'east');
  });
  state.deal = { signed, binding, trust: 2, collapsed: false, playerShipped: false };
  if (sweetener === 'research') state.cash -= 50;

  if (binding.includes('evaluators')) exposeConcealed(state, 0.5);
  if (binding.includes('sharedSafety')) {
    state.cash -= 40;
    state.alignmentDebt = clamp(state.alignmentDebt - 6, 0, 100);
    for (const rival of state.rivals) rival.caution = Math.min(1, rival.caution + 0.1);
  }
  if (binding.includes('pauseAutomation') && state.internal) stopInternal(state);
  state.raceHeat = clamp(state.raceHeat - 5 * binding.length, 0, 100);
  return { ok: true, signed, binding };
}

export function holdOrShipError(choice) {
  return typeof choice === 'string' && Object.hasOwn(HOLD_OR_SHIP, choice) ? null : 'unknown hold or ship choice';
}

const signingRivals = (state) => {
  const rivalIds = new Set(state.rivals.map((rival) => rival.id));
  const signers = new Set(Object.values(state.deal.signed).flat());
  return PARTIES.filter((id) => rivalIds.has(id) && signers.has(id));
};

const removeSigner = (state, partyId) => {
  for (const commitmentId of Object.keys(state.deal.signed)) {
    state.deal.signed[commitmentId] = state.deal.signed[commitmentId].filter((id) => id !== partyId);
  }
};

export function holdOrShip(state, choice, rng) {
  if (holdOrShipError(choice) || !state.deal || state.deal.collapsed) return [];
  const events = [];
  const evaluators = hasBinding(state, 'evaluators');
  const verification = hasBinding(state, 'verification');
  const capabilityByRival = Object.fromEntries(state.rivals.map((rival) => [rival.id, rival.capability]));
  const leader = Math.max(state.capability, ...Object.values(capabilityByRival));
  const raceHeat = state.raceHeat;
  const priorDefections = Math.max(0, 2 - state.deal.trust);
  const detectionChance = clamp(0.3 + (evaluators ? 0.4 : 0) + (verification ? 0.3 : 0), 0, 1);
  const rivalOutcomes = signingRivals(state).map((partyId) => {
    let chance = 0.15 + raceHeat / 200 + Math.max(0, leader - capabilityByRival[partyId]) / 100
      - (evaluators ? 0.1 : 0) + priorDefections * 0.1;
    if (partyId === 'qilin' && verification) chance *= 0.3;
    const defected = rng.chance(clamp(chance, 0, 1));
    return { partyId, defected, detected: defected && rng.chance(detectionChance) };
  });
  const playerDetected = choice === 'ship' && rng.chance(0.5 + (evaluators ? 0.4 : 0));

  for (const { partyId, defected, detected } of rivalOutcomes) {
    if (!defected) continue;
    const rival = state.rivals.find((candidate) => candidate.id === partyId);
    events.push({ type: 'defection', party: partyId, detected });
    removeSigner(state, partyId);
    if (!detected) {
      rival.capability = clamp(rival.capability + 6, 0, 100);
      continue;
    }
    state.deal.trust = Math.max(0, state.deal.trust - 1);
  }
  if (choice === 'ship') {
    state.capability = clamp(state.capability + 8, 0, 100);
    state.deal.playerShipped = true;
  }
  if (playerDetected) {
    state.publicTrust = clamp(state.publicTrust - 8, 0, 100);
    state.govFavor.us = clamp(state.govFavor.us - 6, 0, 100);
    events.push({ type: 'defection', party: 'player', detected: true });
  }
  if (playerDetected || state.deal.trust === 0) {
    state.deal.collapsed = true;
    events.push({ type: 'dealCollapsed' });
  }
  return events;
}
