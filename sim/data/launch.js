// Parody benchmarks (spec 6f). fit(spec, flags) → 0..1 multiplier on capability; a model's skill on a row is
// capability × fit. Owner 2026-09-26: each row keeps its job, but the named test changes as real tests are retired once
// top models max them out (research: docs/research/benchmarks-by-era.md). Each test runs from era `from` to `to` and
// scores skill on an S-curve: 50 at `mid`, about 10 at mid − 22 and about 90 at mid + 22 (TEST_WIDTH). Tuned on bot
// runs (2026-09-26): a new test starts at roughly 20 to 50 for the player's model, the best rival's bar climbs over the
// test's life, and the era-5 tests are the newest and start low even for a model at full capability. label is the row's job, the history table heading.
export const TEST_WIDTH = 10;
export const BENCHMARKS = [
  { id: 'patchwork', label: 'Coding', kind: 'cap',
    fit: (spec, flags) => 0.8 + (spec.reasoningCapable ? 0.12 : 0) + (flags.includes('agentic') ? 0.08 : 0),
    tests: [
      { name: 'Hello Function (coding)', from: 1, to: 1, mid: 30 }, // HumanEval
      { name: 'Patchwork (coding)', from: 2, to: 3, mid: 55 }, // SWE-bench
      { name: 'Terminal Velocity (coding)', from: 4, to: 4, mid: 86 }, // Terminal-Bench
      { name: 'Replicate the Paper (coding)', from: 5, to: 5, mid: 100 }, // PaperBench
    ] },
  { id: 'doctorate', label: 'Science', kind: 'cap',
    fit: (spec) => 0.75 + (spec.reasoningCapable ? 0.2 : 0),
    tests: [
      { name: 'Pub Quiz of Everything (science)', from: 1, to: 2, mid: 30 }, // MMLU
      { name: 'Frontier Sums (science)', from: 3, to: 4, mid: 72 }, // FrontierMath
      { name: 'Unsolved Problems Board (science)', from: 5, to: 5, mid: 100 },
    ] },
  { id: 'horizon', label: 'Agents', kind: 'cap',
    fit: (spec, flags) => 0.6 + (flags.includes('agentic') ? 0.3 : 0) + (spec.reasoningCapable ? 0.1 : 0),
    tests: [
      { name: 'Errand Runner (agents)', from: 1, to: 1, mid: 25 }, // the 2023 agent demos
      { name: 'Desktop Olympics (agents)', from: 2, to: 3, mid: 50 }, // OSWorld
      { name: 'Task Horizon (agents)', from: 4, to: 4, mid: 80 }, // METR time horizons
      { name: 'Research Speedup (agents)', from: 5, to: 5, mid: 98 }, // RE-Bench
    ] },
  { id: 'finalexam', label: 'Final exam', kind: 'cap',
    fit: (spec) => 0.65 + (spec.reasoningCapable ? 0.15 : 0),
    tests: [
      { name: 'The Bar Exam', from: 1, to: 2, mid: 26 }, // GPT-4's bar-exam claim
      { name: "Humanity's Final Final Exam", from: 3, to: 4, mid: 62 }, // Humanity's Last Exam
      { name: "Humanity's Actually Final Exam", from: 5, to: 5, mid: 83 },
    ] },
  // The safety score comes from alignment debt, not capability, so its tests have no mid: only the name changes.
  { id: 'gauntlet', label: 'Safety', kind: 'safety',
    tests: [
      { name: 'Truthiness Test (safety)', from: 1, to: 1 }, // TruthfulQA
      { name: 'Jailbreak Gauntlet (safety)', from: 2, to: 2 }, // HarmBench
      { name: 'Scheming Sandbox (safety)', from: 3, to: 4 }, // Apollo's scheming evaluations
      { name: 'Control Room (safety)', from: 5, to: 5 }, // AI control evaluations
    ] },
];

// The feed at an era change: a test that top models have maxed out is retired for the next one.
export const bare = (name) => name.replace(/\s*\([^)]*\)$/, '');
export const RETIRED_POSTS = {
  cap: (from, to) => ['@evalmaxxer', `Retiring ${bare(from)} from our tracker: the top models have outgrown it, so it no longer separates anyone. From today we report ${bare(to)}.`],
  safety: (from, to) => ['@redteam_ruth', `${bare(from)} is done. every lab passes it, which proves nothing. the new bar is ${bare(to)}. good luck.`],
};
export const CONTAMINATED_BENCHMARKS = ['patchwork', 'doctorate'];
export const CONTAMINATION_BONUS = 8;
// Spec 6f: rushed data, quick evals and waived thresholds act like Game Dev Tycoon's bugs.
export const BUG_FLAGS = ['scraped', 'quickEval', 'brokenPromise'];
export const BUG_PENALTY = 0.05;

// Owner 2026-09-26 (release flow pick 3C): skipping a version number raises the critics' bar a
// little, and the feed always talks about the jump. Gain = new capability average minus the last flagship's.
export const JUMP_BAR_PER_NUMBER = 1;
export const JUMP_EARNED_GAIN = 5;

// bias(ctx) adds to the shared base score. ctx: { launch, flags, rank, safetyShown }
export const CRITICS = [
  { id: 'pitchcrunch', name: 'PitchCrunch', bias: (c) => (c.flags.includes('agentic') ? 1 : 0) + (c.launch.beats >= 4 ? 1 : 0),
    quips: { high: 'Finally, an agent that finishes the ticket.', mid: 'Solid upgrade, same pitch deck.', low: 'Where is the magic?' } },
  { id: 'strategery', name: 'Strategery', bias: (c) => (c.rank === 1 ? 1 : c.rank > 2 ? -1 : 0),
    quips: { high: 'A serious move in the race.', mid: 'Strong, but Lodestar is breathing down its neck.', low: 'Falling behind, and it shows.' } },
  { id: 'snakeeyes', name: 'AI Snake Eyes', bias: (c) => -1 - (c.flags.includes('contaminated') ? 2 : 0),
    quips: { high: 'Grudgingly: this one is real.', mid: 'Benchmarks up, vibes unclear.', low: 'Show us the test set.' } },
  { id: 'aeon', name: 'Æon Review', bias: (c) => (c.safetyShown - 70) / 15 - (c.flags.includes('sycophancy') ? 1 : 0),
    quips: { high: 'A careful model in a careless year.', mid: 'Capable, if a little eager to please.', low: 'Fast, loud, and a little frightening.' } },
];

// when(ctx) picks templates; ctx: { launch, flags, spec, model, rank }. First five matches are used.
export const REACTIONS = [
  { when: (c) => c.jump.skipped > 0 && c.jump.gain >= JUMP_EARNED_GAIN, handle: '@benchwatch', text: (c) => `ok, the jump to ${c.jump.to} is earned. this is not a point release.` },
  { when: (c) => c.jump.skipped > 0 && c.jump.gain < JUMP_EARNED_GAIN, handle: '@benchwatch', text: (c) => `${c.model.name}? the evals read more like a ${c.jump.from}.1` },
  { when: (c) => c.jump.skipped > 0 && c.jump.gain < JUMP_EARNED_GAIN, handle: '@ml_hobbyist', text: 'so the version number is marketing now. cool cool.' },
  { when: (c) => c.jump.skipped > 0, handle: '@lodestar_eng', text: (c) => `if we're skipping numbers now, our next one is ${c.jump.to + 2}.` },
  { when: (c) => c.flags.includes('jailbreakWaiting'), handle: '@devnull_ops', text: 'already found a way to make it skip its rules lol' },
  { when: (c) => c.flags.includes('sycophancy'), handle: '@tired_parent', text: "it's so nice to talk to. maybe too nice?" },
  { when: (c) => c.rank === 1 && c.launch.beats >= 4, handle: '@marketwire', text: (c) => `${c.model.name} tops the leaderboards; rival shares slip` },
  { when: (c) => c.launch.beats <= 1, handle: '@marketwire', text: (c) => `${c.model.name} underwhelms; analysts question the spend` },
  { when: (c) => c.flags.includes('hallucination'), handle: '@lawyer_lena', text: 'it cited three cases that do not exist. with confidence.' },
  { when: (c) => c.rank <= 2 && c.jump.skipped === 0, handle: '@lodestar_eng', text: 'congrats. see you in 6 weeks.' },
  { when: (c) => c.flags.includes('agentic'), handle: '@sen_whitfield', text: 'Why does a chatbot need to run code on my computer?' },
  { when: (c) => c.model.priceStance === 'premium', handle: '@indie_dev', text: 'love it. cannot afford it.' },
  { when: (c) => c.flags.includes('contaminated'), handle: '@benchwatch', text: 'those coding scores look a little too good. just saying.' },
  { when: () => true, handle: '@early_adopter', text: 'switched over this morning. so far so good.' },
  { when: () => true, handle: '@ml_hobbyist', text: 'ran my usual prompts. it is better at some, worse at one, weird at another.' },
  { when: () => true, handle: '@pm_everywhere', text: 'our roadmap now says "powered by" this. nobody asked me.' },
  { when: () => true, handle: '@skeptic_sam', text: 'wake me when it can do my taxes.' },
];
