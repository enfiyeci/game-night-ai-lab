import { BALANCE } from '../../sim/balance.js';
import { BOTTLENECK_DELAY, SUPPLIERS } from '../../sim/compute.js';
import { eraById } from '../../sim/data/eras.js';
import { EMERGENCY_OPTIONS } from '../../sim/economy.js';
import { RIVAL_TEMPLATES } from '../../sim/rivals.js';
import { TECHNIQUES } from '../../sim/techniques.js';
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
    chip: 'Exclusive',
    explanation: 'No other cloud deals while it runs.',
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
  return `in ${turns} turn${turns === 1 ? '' : 's'}`;
};

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

function dealSupplier(event, events, state) {
  if (event.supplier ?? event.supplierId) return event.supplier ?? event.supplierId;
  const queued = state?.compute?.pipeline?.find((deal) => deal.arrivesTurn === event.arrivesTurn);
  if (queued) return queued.supplier;
  return events.find((candidate) => candidate.type === 'computeArrived')?.supplier;
}

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
      const id = dealSupplier(event, list, state);
      const visibleTurn = Math.max(event.arrivesTurn, state?.turn ?? event.arrivesTurn);
      if (id) lines.push(`You signed with ${supplierName(id)} — chips arrive on turn ${visibleTurn}`);
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
