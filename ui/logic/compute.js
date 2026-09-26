import { CASES } from '../../sim/data/constitution.js';
import { EQUITY_SHARE, SUPPLIERS } from '../../sim/data/compute.js';
import {
  contractAction,
  exclusiveActive,
  sideRng,
  signOffer,
} from '../../sim/contracts.js';
import {
  EMERGENCY_OPTIONS,
  projectBurn,
  raiseRound,
  updateServing,
  useEmergency,
} from '../../sim/economy.js';
import { setConstitution, amendConstitution } from '../../sim/constitution.js';
import { addressWarning, fallbackChoice, resolveEvent } from '../../sim/events.js';
import { resolveHazard } from '../../sim/hazards.js';
import { deployInternal, stopInternal } from '../../sim/internal.js';
import { buildSite } from '../../sim/power.js';
import { expireMeeting, meetingDue, openMeeting, runMeeting } from '../../sim/president.js';
import { placeOrder, withdrawOrder } from '../../sim/queue.js';
import { activateReleases, releaseModel } from '../../sim/release.js';
import { RIVAL_TEMPLATES } from '../../sim/rivals.js';
import { createRng } from '../../sim/rng.js';
import { makePledge, setComputeSplit } from '../../sim/split.js';
import { TECHNIQUES, researchTechnique } from '../../sim/techniques.js';
import { startRun } from '../../sim/training.js';
import { MAX_MOVES, setBudget } from '../../sim/turn.js';
import { computeAmount, money, pct } from './format.js';

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

const arrival = (turns) => {
  if (turns === 0) return 'now';
  if (turns === 1) return 'next turn';
  return `in ${turns} turns`;
};

function afterMove(state) {
  updateServing(state);
  state.burnPlanned = projectBurn(state);
}

function runwayAfterDeal(state, offer) {
  const clone = structuredClone(state);
  const result = applyDealMove(clone, { type: 'deal', offerId: offer.id });
  if (!result.ok) return null;
  afterMove(clone);
  const fullBurn = clone.burnPlanned + (offer.arrivesIn === 0 ? 0 : offer.monthly);
  const net = fullBurn - clone.arr / 12;
  return net <= 0 ? Infinity : clone.cash / net;
}

export function applyDealMove(state, move) {
  return signOffer(state, move.offerId, createRng(0));
}

function applyProjectedMove(state, move, queue) {
  if (move.type === 'startRun') return startRun(state, move.recipe);
  if (move.type === 'deal') return signOffer(state, move.offerId, sideRng(state, 1));
  if (move.type === 'queueOrder') return placeOrder(state, move);
  if (move.type === 'buildSite') return buildSite(state, move.source, sideRng(state, 1000 + state.power.nextId));
  if (move.type === 'raise') return raiseRound(state, move.archetype);
  if (move.type === 'research') return researchTechnique(state, move.techId);
  if (move.type === 'emergency') return useEmergency(state, move.option);
  if (move.type === 'deployInternal') return deployInternal(state, move.control);
  if (move.type === 'stopInternal') return stopInternal(state);
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
    resolveEvent(state, pending.id, fallbackChoice(pending.id, pending));
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
  if (state.movesLeft === 0) return 'Both moves are used this turn';
  if ((offer.supplier === 'coreflame' || offer.supplier === 'gulf') && exclusiveActive(state)) {
    return "Azuria's exclusive contract blocks CoreFlame and Gulf cloud deals until you buy it out";
  }
  if (offer.upfront > state.cash) return 'Not enough cash for the upfront payment';
  const clone = structuredClone(state);
  const result = signOffer(clone, offer.id, createRng(0));
  return result.ok ? '' : result.error;
}

function standardRows(offer) {
  return [
    ['Arrives', arrival(offer.arrivesIn)],
    ['Upfront', offer.upfront === 0 ? 'none' : money(offer.upfront)],
    ['Monthly', money(offer.monthly)],
    ['Term', offer.termMonths == null ? 'renews each turn' : `${offer.termMonths} months`],
    ['Price', price(offer.price)],
  ];
}

function investmentRows(offer, era) {
  return [
    ['Arrives', arrival(offer.arrivesIn)],
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

export function dealCards(state) {
  return state.compute.offers
    .filter((offer) => !offer.viaQueue && offer.supplier !== 'grid')
    .map((offer) => {
      const supplier = SUPPLIERS[offer.supplier];
      const [chip, explanation] = STRING_COPY[String(offer.string)];
      const investment = offer.supplier === 'azuriaEquity';
      const reason = rejectionReason(state, offer);
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
        rows: investment ? investmentRows(offer, state.era) : standardRows(offer),
        chip,
        explanation,
        disabled: Boolean(reason),
        reason,
        viaQueue: false,
        move: { type: 'deal', offerId: offer.id },
        runwayAfter: reason ? null : runwayAfterDeal(state, offer),
      };
    });
}

const supplierName = (id) => SUPPLIERS[id]?.name ?? (id === 'rescue' ? 'Rescue partner' : id);
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
      lines.push(`${subject} — online from turn ${event.arrivesTurn}`);
    } else if (event.type === 'spotWarning') {
      lines.push('Spot capacity may be pulled after next turn');
    } else if (event.type === 'spotPulled') {
      lines.push('Spot capacity was pulled');
    } else if (event.type === 'contractEnded') {
      lines.push(`${supplierName(event.supplier)} contract ended`);
    } else if (event.type === 'queueFilled') {
      lines.push(event.waiting > 0 ? 'Verde filled part of your order; the rest stays queued' : 'Verde filled your queue order');
    } else if (event.type === 'rivalPrepays') {
      const name = rivalName(event.lab);
      if (name) lines.push(`${name} will prepay Verde for priority`);
    } else if (event.type === 'siteOnline') {
      lines.push(`${event.source === 'gas' ? 'Gas turbines' : event.source === 'nuclear' ? 'Nuclear restart' : 'Grid connection'} came online`);
    } else if (event.type === 'outage') {
      lines.push('Users reported an outage');
    } else if (event.type === 'pledgeBroken') {
      lines.push('The lab broke its public safety-compute pledge');
    } else if (event.type === 'raise') {
      lines.push(`You raised ${money(event.amount)}`);
    } else if (event.type === 'research') {
      const name = techniqueName(event.techId);
      if (name) lines.push(`Your researchers cracked ${name}`);
    } else if (event.type === 'emergency') {
      if (Object.hasOwn(EMERGENCY_OPTIONS, event.option)) lines.push(EMERGENCY_SUMMARIES[event.option]);
    } else if (event.type === 'runComplete') {
      lines.push('Training complete — ready to release');
    } else if (event.type === 'runPaused') {
      lines.push('Training paused — not enough compute is online');
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
