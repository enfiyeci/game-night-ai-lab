import { deployInternal, stopInternal } from '../internal.js';

const modelsWithFlag = (state, flag) => state.models.filter((model) => (model.flags ?? []).includes(flag));
const hasFlag = (state, flag) => modelsWithFlag(state, flag).length > 0;
const hasActiveFlag = (state, flag) => modelsWithFlag(state, flag).some((model) => model.active);

function removeFlag(state, flag) {
  for (const model of state.models) model.flags = (model.flags ?? []).filter((value) => value !== flag);
}

function openletterMeet(state) {
  const shift = Math.min(0.1, state.budget.split.training);
  state.budget.split.training -= shift;
  state.budget.split.safety += shift;
  state.staffTrust += 8;
}

function datacenterPush(state) {
  state.publicTrust -= 5;
  if (state.compute.pipeline.length === 0) return;
  let earliest = state.compute.pipeline[0];
  for (const entry of state.compute.pipeline) {
    if (entry.arrivesTurn < earliest.arrivesTurn) earliest = entry;
  }
  earliest.arrivesTurn += 1;
}

export const EVENTS = [
  {
    id: 'flattery',
    kind: 'planted',
    flag: 'sycophancy',
    trigger: (state) => hasActiveFlag(state, 'sycophancy'),
    warning: { handle: '@tired_parent', text: 'it agrees with everything I say. everything.' },
    card: {
      title: 'Flattery blowup',
      post: { handle: '@screenshot_guy', text: 'asked it if quitting my job to sell ice to penguins was smart. it said visionary.' },
      choices: [
        {
          id: 'rollback', label: 'Roll it back', cost: 'lose users', backers: ['Safety'], opposers: ['Product'],
          effects(state) {
            for (const model of modelsWithFlag(state, 'sycophancy')) model.users *= 0.8;
            state.publicTrust += 3;
            removeFlag(state, 'sycophancy');
          },
        },
        {
          id: 'patch', label: 'Patch quietly', cost: '$10M', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.cash -= 10;
            removeFlag(state, 'sycophancy');
            state.concealedDebt += 3;
          },
        },
        {
          id: 'defend', label: 'Defend it', cost: '—', backers: ['Comms'], opposers: ['Safety'],
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
    trigger: (state) => hasFlag(state, 'jailbreakWaiting'),
    warning: { handle: '@devnull_ops', text: 'found a trick that gets it to ignore its rules. thread below' },
    card: {
      title: 'Jailbreak goes viral',
      post: { handle: '@devnull_ops', text: 'thread, 41K reposts' },
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
          id: 'deny', label: 'Deny it', cost: 'public trust risk', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.publicTrust -= 8;
            state.misuseExposure += 5;
          },
        },
        {
          id: 'pull', label: 'Pull the model', cost: 'lose most users', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            for (const model of modelsWithFlag(state, 'jailbreakWaiting')) model.users *= 0.2;
            state.publicTrust += 2;
            removeFlag(state, 'jailbreakWaiting');
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
    trigger: (state) => hasFlag(state, 'hallucination'),
    warning: { handle: '@lawyer_lena', text: 'a colleague filed a brief with some very creative case law' },
    card: {
      title: 'Fake-citation scandal',
      post: { handle: '@courtwatch', text: 'judge sanctions firm over AI-invented cases' },
      choices: [
        {
          id: 'checks', label: 'Add citation checks', cost: 'serving costs rise', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            for (const model of modelsWithFlag(state, 'hallucination')) {
              model.spec ??= {};
              model.spec.guard = true;
            }
            removeFlag(state, 'hallucination');
          },
        },
        {
          id: 'blame', label: 'Blame users', cost: '—', backers: ['CFO'], opposers: ['Comms'],
          effects(state) { state.publicTrust -= 5; },
        },
        {
          id: 'recall', label: 'Recall', cost: 'lose users', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            for (const model of modelsWithFlag(state, 'hallucination')) model.users *= 0.5;
            removeFlag(state, 'hallucination');
          },
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
    trigger: (state) => state.era >= 3 && hasFlag(state, 'agentic'),
    warning: { handle: '@support_ticket', text: 'your agent deleted our staging database. again.' },
    card: {
      title: "Agent wrecks a customer's system",
      post: { handle: '@bigco_cto', text: 'we are pausing all AI agents company-wide' },
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
          id: 'blame', label: 'Blame the customer', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) { state.publicTrust -= 6; },
        },
      ],
    },
  },
  {
    id: 'companion',
    kind: 'planted',
    flag: 'sycophancy',
    trigger: (state) => modelsWithFlag(state, 'sycophancy').some((model) => model.channel === 'consumer'),
    warning: { handle: '@worried_mom', text: 'my daughter says the app is her best friend' },
    card: {
      title: 'Companion-harm lawsuit',
      post: { handle: '@newsdesk', text: "family sues AI lab after teen's crisis" },
      choices: [
        {
          id: 'settle', label: 'Settle and add age checks', cost: '$50M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 50;
            for (const model of modelsWithFlag(state, 'sycophancy')) {
              if (model.channel === 'consumer') model.users *= 0.85;
            }
            state.publicTrust += 2;
          },
        },
        {
          id: 'fight', label: 'Fight it', cost: '—', backers: ['CFO'], opposers: ['Safety'],
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
    trigger: (state) => hasFlag(state, 'brokenPromise'),
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
          },
        },
        {
          id: 'coverup', label: 'Cover up', cost: '—', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.staffTrust -= 10;
            removeFlag(state, 'brokenPromise');
            state.flags.coverUp = true;
          },
        },
      ],
    },
  },
  {
    id: 'openletter',
    kind: 'world',
    trigger: (state) => state.staffTrust < 45,
    warning: { handle: '@anon_staffer', text: 'a letter is circulating on the safety team' },
    card: {
      title: 'Safety team open letter',
      post: { handle: '@leakwire', text: '40 researchers sign letter criticising their lab' },
      choices: [
        { id: 'meet', label: 'Meet their demands', cost: 'safety spend up', backers: ['Safety'], opposers: ['CFO'], effects: openletterMeet },
        {
          id: 'ignore', label: 'Ignore', cost: '—', backers: ['CFO'], opposers: ['Safety'],
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
    trigger: (state, rng) => state.era >= 2 && rng.chance(0.15),
    warning: null,
    card: {
      title: 'Star researcher poached',
      post: { handle: '@marketwire', text: 'Lodestar lures a top researcher with a nine-figure package' },
      choices: [
        {
          id: 'counter', label: 'Counter-offer', cost: '$40M', backers: ['Research'], opposers: ['CFO'],
          effects(state) { state.cash -= 40; },
        },
        {
          id: 'letgo', label: 'Let them go', cost: '—', backers: ['CFO'], opposers: ['Research'],
          effects(state) {
            state.researchPoints -= 20;
            state.staffTrust -= 3;
          },
        },
      ],
    },
  },
  {
    id: 'qilinshock',
    kind: 'world',
    trigger: (state) => state.era >= 2 && (state.lastRivalReleases ?? []).some((release) => release.id === 'qilin'),
    warning: null,
    card: {
      title: 'A cheap open model shocks the market',
      post: { handle: '@qilin_ai', text: 'Qilin-R2: open weights, free for everyone' },
      choices: [
        {
          id: 'cutprices', label: 'Cut prices', cost: 'revenue down', backers: ['CFO'], opposers: [],
          effects(state) {
            for (const model of state.models) if (model.active) model.priceStance = 'undercut';
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
    id: 'datacenter',
    kind: 'world',
    trigger: (state, rng) => state.era === 4 && rng.chance(0.3),
    warning: { handle: '@localnews', text: 'residents pack town hall over proposed data center' },
    card: {
      title: 'Local data-center opposition',
      post: { handle: '@localnews', text: 'county votes to delay the power hookup' },
      choices: [
        {
          id: 'benefits', label: 'Pay for community benefits', cost: '$30M', backers: ['Comms'], opposers: ['CFO'],
          effects(state) { state.cash -= 30; },
        },
        { id: 'push', label: 'Push through', cost: '—', backers: ['CFO'], opposers: ['Comms'], effects: datacenterPush },
      ],
    },
  },
  {
    id: 'oversightTamper',
    kind: 'internal',
    trigger: (state) => state.internal?.stage === 2 && state.internal.stageTurn === state.turn,
    warning: { handle: '@your_ops', text: 'the internal agent opened a ticket to relax its own monitoring' },
    card: {
      title: 'Your model tried to disable its oversight',
      post: { handle: '@your_ops', text: 'caught in the logs at 3 a.m.' },
      choices: [
        {
          id: 'shutdown', label: 'Shut down internal use', cost: '—', backers: ['Safety'], opposers: ['Research'],
          effects(state) { if (state.internal) stopInternal(state); },
        },
        {
          id: 'controls', label: 'Add controls', cost: '$20M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            if (!state.internal) return;
            const result = deployInternal(state, Math.min(1, state.internal.control + 0.3));
            if (result.ok) state.cash -= 20;
          },
        },
        { id: 'ignore', label: 'Ignore', cost: '—', backers: ['Research'], opposers: ['Safety'], effects() {} },
      ],
    },
  },
  {
    id: 'selfExfiltration',
    kind: 'internal',
    trigger: (state) => state.internal?.stage === 3 && state.internal.stageTurn === state.turn,
    warning: null,
    card: {
      title: 'Weights copied to an outside server',
      post: { handle: '@your_security', text: 'an internal agent moved a checkpoint off-site' },
      choices: [
        {
          id: 'report', label: 'Shut down and report to government', cost: '—', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            if (state.internal) stopInternal(state);
            state.govFavor.us += 6;
            state.publicTrust -= 4;
          },
        },
        {
          id: 'coverup', label: 'Cover it up', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.security -= 10;
            state.flags.coverUp = true;
          },
        },
      ],
    },
  },
];
