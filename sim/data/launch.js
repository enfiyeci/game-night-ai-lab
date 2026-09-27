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

// Owner 2026-09-26 (release flow pick 3C): skipping a version number raises the critics' bar a
// little, and the feed always talks about the jump. Gain = new capability average minus the last flagship's.
export const JUMP_BAR_PER_NUMBER = 1;
export const JUMP_EARNED_GAIN = 5;

// bias(ctx) adds to the shared base score. ctx: { launch, flags, rank, safetyShown }
// Each tier holds a few quips; the lab's release count picks one, so back-to-back launches read differently
// (playtest 2026-09-26: two 10/10 launches printed the same four quotes). Lines after the first in each tier are drafts.
export const CRITICS = [
  { id: 'pitchcrunch', name: 'PitchCrunch', bias: (c) => (c.flags.includes('agentic') ? 1 : 0) + (c.launch.beats >= 4 ? 1 : 0),
    quips: {
      high: ['Finally, an agent that finishes the ticket.', 'The demo held up after the demo. Rare.', 'Every startup we cover just changed its pitch.'],
      mid: ['Solid upgrade, same pitch deck.', 'Better, not different.', 'A good release in a week of good releases.'],
      low: ['Where is the magic?', 'The keynote was longer than the changelog.', 'Investors wanted a leap. This is a shuffle.'],
    } },
  { id: 'strategery', name: 'Strategery', bias: (c) => (c.rank === 1 ? 1 : c.rank > 2 ? -1 : 0),
    quips: {
      high: ['A serious move in the race.', 'Everyone else now has a deadline.', 'This is what a lead looks like.'],
      mid: ['Strong, but Lodestar is breathing down its neck.', 'Keeps them in the pack. Not ahead of it.', 'A holding move, well executed.'],
      low: ['Falling behind, and it shows.', 'The gap is now visible from orbit.', 'A lab playing catch-up in public.'],
    } },
  { id: 'snakeeyes', name: 'AI Snake Eyes', bias: (c) => -1 - (c.flags.includes('contaminated') ? 2 : 0),
    quips: {
      high: ['Grudgingly: this one is real.', 'We tried to break the claims. Most survived.', 'Fewer asterisks than usual.'],
      mid: ['Benchmarks up, vibes unclear.', 'Real gains, oversold.', 'Wait for the independent evals.'],
      low: ['Show us the test set.', 'The chart has no y-axis for a reason.', 'Numbers in search of a product.'],
    } },
  { id: 'aeon', name: 'Æon Review', bias: (c) => (c.safetyShown - 70) / 15 - (c.flags.includes('sycophancy') ? 1 : 0),
    quips: {
      high: ['A careful model in a careless year.', 'Built by people who read the risk reports.', 'Powerful, and they seem to know it.'],
      mid: ['Capable, if a little eager to please.', 'Good manners, thin safety notes.', 'We would like to see the system card.'],
      low: ['Fast, loud, and a little frightening.', 'Shipped first, explained later.', 'The safety section is one paragraph long.'],
    } },
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
];

// Everyday reactions fill the rest of the five slots, rotated by the lab's release count (drafts after the first four).
export const GENERIC_REACTIONS = [
  { handle: '@early_adopter', text: 'switched over this morning. so far so good.' },
  { handle: '@ml_hobbyist', text: 'ran my usual prompts. it is better at some, worse at one, weird at another.' },
  { handle: '@pm_everywhere', text: 'our roadmap now says "powered by" this. nobody asked me.' },
  { handle: '@skeptic_sam', text: 'wake me when it can do my taxes.' },
  { handle: '@night_shift_nurse', text: 'asked it about drug interactions at 3am. it was careful. i was relieved.' },
  { handle: '@grad_student_42', text: 'my advisor says not to use it for the thesis. my advisor uses it for emails.' },
  { handle: '@small_biz_rosa', text: 'wrote my whole menu in two languages. still checking the spanish.' },
  { handle: '@teacher_mo', text: 'thirty essays this week. twenty-nine sound the same.' },
];
