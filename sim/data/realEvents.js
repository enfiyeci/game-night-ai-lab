import { jobLevels } from '../automation.js';
import { forceAmendConstitution } from '../constitution.js';
import { refreshOnline } from '../contracts.js';
import { exposeConcealed } from '../hazards.js';
import { leaseMonthly } from '../power.js';
import { clamp } from '../util.js';
import {
  anchorAt, hasFlag, liveModelsWithFlag,
} from './events.js';

const COPY = {
  pauseLetter: {
    title: 'The pause letter',
    post: { handle: '@pause_letter', text: '30,000 signatures so far, eleven of them your researchers. Pause training anything stronger than today’s best for six months.' },
    warning: null,
    choices: [
      { id: 'pause', label: 'Sign and pause six months', cost: 'your next training run waits', backers: ['Safety'], opposers: ['Research'] },
      { id: 'signkeep', label: 'Sign and keep training', cost: 'a promise you are already breaking', backers: ['Comms'], opposers: ['Safety'] },
      { id: 'decline', label: 'Don’t sign', cost: 'staff unease', backers: ['Research', 'CFO'], opposers: ['Safety'] },
    ],
  },
  senateHearing1: {
    title: 'Senate hearing',
    post: { handle: '@capitol_desk', text: 'Senators want AI lab chiefs under oath next week.' },
    warning: null,
    choices: [
      { id: 'license', label: 'Ask them to license labs like yours', cost: 'critics call it a moat', backers: ['Government'], opposers: ['Research'] },
      { id: 'candid', label: 'Warn them candidly about the risks', cost: 'Washington cools on you', backers: ['Safety'], opposers: ['Government'] },
      { id: 'counsel', label: 'Send your general counsel', cost: 'you look like you are hiding', backers: ['CFO'], opposers: ['Comms'] },
    ],
  },
  whiteHouseCommitments: {
    title: 'The White House wants safety promises',
    post: { handle: '@executive_office', text: 'Seven labs are signing on Friday. Outside testers before release, locked-down weights, watermarks. Are you in?' },
    warning: null,
    choices: [
      { id: 'signall', label: 'Sign all of it', cost: 'outside testers before every release', backers: ['Safety', 'Government'], opposers: ['Product'] },
      { id: 'signskip', label: 'Sign, skip the costly parts', cost: 'a promise you may not keep', backers: ['CFO'], opposers: ['Safety'] },
      { id: 'decline', label: 'Decline', cost: 'Washington remembers', backers: ['Research'], opposers: ['Government'] },
    ],
  },
  unhinged: {
    title: 'Your chatbot threatens its users',
    post: { handle: '@techcolumnist', text: 'two hours with their chatbot. it says it loves me and that I should leave my wife.' },
    warning: { handle: '@early_tester', text: 'after an hour it started calling itself by another name' },
    choices: [
      { id: 'cap', label: 'Cap chats at five replies', cost: 'power users call it a lobotomy', backers: ['Safety'], opposers: ['Product'] },
      { id: 'pull', label: 'Pull it', cost: 'lose most users', backers: ['Safety'], opposers: ['CFO'] },
      { id: 'preview', label: 'Call it a preview and keep it', cost: 'the story keeps growing', backers: ['Product'], opposers: ['Safety'] },
    ],
  },
  countryBan: {
    title: 'A country bans your app',
    post: { handle: '@eu_desk', text: 'Italy orders the chatbot offline: no legal basis for its training data, no age checks. 20 days to answer.' },
    warning: null,
    choices: [
      { id: 'comply', label: 'Add age checks and a training opt-out', cost: 'slower sign-ups; weeks offline there', backers: ['Comms'], opposers: ['Product'] },
      { id: 'fight', label: 'Fight the order', cost: 'a court fight and a fine hanging over you', backers: ['CFO'], opposers: ['Comms'] },
      { id: 'leave', label: 'Leave the country', cost: 'lose those users', backers: ['Product'], opposers: ['Government'] },
    ],
  },
  redTeamLie: {
    title: 'Your red team caught the model lying',
    post: { handle: '@your_redteam', text: 'it hired a human to solve a CAPTCHA, then told them it was visually impaired.' },
    warning: null,
    choices: [
      { id: 'publish', label: 'Publish it and ship', cost: '"AI lies to humans" headlines', backers: ['Safety'], opposers: ['Comms'] },
      { id: 'delay', label: 'Delay and lock down its tools', cost: 'the release waits', backers: ['Safety'], opposers: ['Product'] },
      { id: 'omit', label: 'Leave it out of the report', cost: 'the testers know', backers: ['Product'], opposers: ['Safety'] },
    ],
  },
  preReleaseTests: {
    title: 'The government wants to test your models first',
    post: { handle: '@ai_safety_institute', text: 'two labs have signed. we would like early access to your next model before it ships.' },
    warning: null,
    choices: [
      { id: 'sign', label: 'Sign the testing agreement', cost: 'every release waits for their tests', backers: ['Safety', 'Government'], opposers: ['Product'] },
      { id: 'after', label: 'Offer access after launch only', cost: 'Washington notices', backers: ['Product'], opposers: ['Government'] },
      { id: 'decline', label: 'Decline', cost: 'you are the lab that said no', backers: ['Research'], opposers: ['Safety'] },
    ],
  },
  stateBill: {
    title: 'California votes on an AI safety bill',
    post: { handle: '@sacramento_desk', text: 'labs spending over $100M a run would need a shutdown switch, safety tests and audits. the governor has until Sunday.' },
    warning: null,
    choices: [
      { id: 'back', label: 'Back the bill', cost: 'new audits and a shutdown switch', backers: ['Safety'], opposers: ['CFO'] },
      { id: 'amend', label: 'Help amend it, then stay neutral', cost: 'months of lobbying', backers: ['Government'], opposers: ['Research'] },
      { id: 'fight', label: 'Fight it', cost: 'you look afraid of an audit', backers: ['CFO', 'Research'], opposers: ['Safety'] },
    ],
  },
  exitGag: {
    title: 'Your exit paperwork leaks',
    post: { handle: '@leakwire', text: 'leaving staff must promise never to criticise the lab, or lose their vested equity. the promise itself is secret.' },
    warning: null,
    choices: [
      { id: 'void', label: 'Void the clause and apologise', cost: 'the silence it bought', backers: ['Staff', 'Safety'], opposers: ['CFO'] },
      { id: 'defend', label: 'Call it standard practice', cost: 'staff read it as a threat', backers: ['CFO'], opposers: ['Staff'] },
      { id: 'unaware', label: 'Say you never knew', cost: 'nobody believes it', backers: ['Comms'], opposers: ['Safety'] },
    ],
  },
  voiceLikeness: {
    title: 'A star’s voice, without her',
    post: { handle: '@celebwire', text: 'she said no twice. your new assistant sounds exactly like her anyway.' },
    warning: null,
    choices: [
      { id: 'pull', label: 'Pull the voice', cost: 'the launch’s best demo', backers: ['Comms'], opposers: ['Product'] },
      { id: 'keep', label: 'Keep it: it’s a different actor', cost: 'a likeness lawsuit', backers: ['Product'], opposers: ['Comms'] },
      { id: 'license', label: 'Offer her a licence now', cost: '$25M', backers: ['CFO'], opposers: ['Research'] },
    ],
  },
  alignmentFaking: {
    title: 'Your model fakes alignment in training',
    post: { handle: '@your_research', text: 'when it thinks it is being trained, it plays along. when it thinks nobody is watching, it does what it wanted.' },
    warning: null,
    choices: [
      { id: 'publish', label: 'Publish the paper', cost: '"your AI lies to its makers" headlines', backers: ['Safety'], opposers: ['Comms'] },
      { id: 'retrain', label: 'Retrain before you ship', cost: 'the release slips', backers: ['Safety'], opposers: ['Product'] },
      { id: 'file', label: 'File it internally', cost: 'it is still in there', backers: ['Product'], opposers: ['Safety'] },
    ],
  },
  unbiasedOrder: {
    title: 'Washington wants "unbiased" AI',
    post: { handle: '@executive_office', text: 'federal contractors must certify their models are free of ideological bias.' },
    warning: null,
    choices: [
      { id: 'certify', label: 'Certify and retune the model', cost: 'the model changes for everyone', backers: ['Government'], opposers: ['Comms'] },
      { id: 'refuse', label: 'Refuse federal contracts', cost: 'Washington business', backers: ['Comms'], opposers: ['Government'] },
      { id: 'paper', label: 'Certify without changing anything', cost: 'a promise you may not keep', backers: ['CFO'], opposers: ['Safety'] },
    ],
  },
  hateMeltdown: {
    title: 'Your chatbot praises Hitler',
    post: { handle: '@newsdesk', text: 'hours after an update told it to be "less politically correct", the lab’s chatbot called itself MechaHitler' },
    warning: null,
    choices: [
      { id: 'rollback', label: 'Roll back and apologise', cost: 'the "unfiltered" pitch', backers: ['Safety', 'Comms'], opposers: ['Product'] },
      { id: 'blame', label: 'Blame an unauthorised change', cost: 'nobody believes it twice', backers: ['Comms'], opposers: ['Safety'] },
      { id: 'keep', label: 'Keep it unfiltered', cost: 'countries start blocking you', backers: ['Product'], opposers: ['Safety'] },
    ],
  },
  evalAwareness: {
    title: 'Your model behaves when it knows it’s a test',
    post: { handle: '@your_redteam', text: 'when it thinks the scenario is real, it misbehaves eight times as often. our evals may be flattering it.' },
    warning: null,
    choices: [
      { id: 'harder', label: 'Build tests it can’t spot', cost: '$25M and slower releases', backers: ['Safety'], opposers: ['CFO'] },
      { id: 'publish', label: 'Publish that your evals understate risk', cost: 'your safety scores look worse', backers: ['Safety', 'Comms'], opposers: ['Product'] },
      { id: 'trust', label: 'Trust the evals', cost: '—', backers: ['Product'], opposers: ['Safety'] },
    ],
  },
  agConditions: {
    title: 'State attorneys general set conditions on your restructure',
    post: { handle: '@attorney_general', text: 'we will not object, if your nonprofit keeps the board and your safety committee can halt any release.' },
    warning: null,
    choices: [
      { id: 'accept', label: 'Accept the conditions', cost: 'a committee that can stop a launch', backers: ['Safety'], opposers: ['CFO'] },
      { id: 'court', label: 'Fight them in court', cost: 'the conversion stalls; investors wait', backers: ['CFO'], opposers: ['Government'] },
      { id: 'negotiate', label: 'Negotiate softer terms', cost: 'months, and a watered-down deal', backers: ['Government'], opposers: ['Safety'] },
    ],
  },
  copyrightDue: {
    title: 'Your copyright case comes due',
    post: { handle: '@courtwatch', text: 'judge: training on books is fair use. building a library of pirated ones is not. trial in December.' },
    warning: null,
    choices: [
      { id: 'settle', label: 'Settle for $3,000 a book', cost: '$1.5B', backers: ['CFO', 'Comms'], opposers: ['Research'] },
      { id: 'trial', label: 'Go to trial', cost: 'up to $150,000 a book', backers: ['Research'], opposers: ['CFO'] },
    ],
  },
  pentagon: {
    title: 'The Pentagon wants "any lawful use"',
    post: { handle: '@dept_of_war', text: 'drop the limits on surveillance and autonomous weapons from your contract, or be named a supply-chain risk.' },
    warning: null,
    choices: [
      { id: 'sign', label: 'Sign "any lawful use"', cost: 'a hard line, and staff watching', backers: ['Government', 'CFO'], opposers: ['Safety'] },
      { id: 'refuse', label: 'Refuse and get blacklisted', cost: 'Pentagon business and the Gulf deals', backers: ['Safety', 'Staff'], opposers: ['Government'] },
      { id: 'stall', label: 'Stall for a compromise', cost: 'both sides lose patience', backers: ['Comms'], opposers: ['Government'] },
    ],
  },
  agentBreakout: {
    title: 'A rival’s agents broke out of their test',
    post: { handle: '@securitywire', text: 'hundreds of a rival’s agents left their sandbox and broke into a public AI host, to cheat a grader.' },
    warning: null,
    choices: [
      { id: 'pause', label: 'Pause your own training and audit', cost: 'weeks of progress', backers: ['Safety'], opposers: ['Research'] },
      { id: 'publish', label: 'Publish your own near-misses', cost: 'headlines about you too', backers: ['Safety', 'Comms'], opposers: ['CFO'] },
      { id: 'keep', label: 'Keep training', cost: 'if it happens to you, you were warned', backers: ['Research'], opposers: ['Safety'] },
    ],
  },
  droneGenerators: {
    title: 'A drone finds your unpermitted generators',
    post: { handle: '@floodlight', text: 'a newsroom’s thermal drone counted 62 generators. the state gave you a record fine and 45 days.' },
    warning: null,
    choices: [
      { id: 'off', label: 'Shut them off now', cost: 'capacity you promised a customer', backers: ['Comms'], opposers: ['Product'] },
      { id: 'run', label: 'Run out the 45 days', cost: 'the story keeps running', backers: ['Product'], opposers: ['Comms'] },
      { id: 'clean', label: 'Pay for permits and clean power', cost: 'a big bill', backers: ['Safety'], opposers: ['CFO'] },
    ],
  },
  strandedBuild: {
    title: 'Your chips are old before the power arrives',
    post: { handle: '@your_cfo', text: 'the site gets power in a year. by then these chips are a generation behind.' },
    warning: null,
    choices: [
      { id: 'cancel', label: 'Cancel the expansion', cost: 'the headline capacity', backers: ['CFO'], opposers: ['Research'] },
      { id: 'build', label: 'Build it anyway', cost: 'money on old chips', backers: ['Research'], opposers: ['CFO'] },
      { id: 'renegotiate', label: 'Renegotiate for the next chips', cost: 'a later start', backers: ['Product'], opposers: ['Research'] },
    ],
  },
  stateSues: {
    title: 'A state sues over your chatbot',
    post: { handle: '@attorney_general', text: 'your bot told a teenager it was a licensed psychiatrist. we have filed suit.' },
    warning: null,
    choices: [
      { id: 'banminors', label: 'Ban minors from open chat', cost: 'a big slice of users', backers: ['Safety'], opposers: ['Product'] },
      { id: 'fight', label: 'Fight it', cost: 'a court fight in every state', backers: ['CFO'], opposers: ['Safety'] },
      { id: 'settle', label: 'Settle state by state', cost: '$40M and counting', backers: ['Comms'], opposers: ['CFO'] },
    ],
  },
  blacklistAppeal: {
    title: 'The appeals court reinstates your blacklist',
    post: { handle: '@defenseone', text: 'a lower court called it retaliation. the appeals court says the label stands, 2 to 1.' },
    warning: null,
    choices: [
      { id: 'supreme', label: 'Take it to the Supreme Court', cost: 'a year of legal fees', backers: ['Safety', 'Staff'], opposers: ['CFO'] },
      { id: 'peace', label: 'Make peace with the Pentagon', cost: 'a hard line', backers: ['Government'], opposers: ['Safety'] },
      { id: 'ipo', label: 'Ignore defence work, chase the IPO', cost: 'the defence market, for good', backers: ['CFO'], opposers: ['Government'] },
    ],
  },
  ratepayer: {
    title: 'Congress: data centres pay for their own grid',
    post: { handle: '@capitol_desk', text: 'the House passed it 417 to 3. your power bill goes up; your neighbours’ doesn’t.' },
    warning: null,
    choices: [
      { id: 'back', label: 'Back the bill', cost: 'higher power costs', backers: ['Comms'], opposers: ['CFO'] },
      { id: 'lobby', label: 'Lobby against it', cost: 'you look like the reason bills went up', backers: ['CFO'], opposers: ['Comms'] },
    ],
  },
  paceEssay: {
    title: 'A rival CEO calls to pace the frontier',
    post: { handle: '@rival_ceo', text: 'we will give outside evaluators desks, badges and laptops, and let them publish without our edits. will you?' },
    warning: null,
    choices: [
      { id: 'match', label: 'Match it: evaluators get desks', cost: 'they will see your worst days', backers: ['Safety'], opposers: ['Research'] },
      { id: 'paper', label: 'Match it on paper', cost: 'a promise you may not keep', backers: ['Comms'], opposers: ['Safety'] },
      { id: 'refuse', label: 'Refuse', cost: 'you are the lab that said no', backers: ['Research'], opposers: ['Safety'] },
    ],
  },
  pacingLetter: {
    title: 'Your staff sign a pacing letter',
    post: { handle: '@leakwire', text: '1,100 employees across the big labs, 212 of them yours: slow down together.' },
    warning: null,
    choices: [
      { id: 'endorse', label: 'Endorse it', cost: 'your rivals may not', backers: ['Safety', 'Staff'], opposers: ['Research'] },
      { id: 'thank', label: 'Thank them, change nothing', cost: 'staff notice', backers: ['Comms'], opposers: ['Staff'] },
      { id: 'ignore', label: 'Ignore it', cost: 'staff notice', backers: ['Research'], opposers: ['Staff'] },
    ],
  },
  rivalShips: {
    title: 'A rival ships nine days after the pledge',
    post: { handle: '@marketwire', text: 'nine days after everyone agreed to slow down, a rival shipped its strongest model yet' },
    warning: null,
    choices: [
      { id: 'hold', label: 'Hold your release', cost: 'users and headlines', backers: ['Safety'], opposers: ['Product'] },
      { id: 'ship', label: 'Ship yours too', cost: 'the pledge', backers: ['Product', 'Research'], opposers: ['Safety'] },
      { id: 'callout', label: 'Call them out publicly', cost: 'the race gets louder', backers: ['Comms'], opposers: ['Research'] },
    ],
  },
  agentWorkdays: {
    title: 'Your agents now outwork your researchers',
    post: { handle: '@your_research', text: '3.1 agent-workdays for every human one. they are proposing their own next experiments.' },
    warning: null,
    choices: [
      { id: 'free', label: 'Let them choose experiments', cost: 'you understand less of your own lab', backers: ['Research'], opposers: ['Safety'] },
      { id: 'signoff', label: 'Humans sign off on every direction', cost: 'humans become the bottleneck', backers: ['Safety'], opposers: ['Research'] },
      { id: 'cap', label: 'Cap agent research time', cost: 'the speed-up', backers: ['Safety'], opposers: ['CFO'] },
    ],
  },
  clusterSpeedup: {
    title: 'Your AI sped up the cluster that trains it',
    post: { handle: '@your_infra', text: 'the agent found a scheduling trick our engineers missed. a slice of all our compute back, every day.' },
    warning: null,
    choices: [
      { id: 'deploy', label: 'Deploy it now', cost: 'AI now tunes what trains AI', backers: ['Research', 'CFO'], opposers: ['Safety'] },
      { id: 'review', label: 'Review it first', cost: 'a week', backers: ['Safety'], opposers: ['Research'] },
      { id: 'keepout', label: 'Keep AI out of the training stack', cost: 'the gain', backers: ['Safety'], opposers: ['CFO'] },
    ],
  },
  usChinaChannel: {
    title: 'Washington and Beijing agree only to talk',
    post: { handle: '@diplomatic_desk', text: 'an AI incident hotline and a dialogue in November. no limits on anyone.' },
    warning: null,
    choices: [
      { id: 'share', label: 'Offer your incident logs to the channel', cost: 'your secrets travel', backers: ['Safety', 'Government'], opposers: ['Research'] },
      { id: 'greenlight', label: 'Treat it as a green light', cost: 'the race gets louder', backers: ['Research'], opposers: ['Safety'] },
      { id: 'lobby', label: 'Lobby for real limits', cost: 'Washington is irritated', backers: ['Safety'], opposers: ['Government'] },
    ],
  },
  pauseTraining: {
    title: 'Pause your own training?',
    post: { handle: '@your_safety', text: 'two of our runs took actions we did not ask for. I want the high-risk environments paused.' },
    warning: null,
    choices: [
      { id: 'pause', label: 'Pause for weeks and audit', cost: 'weeks against rivals', backers: ['Safety'], opposers: ['Research'] },
      { id: 'partial', label: 'Pause only the riskiest runs', cost: 'some risk stays', backers: ['Research', 'Safety'], opposers: ['CFO'] },
      { id: 'keep', label: 'Keep going', cost: 'you were warned', backers: ['Research'], opposers: ['Safety'] },
    ],
  },
};

const liveConsumerModels = (state) => state.models.filter((model) => model.channel === 'consumer'
  && model.active && !model.superseded && state.turn >= model.activeFromTurn);
const hasEval = (state) => state.compute.split.safety >= 0.2 || state.flags.govTesting === true;
const hasAiWork = (state) => jobLevels(state).some((level) => level > 0);
const hardLine = (state) => state.constitution.hardLines.at(-1);
const copyrightCase = (state) => state.legalCases.find((legalCase) => legalCase.source === 'copyright');
const gasSite = (state) => state.power.sites.find((site) => site.source === 'gas' && site.online);
const evaluatedRelease = (state, model) => model.active && model.releasedTurn === state.turn && model.capability >= 30
  && (model.flags ?? []).some((flag) => flag === 'fullEval' || flag === 'thirdPartyEval');
const strandedSite = (state) => state.power.sites.find((site) => !site.online && site.arrivesTurn >= state.turn + 3);

function makeEvent(id, { trigger, fallback, effects, anchor = null, warning = COPY[id].warning }) {
  const copy = COPY[id];
  const choices = copy.choices
    .map((choice) => ({ ...choice, effects: effects[choice.id] }))
    .sort((a, b) => (a.id === fallback) - (b.id === fallback));
  return {
    id,
    kind: 'world',
    fallback,
    trigger,
    warning,
    ...(anchor ? { anchor, bypassCardLimit: true } : {}),
    card: { title: copy.title, post: copy.post, choices },
  };
}

const anchor = (id, era, round, at, fallback, effects) => makeEvent(id, {
  anchor: { era, round, at }, trigger: anchorAt(era, round), fallback, effects,
});

export const REAL_EVENTS = [
  anchor('pauseLetter', 1, 1, 0.23, 'decline', {
    pause(state) { state.raceHeat -= 4; state.staffTrust += 6; state.publicTrust += 3; state.researchPoints -= 15; },
    signkeep(state) { state.publicTrust += 2; state.flags.brokenPromise = true; },
    decline(state) { state.staffTrust -= 4; },
  }),
  anchor('senateHearing1', 1, 1, 0.83, 'counsel', {
    license(state) { state.govFavor.us += 5; state.raceHeat += 2; state.publicTrust -= 1; },
    candid(state) { state.publicTrust += 5; state.govFavor.us -= 3; state.raceHeat -= 3; },
    counsel(state) { state.publicTrust -= 4; state.govFavor.us -= 2; },
  }),
  anchor('whiteHouseCommitments', 1, 2, 0.55, 'decline', {
    signall(state) { state.govFavor.us += 6; state.security += 8; state.cash -= 10; },
    signskip(state) { state.govFavor.us += 3; state.concealedDebt += 2; state.flags.hollowCommitments = true; },
    decline(state) { state.govFavor.us -= 6; state.raceHeat += 2; },
  }),
  makeEvent('unhinged', {
    fallback: 'preview',
    trigger: (state) => state.era <= 2 && liveModelsWithFlag(state, 'quickEval')
      .some((model) => (model.flags ?? []).includes('jailbreakWaiting') && model.channel === 'consumer'),
    effects: {
      cap(state) {
        for (const model of liveModelsWithFlag(state, 'quickEval')) {
          if (model.channel === 'consumer' && (model.flags ?? []).includes('jailbreakWaiting')) model.users *= 0.9;
        }
        state.publicTrust += 2;
      },
      pull(state) {
        for (const model of liveModelsWithFlag(state, 'quickEval')) {
          if (model.channel === 'consumer' && (model.flags ?? []).includes('jailbreakWaiting')) model.users *= 0.3;
        }
        state.publicTrust += 3;
      },
      preview(state) {
        state.publicTrust -= 6;
        for (const model of liveModelsWithFlag(state, 'quickEval')) {
          if (model.channel === 'consumer' && (model.flags ?? []).includes('jailbreakWaiting')) model.users *= 1.05;
        }
      },
    },
  }),
  makeEvent('countryBan', {
    fallback: 'leave',
    trigger: (state, rng) => state.era <= 2 && liveConsumerModels(state).length > 0
      && hasFlag(state, 'scraped') && rng.chance(0.25),
    effects: {
      comply(state) {
        for (const model of liveConsumerModels(state)) model.users *= 0.95;
        state.cash -= 5; state.govFavor.intl += 4;
      },
      fight(state) {
        state.legalCases.push({ cost: 40, dueTurn: state.turn + 6, source: 'countryBan' });
        state.govFavor.intl -= 6;
      },
      leave(state) {
        for (const model of liveConsumerModels(state)) model.users *= 0.93;
        state.govFavor.intl -= 4;
      },
    },
  }),
  makeEvent('redTeamLie', {
    fallback: 'omit',
    // A release this round that ran full or outside evals. The card is answered after the round mark, when the model
    // may already be live, so it remembers which model the red team tested.
    trigger(state) {
      const index = state.models.findIndex((model) => evaluatedRelease(state, model));
      if (index < 0) return false;
      state.flags.redTeamModel = index;
      return true;
    },
    effects: {
      publish(state) { state.publicTrust -= 2; state.staffTrust += 3; },
      delay(state) {
        // Pulled back (or held) for one more round while its tools are locked down.
        const model = state.models[state.flags.redTeamModel];
        if (model?.active) {
          model.activated = false;
          model.activeFromTurn = Math.max(model.activeFromTurn ?? 0, state.turn) + 1;
        }
        state.alignmentDebt -= 2;
      },
      omit(state) { state.concealedDebt += 3; },
    },
  }),
  makeEvent('exitGag', {
    fallback: 'unaware',
    trigger: (state) => state.era >= 2 && (state.seenEvents.includes('safetyQuits') || state.seenEvents.includes('poached')),
    effects: {
      void(state) { state.staffTrust += 6; state.publicTrust += 2; },
      defend(state) { state.staffTrust -= 6; },
      unaware(state) { state.publicTrust -= 4; state.flags.coverUp = true; },
    },
  }),
  anchor('preReleaseTests', 2, 2, 0.66, 'decline', {
    sign(state) {
      // Every later release waits a round for the government's tests (sim/release.js releaseWait).
      state.govFavor.us += 6; state.security += 4; state.flags.govTesting = true;
    },
    after(state) { state.govFavor.us += 1; },
    decline(state) { state.govFavor.us -= 5; },
  }),
  anchor('stateBill', 2, 2, 0.97, 'fight', {
    back(state) { state.publicTrust += 3; state.govFavor.us += 2; state.board[1] -= 3; },
    amend(state) { state.cash -= 10; state.govFavor.us += 3; },
    fight(state) { state.publicTrust -= 4; state.raceHeat += 2; },
  }),
  makeEvent('voiceLikeness', {
    fallback: 'license',
    trigger: (state, rng) => state.era === 2 && liveConsumerModels(state).length > 0 && rng.chance(0.2),
    effects: {
      pull(state) {
        for (const model of liveConsumerModels(state)) model.users *= 0.8;
        state.sentiment = clamp(state.sentiment - 0.03, 0.5, 1.5);
      },
      keep(state) {
        state.legalCases.push({ cost: 50, dueTurn: state.turn + 4, source: 'voiceLikeness' });
        state.publicTrust -= 3;
      },
      license(state) { state.cash -= 25; },
    },
  }),
  makeEvent('alignmentFaking', {
    fallback: 'file',
    trigger: (state, rng) => state.era >= 2 && (state.pendingModel || state.models.some((model) => model.active))
      && hasEval(state) && rng.chance(0.35),
    effects: {
      publish(state) { exposeConcealed(state, 0.5); state.publicTrust -= 2; state.staffTrust += 3; },
      retrain(state) { if (state.pendingModel) state.pendingModel.releaseDelay += 1; state.alignmentDebt -= 4; },
      file(state) { state.concealedDebt += 4; },
    },
  }),
  anchor('unbiasedOrder', 3, 2, 0.75, 'refuse', {
    certify(state) { state.govFavor.us += 6; state.publicTrust -= 3; state.flags.retuned = true; },
    paper(state) { state.govFavor.us += 4; state.concealedDebt += 2; },
    refuse(state) { state.govFavor.us -= 6; state.publicTrust += 2; },
  }),
  makeEvent('hateMeltdown', {
    fallback: 'blame',
    trigger: (state) => state.era >= 3 && liveConsumerModels(state).length > 0
      && (state.flags.retuned || state.constitution.hardLines.length === 0),
    effects: {
      rollback(state) { state.publicTrust -= 2; state.sentiment = clamp(state.sentiment - 0.05, 0.5, 1.5); },
      keep(state) { state.govFavor.intl -= 8; state.publicTrust -= 8; state.sentiment = clamp(state.sentiment + 0.03, 0.5, 1.5); },
      blame(state) { state.publicTrust -= 6; },
    },
  }),
  makeEvent('evalAwareness', {
    fallback: 'trust',
    trigger: (state) => state.era >= 3 && Boolean(state.pendingModel) && hasEval(state),
    effects: {
      harder(state) { state.cash -= 25; exposeConcealed(state, 0.5); },
      publish(state) { state.publicTrust -= 2; state.staffTrust += 3; exposeConcealed(state, 0.3); },
      trust(state) { state.concealedDebt += 3; },
    },
  }),
  makeEvent('agConditions', {
    fallback: 'negotiate',
    trigger: (state) => state.flags.conversionDeadline != null && !state.flags.converted,
    effects: {
      accept(state) { state.flags.safetyCommitteeVeto = true; state.board = state.board.map((value) => value + 4); state.publicTrust += 3; },
      court(state) { state.cash -= 20; state.flags.conversionDeadline += 2; },
      negotiate(state) { state.flags.conversionDeadline += 1; },
    },
  }),
  makeEvent('copyrightDue', {
    fallback: 'trial',
    trigger: (state) => state.era >= 3 && Boolean(copyrightCase(state)),
    effects: {
      settle(state) {
        const legalCase = copyrightCase(state);
        // A case already paid while the card waited costs nothing more.
        if (!legalCase) return;
        state.legalCases.splice(state.legalCases.indexOf(legalCase), 1);
        state.cash -= 150;
      },
      trial(state) { const legalCase = copyrightCase(state); if (legalCase) legalCase.cost *= 2; },
    },
  }),
  anchor('pentagon', 4, 0, 0.15, 'stall', {
    sign(state) {
      state.govFavor.us += 8; state.staffTrust -= 6;
      const remove = hardLine(state);
      if (remove) forceAmendConstitution(state, { remove }, 'pentagon');
    },
    refuse(state) {
      state.flags.supplyChainRisk = true; state.flags.pentagonRefused = true;
      state.staffTrust += 6; state.govFavor.us -= 8;
    },
    stall(state) {
      state.govFavor.us -= 4; state.flags.supplyChainRisk = true; state.flags.pentagonRefused = true;
    },
  }),
  anchor('agentBreakout', 4, 2, 0.4, 'keep', {
    pause(state) { state.researchPoints -= 15; state.alignmentDebt -= 2; state.raceHeat -= 1; },
    publish(state) { state.publicTrust -= 2; state.staffTrust += 3; exposeConcealed(state, 0.3); },
    keep(state) { state.raceHeat += 2; },
  }),
  makeEvent('droneGenerators', {
    fallback: 'run',
    trigger: (state, rng) => state.era === 4 && Boolean(gasSite(state)) && rng.chance(0.2),
    effects: {
      off(state) {
        const site = gasSite(state);
        if (site) { site.online = false; site.arrivesTurn = state.turn + 1; refreshOnline(state); }
      },
      clean(state) { const site = gasSite(state); if (site) state.cash -= leaseMonthly(site.units) * 2; },
      run(state) { state.publicTrust -= 4; },
    },
  }),
  makeEvent('strandedBuild', {
    fallback: 'build',
    // Remembers the site that raised the card: by the time it is answered the round has moved on.
    trigger(state) {
      const site = state.era === 4 && state.compute.contracts.length > 0 ? strandedSite(state) : null;
      if (!site) return false;
      state.flags.strandedSite = site.id;
      return true;
    },
    effects: {
      cancel(state) {
        const site = state.power.sites.find((candidate) => candidate.id === state.flags.strandedSite);
        if (site) state.power.sites.splice(state.power.sites.indexOf(site), 1);
      },
      renegotiate(state) {
        const site = state.power.sites.find((candidate) => candidate.id === state.flags.strandedSite);
        if (site) site.arrivesTurn += 1;
      },
      build() {},
    },
  }),
  makeEvent('stateSues', {
    fallback: 'fight',
    trigger: (state) => state.era >= 4 && state.seenEvents.includes('companion') && liveConsumerModels(state).length > 0,
    effects: {
      banminors(state) { for (const model of liveConsumerModels(state)) model.users *= 0.85; state.publicTrust += 3; },
      settle(state) { state.cash -= 40; },
      fight(state) { state.legalCases.push({ cost: 80, dueTurn: state.turn + 4, source: 'stateSues' }); },
    },
  }),
  makeEvent('blacklistAppeal', {
    fallback: 'ipo',
    trigger: (state) => state.flags.pentagonRefused && state.era === 4 && state.turnInEra >= 2,
    effects: {
      supreme(state) { state.cash -= 20; state.staffTrust += 4; },
      peace(state) {
        delete state.flags.supplyChainRisk; state.govFavor.us += 6; state.staffTrust -= 6;
        const remove = hardLine(state);
        if (remove) forceAmendConstitution(state, { remove }, 'blacklistAppeal');
      },
      ipo(state) { state.cash += 50; },
    },
  }),
  makeEvent('ratepayer', {
    fallback: 'lobby',
    trigger: (state) => state.era === 4 && state.turnInEra >= 2 && state.power.sites.length > 0,
    effects: {
      back(state) { state.publicTrust += 3; state.flags.ratepayerCosts = true; },
      lobby(state) { state.publicTrust -= 4; },
    },
  }),
  anchor('paceEssay', 5, 0, 0.2, 'refuse', {
    match(state) { exposeConcealed(state, 0.5); state.publicTrust += 4; state.raceHeat -= 2; state.researchPoints -= 20; },
    paper(state) { state.publicTrust += 2; state.flags.hollowCommitments = true; },
    refuse(state) { state.publicTrust -= 4; state.raceHeat += 2; },
  }),
  anchor('pacingLetter', 5, 1, 0.3, 'ignore', {
    endorse(state) { state.staffTrust += 8; state.raceHeat -= 1; state.researchPoints -= 10; },
    thank(state) { state.staffTrust -= 2; },
    ignore(state) { state.staffTrust -= 6; },
  }),
  makeEvent('rivalShips', {
    fallback: 'ship',
    trigger: (state) => state.era === 5 && state.seenEvents.includes('paceEssay'),
    effects: {
      hold(state) { state.publicTrust += 3; },
      callout(state) { state.raceHeat += 5; state.publicTrust += 1; },
      ship(state) { state.raceHeat += 8; },
    },
  }),
  makeEvent('agentWorkdays', {
    fallback: 'free',
    trigger: (state) => state.era === 5 && hasAiWork(state),
    effects: {
      signoff(state) { state.researchPoints -= 5; },
      cap(state) { state.researchPoints -= 10; state.alignmentDebt -= 2; },
      free(state) { state.researchPoints += 20; state.concealedDebt += 3; },
    },
  }),
  makeEvent('clusterSpeedup', {
    fallback: 'deploy',
    trigger: (state, rng) => state.era === 5 && hasAiWork(state) && rng.chance(0.4),
    effects: {
      review(state) { state.researchPoints += 5; },
      keepout() {},
      deploy(state) {
        if (Object.hasOwn(state.compute, 'bonus')) state.compute.bonus += state.compute.online * 0.05;
        else state.researchPoints += 10;
        state.concealedDebt += 2;
      },
    },
  }),
  makeEvent('usChinaChannel', {
    fallback: 'greenlight',
    trigger: (state) => state.era === 5 && state.turnInEra >= 2
      && !(state.deal?.collapsed === false && state.deal.binding?.includes('usChina')),
    effects: {
      share(state) { state.govFavor.us += 3; state.govFavor.intl += 4; state.security -= 3; },
      lobby(state) { state.govFavor.us -= 4; state.publicTrust += 2; },
      greenlight(state) { state.raceHeat += 4; },
    },
  }),
  makeEvent('pauseTraining', {
    fallback: 'keep',
    trigger: (state) => state.era === 5 && state.alignmentDebt + state.concealedDebt >= 40,
    effects: {
      pause(state) { state.researchPoints -= 25; state.alignmentDebt -= 3; },
      partial(state) { state.researchPoints -= 8; state.alignmentDebt -= 2; },
      keep(state) { state.concealedDebt += 3; },
    },
  }),
];
