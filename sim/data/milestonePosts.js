// The feed's reactions to the lab's milestones (sim/milestones.js, reward-loops O3). Same shape as
// sim/data/feedReactions.js: [handle, text]; {model} is the model that paid back, {rival} the lab that took #1.
export const MILESTONE_POSTS = { // OWNER WRITES
  users1: [ // OWNER WRITES
    ['@term_sheet', 'a million people use {lab} now. the deck just got a new first slide.'],
    ['@pim_ships', 'a million users. {lab} went from demo to habit faster than I expected.'],
  ],
  users10: [ // OWNER WRITES
    ['@not_a_vc', 'ten million users at {lab}. that is a country, not a beta.'],
    ['@devnull_ops', 'ten million users means ten million new ways to break it. good luck {lab} on-call.'],
  ],
  users100: [ // OWNER WRITES
    ['@globalwire', '{lab} passes 100 million users, joining the biggest consumer products ever made.'],
    ['@governance_guy', 'one hundred million people now rely on {lab}. regulators will notice that number.'],
  ],
  paidBack: [ // OWNER WRITES
    ['@rourke_capital', '{model} has paid for itself. rare in this business. very rare.'],
    ['@term_sheet', 'unit economics check: {model} is in the black. {lab} investors exhale.'],
  ],
  tookFirst: [ // OWNER WRITES
    ['@evalmaxxer', 'new leaderboard top: {lab}. screenshotting this before it changes.'],
    ['@chip_counter', '{lab} is #1 now. the compute bet is paying off.'],
  ],
  lostFirst: [ // OWNER WRITES
    ['@evalmaxxer', '{rival} is back on top. {lab} had a good run.'],
    ['@yolo_calls', 'called it. {rival} takes #1 from {lab}.'],
  ],
};
