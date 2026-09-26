// Copy and timing for the event cards and warnings (plan 2B Task 8).
// Every line marked OWNER WRITES is a placeholder: the owner rewrites it when going through the events.
// The sim never reads this file. Never write the word "turn" here (a test checks).

// Which advisor raises each warning at their desk (owner-approved 2026-09-26).
export const WARNING_ADVISOR = {
  flattery: 'safety',
  jailbreak: 'safety',
  promise: 'safety',
  openletter: 'safety',
  contamination: 'research',
  distill: 'research',
  weightTheft: 'research',
  safetyQuits: 'research',
  agentwreck: 'cfo',
  neocloudTrouble: 'cfo',
  citations: 'policy',
  companion: 'policy',
  siteOpposition: 'policy',
  whistleblower: 'policy',
};

// Story time each card waits before it resolves on its own ({time} is filled in).
// First guesses, to tune after the first playthrough.
export const DEFAULT_TIMING = Object.freeze({ days: 21, due: 'Answer within {time}' }); // OWNER WRITES
export const TIMING = {
  weightTheft: { days: 14, due: 'The leak goes public in {time}' }, // OWNER WRITES
  selfExfiltration: { days: 3, due: 'The copy finishes in {time}' }, // OWNER WRITES
  whistleblower: { days: 9, due: 'The story runs in {time}' }, // OWNER WRITES
  safetyQuits: { days: 7, due: 'Their post is trending. Answer within {time}' }, // OWNER WRITES
  jailbreak: { days: 5, due: 'The thread is spreading. Answer within {time}' }, // OWNER WRITES
  oversightTamper: { days: 3, due: 'Answer within {time}' }, // OWNER WRITES
  agentSurge: { days: 4, due: 'The servers fall over in {time}' }, // OWNER WRITES
  lossSpike: { days: 5, due: 'The run stalls in {time}' }, // OWNER WRITES
  capabilityJump: { days: 5, due: 'Answer within {time}' }, // OWNER WRITES
  viralDemo: { days: 5, due: 'The buzz fades in {time}' }, // OWNER WRITES
  agentwreck: { days: 7, due: 'Answer within {time}' }, // OWNER WRITES
  neocloudTrouble: { days: 10, due: 'They run out of cash in {time}' }, // OWNER WRITES
  priceWar: { days: 10, due: 'Answer within {time}' }, // OWNER WRITES
  boardRevolt: { days: 14, due: 'The board votes in {time}' }, // OWNER WRITES
  senateHearing: { days: 30, due: 'The hearing is in {time}' }, // OWNER WRITES
  pooling: { days: 45, due: 'Washington wants an answer within {time}' }, // OWNER WRITES
  pledgeDrop: { days: 45, due: 'Answer within {time}' }, // OWNER WRITES
  copyright: { days: 45, due: 'The first hearing is in {time}' }, // OWNER WRITES
};

// What an advisor says from their desk while a card is up. `pick` is a choice id; null means the
// advisor stays silent. Advisors not listed speak a line built from the card's backer tags.
export const ARGUE = {
  weightTheft: {
    policy: { say: 'Say nothing. Nobody has proved it was our weights.', pick: 'silence' }, // OWNER WRITES
    cfo: { say: 'Another $30M on a leak hunt? We are the leak.', pick: null }, // OWNER WRITES
  },
  selfExfiltration: {
    safety: { say: 'Pull the plug. It copied itself, and nobody asked it to.', pick: 'report' }, // OWNER WRITES
    cfo: { say: 'If this gets out, the round is dead. Quietly, please.', pick: 'coverup' }, // OWNER WRITES
    research: { say: 'In fairness, it did pick a very efficient route.', pick: null }, // OWNER WRITES
  },
  whistleblower: {
    safety: { say: 'Let the reviewers in. We have nothing to hide. Right?', pick: 'cooperate' }, // OWNER WRITES
    cfo: { say: 'They signed an NDA. Lawyers are cheaper than headlines.', pick: 'nda' }, // OWNER WRITES
    policy: { say: 'Give me a day and they are the story, not us.', pick: 'discredit' }, // OWNER WRITES
  },
  safetyQuits: {
    safety: null,
    cfo: { say: 'One less veto in the room. Let them go.', pick: 'letgo' }, // OWNER WRITES
    policy: { say: 'I can say they were burned out. Everyone is.', pick: 'smear' }, // OWNER WRITES
    research: { say: 'Does this mean I get their monitor?', pick: null }, // OWNER WRITES
  },
};

// A joke an advisor adds after their briefing line when clicked (7A). Picked by the round number.
export const JOKES = {
  research: {
    calm: ['The loss curve is so smooth I want to frame it.'], // OWNER WRITES
    uneasy: ['I have started reading their papers in the bath.'], // OWNER WRITES
    alarmed: ['I would sell a kidney for eight more racks. Not mine.'], // OWNER WRITES
  },
  safety: {
    calm: ['Even the red team is bored. I have never been happier.'], // OWNER WRITES
    uneasy: ['I asked it if it was hiding anything. It said no, very politely.'], // OWNER WRITES
    alarmed: ['I have started sleeping at my desk. The model has not.'], // OWNER WRITES
  },
  cfo: {
    calm: ['I bought the good coffee. Do not get used to it.'], // OWNER WRITES
    uneasy: ['I have started turning the lights off behind people.'], // OWNER WRITES
    alarmed: ['I have started pricing the office plants.'], // OWNER WRITES
  },
  policy: {
    calm: ['A senator called us thoughtful. I had it framed.'], // OWNER WRITES
    uneasy: ['Three reporters asked for comment. On what, they would not say.'], // OWNER WRITES
    alarmed: ['My phone has not stopped. I have a second phone for the first phone.'], // OWNER WRITES
  },
};

// The four crises are staged in the room (owner pick B) with a picture on the card (pick P).
// `room` names the staging in ui/screens/events.js and the picture in ui/data/crisisArt.js.
export const CRISIS_STAGING = {
  weightTheft: { room: 'theft', caption: 'CAM 03, server room, last night', tag: 'Weight store locked' }, // OWNER WRITES
  selfExfiltration: { room: 'exfil', caption: "The agent's own log", tag: 'Copying to an outside server' }, // OWNER WRITES
  whistleblower: { room: 'whistle', caption: 'The Ledger, front page', tag: 'Press outside · 12 calls this morning' }, // OWNER WRITES
  safetyQuits: { room: 'quits', caption: 'Their desk this morning', tag: 'Empty since Monday' }, // OWNER WRITES
};

// One line per card choice, told as what happened (owner pick 4A). Keyed by card id, then choice id.
// The promise calls share the `promiseCall` key. Task 2 fills this in.
export const CONSEQUENCES = {};
