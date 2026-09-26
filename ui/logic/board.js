// The board screens' view logic (board UI plan Task 4, spec §5.4 and §6). Pure; no DOM. Every player-facing string
// comes from ui/data/boardCopy.js. Support is never passed on as a number: only the staff read's bands (lo, hi) and
// counts of seats.
import { BOARD_MEMBERS, boardSnapshot, boardVoteThisRound } from '../../sim/board.js';
import { boardRead } from '../../sim/boardRead.js';
import { eraById } from '../../sim/data/eras.js';
import { nextRoundDay, roundMarkDay, roundWord } from '../../sim/time.js';
import { inDangerZone, runway } from '../../sim/economy.js';
import { openDeal } from '../../sim/boardDeals.js';
import * as COPY from '../data/boardCopy.js';
import { moodForLean } from '../components/portraits.js';

const DAYS_PER_MONTH = 30.44;
const { fill } = COPY;
export const ISSUE_ORDER = ['revenue', 'valuation', 'cash', 'promise', 'safety', 'honesty', 'washington', 'security', 'trust', 'constitution'];
// Which issues move which director: straight from updateBoard in sim/board.js.
export const ISSUE_LINKS = {
  growth: ['revenue'], financier: ['valuation', 'promise'], sovereign: ['cash'], safety: ['safety'],
  candor: ['honesty', 'promise'], security: ['washington', 'security'], trustee: ['trust', 'constitution'],
};

const nameOf = (id) => BOARD_MEMBERS.find((member) => member.id === id).name;
const inline = (id) => fill(COPY.THE_NAME, { name: nameOf(id).toLowerCase() });
const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const inWords = (n) => COPY.NUMBER_WORDS[n] ?? String(n);
function listOf(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(COPY.LIST_SEP) + COPY.AND + items.at(-1);
}

// The next board meeting (spec §5.4), in story days from the state (sim/time.js), never from the clock. Only gate eras
// have a scheduled one, at the mark ending the era's last round; a called vote (a missed promise, the emergency card,
// era 5's forecast) is a special meeting at the mark ending the current round.
export function meetingInfo(state) {
  if (state.ending) return null;
  const era = eraById(state.era);
  const thisRound = boardVoteThisRound(state);
  const special = thisRound && !(era.boardVoteAtGate && state.turnInEra === era.turns - 1);
  if (!special && !era.boardVoteAtGate) return null;
  const marks = special ? 1 : era.turns - state.turnInEra;
  return { kind: special ? 'special' : 'gate', thisRound, days: roundMarkDay(state, marks) - state.day, word: roundWord(state.era) };
}

// The board meeting opens on the last story day before the mark that holds a vote (the real-time lane's hook).
export const meetingDueNow = (state) => !state.ending && nextRoundDay(state) - state.day === 1 && boardVoteThisRound(state);

// Which time template fits: months from 60 days, weeks from 14, then days.
function timeKey(days) {
  if (days >= 60) return { key: 'months', n: Math.round(days / DAYS_PER_MONTH) };
  if (days >= 14) return { key: 'weeks', n: Math.round(days / 7) };
  if (days < 1) return { key: 'today', n: 0 };
  const whole = Math.round(days);
  return whole === 1 ? { key: 'day', n: 1 } : { key: 'days', n: whole };
}

function timeText(info, templates) {
  if (!info) return COPY.COUNTDOWN.none;
  if (info.kind === 'special') return fill(templates.special, { when: COPY.COUNTDOWN.when[info.word] });
  const { key, n } = timeKey(info.days);
  return fill(templates[key], { n });
}

export const countdownText = (info) => timeText(info, COPY.COUNTDOWN);
const whenText = (info) => timeText(info, COPY.WHEN);

// Time as an advisor says it: "four weeks", "six days".
function spokenTime(days) {
  if (days >= 60) return fill(COPY.TIME_WORDS.months, { n: inWords(Math.round(days / DAYS_PER_MONTH)) });
  if (days >= 14) return fill(COPY.TIME_WORDS.weeks, { n: inWords(Math.round(days / 7)) });
  const whole = Math.round(days);
  return whole <= 1 ? COPY.TIME_WORDS.day : fill(COPY.TIME_WORDS.days, { n: inWords(whole) });
}

// Policy and Comms' warning (spec §5.4): a meeting at most a month (31 story days) away and fewer than four sure seats
// in the read.
export function boardWarning(state, read = boardRead(state)) {
  const info = meetingInfo(state);
  if (!info || info.days > 31 || read.tally.sure >= 4) return null;
  return { text: fill(COPY.WARNING, { time: spokenTime(info.days), sure: inWords(read.tally.sure) }) };
}

const seatsLine = (tally) => (tally.lo === tally.hi
  ? fill(COPY.SEATS_LINE_EXACT, tally)
  : fill(COPY.SEATS_LINE, tally));

// The board tab (frame L1).
export function boardView(state) {
  const read = boardRead(state);
  const last = state.boardLast ?? state.board;
  const lost = new Set(state.boardLost ?? []);
  const members = BOARD_MEMBERS.map((member, i) => {
    const { lo, hi, lean } = read.members[i];
    const change = state.board[i] - last[i];
    return {
      id: member.id,
      name: member.name,
      short: COPY.SHORT[member.id],
      kind: member.kind,
      wants: COPY.WANTS[member.id],
      lo,
      hi,
      lean,
      leanWord: COPY.LEAN_WORD[lean],
      mood: moodForLean(lean),
      trend: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat',
      dealOpen: openDeal(state, member.id),
      lost: lost.has(member.id),
    };
  });
  return { members, tally: read.tally, seatsLine: seatsLine(read.tally) };
}

function lastMeetingText(record) {
  if (!record) return COPY.LAST_MEETING.none;
  const score = { yes: record.yes, no: BOARD_MEMBERS.length - record.yes };
  if (record.reversedByStaff) return fill(COPY.LAST_MEETING.reversed, score);
  return record.passed ? fill(COPY.LAST_MEETING.kept, score) : COPY.LAST_MEETING.removed;
}

// The "Next meeting" panel beside the board tab.
export function nextMeetingRows(state) {
  const read = boardRead(state);
  const info = meetingInfo(state);
  const last = state.boardLast ?? state.board;
  const widest = read.members.reduce((best, member) => (member.hi - member.lo > best.hi - best.lo ? member : best));
  let cooling = null;
  state.board.forEach((support, i) => {
    const change = support - last[i];
    if (change < -0.5 && (cooling === null || change < cooling.change)) cooling = { id: BOARD_MEMBERS[i].id, change };
  });
  const open = (state.boardDeals ?? []).filter((deal) => deal.status === 'open').length;
  return [
    [COPY.NEXT_ROWS.when, info ? whenText(info) : COPY.COUNTDOWN.none],
    [COPY.NEXT_ROWS.agenda, COPY.AGENDA],
    [COPY.NEXT_ROWS.read, fill(COPY.OUR_READ, read.tally)],
    [COPY.NEXT_ROWS.hardest, nameOf(widest.id)],
    [COPY.NEXT_ROWS.cooling, cooling ? nameOf(cooling.id) : COPY.NOBODY],
    [COPY.NEXT_ROWS.last, lastMeetingText(state.flags.lastBoardVote)],
    [COPY.NEXT_ROWS.deals, open ? capitalise(inWords(open)) : COPY.NO_DEALS],
  ];
}

const leakedCount = (state) => state.promises.filter((promise) => promise.leaked).length;
const compare = (now, then) => (now > then ? 'up' : now < then ? 'down' : 'flat');

// Each issue's state this round (frame L4): the snapshot taken at the start of the last round (sim/turn.js) against now, judged the way
// updateBoard judges it.
function issueStates(state) {
  const before = state.boardBefore ?? boardSnapshot(state);
  const now = boardSnapshot(state);
  const promiseSlipped = now.leaked > before.leaked || (now.brokenPromise && !before.brokenPromise);
  return {
    revenue: compare(now.arr, before.arr),
    valuation: compare(now.valuation, before.valuation),
    cash: inDangerZone(state) ? 'down' : runway(state, 'planned') >= 12 ? 'up' : 'flat',
    promise: promiseSlipped ? 'down' : 'flat',
    safety: state.compute.split.safety + 1e-9 >= eraById(state.era).targetSafetyShare ? 'up' : 'down',
    honesty: before.concealedDebt - now.concealedDebt > 0.5 || promiseSlipped ? 'down' : 'flat',
    washington: compare(now.govUs, before.govUs),
    security: state.security < 35 ? 'down' : 'flat',
    trust: state.publicTrust >= 55 ? 'up' : 'down',
    constitution: now.hardLines < before.hardLines ? 'down' : 'flat',
  };
}

export function issuesView(state) {
  const states = issueStates(state);
  return ISSUE_ORDER.map((id) => {
    const issueState = states[id];
    const words = COPY.ISSUE_SAY[id];
    const say = id === 'promise' && issueState === 'flat' && state.boardPromise?.status === 'open' ? words.open : words[issueState];
    return { id, label: COPY.ISSUE_LABEL[id], state: issueState, say };
  });
}

// The director to worry about: leaning away (or against, when nobody leans away) with an issue pushing them away.
function worryPick(state) {
  const read = boardRead(state);
  const down = new Set(issuesView(state).filter((issue) => issue.state === 'down').map((issue) => issue.id));
  for (const lean of ['leanAway', 'against']) {
    for (const member of read.members) {
      if (member.lean !== lean) continue;
      const issue = ISSUE_LINKS[member.id].find((id) => down.has(id));
      if (issue) return { id: member.id, issue };
    }
  }
  return null;
}

// Which director the tip names, so the map can highlight them and their links.
export const worryMember = (state) => worryPick(state)?.id ?? null;

export function worryTip(state) {
  const pick = worryPick(state);
  return pick ? fill(COPY.WORRY, { name: nameOf(pick.id), issue: COPY.ISSUE_LABEL[pick.issue], ...COPY.PRONOUN[pick.id] }) : null;
}

export function dealOptions(state) {
  const lost = new Set(state.boardLost ?? []);
  return BOARD_MEMBERS.map((member) => {
    const why = lost.has(member.id) ? COPY.DEAL_WHY.lost : openDeal(state, member.id) ? COPY.DEAL_WHY.open : null;
    return { member: member.id, name: member.name, text: COPY.DEAL_TEXT[member.id], disabled: why !== null, why };
  });
}

// The meeting's model (spec §6.4): what they will raise, who could swing, and the deals on offer.
export function meetingModel(state) {
  const read = boardRead(state);
  const issues = issuesView(state);
  const movers = (issueId) => BOARD_MEMBERS.filter((member) => ISSUE_LINKS[member.id].includes(issueId)).map((member) => COPY.SHORT[member.id]);
  const raise = ['down', 'up'].flatMap((dir) => issues.filter((issue) => issue.state === dir))
    .slice(0, 4)
    .map((issue) => ({
      text: fill(COPY.RAISE, { label: issue.label, say: issue.say.toLowerCase() }),
      who: listOf(movers(issue.id)),
      dir: issue.state,
    }));
  const swing = read.members.filter((member) => member.lean === 'leanWith' || member.lean === 'leanAway').map((member) => member.id);
  const away = read.members.filter((member) => member.lean === 'leanAway').map((member) => member.id);
  return {
    era: state.era,
    kind: meetingInfo(state)?.kind ?? 'gate',
    tally: read.tally,
    raise,
    swing,
    messaging: away.length >= 2 ? away.slice(0, 2) : null,
    deals: dealOptions(state),
  };
}

const votesById = (record) => Object.fromEntries(BOARD_MEMBERS.map((member, i) => [member.id, record.votes[i] ? 'keep' : 'remove']));

// The vote as the sim held it, for the reveal: null when no vote was held between the two states.
export function voteReveal(before, after) {
  if ((after.flags.boardVotesHeld ?? 0) <= (before.flags.boardVotesHeld ?? 0)) return null;
  const record = after.flags.lastBoardVote;
  return {
    order: record.order.map((i) => BOARD_MEMBERS[i].id),
    votes: votesById(record),
    yes: record.yes,
    passed: record.passed,
    reversedByStaff: Boolean(record.reversedByStaff),
    kind: record.kind,
  };
}

// One line on why (frame 4A): who kept you, and who switched since the last vote.
function whyText(record, prev) {
  const keepers = BOARD_MEMBERS.filter((_, i) => record.votes[i]);
  const money = BOARD_MEMBERS.filter((member) => member.kind === 'money');
  let why;
  if (keepers.length === 0) why = COPY.WHY.nobody;
  else if (!record.passed) why = fill(COPY.WHY.notEnough, { names: capitalise(listOf(keepers.map((member) => inline(member.id)))) });
  else if (money.every((member) => keepers.includes(member)) && keepers.length > money.length) {
    const others = keepers.filter((member) => member.kind !== 'money').map((member) => inline(member.id));
    why = fill(COPY.WHY.moneyPlus, { names: listOf(others), count: inWords(keepers.length) });
  } else {
    why = fill(COPY.WHY.keptBy, { names: capitalise(listOf(keepers.map((member) => inline(member.id)))) });
  }
  if (!prev?.votes) return why;
  const away = BOARD_MEMBERS.findIndex((_, i) => prev.votes[i] && !record.votes[i]);
  const back = BOARD_MEMBERS.findIndex((_, i) => !prev.votes[i] && record.votes[i]);
  if (away >= 0) return `${why} ${fill(COPY.WHY.switchedAway, { name: capitalise(inline(BOARD_MEMBERS[away].id)) })}`;
  if (back >= 0) return `${why} ${fill(COPY.WHY.switchedBack, { name: capitalise(inline(BOARD_MEMBERS[back].id)) })}`;
  return why;
}

// The result dialog (frame 4A), from the vote record the sim kept.
export function resultModel(after) {
  const record = after.flags.lastBoardVote;
  const prev = after.flags.prevBoardVote;
  const no = BOARD_MEMBERS.length - record.yes;
  const score = (yes) => fill(COPY.SINCE_SCORE, { yes, no: BOARD_MEMBERS.length - yes });
  const since = prev?.votes
    ? [
      ...BOARD_MEMBERS.flatMap((member, i) => (prev.votes[i] === record.votes[i] ? []
        : [[member.name, record.votes[i] ? COPY.SINCE_KEEPS : COPY.SINCE_AGAINST]])),
      [COPY.SINCE_LAST, score(prev.yes)],
      [COPY.SINCE_THIS, score(record.yes)],
    ]
    : [[COPY.SINCE_FIRST, score(record.yes)]];
  return {
    seats: BOARD_MEMBERS.map((member, i) => ({ id: member.id, name: member.name, keep: record.votes[i] })),
    yes: record.yes,
    no,
    passed: record.passed,
    reversedByStaff: Boolean(record.reversedByStaff),
    why: whyText(record, prev),
    since,
  };
}
