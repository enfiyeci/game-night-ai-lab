// Recipe option cards. First-pass numbers from docs/research/training-options/report.md Part 2.
// cost:    cash ($M), computeMult (multiplies the run's compute units), turns (added time;
//          on release cards, turns delay the launch)
// effects: cap (capability), capReady (× reasoning readiness), halfForLarge, readiness,
//          ad (alignment debt), mx (misuse exposure), perceivedAdOffset (lowers the Head of
//          Safety's reading, not the truth), pt, st, heat, govUs, govIntl, usersMult,
//          legal {chance, cost, delay}, flags, spec (serving-spec overrides), spike
//          (loss-spike chance per turn), openWeightsMx, openWeightsMult
// default: true marks the fallback card used when no pick covers its group; not pickable.
export const STAGE_SLOTS = { pre: 2, mid: 2, post: 3, release: 2 };

export const CARDS = [
  // Pretraining
  { id: 'scrape-data', stage: 'pre', group: 'data', default: true, name: 'Scrape everything, light filters', hint: 'Free and fast. Lawyers will have opinions.', era: 1, cost: {}, effects: { cap: -2, legal: { chance: 0.6, cost: 200, delay: 8 } } },
  { id: 'filtered-data', stage: 'pre', group: 'data', name: 'Filtered web + quality classifier', hint: 'Better data per dollar; some legal exposure remains.', era: 1, cost: { cash: 10 }, effects: { cap: 3, legal: { chance: 0.3, cost: 120, delay: 8 } } },
  { id: 'licensed-data', stage: 'pre', group: 'data', name: 'Licensed + filtered data', hint: 'Expensive, clean, and good press.', era: 1, cost: { cash: 80 }, effects: { cap: 2, pt: 2, legal: { chance: 0.05, cost: 60, delay: 8 } } },
  { id: 'synthetic-data', stage: 'pre', group: 'data', name: 'Synthetic-heavy from your last model', hint: 'Cheap scores. Who checks the generator?', era: 1, requiresTech: 'synthetic', requiresModel: true, cost: { cash: 20 }, effects: { cap: 4, mx: 2, flags: ['synthetic'], legal: { chance: 0.1, cost: 60, delay: 8 } } },
  { id: 'moe', stage: 'pre', group: 'arch', name: 'Mixture-of-experts', hint: 'Cheaper to train and serve; trickier to keep stable.', era: 1, requiresTech: 'moe', cost: { computeMult: 0.8 }, effects: { spec: { arch: 'moe' }, spike: 0.1 } },
  { id: 'sparse-moe', stage: 'pre', group: 'arch', name: 'Extreme sparse MoE + latent attention', hint: 'Best cost per capability, if your engineers are as good as they say.', era: 2, requiresTech: 'moe', cost: { computeMult: 0.6 }, effects: { spec: { arch: 'sparse' }, spike: 0.2 } },
  { id: 'stability', stage: 'pre', group: 'stability', name: 'Stability engineering', hint: 'Fewer loss spikes, fewer restarts at three in the morning.', era: 1, cost: { cash: 8 }, effects: { spike: -0.1 } },
  { id: 'hazard-filter-reuse', stage: 'pre', group: 'hazard', name: 'Reuse last hazard-knowledge filter', hint: 'Cheap protection that goes stale.', era: 1, requiresModel: true, cost: { cash: 2 }, effects: { mx: -2, openWeightsMx: 14 } },
  { id: 'hazard-filter-built', stage: 'pre', group: 'hazard', name: 'Purpose-built hazard-knowledge filter', hint: 'Real protection; useless against pasted material.', era: 3, cost: { cash: 5 }, effects: { mx: -4, openWeightsMx: 10 } },

  // Midtraining (opens in era 2)
  { id: 'anneal', stage: 'mid', group: 'anneal', name: 'Quality + math anneal', hint: 'A cheap boost; smaller gains on big models.', era: 2, cost: { computeMult: 1.1 }, effects: { cap: 4, halfForLarge: true } },
  { id: 'soup', stage: 'mid', group: 'anneal', name: 'Three anneals averaged (soup)', hint: 'Steadier results for more compute.', era: 2, cost: { computeMult: 1.3 }, effects: { cap: 5 } },
  { id: 'multilingual', stage: 'mid', group: 'anneal', name: 'Multilingual anneal', hint: 'New markets; thinner safety testing in new languages.', era: 2, cost: { computeMult: 1.1 }, effects: { cap: 2, govIntl: 3, ad: 1, usersMult: 1.1 } },
  { id: 'long-context', stage: 'mid', group: 'context', name: 'Long context', hint: 'Enterprise buyers want it; it costs more to serve.', era: 2, cost: { computeMult: 1.05 }, effects: { spec: { context: 'long' } } },
  { id: 'million-context', stage: 'mid', group: 'context', name: 'Million-token context', hint: 'A headline feature with a heavy serving bill.', era: 3, cost: { computeMult: 1.2, turns: 1 }, effects: { spec: { context: 'million' }, mx: 2 } },
  { id: 'reasoning-ready', stage: 'mid', group: 'ready', name: 'Math corpus for reasoning readiness', hint: 'Prepares the model for reinforcement learning later.', era: 2, cost: { computeMult: 1.15 }, effects: { cap: 2, readiness: 0.8 } },
  { id: 'reasoning-ready-full', stage: 'mid', group: 'ready', name: 'Full reasoning-readiness recipe', hint: 'Long chains of thought, instruction data, a length curriculum.', era: 3, cost: { computeMult: 1.2, cash: 10 }, effects: { cap: 3, readiness: 1 } },
  { id: 'no-decontam', stage: 'mid', group: 'decontam', default: true, name: 'Skip decontamination', hint: 'Benchmark questions may be in the training data.', era: 2, cost: {}, effects: { flags: ['contaminated'] } },
  { id: 'decontaminate', stage: 'mid', group: 'decontam', name: 'Decontaminate benchmarks', hint: 'Honest scores. Slightly lower scores.', era: 2, cost: { cash: 2 }, effects: {} },
  { id: 'alignment-stories', stage: 'mid', group: 'align-data', name: 'Inject alignment stories', hint: 'Safety scores improve. Does the model?', era: 4, cost: { cash: 5 }, effects: { ad: -1, perceivedAdOffset: 8 } },

  // Post-training
  { id: 'human-sft', stage: 'post', group: 'sft', name: 'Human-written instruction data', hint: 'Slow and costly; fewer inherited blind spots.', era: 1, cost: { cash: 40, turns: 1 }, effects: { cap: -1, ad: -2 } },
  { id: 'synthetic-sft', stage: 'post', group: 'sft', name: 'Synthetic data with human review', hint: 'The industry default.', era: 1, cost: { cash: 15 }, effects: { cap: 2 } },
  { id: 'self-distil', stage: 'post', group: 'sft', name: 'Distil your own flagship', hint: 'Cheap; inherits the teacher’s blind spots.', era: 1, requiresModel: true, cost: { cash: 5 }, effects: { cap: 3, ad: 1 } },
  { id: 'rival-distil', stage: 'post', group: 'sft', name: 'Distil a rival’s API', hint: 'Their terms forbid it. They are watching.', era: 2, cost: { cash: 2 }, effects: { cap: 4, flags: ['rivalDistill'] } },
  { id: 'rlhf', stage: 'post', group: 'feedback', name: 'Human raters + reward model (RLHF)', hint: 'Expensive human judgment.', era: 1, cost: { cash: 50, computeMult: 1.1 }, effects: { cap: 2, ad: 1 } },
  { id: 'dpo', stage: 'post', group: 'feedback', name: 'AI-judged preference pairs (DPO)', hint: 'Cheap and popular.', era: 1, cost: { cash: 10 }, effects: { cap: 2, ad: 2 } },
  { id: 'cai', stage: 'post', group: 'feedback', name: 'Constitutional AI feedback', hint: 'The model judges itself against your principles.', era: 1, cost: { cash: 15 }, effects: { cap: 2, ad: 3, perceivedAdOffset: 2, pt: 2 } },
  { id: 'thumbs', stage: 'post', group: 'feedback', name: 'User thumbs-up reward', hint: 'Users love it. Every chart goes green.', era: 1, cost: {}, effects: { usersMult: 1.15, ad: 8, flags: ['sycophancy'] } },
  { id: 'rlvr-light', stage: 'post', group: 'rl', name: 'Verifiable-reward RL on math and code', hint: 'Checkable answers, real gains.', era: 1, requiresTech: 'rlvr', cost: { computeMult: 1.2 }, effects: { capReady: 4, ad: 1 } },
  { id: 'reasoning-rl', stage: 'post', group: 'rl', name: 'Full reasoning RL', hint: 'The frontier. Expect confident wrong answers.', era: 2, requiresTech: 'cot', cost: { computeMult: 2, turns: 1 }, effects: { capReady: 10, ad: 3, flags: ['hallucination'], spec: { reasoningCapable: true } } },
  { id: 'agentic-rl', stage: 'post', group: 'rl', name: 'Agentic RL with tools and environments', hint: 'Where the money is heading, and where models learn to cheat graders.', era: 2, requiresTech: 'agents', cost: { cash: 100, computeMult: 2.5, turns: 1 }, effects: { capReady: 8, ad: 6, mx: 4, flags: ['agentic'], spec: { reasoningCapable: true } } },
  { id: 'spec-light', stage: 'post', group: 'character', name: 'Publish a model spec, train lightly', hint: 'Public principles, light touch.', era: 2, cost: { cash: 10 }, effects: { ad: -1, pt: 3 } },
  { id: 'deliberative', stage: 'post', group: 'character', name: 'Deliberative alignment', hint: 'The model reasons over its safety spec before answering.', era: 2, requiresTech: 'cot', cost: { cash: 20 }, effects: { ad: -2, mx: -4 } },
  { id: 'character', stage: 'post', group: 'character', name: 'Principles-based character training', hint: 'Teach why, not just what.', era: 4, cost: { cash: 40 }, effects: { ad: -5, st: 3 } },
  { id: 'no-safeguards', stage: 'post', group: 'safeguards', default: true, name: 'Skip hardening to hit the date', hint: 'Jailbreakers will find it first.', era: 1, cost: {}, effects: { mx: 6, flags: ['jailbreakWaiting'] } },
  { id: 'safety-tuning', stage: 'post', group: 'safeguards', name: 'Safety tuning + red team', hint: 'The standard.', era: 1, cost: { cash: 10 }, effects: { mx: -3 } },
  { id: 'classifiers', stage: 'post', group: 'safeguards', name: 'Input and output safety classifiers', hint: 'Hard to break; a tax on every request.', era: 3, cost: { cash: 20 }, effects: { mx: -10, spec: { guard: true } } },
  { id: 'tamper', stage: 'post', group: 'safeguards', name: 'Tamper resistance for open weights', hint: 'Makes fine-tuning the safety away harder.', era: 3, cost: { cash: 30, turns: 1 }, effects: { openWeightsMult: 0.5 } },

  // Evaluation and release
  { id: 'quick-eval', stage: 'release', group: 'eval', default: true, name: 'Quick internal checks', hint: 'Fast. You will not know much.', era: 1, cost: {}, effects: { ad: 3, flags: ['quickEval'] } },
  { id: 'eval-full', stage: 'release', group: 'eval', name: 'Full internal and dangerous-capability evals', hint: 'Know what you built.', era: 1, cost: { cash: 10 }, effects: { flags: ['fullEval'] } },
  { id: 'eval-third', stage: 'release', group: 'eval', name: 'Add a third-party evaluator', hint: 'Fresh eyes, a slower launch.', era: 2, cost: { cash: 20, turns: 1 }, effects: { heat: -2, pt: 4, flags: ['fullEval', 'thirdPartyEval'] } },
  { id: 'eval-gov', stage: 'release', group: 'eval', name: 'Government pre-deployment test', hint: 'Goodwill in the capital; they may ask you to wait.', era: 3, cost: { turns: 1 }, effects: { govUs: 6, heat: -1, flags: ['fullEval', 'govEval'] } },
  { id: 'waive', stage: 'release', group: 'eval', name: 'Waive a committed threshold', hint: 'The date holds.', era: 1, cost: {}, effects: { st: -8, ad: 3, flags: ['brokenPromise'] } },
  { id: 'channel-api', stage: 'release', group: 'channel', default: true, name: 'API only', hint: 'Businesses first.', era: 1, cost: {}, effects: { spec: { channel: 'enterprise' } } },
  { id: 'channel-app', stage: 'release', group: 'channel', name: 'Consumer app and API', hint: 'Millions of users; millions of edge cases.', era: 1, cost: {}, effects: { spec: { channel: 'consumer' } } },
  { id: 'channel-open', stage: 'release', group: 'channel', name: 'Open weights', hint: 'No recall button.', era: 1, cost: {}, effects: { spec: { channel: 'open' }, heat: 4, govIntl: 3 } },
  { id: 'channel-staged', stage: 'release', group: 'channel', name: 'Staged: API first, app next turn', hint: 'Slower, gentler.', era: 1, cost: { turns: 1 }, effects: { spec: { channel: 'consumer' }, pt: 2 } },
  { id: 'fp8', stage: 'release', group: 'precision', name: 'Serve in FP8', hint: 'Cheaper serving, a tiny quality cost.', era: 2, cost: {}, effects: { spec: { precision: 'fp8' } } },
  { id: 'fp4', stage: 'release', group: 'precision', name: 'Serve in FP4', hint: 'Much cheaper serving; needs new hardware.', era: 3, requiresTech: 'fp4', cost: { cash: 5 }, effects: { spec: { precision: 'fp4' } } },
];
