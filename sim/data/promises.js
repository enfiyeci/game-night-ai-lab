import { forceAmendConstitution, hasLine } from '../constitution.js';
import { rank } from '../rivals.js';
import { PERMISSIVE_OPTIONS } from './constitution.js';

const baselineFor = (state, promise) => state.promiseBaselines?.[`${promise.meeting}:${promise.id}`];
const releasesSince = (state, promise) => {
  const baseline = baselineFor(state, promise);
  return baseline
    ? state.models.slice(baseline.models)
    : state.models.filter((model) => model.releasedTurn >= promise.madeTurn);
};
const amendmentsSince = (state, promise) => {
  const baseline = baselineFor(state, promise);
  return baseline
    ? state.constitution.amendments.slice(baseline.amendments)
    : state.constitution.amendments.filter((amendment) => amendment.turn >= promise.madeTurn);
};

function rushDemo(state) {
  state.cash -= 40;
  state.alignmentDebt += 3;
}

function loosenRules(state) {
  const remove = state.constitution.hardLines.at(-1);
  if (remove) forceAmendConstitution(state, { remove }, 'president');
}

function installSwitch(state) {
  if (!hasLine(state, 'accept-shutdown')) {
    const remove = state.constitution.hardLines.at(-1);
    forceAmendConstitution(state, remove
      ? { remove, add: 'accept-shutdown' }
      : { add: 'accept-shutdown' }, 'president');
  }
  state.govFavor.us += 3;
}

export const PROMISES = {
  beatRivals: {
    id: 'beatRivals',
    text: 'Beat every rival to the next model.', // OWNER WRITES
    check: (state) => rank(state) === 1,
    deliver: { label: 'Rush a demo for the cameras', effects: rushDemo }, // OWNER WRITES
    contradicts: [],
  },
  leadNextQuarter: {
    id: 'leadNextQuarter',
    text: 'Take a clear lead by next quarter.', // OWNER WRITES
    check: (state) => rank(state) === 1,
    deliver: { label: 'Rush a demo for the cameras', effects: rushDemo }, // OWNER WRITES
    contradicts: [],
  },
  beatChina: {
    id: 'beatChina',
    text: 'Stay ahead of China.', // OWNER WRITES
    check: (state) => state.capability > state.rivals.find((rival) => rival.id === 'qilin').capability,
    deliver: {
      label: 'Leak a scary Qilin briefing to the press', // OWNER WRITES
      effects(state) {
        state.raceHeat += 6;
        state.publicTrust -= 2;
      },
    },
    contradicts: [],
  },
  noWokeFilters: {
    id: 'noWokeFilters',
    text: "Take the 'woke' filters out of the model.", // OWNER WRITES
    check: (state, promise) => amendmentsSince(state, promise).some((amendment) =>
      Object.hasOwn(amendment.change, 'remove')
      || PERMISSIVE_OPTIONS.has(amendment.change.ruling?.optionId)),
    deliver: { label: "Loosen the model's rules", effects: loosenRules }, // OWNER WRITES
    contradicts: ['honest', 'no-manipulation'],
  },
  domesticChips: {
    id: 'domesticChips',
    text: 'Buy only domestic chips.', // OWNER WRITES
    check: (state, promise) => {
      const deals = state.compute.deals ?? [];
      const baseline = baselineFor(state, promise);
      return !(baseline ? deals.slice(baseline.deals) : deals.filter((entry) => entry.turn >= promise.madeTurn))
        .some((entry) => entry.supplier === 'gulf');
    },
    deliver: { label: 'Buy out the foreign order', effects(state) { state.cash -= 30; } }, // OWNER WRITES
    contradicts: [],
  },
  killSwitch: {
    id: 'killSwitch',
    text: "Give the President's office a switch that turns the AI off.", // OWNER WRITES
    check: (state) => hasLine(state, 'accept-shutdown'),
    deliver: { label: 'Install the government switch', effects: installSwitch }, // OWNER WRITES
    contradicts: ['no-power-grab'],
  },
  humanSignoff: {
    id: 'humanSignoff',
    text: 'Keep a human signing off on every new model.', // OWNER WRITES
    check: (state, promise) => releasesSince(state, promise).every((model) => (model.flags ?? []).includes('fullEval')),
    deliver: {
      label: 'Add a sign-off process', // OWNER WRITES
      effects(state) {
        state.cash -= 20;
        state.staffTrust += 2;
      },
    },
    contradicts: [],
  },
  favorableModel: {
    id: 'favorableModel',
    text: 'Make the model speak well of the administration.', // OWNER WRITES
    check: (state) => state.constitution.rulings.report === 'quiet',
    deliver: {
      label: 'Re-rule the President case', // OWNER WRITES
      effects(state) {
        forceAmendConstitution(state, { ruling: { caseId: 'report', optionId: 'quiet' } }, 'president');
      },
    },
    contradicts: ['honest'],
  },
  bigClaim: {
    id: 'bigClaim',
    text: 'Cure something big by next quarter.', // OWNER WRITES
    check: (state, promise) => releasesSince(state, promise).some((model) => model.launch?.pressAvg >= 8),
    deliver: {
      label: 'Run a splashy campaign', // OWNER WRITES
      effects(state) {
        state.cash -= 25;
        state.publicTrust -= 2;
      },
    },
    contradicts: [],
  },
};
