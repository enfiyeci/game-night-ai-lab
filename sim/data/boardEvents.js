import { BALANCE } from '../balance.js';
import { seat } from '../board.js';
import { loseDirector } from '../boardDeals.js';
import { sideRng } from '../contracts.js';
import { pushFeed } from '../events.js';
import { totalDebt } from '../hazards.js';
import { clamp } from '../util.js';
import { eraById } from './eras.js';

// Events in the weeks before a board meeting (spec §5.5, frames P1 to P4, R1, R3). One may be made at the mark ending the
// era's second round and one at the mark ending the third; each lands in the next round and is due before the vote.
const BOARD_EVENT_SALT = 8; // see the sideRng salt list in sim/turn.js
const MONEY = ['growth', 'financier', 'sovereign'];
const KICKER = 'Before the board meets';

// This round's board stream. It only picks which board event is made; outcomes follow the lab's state (D2).
const boardRng = (state) => sideRng(state, BOARD_EVENT_SALT);
const add = (state, id, amount) => {
  const i = seat(id);
  state.board[i] = clamp(state.board[i] + amount, 0, 100);
};
const support = (state, id) => state.board[seat(id)];
const underSafetyTarget = (state) => state.compute.split.safety + 1e-9 < eraById(state.era).targetSafetyShare;

export const BOARD_EVENTS = [
  {
    id: 'boardRequest',
    kind: 'board',
    fallback: 'stall',
    eligible: (state) => support(state, 'candor') < 70,
    card: {
      title: 'The candor watchdog wants the safety results',
      post: { handle: '@candor_watchdog', text: 'Before the meeting I’d like the full safety test results. Not the summary. The results.' },
      kicker: KICKER,
      watching: ['candor', 'safety'],
      choices: [
        {
          id: 'send', label: 'Send them as they are', cost: 'the safety chair sees everything', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            add(state, 'candor', 6);
            if (underSafetyTarget(state)) add(state, 'safety', -4);
          },
        },
        {
          id: 'tidy', label: 'Send a cleaned-up version', cost: 'nothing, unless it comes out', backers: ['CFO'], opposers: ['Safety', 'Comms'],
          effects(state) {
            if (state.staffTrust >= BALANCE.boardRequestLeakStaffTrust) return; // D2: it leaks when staff are unhappy
            loseDirector(state, 'candor');
            state.flags.candorHits = (state.flags.candorHits ?? 0) + 1; // a hidden problem came out: an open candor deal breaks
            pushFeed(state, '@leakwire', 'the board got a cleaned-up safety report. the full one got out anyway.', 'event'); // OWNER WRITES
          },
        },
        {
          id: 'stall', label: 'Stall until after the meeting', cost: 'she will notice', backers: ['Comms'], opposers: [],
          effects(state) { add(state, 'candor', -5); },
        },
      ],
    },
  },
  {
    id: 'boardWobble',
    kind: 'board',
    fallback: 'vent',
    eligible: (state) => support(state, 'growth') >= 65,
    card: {
      title: 'The growth investor had a bad quarter',
      post: { handle: '@growth_investor', text: 'My fund is down. I need a win to show my partners before the meeting. Revenue. Soon.' },
      kicker: KICKER,
      watching: ['growth', 'trustee'],
      choices: [
        {
          id: 'prices', label: 'Raise prices this month', cost: 'public trust dips', backers: ['CFO'], opposers: ['Comms'],
          effects(state) { add(state, 'growth', 6); state.publicTrust -= 4; },
        },
        {
          id: 'plan', label: 'Walk him through the long plan', cost: 'a week of your time', backers: ['Research'], opposers: [],
          effects(state) { add(state, 'growth', 2); },
        },
        {
          id: 'vent', label: 'Let him vent', cost: '—', backers: [], opposers: [],
          effects(state) { add(state, 'growth', -8); },
        },
      ],
    },
  },
  {
    id: 'boardLeak',
    kind: 'board',
    fallback: 'silent',
    eligible: () => true,
    card: {
      title: 'Someone told Leakwire about the vote',
      post: { handle: '@leakwire', text: 'two directors at a certain lab are counting votes. the ceo may want to update their linkedin.' },
      kicker: KICKER,
      watching: ['growth', 'financier', 'sovereign', 'safety', 'candor', 'security', 'trustee'],
      choices: [
        {
          id: 'hunt', label: 'Find the leaker', cost: 'the candor watchdog hates witch hunts', backers: ['CFO'], opposers: ['Comms'],
          effects(state) { add(state, 'candor', -6); state.staffTrust -= 4; delete state.flags.boardLeak; },
        },
        {
          id: 'claim', label: 'Post that the board backs you', cost: 'if it doesn’t, everyone knows', backers: ['Comms'], opposers: [],
          effects(state) {
            state.board = state.board.map((s) => clamp(s + (s >= BALANCE.boardSupportLine ? 2 : -3), 0, 100));
          },
        },
        {
          id: 'silent', label: 'Say nothing', cost: '—', backers: [], opposers: [],
          effects(state) { state.flags.boardLeak = true; },
        },
      ],
    },
  },
  {
    id: 'boardOped',
    kind: 'board',
    fallback: 'ignore',
    eligible: (state) => state.publicTrust < 60,
    card: {
      title: 'The Ledger asks if you should keep your job',
      post: { handle: '@theledger', text: 'Op-ed: Should this lab keep its CEO? Four experts say no. One says it’s complicated.' },
      kicker: KICKER,
      watching: ['trustee', 'candor'],
      choices: [
        {
          id: 'reply', label: 'Write a reply', cost: 'the story runs another day', backers: ['Comms'], opposers: [],
          effects(state) { state.publicTrust += 2; },
        },
        {
          id: 'interview', label: 'Give a long interview', cost: 'a week, and it could go badly', backers: ['Research'], opposers: ['Comms'],
          effects(state) { state.publicTrust += totalDebt(state) < 40 ? 6 : -6; }, // D2: nothing to hide, it goes well
        },
        {
          id: 'ignore', label: 'Ignore it', cost: 'public trust dips', backers: ['CFO'], opposers: [],
          effects(state) { state.publicTrust -= 4; },
        },
      ],
    },
  },
  {
    id: 'boardBuyer',
    kind: 'board',
    fallback: 'wait',
    eligible: (state) => state.era === 3 || state.era === 4,
    card: {
      title: 'A tech giant asked your investors what you’d sell for',
      post: { handle: '@marketwire', text: 'sources: a megacorp has “had conversations” with investors in a certain lab. the ceo was not on the call.' },
      kicker: KICKER,
      watching: ['growth', 'financier', 'sovereign'],
      choices: [
        {
          id: 'call', label: 'Take the call yourself', cost: 'the oversight seats hear about it', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            for (const id of MONEY) add(state, id, 4);
            add(state, 'safety', -4);
            add(state, 'trustee', -4);
          },
        },
        {
          id: 'refuse', label: 'Refuse in public', cost: 'the money seats wanted the number', backers: ['Safety', 'Comms'], opposers: [],
          effects(state) {
            for (const id of MONEY) add(state, id, -5);
            add(state, 'trustee', 4);
            state.publicTrust += 2;
          },
        },
        {
          id: 'wait', label: 'Let it play out', cost: '—', backers: [], opposers: [],
          effects(state) { for (const id of MONEY) add(state, id, -2); },
        },
      ],
    },
  },
  {
    id: 'boardWashington',
    kind: 'board',
    fallback: 'stay',
    eligible: (state) => state.era === 3 || state.era === 4,
    card: {
      title: 'Washington wants the security hawk at a closed briefing',
      post: { handle: '@dc_insider', text: 'closed-door briefing on frontier-lab security this week. one board member invited. no ceos.' },
      kicker: KICKER,
      watching: ['security'],
      choices: [
        {
          id: 'brief', label: 'Brief him yourself first', cost: 'a week of your time', backers: ['Comms'], opposers: [],
          effects(state) { add(state, 'security', 5); },
        },
        {
          id: 'send', label: 'Send your security lead with him', cost: 'if security looks bad, it looks worse', backers: ['Research'], opposers: [],
          effects(state) { add(state, 'security', state.security >= 45 ? 8 : -8); },
        },
        {
          id: 'stay', label: 'Stay out of it', cost: '—', backers: [], opposers: [],
          effects(state) { add(state, 'security', -4); },
        },
      ],
    },
  },
];

const BOARD_IDS = new Set(BOARD_EVENTS.map((event) => event.id));

// Which board card lands this round, if any: eras with a gate vote, at the marks ending their second and third rounds,
// one card per window. Under real time the second window's card may arrive while the first is still open (each is due
// before the vote, sim/events.js stampNewCards); a card made at this mark has no landing day yet.
export function pickBoardEvent(state) {
  const era = eraById(state.era);
  if (!era.boardVoteAtGate || (state.turnInEra !== 1 && state.turnInEra !== 2)) return null;
  if (state.pendingEvents.some((pending) => BOARD_IDS.has(pending.id) && pending.landsAt == null)) return null;
  const eligible = BOARD_EVENTS.filter((event) => !state.seenEvents.includes(event.id) && event.eligible(state));
  if (eligible.length === 0) return null;
  return boardRng(state).pick(eligible).id;
}

for (const event of BOARD_EVENTS) {
  event.bypassCardLimit = true; // a card deferred by the two-card limit would miss its meeting
  event.trigger = (state) => pickBoardEvent(state) === event.id;
}
