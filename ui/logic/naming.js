import { modelName } from '../../sim/release.js';

// The player names the model family when they start their first training run (owner pick N1, 2026-09-26),
// as Game Dev Tycoon asks for a game's name before development starts. The name waits on the state as
// modelFamily until the first release records it on a model; after that the latest release's family wins.
export const FAMILY_MAX = 24;
const PLACEHOLDER = 'Kestrel'; // only for runs that began without the naming step (debug scenarios)

export const cleanFamily = (text) => (typeof text === 'string' ? text.trim().slice(0, FAMILY_MAX) : '');

export function familyName(state) {
  return cleanFamily(state.models?.at(-1)?.family) || cleanFamily(state.modelFamily);
}

export const needsFamilyName = (state) => !familyName(state);

// The next model's name while it is planned or trained: family, next number, size word.
export function workingName(state, size) {
  const last = state.models?.at(-1);
  return modelName({
    family: familyName(state) || PLACEHOLDER,
    generation: (last?.generation ?? 0) + 1,
    size,
    tierWords: state.tierWords,
  });
}
