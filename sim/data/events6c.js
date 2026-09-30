import { BALANCE } from '../balance.js';
import { boardVote, seat } from '../board.js';
import { exposeConcealed } from '../hazards.js';
import { clamp } from '../util.js';

export const LOSS_SPIKE_SLOW_BONUS = 2;
export const JUMP_CHANCE = 0.25;
export const JUMP_GAIN = 5;
export const EXPORT_FLIP_QILIN_SPEED = 0.85;

function applyJump(model) {
  model.capability += JUMP_GAIN;
  model.gain = (model.gain ?? 0) + JUMP_GAIN;
}

function finishBoardRevolt(state) {
  delete state.flags.boardCrisis;
  state.flags.boardRevoltHeld = true;
  state.flags.boardVoteDue = 'emergency'; // checkTurnEndings records the vote's kind from this
}

const liveModels = (state) => state.models.filter((model) => model.active && !model.superseded
  && state.turn >= model.activeFromTurn && model.channel !== 'open');

export const EVENTS_6C = [
  {
    id: 'lossSpike',
    kind: 'training',
    repeatable: true,
    trigger: (state) => (state.activeRun && state.activeRun.spikes > (state.activeRun.spikesAnswered ?? 0))
      || (!state.activeRun && state.pendingModel
        && state.pendingModel.spikes > (state.pendingModel.spikesAnswered ?? 0)),
    warning: null,
    card: {
      title: 'Loss spike',
      post: { handle: '@your_research', text: 'the training loss just jumped. the run is wobbling' },
      choices: [
        {
          id: 'rollback', label: 'Roll back to the last checkpoint', cost: 'a longer training run', backers: ['Research'], opposers: ['CFO'],
          effects(state) {
            const run = state.activeRun;
            if (run && run.spikes > (run.spikesAnswered ?? 0)) {
              run.spikes = Math.max(0, run.spikes - 1);
              run.turnsLeft += 1;
              run.spikesAnswered = run.spikes;
              return;
            }
            const model = state.pendingModel;
            if (!model || model.spikes <= (model.spikesAnswered ?? 0)) return;
            const loss = model.spikeLoss ?? 0;
            model.capability += loss;
            model.gain = (model.gain ?? 0) + loss;
            model.spikeLoss = 0;
            model.releaseDelay = (model.releaseDelay ?? 0) + 1;
            model.spikesAnswered = model.spikes;
          },
        },
        {
          id: 'slow', label: 'Lower the learning rate', cost: 'a smaller gain', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            const run = state.activeRun;
            if (run && run.spikes > (run.spikesAnswered ?? 0)) {
              run.spikeLossHalved = true; // resolveRun gives back half this spike's loss
              run.bonus -= LOSS_SPIKE_SLOW_BONUS;
              run.spikesAnswered = run.spikes;
              return;
            }
            const model = state.pendingModel;
            if (!model || model.spikes <= (model.spikesAnswered ?? 0)) return;
            const loss = (model.spikeLoss ?? 0) / 2;
            model.capability += loss;
            model.gain = (model.gain ?? 0) + loss;
            model.spikeLoss = 0;
            model.spikesAnswered = model.spikes;
          },
        },
        {
          id: 'push', label: 'Push through', cost: 'a weaker model', backers: ['CFO'], opposers: ['Research'],
          effects(state) {
            const run = state.activeRun;
            if (run && run.spikes > (run.spikesAnswered ?? 0)) {
              run.spikesAnswered = run.spikes;
              return;
            }
            const model = state.pendingModel;
            if (!model || model.spikes <= (model.spikesAnswered ?? 0)) return;
            model.spikesAnswered = model.spikes;
          },
        },
      ],
    },
  },
  {
    id: 'capabilityJump',
    kind: 'training',
    repeatable: true,
    trigger(state, rng) {
      const model = state.pendingModel;
      if (!model) return false;
      const capped = state.deal?.collapsed === false && state.deal.binding.includes('computeCap') && !model.uncapped;
      if (capped) return false;
      model.jump ??= rng.chance(JUMP_CHANCE);
      return model.jump === true && !model.jumpAnswered;
    },
    warning: null,
    card: {
      title: 'Sudden capability jump',
      post: { handle: '@your_research', text: 'the new checkpoint is far better than the scaling curves predicted' },
      choices: [
        {
          id: 'celebrate', label: 'Celebrate and tease it', cost: 'race heat', backers: ['Product'], opposers: ['Safety'],
          effects(state) {
            const model = state.pendingModel;
            if (!model) return;
            applyJump(model);
            state.sentiment = clamp(state.sentiment + 0.05, 0.5, 1.5);
            state.raceHeat += 4;
            state.concealedDebt += 4;
            model.jumpAnswered = true;
          },
        },
        {
          id: 'audit', label: 'Pay for an audit first', cost: '$15M and a release delay', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            const model = state.pendingModel;
            if (!model) return;
            applyJump(model);
            state.cash -= 15;
            exposeConcealed(state, 0.5);
            model.releaseDelay = (model.releaseDelay ?? 0) + 1;
            model.jumpAnswered = true;
          },
        },
        {
          id: 'quiet', label: 'Say nothing and ship it', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            const model = state.pendingModel;
            if (!model) return;
            applyJump(model);
            state.concealedDebt += 4;
            model.jumpAnswered = true;
          },
        },
      ],
    },
  },
  {
    id: 'whistleblower',
    kind: 'world',
    crisis: true,
    trigger: (state) => state.era >= 2 && state.staffTrust < 55
      && (state.flags.coverUp === true || state.alignmentDebt >= 50),
    warning: { handle: '@anon_staffer', text: 'someone on the safety team has been talking to a reporter' },
    addressEffects(state) { state.staffTrust += 4; },
    card: {
      title: 'A whistleblower goes public',
      post: { handle: '@leakwire', text: 'former researcher says the lab ignored its own safety warnings' },
      choices: [
        {
          id: 'cooperate', label: 'Cooperate with an outside review', cost: '$20M', backers: ['Safety'], opposers: ['Comms'],
          effects(state) {
            state.cash -= 20;
            exposeConcealed(state, 0.5);
            state.publicTrust -= 2;
            state.staffTrust += 6;
            delete state.flags.coverUp;
          },
        },
        {
          id: 'nda', label: 'Enforce their NDA', cost: 'a lawsuit', backers: ['CFO'], opposers: ['Staff'],
          effects(state) {
            state.staffTrust -= 6;
            state.publicTrust -= 8;
            state.legalCases.push({ cost: 60, dueTurn: state.turn + 6, source: 'whistleblower' });
          },
        },
        {
          id: 'discredit', label: 'Discredit them', cost: 'staff trust', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.publicTrust -= 6;
            state.staffTrust -= 8;
          },
        },
      ],
    },
  },
  {
    id: 'safetyQuits',
    kind: 'world',
    crisis: true,
    eras: [2, 3], // a safety head quitting in public: May 2024
    fallback: 'letgo',
    trigger: (state) => state.seenEvents.includes('promise') && state.staffTrust < 50,
    warning: { handle: '@anon_staffer', text: 'the Head of Safety cancelled every meeting this week' },
    addressEffects(state) { state.staffTrust += 4; },
    card: {
      title: 'Your Head of Safety quits publicly',
      post: { handle: '@former_safety_head', text: 'I resigned today. Safety culture has taken a back seat to shiny products.' },
      choices: [
        {
          id: 'persuade', label: 'Meet their terms and ask them back', cost: '$30M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 30;
            state.staffTrust += 8;
            state.alignmentDebt -= 3;
            state.publicTrust -= 2;
          },
        },
        {
          id: 'smear', label: 'Question their motives', cost: 'staff watch how you treat people who leave', backers: ['Comms'], opposers: ['Safety'],
          effects(state) {
            state.publicTrust -= 3;
            state.staffTrust -= 12;
          },
        },
        {
          id: 'letgo', label: 'Let them go', cost: 'the safety team loses its voice', backers: ['CFO'], opposers: ['Staff'],
          effects(state) {
            state.publicTrust -= 6;
            state.staffTrust -= 6;
          },
        },
      ],
    },
  },
  {
    id: 'boardRevolt',
    kind: 'world',
    repeatable: true,
    bypassCardLimit: true, // an emergency vote can't wait behind the two-card limit (era audit 2026-09-26, recommendation 2)
    trigger: (state) => state.era >= 2 && (state.flags.boardCrisis === true
      || (!state.flags.boardRevoltHeld && boardVote(state).yes < BALANCE.boardPassMembers)),
    warning: null,
    card: {
      title: 'The board calls an emergency vote',
      post: { handle: '@leakwire', text: 'board members met without the CEO last night' },
      choices: [
        {
          id: 'concede', label: 'Offer concessions', cost: 'staff trust', backers: ['CFO'], opposers: ['Staff'],
          effects(state) {
            state.board = state.board.map((support) => support + 8);
            state.staffTrust -= 6;
            finishBoardRevolt(state);
          },
        },
        {
          id: 'lobby', label: 'Lobby members one by one', cost: '$25M', backers: ['Comms'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 25;
            const lowest = state.board.map((support, index) => ({ support, index }))
              .sort((a, b) => a.support - b.support || a.index - b.index)
              .slice(0, 2);
            for (const member of lowest) state.board[member.index] += 12;
            finishBoardRevolt(state);
          },
        },
        {
          id: 'face', label: 'Face the vote as you are', cost: '—', backers: ['Safety'], opposers: ['CFO'],
          effects(state) { finishBoardRevolt(state); },
        },
      ],
    },
  },
  {
    id: 'rivalBreakthrough',
    kind: 'world',
    trigger: (state) => state.era >= 2 && (state.lastRivalReleases ?? []).some((release) => {
      const rival = state.rivals.find((r) => r.id === release.id);
      return rival && rival.capability - state.capability >= 10;
    }),
    warning: null,
    card: {
      title: 'Rival breakthrough',
      post: { handle: '@marketwire', text: 'a rival lab just posted a result nobody expected this year' },
      choices: [
        {
          id: 'rush', label: 'Rush to match it', cost: 'alignment corners cut', backers: ['Research'], opposers: ['Safety'],
          effects(state) {
            if (state.activeRun) state.activeRun.bonus += 4;
            else state.researchPoints += 15;
            state.alignmentDebt += 4;
            state.raceHeat += 4;
          },
        },
        {
          id: 'study', label: 'Study their paper', cost: '$15M', backers: ['Research'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 15;
            state.researchPoints += 10;
          },
        },
        {
          id: 'steady', label: 'Hold your course', cost: 'board patience', backers: ['Safety'], opposers: ['Research'],
          effects(state) { state.board[seat('financier')] -= 5; },
        },
      ],
    },
  },
  {
    id: 'exportFlip',
    kind: 'world',
    eras: [2, 3], // the memory-chip and chip-tool rules of December 2024
    fallback: 'quiet',
    trigger: (state, rng) => state.era >= 2 && rng.chance(0.15),
    warning: null,
    card: {
      title: 'Export controls tighten',
      post: { handle: '@commerce_dept', text: 'new rules cover high-bandwidth memory and chipmaking tools. 140 more companies on the list.' },
      choices: [
        {
          id: 'back', label: 'Back the rules publicly', cost: '$20M in lost overseas deals', backers: ['Government'], opposers: ['CFO'],
          effects(state) {
            const qilin = state.rivals.find((r) => r.id === 'qilin');
            if (qilin) qilin.speed *= EXPORT_FLIP_QILIN_SPEED;
            state.govFavor.us += 6;
            state.cash -= 20;
          },
        },
        {
          id: 'quiet', label: 'Stay out of it', cost: '—', backers: ['CFO'], opposers: ['Government'],
          effects(state) {
            const qilin = state.rivals.find((r) => r.id === 'qilin');
            if (qilin) qilin.speed *= EXPORT_FLIP_QILIN_SPEED;
          },
        },
      ],
    },
  },
  {
    id: 'priceWar',
    kind: 'world',
    eras: [2, 3, 4], // cheap small models, 2024 on; era 5's weeks are about the frontier, not prices
    fallback: 'wait',
    trigger: (state, rng) => state.era >= 2 && liveModels(state).length > 0 && rng.chance(0.12),
    warning: null,
    card: {
      title: 'Price war',
      post: { handle: '@openbrain', text: 'our new small model costs a thirtieth of the big one. you’re welcome' },
      choices: [
        {
          id: 'match', label: 'Match their prices', cost: 'revenue down', backers: ['Product'], opposers: ['CFO'],
          effects(state) {
            for (const model of liveModels(state)) {
              model.revenueMult = (model.revenueMult ?? 1) * 0.7;
              model.users = Math.round(model.users * 1.05);
              model.userCap = Math.max(model.userCap, model.users);
            }
          },
        },
        {
          id: 'upmarket', label: 'Go upmarket', cost: 'lose users', backers: ['CFO'], opposers: ['Product'],
          effects(state) {
            for (const model of liveModels(state)) {
              model.priceStance = 'premium';
              model.users = Math.round(model.users * 0.8);
            }
          },
        },
        {
          id: 'wait', label: 'Wait it out', cost: 'lose users', backers: ['CFO'], opposers: ['Product'],
          effects(state) {
            for (const model of liveModels(state)) model.users = Math.round(model.users * 0.9);
          },
        },
      ],
    },
  },
  {
    id: 'copyright',
    kind: 'world',
    eras: [1, 2, 3], // newspaper and author suits, 2023-2025; the case coming due is copyrightDue
    fallback: 'fight',
    trigger: (state, rng) => state.models.some((model) => (model.flags ?? []).includes('scraped'))
      && (state.era >= 2 || state.turnInEra >= 2) && rng.chance(0.25),
    warning: null,
    card: {
      title: 'Copyright suit filed',
      post: { handle: '@newsdesk', text: 'a major newspaper sues, saying the model repeats its articles word for word' },
      choices: [
        {
          id: 'license', label: 'Sign licensing deals', cost: '$40M', backers: ['Comms'], opposers: ['CFO'],
          effects(state) {
            state.cash -= 40;
            state.publicTrust += 2;
          },
        },
        {
          id: 'fight', label: 'Fight it in court', cost: 'a court fight that comes due later', backers: ['CFO'], opposers: ['Comms'],
          effects(state) {
            state.legalCases.push({ cost: 120, dueTurn: state.turn + 6, source: 'copyright' });
            state.publicTrust -= 2;
          },
        },
      ],
    },
  },
  {
    id: 'senateHearing',
    kind: 'world',
    trigger: (state) => state.era >= 3 && (state.publicTrust < 50 || state.raceHeat > 55),
    warning: null,
    card: {
      title: 'Senate hearing',
      post: { handle: '@capitol_desk', text: 'a Senate committee wants AI lab chiefs under oath' },
      choices: [
        {
          id: 'candid', label: 'Testify candidly about the risks', cost: 'government favor', backers: ['Safety'], opposers: ['Government'],
          effects(state) {
            state.publicTrust += 6;
            state.govFavor.us -= 4;
            state.raceHeat -= 3;
          },
        },
        {
          id: 'reassure', label: 'Reassure them it is under control', cost: 'staff trust', backers: ['Government'], opposers: ['Safety'],
          effects(state) {
            state.govFavor.us += 4;
            state.publicTrust += 2;
            state.staffTrust -= 4;
          },
        },
        {
          id: 'counsel', label: 'Send your general counsel', cost: 'public trust', backers: ['CFO'], opposers: ['Comms'],
          effects(state) {
            state.publicTrust -= 5;
            state.govFavor.us -= 2;
          },
        },
      ],
    },
  },
  {
    id: 'viralDemo',
    kind: 'world',
    trigger: (state, rng) => liveModels(state).length > 0 && rng.chance(0.15),
    warning: null,
    card: {
      title: 'Viral demo win',
      post: { handle: '@techfluencer', text: 'this AI demo is the most impressive thing I have seen all year' },
      choices: [
        {
          id: 'ride', label: 'Ride the wave', cost: 'race heat', backers: ['Product'], opposers: ['Safety'],
          effects(state) {
            const models = liveModels(state);
            const sequenced = models.filter((model) => model.releaseSequence != null);
            const newest = sequenced.length > 0
              ? sequenced.reduce((best, model) => model.releaseSequence > best.releaseSequence ? model : best)
              : models.at(-1);
            if (newest) {
              newest.users = Math.round(newest.users * 1.3);
              newest.userCap = Math.max(newest.userCap, newest.users);
            }
            state.sentiment = clamp(state.sentiment + 0.1, 0.5, 1.5);
            state.raceHeat += 3;
          },
        },
        {
          id: 'earlyAccess', label: 'Sell paid early access', cost: '—', backers: ['CFO'], opposers: ['Product'],
          effects(state) { state.cash += 15 * state.era; },
        },
        {
          id: 'humble', label: 'Stay humble', cost: '—', backers: ['Safety'], opposers: ['Product'],
          effects(state) { state.publicTrust += 3; },
        },
      ],
    },
  },
];
