// How many story days each event card waits for an answer before its fallback applies.
// Owned by the events lane (plan 2B Task 8); read by the real-time sim. Ids not listed default
// to 'normal'. First guesses, to tune after the first playthrough.
export const EVENT_TIMING = {
  selfExfiltration: { class: 'short', days: 3 },
  oversightTamper: { class: 'short', days: 3 },
  agentSurge: { class: 'short', days: 4 },
  jailbreak: { class: 'short', days: 5 },
  lossSpike: { class: 'short', days: 5 },
  capabilityJump: { class: 'short', days: 5 },
  viralDemo: { class: 'short', days: 5 },
  safetyQuits: { class: 'short', days: 7 },
  agentwreck: { class: 'short', days: 7 },
  whistleblower: { class: 'normal', days: 9 },
  neocloudTrouble: { class: 'normal', days: 10 },
  priceWar: { class: 'normal', days: 10 },
  weightTheft: { class: 'normal', days: 14 },
  boardRevolt: { class: 'normal', days: 14 },
  senateHearing: { class: 'long', days: 30 },
  pooling: { class: 'long', days: 45 },
  pledgeDrop: { class: 'long', days: 45 },
  copyright: { class: 'long', days: 45 },
};

export const DEFAULT_EVENT_TIMING = Object.freeze({ class: 'normal', days: 21 });
