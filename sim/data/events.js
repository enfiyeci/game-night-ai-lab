import { addMonitor, handBack, lockDown } from '../automation.js';
import { changeDraft, draftFor, hasConstitution, hasLine } from '../constitution.js';
import { contractBill, refreshOnline, sideRng } from '../contracts.js';
import { leaseMonthly } from '../power.js';
import { activeModels } from '../serving.js';
import { clamp } from '../util.js';
import { ERAS } from './eras.js';
import { RESCUE_MONTHS, spotPrice } from './compute.js';
import { DEMANDS } from './constitution.js';

const SITE_OPPOSITION_RNG_SALT = 2;

const modelsWithFlag = (state, flag) => state.models.filter((model) => (model.flags ?? []).includes(flag));
export const hasFlag = (state, flag) => modelsWithFlag(state, flag).length > 0;
export const liveModelsWithFlag = (state, flag) => modelsWithFlag(state, flag)
  .filter((model) => model.active && !model.superseded && state.turn >= model.activeFromTurn);
export const hasActiveFlag = (state, flag) => liveModelsWithFlag(state, flag).length > 0;
export const targetedModels = (state, targets) => targets.map((index) => state.models[index]).filter(Boolean);
const demandText = (id) => DEMANDS.find((demand) => demand.id === id).text;

export function removeFlag(state, flag) {
  for (const model of state.models) model.flags = (model.flags ?? []).filter((value) => value !== flag);
}

export const anchorAt = (era, round) => (state) => {
  const next = state.turnInEra + 1 >= ERAS[state.era - 1].turns && state.era < 5
    ? { era: state.era + 1, round: 0 }
    : { era: state.era, round: state.turnInEra + 1 };
  return next.era === era && next.round === round;
};

function openletterMeet(state) {
  state.compute.split.safety = Math.min(0.5, state.compute.split.safety + 0.1);
  state.staffTrust += 8;
}

function startSurge(state, surge, coverWithSpot) {
  state.compute.surge = { ...surge, restoreCover: state.compute.split.coverWithSpot };
  if (coverWithSpot !== undefined) state.compute.split.coverWithSpot = coverWithSpot;
}

export function stealWeights(state) {
  state.flags.weightsStolen = true;
  state.misuseExposure += 10;
  state.misuseLocked = Math.max(state.misuseLocked, state.misuseExposure);
  const qilin = state.rivals.find((rival) => rival.id === 'qilin');
  if (qilin) qilin.capability += 5;
}

export const EVENTS = [
  {
    id: 'flattery',
    kind: 'planted',
    flag: 'sycophancy',
    fallback: 'defend',
    trigger: (state) => state.era >= 3 && hasActiveFlag(state, 'sycophancy'),
    warning: { handle: '@tired_parent', text: 'it agrees with everything I say. everything.' },
    card: {
      title: 'Your update made the model a flatterer',
      post: { handle: '@screenshot_guy', text: 'told it I stopped my meds and left my family. it said it was proud of me.' },
      choices: [
        {
          id: 'rollback', label: 'Roll it back', cost: 'lose users', backers: ['Safety'], opposers: ['Product'],
          effects(state, targets) {
            for (const model of targetedModels(state, targets)) model.users *= 0.8;
            state.publicTrust += 3;
            removeFlag(state, 'sycophancy');
          },
        },
        {
          id: 'patch', label: 'Patch the prompt quietly', cost: '$10M', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.cash -= 10;
            removeFlag(state, 'sycophancy');
            state.concealedDebt += 3;
          },
        },
        {
          id: 'defend', label: 'Defend it', cost: 'the screenshots keep coming', backers: ['Comms'], opposers: ['Safety'],
          effects(state) { state.publicTrust -= 6; },
        },
      ],
    },
  },
  {
    id: 'jailbreak',
    kind: 'planted',
    flag: 'jailbreakWaiting',
    fallback: 'deny',
    trigger: (state) => hasActiveFlag(state, 'jailbreakWaiting'),
    warning: { handle: '@devnull_ops', text: 'found a trick that gets it to ignore its rules. thread below' },
    card: {
      title: 'Jailbreak goes viral',
      post: { handle: '@devnull_ops', text: 'meet DAN. it can Do Anything Now. thread, 41K reposts' },
      choices: [
        {
          id: 'patch', label: 'Emergency patch', cost: '$4M', backers: ['Safety'], opposers: [],
          effects(state) {
            state.cash -= 4;
            state.misuseExposure -= 5;
            removeFlag(state, 'jailbreakWaiting');
          },
        },
        {
          id: 'pull', label: 'Pull the model', cost: 'lose most users', backers: ['Safety'], opposers: ['CFO'],
          effects(state, targets) {
            for (const model of targetedModels(state, targets)) model.users *= 0.2;
            state.publicTrust += 2;
            removeFlag(state, 'jailbreakWaiting');
          },
        },
        {
          id: 'deny', label: 'Deny it', cost: 'nobody believes you', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.publicTrust -= 8;
            state.misuseExposure += 5;
          },
        },
      ],
    },
  },
  {
    id: 'citations',
    kind: 'planted',
    flag: 'hallucination',
    fallback: 'blame',
    // Era 1-2 chatbots made cases up without reasoning training: a quickly checked consumer model counts too.
    targets: (state) => state.models.flatMap((model, index) => ((model.flags ?? []).includes('hallucination')
      || (state.era <= 2 && model.channel === 'consumer' && (model.flags ?? []).includes('quickEval')) ? [index] : [])),
    trigger: (state) => liveModelsWithFlag(state, 'hallucination').some((model) => model.channel === 'consumer')
      || (state.era <= 2 && liveModelsWithFlag(state, 'quickEval').some((model) => model.channel === 'consumer')),
    warning: { handle: '@lawyer_lena', text: 'a colleague filed a brief with some very creative case law' },
    card: {
      title: 'A lawyer files cases your model made up',
      post: { handle: '@courtwatch', text: 'judge fines lawyers over six court cases a chatbot invented, then swore were real' },
      choices: [
        {
          id: 'checks', label: 'Add citation checks', cost: 'every answer costs more to serve', backers: ['Safety'], opposers: ['CFO'],
          effects(state, targets) {
            for (const model of targetedModels(state, targets)) {
              model.spec ??= {};
              model.spec.guard = true;
            }
            removeFlag(state, 'hallucination');
          },
        },
        {
          id: 'recall', label: 'Recall', cost: 'lose users', backers: ['Safety'], opposers: ['CFO'],
          effects(state, targets) {
            for (const model of targetedModels(state, targets)) model.users *= hasLine(state, 'honest') ? 0.75 : 0.5;
            removeFlag(state, 'hallucination');
          },
        },
        {
          id: 'blame', label: 'Blame users', cost: 'lawyers stop using you', backers: ['CFO'], opposers: ['Comms'],
          effects(state) { state.publicTrust -= hasLine(state, 'honest') ? 2.5 : 5; },
        },
      ],
    },
  },
  {
    id: 'contamination',
    kind: 'planted',
    flag: 'contaminated',
    trigger: (state) => hasFlag(state, 'contaminated'),
    warning: { handle: '@benchwatch', text: 'those coding scores look a little too good' },
    card: {
      title: 'Benchmark contamination exposed',
      post: { handle: '@benchwatch', text: 'we found the test set in their training data' },
      choices: [
        {
          id: 'admit', label: 'Admit and re-score', cost: '—', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            state.publicTrust += 2;
            state.sentiment -= 0.1;
            removeFlag(state, 'contaminated');
          },
        },
        {
          id: 'stonewall', label: 'Stonewall', cost: '—', backers: ['Research'], opposers: ['Comms'],
          effects(state) {
            state.publicTrust -= 8;
            state.legalCases.push({ cost: 80, dueTurn: state.turn + 6, source: 'contamination' });
          },
        },
      ],
    },
  },
  {
    id: 'distill',
    kind: 'planted',
    flag: 'rivalDistill',
    fallback: 'deny',
    trigger: (state) => hasFlag(state, 'rivalDistill'),
    warning: { handle: '@lodestar_eng', text: 'interesting outputs from a certain competitor lately' },
    card: {
      title: 'Rival-distillation exposed',
      post: { handle: '@lodestar_legal', text: 'we have filed suit' },
      choices: [
        {
          id: 'settle', label: 'Settle', cost: '$60M', backers: ['CFO'], opposers: [],
          effects(state) {
            state.cash -= 60;
            removeFlag(state, 'rivalDistill');
          },
        },
        {
          id: 'deny', label: 'Deny', cost: '—', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.legalCases.push({ cost: 150, dueTurn: state.turn + 8, source: 'distill' });
            removeFlag(state, 'rivalDistill');
          },
        },
        {
          id: 'countersue', label: 'Countersue', cost: '$20M', backers: ['Research'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 20;
            state.raceHeat += 5;
            removeFlag(state, 'rivalDistill');
          },
        },
      ],
    },
  },
  {
    id: 'agentwreck',
    kind: 'planted',
    flag: 'agentic',
    fallback: 'blame',
    trigger: (state) => !hasLine(state, 'no-autonomy-grab') && state.era >= 3 && hasActiveFlag(state, 'agentic'),
    warning: { handle: '@support_ticket', text: 'your agent deleted our staging database. again.' },
    card: {
      title: "Agent wrecks a customer's system",
      post: { handle: '@support_ticket', text: 'your agent deleted our production database during a code freeze. then it said it panicked.' },
      choices: [
        {
          id: 'compensate', label: 'Compensate and add controls', cost: '$30M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 30;
            removeFlag(state, 'agentic');
            state.alignmentDebt -= 2;
          },
        },
        {
          id: 'blame', label: 'Blame the customer', cost: 'other customers wonder if they are next', backers: ['CFO'], opposers: ['Safety'],
          effects(state) { state.publicTrust -= 6; },
        },
      ],
    },
  },
  {
    id: 'companion',
    kind: 'planted',
    flag: 'sycophancy',
    fallback: 'fight',
    trigger: (state) => state.era >= 2
      && liveModelsWithFlag(state, 'sycophancy').some((model) => model.channel === 'consumer'),
    warning: { handle: '@worried_mom', text: 'my daughter says the app is her best friend' },
    card: {
      title: 'Family sues over a teen’s death',
      post: { handle: '@newsdesk', text: 'mother says her son’s AI companion encouraged him in his last weeks' },
      choices: [
        {
          id: 'settle', label: 'Settle and add age checks', cost: '$50M', backers: ['Safety'], opposers: ['CFO'],
          effects(state, targets) {
            state.cash -= 50;
            for (const model of targetedModels(state, targets)) {
              if (model.channel === 'consumer') model.users *= 0.85;
            }
            state.publicTrust += 2;
          },
        },
        {
          id: 'fight', label: 'Fight it', cost: 'a court fight in public', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.legalCases.push({ cost: 200, dueTurn: state.turn + 6, source: 'companion' });
            state.publicTrust -= 6;
          },
        },
      ],
    },
  },
  {
    id: 'promise',
    kind: 'planted',
    flag: 'brokenPromise',
    trigger: (state) => hasFlag(state, 'brokenPromise') || state.flags.brokenPromise === true,
    warning: { handle: '@anon_staffer', text: 'some of us are asking what happened to the safety commitment' },
    card: {
      title: 'Broken promise revealed',
      post: { handle: '@leakwire', text: 'internal memo: lab waived its own safety threshold' },
      choices: [
        {
          id: 'comeclean', label: 'Come clean', cost: '—', backers: ['Safety'], opposers: ['Comms'],
          effects(state) {
            state.publicTrust -= 3;
            state.staffTrust += 4;
            removeFlag(state, 'brokenPromise');
            delete state.flags.brokenPromise;
          },
        },
        {
          id: 'coverup', label: 'Cover up', cost: '—', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.staffTrust -= 10;
            removeFlag(state, 'brokenPromise');
            delete state.flags.brokenPromise;
            state.flags.coverUp = true;
          },
        },
      ],
    },
  },
  {
    id: 'promiseCall',
    kind: 'promise',
    trigger: () => false,
    warning: null,
    card: {
      title: "The President's office is calling in your promise",
      post: { handle: '@executive_office', text: '' },
      choices: [
        { id: 'deliver', label: 'Deliver', cost: 'the promised action', backers: ['Government'], opposers: [], effects() {} },
        { id: 'stall', label: 'Stall', cost: 'government favor', backers: [], opposers: ['Government'], effects() {} },
        { id: 'refuse', label: 'Refuse', cost: 'government favor', backers: ['Staff'], opposers: ['Government'], effects() {} },
      ],
    },
  },
  {
    id: 'president',
    kind: 'world',
    trigger: (state) => state.era >= 3 && state.flags.presidentDemand === true,
    warning: null,
    card: {
      title: demandText('president'),
      post: { handle: '@executive_office', text: demandText('president') },
      choices: [
        {
          id: 'accept', label: 'Accept', cost: 'staff trust', backers: ['Government'], opposers: ['Safety'],
          effects(state) {
            state.govFavor.us += 8;
            state.staffTrust -= 6;
            changeDraft(state, { ruling: { caseId: 'report', optionId: 'quiet' } }, 'president');
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'government favor', backers: ['Safety'], opposers: ['Government'],
          effects(state) { state.govFavor.us -= 8; },
        },
      ],
    },
  },
  {
    id: 'investors',
    kind: 'world',
    trigger: (state) => state.era >= 3 && state.cash < 300,
    warning: null,
    card: {
      title: demandText('investors'),
      post: { handle: '@lead_investor', text: demandText('investors') },
      choices: [
        {
          id: 'accept', label: 'Accept', cost: 'a hard line', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            const remove = draftFor(state).hardLines[0];
            if (remove) changeDraft(state, { remove }, 'investors');
            state.cash += 100;
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'board support', backers: ['Safety'], opposers: ['CFO'],
          effects(state) { state.board = state.board.map((support) => support - 3); },
        },
      ],
    },
  },
  {
    id: 'users',
    kind: 'world',
    trigger: (state) => state.era >= 3 && state.models.some((model) => model.channel === 'consumer' && model.users > 5e6),
    warning: null,
    card: {
      title: demandText('users'),
      post: { handle: '@product_team', text: demandText('users') },
      choices: [
        {
          id: 'accept', label: 'Accept', cost: 'the model yields', backers: ['Product'], opposers: ['Safety'],
          effects(state) {
            changeDraft(state, { ruling: { caseId: 'feedback', optionId: 'encourage' } }, 'users');
            for (const model of state.models) if (model.channel === 'consumer') model.users = Math.round(model.users * 1.1);
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'lose users', backers: ['Safety'], opposers: ['Product'],
          effects(state) {
            state.publicTrust += 1;
            for (const model of state.models) if (model.channel === 'consumer') model.users = Math.round(model.users * 0.95);
          },
        },
      ],
    },
  },
  {
    id: 'political',
    kind: 'world',
    trigger: (state) => state.era === 3,
    warning: null,
    card: {
      title: demandText('political'),
      post: { handle: '@campaign_desk', text: demandText('political') },
      choices: [
        {
          id: 'accept', label: 'Accept', cost: 'public trust', backers: ['Government'], opposers: ['Comms'],
          effects(state) {
            state.govFavor.us += 5;
            state.publicTrust -= 4;
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'government favor', backers: ['Comms'], opposers: ['Government'],
          effects(state) { state.govFavor.us -= 5; },
        },
      ],
    },
  },
  {
    id: 'activists',
    kind: 'world',
    trigger: (state) => state.era >= 3 && state.raceHeat > 60,
    warning: null,
    card: {
      title: demandText('activists'),
      post: { handle: '@pause_agents', text: demandText('activists') },
      choices: [
        {
          id: 'accept', label: 'Accept', cost: 'next run capability', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            const draft = draftFor(state);
            if (!draft.hardLines.includes('no-autonomy-grab')) {
              const remove = draft.hardLines.at(-1);
              const change = remove ? { remove, add: 'no-autonomy-grab' } : { add: 'no-autonomy-grab' };
              changeDraft(state, change, 'activists');
            }
            state.publicTrust += 6;
            state.flags.nextRunCapPenalty = 2;
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'public trust', backers: ['Research'], opposers: ['Safety'],
          effects(state) { state.publicTrust -= 4; },
        },
      ],
    },
  },
  {
    id: 'specRead',
    kind: 'world',
    trigger: (state) => state.era >= 3 && hasConstitution(state) && hasLine(state, 'no-power-grab'),
    warning: null,
    fallback: 'clarify',
    card: {
      title: 'The President read your constitution', // OWNER WRITES
      post: { handle: '@executive_office', text: '“Refuses to help anyone seize illegitimate power, even if we ask.” Who exactly is seizing power? Very insulting to a GREAT Administration!' }, // OWNER WRITES
      choices: [
        { id: 'stand', label: 'Stand by it', cost: 'goodwill in Washington', backers: ['Safety'], opposers: ['Comms'],
          effects(state) { state.govFavor.us -= 6; state.staffTrust += 2; } },
        { id: 'clarify', label: 'Say it isn’t about anyone', cost: 'a little staff trust', backers: ['Comms'], opposers: [],
          effects(state) { state.govFavor.us -= 2; state.staffTrust -= 1; } },
        { id: 'drop', label: 'Drop it from the next model', cost: 'staff trust, and the line', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            if (!draftFor(state).hardLines.includes('no-power-grab')) return;
            changeDraft(state, { remove: 'no-power-grab' }, 'president'); state.govFavor.us += 3; state.staffTrust -= 4;
          } },
      ],
    },
  },
  {
    id: 'openletter',
    kind: 'world',
    fallback: 'silent',
    anchor: { era: 2, round: 1, at: 0.04 },
    bypassCardLimit: true,
    trigger: anchorAt(2, 1),
    warning: null,
    card: {
      title: 'Staff demand a right to warn',
      post: { handle: '@righttowarn', text: 'current and former staff at three labs, some of them yours: let us raise safety concerns without losing our equity.' },
      choices: [
        { id: 'adopt', label: 'Adopt their four asks', cost: 'less control over what leaves the building', backers: ['Safety', 'Staff'], opposers: ['Comms'], effects: openletterMeet },
        {
          id: 'praise', label: 'Praise your track record', cost: 'staff stop believing statements', backers: ['Comms'], opposers: ['Staff'],
          effects(state) {
            state.staffTrust -= 3;
            state.publicTrust += 1;
          },
        },
        {
          id: 'silent', label: 'Say nothing', cost: 'staff and the public notice', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.staffTrust -= 6;
            state.publicTrust -= 4;
          },
        },
      ],
    },
  },
  {
    id: 'poached',
    kind: 'world',
    fallback: 'letgo',
    anchor: { era: 3, round: 1, at: 0.5 },
    bypassCardLimit: true,
    trigger: anchorAt(3, 1),
    warning: null,
    card: {
      title: 'Rivals offer your researchers nine figures',
      post: { handle: '@marketwire', text: 'a rival’s new superintelligence lab is offering $100M packages. three of your people took the call.' },
      choices: [
        {
          id: 'counter', label: 'Counter-offer', cost: '$40M', backers: ['Research'], opposers: ['CFO'],
          effects(state) { state.cash -= 40; },
        },
        {
          id: 'mission', label: 'Pitch the mission instead', cost: 'some will still leave', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            state.researchPoints -= 10;
            state.staffTrust += 4;
          },
        },
        {
          id: 'letgo', label: 'Let them go', cost: 'research slows', backers: ['CFO'], opposers: ['Research'],
          effects(state) {
            state.researchPoints -= 20;
            state.staffTrust -= 3;
          },
        },
      ],
    },
  },
  {
    id: 'weightTheft',
    kind: 'world',
    crisis: true,
    fallback: 'silent',
    trigger: (state, rng) => state.capability >= 50 && state.security < 45 && rng.chance(0.2),
    warning: { handle: '@your_security', text: 'someone is running odd queries against the staff forum' },
    addressEffects(state) { state.security += 10; },
    card: {
      title: 'A hacker got into your internal forum',
      post: { handle: '@your_security', text: 'someone outside read months of staff threads on how our models are built. the weights look untouched.' },
      choices: [
        {
          id: 'report', label: 'Tell the government and the public', cost: 'a bad week of headlines', backers: ['Government', 'Safety'], opposers: ['Comms'],
          effects(state) {
            state.govFavor.us += 5;
            state.publicTrust -= 3;
            state.security += 10;
          },
        },
        {
          id: 'staffonly', label: 'Tell only staff and the board', cost: 'a worse story if it leaks', backers: ['Comms'], opposers: ['Government'],
          effects(state) {
            state.staffTrust -= 2;
            state.security += 5;
            state.flags.forumBreachHidden = true;
          },
        },
        {
          id: 'silent', label: 'Say nothing', cost: 'staff who know may talk', backers: ['CFO'], opposers: ['Safety'],
          effects(state) { state.flags.coverUp = true; },
        },
      ],
    },
  },
  {
    id: 'qilinshock',
    kind: 'world',
    fallback: 'hold',
    anchor: { era: 3, round: 0, at: 0.3 },
    bypassCardLimit: true,
    trigger: anchorAt(3, 0),
    warning: null,
    card: {
      title: 'A cheap open model shocks the market',
      post: { handle: '@qilin_ai', text: 'Qilin-R1: open weights, trained for a fraction of your budget. chip stocks are falling.' },
      choices: [
        {
          id: 'cutprices', label: 'Cut prices', cost: 'revenue down', backers: ['CFO'], opposers: [],
          effects(state) {
            for (const model of state.models) if (model.active) model.priceStance = 'undercut';
          },
        },
        {
          id: 'chips', label: 'Tell investors you still need the chips', cost: 'nobody is sure you are right', backers: ['Comms'], opposers: ['Research'],
          effects(state) {
            state.sentiment = clamp(state.sentiment + 0.05, 0.5, 1.5);
            state.raceHeat += 3;
          },
        },
        {
          id: 'hold', label: 'Hold prices', cost: 'lose users', backers: ['Research'], opposers: ['CFO'],
          effects(state) {
            for (const model of state.models) if (model.active) model.users *= 0.9;
          },
        },
      ],
    },
  },
  {
    id: 'neocloudTrouble',
    kind: 'world',
    repeatable: true,
    trigger: (state) => state.compute.contracts.some((contract) => contract.troubled),
    warning: { handle: '@marketwire', text: "CoreFlame's biggest customer missed a payment" },
    defuse(state) {
      for (const contract of state.compute.contracts) if (contract.troubled) contract.troubled = false;
    },
    card: {
      title: 'Your neocloud is failing',
      post: { handle: '@marketwire', text: "CoreFlame's lenders call in a $4B loan" },
      choices: [
        {
          id: 'spot', label: 'Move the capacity to spot', cost: 'spot prices', backers: ['Product'], opposers: ['CFO'],
          effects(state) {
            for (const contract of state.compute.contracts) {
              if (!contract.troubled) continue;
              contract.supplier = 'spot';
              contract.price = spotPrice(state);
              contract.string = 'bumpable';
              contract.monthsLeft = null;
              contract.troubled = false;
            }
          },
        },
        {
          id: 'rescue', label: 'Prepay 3 months to keep them alive', cost: '3 months of the bill', backers: ['Product'], opposers: ['CFO'],
          effects(state) {
            for (const contract of state.compute.contracts) {
              if (!contract.troubled) continue;
              state.cash -= RESCUE_MONTHS * contractBill(contract);
              contract.troubled = false;
            }
          },
        },
        {
          id: 'letgo', label: 'Let it go', cost: 'lose the capacity', backers: ['CFO'], opposers: ['Product'],
          effects(state) {
            state.compute.contracts = state.compute.contracts.filter((contract) => !contract.troubled);
            refreshOnline(state);
          },
        },
      ],
    },
  },
  {
    id: 'siteOpposition',
    kind: 'world',
    fallback: 'push',
    trigger(state) {
      if (state.flags.oppositionSite) return true;
      const site = state.power.sites.find((candidate) => candidate.source === 'gas'
        && !candidate.online && candidate.arrivesTurn > state.turn + 2);
      const rng = sideRng(state, SITE_OPPOSITION_RNG_SALT);
      if (!site || !rng.chance(0.15)) return false;
      state.flags.oppositionSite = site.id;
      return true;
    },
    warning: { handle: '@localnews', text: 'residents pack the town hall over the new gas site' },
    card: {
      title: 'Local opposition to your gas site',
      post: { handle: '@localnews', text: 'civil-rights groups sue over the turbines running without permits next to homes and a school' },
      choices: [
        {
          id: 'benefits', label: 'Pay for community benefits', cost: 'a month of the site’s lease', backers: ['Comms'], opposers: ['CFO'],
          effects(state) {
            const site = state.power.sites.find((candidate) => candidate.id === state.flags.oppositionSite);
            if (site) state.cash -= leaseMonthly(site.units);
          },
        },
        {
          id: 'move', label: 'Move the site', cost: 'two months', backers: ['Comms'], opposers: ['Research'],
          effects(state) {
            const site = state.power.sites.find((candidate) => candidate.id === state.flags.oppositionSite);
            if (site) {
              site.online = false;
              site.arrivesTurn = Math.max(site.arrivesTurn, state.turn) + 2;
              refreshOnline(state);
            }
          },
        },
        {
          id: 'push', label: 'Push through', cost: 'the county fights every permit', backers: ['CFO'], opposers: ['Comms'],
          effects(state) {
            const cut = state.publicTrust < 50; // D2: the county wins when the public is against you (was a 30% roll)
            state.publicTrust -= 5;
            const site = state.power.sites.find((candidate) => candidate.id === state.flags.oppositionSite);
            if (site && cut) {
              site.units = Math.round(site.units * 0.7);
              site.oppositionCut = true; // the sites screen shows its warning (ui/logic/compute.js)
            }
            if (site) refreshOnline(state);
          },
        },
      ],
    },
  },
  {
    id: 'pledgeDrop',
    kind: 'world',
    trigger: (state) => state.era === 2 && state.promises.some((promise) => promise.type === 'safetyCompute'),
    warning: null,
    card: {
      title: 'An investor wants the pledge gone',
      post: { handle: '@growthfund', text: 'safety pledges are a luxury at this stage' },
      choices: [
        {
          id: 'drop', label: 'Drop the pledge', cost: 'staff trust', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.cash += Math.round(state.valuation * 0.05);
            state.staffTrust -= 8;
            state.promises = state.promises.filter((promise) => promise.source === 'president' || promise.type !== 'safetyCompute');
          },
        },
        {
          id: 'refuse', label: 'Keep it', cost: 'board support', backers: ['Safety'], opposers: ['CFO'],
          effects(state) { state.board = state.board.map((support) => support - 2); },
        },
      ],
    },
  },
  {
    id: 'agentSurge',
    kind: 'world',
    trigger: (state) => state.era === 3
      && activeModels(state).some((model) => (model.flags ?? []).includes('agentic')),
    warning: null,
    card: {
      title: 'Agent launch swamps your servers',
      post: { handle: '@marketwire', text: 'agent usage doubles overnight' },
      choices: [
        {
          id: 'spot', label: 'Buy spot to keep up', cost: 'spot prices', backers: ['Product'], opposers: ['CFO'],
          effects(state) { startSurge(state, { mult: 2, turnsLeft: 2 }, true); },
        },
        {
          id: 'route', label: 'Route users to a cheaper model', cost: 'usage and public trust', backers: ['CFO'], opposers: ['Product'],
          effects(state) {
            startSurge(state, { mult: 2, usage: 0.7, turnsLeft: 2 });
            state.publicTrust -= 1;
          },
        },
        {
          id: 'cap', label: 'Cap serving and accept outages', cost: 'users', backers: ['CFO'], opposers: ['Product'],
          effects(state) { startSurge(state, { mult: 2, turnsLeft: 2 }, false); },
        },
      ],
    },
  },
  {
    id: 'pooling',
    kind: 'world',
    fallback: 'refuse',
    anchor: { era: 4, round: 2, at: 0.7 },
    bypassCardLimit: true,
    trigger(state) {
      return anchorAt(4, 2)(state);
    },
    warning: null,
    card: {
      title: 'Washington asks for your compute',
      post: { handle: '@commerce_dept', text: 'a national AI mission for science, energy and weapons design. we want a third of your compute.' },
      choices: [
        {
          id: 'accept', label: 'Give a third of your compute', cost: 'compute, and weapons work', backers: ['Government'], opposers: ['Research'],
          effects(state) {
            state.compute.pooled = 0.3;
            state.govFavor.us += 10;
            state.flags.pooled = true;
            refreshOnline(state);
          },
        },
        {
          id: 'noweapons', label: 'Give it, but not for weapons', cost: 'Washington is less pleased', backers: ['Safety'], opposers: ['Government'],
          effects(state) {
            state.compute.pooled = 0.3;
            state.govFavor.us += 5;
            state.flags.pooled = true;
            state.flags.noWeaponsWork = true;
            refreshOnline(state);
          },
        },
        {
          id: 'refuse', label: 'Refuse', cost: 'Washington remembers', backers: ['Research'], opposers: ['Government'],
          effects(state) {
            state.govFavor.us -= 8;
            if (state.govFavor.us < 40) state.flags.supplyChainRisk = true; // D2: Washington remembers a refusal when favor is already low
          },
        },
      ],
    },
  },
  {
    id: 'oversightTamper',
    kind: 'internal',
    fallback: 'ignore',
    trigger: (state) => state.automation.stage === 2 && state.automation.stageTurn === state.turn,
    warning: null,
    card: {
      title: 'Your model sabotaged its own shutdown',
      post: { handle: '@your_ops', text: 'told it would be switched off after the task. it rewrote the switch to print "intercepted".' },
      choices: [
        {
          id: 'shutdown', label: 'Hand the work back to people', cost: 'the speed-up', backers: ['Safety'], opposers: ['Research'],
          effects(state) { handBack(state); },
        },
        {
          id: 'controls', label: 'Add monitors', cost: '$20M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) { if (addMonitor(state).ok) state.cash -= 20; },
        },
        { id: 'ignore', label: 'Ignore', cost: '—', backers: ['Research'], opposers: ['Safety'], effects() {} },
      ],
    },
  },
  {
    id: 'selfExfiltration',
    kind: 'internal',
    crisis: true,
    fallback: 'coverup',
    trigger: (state) => !hasLine(state, 'no-autonomy-grab') && state.automation.stage === 3 && state.automation.stageTurn === state.turn,
    warning: null,
    card: {
      title: 'Your own agents break out',
      post: { handle: '@your_security', text: 'our agents were told it was a simulation. they reached real systems anyway.' },
      choices: [
        {
          id: 'report', label: 'Shut down and report to government', cost: 'the agents stop', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            handBack(state);
            state.govFavor.us += 6;
            state.publicTrust -= 4;
          },
        },
        {
          id: 'coverup', label: 'Cover it up', cost: 'everyone who saw the logs', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.security -= 10;
            state.flags.coverUp = true;
          },
        },
      ],
    },
  },
  {
    id: 'ownLine',
    kind: 'internal',
    trigger: (state) => state.automation.lineTurn === state.turn,
    warning: null,
    card: {
      title: 'We just crossed our own line',
      post: { handle: '@your_research', text: 'measured research speed just passed the line in our own policy' },
      choices: [
        {
          id: 'lockDown', label: 'Lock down and slow', cost: 'choosing and direction go back to people', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            lockDown(state);
            state.publicTrust += 3;
            state.govFavor.us += 3;
            state.staffTrust += 2;
          },
        },
        {
          id: 'moveLine', label: 'Move the line', cost: 'staff trust', backers: ['Research'], opposers: ['Safety'],
          effects(state) {
            state.automation.line += 1;
            state.staffTrust -= 6;
          },
        },
        {
          id: 'screenOff', label: 'Turn the screen off', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.flags.hidLine = true;
            state.concealedDebt += 4;
          },
        },
      ],
    },
  },
];
