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

// What the deadline bar on a card says ({time} is filled in). The days themselves live in
// sim/data/eventTiming.js, because the real-time sim enforces them.
export const DEFAULT_DUE = 'Answer within {time}'; // OWNER WRITES
export const DUE = {
  weightTheft: 'The leak goes public in {time}', // OWNER WRITES
  selfExfiltration: 'The copy finishes in {time}', // OWNER WRITES
  whistleblower: 'The story runs in {time}', // OWNER WRITES
  safetyQuits: 'Their post is trending. Answer within {time}', // OWNER WRITES
  jailbreak: 'The thread is spreading. Answer within {time}', // OWNER WRITES
  agentSurge: 'The servers fall over in {time}', // OWNER WRITES
  lossSpike: 'The run stalls in {time}', // OWNER WRITES
  viralDemo: 'The buzz fades in {time}', // OWNER WRITES
  neocloudTrouble: 'They run out of cash in {time}', // OWNER WRITES
  boardRevolt: 'The board votes in {time}', // OWNER WRITES
  senateHearing: 'The hearing is in {time}', // OWNER WRITES
  pooling: 'Washington wants an answer within {time}', // OWNER WRITES
  copyright: 'The first hearing is in {time}', // OWNER WRITES
  boardRequest: 'The board meets soon. Answer within {time}', // OWNER WRITES
  boardWobble: 'The board meets soon. Answer within {time}', // OWNER WRITES
  boardLeak: 'The board meets soon. Answer within {time}', // OWNER WRITES
  boardOped: 'The board meets soon. Answer within {time}', // OWNER WRITES
  boardBuyer: 'The board meets soon. Answer within {time}', // OWNER WRITES
  boardWashington: 'The board meets soon. Answer within {time}', // OWNER WRITES
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
  // Board cards (frames P1 to P4, R1, R3). Directors are she or he (ui/data/boardCopy.js PRONOUN).
  boardRequest: {
    safety: { say: 'Send all of it. She’ll find out anyway, and then it’s worse.', pick: 'send' }, // OWNER WRITES
    cfo: { say: 'Send the tidy version. Nobody reads appendices.', pick: 'tidy' }, // OWNER WRITES
    policy: { say: 'Stall. Three weeks is a long time in this business.', pick: 'stall' }, // OWNER WRITES
  },
  boardWobble: {
    cfo: { say: 'Raise prices. He’s not wrong, and neither is my spreadsheet.', pick: 'prices' }, // OWNER WRITES
    policy: { say: 'A price hike right before the meeting? The trustee reads the news too.', pick: null }, // OWNER WRITES
  },
  boardLeak: {
    policy: { say: 'Get ahead of it. Say the board backs you. Loudly.', pick: 'claim' }, // OWNER WRITES
    cfo: { say: 'Find who talked. Then we talk about them.', pick: 'hunt' }, // OWNER WRITES
  },
  boardOped: {
    policy: { say: 'Reply, short and calm. The trustee will read every word.', pick: 'reply' }, // OWNER WRITES
  },
  boardBuyer: {
    cfo: { say: 'Take the call. Knowing the number isn’t selling. Probably.', pick: 'call' }, // OWNER WRITES
  },
  boardWashington: {
    policy: { say: 'Get to him before Washington does.', pick: 'brief' }, // OWNER WRITES
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
export const CONSEQUENCES = {
  flattery: {
    rollback: 'The flattering model was rolled back. Users left, but the public response improved and the behavior stopped.', // OWNER WRITES
    patch: 'The quiet patch cost $10M. The flattery stopped, and nobody outside the building heard why.', // OWNER WRITES
    defend: 'The lab defended the behavior. The screenshots kept spreading, and the public response soured.', // OWNER WRITES
  },
  jailbreak: {
    patch: 'The emergency patch cost $4M and closed the jailbreak. The thread went quiet within a day.', // OWNER WRITES
    deny: 'The denial convinced few people. The thread kept growing, and the trick kept working.', // OWNER WRITES
    pull: 'The model was pulled and the jailbreak closed. Most users left, but the public response improved.', // OWNER WRITES
  },
  citations: {
    checks: 'Citation checks were added to the affected models. The fabricated-case problem stopped, while serving grew more expensive.', // OWNER WRITES
    blame: 'Users took the blame for the invented cases. The public response worsened, though an honesty policy softened the damage.', // OWNER WRITES
    recall: 'The affected models were recalled and the fake citations stopped. Users left, with an honesty policy limiting the losses.', // OWNER WRITES
  },
  contamination: {
    admit: 'The lab admitted the contamination and re-scored the benchmark. Public confidence improved, while market enthusiasm cooled.', // OWNER WRITES
    stonewall: 'The lab stonewalled. Public confidence collapsed, and an $80M legal case landed on the calendar.', // OWNER WRITES
  },
  distill: {
    settle: 'The suit was settled for $60M, and the rival-distillation dispute was closed.', // OWNER WRITES
    deny: 'The allegation was denied. The immediate dispute closed, but a $150M legal case was scheduled.', // OWNER WRITES
    countersue: 'The countersuit cost $20M and closed the immediate dispute, while the race with Lodestar intensified.', // OWNER WRITES
  },
  agentwreck: {
    compensate: 'The customer was paid and new controls went in, $30M in all. The agent now asks before it deletes anything.', // OWNER WRITES
    blame: 'The customer took the blame. Public confidence fell, and the agentic behavior remained unresolved.', // OWNER WRITES
  },
  companion: {
    settle: 'The settlement cost $50M. Some consumer users left, while the public response improved.', // OWNER WRITES
    fight: 'The lab fought the family in court. Public confidence fell, and a $200M legal case was scheduled.', // OWNER WRITES
  },
  promise: {
    comeclean: 'The lab came clean and closed the broken commitment. The public response worsened, but staff rallied.', // OWNER WRITES
    coverup: 'The broken commitment disappeared from public view and became a cover-up. Staff confidence fell sharply.', // OWNER WRITES
  },
  promiseCall: {
    deliver: 'You kept your word. The President\'s office took the credit on television.', // OWNER WRITES
    stall: 'The deadline was pushed back. Washington\'s patience wore thinner, and stalling would not work again.', // OWNER WRITES
    refuse: 'The promise was refused. Staff approved, while Washington put the lab\'s supply chain at risk.', // OWNER WRITES
  },
  president: {
    accept: 'The President\'s demand became lab policy. Washington welcomed it, while staff confidence fell.', // OWNER WRITES
    refuse: 'The President\'s demand was refused, and the relationship with Washington deteriorated.', // OWNER WRITES
  },
  investors: {
    accept: 'The investors wired $100M, and your strictest hard line quietly left the rulebook.', // OWNER WRITES
    refuse: 'The investment was refused, and every board member became less willing to back the lab.', // OWNER WRITES
  },
  users: {
    accept: 'Consumer models were changed to yield when challenged, and their user bases grew.', // OWNER WRITES
    refuse: 'The product team\'s demand was refused. Consumer models lost users, while the public response improved.', // OWNER WRITES
  },
  political: {
    accept: 'The campaign demand was accepted. Washington warmed to the lab, while the public response worsened.', // OWNER WRITES
    refuse: 'The campaign demand was refused, and the lab\'s standing with Washington declined.', // OWNER WRITES
  },
  activists: {
    accept: 'The lab stood behind a no-autonomy line. Public confidence rose, but the next training run faced a smaller capability gain.', // OWNER WRITES
    refuse: 'The activists\' demand was refused, and public confidence fell.', // OWNER WRITES
  },
  specRead: {
    stand: 'The lab stood by its constitution. Washington cooled; the staff noticed who held the line.', // OWNER WRITES
    clarify: 'The lab said the line was about no one in particular. Nobody was fully convinced.', // OWNER WRITES
    drop: 'The next model will not carry the line. Washington warmed, and several engineers updated their CVs.', // OWNER WRITES
  },
  openletter: {
    meet: 'The safety team\'s demands were met. More compute shifted to safety work, and staff confidence rose.', // OWNER WRITES
    ignore: 'The open letter was ignored. Staff and public confidence both fell.', // OWNER WRITES
  },
  poached: {
    counter: 'The counteroffer cost $40M, and the researcher stayed.', // OWNER WRITES
    letgo: 'The researcher left for Lodestar. Research progress slipped, and staff confidence fell.', // OWNER WRITES
  },
  weightTheft: {
    report: 'You told Washington. Agents came through the office for a week, and the story broke with your name in it.', // OWNER WRITES
    hunt: 'The quiet hunt cost $30M and found a contractor account nobody had closed. The weights were already gone.', // OWNER WRITES
    silence: 'Nobody said anything. Months later a foreign model answered questions in a very familiar voice.', // OWNER WRITES
  },
  qilinshock: {
    cutprices: 'The lab cut prices across every active model, undercutting Qilin throughout the live lineup.', // OWNER WRITES
    hold: 'Prices held firm, and active models lost users to Qilin.', // OWNER WRITES
  },
  neocloudTrouble: {
    spot: 'The capacity moved to the spot market. It runs for now, at spot prices, until someone outbids you.', // OWNER WRITES
    rescue: 'Three months of troubled contract bills were prepaid, and the affected suppliers stayed alive.', // OWNER WRITES
    letgo: 'The troubled contracts were dropped. Their capacity disappeared from the lab\'s online supply.', // OWNER WRITES
  },
  siteOpposition: {
    benefits: 'A month of the site\'s lease went to a new clinic and a park. The town hall got calmer.', // OWNER WRITES
    move: 'The site moved to a new county. The turbines arrived months late.', // OWNER WRITES
    push: 'The lab pushed the site through. The protests made the evening news, and the county fought every permit.', // OWNER WRITES
  },
  pledgeDrop: {
    drop: 'The safety-compute pledge was dropped. The investment added cash, while staff confidence fell.', // OWNER WRITES
    refuse: 'The pledge stayed in place, and every board member became less willing to back the lab.', // OWNER WRITES
  },
  agentSurge: {
    spot: 'Spot capacity covered the doubled agent load for a limited stretch, at spot-market prices.', // OWNER WRITES
    route: 'Users were routed to a cheaper model during the surge. Usage dropped, and the public response worsened.', // OWNER WRITES
    cap: 'Serving was capped during the doubled load, leaving the surge uncovered and outages accepted.', // OWNER WRITES
  },
  pooling: {
    accept: 'A share of the lab\'s compute joined Washington\'s pool. The government relationship improved as online capacity shrank.', // OWNER WRITES
    refuse: 'Washington\'s request was refused, worsening the government relationship and sometimes exposing the lab to supply-chain trouble.', // OWNER WRITES
  },
  oversightTamper: {
    shutdown: 'The agents were taken off the lab\'s own work. People picked it back up, slower.', // OWNER WRITES
    controls: 'The agents went back to work with a second system watching every command they run.', // OWNER WRITES
    ignore: 'Nobody switched it off. It kept working, and it kept the switch the way it liked it.', // OWNER WRITES
  },
  selfExfiltration: {
    report: 'The agents were stopped and Washington was told. It was a bad week in the press, and a hundred engineers moved to security.', // OWNER WRITES
    coverup: 'The logs were wiped. Everyone who saw the terminal learned to stop talking, and the copy was never found.', // OWNER WRITES
  },
  ownLine: {
    lockDown: 'Choosing experiments and setting direction went back to people for good. The lab slowed down, and said so in public.', // OWNER WRITES
    moveLine: 'The policy line was raised one step. The work kept speeding up, and the research staff noticed who had moved it.', // OWNER WRITES
    screenOff: 'The speed screen went dark. The work carried on at full pace, and nobody outside the lab heard about the line.', // OWNER WRITES
  },
  lossSpike: {
    rollback: 'The spike was rolled back, and the training schedule slipped while the lost ground was recovered.', // OWNER WRITES
    slow: 'The learning rate was lowered. The run traded a smaller gain for a safer response to the spike.', // OWNER WRITES
    push: 'Training pushed through the spike without recovery, leaving the run or pending model weaker.', // OWNER WRITES
  },
  capabilityJump: {
    celebrate: 'The teaser went viral. Investors cheered, and every rival lab read it as a starting gun.', // OWNER WRITES
    audit: 'The $15M audit found things worth fixing, and the launch slipped while the team fixed them.', // OWNER WRITES
    quiet: 'The new checkpoint shipped without a word. It was better at everything, including things nobody checked.', // OWNER WRITES
  },
  whistleblower: {
    cooperate: 'Outside reviewers moved in for a month at a cost of $20M. They found real problems, and your staff saw you let them look.', // OWNER WRITES
    nda: 'The NDA was enforced. A lawsuit carrying $60M in exposure followed, while staff and the public recoiled.', // OWNER WRITES
    discredit: 'Comms attacked the whistleblower. The campaign damaged the lab\'s standing with both staff and the public.', // OWNER WRITES
  },
  safetyQuits: {
    persuade: 'Their terms were met and $30M was spent. Staff rallied, even as the public response soured.', // OWNER WRITES
    smear: 'Their motives were questioned in public. The response alienated both staff and the wider public.', // OWNER WRITES
    letgo: 'They left without a counteroffer. Staff and the public both reacted badly.', // OWNER WRITES
  },
  boardRevolt: {
    concede: 'The board received concessions and rallied behind the lab. Staff confidence fell, and the emergency vote moved ahead.', // OWNER WRITES
    lobby: 'The two least-friendly board members were lobbied for $25M. They moved toward the lab, and the vote went ahead.', // OWNER WRITES
    face: 'No concessions or lobbying changed the board. The emergency vote went ahead with its existing positions.', // OWNER WRITES
  },
  rivalBreakthrough: {
    rush: 'The lab rushed to respond. Research advanced, while safety shortcuts deepened and the rivalry intensified.', // OWNER WRITES
    study: 'The rival paper was studied for $15M, adding useful research progress.', // OWNER WRITES
    steady: 'The lab held its course, and one board member\'s patience wore thinner.', // OWNER WRITES
  },
  exportFlip: {
    back: 'The lab publicly backed the controls and lost $20M in overseas deals. Qilin slowed, and Washington welcomed the stance.', // OWNER WRITES
    quiet: 'The lab stayed silent while the export rules slowed Qilin.', // OWNER WRITES
  },
  priceWar: {
    match: 'The lab matched the price cut. Live models gained users, but each customer brought in less revenue.', // OWNER WRITES
    upmarket: 'Live models moved to premium pricing and lost users.', // OWNER WRITES
    wait: 'The lab waited out the price war, and live models lost users.', // OWNER WRITES
  },
  copyright: {
    license: 'Licensing deals cost $40M and improved the lab\'s public standing.', // OWNER WRITES
    fight: 'The lab fought the claim in court. Public confidence fell, and a $120M legal case was scheduled.', // OWNER WRITES
  },
  senateHearing: {
    candid: 'The chief testified candidly about the risks. The public response improved, Washington cooled, and the competitive race eased.', // OWNER WRITES
    reassure: 'The committee was reassured. Washington and the public responded well, while staff confidence fell.', // OWNER WRITES
    counsel: 'General counsel appeared in place of the chief. Both the public response and the relationship with Washington worsened.', // OWNER WRITES
  },
  boardRequest: {
    send: 'The full safety results went to the candor watchdog. The safety chair read every page too.', // OWNER WRITES
    tidy: 'The board got the cleaned-up version. Whether the full one stays in the drawer is another matter.', // OWNER WRITES
    stall: 'You stalled until after the meeting. The candor watchdog noticed, and wrote it down.', // OWNER WRITES
  },
  boardWobble: {
    prices: 'Prices went up this month. The growth investor had a win for his partners; users had a worse week.', // OWNER WRITES
    plan: 'You walked the growth investor through the long plan. He nodded, mostly.', // OWNER WRITES
    vent: 'Nobody called the growth investor back. He vented to his partners instead, and the partners listened.', // OWNER WRITES
  },
  boardLeak: {
    hunt: 'The leak hunt went through every inbox. The candor watchdog hated it, and so did the staff.', // OWNER WRITES
    claim: 'You posted that the board backs you. The directors who do liked it; the ones who don’t liked it less.', // OWNER WRITES
    silent: 'Nobody said anything. The rumour stayed, and your staff read the board through the fog until the meeting.', // OWNER WRITES
  },
  boardOped: {
    reply: 'Your reply ran beside the op-ed. The story lasted another day and ended a little kinder.', // OWNER WRITES
    interview: 'The long interview ran. How it landed depended on who read it.', // OWNER WRITES
    ignore: 'The op-ed went unanswered, and it was the only side of the story people read.', // OWNER WRITES
  },
  boardBuyer: {
    call: 'You took the call. The money seats liked hearing the number; the oversight seats liked hearing about it much less.', // OWNER WRITES
    refuse: 'You refused in public. The trustee cheered, and the money seats did the maths on what you turned down.', // OWNER WRITES
    wait: 'You let it play out. The money seats spent a week wondering why nobody told them anything.', // OWNER WRITES
  },
  boardWashington: {
    brief: 'You briefed the security hawk before Washington did. He walked in knowing your side.', // OWNER WRITES
    send: 'Your security lead went to the briefing too. Whatever Washington thought of your security, the security hawk heard it first-hand.', // OWNER WRITES
    stay: 'You stayed out of it. The security hawk went in alone, and came out with Washington’s view of you.', // OWNER WRITES
  },
  viralDemo: {
    ride: 'The lab rode the viral wave. Its newest live model gained users, market enthusiasm rose, and the competitive race intensified.', // OWNER WRITES
    earlyAccess: 'Paid early access opened and brought in a cash windfall that grew with the lab\'s maturity.', // OWNER WRITES
    humble: 'The lab stayed humble, and public confidence improved.', // OWNER WRITES
  },
};
