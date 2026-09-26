import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import {
  applyActions,
  advanceDays as runDays,
  endTurn as runTurn,
  MAX_MOVES,
  setBudget as validateBudget,
} from '../sim/turn.js';
import { turnRecord } from './logic/finance.js';

const initialQueue = (budget) => ({
  budget: structuredClone(budget),
  moves: [],
  hazardChoice: undefined,
  addressWarnings: [],
  eventChoices: {},
  constitution: undefined,
  holdOrShip: undefined,
});

// history: finance records of turns played before this game object existed (debug scenarios pass their own).
export function createGame({ seed = 1, state, history = [] } = {}) {
  let currentState = structuredClone(state ?? createInitialState({ seed }));
  const rng = createRng(seed);
  let actions = initialQueue(currentState.budget);
  const subscribers = new Set();
  const rivalReleases = [];
  const financeHistory = structuredClone(history);
  let financePlan = null; // the finance planner's goals and rounds, kept between openings; a plan, never a move
  // The finance history gains a row at each round mark: the round's start state, its end state and every event in it
  // (instant actions included, so a raise counts in the round it was made).
  let roundStartState = currentState;
  let roundEvents = [];
  let debugActionEvents = [];
  let debugActionErrors = [];
  let lastAlignShare = currentState.activeRun?.recipe.sliders.alignShare;

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
      const update = applyActions(currentState, queued, rng);
      actions = initialQueue(update.state.budget);
      const result = publish(update, queued);
      debugActionEvents.push(...result.events);
      debugActionErrors.push(...result.errors);
      return result;
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
      if (game.movesLeft() <= 0) return { ok: false, error: `only ${MAX_MOVES} actions per round` };
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
        const result = publish(runDays(currentState, 1, rng));
        events.push(...result.events);
        errors.push(...result.errors);
        if (currentState.ending || game.clock?.now().paused) break;
      }
      return { ok: errors.length === 0, error: errors[0], events, errors };
    },
    endTurn() { // debug and tests only; players never skip
      const queued = actions;
      const update = runTurn(currentState, queued, rng);
      actions = initialQueue(update.state.budget);
      const result = publish(update, queued);
      const events = [...debugActionEvents, ...result.events];
      const errors = [...debugActionErrors, ...result.errors];
      debugActionEvents = [];
      debugActionErrors = [];
      return { ok: errors.length === 0, error: errors[0], events, errors };
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    movesLeft() {
      return MAX_MOVES - (currentState.round?.moves ?? 0) - actions.moves.length;
    },
  };
  return game;
}
