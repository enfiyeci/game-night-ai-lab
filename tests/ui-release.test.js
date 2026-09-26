import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import {
  beatCount, canSkip, checkLabel, laterMoveProblem, nextGeneration, offeredCards, perMillion, priceSheet,
  pricePerMillion, queueBeforeRelease, releaseDraft, releaseOpinions, releasePayload, releasePreview, releaseSpec,
  salesEstimate, servingPerMillion, shipDelay, shipWords, tokensPerUser,
} from '../ui/logic/release.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const rng = { next: () => 0.5, int: () => 0, chance: (p) => p > 0.5, normal: (m) => m };
const trained = () => {
  const s = createInitialState();
  startRun(s, {
    sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
    picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
  });
  advanceRun(s, rng);
  return s;
};
const withSpec = (spec, flags = []) => {
  const s = createInitialState();
  s.pendingModel = { size: 'medium', flags, spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: true, ...spec } };
  return s;
};

test('the default release ships API only, and agentic models become agent API', () => {
  assert.equal(releaseSpec(withSpec({}), [], 'off').channel, 'enterprise');
  assert.equal(releaseSpec(withSpec({}), ['channel-app'], 'off').channel, 'consumer');
  assert.equal(releaseSpec(withSpec({}, ['agentic']), [], 'off').channel, 'agent');
  assert.equal(releaseSpec(withSpec({ reasoningCapable: false }), [], 'high').reasoning, 'off');
});

test('per-token prices follow the sim serving tables', () => {
  const spec = releaseSpec(withSpec({}), [], 'off'); // era 1, enterprise, no thinking
  assert.equal(tokensPerUser(spec, 1), 2); // 0.5 x 4 x 1
  assert.equal(pricePerMillion(spec, 1, 'market'), 15); // $30 a user a month over 2M tokens
  assert.equal(pricePerMillion(spec, 1, 'premium'), 22.5);
  assert.ok(Math.abs(servingPerMillion(spec, 1) - 4.8) < 1e-9); // $6 x medium 1 x dense 1 x short 0.8
  assert.equal(perMillion(1.249), '$1.25');
  const open = releaseSpec(withSpec({}), ['channel-open'], 'off');
  assert.equal(pricePerMillion(open, 1, 'market'), null);
  assert.equal(servingPerMillion(open, 1), null);
});

test('evaluation cards that cost a turn delay the launch', () => {
  const s = trained();
  s.era = 2;
  assert.equal(shipDelay(s, ['eval-full']), 0);
  assert.equal(shipDelay(s, ['eval-third']), 1);
  assert.equal(shipWords(0), 'this turn');
  assert.equal(shipWords(1), 'next turn');
  assert.equal(shipWords(2), 'in 2 turns');
});

test('the number counts up, and skipping is not offered on the first release', () => {
  const s = trained();
  assert.equal(canSkip(s), false);
  assert.equal(nextGeneration(s, true), 1);
  s.models.push({ family: 'Kestrel', generation: 3 });
  assert.equal(canSkip(s), true);
  assert.equal(nextGeneration(s, false), 4);
  assert.equal(nextGeneration(s, true), 5);
});

test('the draft keeps remembered choices that are still valid', () => {
  const s = trained();
  const draft = releaseDraft(s, { picks: ['eval-full', 'not-a-card'], price: 'premium', family: 'Kestrel' });
  assert.deepEqual(draft.picks, ['eval-full']);
  assert.equal(draft.price, 'premium');
  assert.equal(draft.family, 'Kestrel');
  assert.deepEqual(draft.tierWords, { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' });
  assert.equal(releaseDraft(s, { price: 'constructor' }).price, 'market');
});

test('the payload is a valid sim release and carries the size words', () => {
  const s = trained();
  const draft = { ...releaseDraft(s), family: '  Kestrel ', tierWords: { small: 'A', medium: 'B', large: 'C', xl: 'D' } };
  const payload = releasePayload(s, draft);
  assert.deepEqual(payload, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1, tierWords: { small: 'A', medium: 'B', large: 'C', xl: 'D' } });
});

test('the preview needs a family name and reports the cash cost', () => {
  const s = trained();
  const blank = releasePreview(s, { moves: [] }, { ...releaseDraft(s), family: '' });
  assert.equal(blank.ok, false);
  assert.equal(blank.errors[0], 'Type a family name for the model');
  const ok = releasePreview(s, { moves: [] }, { ...releaseDraft(s), family: 'Kestrel', picks: ['eval-full'] });
  assert.equal(ok.ok, true);
  assert.equal(ok.cash, 10);
  assert.equal(ok.name, 'Kestrel 1 Core');
});

test('the payload sends a neutral price for open weights but keeps the player pick otherwise', () => {
  const s = trained();
  const openDraft = { ...releaseDraft(s), family: 'Kestrel', picks: ['channel-open'], price: 'premium' };
  assert.equal(releasePayload(s, openDraft).price, 'market');
  const apiDraft = { ...releaseDraft(s), family: 'Kestrel', picks: [], price: 'premium' };
  assert.equal(releasePayload(s, apiDraft).price, 'premium');
});

test('laterMoveProblem checks every move type queued after the release, ignoring one that already failed', () => {
  const releaseMove = (picks) => ({
    type: 'release',
    release: { picks, price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 },
  });

  // (a) a later move that still works after the edit is not reported.
  const okState = trained();
  okState.cash = 300;
  const okBefore = { moves: [releaseMove(['eval-full']), { type: 'emergency', option: 'bridgeRound' }] };
  const okAfter = { moves: [releaseMove(['eval-full']), { type: 'emergency', option: 'bridgeRound' }] };
  assert.equal(laterMoveProblem(okState, okBefore, okAfter), '');

  // (b) queuedMoveProblem (ui/logic/actions.js) never checks 'emergency' moves. Build a real flip:
  // releasing with eval-full ($10, sim/data/cards.js) drains cash to 290 against this state's
  // ~$49.60 planned burn, which is inside the runway danger zone (sim/economy.js inDangerZone),
  // so a queued bridge round succeeds. Editing the release to drop eval-full keeps that $10 (cash
  // 300), pushing runway just past the 6-month danger-zone line, so the same bridge round now
  // fails with "emergency options open only when runway is short" (sim/economy.js useEmergency) --
  // exactly the silent loss the finding describes.
  const flipState = trained();
  flipState.cash = 300;
  const flipBefore = { moves: [releaseMove(['eval-full']), { type: 'emergency', option: 'bridgeRound' }] };
  const flipAfter = { moves: [releaseMove([]), { type: 'emergency', option: 'bridgeRound' }] };
  assert.equal(
    laterMoveProblem(flipState, flipBefore, flipAfter),
    'emergency options open only when runway is short',
  );

  // (c) a later move that was already broken before the edit (here the bridge round was already
  // used this run) is not reported as a new problem caused by the edit.
  const brokenState = trained();
  brokenState.cash = 10;
  brokenState.flags.emergencyUsed = ['bridgeRound'];
  const brokenBefore = { moves: [releaseMove(['eval-full']), { type: 'emergency', option: 'bridgeRound' }] };
  const brokenAfter = { moves: [releaseMove([]), { type: 'emergency', option: 'bridgeRound' }] };
  assert.equal(laterMoveProblem(brokenState, brokenBefore, brokenAfter), '');
});

test('an already queued release keeps its place, so only the moves ahead of it are projected', () => {
  const queue = { moves: [{ type: 'deal' }, { type: 'release' }, { type: 'startRun' }] };
  assert.deepEqual(queueBeforeRelease(queue).moves, [{ type: 'deal' }]);
  assert.deepEqual(queueBeforeRelease({ moves: [{ type: 'deal' }] }).moves, [{ type: 'deal' }]);
});

test('advisors react to the picks', () => {
  const s = withSpec({});
  const waive = releaseOpinions(s, { ...releaseDraft(s), picks: ['waive'] });
  assert.equal(waive.find((o) => o.id === 'safety').mood, 'alarmed');
  const lossy = releaseOpinions(s, { ...releaseDraft(s), reasoning: 'high', price: 'market' });
  // Thinking hard multiplies tokens by 8, so $1.88 per million is charged against $4.80 of serving.
  assert.equal(lossy.find((o) => o.id === 'cfo').mood, 'alarmed');
  assert.match(lossy.find((o) => o.id === 'cfo').text, /lose money/);
});

test('the badge counts all five rows and hides on a first release', () => {
  assert.equal(beatCount({ benchmarks: [{ shown: 50, flagship: null }] }), null);
  const launch = { benchmarks: [
    { shown: 71, flagship: 58 }, { shown: 64, flagship: 55 }, { shown: 48, flagship: 30 },
    { shown: 14, flagship: 15 }, { shown: 88, flagship: 80 },
  ] };
  assert.deepEqual(beatCount(launch), { beaten: 4, of: 5 });
});

test('the safety label names the strongest check picked', () => {
  assert.equal(checkLabel(['fullEval', 'govEval']), 'Government tested');
  assert.equal(checkLabel(['fullEval', 'thirdPartyEval']), 'Third-party checked');
  assert.equal(checkLabel(['fullEval']), 'Internal evals');
  assert.equal(checkLabel(['quickEval']), 'Self-reported');
});

test('the price sheet uses the real serving cost when the sim has it', () => {
  const model = { channel: 'enterprise', priceStance: 'market', spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'medium', channel: 'enterprise' }, servingCost: 24, activeFromTurn: 5, releasedTurn: 5, newUsers: 1_000_000 };
  const sheet = priceSheet(model, 3); // era 3: 1.5 x 4 x 4 = 24M tokens a user
  assert.equal(sheet.charge, 1.25);
  assert.equal(sheet.serve, 1);
  assert.ok(Math.abs(sheet.margin - 0.2) < 1e-9);
  assert.equal(sheet.live, true);
  // A one-turn-delayed launch (activeFromTurn after releasedTurn) is already serving with a real
  // cost by the time the reveal renders (sim/turn.js advances the turn and re-runs updateServing
  // before the reveal), so it must show as live too -- not mislabelled "from next turn".
  assert.equal(priceSheet({ ...model, activeFromTurn: 6, servingCost: 24 }, 3).live, true);
  assert.ok(Math.abs(priceSheet({ ...model, servingCost: 0, activeFromTurn: 6 }, 3).serve - 0.8) < 1e-9); // light-load formula
  assert.equal(priceSheet({ ...model, servingCost: 0, activeFromTurn: 6 }, 3).live, false);
  assert.deepEqual(priceSheet({ ...model, channel: 'open' }, 3), { open: true });
  assert.equal(salesEstimate(model), 30); // 1M users x $30
});

test('the ready-to-release scenario has a trained model waiting in era 3', () => {
  const s = SCENARIOS.readyToRelease(1);
  assert.ok(s.pendingModel);
  assert.equal(s.era, 3);
  assert.ok(s.models.length >= 1);
});

// Owner 2026-09-26: open weights are hidden from the UI for now (no revenue model yet).
test('offeredCards excludes hidden cards but keeps the rest pickable', () => {
  const s = SCENARIOS.readyToRelease(1);
  assert.ok(!offeredCards(s, 'release').some((card) => card.id === 'channel-open'));
  assert.ok(offeredCards(s, 'release').some((card) => card.id === 'channel-app'));
  const era3 = createInitialState();
  era3.era = 3;
  assert.ok(!offeredCards(era3, 'post').some((card) => card.id === 'tamper'));
});

test('releaseDraft drops a remembered pick for a hidden card, and keeps a visible one', () => {
  const s = trained();
  const dropped = releaseDraft(s, { picks: ['channel-open'] });
  assert.ok(!dropped.picks.includes('channel-open'));
  const kept = releaseDraft(s, { picks: ['channel-app'] });
  assert.ok(kept.picks.includes('channel-app'));
});
