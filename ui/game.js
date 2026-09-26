import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import {
  applyActions,
  advanceDays as runDays,
  endTurn as runTurn,
  MAX_MOVES,
  setBudget as validateBudget,
} from '../sim/turn.js';

const initialQueue = (budget) => ({
  budget: structuredClone(budget),
  moves: [],
  hazardChoice: undefined,
  addressWarnings: [],
  eventChoices: {},
  constitution: undefined,
  holdOrShip: undefined,
});

export function createGame({ seed = 1, state } = {}) {
  let currentState = structuredClone(state ?? createInitialState({ seed }));
  const rng = createRng(seed);
  let actions = initialQueue(currentState.budget);
  const subscribers = new Set();
  const rivalReleases = [];
  let debugActionEvents = [];
  let debugActionErrors = [];

  const publish = (update) => {
    const releaseTurn = currentState.turn;
    currentState = update.state;
    for (const event of update.events) {
      if (event.type === 'rivalRelease') rivalReleases.push({ turn: releaseTurn, id: event.id });
    }
    const notification = { state: currentState, events: update.events, errors: update.errors };
    for (const subscriber of subscribers) subscriber(notification);
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
      const result = publish(update);
      debugActionEvents.push(...result.events);
      debugActionErrors.push(...result.errors);
      return result;
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
      let result = { ok: true, error: undefined, events: [], errors: [] };
      for (let day = 0; day < n; day += 1) {
        result = publish(runDays(currentState, 1, rng));
        if (currentState.ending || game.clock?.now().paused) break;
      }
      return result;
    },
    endTurn() { // debug and tests only; players never skip
      const queued = actions;
      const update = runTurn(currentState, queued, rng);
      actions = initialQueue(update.state.budget);
      const result = publish(update);
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
