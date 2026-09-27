import { CASES } from '../../sim/data/constitution.js';
import { EQUITY_SHARE, SUPPLIERS } from '../../sim/data/compute.js';
import { BALANCE } from '../../sim/balance.js';
import {
  contractAction,
  contractBill,
  deliverDue,
  exclusiveActive,
  monthlyBills,
  sideRng,
  signOffer,
} from '../../sim/contracts.js';
import {
  EMERGENCY_OPTIONS,
  projectBurn,
  raiseRound,
  runway,
  updateServing,
  useEmergency,
} from '../../sim/economy.js';
import { setConstitution, amendConstitution } from '../../sim/constitution.js';
import { addressWarning, fallbackChoice, resolveEvent } from '../../sim/events.js';
import { resolveHazard } from '../../sim/hazards.js';
import { setAutomation, applyApprovals } from '../../sim/automation.js';
import { buildSite, leaseMonthly, powerTurn, sitePower, SITE_TYPES } from '../../sim/power.js';
import { expireMeeting, meetingDue, openMeeting, runMeeting } from '../../sim/president.js';
import { allocate, placeOrder, PREPAY_SHARE, released, rivalOrders, withdrawOrder } from '../../sim/queue.js';
import { activateReleases, releaseModel } from '../../sim/release.js';
import { RIVAL_TEMPLATES, rivalSize } from '../../sim/rivals.js';
import { SIZES } from '../../sim/recipe.js';
import { createRng } from '../../sim/rng.js';
import { computeSlices, makePledge, setComputeSplit } from '../../sim/split.js';
import { TECHNIQUES, researchTechnique } from '../../sim/techniques.js';
import { startRun } from '../../sim/training.js';
import { MAX_MOVES, setBudget } from '../../sim/turn.js';
import { roundWord, storyDate } from '../../sim/time.js';
import { computeAmount, money, pct, roundsToWords, storyDayForTurn } from './format.js';
import { ifSignedFirst, plannedTakes, roundEndItems, playerSize, SIZE_LABEL } from './race.js';
import { eraEndWords } from './finance.js';

const OFFER_COPY = {
  verde: { per: 'your own chips' },
  azuria: { per: 'their data centers' },
  coreflame: { per: 'rented racks' },
  spot: { per: 'whatever is free' },
  azuriaEquity: { per: `for ${pct(EQUITY_SHARE)} of your lab` },
  gulf: { per: 'sovereign capacity' },
  loi: { per: 'headline capacity' },
};

const STRING_COPY = {
  null: ['No strings', 'Cheapest per unit. Slow, and you pay upfront.'],
  exclusive: ['Exclusive', 'No other cloud deals while it runs.'],
  fragile: ['Fragile', 'Runs on borrowed money. It can go under.'],
  bumpable: ['Can be taken back', 'Pulled first when chips run short.'],
  moneyBack: ['Money comes back', 'The credits only pay Azuria bills. The board loses some support.'],
  usGated: ['Needs US approval', 'Washington can pull the license.'],
  shrinks: ['Headline shrinks', 'Delivers 30 to 100% of the headline.'],
};

const price = (multiplier) => {
  if (multiplier === 1) return 'base';
  return `${Number(multiplier.toFixed(2))}× base`;
};

const arrival = (turns, era) => {
  if (turns === 0) return 'now';
  return `in ${roundsToWords(era, turns)}`;
};

function afterMove(state) {
  updateServing(state);
  state.burnPlanned = projectBurn(state);
}

function signedDealProjection(state, offer, deliveryRng = null) {
  const clone = structuredClone(state);
  const existing = new Set([
    ...clone.compute.contracts.map((contract) => contract.id),
    ...clone.compute.pipeline.map((contract) => contract.id),
  ]);
  const result = signOffer(clone, offer.id, sideRng(clone, 1));
  if (!result.ok) return { result, state: clone, contracts: [] };
  if (offer.supplier !== 'grid' && result.arrivesTurn > clone.turn) {
    while (clone.turn < result.arrivesTurn) {
      clone.turn += 1;
      powerTurn(clone);
      deliverDue(clone, clone.turn === result.arrivesTurn && deliveryRng
        ? deliveryRng : sideRng(clone, 6));
    }
  }
  afterMove(clone);
  return {
    result,
    state: clone,
    contracts: clone.compute.contracts.filter((contract) => !existing.has(contract.id)),
  };
}

function runwayAfterDeal(state, offer) {
  if (offer.supplier === 'loi') return null;
  const projection = signedDealProjection(state, offer);
  return projection.result.ok ? runway(projection.state, 'planned') : null;
}

export function applyDealMove(state, move) {
  return signOffer(state, move.offerId, createRng(0));
}

export function applyProjectedMove(state, move, queue) {
  if (move.type === 'startRun') return startRun(state, move.recipe);
  if (move.type === 'deal') return signOffer(state, move.offerId, sideRng(state, 1));
  if (move.type === 'queueOrder') return placeOrder(state, move);
  if (move.type === 'buildSite') return buildSite(state, move.source, sideRng(state, 1000 + state.power.nextId));
  if (move.type === 'raise') return raiseRound(state, move.archetype);
  if (move.type === 'research') return researchTechnique(state, move.techId);
  if (move.type === 'emergency') return useEmergency(state, move.option);
  if (move.type === 'amendConstitution') return amendConstitution(state, move.change);
  if (move.type === 'meeting') {
    if (!state.meeting) return { ok: false };
    const result = runMeeting(state, queue.presidentAnswers);
    return result.ok ? result : expireMeeting(state);
  }
  if (move.type === 'release') {
    const ending = state.ending;
    const result = releaseModel(state, move.release, createRng(0));
    state.ending = ending;
    return result;
  }
  return null;
}

function projectBeforeMoves(state, queue) {
  delete state.flags.emergencyUsedThisTurn;
  const meetingIdAtStart = state.meeting?.id ?? null;
  if (!meetingIdAtStart) {
    const id = meetingDue(state);
    if (id) state.meeting = openMeeting(state, id);
  }
  if (state.turn === 0 && queue.constitution) setConstitution(state, queue.constitution);
  if (state.turn === 0 && state.constitution.hardLines.length === 0) {
    setConstitution(state, {
      hardLines: ['no-wmd', 'honest', 'accept-shutdown'],
      rulings: Object.fromEntries(CASES.map((entry) => [entry.id, entry.options[0].id])),
    });
  }
  if (queue.budget) setBudget(state, queue.budget);
  if (Object.hasOwn(queue, 'computeSplit')) setComputeSplit(state, queue.computeSplit);
  if (Object.hasOwn(queue, 'automation')) setAutomation(state, queue.automation);
  if (typeof queue.aiAutoApprove === 'boolean') state.automation.autoApprove = queue.aiAutoApprove;
  applyApprovals(state, queue.aiApprovals ?? {});
  if (queue.pledge != null) makePledge(state, queue.pledge);
  for (const action of queue.contractActions ?? []) contractAction(state, action);
  if (queue.queueWithdraw === true) withdrawOrder(state);
  if (queue.hazardChoice && state.pendingModel?.hazard) resolveHazard(state, queue.hazardChoice);
  for (const id of queue.addressWarnings ?? []) addressWarning(state, id);

  const choices = queue.eventChoices ?? {};
  for (const pending of [...state.pendingEvents]) {
    if (Object.hasOwn(choices, pending.id)) resolveEvent(state, pending.id, choices[pending.id]);
  }
  for (const pending of [...state.pendingEvents]) {
    if (pending.dueAt == null) resolveEvent(state, pending.id, fallbackChoice(pending.id, pending));
  }
  activateReleases(state);
  afterMove(state);
  return meetingIdAtStart;
}

export function projectQueue(state, queue = {}) {
  const projected = structuredClone(state);
  if (projected.ending) return projected;
  const meetingIdAtStart = projectBeforeMoves(projected, queue);

  for (const move of (queue.moves ?? []).slice(0, MAX_MOVES)) {
    if (move.type === 'meeting' && !meetingIdAtStart) continue;
    const result = applyProjectedMove(projected, move, queue);
    if (!result?.ok) continue;
    afterMove(projected);
    if (projected.ending) break;
  }
  if (meetingIdAtStart && projected.meeting) {
    expireMeeting(projected);
    afterMove(projected);
  }
  return projected;
}

function rejectionReason(state, offer) {
  if (state.movesLeft === 0) return `Both team actions are used this ${roundWord(state.era)}`;
  if ((offer.supplier === 'coreflame' || offer.supplier === 'gulf') && exclusiveActive(state)) {
    return "Azuria's exclusive contract blocks CoreFlame and Gulf cloud deals until you buy it out";
  }
  if (offer.upfront > state.cash) return `Upfront is ${money(offer.upfront)}; you have ${money(state.cash)}.`;
  const clone = structuredClone(state);
  const result = signOffer(clone, offer.id, createRng(0));
  return result.ok ? '' : result.error;
}

function standardRows(offer, era) {
  return [
    ['Arrives', arrival(offer.arrivesIn, era)],
    ['Upfront', offer.upfront === 0 ? 'none' : money(offer.upfront)],
    ['Monthly', money(offer.monthly)],
    ['Term', offer.termMonths == null ? `renews each ${roundWord(era)}` : `${offer.termMonths} months`],
    ['Price', price(offer.price)],
  ];
}

function investmentRows(offer, era) {
  return [
    ['Arrives', arrival(offer.arrivesIn, era)],
    ['Upfront', offer.upfront ? money(offer.upfront) : 'none'],
    ['Units', computeAmount(offer.units, era)],
    ['Monthly', money(offer.monthly)],
    ['Term', `${offer.termMonths} months`],
  ];
}

function computeAmountParts(units, era) {
  const [big, ...unit] = computeAmount(units, era).split(' ');
  return { big, unit: unit.join(' ') };
}

const nameOf = (state, id) => state.rivals.find((r) => r.id === id)?.name ?? rivalName(id);

function fallbackLine(state, take) {
  if (!take) return '';
  const rival = nameOf(state, take.id);
  const instead = ifSignedFirst(state, take);
  return instead
    ? `If you sign it, ${rival} takes ${SUPPLIERS[instead.supplier].name}'s ${computeAmount(instead.units, state.era)}.`
    : `If you sign it, ${rival} goes without a board card this ${roundWord(state.era)}.`;
}

export function roundEndStrip(state) {
  const items = roundEndItems(state).map((item) => {
    const offer = state.compute.offers.find((o) => o.id === item.offerId);
    // The strip lists short fragments; the race tab's box keeps the full sentence.
    if (!offer) return { id: item.id, text: item.text.replace(/\.$/, '') };
    const later = offer.arrivesIn > 1 ? ` (arrives ${arrival(offer.arrivesIn, state.era)})` : '';
    return { id: item.id, text: `${item.name} +${computeAmount(offer.units, state.era)}${later}` };
  });
  return [...items, { id: 'rest', text: 'Cards nobody takes stay on the board' }];
}

export function dealCards(state) {
  const takes = plannedTakes(state);
  // A rival still on its first choice would move to this card if the player signed its named card.
  const onFirstChoice = state.rivals.filter((r) => r.named && takes.some((t) => t.id === r.id && t.offerId === r.named.offerId));
  return state.compute.offers
    .filter((offer) => !offer.viaQueue && offer.supplier !== 'grid')
    .map((offer) => {
      const supplier = SUPPLIERS[offer.supplier];
      const [chip, explanation] = STRING_COPY[String(offer.string)];
      const investment = offer.supplier === 'azuriaEquity';
      const reason = rejectionReason(state, offer);
      const take = takes.find((t) => t.offerId === offer.id) ?? null;
      const amount = investment
        ? { big: money(offer.credits), unit: '' }
        : computeAmountParts(offer.units, state.era);
      return {
        id: offer.id,
        supplier: offer.supplier,
        name: supplier.name,
        kind: supplier.kind,
        ...amount,
        per: OFFER_COPY[offer.supplier].per,
        rows: investment ? investmentRows(offer, state.era) : standardRows(offer, state.era),
        chip,
        // Raising from the strategic cloud partner marks up every rival cloud (sim/data/compute.js PARTNER_MARKUP).
        explanation: offer.partnerMarkup ? `${explanation} Your cloud partner's terms add ${pct(offer.partnerMarkup - 1)}.` : explanation,
        disabled: Boolean(reason),
        reason,
        viaQueue: false,
        move: { type: 'deal', offerId: offer.id },
        runwayAfter: reason ? null : runwayAfterDeal(state, offer),
        takenBy: take ? nameOf(state, take.id) : null,
        takenAsSecond: Boolean(take?.fallback),
        secondChoiceOf: take ? [] : onFirstChoice.filter((r) => r.named.fallback === offer.id).map((r) => r.name),
        fallbackLine: fallbackLine(state, take),
      };
    });
}

function runwayFor(state) {
  const clone = structuredClone(state);
  updateServing(clone);
  clone.burnPlanned = projectBurn(clone);
  return runway(clone, 'planned');
}

function commitmentRow(contract, state, isNew = false, offer = null) {
  const supplier = supplierName(contract.supplier);
  const monthsLeft = isNew
    ? `arrives ${arrival(Math.max(0, (contract.arrivedTurn ?? state.turn) - state.turn), state.era)}`
    : contract.monthsLeft == null ? `renews each ${roundWord(state.era)}` : `${Math.max(0, Math.ceil(contract.monthsLeft))} months left`;
  const powerShort = contract.needsPower && state.compute.unpowered > 0;
  const row = {
    id: contract.id,
    isNew,
    name: `${supplier}${isNew ? ' (new)' : ''}`,
    units: contract.units,
    bill: contractBill(contract),
    monthsLeft,
    canScaleDown: !isNew && !contract.scaledDown,
    canBuyout: !isNew && contract.supplier === 'azuria' && !contract.exclusiveBought,
    status: contract.dark
      ? 'License revoked · billing paused'
      : powerShort ? 'Unpowered · still billed' : contract.needsPower ? 'Needs site power' : '',
  };
  if (isNew && offer?.supplier === 'loi') {
    row.unitsRange = [Math.round(offer.units * 0.3), offer.units];
    row.billRange = row.unitsRange.map((units) => units * offer.price * BALANCE.unitMonthlyCost);
  }
  return row;
}

export function commitmentsView(state, offerId) {
  const billNow = monthlyBills(state);
  const rows = state.compute.contracts.map((contract) => commitmentRow(contract, state));
  const segments = state.compute.contracts
    .map((contract) => ({ id: contract.id, bill: contractBill(contract), isNew: false }))
    .filter((segment) => segment.bill > 0);
  const offer = state.compute.offers.find((candidate) => candidate.id === offerId);
  let billAfter = billNow;
  let billAfterRange = null;
  let afterFromTurn = state.turn;
  let runwayAfter = runwayFor(state);
  let runwayAfterRange = null;

  if (offer && !offer.viaQueue) {
    if (offer.supplier === 'loi') {
      const low = signedDealProjection(state, offer, { next: () => 0 });
      const high = signedDealProjection(state, offer, { next: () => 1 });
      if (low.result.ok && high.result.ok) {
        afterFromTurn = low.result.arrivesTurn;
        const lowBill = low.contracts.reduce((sum, contract) => sum + contractBill(contract), 0);
        const highBill = high.contracts.reduce((sum, contract) => sum + contractBill(contract), 0);
        billAfter = null;
        billAfterRange = [billNow + lowBill, billNow + highBill].sort((a, b) => a - b);
        runwayAfter = null;
        runwayAfterRange = [runway(low.state, 'planned'), runway(high.state, 'planned')].sort((a, b) => a - b);
        const contract = low.contracts[0];
        if (contract) {
          segments.push({
            id: contract.id,
            bill: (lowBill + highBill) / 2,
            billRange: [lowBill, highBill],
            isNew: true,
          });
          const row = commitmentRow(contract, low.state, true, offer);
          row.status = 'Needs site power';
          rows.push(row);
        }
      }
    } else {
      const projection = signedDealProjection(state, offer);
      if (projection.result.ok) {
        afterFromTurn = projection.result.arrivesTurn;
        runwayAfter = runway(projection.state, 'planned');
        for (const contract of projection.contracts) {
          const addedBill = contractBill(contract);
          billAfter += addedBill;
          segments.push({ id: contract.id, bill: addedBill, isNew: true });
          rows.push(commitmentRow(contract, projection.state, true, offer));
        }
      }
    }
  }

  return {
    billNow,
    billAfter,
    billAfterRange,
    afterFromTurn,
    afterDate: storyDate(storyDayForTurn(afterFromTurn)).label,
    segments,
    rows,
    runwayNow: runwayFor(state),
    runwayAfter,
    runwayAfterRange,
  };
}

export function queueView(state, draft = {}) {
  const supply = released(state);
  const units = Math.max(1, Math.min(supply, Math.round(draft.units ?? supply)));
  const tier = draft.tier === 'prepaid' ? 'prepaid' : 'standard';
  const rivals = rivalOrders(state);
  const outcome = allocate(supply, [...rivals, { lab: 'you', units, tier }]);
  const standard = allocate(supply, [...rivals, { lab: 'you', units, tier: 'standard' }]).you;
  const prepaid = allocate(supply, [...rivals, { lab: 'you', units, tier: 'prepaid' }]).you;
  const names = new Map(state.rivals.map((rival) => [rival.id, rival.name]));
  const rows = rivals.map((order) => ({
    ...order,
    name: names.get(order.lab) ?? rivalName(order.lab) ?? order.lab,
    ordered: order.units,
    got: outcome[order.lab] ?? 0,
  }));
  rows.splice(Math.min(1, rows.length), 0, {
    lab: 'you', name: 'You', tier, ordered: units, got: outcome.you ?? 0,
  });
  for (const rival of state.rivals.filter((candidate) => candidate.eastern)) {
    rows.push({ lab: rival.id, name: rival.name, tier: 'none', ordered: 0, got: 0 });
  }
  const announcements = state.rivals
    .filter((rival) => !rival.eastern && rival.prepayNext)
    .map((rival) => `${rival.name} will prepay next ${roundWord(state.era)}. Standard shares will shrink.`);
  const term = SUPPLIERS.verde.termMonths;
  const upfront = Math.round(PREPAY_SHARE * units * SUPPLIERS.verde.price * BALANCE.unitMonthlyCost * term);
  return { released: supply, rows, you: { standard, prepaid, upfront }, announcements };
}

export function queueTrainingView(state) {
  const slices = computeSlices(state);
  const need = state.activeRun?.units ?? Math.ceil(state.compute.online * 1.25);
  return {
    free: slices.training,
    need,
    short: Math.max(0, need - slices.training),
  };
}

export function queueOrderPreview(state, draft) {
  const projected = structuredClone(state);
  const result = placeOrder(projected, draft);
  return { ok: result.ok, reason: result.ok ? '' : result.error, projected };
}

export function replaceQueueOrder(moves, draft) {
  const index = moves.findIndex((move) => move.type === 'queueOrder');
  const replacement = { type: 'queueOrder', units: draft.units, tier: draft.tier };
  if (index < 0) return [...moves, replacement];
  return moves.flatMap((move, moveIndex) => {
    if (move.type !== 'queueOrder') return [move];
    return moveIndex === index ? [replacement] : [];
  });
}

export function queueOrderPreflight(state, queue, draft) {
  const moves = queue?.moves ?? [];
  const index = moves.findIndex((move) => move.type === 'queueOrder');
  const preceding = index < 0 ? moves : moves.slice(0, index);
  const beforeOrder = projectQueue(state, { ...queue, moves: preceding });
  return { ...queueOrderPreview(beforeOrder, draft), state: beforeOrder, index };
}

export const queueScreenAvailable = (state) => state.era === 3;
export const powerSitesAvailable = (state) => state.era === 4;

export function pledgeAvailable(state) {
  return state.era <= 2
    && !state.flags.safetyPledgeMade
    && !state.promises.some((promise) => promise.type === 'safetyCompute');
}

export function computeBar(state) {
  const slices = computeSlices(state);
  const training = Math.min(slices.training, slices.run);
  const segments = [
    { key: 'serving', units: slices.serving },
    { key: 'control', units: slices.control },
    { key: 'safety', units: slices.safety },
    { key: 'training', units: training },
    { key: 'idle', units: slices.idle },
  ];
  const pledge = state.promises.find((promise) => promise.type === 'safetyCompute');
  return {
    online: slices.online,
    segments,
    needMarker: slices.need,
    pledgeMarker: pledge ? { share: pledge.share, kept: state.compute.split.safety + 1e-9 >= pledge.share } : null,
  };
}

export function idleComputeCost(state) {
  const powered = poweredBilling(state);
  if (powered.units <= 0) return 0;
  const idle = computeBar(state).segments.find((segment) => segment.key === 'idle')?.units ?? 0;
  return idle * (powered.bill / powered.units);
}

function poweredBilling(state) {
  const live = state.compute.contracts.filter((contract) => !contract.dark);
  const own = live.filter((contract) => !contract.needsPower);
  const needs = live.filter((contract) => contract.needsPower);
  const ownUnits = own.reduce((sum, contract) => sum + contract.units, 0);
  const ownBill = own.reduce((sum, contract) => sum + contractBill(contract), 0);
  const needsUnits = needs.reduce((sum, contract) => sum + contract.units, 0);
  const poweredNeeds = Math.min(needsUnits, sitePower(state));
  const poweredShare = needsUnits > 0 ? poweredNeeds / needsUnits : 0;
  const needsBill = needs.reduce((sum, contract) => sum + contractBill(contract), 0) * poweredShare;
  return { units: ownUnits + poweredNeeds, bill: ownBill + needsBill };
}

const SITE_TAGS = {
  grid: ['Reserved in an earlier era'],
  gas: ['Public trust', 'Local opposition risk'],
  nuclear: ['Public trust', 'Half of restarts slip'],
};

export function sitesView(state) {
  const powerOnline = sitePower(state);
  const liveNeedingPower = state.compute.contracts.filter((contract) => contract.needsPower && !contract.dark);
  const chipsNeedingPower = liveNeedingPower.reduce((sum, contract) => sum + contract.units, 0);
  const unpowered = Math.max(0, chipsNeedingPower - powerOnline);
  let unitsLeft = unpowered;
  let unpoweredBill = 0;
  for (const contract of [...liveNeedingPower].sort((a, b) => b.price - a.price)) {
    const darkUnits = Math.min(unitsLeft, contract.units);
    unpoweredBill += darkUnits * contract.price * BALANCE.unitMonthlyCost;
    unitsLeft -= darkUnits;
  }
  // The day a site comes online: its landing day once stamped (sim/landings.js), else its old round mark.
  const landing = (site) => site.landsDay ?? storyDayForTurn(site.arrivesTurn);
  const pending = state.power.sites.filter((site) => !site.online).sort((a, b) => landing(a) - landing(b));
  const nextArrival = pending[0] ? {
    turn: pending[0].arrivesTurn,
    turns: Math.max(0, pending[0].arrivesTurn - state.turn),
    day: landing(pending[0]),
    units: pending[0].units,
    name: SITE_TYPES[pending[0].source]?.name ?? pending[0].source,
  } : null;
  const options = ['gas', 'nuclear'].map((source) => {
    const type = SITE_TYPES[source];
    const projected = structuredClone(state);
    const result = buildSite(projected, source, sideRng(projected, 1000 + projected.power.nextId));
    const site = result.ok ? projected.power.sites.find((candidate) => candidate.id === result.site) : null;
    const units = site?.units ?? Math.round((type.size[0] + type.size[1]) / 20) * 10;
    const turnsUntilReady = site ? site.arrivesTurn - state.turn : type.turns;
    const ready = roundsToWords(state.era, turnsUntilReady);
    const reason = result.ok ? '' : result.error;
    return {
      source,
      name: type.name,
      units,
      readyIn: ready,
      lease: leaseMonthly(units),
      tags: SITE_TAGS[source],
      disabled: Boolean(reason),
      reason,
    };
  });
  const gulfOffer = state.compute.offers.find((offer) => offer.supplier === 'gulf');
  const gulfUnits = gulfOffer?.units ?? SUPPLIERS.gulf.size[0] * 50;
  options.push({
    source: 'gulf',
    name: 'Gulf campus',
    units: gulfUnits,
    readyIn: gulfOffer ? roundsToWords(state.era, gulfOffer.arrivesIn) : 'approval required',
    lease: gulfOffer?.monthly ?? gulfUnits * BALANCE.unitMonthlyCost,
    tags: ['Needs US approval'],
    disabled: true,
    reason: gulfOffer ? 'Sign this sovereign capacity from compute deals.' : 'Locked. This site needs US government support.',
  });
  const sites = state.power.sites.map((site) => {
    const duration = SITE_TYPES[site.source]?.turns ?? Math.max(1, site.arrivesTurn - state.turn);
    const turnsLeft = Math.max(0, site.arrivesTurn - state.turn);
    return {
      id: site.id,
      name: SITE_TYPES[site.source]?.name ?? site.source,
      source: site.source,
      units: site.units,
      status: site.online
        ? `Online since ${storyDate(landing(site)).label}`
        : `Building · online ${storyDate(landing(site)).label}`,
      progress: site.online ? 1 : Math.max(0, Math.min(1, 1 - turnsLeft / duration)),
      warning: site.oppositionCut ? 'Local opposition cut this site\'s capacity.' : '',
    };
  });
  return { powerOnline, chipsNeedingPower, unpowered, unpoweredBill, nextArrival, options, sites };
}

const ADVISOR_NAMES = {
  research: 'Head of Research',
  safety: 'Head of Safety',
  cfo: 'CFO',
  policy: 'Policy and Comms',
};

function opinionText(state, screen, id) {
  const bar = computeBar(state);
  const sites = sitesView(state);
  const pledge = state.promises.find((promise) => promise.type === 'safetyCompute');
  const idle = bar.segments.find((segment) => segment.key === 'idle').units;
  const leader = state.rivals.reduce((a, b) => (b.capability > a.capability ? b : a));
  const ourSize = playerSize(state);
  // A copy: rivalSize must not change the rival it reads.
  const theirSize = rivalSize(state, { ...leader });
  const ours = SIZE_LABEL[ourSize];
  const theirs = SIZE_LABEL[theirSize];
  const leaderLarger = theirSize != null && SIZES.indexOf(theirSize) > (ourSize ? SIZES.indexOf(ourSize) : -1);
  const dealLines = {
    research: leaderLarger
      ? `${leader.name} can train ${theirs}; we can train ${ours ?? 'nothing yet'}. More compute closes that.`
      : 'More compute lets us train a larger model sooner.',
    safety: pledge ? `Our ${pct(pledge.share)} safety pledge grows with the fleet. Budget for it.` : 'More compute needs a matching safety allocation.',
    cfo: 'Take-or-pay: we pay every month, even if the chips sit idle.',
    policy: "Supplier terms can change who trusts the lab.",
  };
  const queueLines = {
    research: 'Prepaid orders are served before standard orders.',
    safety: `Whatever arrives, ${pct(state.compute.split.safety)} of it goes to safety.`,
    cfo: 'Prepaying ties up cash we may need before the next round.',
    policy: 'Prepaying looks like racing. Washington notices.',
  };
  const budgetLines = {
    research: idle > 0 ? `${computeAmount(idle, state.era)} sit idle. Start a bigger run, or sell the time.` : 'Training can use every unit left after serving and safety.',
    safety: pledge ? `${pct(state.compute.split.safety)} ${state.compute.split.safety >= pledge.share ? 'keeps' : 'breaks'} our ${pct(pledge.share)} pledge.` : 'A larger safety slice gives evaluations more room.',
    cfo: idle > 0 ? `Idle compute still costs ${money(idleComputeCost(state))} a month.` : 'Every online unit is doing useful work right now.',
    policy: bar.needMarker <= bar.segments.find((segment) => segment.key === 'serving').units ? 'Serving is covered. No outages right now.' : 'Serving is short. Users may see an outage.',
  };
  const powerLines = {
    research: sites.unpowered > 0 ? `${computeAmount(sites.unpowered, state.era)} of chips are sitting dark. We could be training on them.` : 'Every contracted chip has power.',
    safety: `More power means bigger runs. Keep the safety slice at ${pct(state.compute.split.safety)}.`,
    cfo: sites.unpowered > 0 ? `Unpowered chips still bill ${money(sites.unpoweredBill)} a month.` : 'No chip bill is wasted on unpowered capacity.',
    policy: 'Gas is fast, while nuclear restarts can slip and draw scrutiny.',
  };
  return ({ deals: dealLines, queue: queueLines, budget: budgetLines, power: powerLines }[screen] ?? dealLines)[id];
}

export function opinions(state, screen) {
  const readings = new Map((state.lastBriefing ?? []).map((reading) => [reading.id, reading]));
  return ['research', 'cfo', 'safety', 'policy'].map((id) => ({
    id,
    name: ADVISOR_NAMES[id],
    mood: readings.get(id)?.band ?? 'calm',
    text: opinionText(state, screen, id),
  }));
}

const supplierName = (id) => SUPPLIERS[id]?.name
  ?? ({ starter: 'Starter cloud', rescue: 'Rescue partner' }[id] ?? id);
const supplierFromOfferId = (offerId) => Object.keys(SUPPLIERS)
  .sort((a, b) => b.length - a.length)
  .find((id) => offerId?.startsWith(`${id}-`));
const rivalName = (id) => RIVAL_TEMPLATES.find((rival) => rival.id === id)?.name;
const techniqueName = (id) => TECHNIQUES.find((technique) => technique.id === id)?.name;

const EMERGENCY_SUMMARIES = {
  equityForCompute: 'You traded equity for cash and compute',
  structureChange: 'You changed the lab\'s corporate structure',
  bridgeRound: 'You took a bridge round to keep going',
  acquihire: 'You accepted an acquihire — the run is over',
};

export function turnSummary(events, state) {
  const list = Array.isArray(events) ? events : [];
  const lines = [];
  for (const event of list) {
    if (event.type === 'computeArrived') {
      const name = supplierName(event.supplier);
      lines.push(event.supplier === 'verde'
        ? `${name}'s chips arrived (${event.units} units)`
        : `${name}'s compute arrived (${event.units} units)`);
    } else if (event.type === 'deal') {
      const supplier = event.supplier
        ?? state?.compute?.offers?.find((offer) => offer.id === event.offerId)?.supplier
        ?? supplierFromOfferId(event.offerId);
      const subject = supplier ? `You signed with ${supplierName(supplier)}` : 'You signed a compute deal';
      const day = state?.compute?.pipeline?.find((p) => p.id === event.pipelineId && p.landsDay != null)?.landsDay
        ?? state?.power?.sites?.find((s) => s.id === event.site)?.landsDay // a grid reservation
        ?? (event.arrivesTurn <= (state?.turn ?? -1) ? state.day : storyDayForTurn(event.arrivesTurn)); // delivered at once
      lines.push(`${subject} — online from ${storyDate(day).label}`);
      if (event.denied) lines.push(`You took the card ${rivalName(event.denied)} wanted`);
    } else if (event.type === 'spotWarning') {
      lines.push(`Spot capacity may be pulled after next ${roundWord(state.era)}`);
    } else if (event.type === 'spotPulled') {
      lines.push('Spot capacity was pulled');
    } else if (event.type === 'contractEnded') {
      lines.push(`${supplierName(event.supplier)} contract ended`);
    } else if (event.type === 'queueFilled') {
      lines.push(event.waiting > 0 ? 'Verde filled part of your order; the rest stays queued' : 'Verde filled your queue order');
    } else if (event.type === 'queueOrder') {
      lines.push(`${event.tier === 'prepaid' ? 'Prepaid' : 'Standard'} Verde order placed`);
    } else if (event.type === 'rivalPrepays') {
      const name = rivalName(event.lab);
      if (name) lines.push(`${name} will prepay Verde for priority`);
    } else if (event.type === 'siteOnline') {
      lines.push(`${event.source === 'gas' ? 'Gas turbines' : event.source === 'nuclear' ? 'Nuclear restart' : 'Grid connection'} came online`);
    } else if (event.type === 'buildSite') {
      lines.push(`${event.source === 'gas' || event.site?.startsWith('gas-') ? 'Gas turbine' : 'Nuclear restart'} site construction started`);
    } else if (event.type === 'outage') {
      lines.push('Users reported an outage');
    } else if (event.type === 'pledgeBroken') {
      lines.push('The lab broke its public safety-compute pledge');
    } else if (event.type === 'raise') {
      lines.push(`You raised ${money(event.amount)}`);
    } else if (event.type === 'boardPromise') {
      lines.push(`You promised the board ${computeAmount(event.units, state ? Math.min(event.era, state.era) : event.era)} by ${state ? eraEndWords(state, event.era) : `the end of era ${event.era}`}`);
    } else if (event.type === 'boardPromiseJudged') {
      lines.push(event.ratio >= 1 ? 'You kept your compute promise to the board'
        : event.vote ? 'You missed your compute promise badly, and the board wants a vote'
          : 'You came up short of your compute promise to the board');
    } else if (event.type === 'staffLetter') {
      lines.push('Staff signed a letter to keep you, and the board backed down');
    } else if (event.type === 'research') {
      const name = techniqueName(event.techId);
      if (name) lines.push(`Your researchers cracked ${name}`);
    } else if (event.type === 'emergency') {
      if (Object.hasOwn(EMERGENCY_OPTIONS, event.option)) lines.push(EMERGENCY_SUMMARIES[event.option]);
    } else if (event.type === 'runComplete') {
      lines.push('Training complete — ready to release');
    } else if (event.type === 'runPaused') {
      lines.push('Training paused — not enough compute is online');
    } else if (event.type === 'rivalDeal') {
      const name = rivalName(event.id);
      if (name) lines.push(`${name} signed ${supplierName(event.supplier)}'s ${computeAmount(event.units, state?.era ?? 1)}${event.fallback ? ', its second choice' : ''}`);
    } else if (event.type === 'rivalRelease') {
      const name = rivalName(event.id);
      if (name) lines.push(`${name} released a model`);
    } else if (event.type === 'lawsuitPaid') {
      lines.push(`A lawsuit cost ${money(event.cost)}`);
    } else if (event.type === 'conversionFight') {
      lines.push('The structure change sparked a fight with staff and the board');
    } else if (event.type === 'eraStart') {
      lines.push(`Era ${event.era} begins`);
    } else if (event.type === 'error') {
      lines.push(`Couldn't do that: ${event.error}`);
    }
  }
  return lines;
}
