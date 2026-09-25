// Parody benchmarks (spec 6f). fit(spec, flags) → 0..1 multiplier on capability.
export const BENCHMARKS = [
  { id: 'patchwork', name: 'Patchwork (coding)', kind: 'cap',
    fit: (spec, flags) => 0.8 + (spec.reasoningCapable ? 0.12 : 0) + (flags.includes('agentic') ? 0.08 : 0) },
  { id: 'doctorate', name: 'Doctorate Quiz (science)', kind: 'cap',
    fit: (spec) => 0.75 + (spec.reasoningCapable ? 0.2 : 0) },
  { id: 'horizon', name: 'Task Horizon (agents)', kind: 'cap',
    fit: (spec, flags) => 0.6 + (flags.includes('agentic') ? 0.3 : 0) + (spec.reasoningCapable ? 0.1 : 0) },
  { id: 'finalexam', name: "Humanity's Final Final Exam", kind: 'cap',
    fit: (spec) => 0.65 + (spec.reasoningCapable ? 0.15 : 0) },
  { id: 'gauntlet', name: 'Jailbreak Gauntlet (safety)', kind: 'safety' },
];
export const CONTAMINATED_BENCHMARKS = ['patchwork', 'doctorate'];
export const CONTAMINATION_BONUS = 8;
// Spec 6f: rushed data, quick evals and waived thresholds act like Game Dev Tycoon's bugs.
export const BUG_FLAGS = ['scraped', 'quickEval', 'brokenPromise'];
export const BUG_PENALTY = 0.05;

// bias(ctx) adds to the shared base score. ctx: { launch, flags, rank, safetyShown }
export const CRITICS = [
  { id: 'pitchcrunch', name: 'PitchCrunch', bias: (c) => (c.flags.includes('agentic') ? 1 : 0) + (c.launch.beats >= 4 ? 1 : 0),
    quips: { high: 'Finally, an agent that finishes the ticket.', mid: 'Solid upgrade, same pitch deck.', low: 'Where is the magic?' } },
  { id: 'strategery', name: 'Strategery', bias: (c) => (c.rank === 1 ? 1 : c.rank > 2 ? -1 : 0),
    quips: { high: 'They just took the lead.', mid: 'Strong, but Lodestar is breathing down its neck.', low: 'Falling behind, and it shows.' } },
  { id: 'snakeeyes', name: 'AI Snake Eyes', bias: (c) => -1 - (c.flags.includes('contaminated') ? 2 : 0),
    quips: { high: 'Grudgingly: this one is real.', mid: 'Benchmarks up, vibes unclear.', low: 'Show us the test set.' } },
  { id: 'aeon', name: 'Æon Review', bias: (c) => (c.safetyShown - 70) / 15 - (c.flags.includes('sycophancy') ? 1 : 0),
    quips: { high: 'A careful model in a careless year.', mid: 'Capable, if a little eager to please.', low: 'Fast, loud, and a little frightening.' } },
];

// when(ctx) picks templates; ctx: { launch, flags, spec, model, rank }. First five matches are used.
export const REACTIONS = [
  { when: (c) => c.flags.includes('jailbreakWaiting'), handle: '@devnull_ops', text: 'already found a way to make it skip its rules lol' },
  { when: (c) => c.flags.includes('sycophancy'), handle: '@tired_parent', text: "it's so nice to talk to. maybe too nice?" },
  { when: (c) => c.rank === 1 && c.launch.beats >= 4, handle: '@marketwire', text: (c) => `${c.model.name} tops the leaderboards; rival shares slip` },
  { when: (c) => c.launch.beats <= 1, handle: '@marketwire', text: (c) => `${c.model.name} underwhelms; analysts question the spend` },
  { when: (c) => c.flags.includes('hallucination'), handle: '@lawyer_lena', text: 'it cited three cases that do not exist. with confidence.' },
  { when: (c) => c.rank <= 2, handle: '@lodestar_eng', text: 'congrats. see you in 6 weeks.' },
  { when: (c) => c.flags.includes('agentic'), handle: '@sen_whitfield', text: 'Why does a chatbot need to run code on my computer?' },
  { when: (c) => c.model.priceStance === 'premium', handle: '@indie_dev', text: 'love it. cannot afford it.' },
  { when: (c) => c.flags.includes('contaminated'), handle: '@benchwatch', text: 'those coding scores look a little too good. just saying.' },
  { when: () => true, handle: '@early_adopter', text: 'switched over this morning. so far so good.' },
  { when: () => true, handle: '@ml_hobbyist', text: 'ran my usual prompts. it is better at some, worse at one, weird at another.' },
  { when: () => true, handle: '@pm_everywhere', text: 'our roadmap now says "powered by" this. nobody asked me.' },
  { when: () => true, handle: '@skeptic_sam', text: 'wake me when it can do my taxes.' },
];
