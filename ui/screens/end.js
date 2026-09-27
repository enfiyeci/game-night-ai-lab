// The end of a run: when a turn sets state.ending, the ending's film plays over everything, then the end-of-run
// screen (the owner's "nmix" pick, K2-side-options.html#nmix on side-feed) opens over the office and stays.
import { mountFilm } from '../endings/player.js';
import { music } from '../music.js';
import { endScreenModel } from '../logic/ending.js';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function trapFocus(layer) {
  layer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = [...layer.querySelectorAll('button:not([disabled])')];
    if (items.length === 0) return;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!items.includes(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });
}

function renderEndScreen(overlay, model, { onPlayAgain, onWatch, lumenNote }) {
  overlay.querySelector('.end-layer')?.remove();
  const layer = make('div', 'dialog-layer dialog-open end-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'end-title');
  const veil = make('div', 'dialog-veil');
  veil.setAttribute('aria-hidden', 'true');
  const panel = make('section', 'gp end-panel');

  const top = make('div', 'end-top');
  const heading = make('div');
  const title = make('h1', null, model.title);
  title.id = 'end-title';
  heading.append(make('div', 'end-kicker', model.kicker), title);
  top.append(heading, make('div', 'end-found', `Endings found: ${model.progress.found} of ${model.progress.total}`));

  const left = make('div');
  left.append(make('p', 'end-text', `${model.text} ${model.modelsLine}`));
  if (model.advisors.length > 0) {
    left.append(make('div', 'end-sec', 'Who told you the truth'));
    const labels = make('div', 'end-scale-labels');
    const words = make('div');
    words.append(make('span', null, 'reliable'), make('span', null, 'mixed'), make('span', null, 'misleading'));
    labels.append(make('span'), words, make('span'));
    left.append(labels);
    for (const advisor of model.advisors) {
      const row = make('div', 'end-advisor');
      const name = make('div', 'end-advisor-name', advisor.name);
      name.append(make('small', null, advisor.role));
      const scale = make('div', 'end-scale');
      scale.setAttribute('role', 'img');
      scale.setAttribute('aria-label', `${advisor.name}: ${advisor.verdict}`);
      const dot = make('b');
      dot.style.left = `${advisor.position}%`;
      scale.append(dot);
      row.append(name, scale, make('div', 'end-verdict', advisor.verdict));
      left.append(row);
    }
  }
  if (lumenNote) {
    const note = make('div', 'end-note');
    const words = make('div');
    words.append(make('b', null, 'A note from Lumen'), document.createTextNode(lumenNote));
    note.append(make('div', 'end-lumen'), words);
    left.append(note);
  }

  const right = make('div');
  right.append(make('div', 'end-sec', 'The Daily Token · your endings'));
  const heads = make('div', 'end-heads');
  for (const h of model.headlines) {
    const item = make('div', `end-head${h.found ? '' : ' locked'}${h.isNew ? ' new' : ''}`);
    if (h.found) {
      item.append(make('div', 'end-head-title', h.title), make('div', 'end-head-meta', h.meta));
    } else {
      item.setAttribute('aria-label', `An ending not found yet: ${h.kind === 'win' ? 'a win' : 'a failure'}`);
      item.append(make('i'), make('i'), make('span', `end-kind ${h.kind === 'win' ? 'win' : 'fail'}`, h.kind === 'win' ? 'a win' : 'a failure'));
    }
    heads.append(item);
  }
  right.append(heads);

  const cols = make('div', 'end-cols');
  cols.append(left, right);

  const foot = make('div', 'end-foot');
  const buttons = make('div', 'end-buttons');
  const watch = make('button', 'end-watch', 'Watch the ending again');
  watch.type = 'button';
  watch.addEventListener('click', () => onWatch());
  const again = make('button', 'btn end-again', 'Play again');
  again.type = 'button';
  again.addEventListener('click', () => onPlayAgain());
  buttons.append(watch, again);
  foot.append(make('p', 'end-foot-line', model.footLine), buttons);

  panel.append(top, cols, foot);
  layer.append(veil, panel);
  trapFocus(layer);
  overlay.append(layer);
  again.focus();
  return layer;
}

// The stage zooms the whole page to fit the window (main.js fitToWindow); the film sizes itself from the real
// window, so it plays in a host that undoes that zoom.
// While the film's files load, the host shows a dark "Loading the ending" veil that holds focus; Escape there
// skips straight to the end screen.
function filmHost(onEscape) {
  const doc = globalThis.document;
  if (!doc) return undefined;
  const host = make('div', 'film-host');
  const loading = make('p', 'film-host-loading', 'Loading the ending…');
  loading.setAttribute('role', 'status');
  host.append(loading);
  host.tabIndex = -1;
  const fit = () => {
    const zoom = Number.parseFloat(doc.documentElement.style.zoom) || 1;
    host.style.zoom = `${1 / zoom}`;
  };
  fit();
  addEventListener('resize', fit);
  // Only while loading: once the film is in the host, its own keys (Escape, the Tab trap) take over.
  const onKey = (event) => {
    if (host.querySelector('.film')) return;
    if (event.key === 'Tab') {
      event.preventDefault();
      host.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
    }
  };
  doc.addEventListener('keydown', onKey);
  // The film only makes its own root's other children inert, so the host does it for the rest of the page.
  const inerted = [...doc.body.children].filter((child) => !child.inert);
  host.close = () => {
    removeEventListener('resize', fit);
    doc.removeEventListener('keydown', onKey);
    for (const child of inerted) child.inert = false;
    host.remove();
  };
  for (const child of inerted) child.inert = true;
  doc.body.append(host);
  host.focus();
  return host;
}

// Plays the film for the ending the game just reached, then shows the end-of-run screen. Call show() directly
// for a run that was already over when the page loaded (no click, so no film until the player asks for it).
export function mountEnding(game, overlay, { collection, onPlayAgain, loadFilm = mountFilm, lumenNote = () => null } = {}) {
  let recorded = null;
  let model = null;
  let playing = false;

  // save is false for a run that was already over when the page loaded (a debug scenario), which the player
  // did not reach, so it stays out of their collection; the screen still counts it as found this run.
  const record = (state, { save = true } = {}) => {
    if (recorded === state.ending) return;
    recorded = state.ending;
    if (save) collection?.record(state.ending, { seed: state.seed, era: state.era, turn: state.turn, model: state.models.at(-1)?.name ?? null });
    const entries = collection?.entries() ?? [];
    const newThisRun = save && entries.find((entry) => entry.id === state.ending)?.count === 1;
    model = endScreenModel(state, entries, { newThisRun });
  };

  const show = ({ save = true } = {}) => {
    record(game.state, { save });
    renderEndScreen(overlay, model, { onPlayAgain, onWatch: () => play(), lumenNote: lumenNote(game.state) });
  };

  async function play() {
    if (playing) return;
    playing = true;
    const state = game.state;
    const fromWatch = globalThis.document?.activeElement?.classList?.contains('end-watch') ?? false;
    let skipped = false;
    music.hold('film');
    const close = () => {
      playing = false;
      music.release('film');
      host?.close();
      show();
      if (fromWatch) overlay.querySelector('.end-watch')?.focus();
    };
    const host = filmHost(() => {
      skipped = true;
      close();
    });
    try {
      const film = await loadFilm(host, {
        id: state.ending,
        era: state.era,
        run: { deal: state.deal },
        onDone: () => {
          if (!skipped) close();
        },
      });
      if (skipped) { // the player skipped while it loaded: the end screen is already up, so free the film's media
        film.stop?.();
        return;
      }
      host?.querySelector('.film-host-loading')?.remove();
      film.play();
    } catch (error) {
      console.error(error);
      if (!skipped) close();
    }
  }

  // Owner 2026-09-26: if the ending came with another dialog (the release reveal), let the player close it first.
  const playWhenClear = () => {
    if (overlay?.querySelector('.dialog-layer') || overlay?.querySelector('.screenwall-layer')) overlay.addEventListener('gdt-dialog-closed', playWhenClear, { once: true });
    else play();
  };

  // A board meeting holds the film until it closes: the vote that removed you plays out first (board UI plan Task 6).
  // Then any other dialog (the release reveal, held for the meeting) still goes first.
  let meetingOpen = false;
  let heldForMeeting = false;
  overlay?.addEventListener?.('board-meeting-open', () => { meetingOpen = true; });
  overlay?.addEventListener?.('board-meeting-closed', () => {
    meetingOpen = false;
    if (!heldForMeeting) return;
    heldForMeeting = false;
    queueMicrotask(playWhenClear); // the release reveal opens on this same event
  });

  const unsubscribe = game.subscribe(({ state }) => {
    if (!state.ending || recorded === state.ending) return;
    record(state);
    if (meetingOpen) {
      heldForMeeting = true;
      return;
    }
    // Deferred one microtask: game.js's notify loop runs every subscriber for this endTurn synchronously and
    // in registration order, so a later subscriber (the release reveal) may not have opened its dialog yet if
    // we checked right here. Waiting a microtask runs after that whole synchronous loop finishes, so the
    // dialog is open by the time we check, whichever order the subscribers were registered in.
    queueMicrotask(playWhenClear);
  });

  return { show, play, unsubscribe };
}
