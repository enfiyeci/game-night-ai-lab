import { clamp } from './util.js';
import { POLISH_CRITIC_DIVISOR } from './polish.js';
import { leaderCapability, rank } from './rivals.js';
import { safetySpend } from './economy.js';
import { INTERPRETABILITY_SPEND, GAMING_THRESHOLD, dangerCapability } from './hazards.js';
import { BENCHMARKS, TEST_WIDTH, RETIRED_POSTS, CONTAMINATED_BENCHMARKS, CONTAMINATION_BONUS, BUG_FLAGS, BUG_PENALTY, CRITICS, GENERIC_REACTIONS, REACTIONS, JUMP_BAR_PER_NUMBER } from './data/launch.js';

const GAMING_RATE = { 3: 0.35, 4: 0.55, 5: 0.75 };

// Spec 6f: no gaming in eras 1-2; from era 3 it grows with capability above a threshold,
// is capped by the concealed debt, and an outside or government eval gate or interpretability spend cuts it.
// capability includes the release's reasoning bonus; only the model's own capability stops at the danger ceiling.
export function evalGaming(state, capability, flags, reasoningBonus = 0) {
  if (state.era < 3) return 0;
  const raw = Math.max(0, dangerCapability(capability - reasoningBonus) + reasoningBonus - GAMING_THRESHOLD) * GAMING_RATE[state.era];
  const outsideGate = flags.includes('thirdPartyEval') || flags.includes('govEval')
    || (state.deal?.collapsed === false && state.deal.binding.includes('evaluators'));
  const gate = (outsideGate ? 0.4 : 1) * (safetySpend(state) >= INTERPRETABILITY_SPEND ? 0.6 : 1);
  return Math.min(state.concealedDebt, raw * gate);
}

export function safetyTruth(state, flags) {
  const debt = state.alignmentDebt + state.concealedDebt;
  return clamp(Math.round(100 - 0.7 * debt - (flags.includes('jailbreakWaiting') ? 15 : 0)), 0, 100);
}

// The test a benchmark row runs in an era, and a skill's score on a test with that mid (sim/data/launch.js).
export const testFor = (benchmark, era) => benchmark.tests.find((t) => era >= t.from && era <= t.to);
export const testScore = (mid, skill) => clamp(Math.round(100 / (1 + Math.exp(-(skill - mid) / TEST_WIDTH))), 0, 100);
const oneDecimal = (value) => Math.round(value * 10) / 10;
// An earlier model's result on a test: its published score if it took this test, otherwise re-scored from its skill,
// as labs re-run older models on a new test.
export const scoreOnTest = (test, before) => (before.name === test.name ? before.shown : testScore(test.mid, before.skill));

// The rows whose test changes when `era` begins: { id, kind, from, to } with the old and new test names.
export function retiredTests(era) {
  if (era <= 1) return [];
  return BENCHMARKS.map((b) => ({ id: b.id, kind: b.kind, from: testFor(b, era - 1).name, to: testFor(b, era).name }))
    .filter((t) => t.from !== t.to);
}
export const retiredTestPosts = (era) => retiredTests(era).map((t) => RETIRED_POSTS[t.kind](t.from, t.to));

export function scoreLaunch(state, model) {
  const { capability, spec, flags } = model;
  const prev = state.lastFlagship;
  const rivalCap = leaderCapability(state);
  const bugCount = BUG_FLAGS.filter((f) => flags.includes(f)).length;
  const benchmarks = BENCHMARKS.map((b) => {
    const test = testFor(b, state.era);
    // The last flagship's result on this row (scoreOnTest).
    const before = prev?.benchmarks.find((x) => x.id === b.id);
    const sameTest = before?.name === test.name;
    let truth;
    let shown;
    let rival;
    let skill;
    let fit;
    let flagship = null;
    if (b.kind === 'safety') {
      truth = safetyTruth(state, flags);
      shown = clamp(Math.round(truth + evalGaming(state, capability, flags, model.reasoningBonus)), 0, 100);
      rival = clamp(Math.round(60), 0, 100);
      flagship = before?.shown ?? null;
    } else {
      fit = b.fit(spec, flags);
      skill = oneDecimal(capability * clamp(fit - BUG_PENALTY * bugCount, 0.6, 1));
      truth = testScore(test.mid, skill);
      const contam = flags.includes('contaminated') && CONTAMINATED_BENCHMARKS.includes(b.id) ? CONTAMINATION_BONUS : 0;
      shown = clamp(truth + contam, 0, 100);
      rival = clamp(testScore(test.mid, rivalCap * fit * 0.95), 0, 100);
      if (before) flagship = scoreOnTest(test, before);
    }
    const newTest = Boolean(before) && !sameTest;
    const row = { id: b.id, name: test.name, label: b.label, kind: b.kind, shown, truth, flagship, rival, newTest };
    return b.kind === 'safety' ? row : { ...row, skill, fit, mid: test.mid };
  });
  const caps = benchmarks.filter((b) => b.kind === 'cap');
  const capAvg = caps.reduce((s, b) => s + b.shown, 0) / caps.length;
  const beats = caps.filter((b) => b.flagship == null || b.shown > b.flagship).length;
  // skill does not depend on which tests are running, so it compares models across eras (the flagship pick, the summary).
  const skill = caps.reduce((s, b) => s + b.skill, 0) / caps.length;

  const compared = caps.filter((b) => b.flagship != null);
  const prevAvg = compared.length ? compared.reduce((s, b) => s + b.flagship, 0) / compared.length : capAvg - 5;
  const launch = { benchmarks, capAvg, beats, skill, flagshipAvg: prevAvg };

  const rivalAvg = caps.reduce((s, b) => s + b.rival, 0) / caps.length;
  const skipped = Math.max(0, model.skipped ?? 0);
  const bar = prevAvg + JUMP_BAR_PER_NUMBER * skipped;
  const economicBase = 7 + (capAvg - bar) / 3 + (capAvg - rivalAvg) / 6 + (model.polish ?? 0) / POLISH_CRITIC_DIVISOR;
  // Saturating benchmarks cannot drown out flaws or make every later release a perfect review.
  const progress = clamp((capAvg - prevAvg) / 12, -2, 1.75);
  const lead = clamp((capAvg - rivalAvg) / 25, -1.5, 1.5);
  const visibleFlaws = ['hallucination', 'jailbreakWaiting', 'sycophancy'].filter((flag) => flags.includes(flag)).length;
  const base = 5.5 + progress + lead - JUMP_BAR_PER_NUMBER * skipped / 3
    + clamp(model.polish ?? 0, 0, 100) / POLISH_CRITIC_DIVISOR
    - visibleFlaws * 0.75 - bugCount * 0.25;
  // A perfect review needs a demonstrated leap, not just a generous critic or saturated tests.
  const exceptional = compared.length === caps.length && capAvg - bar >= 20 && capAvg - rivalAvg >= 30
    && (model.polish ?? 0) >= 90 && visibleFlaws === 0 && bugCount === 0
    && !flags.includes('contaminated');
  const ctx = { launch, flags, rank: rank(state), safetyShown: benchmarks.find((b) => b.id === 'gauntlet').shown };
  const releaseCount = state.models.length; // picks the quip and the everyday reactions without another random draw
  let economicTotal = 0;
  const press = CRITICS.map((c) => {
    const bias = c.bias(ctx);
    // Economic reception stays separate from the stricter public rating.
    economicTotal += clamp(Math.round(economicBase + bias), 1, 10);
    const score = clamp(Math.round(base + bias), 1, exceptional ? 10 : 9);
    const quips = c.quips[score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low'];
    const quip = quips[releaseCount % quips.length];
    return { id: c.id, name: c.name, score, quip };
  });
  const pressAvg = press.reduce((s, p) => s + p.score, 0) / press.length;
  const economyPressAvg = economicTotal / press.length;

  const generation = model.generation ?? 0;
  const jump = { skipped, gain: capAvg - prevAvg, to: generation, from: generation - skipped - 1 };
  const rctx = { ...ctx, launch: { ...launch, pressAvg }, spec, model, jump };
  const rotation = releaseCount % GENERIC_REACTIONS.length;
  const everyday = [...GENERIC_REACTIONS.slice(rotation), ...GENERIC_REACTIONS.slice(0, rotation)];
  const reactions = [...REACTIONS.filter((r) => r.when(rctx)), ...everyday].slice(0, 5)
    .map((r) => ({ handle: r.handle, text: typeof r.text === 'function' ? r.text(rctx) : r.text }));
  return { ...launch, press, pressAvg, economyPressAvg, reactions };
}
