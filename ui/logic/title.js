import { ENDINGS } from '../../sim/endings.js';

export const NAME_MAX = 24;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// The front door shows on a plain visit. Debug links (?scenario=, any #route, ?notitle) and a finished run
// loaded from a link go straight to the game, so previews and tests behave as before.
export function titleShows({ search = '', hash = '', ending = null } = {}) {
  const params = new URLSearchParams(search);
  return !params.has('scenario') && !params.has('notitle') && !hash && !ending;
}

// The typed lab name, trimmed and capped; a blank name means "keep the game's default".
export function cleanLabName(value) {
  const name = String(value ?? '').trim().slice(0, NAME_MAX).trim();
  return name || null;
}

// The endings wall: every ending in the sim's order, found or not, plus the line for the last tile.
export function wallModel(entries = []) {
  const found = new Set(entries.map((entry) => entry.id));
  const tiles = Object.entries(ENDINGS).map(([id, ending]) => ({
    id,
    found: found.has(id),
    title: ending.title,
    kind: ending.kind === 'win' ? 'A win' : 'A failure',
  }));
  const left = tiles.filter((tile) => !tile.found).length;
  const note = left === 0
    ? 'You have found every ending'
    : `${left === 1 ? 'One story is' : `${capital(WORDS[left] ?? String(left))} stories are`} still unwritten`;
  return { tiles, found: tiles.length - left, total: tiles.length, note };
}
