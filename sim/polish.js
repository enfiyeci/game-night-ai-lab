import { cardById } from './recipe.js';
import { computeSlices } from './split.js';

// Keep polishing, then Publish (docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md). After a run
// ends the lab keeps post-training the model: it fixes the recipe's post-training flaws in the player's order, then
// adds polish in bubbles that shrink, until the player publishes. No random draws anywhere.
export const FLAW_FIX_ROUNDS = 0.25;
export const BUBBLE_ROUNDS = 1 / 12;
export const BUBBLE_SHARE = 0.2;
export const POLISH_CRITIC_DIVISOR = 50;
// Flags post-training created, so post-training can fix them; the order is the default working order.
export const FIXABLE = ['jailbreakWaiting', 'hallucination', 'sycophancy'];
const FLAW_ACTIONS = ['first', 'leaveIn', 'fix'];
const DONE = 1e-9;

export function startPolishing(model, units, day) {
  model.polish = 0;
  model.fixedFlaws = [];
  model.heldUnits = units;
  model.polishing = {
    flaws: FIXABLE.filter((flag) => model.flags.includes(flag)).map((flag) => ({ flag, progress: 0, leftIn: false })),
    bubbleProgress: 0,
    bubbles: [],
    rivals: [],
    startedDay: day,
  };
  return model;
}

const toFix = (polishing) => polishing.flaws.filter((flaw) => !flaw.leftIn);
export const flawsLeft = (model) => (model?.polishing ? toFix(model.polishing).length : 0);
export const nextBubbleGain = (model) => BUBBLE_SHARE * (100 - (model?.polish ?? 0));

function fixFlaw(model, flaw, day) {
  const polishing = model.polishing;
  polishing.flaws.splice(polishing.flaws.indexOf(flaw), 1);
  model.flags = model.flags.filter((flag) => flag !== flaw.flag);
  model.fixedFlaws.push({ flag: flaw.flag, day });
  // The thumbs-up card's extra users came from the flattery, so they go with it.
  if (flaw.flag === 'sycophancy') model.publicEffects.usersMult /= cardById('thumbs').effects.usersMult;
}

// Moves polishing on by `fraction` of a round. Compute is checked once per round, as a training run's is.
export function advancePolishBy(state, fraction) {
  const model = state.pendingModel;
  const polishing = model?.polishing;
  if (!polishing) return [];
  if (polishing.capacityTurn !== state.turn) {
    polishing.capacityTurn = state.turn;
    polishing.canAdvance = computeSlices(state).training >= model.heldUnits;
  }
  if (!polishing.canAdvance) {
    if (polishing.paused) return [];
    polishing.paused = true;
    return [{ type: 'polishPaused' }];
  }
  polishing.paused = false;
  const events = [];
  let left = fraction;
  while (left > DONE) {
    const flaw = toFix(polishing)[0];
    if (flaw) {
      const step = Math.max(0, Math.min(left, FLAW_FIX_ROUNDS - flaw.progress));
      flaw.progress += step;
      left -= step;
      if (flaw.progress >= FLAW_FIX_ROUNDS - DONE) {
        fixFlaw(model, flaw, state.day);
        events.push({ type: 'flawFixed', flag: flaw.flag });
      }
      continue;
    }
    const step = Math.max(0, Math.min(left, BUBBLE_ROUNDS - polishing.bubbleProgress));
    polishing.bubbleProgress += step;
    left -= step;
    if (polishing.bubbleProgress >= BUBBLE_ROUNDS - DONE) {
      const gain = nextBubbleGain(model);
      model.polish += gain;
      polishing.bubbleProgress = 0;
      polishing.bubbles.push({ day: state.day, gain });
      events.push({ type: 'polishBubble', gain });
    }
  }
  return events;
}

// The player's instant flaw moves: work on one next, leave one in, or take a left-in one back.
export function applyFlawAction(state, { flag, action } = {}) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return { ok: false, error: 'no model is being polished' };
  if (!FLAW_ACTIONS.includes(action)) return { ok: false, error: `unknown flaw action ${action}` };
  const flaw = polishing.flaws.find((entry) => entry.flag === flag);
  if (!flaw) return { ok: false, error: `${flag} is not a flaw left to fix` };
  if (action === 'first') {
    polishing.flaws.splice(polishing.flaws.indexOf(flaw), 1);
    polishing.flaws.unshift(flaw);
    flaw.leftIn = false;
  }
  if (action === 'leaveIn') flaw.leftIn = true;
  if (action === 'fix') flaw.leftIn = false;
  return { ok: true };
}

// What polishing will do from `fromDay` if nothing changes: the fixes left, then `count` bubbles. Days are exact
// fractions; a bubble lands on the first story day at or after its day.
export function polishForecast(model, roundDays, fromDay, count = 8) {
  const polishing = model?.polishing;
  if (!polishing) return [];
  const forecast = [];
  let day = fromDay;
  for (const flaw of toFix(polishing)) {
    day += (FLAW_FIX_ROUNDS - flaw.progress) * roundDays;
    forecast.push({ type: 'fix', flag: flaw.flag, day });
  }
  let polish = model.polish;
  let wait = BUBBLE_ROUNDS - polishing.bubbleProgress;
  for (let i = 0; i < count; i += 1) {
    day += wait * roundDays;
    wait = BUBBLE_ROUNDS;
    const gain = BUBBLE_SHARE * (100 - polish);
    polish += gain;
    forecast.push({ type: 'bubble', gain, day });
  }
  return forecast;
}

// Rival launches that land while the model polishes, for the calendar strip and the rumor chip.
export function notePolishLandings(state, events) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return;
  for (const event of events) if (event.type === 'rivalRelease') polishing.rivals.push({ id: event.id, day: state.day });
}
