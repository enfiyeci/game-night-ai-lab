// Story days each event card waits for an answer. The events lane (branch events-build) owns these
// values and ships the same file; on merge, take theirs. Keep both exports' names identical.
export const DEFAULT_EVENT_TIMING = { class: 'normal', days: 21 };
export const EVENT_TIMING = {};
