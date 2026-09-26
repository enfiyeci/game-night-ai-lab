// Copy for the board screens (board UI plan Task 4, spec §6). Every line marked OWNER WRITES is a placeholder the
// owner rewrites. The sim never reads this file. A test forbids time-step words here: time is real now.
// Text is ported from the mockups in docs/design/mockups/board/ (board-data.js, meeting.js, and the L1, L4, P5 and
// 4A frames in board-mock.js), reworded to real time. Directors are always they/them. Templates use {name}-style
// placeholders; fill them with fill() below.

// Fills {key} placeholders from values; a key with no value stays as written, so a gap is visible on screen.
export const fill = (template, values = {}) =>
  template.replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole));

// Small counts in words, for lines an advisor says out loud (index = count).
export const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

// Joining director names in a sentence: "the safety chair, the candor watchdog and the security hawk".
export const THE_NAME = 'the {name}';
export const LIST_SEP = ', ';
export const AND = ' and ';

// ---- directors ------------------------------------------------------------------------------------------------
// Full names live in BOARD_MEMBERS (sim/board.js).
export const SHORT = {
  growth: 'Growth',
  financier: 'Financier',
  sovereign: 'Sovereign',
  safety: 'Safety',
  candor: 'Candor',
  security: 'Security',
  trustee: 'Trustee',
};

// What each director wants, from updateBoard in sim/board.js, in player words (mockup MOVES.wants).
export const WANTS = {
  growth: 'Revenue up, every month',
  financier: 'A rising valuation',
  sovereign: 'A year or more of cash in the bank',
  safety: 'Safety compute at this era’s target',
  candor: 'Being told everything, first',
  security: 'Friends in Washington, tight security',
  trustee: 'Public trust, the constitution intact',
};

// The staff read's lean, as a word.
export const LEAN_WORD = { with: 'With you', leanWith: 'Leaning your way', leanAway: 'Leaning away', against: 'Against you' };

// ---- the board dialog (frame L1) --------------------------------------------------------------------------------
export const BOARD_TITLE = 'The board';
export const BOARD_SUBTITLE = 'Era {era} · {countdown}';
export const TAB_BOARD = 'The board';
// The owner's name for the tab (spec §3, §6.1). The time-word test strips this exact phrase before it checks.
export const TAB_ISSUES = 'What moves the board';
export const TEAM_TITLE = 'Team';
export const CLOSE = 'Close';
export const SEAT_GROUPS = { money: 'Money seats', oversight: 'Oversight seats' };
export const GROUP_NOTE = 'our read of their support';
export const WANTS_PREFIX = 'Wants: ';
export const TREND_WORD = { up: 'warmer', down: 'cooler', flat: 'no change' };
export const SEATS_LINE = 'Between {lo} and {hi} would keep you. You need 4.';
export const SEATS_LINE_EXACT = '{lo} would keep you. You need 4.';

export const TEAM_ON_BOARD = [
  { id: 'policy', mood: 'uneasy', text: 'I make it four. I also made the last election a landslide.' }, // OWNER WRITES
  { id: 'cfo', mood: 'calm', text: 'The money seats are fine. The money seats are always fine until they aren’t.' }, // OWNER WRITES
  { id: 'safety', mood: 'alarmed', text: 'The safety chair asked me for our eval results. I said “soon”. They wrote that down.' }, // OWNER WRITES
  { id: 'research', mood: 'calm', text: 'Which one is the trustee? The one who emails in all caps?' }, // OWNER WRITES
];

export const NEXT_MEETING_TITLE = 'Next meeting';
export const NEXT_ROWS = {
  when: 'When',
  agenda: 'On the agenda',
  read: 'Our read',
  hardest: 'Hardest to read',
  cooling: 'Cooling fastest',
  last: 'Last meeting',
  deals: 'Open deals',
};
export const AGENDA = 'Your job';
export const OUR_READ = '{lo} to {hi} keep you';
export const NOBODY = 'Nobody';
export const LAST_MEETING = { kept: 'Kept, {yes} to {no}', reversed: 'Lost, {yes} to {no}, then the staff letter', removed: 'Removed', none: 'None yet' };
export const NO_DEALS = 'None';
export const NOTE = 'Bars show where your staff think each member is. They have been wrong before.';

// ---- the countdown chip -----------------------------------------------------------------------------------------
export const COUNTDOWN = {
  months: 'Board meets in about {n} months',
  weeks: 'Board meets in {n} weeks',
  days: 'Board meets in {n} days',
  day: 'Board meets in 1 day',
  today: 'Board meets today',
  special: 'Special board meeting at {when}',
  when: { quarter: 'the end of the quarter', month: 'the end of the month', week: 'the end of the week' },
  none: 'No meeting this era',
};
// The same times for the "When" row of the Next meeting panel.
export const WHEN = {
  months: 'In about {n} months',
  weeks: 'In {n} weeks',
  days: 'In {n} days',
  day: 'In 1 day',
  today: 'Today',
  special: 'At {when}',
};

// ---- the warning bubble (Policy and Comms) ----------------------------------------------------------------------
export const WARNING = 'Board meets in {time}. I count {sure} sure. We need four.'; // OWNER WRITES
export const SEE_BOARD = 'See the board ›';
export const TIME_WORDS = { months: 'about {n} months', weeks: '{n} weeks', days: '{n} days', day: 'a day' };

// ---- going quiet (frame P5) ---------------------------------------------------------------------------------------
export const QUIET_LINES = {
  policy: 'Nobody on the board is picking up. I’ve never liked this part.', // OWNER WRITES
  cfo: 'Same. The financier left me on read. They never leave me on read.', // OWNER WRITES
};
export const QUIET_HEAD = 'Board · before the meeting'; // OWNER WRITES
export const QUIET_SEEN = 'Seen';
export const QUIET_FOOT = '7 seen · 0 replies. Your staff can’t read the room right now.'; // OWNER WRITES

// ---- what sways the board (frame L4) ----------------------------------------------------------------------------
export const ISSUE_LABEL = {
  revenue: 'Revenue',
  valuation: 'Valuation',
  cash: 'Cash runway',
  promise: 'Promises',
  safety: 'Safety share',
  honesty: 'Honesty',
  washington: 'Washington',
  security: 'Security',
  trust: 'Public trust',
  constitution: 'Constitution',
};

// What each issue says, by its state. Promises also say whether one is open.
export const ISSUE_SAY = {
  revenue: { up: 'Up lately', down: 'Down lately', flat: 'Flat lately' },
  valuation: { up: 'Up lately', down: 'Down lately', flat: 'Flat lately' },
  cash: { up: 'Over a year', down: 'Running short', flat: 'Under a year' },
  promise: { up: 'Kept', down: 'One broke or leaked', flat: 'None open', open: 'One open' },
  safety: { up: 'At target', down: 'Under target', flat: 'At target' },
  honesty: { up: 'Nothing new', down: 'Something came out', flat: 'Nothing new' },
  washington: { up: 'Warming', down: 'Cooling', flat: 'Steady' },
  security: { up: 'Strong', down: 'Weak', flat: 'Holding' },
  trust: { up: 'Healthy', down: 'Too low', flat: 'Steady' },
  constitution: { up: 'Intact', down: 'Hard lines dropped', flat: 'Intact' },
};

// A line in the meeting's "What they'll raise" list: "Safety share under target".
export const RAISE = '{label} {say}';
export const ISSUE_KEY = { up: 'pushing them toward you', down: 'pushing them away', flat: 'quiet' };
// The map's label for screen readers.
export const MAP_LABEL = 'Which issues sway which director, and which way';
// The tip under L4. Every director is they/them, so the pronouns are written in.
export const WORRY = '{name}: {issue} is slipping, and they are leaning away. Fix it before the meeting, or plan without them.'; // OWNER WRITES

// ---- deals (spec §5.2) -------------------------------------------------------------------------------------------
export const DEAL_TEXT = {
  growth: 'Revenue up a fifth by the next meeting',
  financier: 'A higher valuation by the next meeting',
  sovereign: 'A year of cash at the next meeting',
  safety: 'Safety compute at target by the next meeting',
  candor: 'No hidden problems come out before the next meeting',
  security: 'Security above 40 by the next meeting',
  trustee: 'Public trust above 55 by the next meeting',
};
export const DEAL_WHY = { lost: 'No longer takes your calls', open: 'A deal is already open' };

// ---- the meeting: the call rings ----------------------------------------------------------------------------------
export const RING = {
  kicker: 'Incoming video call',
  title: 'Board of directors',
  gate: 'Board meeting · end of era {era}',
  special: 'Special meeting · era {era}',
  promise: 'Special meeting · the compute promise', // OWNER WRITES
  emergency: 'Emergency meeting · era {era}', // OWNER WRITES
  motion: 'Motion: remove the chief executive',
  join: 'Join',
  decline: 'Decline',
};
export const DECLINE_JOKE = 'The board will minute that you declined.'; // OWNER WRITES
export const MEETING_LABEL = 'Board meeting';

// ---- the meeting: the room ------------------------------------------------------------------------------------------
export const MOTION = 'Motion: remove the chief executive';
export const MINUTES = 'Minutes are being recorded';
export const VOTE_OPENS = 'vote opens in {time}';
export const LEAN_BAR = { keep: '{n} keep', maybe: '{n} undecided', remove: '{n} remove' };
export const YOU = 'You';
export const LEAVE = 'Leave';
export const LEAVE_JOKE = 'The chair would like to remind you that the motion is about you.'; // OWNER WRITES

export const NOTES_HEAD = 'Your notes · only you see this';
export const NOTES = {
  read: 'Staff read',
  readCaveat: '· can be wrong',
  readLine: '{lo} to {hi} keep you',
  readExact: '{lo} keep you',
  need: '· you need 4',
  raise: 'What they’ll raise',
  swing: 'Could go either way',
  noSwing: 'Nobody, your staff think. They have been wrong before.', // OWNER WRITES
  messaging: '{a} and {b} are messaging each other',
  dealsHead: 'Offer deals before the vote · any number',
  noDeal: 'No deal. Let the numbers talk.',
  dealsMade: 'Deals made · {n}',
  dealsAfter: 'They moved your way. By how much, your staff can’t say.',
};
export const DEAL_FINE = 'Each deal you break later costs you that member for good.';
export const CALL_VOTE = 'Call the vote';

// One line per director, raising their issue while the room waits.
export const CAPTIONS = {
  growth: 'Revenue. I want to talk about revenue. Can we go faster?', // OWNER WRITES
  financier: 'The build-out story is good. Keep the story good.', // OWNER WRITES
  sovereign: 'We are patient money. Patient money likes a year of cash in the bank.', // OWNER WRITES
  safety: 'Safety compute against this era’s target. I have a slide. I have several slides.', // OWNER WRITES
  candor: 'I would like to hear the bad news from you first, for once.', // OWNER WRITES
  security: 'Washington likes you, so I like you. That can change by Thursday.', // OWNER WRITES
  trustee: 'I read the news this week. I would like to talk about public trust.', // OWNER WRITES
};

// ---- the meeting: the vote ----------------------------------------------------------------------------------------------
export const CHAIR = 'Chair of the board';
export const CHAIR_OPEN = 'The motion is on the floor. One vote each, please.'; // OWNER WRITES
export const VOTING = 'Voting';
export const VOTE_CARD = { keep: 'Keep', remove: 'Remove', pending: '…' };
export const METER = '{keep} keep · {remove} remove · 4 keep you';
// Reduced motion: the reveal waits for the player, one director at a time.
export const NEXT_VOTE = 'Next vote';
export const CONTINUE = 'Continue';

export const VOTE_LINES = {
  growth: {
    keep: 'Keep. Obviously. Can we be quick, I have a flight.', // OWNER WRITES
    remove: 'Remove. Revenue is the whole job, and the job isn’t getting done.', // OWNER WRITES
  },
  financier: {
    keep: 'Keep. The build-out needs a steady hand.', // OWNER WRITES
    remove: 'Remove. The build-out needs a steadier hand than this.', // OWNER WRITES
  },
  sovereign: {
    keep: 'Keep. For now.', // OWNER WRITES
    remove: 'Remove. Patient money has run out of patience.', // OWNER WRITES
  },
  safety: {
    keep: 'Keep. Safety is at target. Keep it there and we will keep talking.', // OWNER WRITES
    remove: 'Remove. I asked for safety at target. I have asked for two eras.', // OWNER WRITES
  },
  candor: {
    keep: 'Keep. You told me the bad news yourself. Keep doing that.', // OWNER WRITES
    remove: 'Remove. I keep learning things from the press first.', // OWNER WRITES
  },
  security: {
    keep: 'Keep. Washington likes you. That is most of my reason.', // OWNER WRITES
    remove: 'Remove. Washington has cooled on you, and so have I.', // OWNER WRITES
  },
  trustee: {
    keep: 'Keep. The public still trusts you. Just about.', // OWNER WRITES
    remove: 'Remove. I kept you last time. I read the news this time.', // OWNER WRITES
  },
};

// ---- the meeting: the result --------------------------------------------------------------------------------------------
export const RESULT_SCORE = '{yes} to {no}';
export const RESULT_STAY = 'You stay.'; // OWNER WRITES
export const RESULT_GO = 'The motion passes.'; // OWNER WRITES
export const MOTION_FAILS = 'The motion fails';
export const MOTION_PASSES = 'The motion passes';
export const LETTER_KICKER = 'Open letter to the board'; // OWNER WRITES
export const STAFF_TWIST = [
  'The motion passes. Security is walking you out.', // OWNER WRITES
  'Then the messages start. Most of the lab has signed a letter: if you go, they go.', // OWNER WRITES
  'The board backs down. You stay.', // OWNER WRITES
];

// ---- the result dialog (frame 4A) -----------------------------------------------------------------------------------
export const RESULT_TITLE = 'The board votes';
export const RESULT_SUBTITLE = {
  gate: 'End of era {era} · motion to remove the chief executive',
  special: 'Special meeting · motion to remove the chief executive',
  promise: 'Special meeting on the compute promise · motion to remove the chief executive', // OWNER WRITES
  emergency: 'Emergency meeting · motion to remove the chief executive', // OWNER WRITES
};
export const RESULT_LINE = {
  close: 'You stay, by one vote.', // OWNER WRITES
  stay: 'You stay.', // OWNER WRITES
  removed: 'The board removes you.', // OWNER WRITES
  reversed: 'The board voted you out, then backed down.', // OWNER WRITES
};
export const WHY = {
  moneyPlus: 'The three money seats kept you, and {names} made it {count}.', // OWNER WRITES
  keptBy: '{names} kept you.', // OWNER WRITES
  notEnough: '{names} voted to keep you. It was not enough.', // OWNER WRITES
  nobody: 'Nobody kept you.', // OWNER WRITES
  switchedAway: '{name}, who kept you last time, voted to remove you this time.', // OWNER WRITES
  switchedBack: '{name}, who voted against you last time, kept you this time.', // OWNER WRITES
};
export const TEAM_AFTER_VOTE = [
  { id: 'cfo', mood: 'calm', text: 'Four is a majority. I checked. Twice.' }, // OWNER WRITES
  { id: 'safety', mood: 'alarmed', text: 'We kept the job and lost the trustee. That trade gets worse.' }, // OWNER WRITES
  { id: 'policy', mood: 'uneasy', text: 'Nobody leak the three. Please.' }, // OWNER WRITES
];
// When the vote removes you (the film follows the dialog).
export const TEAM_AFTER_REMOVAL = [
  { id: 'cfo', mood: 'alarmed', text: 'I have the handover numbers ready. Nobody has asked for them yet.' }, // OWNER WRITES
  { id: 'safety', mood: 'uneasy', text: 'Whoever they bring in, I hope they read the eval reports.' }, // OWNER WRITES
  { id: 'policy', mood: 'alarmed', text: 'The press release is already out. They wrote it last week.' }, // OWNER WRITES
];
export const LEAVE_THE_CALL = 'Leave the call'; // OWNER WRITES
export const SINCE_TITLE = 'Since the last vote';
export const SINCE_KEEPS = 'now keeps you';
export const SINCE_AGAINST = 'now against you';
export const SINCE_LAST = 'Last vote';
export const SINCE_THIS = 'This vote';
export const SINCE_SCORE = '{yes} to {no}';
export const SINCE_FIRST = 'First vote';
export const SINCE_NOTE = {
  same: 'Same score, different people.', // OWNER WRITES
  next: 'The next vote is at the end of era {era}.',
  none: 'No more votes are scheduled.',
};
export const BACK_TO_WORK = 'Back to work';
