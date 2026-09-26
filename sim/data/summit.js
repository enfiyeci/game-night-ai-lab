// Era 5 summit content and tuning (spec docs/superpowers/specs/2026-09-26-summit-design.md).

// How strictly a card is checked: 0 on trust, 1 self-reports, 2 outside testers, 3 inspectors.
export const CHECK_LEVELS = Object.freeze(['trust', 'selfReport', 'testers', 'inspectors']);
export const DEFAULT_CHECK = 1;

// Each delegate's one fixed demand (owner 2026-09-26: fixed for now). A promise to a party meets it.
//   follows: signs a card when that party signs it (and, if maxCheck is set, the card is checked no harder).
//   refuses: never signs that card.
//   minCheck: signs only cards checked at least this hard.
//   promiseOnly: signs nothing until you make it a promise.
export const DEMANDS = Object.freeze({
  openbrain: { text: 'We sign if Qilin signs. Testers at most.', rule: { follows: 'qilin', maxCheck: 2 } },
  deepthink: { text: 'No cap on runs. Anything else, we can talk.', rule: { refuses: 'computeCap' } },
  west: { text: 'Nothing that lets China inspect us.', rule: { refuses: 'verification' } },
  east: { text: 'Checks go both ways, or no deal.', rule: { promiseOnly: true } },
  qilin: { text: 'We sign what our government signs.', rule: { follows: 'east' } },
  lodestar: { text: 'Real checks: testers or better.', rule: { minCheck: 2 } },
});

// What a promise costs you. One promise per delegate, three at most.
export const PROMISES = Object.freeze({
  pay: { label: 'We pay for it', cost: '$50M toward the checks', cash: 50 },
  goFirst: { label: 'Our lab goes first', cost: 'Testers start in our lab now' },
  inspectors: { label: 'Inspect us too', cost: 'Inspectors can check our own runs' },
});
export const MAX_PROMISES = 3;

// How much each party likes strict checking, per level.
export const CHECK_LEAN = Object.freeze({
  openbrain: -0.08, deepthink: 0, west: 0.03, east: 0.03, qilin: -0.05, lodestar: 0.05,
});

export const SIGN_AT = 0.35; // stance a party needs, once its demand is met
export const PROMISE_BONUS = 0.2; // stance added for the party you made a promise to
export const READ_BAND = 0.1; // Jules reads "maybe" within this of SIGN_AT

// After the vote, indexed by the strictest check on the cards a party signed.
export const CATCH = Object.freeze([0.1, 0.25, 0.6, 0.9]); // a break is caught at once
export const SIGN_SEEN = Object.freeze([0.5, 0.6, 0.8, 1]); // an uncaught break leaves a sign Jules spots
export const FALSE_ALARM = Object.freeze([0.3, 0.2, 0.1, 0.02]); // a lab keeping the deal still looks suspicious
export const INVESTIGATE = Object.freeze([0.4, 0.55, 0.85, 0.95]); // looking into a real sign finds it
export const DETERRENCE = 0.05; // break chance removed per check level
export const SUSPICION_DAYS = 5;
export const BREAK_GAIN = 6; // capability an uncaught break buys a rival
export const CAUGHT_TRUST = 3; // public trust you gain when a cheater is caught
export const FALSE_ACCUSATION_TRUST = 2; // public trust lost accusing an innocent lab with no checks
export const PRESIDENT_VERIFICATION_FAVOR = 10; // US favor lost if the West-East inspection line binds
