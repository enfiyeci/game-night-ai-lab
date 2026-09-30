import { TEAM_OF, teamBusyError } from '../sim/teams.js';
import { applyActions, advanceDays } from '../sim/turn.js';

// Respond on the day a card appears, using the same actions as the UI, before its deadline.
export function playRound(initial, actions, rng, chooseEvents, observer = {}) {
  let state = initial;
  const events = [], errors = [], transcript = [];
  const act = (chosen) => {
    const occupied = new Set(Object.keys(state.round.teams));
    let slots = 2 - state.round.moves;
    chosen = { ...chosen, moves: (chosen.moves ?? []).filter((move) => {
      const team = TEAM_OF[move.type];
      if (slots <= 0 || occupied.has(team) || teamBusyError(state, move)) return false;
      slots--; occupied.add(team); return true;
    }) };
    transcript.push({ day: state.day, actions: structuredClone(chosen) });
    const result = applyActions(state, chosen, rng);
    state = result.state; events.push(...result.events); errors.push(...result.errors);
  };
  const turn = state.turn;
  act(actions);
  while (!state.ending && state.turn === turn) {
    const choices = chooseEvents(state);
    if (Object.keys(choices).length) act({ eventChoices: choices });
    if (state.ending) break;
    const daily = observer.dailyActions?.(state);
    if (daily) act(daily);
    if (state.ending) break;
    const result = advanceDays(state, 1, rng, observer);
    state = result.state; events.push(...result.events); errors.push(...result.errors);
  }
  transcript.push({ day: state.day, actions: null });
  return { state, events, errors, transcript };
}
