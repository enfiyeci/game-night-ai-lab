import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { clamp } from './util.js';
import { startRun, advanceRun } from './training.js';
import { activateReleases, releaseModel } from './release.js';
import {
  signOffer, contractAction, deliverDue, contractsTurn, expireContracts, pullBumped, spendCredits, generateOffers, monthlyBills, sideRng,
} from './contracts.js';
import { placeOrder, withdrawOrder, queueTurn } from './queue.js';
import { buildSite, leaseBills, powerTurn } from './power.js';
import { updateServing, growUsers, applyEconomy, legalTick, projectBurn, raiseRound, useEmergency, safetySpend } from './economy.js';
import { researchTechnique } from './techniques.js';
import { rivalsTurn } from './rivals.js';
import { boardSnapshot, holdVote, updateBoard } from './board.js';
import { judgeBoardPromise, makeBoardPromise } from './boardPromise.js';
import { checkTurnEndings, eraGate, finalEnding } from './endings.js';
import { recordAdvisors } from './advisors.js';
import { resolveHazard, exposeConcealed, INTERPRETABILITY_SPEND } from './hazards.js';
import { deployInternal, stopInternal, internalTick } from './internal.js';
import { addressWarning, resolveEvent, eventsTick, fallbackChoice, pushFeed } from './events.js';
import { CASES } from './data/constitution.js';
import { setConstitution, amendConstitution } from './constitution.js';
import {
  proposeSummit,
  holdOrShip,
  holdOrShipError,
  SUMMIT_SKIP_RACE_HEAT,
  SUMMIT_SKIP_US_FAVOR,
  SUMMIT_SKIP_INTL_FAVOR,
} from './summit.js';
import { expireMeeting, meetingDue, openMeeting, runMeeting } from './president.js';
import { judgeEndingPromises, promiseUpkeep } from './promises.js';
import { applySplitEffects, makePledge, setComputeSplit, spotCover } from './split.js';
import { feedPosts } from './feed.js';

export const MAX_MOVES = 2;
const BUDGET_KEYS = ['training', 'security', 'product', 'talent'];
// sideRng salts in sim/: 0 initial offers, 1 deals, 2 site opposition, 3 contracts, 4 queue,
// 5 offers, 6 deliveries, 7 pooling, and 1000 + site ID for builds.
const SITE_RNG_SALT_BASE = 1000;

export function setBudget(state, budget) {
  if (budget?.split && Object.hasOwn(budget.split, 'safety')) return { ok: false, error: 'the budget split has no safety slice: safety now runs on compute' };
  if (budget?.split && (typeof budget.split === 'object' || typeof budget.split === 'function')) {
    const unknown = Reflect.ownKeys(budget.split).find((key) => !BUDGET_KEYS.includes(key));
    if (unknown !== undefined) return { ok: false, error: `unknown budget split key ${String(unknown)}` };
  }
  const spend = budget?.spend;
  if (!Number.isFinite(spend) || spend < 0 || spend > 200) return { ok: false, error: 'spend must be between 0 and 200 $M per month' };
  const values = BUDGET_KEYS.map((k) => budget?.split?.[k]);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return { ok: false, error: 'budget split values must be finite and non-negative' };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 1) > 0.001) return { ok: false, error: 'the budget split must add up to 100%' };
  state.budget = { spend, split: Object.fromEntries(BUDGET_KEYS.map((k, i) => [k, values[i]])) };
  return { ok: true };
}

function applyMove(state, move, rng) {
  switch (move.type) {
    case 'startRun': return startRun(state, move.recipe);
    case 'release': return releaseModel(state, move.release, rng);
    case 'deal': return signOffer(state, move.offerId, sideRng(state, 1));
    case 'queueOrder': return placeOrder(state, move);
    case 'buildSite': return buildSite(state, move.source, sideRng(state, SITE_RNG_SALT_BASE + state.power.nextId));
    case 'raise': return raiseRound(state, move.archetype);
    case 'research': return researchTechnique(state, move.techId);
    case 'emergency': return useEmergency(state, move.option);
    case 'deployInternal': return deployInternal(state, move.control);
    case 'stopInternal': return stopInternal(state);
    case 'amendConstitution': return amendConstitution(state, move.change);
    case 'summit': return proposeSummit(state, move, rng);
    default: return { ok: false, error: `unknown move ${move.type}` };
  }
}

// Discretionary spend buys points each turn: $30M/month for a quarter ≈ 3 points.
function budgetEffects(state) {
  const { spend, split } = state.budget;
  const k = (spend * eraById(state.era).monthsPerTurn) / 30;
  if (state.activeRun) state.activeRun.bonus += split.training * k;
  state.security += split.security * k - 0.5;
  state.growthBoost = split.product * k * 0.02;
  state.researchPoints += split.talent * k * 3;
  state.staffTrust += split.talent * k * 0.3 - 0.3;
  if (safetySpend(state) >= INTERPRETABILITY_SPEND) exposeConcealed(state, 0.1);
}

function normalize(state) {
  for (const key of ['alignmentDebt', 'concealedDebt', 'misuseExposure', 'misuseLocked', 'security', 'raceHeat', 'publicTrust', 'staffTrust']) {
    state[key] = clamp(state[key], 0, 100);
  }
  state.perceivedAdOffset = clamp(state.perceivedAdOffset, 0, 100);
  state.govFavor.us = clamp(state.govFavor.us, 0, 100);
  state.govFavor.intl = clamp(state.govFavor.intl, 0, 100);
}

export function endTurn(prev, actions = {}, rng, observer = {}) {
  const state = structuredClone(prev);
  const events = [];
  const errors = [];
  const before = boardSnapshot(state);
  state.boardLast = [...prev.board];
  state.boardBefore = before;
  delete state.flags.emergencyUsedThisTurn;
  if (state.ending) return { state, events, errors: ['the run is over'] };
  if (state.turn === 0) {
    if (actions.constitution) {
      const result = setConstitution(state, actions.constitution);
      if (!result.ok) errors.push(result.error);
    }
    if (state.constitution.hardLines.length === 0) {
      setConstitution(state, {
        hardLines: ['no-wmd', 'honest', 'accept-shutdown'],
        rulings: Object.fromEntries(CASES.map((entry) => [entry.id, entry.options[0].id])),
      });
    }
  } else if (actions.constitution) errors.push('the constitution can only be set on turn 0');
  if (actions.boardPromise) {
    const r = makeBoardPromise(state, actions.boardPromise);
    if (r.ok) events.push({ type: 'boardPromise', units: r.units, era: r.era });
    else errors.push(r.error);
  }
  const moves = actions.moves ?? [];
  if (moves.length > MAX_MOVES) errors.push(`only ${MAX_MOVES} moves per turn`);
  const activeMoves = moves.slice(0, MAX_MOVES);
  const meetingIdAtStart = state.meeting?.id ?? null;
  if (!meetingIdAtStart) {
    if (activeMoves.some((move) => move.type === 'meeting') || Object.hasOwn(actions, 'presidentAnswers')) {
      errors.push('no open President meeting');
    }
    const id = meetingDue(state);
    if (id) {
      state.meeting = openMeeting(state, id);
      events.push({ type: 'meetingDue', id });
    }
  }
  if (actions.budget) {
    const r = setBudget(state, actions.budget);
    if (!r.ok) errors.push(r.error);
  }
  if (Object.hasOwn(actions, 'computeSplit')) {
    const r = setComputeSplit(state, actions.computeSplit);
    if (!r.ok) errors.push(r.error);
  }
  if (actions.pledge != null) {
    const r = makePledge(state, actions.pledge);
    if (!r.ok) errors.push(r.error);
  }
  for (const a of actions.contractActions ?? []) {
    const r = contractAction(state, a);
    if (!r.ok) errors.push(r.error);
  }
  if (Object.hasOwn(actions, 'queueWithdraw')) {
    if (typeof actions.queueWithdraw !== 'boolean') errors.push('queueWithdraw must be true or false');
    else if (actions.queueWithdraw) {
      const r = withdrawOrder(state);
      if (!r.ok) errors.push(r.error);
    }
  }
  if (actions.contractActions?.length) {
    updateServing(state);
    state.burnPlanned = projectBurn(state);
  }
  if (actions.hazardChoice && state.pendingModel?.hazard) {
    const r = resolveHazard(state, actions.hazardChoice);
    if (!r.ok) errors.push(r.error);
    else events.push({ type: 'hazardResolved', choice: actions.hazardChoice });
  }
  for (const id of actions.addressWarnings ?? []) {
    const result = addressWarning(state, id);
    if (!result.ok) errors.push(result.error);
  }
  const eventChoices = actions.eventChoices ?? {};
  const handledChoices = new Set();
  for (const pending of [...state.pendingEvents]) {
    const { id } = pending;
    const choiceKey = Object.hasOwn(eventChoices, id) ? id : null;
    if (!choiceKey) continue;
    const choiceId = eventChoices[choiceKey];
    const result = resolveEvent(state, id, choiceId);
    if (!result.ok) errors.push(result.error);
    handledChoices.add(choiceKey);
  }
  for (const id of Object.keys(eventChoices)) {
    if (handledChoices.has(id)) continue;
    const result = resolveEvent(state, id, eventChoices[id]);
    if (!result.ok) errors.push(result.error);
  }
  for (const pending of [...state.pendingEvents]) {
    const { id } = pending;
    const choiceId = fallbackChoice(id, pending);
    const result = resolveEvent(state, id, choiceId);
    if (!result.ok) errors.push(result.error);
    else events.push({ type: 'eventResolved', id, choiceId, auto: true });
  }
  if (state.era === 5 && state.deal && state.turnInEra > 0) {
    const choice = actions.holdOrShip ?? 'hold';
    const error = holdOrShipError(choice);
    if (error) errors.push(error);
    for (const event of holdOrShip(state, error ? 'hold' : choice, rng)) events.push(event);
  }

  activateReleases(state);
  updateServing(state);
  state.burnPlanned = projectBurn(state);

  for (const move of activeMoves) {
    if (move.type === 'meeting') {
      if (!meetingIdAtStart) continue;
      if (!state.meeting) {
        errors.push('no open President meeting');
        continue;
      }
      const id = state.meeting.id;
      const answerIds = Object.hasOwn(actions, 'presidentAnswers') ? actions.presidentAnswers : undefined;
      const result = runMeeting(state, answerIds);
      if (!result.ok) errors.push(result.error);
      const outcome = result.ok ? result.outcome : expireMeeting(state).outcome;
      events.push({ type: 'meetingOutcome', id, walkedOut: outcome.walkedOut, stake: outcome.stake });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
      continue;
    }
    const r = applyMove(state, move, rng);
    if (r.ok) {
      if (move.type === 'summit') events.push({ type: 'summit', signed: r.signed, binding: r.binding });
      else events.push({ type: move.type, ...r });
      if (r.hazardIgnored) events.push({ type: 'hazardResolved', choice: 'ignore', auto: true });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
    } else errors.push(r.error);
    if (state.ending) break;
  }

  if (meetingIdAtStart && state.meeting) {
    errors.push(Object.hasOwn(actions, 'presidentAnswers')
      ? 'President answers require a meeting move'
      : 'take the President meeting with a meeting move');
    const outcome = expireMeeting(state).outcome;
    events.push({ type: 'meetingOutcome', id: meetingIdAtStart, walkedOut: outcome.walkedOut, stake: outcome.stake });
  }

  if (!state.ending) {
    budgetEffects(state);
    for (const e of applySplitEffects(state)) {
      events.push(e);
      if (e.type === 'outage') pushFeed(state, '@downdetector', 'users report outages across your apps', 'feed');
    }
    for (const e of internalTick(state, rng)) events.push(e);
    if (!state.ending) {
      const trained = advanceRun(state, rng);
      if (trained?.type === 'runPaused') events.push(trained);
      else if (trained) events.push({ type: 'runComplete', gain: trained.gain });
      const c = contractsTurn(state, sideRng(state, 3));
      if (c.warnedBump) {
        events.push({ type: 'spotWarning' });
        pushFeed(state, '@marketwire', 'spot GPU capacity is being pulled for prepaid customers', 'warning');
      }
      for (const e of queueTurn(state, sideRng(state, 4))) {
        events.push(e);
        if (e.type === 'rivalPrepays') pushFeed(state, '@marketwire', `${state.rivals.find((r) => r.id === e.lab).name} prepays Verde for priority`, 'feed');
      }
      growUsers(state);
      updateServing(state);
      observer.beforeEconomy?.({
        era: state.era,
        burn: projectBurn(state),
        compute: monthlyBills(state) + leaseBills(state) + spotCover(state),
      });
      applyEconomy(state);
      if (state.compute.surge && --state.compute.surge.turnsLeft <= 0) {
        state.compute.split.coverWithSpot = state.compute.surge.restoreCover ?? state.compute.split.coverWithSpot;
        state.compute.surge = null;
      }
      spendCredits(state);
      for (const x of expireContracts(state)) events.push({ type: 'contractEnded', supplier: x.supplier, units: x.units });
      for (const x of pullBumped(state)) events.push({ type: 'spotPulled', units: x.units });
      if (state.flags.conversionDeadline != null && state.turn >= state.flags.conversionDeadline && !state.flags.converted) {
        state.flags.converted = true;
        state.board = state.board.map((support) => support - 6);
        state.publicTrust -= 4;
        state.staffTrust -= 6;
        events.push({ type: 'conversionFight' });
      }
      for (const c of legalTick(state)) events.push({ type: 'lawsuitPaid', cost: c.cost, source: c.source });
      state.lastRivalReleases = rivalsTurn(state, rng);
      for (const r of state.lastRivalReleases) events.push({ type: 'rivalRelease', ...r });
      state.raceHeat -= BALANCE.raceHeatDecay;
      promiseUpkeep(state, rng);
      for (const e of eventsTick(state, rng)) events.push(e);
      normalize(state);
      updateBoard(state, before, events);
      checkTurnEndings(state, rng);
      // Judged after this turn's endings, so a vote it calls is held next turn rather than beside the era gate's.
      const judged = state.ending ? null : judgeBoardPromise(state);
      if (judged) {
        events.push(judged);
        pushFeed(state, '@board_minutes', judged.ratio >= 1
          ? 'the board says the lab hit the compute it promised. nobody expected that.'
          : judged.vote ? 'the lab missed its compute promise by a mile. the board wants a vote.' : 'the lab came up short of its compute promise. the board took notes.', 'event');
        // Era 5's last turn is the run's last, so there is no next turn: the vote is held now.
        if (judged.vote && state.era === 5) {
          delete state.flags.boardVoteDue;
          if (!holdVote(state, 'promise').passed) state.ending = 'boardRemoved';
        }
      }
    }
  }

  if (!state.ending && state.era === 5 && state.turnInEra === 0 && !state.deal) {
    state.raceHeat += SUMMIT_SKIP_RACE_HEAT;
    state.govFavor.us -= SUMMIT_SKIP_US_FAVOR;
    state.govFavor.intl -= SUMMIT_SKIP_INTL_FAVOR;
    events.push({ type: 'summitSkipped' });
  }

  normalize(state);
  recordAdvisors(state, rng);
  const era = eraById(state.era);
  state.turn += 1;
  state.turnInEra += 1;
  state.monthsElapsed += era.monthsPerTurn;
  if (!state.ending && state.turnInEra >= era.turns) {
    eraGate(state);
    if (!state.ending) {
      if (state.era === 5) {
        if (state.flags.insolvent && state.cash <= 0) state.ending = 'acquihire';
        else finalEnding(state);
      }
      else {
        state.era += 1;
        state.turnInEra = 0;
        events.push({ type: 'eraStart', era: state.era });
      }
    }
  }
  if (!state.ending) {
    for (const e of powerTurn(state)) events.push(e);
    for (const x of deliverDue(state, sideRng(state, 6))) events.push({ type: 'computeArrived', supplier: x.supplier, units: x.units });
    state.compute.offers = generateOffers(state, sideRng(state, 5));
    updateServing(state);
    state.burnPlanned = projectBurn(state);
  }
  if (state.flags.staffLetterPending) {
    delete state.flags.staffLetterPending;
    events.push({ type: 'staffLetter' });
    pushFeed(state, '@leakwire', 'most of the lab signed a letter: reinstate the ceo or we walk. the board backed down.', 'event');
  }
  if (state.ending) {
    judgeEndingPromises(state);
    state.pendingEvents = state.pendingEvents.filter((pending) => pending.eventId !== 'promiseCall');
    for (const [id, warning] of Object.entries(state.warnings)) {
      if (warning.eventId === 'promiseCall') delete state.warnings[id];
    }
    events.push({ type: 'ending', ending: state.ending });
  }
  for (const post of feedPosts(prev, state, events)) {
    pushFeed(state, post.handle, post.text, post.tag);
  }
  return { state, events, errors };
}
