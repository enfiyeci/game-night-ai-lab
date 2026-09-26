import { money, pct, users } from '../logic/format.js';
import { beatCount, checkLabel, flagshipBefore, perMillion, priceSheet, salesEstimate } from '../logic/release.js';

// Coral stays for the misalignment warning post, so ordinary avatars never look like a warning (mockup avatar set).
const AVATAR_COLOURS = ['var(--ink)', 'var(--teal)', 'var(--sky)', 'var(--wood)', 'color-mix(in oklab, var(--sky) 55%, var(--ink))'];
let nextRevealId = 0;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const shortName = (model) => `${model.family} ${model.generation}`;

function bar(label, value, kind, mark, me = false) {
  const row = el('div', `reveal-bar${me ? ' me' : ''}`);
  const track = el('span', 'reveal-track');
  const fill = el('i', `reveal-fill ${kind}`);
  fill.style.width = `${value}%`;
  track.append(fill);
  if (mark != null) {
    const tick = el('span', 'reveal-mark');
    tick.style.left = `${mark}%`;
    track.append(tick);
  }
  const name = el('span', 'reveal-bar-label', label);
  name.title = label; // long family names are cut with an ellipsis; the full name shows on hover
  row.append(name, track, el('span', 'reveal-bar-value', `${value}`));
  return row;
}

function benchmarks(state, model) {
  const root = el('div', 'reveal-col');
  const flagship = flagshipBefore(state, model);
  const lastName = flagship ? shortName(flagship) : 'Last flagship';
  const hasFlagship = model.launch.benchmarks.some((row) => row.flagship != null);
  root.append(el('div', 'sec', 'Benchmarks'));
  const legend = el('div', 'reveal-legend');
  const keys = [['k-new', shortName(model)]];
  // A first release has no last-flagship bars, so the legend does not name one.
  if (hasFlagship) keys.push(['k-last', flagship ? `${lastName} (last flagship)` : lastName]);
  keys.push(['k-rival', 'Best rival']);
  for (const [kind, text] of keys) {
    const item = el('span');
    item.append(el('i', `reveal-swatch ${kind}`), text);
    legend.append(item);
  }
  root.append(legend);
  for (const row of model.launch.benchmarks) {
    const block = el('div', 'reveal-bench');
    const head = el('div', 'reveal-bench-name');
    const title = el('span', null, row.name);
    if (row.kind === 'safety') title.append(el('span', 'reveal-check', checkLabel(model.flags)));
    head.append(title);
    if (row.flagship != null) {
      const delta = row.shown - row.flagship;
      head.append(el('em', delta < 0 ? 'down' : '', `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)}`));
    }
    block.append(head, bar(shortName(model), row.shown, 'k-new', row.flagship, true));
    if (row.flagship != null) block.append(bar(lastName, row.flagship, 'k-last'));
    block.append(bar('Best rival', row.rival, 'k-rival'));
    root.append(block);
  }
  return root;
}

function press(model) {
  const root = el('div', 'reveal-col');
  root.append(el('div', 'sec', 'Press'));
  for (const critic of model.launch.press) {
    const card = el('div', 'reveal-critic');
    const score = el('div', 'reveal-score', `${critic.score}`);
    score.append(el('small', null, '/10'));
    card.append(el('div', 'reveal-critic-name', critic.name), score, el('div', 'reveal-quip', `"${critic.quip}"`));
    root.append(card);
  }
  return root;
}

function reactions(state, model, misalignmentIncident) {
  const root = el('div', 'reveal-col');
  root.append(el('div', 'sec', 'Reactions'));
  const posts = [...model.launch.reactions];
  if (misalignmentIncident) {
    // Other posts share the 'warning' tag too (marketwire spot-GPU in sim/turn.js, event warnings
    // in sim/events.js); match the handle so this is the misalignment post from sim/release.js.
    const warning = state.feed.findLast((post) => post.tag === 'warning' && post.handle === '@sre_oncall');
    if (warning) posts.unshift({ handle: warning.handle, text: warning.text, warning: true });
  }
  posts.slice(0, 5).forEach((post, index) => {
    const row = el('div', `reveal-post${post.warning ? ' warning' : ''}`);
    const avatar = el('div', 'reveal-avatar', post.handle.replace('@', '')[0].toUpperCase());
    avatar.style.background = post.warning ? 'var(--coral)' : AVATAR_COLOURS[index % AVATAR_COLOURS.length];
    const text = el('div');
    text.append(el('div', 'reveal-handle', post.handle), el('div', 'reveal-text', post.text));
    row.append(avatar, text);
    root.append(row);
  });
  return root;
}

function sheet(model, era) {
  const data = priceSheet(model, era);
  const root = el('div', 'reveal-sheet');
  if (data.open) {
    const cell = el('span');
    cell.append(el('small', null, 'Open weights'), el('b', null, 'Free download'), el('small', null, "you don't serve it"));
    root.append(cell);
    return root;
  }
  const cells = [
    ['You charge', perMillion(data.charge), 'per million tokens'],
    ['Serving costs you', perMillion(data.serve), data.live ? 'per million tokens' : 'per million tokens, once it is serving'],
    ['Margin', pct(data.margin), `${data.channel} · thinking ${data.thinking}`],
  ];
  for (const [label, value, note] of cells) {
    const cell = el('span');
    const number = el('b', label === 'Margin' ? (data.margin < 0 ? 'loss' : 'good') : '', value);
    cell.append(el('small', null, label), number, el('small', null, note));
    root.append(cell);
  }
  return root;
}

export function showReveal(overlayRoot, { state, model, misalignmentIncident = false, onClose }) {
  const layer = el('div', 'dialog-layer reveal-layer');
  const titleId = `reveal-title-${++nextRevealId}`;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', titleId);
  const veil = el('div', 'dialog-veil');
  veil.setAttribute('aria-hidden', 'true');
  const panel = el('section', 'gp rel reveal reveal-play');
  panel.tabIndex = -1;

  const top = el('div', 'reveal-top');
  const heading = el('div');
  const title = el('h1', null, `${model.name} is out`);
  title.id = titleId;
  heading.append(el('div', 'reveal-kick', 'Model release'), title);
  const side = el('div', 'reveal-side');
  const count = beatCount(model.launch);
  if (count) {
    const badge = el('div', 'reveal-beat');
    badge.append(el('span', 'up'), `Beats your last flagship on ${count.beaten} of ${count.of} benchmarks`);
    side.append(badge);
  }
  side.append(sheet(model, state.era));
  top.append(heading, side);

  const cols = el('div', 'reveal-cols');
  cols.append(benchmarks(state, model), press(model), reactions(state, model, misalignmentIncident));

  const foot = el('div', 'reveal-foot');
  const usersLine = el('div', 'reveal-users');
  // Owner 2026-09-26 wording for when open weights returns: no user count to show, since nobody
  // signs up for a download (the sales estimate is already omitted for open weights below).
  if (model.channel === 'open') usersLine.textContent = 'Free download. Anyone can run it now.';
  else usersLine.append('New users this month: ', el('b', null, `+${users(model.newUsers)}`));
  const left = el('div');
  left.append(usersLine);
  const sales = salesEstimate(model);
  if (sales > 0) {
    const estimate = el('div', 'reveal-estimate');
    estimate.append('About ', el('b', null, `${money(sales)} a month`), ' in sales (estimate)');
    left.append(estimate);
  }
  const done = el('button', 'btn reveal-continue', 'Continue');
  done.type = 'button';
  foot.append(left, done);

  panel.append(top, cols, foot);
  layer.append(veil, panel);

  const previousFocus = document.activeElement;
  let closed = false;
  // Owner pick 4B: the build-up runs about four seconds; any click or key during it jumps to the
  // end. Must stay ahead of the CSS build-up: Continue lights at 4.2s + .3s (.reveal-play
  // .reveal-continue in ui/styles.css).
  let finished = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timer = setTimeout(() => { finished = true; }, 4500);
  const finish = () => {
    finished = true;
    panel.classList.add('reveal-skip');
  };
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    layer.remove();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    onClose?.();
  };
  // Capture phase, so a click on Continue or the veil during the build-up only skips. mousedown
  // is where the browser would otherwise move focus off Continue (e.g. to <body> on a veil
  // click, since the veil isn't focusable); blocking that keeps focus inside the layer so the
  // keydown listener below keeps firing after any click.
  layer.addEventListener('mousedown', (event) => {
    if (event.target !== done) event.preventDefault();
  }, true);
  layer.addEventListener('click', (event) => {
    if (!finished) {
      event.preventDefault();
      event.stopPropagation();
      finish();
      done.focus();
      return;
    }
    if (event.target === done) {
      close();
      return;
    }
    done.focus();
  }, true);
  layer.addEventListener('keydown', (event) => {
    if (!finished) {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      done.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      if (event.repeat) {
        // A key held from before the build-up finished still auto-repeats here. Without
        // preventDefault, the browser's native Enter/Space activation on the focused Continue
        // button would still fire a click and close the reveal out from under the held key.
        event.preventDefault();
        return;
      }
      // preventDefault also suppresses the button's native Enter/Space-activation click, so
      // close() (idempotent via the `closed` guard) only runs once here.
      event.preventDefault();
      close();
    }
  });

  overlayRoot.append(layer);
  // The shared dialog CSS keeps .dialog-layer at opacity 0 until .dialog-open is added (ui/styles.css).
  requestAnimationFrame(() => layer.classList.add('dialog-open'));
  done.focus();
  return layer;
}

// While a board meeting is open the reveal waits, and plays when the meeting closes (board UI review I3).
export function mountReveal(game, overlayRoot, { show = showReveal } = {}) {
  let meetingOpen = false;
  let held = null;
  overlayRoot?.addEventListener?.('board-meeting-open', () => { meetingOpen = true; });
  overlayRoot?.addEventListener?.('board-meeting-closed', () => {
    meetingOpen = false;
    const waiting = held;
    held = null;
    if (waiting) show(overlayRoot, waiting);
  });
  return game.subscribe(({ state, events }) => {
    const release = events.find((event) => event.type === 'release' && event.ok);
    if (!release) return;
    const reveal = { state, model: release.model, misalignmentIncident: Boolean(release.misalignmentIncident) };
    if (meetingOpen) held = reveal;
    else show(overlayRoot, reveal);
  });
}
