import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { enableScenarios } from '../sim/scenarios.js';
import {
  applyActions,
  advanceDays as runDays,
  endTurn as runTurn,
  MAX_MOVES,
  usesAction,
  setBudget as validateBudget,
} from '../sim/turn.js';
import { nextRoundDay } from '../sim/time.js';
import { turnRecord } from './logic/finance.js';

const initialQueue = (budget) => ({
  budget: structuredClone(budget),
  moves: [],
  hazardChoice: undefined,
  addressWarnings: [],
  eventChoices: {},
  constitutionDraft: undefined,
  holdOrShip: undefined,
});

// history: finance records of turns played before this game object existed (debug scenarios pass their own).
// checkpoint: a game.checkpoint() from a saved run (ui/logic/save.js); the game carries on from exactly there.
export function createGame({ seed = 1, state, history = [], checkpoint = null, eventMode = (checkpoint?.state ?? state)?.eventMode ?? (state || checkpoint ? 'legacy' : 'scenarios') } = {}) {
  const saved = checkpoint && structuredClone(checkpoint);
  let currentState = saved?.state ?? structuredClone(state ?? createInitialState({ seed }));
  if (eventMode === 'scenarios') enableScenarios(currentState);
  const rng = createRng(saved ? saved.rng : seed);
  let actions = initialQueue(currentState.budget);
  const subscribers = new Set();
  const rivalReleases = saved?.rivalReleases ?? [];
  const financeHistory = saved?.financeHistory ?? structuredClone(history);
  let financePlan = saved?.financePlan ?? null; // the finance planner's goals and rounds, kept between openings; a plan, never a move
  // The finance history gains a row at each round mark: the round's start state, its end state and every event in it
  // (instant actions included, so a raise counts in the round it was made).
  let roundStartState = saved?.roundStartState ?? currentState;
  let roundEvents = saved?.roundEvents ?? [];
  let debugActionEvents = [];
  let debugActionErrors = [];
  let lastAlignShare = saved ? saved.lastAlignShare : currentState.activeRun?.recipe.sliders.alignShare;
  // Every input since the last checkpoint, so a save taken while a screen is open can replay up to now and the
  // screens that opened on the way open again (ui/logic/save.js).
  let inputs = [];
  const logDay = () => {
    const last = inputs.at(-1);
    if (last?.kind === 'days') last.n += 1;
    else inputs.push({ kind: 'days', n: 1 });
  };

  // Remembers the alignment share of the latest run, which the trained model does not keep (for the HUD badge).
  const publish = (update, queued) => {
    const releaseTurn = currentState.turn;
    const hadRun = Boolean(currentState.activeRun);
    if (hadRun) lastAlignShare = currentState.activeRun.recipe.sliders.alignShare;
    currentState = update.state;
    roundEvents.push(...update.events);
    if (currentState.turn !== releaseTurn) {
      if (!roundStartState.ending) financeHistory.push(turnRecord(roundStartState, currentState, roundEvents));
      roundStartState = currentState;
      roundEvents = [];
    }
    if (currentState.activeRun) lastAlignShare = currentState.activeRun.recipe.sliders.alignShare;
    else if (!hadRun && update.events.some((event) => event.type === 'runComplete')) {
      const started = queued?.moves.find((move) => move.type === 'startRun'); // a run that started and finished in one step
      if (started) lastAlignShare = started.recipe.sliders.alignShare;
    }
    for (const event of update.events) {
      if (event.type === 'rivalRelease') rivalReleases.push({ turn: releaseTurn, id: event.id });
    }
    const notification = { state: currentState, events: update.events, errors: update.errors };
    // One broken screen must not stop the others (the board meeting's opener among them) or the clock's loop.
    for (const subscriber of subscribers) {
      try {
        subscriber(notification);
      } catch (error) {
        console.error(error);
      }
    }
    return {
      ok: update.errors.length === 0,
      error: update.errors[0],
      events: update.events,
      errors: update.errors,
    };
  };

  const game = {
    get state() { return currentState; },
    get queue() { return actions; },
    get rivalReleases() { return rivalReleases.map((release) => ({ ...release })); },
    clock: null,
    flush() {
      const queued = actions;
      inputs.push({ kind: 'actions', actions: structuredClone(queued) });
      const update = applyActions(currentState, queued, rng);
      actions = initialQueue(update.state.budget);
      const result = publish(update, queued);
      debugActionEvents.push(...result.events);
      debugActionErrors.push(...result.errors);
      return result;
    },
    // The state just past the next round mark, played the way the board meeting's crossMark plays it (queued actions
    // first, then a day at a time until the round changes or the run ends) on copies of the state and the random
    // stream: the game is not touched. From the eve of the mark (one day, as the meeting uses it) the real crossing
    // comes out the same; over several days subscribers may act between days in the real game and not in the copy.
    peekMark() {
      const random = rng.fork();
      const start = currentState;
      let state = structuredClone(start);
      if (actions.moves.length || Object.keys(actions.eventChoices).length) state = applyActions(state, structuredClone(actions), random).state;
      const days = Math.max(1, nextRoundDay(start) - start.day);
      for (let day = 0; day < days && !state.ending && state.turn === start.turn; day += 1) state = runDays(state, 1, random).state;
      return state;
    },
    get financeHistory() {
      return financeHistory.map((row) => ({ ...row }));
    },
    get financePlan() {
      return financePlan && structuredClone(financePlan);
    },
    setFinancePlan(plan) {
      financePlan = structuredClone(plan);
    },
    get lastAlignShare() {
      return lastAlignShare;
    },
    setBudget(budget) {
      const candidate = structuredClone(currentState);
      const result = validateBudget(candidate, budget);
      if (!result.ok) return result;
      actions.budget = structuredClone(candidate.budget);
      return game.flush();
    },
    addMove(move) {
      if (usesAction(move) && game.movesLeft() <= 0) return { ok: false, error: `only ${MAX_MOVES} actions per round` };
      actions.moves.push(structuredClone(move));
      return game.flush();
    },
    removeMove(index) {
      if (!Number.isInteger(index) || index < 0 || index >= actions.moves.length) {
        return { ok: false, error: 'unknown move' };
      }
      actions.moves.splice(index, 1);
      return { ok: true };
    },
    setField(key, value) {
      actions[key] = structuredClone(value);
      return game.flush();
    },
    answerCard(id, choiceId) {
      actions.eventChoices = { ...actions.eventChoices, [id]: choiceId };
      return game.flush();
    },
    advanceDays(n) {
      if (actions.moves.length || Object.keys(actions.eventChoices).length) game.flush();
      debugActionEvents = [];
      debugActionErrors = [];
      const events = [];
      const errors = [];
      for (let day = 0; day < n; day += 1) {
        logDay();
        const result = publish(runDays(currentState, 1, rng));
        events.push(...result.events);
        errors.push(...result.errors);
        if (currentState.ending || game.clock?.now().paused) break;
      }
      return { ok: errors.length === 0, error: errors[0], events, errors };
    },
    endTurn() { // debug and tests only; players never skip
      const queued = actions;
      inputs.push({ kind: 'turn', actions: structuredClone(queued) });
      const update = runTurn(currentState, queued, rng);
      actions = initialQueue(update.state.budget);
      const result = publish(update, queued);
      const events = [...debugActionEvents, ...result.events];
      const errors = [...debugActionErrors, ...result.errors];
      debugActionEvents = [];
      debugActionErrors = [];
      return { ok: errors.length === 0, error: errors[0], events, errors };
    },
    // A copy of everything a resumed game needs, taken between updates; the input log starts afresh from here.
    checkpoint() {
      inputs = [];
      return structuredClone({
        state: currentState, rng: rng.state(), financeHistory, financePlan, roundStartState, roundEvents, rivalReleases, lastAlignShare,
      });
    },
    get inputs() {
      return structuredClone(inputs);
    },
    // A field the UI keeps on the state outside the sim (the model family typed before the first run), logged so a
    // resumed game has it too. Subscribers are not told, as they were not when screens set it directly.
    annotate(key, value) {
      inputs.push({ kind: 'note', key, value: structuredClone(value) });
      currentState = { ...currentState, [key]: structuredClone(value) };
    },
    // Plays a saved input log again from the checkpoint this game was made from, telling subscribers as it goes.
    replay(log) {
      for (const input of structuredClone(log)) {
        if (input.kind === 'days') {
          for (let day = 0; day < input.n && !currentState.ending; day += 1) {
            logDay();
            publish(runDays(currentState, 1, rng));
          }
        } else if (input.kind === 'note') {
          game.annotate(input.key, input.value);
        } else {
          actions = input.actions;
          if (input.kind === 'turn') game.endTurn();
          else game.flush();
        }
      }
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    // Never below 0, so every "no action left" check (movesLeft() === 0) holds; the set pieces never count.
    movesLeft() {
      return Math.max(0, MAX_MOVES - (currentState.round?.moves ?? 0) - actions.moves.filter(usesAction).length);
    },
  };
  return game;
}
