import { clamp } from './util.js';
import { POLISH_CRITIC_DIVISOR } from './polish.js';
import { leaderCapability, rank } from './rivals.js';
import { safetySpend } from './economy.js';
import { INTERPRETABILITY_SPEND, GAMING_THRESHOLD } from './hazards.js';
import { BENCHMARKS, CONTAMINATED_BENCHMARKS, CONTAMINATION_BONUS, BUG_FLAGS, BUG_PENALTY, CRITICS, GENERIC_REACTIONS, REACTIONS, JUMP_BAR_PER_NUMBER } from './data/launch.js';

const GAMING_RATE = { 3: 0.35, 4: 0.55, 5: 0.75 };

// Spec 6f: no gaming in eras 1-2; from era 3 it grows with capability above a threshold,
// is capped by the concealed debt, and an outside or government eval gate or interpretability spend cuts it.
export function evalGaming(state, capability, flags) {
  if (state.era < 3) return 0;
  const raw = Math.max(0, capability - GAMING_THRESHOLD) * GAMING_RATE[state.era];
  const outsideGate = flags.includes('thirdPartyEval') || flags.includes('govEval')
    || (state.deal?.collapsed === false && state.deal.binding.includes('evaluators'));
  const gate = (outsideGate ? 0.4 : 1) * (safetySpend(state) >= INTERPRETABILITY_SPEND ? 0.6 : 1);
  return Math.min(state.concealedDebt, raw * gate);
}

export function safetyTruth(state, flags) {
  const debt = state.alignmentDebt + state.concealedDebt;
  return clamp(Math.round(100 - 0.7 * debt - (flags.includes('jailbreakWaiting') ? 15 : 0)), 0, 100);
}

export function scoreLaunch(state, model, rng) {
  const { capability, spec, flags } = model;
  const prev = state.lastFlagship;
  const rivalCap = leaderCapability(state);
  const bugCount = BUG_FLAGS.filter((f) => flags.includes(f)).length;
  const benchmarks = BENCHMARKS.map((b) => {
    let truth;
    let shown;
    let rival;
    if (b.kind === 'safety') {
      truth = safetyTruth(state, flags);
      shown = clamp(Math.round(truth + evalGaming(state, capability, flags) + rng.int(-2, 2)), 0, 100);
      rival = clamp(Math.round(60 + rng.int(-5, 5)), 0, 100);
    } else {
      const fit = b.fit(spec, flags);
      truth = clamp(Math.round(capability * clamp(fit - BUG_PENALTY * bugCount, 0.6, 1)), 0, 100);
      const contam = flags.includes('contaminated') && CONTAMINATED_BENCHMARKS.includes(b.id) ? CONTAMINATION_BONUS : 0;
      shown = clamp(truth + contam + rng.int(-3, 3), 0, 100);
      rival = clamp(Math.round(rivalCap * fit * 0.95) + rng.int(-3, 3), 0, 100);
    }
    const flagship = prev ? prev.benchmarks.find((x) => x.id === b.id)?.shown ?? null : null;
    return { id: b.id, name: b.name, kind: b.kind, shown, truth, flagship, rival };
  });
  const caps = benchmarks.filter((b) => b.kind === 'cap');
  const capAvg = caps.reduce((s, b) => s + b.shown, 0) / caps.length;
  const beats = caps.filter((b) => b.flagship == null || b.shown > b.flagship).length;
  const launch = { benchmarks, capAvg, beats };

  const prevAvg = prev ? prev.benchmarks.filter((b) => b.id !== 'gauntlet').reduce((s, b) => s + b.shown, 0) / caps.length : capAvg - 5;
  const rivalAvg = caps.reduce((s, b) => s + b.rival, 0) / caps.length;
  const skipped = Math.max(0, model.skipped ?? 0);
  const bar = prevAvg + JUMP_BAR_PER_NUMBER * skipped;
  // gn-model-appeal owns the critic weight of post-training polish.
  const base = 7 + (capAvg - bar) / 3 + (capAvg - rivalAvg) / 6 + (model.polish ?? 0) / POLISH_CRITIC_DIVISOR;
  const ctx = { launch, flags, rank: rank(state), safetyShown: benchmarks.find((b) => b.id === 'gauntlet').shown };
  const releaseCount = state.models.length; // picks the quip and the everyday reactions without another random draw
  const press = CRITICS.map((c) => {
    const score = clamp(Math.round(base + c.bias(ctx) + rng.int(-1, 1)), 1, 10);
    const quips = c.quips[score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low'];
    const quip = quips[releaseCount % quips.length];
    return { id: c.id, name: c.name, score, quip };
  });
  const pressAvg = press.reduce((s, p) => s + p.score, 0) / press.length;

  const generation = model.generation ?? 0;
  const jump = { skipped, gain: capAvg - prevAvg, to: generation, from: generation - skipped - 1 };
  const rctx = { ...ctx, launch: { ...launch, pressAvg }, spec, model, jump };
  const rotation = releaseCount % GENERIC_REACTIONS.length;
  const everyday = [...GENERIC_REACTIONS.slice(rotation), ...GENERIC_REACTIONS.slice(0, rotation)];
  const reactions = [...REACTIONS.filter((r) => r.when(rctx)), ...everyday].slice(0, 5)
    .map((r) => ({ handle: r.handle, text: typeof r.text === 'function' ? r.text(rctx) : r.text }));
  return { ...launch, press, pressAvg, reactions };
}
