import { claimRivalFeatures } from './appeal.js';
import { PRODUCTS, waveProduct } from './data/products.js';
import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { clamp } from './util.js';
import { startRun, advanceRun, advanceRunBy, recheckCapacity } from './training.js';
import { advancePolishBy, applyFlawAction, notePolishLandings } from './polish.js';
import { activateReleases, releaseModel } from './release.js';
import {
  signOffer, contractAction, deliverDue, contractsTurn, expireContracts, pullBumped, spendCredits, creditOffset, refreshOffers, monthlyBills, sideRng,
} from './contracts.js';
import { placeOrder, withdrawOrder, queueTurn } from './queue.js';
import { buildSite, leaseBills, powerTurn } from './power.js';
import {
  updateServing, growUsers, applyEconomy, accrueEconomy, recordBurn, legalTick, projectBurn, raiseRound, useEmergency, safetySpend,
} from './economy.js';
import { researchTechnique } from './techniques.js';
import { rivalsTurn } from './rivals.js';
import { rivalDealsTurn, announceTargets } from './rivalDeals.js';
import { boardSnapshot, boardVoteThisRound, holdVote, updateBoard } from './board.js';
import { dealVerdictPost, judgeBoardDeals, makeBoardDeals } from './boardDeals.js';
import { boardRead } from './boardRead.js';
import { judgeBoardPromise, makeBoardPromise } from './boardPromise.js';
import { checkTurnEndings, eraGate, finalEnding } from './endings.js';
import { recordAdvisors } from './advisors.js';
import { resolveHazard, exposeConcealed, INTERPRETABILITY_SPEND } from './hazards.js';
import { addressWarning, resolveEvent, eventsTick, fallbackChoice, pushFeed, resolveDue, stampNewCards } from './events.js';
import { setDraft } from './constitution.js';
import {
  proposeSummit,
  dealWeek,
  dealBinds,
  investigate,
  expireSuspicions,
  playerBreak,
  SUMMIT_SKIP_RACE_HEAT,
  SUMMIT_SKIP_US_FAVOR,
  SUMMIT_SKIP_INTL_FAVOR,
} from './summit.js';
import { expireMeeting, meetingDue, openMeeting, runMeeting } from './president.js';
import { judgeEndingPromises, promiseUpkeep } from './promises.js';
import { applySplitEffects, makePledge, setComputeSplit, spotCover } from './split.js';
import { ROUND_DAYS, monthsPerDay } from './time.js';
import { TEAM_OF, teamBusyError } from './teams.js';
import { reactToEvents, reactToLandedCard, reactToRunStart, releaseDueFeed } from './feedLive.js';
import { setAutomation, automationTick, aiProposals, applyApprovals, reviewerCost } from './automation.js';
import { landDue, stampLandings } from './landings.js';

export const MAX_MOVES = 2;
const BUDGET_KEYS = ['training', 'security', 'product', 'talent'];
// sideRng salts in sim/: 0 initial offers, 1 deals, 2 site opposition, 3 contracts, 4 queue,
// 5 offers, 6 deliveries, 7 pooling, 8 board events (sim/data/boardEvents.js), 9 + card index for card landing days
// (sim/events.js stampNewCards), 900 AI proposals, 950 the first round's rival roll (sim/state.js), 1000 + site ID for builds,
// and 2000 + motion index for summit votes.
const SITE_RNG_SALT_BASE = 1000;
const AI_PROPOSAL_SALT = 900;

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
    case 'startRun': {
      const r = startRun(state, move.recipe);
      // Breaking the Geneva cap is a choice made when the run starts.
      if (r.ok && move.breakDeal === true && dealBinds(state, 'computeCap')) {
        state.activeRun.uncapped = true;
        playerBreak(state, 'computeCap');
        r.brokeDeal = 'computeCap';
      }
      return r;
    }
    case 'release': {
      const inGap = dealBinds(state, 'releaseDelay') && move.release?.breakDeal === true;
      const r = releaseModel(state, move.release, rng);
      if (r.ok && inGap && r.brokeGap) {
        playerBreak(state, 'releaseDelay');
        r.brokeDeal = 'releaseDelay';
      }
      return r;
    }
    case 'deal': return signOffer(state, move.offerId, sideRng(state, 1));
    case 'queueOrder': return placeOrder(state, move);
    case 'buildSite': return buildSite(state, move.source, sideRng(state, SITE_RNG_SALT_BASE + state.power.nextId));
    case 'raise': return raiseRound(state, move.archetype);
    case 'research': return researchTechnique(state, move.techId);
    case 'emergency': return useEmergency(state, move.option);
    case 'summit': return proposeSummit(state, move, rng);
    default: return { ok: false, error: `unknown move ${move.type}` };
  }
}

// Discretionary spend buys points each turn: $30M/month for a quarter ≈ 3 points.
function budgetEffects(state, fraction = 1) {
  const { spend, split } = state.budget;
  const k = (spend * eraById(state.era).monthsPerTurn) / 30;
  if (state.activeRun) state.activeRun.bonus += split.training * k * fraction;
  state.security += (split.security * k - 0.5) * fraction;
  state.growthBoost = split.product * k * 0.02;
  state.researchPoints += split.talent * k * 3 * fraction;
  state.staffTrust += (split.talent * k * 0.3 - 0.3) * fraction;
  if (safetySpend(state) >= INTERPRETABILITY_SPEND) exposeConcealed(state, 1 - 0.9 ** fraction);
}

function normalize(state) {
  for (const key of ['alignmentDebt', 'concealedDebt', 'misuseExposure', 'misuseLocked', 'security', 'raceHeat', 'publicTrust', 'staffTrust']) {
    state[key] = clamp(state[key], 0, 100);
  }
  state.perceivedAdOffset = clamp(state.perceivedAdOffset, 0, 100);
  state.govFavor.us = clamp(state.govFavor.us, 0, 100);
  state.govFavor.intl = clamp(state.govFavor.intl, 0, 100);
}

// Feed reactions to what just happened, scheduled over the coming story days (sim/feedLive.js).
// Reception, mood and background posts are time-based, so they are scheduled only at a round mark.
function postFeed(before, state, events, atMark) {
  reactToEvents(before, state, events, { atMark });
  releaseDueFeed(state);
}

// madeBefore: the round the run ended in; deals made in it never had a next meeting and stay open.
function finishEnding(state, events, madeBefore = state.turn) {
  for (const e of judgeBoardDeals(state, { final: true, madeBefore })) {
    events.push(e);
    pushFeed(state, '@board_minutes', dealVerdictPost(e.member, e.kept), 'event');
  }
  judgeEndingPromises(state);
  state.pendingEvents = []; // nothing can be answered once the run is over
  for (const [id, warning] of Object.entries(state.warnings)) {
    if (warning.eventId === 'promiseCall') delete state.warnings[id];
  }
  events.push({ type: 'ending', ending: state.ending });
}

// The AI's own moves; with "go ahead without asking" on, the player only hears about them afterwards.
function pushAiMoves(state, events, moves) {
  for (const e of moves) {
    events.push(e);
    if (state.automation.autoApprove) pushFeed(state, '@your_model', `went ahead without asking: ${e.id === 'lessLogs' ? 'sampled its own monitor logs less often' : 'ran experiments overnight'}`, 'feed');
  }
}

export function applyActions(prev, actions = {}, rng, { ignoreTeams = false } = {}) {
  const state = structuredClone(prev);
  const mood = { raceHeat: prev.raceHeat, publicTrust: prev.publicTrust };
  const events = [];
  const errors = [];
  if (state.ending) return { state, events, errors: ['the run is over'] };
  if (actions.constitutionDraft) {
    if (state.era < 3) errors.push('the constitution arrives in era 3');
    else {
      const result = setDraft(state, actions.constitutionDraft);
      if (!result.ok) errors.push(result.error);
    }
  }
  if (actions.constitution) errors.push(state.era >= 3 ? 'set the constitution in Safety’s draft' : 'the constitution arrives in era 3'); // OWNER WRITES
  if (actions.boardPromise) {
    const r = makeBoardPromise(state, actions.boardPromise);
    if (r.ok) events.push({ type: 'boardPromise', units: r.units, era: r.era });
    else errors.push(r.error);
  }
  // Deals are made in the board meeting, at once, and only in a round that holds a vote; the vote mark judges them.
  if (actions.boardDeals?.length) { // the UI may send an empty list
    const r = makeBoardDeals(state, actions.boardDeals);
    if (r.ok) events.push({ type: 'boardDeals', members: actions.boardDeals.map((deal) => deal.member) });
    else errors.push(r.error);
  }
  if (actions.budget) {
    const r = setBudget(state, actions.budget);
    if (!r.ok) errors.push(r.error);
  }
  if (Object.hasOwn(actions, 'computeSplit')) {
    const r = setComputeSplit(state, actions.computeSplit);
    if (!r.ok) errors.push(r.error);
  }
  if (Object.hasOwn(actions, 'automation')) {
    const r = setAutomation(state, actions.automation);
    if (!r.ok) errors.push(r.error);
  }
  if (Object.hasOwn(actions, 'aiAutoApprove')) {
    if (typeof actions.aiAutoApprove !== 'boolean') errors.push('aiAutoApprove must be true or false');
    else state.automation.autoApprove = actions.aiAutoApprove;
  }
  pushAiMoves(state, events, applyApprovals(state, actions.aiApprovals ?? {}));
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
  for (const action of actions.flawActions ?? []) {
    const r = applyFlawAction(state, action);
    if (!r.ok) errors.push(r.error);
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
    else events.push({ type: 'eventResolved', id, eventId: pending.eventId ?? id, choiceId, promiseId: pending.promiseId });
    handledChoices.add(choiceKey);
  }
  for (const id of Object.keys(eventChoices)) {
    if (handledChoices.has(id)) continue;
    const result = resolveEvent(state, id, eventChoices[id]);
    if (!result.ok) errors.push(result.error);
  }
  for (const id of actions.investigate ?? []) {
    const result = investigate(state, id, rng);
    if (!result.ok) errors.push(result.error);
    else events.push({ type: 'investigated', party: result.party, found: result.found, insulted: result.insulted === true, level: result.level });
  }

  activateReleases(state);
  updateServing(state);
  state.burnPlanned = projectBurn(state);

  for (const move of actions.moves ?? []) {
    if (state.round.moves >= MAX_MOVES) {
      errors.push(`only ${MAX_MOVES} actions per round`);
      break;
    }
    const busy = ignoreTeams ? null : teamBusyError(state, move);
    if (busy) {
      errors.push(busy);
      continue;
    }
    if (move.type === 'meeting') {
      if (!state.meeting) {
        errors.push('no open President meeting');
        continue;
      }
      const id = state.meeting.id;
      const answerIds = Object.hasOwn(actions, 'presidentAnswers') ? actions.presidentAnswers : undefined;
      const result = runMeeting(state, answerIds);
      if (!result.ok) errors.push(result.error);
      const outcome = result.ok ? result.outcome : expireMeeting(state).outcome;
      events.push({ type: 'meetingOutcome', id, walkedOut: outcome.walkedOut, stake: outcome.stake, ...(result.ok && { answers: [...answerIds] }) });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
      if (result.ok) {
        state.round.moves += 1;
        const team = TEAM_OF[move.type];
        if (team) state.round.teams[team] = move.type;
      }
      continue;
    }
    const r = applyMove(state, move, rng);
    if (r.ok) {
      if (move.type === 'release') r.model.releasedDay = state.day;
      if (move.type === 'summit') {
        events.push({ type: 'summit', signed: r.signed, binding: r.binding });
        for (const e of r.events) events.push(e);
      }
      else events.push({ type: move.type, ...r });
      if (r.brokeDeal) events.push({ type: 'playerBreak', card: r.brokeDeal });
      if (r.hazardIgnored) events.push({ type: 'hazardResolved', choice: 'ignore', auto: true });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
      state.round.moves += 1;
      const team = TEAM_OF[move.type];
      if (team) state.round.teams[team] = move.type;
    } else errors.push(r.error);
    if (state.ending) break;
  }

  activateReleases(state);
  updateServing(state);
  state.burnPlanned = projectBurn(state);
  // The safety chair hears about an ignored hazard at the round mark (updateBoard).
  if (events.some((e) => e.type === 'hazardResolved' && e.choice === 'ignore')) state.round.hazardIgnored = true;
  if (state.ending) {
    normalize(state);
    recordAdvisors(state, rng);
    finishEnding(state, events);
  }
  // A release that is not live yet gets its "announced" posts now and its launch posts when it goes live (sim/feedLive.js).
  if (events.length) postFeed(mood, state, events, false);
  stampLandings(state);
  recheckCapacity(state);
  return { state, events, errors };
}

function endRound(state, rng, observer, events, errors, trainingFraction = 0) {
  const roundTurn = state.turn;
  const votesAtStart = state.flags.boardVotesHeld ?? 0;
  // Deals from the last meeting are judged at this meeting's mark, before its vote (deals made this round wait).
  if (boardVoteThisRound(state)) {
    for (const e of judgeBoardDeals(state)) {
      events.push(e);
      pushFeed(state, '@board_minutes', dealVerdictPost(e.member, e.kept), 'event');
    }
  }
  const meetingIdAtStart = state.meeting?.id ?? null;
  if (!meetingIdAtStart) {
    const id = meetingDue(state);
    if (id) {
      state.meeting = openMeeting(state, id);
      events.push({ type: 'meetingDue', id });
    }
  }
  if (meetingIdAtStart && state.meeting) {
    errors.push('take the President meeting with a meeting move');
    const outcome = expireMeeting(state).outcome;
    events.push({ type: 'meetingOutcome', id: meetingIdAtStart, walkedOut: outcome.walkedOut, stake: outcome.stake });
  }

  if (state.era === 5 && state.deal && state.turnInEra > 0) {
    for (const event of dealWeek(state, rng)) events.push(event);
  }

  if (!state.ending) {
    for (const e of applySplitEffects(state)) {
      events.push(e);
      if (e.type === 'outage') pushFeed(state, '@downdetector', 'users report outages across your apps', 'feed');
    }
    for (const e of automationTick(state, rng)) events.push(e);
    if (!state.ending) {
      state.automation.proposals = aiProposals(state, sideRng(state, AI_PROPOSAL_SALT));
      if (state.automation.autoApprove) pushAiMoves(state, events, applyApprovals(state, {}));
      if (trainingFraction > 0) {
        const trained = advanceRunBy(state, rng, trainingFraction);
        if (trained?.type === 'runPaused') events.push(trained);
        else if (trained) events.push({ type: 'runComplete', gain: trained.gain });
      }
      const c = contractsTurn(state, sideRng(state, 3));
      if (c.warnedBump) {
        events.push({ type: 'spotWarning' });
        pushFeed(state, '@marketwire', 'spot GPU capacity is being pulled for prepaid customers', 'warning');
      }
      for (const e of queueTurn(state, sideRng(state, 4))) {
        events.push(e);
        if (e.type === 'rivalPrepays') pushFeed(state, '@marketwire', `${state.rivals.find((r) => r.id === e.lab).name} prepays Verde for priority`, 'feed');
      }
      growUsers(state, 0);
      updateServing(state);
      observer.beforeEconomy?.({
        era: state.era,
        burn: projectBurn(state),
        compute: monthlyBills(state) + leaseBills(state) + spotCover(state),
      });
      recordBurn(state);
      // The round's average monthly burn, day by day (the finance history reads it; burnHistory stays the mark's rate).
      state.lastRoundBurn = (state.roundBurnSum ?? 0) / eraById(state.era).monthsPerTurn;
      state.lastRoundPeople = (state.roundPeopleSum ?? 0) / eraById(state.era).monthsPerTurn; // its people part, averaged the same way
      state.roundBurnSum = 0;
      state.roundPeopleSum = 0;
      if (state.compute.surge && --state.compute.surge.turnsLeft <= 0) {
        state.compute.split.coverWithSpot = state.compute.surge.restoreCover ?? state.compute.split.coverWithSpot;
        state.compute.surge = null;
      }
      spendCredits(state, state.compute.creditsUsed ?? 0);
      state.compute.creditsUsed = 0;
      for (const x of pullBumped(state)) events.push({ type: 'spotPulled', units: x.units });
      if (state.flags.conversionDeadline != null && state.turn >= state.flags.conversionDeadline && !state.flags.converted) {
        state.flags.converted = true;
        state.board = state.board.map((support) => support - 6);
        state.publicTrust -= 4;
        state.staffTrust -= 6;
        events.push({ type: 'conversionFight' });
      }
      for (const c of legalTick(state)) events.push({ type: 'lawsuitPaid', cost: c.cost, source: c.source });
      for (const e of rivalDealsTurn(state)) events.push(e); // compute race: rivals take their named cards
      // Stage 2: the event cards read the launches that landed this round; the roll schedules next round's.
      state.lastRivalReleases = state.rivalLaunchesThisRound ?? [];
      state.rivalLaunchesThisRound = [];
      rivalsTurn(state, rng, { deferTo: state.turn + 1 });
      state.raceHeat -= BALANCE.raceHeatDecay;
      promiseUpkeep(state, rng);
      for (const e of eventsTick(state, rng)) events.push(e);
      normalize(state);
      // Compared with the round's start (taken at the last mark). A hazard ignored by an instant action this round
      // still costs the safety chair, as it did when the choice was part of the turn.
      const boardEvents = state.round.hazardIgnored ? [...events, { type: 'hazardResolved', choice: 'ignore' }] : events;
      updateBoard(state, { ...boardSnapshot(state), ...state.roundStart }, boardEvents);
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
  state.concealedDebt = Number(state.concealedDebt.toFixed(12));
  state.alignmentDebt = Number(state.alignmentDebt.toFixed(12));
  recordAdvisors(state, rng);
  const era = eraById(state.era);
  state.turn += 1;
  state.turnInEra += 1;
  state.monthsElapsed += era.monthsPerTurn;
  if (!state.ending && state.turnInEra >= era.turns) {
    eraGate(state, { voteHeld: (state.flags.boardVotesHeld ?? 0) > votesAtStart });
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
    state.compute.offers = refreshOffers(state, sideRng(state, 5));
    announceTargets(state);
    claimRivalFeatures(state);
    if (state.era < 5 && state.turnInEra === eraById(state.era).turns - 1) {
      pushFeed(state, '@marketwire', `The next wave is ${PRODUCTS[waveProduct(state.era + 1)].name.toLowerCase()}. Labs can start building one now.`, 'feed');
    }
    // A delayed release goes live at the round mark, action or not (the old turn did this first thing next turn).
    const waiting = state.models.filter((model) => model.active && !model.activated);
    activateReleases(state);
    for (const model of waiting) if (model.activated && model.active) events.push({ type: 'modelLive', model });
    updateServing(state);
    state.burnPlanned = projectBurn(state);
  }
  // The board at the round mark (spec §5.1): the read and L4 compare with the round just ended, never the last click.
  const start = state.roundStart ?? {};
  state.boardLast = start.board ? [...start.board] : [...state.board];
  state.boardBefore = { ...boardSnapshot(state), ...start };
  delete state.boardBefore.board;
  state.dayInRound = 0;
  state.round = { moves: 0, teams: {} };
  delete state.flags.emergencyUsedThisTurn;
  state.roundStart = {
    ...boardSnapshot(state), capability: state.capability, cash: state.cash, raceHeat: state.raceHeat, publicTrust: state.publicTrust,
    board: [...state.board],
  };
  // The board goes quiet in a close vote round (spec §5.4, P5): every band widens while the UI shows the quiet panel.
  if (!state.ending && boardVoteThisRound(state) && boardRead(state).tally.sure < BALANCE.boardPassMembers) {
    state.flags.boardQuiet = state.turn;
  }
  if (state.flags.staffLetterPending) {
    delete state.flags.staffLetterPending;
    events.push({ type: 'staffLetter' });
    pushFeed(state, '@leakwire', 'most of the lab signed a letter: reinstate the ceo or we walk. the board backed down.', 'event');
  }
  if (!state.ending) stampNewCards(state, rng);
  // A card made on the final mark can never be seen or answered.
  else state.pendingEvents = state.pendingEvents.filter((card) => card.landsAt != null);
  if (state.ending) {
    finishEnding(state, events, roundTurn);
  }
  if (!state.ending) stampLandings(state);
}

function postLandedCards(state) {
  for (const card of state.pendingEvents) {
    if (card.posted || card.landsAt == null || card.landsAt > state.day) continue;
    if (!card.post) {
      card.posted = true;
      continue;
    }
    pushFeed(state, card.post.handle, card.post.text, 'event');
    card.posted = true;
    reactToLandedCard(state, card);
  }
  releaseDueFeed(state); // the crowd's first reactions land the same day as the card
}

export function advanceDays(prev, days, rng, observer = {}) {
  const state = structuredClone(prev);
  const events = [];
  const errors = [];
  if (state.ending) return { state, events, errors: ['the run is over'] };
  if (state.day === 0 && state.era === 1 && days > 0) reactToRunStart(state);
  for (let i = 0; i < days && !state.ending; i += 1) {
    // Mood posts compare the whole round, start to mark, as the old turn did, so an instant action's shift is not lost.
    const mood = { raceHeat: state.roundStart.raceHeat ?? state.raceHeat, publicTrust: state.roundStart.publicTrust ?? state.publicTrust };
    const firstEvent = events.length;
    const fraction = 1 / ROUND_DAYS[state.era];
    const polishingModel = state.pendingModel;
    budgetEffects(state, fraction);
    const reachesMark = state.dayInRound + 1 >= ROUND_DAYS[state.era];
    if (!reachesMark) {
      const trained = advanceRunBy(state, rng, fraction);
      if (trained?.type === 'runPaused') {
        if (state.dayInRound === 0) events.push(trained);
      } else if (trained) events.push({ type: 'runComplete', gain: trained.gain });
    }
    growUsers(state, fraction, { round: false });
    updateServing(state);
    accrueEconomy(state, monthsPerDay(state));
    state.compute.creditsUsed = (state.compute.creditsUsed ?? 0) + creditOffset(state) * monthsPerDay(state);
    state.roundBurnSum = (state.roundBurnSum ?? 0) + state.burnPlanned * monthsPerDay(state); // the round's real spend
    state.roundPeopleSum = (state.roundPeopleSum ?? 0) + (state.budget.spend + reviewerCost(state)) * monthsPerDay(state);
    const ended = expireContracts(state, monthsPerDay(state));
    if (ended.length) {
      for (const x of ended) events.push({ type: 'contractEnded', supplier: x.supplier, units: x.units });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
    }
    state.day += 1;
    state.dayInRound += 1;
    // Training and polishing cannot spend the same story day on a model.
    if (state.pendingModel === polishingModel) {
      for (const e of advancePolishBy(state, fraction)) events.push(e);
    } else if (state.pendingModel?.polishing) {
      state.pendingModel.polishing.startedDay = state.day;
    }
    expireSuspicions(state);
    releaseDueFeed(state);
    postLandedCards(state);
    for (const e of resolveDue(state)) events.push(e);
    const landed = landDue(state);
    notePolishLandings(state, landed);
    if (landed.length) {
      events.push(...landed);
      updateServing(state);
      state.burnPlanned = projectBurn(state);
    }
    if (reachesMark) {
      endRound(state, rng, observer, events, errors, fraction);
      postLandedCards(state);
    }
    const dayEvents = events.slice(firstEvent);
    if (reachesMark || dayEvents.length) postFeed(mood, state, dayEvents, reachesMark);
  }
  if (state.ending) releaseDueFeed(state); // no later day comes, so nothing may stay queued
  return { state, events, errors };
}

export function endTurn(prev, actions = {}, rng, observer = {}) {
  const acted = applyActions(prev, actions, rng, { ignoreTeams: true });
  if (acted.state.ending) return acted;
  const left = ROUND_DAYS[acted.state.era] - acted.state.dayInRound;
  const moved = advanceDays(acted.state, left, rng, observer);
  return { state: moved.state, events: [...acted.events, ...moved.events], errors: [...acted.errors, ...moved.errors] };
}
