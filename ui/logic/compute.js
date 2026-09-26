import { BALANCE } from '../../sim/balance.js';
import { BOTTLENECK_DELAY, SUPPLIERS, signDeal } from '../../sim/compute.js';
import { eraById } from '../../sim/data/eras.js';
import {
  EMERGENCY_OPTIONS,
  projectBurn,
  raiseRound,
  runway,
  updateServing,
  useEmergency,
} from '../../sim/economy.js';
import { activateReleases, releaseModel } from '../../sim/release.js';
import { RIVAL_TEMPLATES } from '../../sim/rivals.js';
import { createRng } from '../../sim/rng.js';
import { TECHNIQUES, researchTechnique } from '../../sim/techniques.js';
import { startRun } from '../../sim/training.js';
import { MAX_MOVES, setBudget } from '../../sim/turn.js';
import { money } from './format.js';

const SUPPLIER_COPY = {
  verde: {
    name: 'Verde',
    kind: 'chip order',
    per: 'your own chips',
    chip: 'No strings',
    explanation: 'Cheapest per unit. Slow, and you pay upfront.',
  },
  azuria: {
    name: 'Azuria',
    kind: 'cloud',
    per: 'reserved capacity',
    chip: 'Pricier',
    explanation: 'A quarter more per unit, but nothing upfront.',
  },
  coreflame: {
    name: 'CoreFlame',
    kind: 'neocloud',
    per: 'rented racks',
    chip: 'Fragile',
    explanation: 'Runs on borrowed money. It can go under.',
  },
  gulf: {
    name: 'Gulf campus',
    kind: 'sovereign',
    per: 'sovereign capacity',
    chip: 'Costs goodwill',
    explanation: 'Washington and the public will notice.',
  },
};

const price = (multiplier) => {
  if (multiplier === 1) return 'base';
  return `${Number(multiplier.toFixed(2))}× base`;
};

const arrival = (turns) => {
  if (turns === 0) return 'next turn';
  return `in ${turns + 1} turns`;
};

function runwayAfterDeal(state, supplierId) {
  const clone = structuredClone(state);
  const result = applyDealMove(clone, { type: 'deal', supplierId });
  if (!result.ok) return null;
  updateServing(clone);
  clone.burnPlanned = projectBurn(clone);
  return runway(clone, 'planned');
}

export function applyDealMove(state, move) {
  return signDeal(state, move.supplierId);
}

function applyProjectedMove(state, move) {
  if (move.type === 'startRun') return startRun(state, move.recipe);
  if (move.type === 'deal') return applyDealMove(state, move);
  if (move.type === 'raise') return raiseRound(state, move.archetype);
  if (move.type === 'research') return researchTechnique(state, move.techId);
  if (move.type === 'emergency') return useEmergency(state, move.option);
  // The release's cost is fixed; its random draws only score the press, so a throwaway stream will do.
  if (move.type === 'release') return releaseModel(state, move.release, createRng(0));
  return null;
}

export function projectQueue(state, queue = {}) {
  const projected = structuredClone(state);
  if (projected.ending) return projected;
  // The same start-of-turn steps as sim/turn.js endTurn, so burn and the danger zone match what it sees.
  delete projected.flags.emergencyUsedThisTurn;
  activateReleases(projected);
  updateServing(projected);
  projected.burnPlanned = projectBurn(projected);
  if (queue.budget) {
    const result = setBudget(projected, queue.budget);
    if (result.ok) projected.burnPlanned = projectBurn(projected);
  }

  for (const move of (queue.moves ?? []).slice(0, MAX_MOVES)) {
    const result = applyProjectedMove(projected, move);
    if (!result?.ok) continue;
    updateServing(projected);
    projected.burnPlanned = projectBurn(projected);
    if (projected.ending) break;
  }
  return projected;
}

export function dealCards(state) {
  const bottleneckDelay = BOTTLENECK_DELAY[eraById(state.era).bottleneck];
  return SUPPLIERS.map((supplier) => {
    const copy = SUPPLIER_COPY[supplier.id];
    const monthly = supplier.units * supplier.costMult * BALANCE.unitMonthlyCost;
    const upfront = monthly * supplier.prepayMonths;
    const noMoves = state.movesLeft === 0;
    const shortOnCash = upfront > state.cash;
    return {
      id: supplier.id,
      supplier: supplier.id,
      name: copy.name,
      kind: copy.kind,
      big: supplier.units,
      unit: 'units',
      per: copy.per,
      rows: [
        ['Arrives', arrival(supplier.delay + bottleneckDelay)],
        ['Upfront', upfront === 0 ? 'none' : money(upfront)],
        ['Monthly', money(monthly)],
        ['Price', price(supplier.costMult)],
      ],
      chip: copy.chip,
      explanation: copy.explanation,
      disabled: noMoves || shortOnCash,
      reason: noMoves
        ? 'Both moves are used this turn'
        : shortOnCash ? 'Not enough cash for the prepayment' : '',
      viaQueue: false,
      move: { type: 'deal', supplierId: supplier.id },
      runwayAfter: runwayAfterDeal(state, supplier.id),
    };
  });
}

const supplierName = (id) => SUPPLIER_COPY[id]?.name ?? id;
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
    } else if (event.type === 'computeFailed') {
      lines.push(`${supplierName(event.supplier)} went under — ${event.units} units lost`);
    } else if (event.type === 'deal') {
      const id = event.supplier ?? event.supplierId;
      const subject = id ? `You signed with ${supplierName(id)}` : 'You signed a compute deal';
      const onlineTurn = event.arrivesTurn + 1;
      lines.push(state?.turn >= onlineTurn
        ? `${subject} — the compute is already online`
        : `${subject} — online from turn ${onlineTurn}`);
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
