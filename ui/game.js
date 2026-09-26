import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn as runTurn, MAX_MOVES, setBudget as validateBudget } from '../sim/turn.js';

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
  let lastAlignShare = currentState.activeRun?.recipe.sliders.alignShare;

  return {
    get state() {
      return currentState;
    },
    get queue() {
      return actions;
    },
    get rivalReleases() {
      return rivalReleases.map((release) => ({ ...release }));
    },
    get lastAlignShare() {
      return lastAlignShare;
    },
    setBudget(budget) {
      const candidate = structuredClone(currentState);
      const result = validateBudget(candidate, budget);
      if (result.ok) actions.budget = structuredClone(candidate.budget);
      return result;
    },
    addMove(move) {
      if (actions.moves.length >= MAX_MOVES) return { ok: false, error: `only ${MAX_MOVES} moves per turn` };
      actions.moves.push(structuredClone(move));
      return { ok: true };
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
      return { ok: true };
    },
    endTurn() {
      if (currentState.activeRun) lastAlignShare = currentState.activeRun.recipe.sliders.alignShare;
      const hadRun = Boolean(currentState.activeRun);
      const startedShare = actions.moves.find((move) => move.type === 'startRun')?.recipe.sliders.alignShare;
      const turn = currentState.turn;
      const update = runTurn(currentState, actions, rng);
      currentState = update.state;
      if (currentState.activeRun) lastAlignShare = currentState.activeRun.recipe.sliders.alignShare;
      else if (!hadRun && startedShare !== undefined && update.events.some((event) => event.type === 'runComplete')) {
        lastAlignShare = startedShare; // a run that started and finished in one step
      }
      actions = initialQueue(actions.budget);
      for (const event of update.events) {
        if (event.type === 'rivalRelease') rivalReleases.push({ turn, id: event.id });
      }
      const notification = { state: currentState, events: update.events, errors: update.errors };
      for (const subscriber of subscribers) subscriber(notification);
      return { events: update.events, errors: update.errors };
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    movesLeft() {
      return MAX_MOVES - actions.moves.length;
    },
  };
}
