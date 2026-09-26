import { roundMarkDay, storyDate } from '../../sim/time.js';
import { money, pct, users } from '../logic/format.js';
import { beatCount, checkLabel, flagshipBefore, leaderboard, perMillion, priceSheet, salesEstimate } from '../logic/release.js';
import { createSfx } from '../sfx.js';

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
const oneDecimal = (value) => Math.round(value * 10) / 10;

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

// ---------- the launch show (owner pick 2026-09-26: reveal option B plus the leaderboard climb) ----------
// Before the summary, the release plays as a short show: each benchmark as a race against your last
// flagship and the leading rival, then the leaderboard climb, then the critics' cards flipped one
// by one. A click or key finishes the current beat; Escape or "Show all results" jumps to the summary.

const easeOut = (p) => 1 - (1 - p) ** 3;
const sfx = createSfx();

// Waits and tweens the player can hurry: advance() finishes the current beat, end() the whole show.
class Timeline {
  constructor() {
    this.fast = false;
    this.ended = false;
    this.pending = new Set();
  }

  get live() { return !this.fast && !this.ended; }

  wait(ms) {
    if (!this.live) return Promise.resolve();
    return new Promise((resolve) => {
      const entry = { resolve };
      entry.timer = setTimeout(() => { this.pending.delete(entry); resolve(); }, ms);
      this.pending.add(entry);
    });
  }

  tween(ms, frame) {
    if (!this.live) {
      frame(1);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const start = performance.now();
      const entry = { resolve: () => { frame(1); resolve(); } };
      this.pending.add(entry);
      const step = (now) => {
        if (!this.pending.has(entry)) return;
        const p = Math.min(1, (now - start) / ms);
        frame(p);
        if (p < 1) requestAnimationFrame(step);
        else {
          this.pending.delete(entry);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  flush() {
    for (const entry of this.pending) {
      clearTimeout(entry.timer);
      entry.resolve();
    }
    this.pending.clear();
  }

  beat() { this.fast = false; }

  advance() {
    if (this.live) sfx.stamp(0.3);
    this.fast = true;
    this.flush();
  }

  end() {
    this.ended = true;
    this.flush();
  }

  sound(play) { if (this.live) play(); }

  // Restart a one-shot CSS animation class.
  kick(node, name) {
    if (!this.live) return;
    node.classList.remove(name);
    void node.offsetWidth;
    node.classList.add(name);
  }
}

function confetti(t, root, x, y, count = 30) {
  if (!t.live) return;
  const colours = ['var(--coral)', 'var(--teal)', 'var(--wood)', 'var(--sky)'];
  for (let i = 0; i < count; i += 1) {
    const bit = el('i', 'rshow-confetti');
    const angle = Math.random() * Math.PI * 2;
    const reach = 80 + Math.random() * 160;
    bit.style.cssText = `left:${x}px;top:${y}px;background:${colours[i % colours.length]};--dx:${Math.cos(angle) * reach}px;--dy:${Math.sin(angle) * reach + 120}px;--r:${Math.random() * 720 - 360}deg`;
    root.append(bit);
    setTimeout(() => bit.remove(), 1200);
  }
}

// Count a number up with a tick whose pitch climbs with the value.
function countTo(t, node, to, ms, { from = 0, stepSize = 4, base = 392, ticks = true, onValue } = {}) {
  let lastStep = -1;
  return t.tween(ms, (p) => {
    const value = Math.round(from + (to - from) * easeOut(p));
    node.textContent = `${value}`;
    onValue?.(value);
    const step = Math.floor(value / stepSize);
    if (ticks && step !== lastStep && p < 1) {
      lastStep = step;
      t.sound(() => sfx.tick(Math.max(0, step), { base }));
    }
  });
}

function rivalChip(row, leader) {
  const diff = row.shown - row.rival;
  if (diff > 0) return el('em', 'rshow-chip up', `▲ ${diff} over ${leader}`);
  if (diff === 0) return el('em', 'rshow-chip even', `Ties ${leader}`);
  return el('em', 'rshow-chip down', `${-diff} short of ${leader}`);
}

function flagshipChip(row, lastName) {
  if (row.flagship == null) return null;
  const delta = row.shown - row.flagship;
  const text = `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)} on ${lastName}`;
  return el('em', `rshow-chip ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'even'}`, text);
}

async function showScene(t, body, scene) {
  const old = body.querySelector('.rshow-scene:not(.out)');
  if (old) {
    old.classList.add('out');
    setTimeout(() => old.remove(), 350);
  }
  scene.classList.add('in');
  body.append(scene);
  void scene.offsetWidth;
  scene.classList.remove('in');
  await t.wait(350);
}

async function benchmarkRace(t, show, row, index) {
  const { body, dots, leader, lastName, newName } = show;
  const scene = el('div', 'rshow-scene');
  const title = el('div', 'rshow-title');
  title.append(el('small', null, row.kind === 'safety' ? 'Safety benchmark' : 'Benchmark'), row.name);
  const lane = (label, note, kind, me = false) => {
    const node = el('div', `rshow-lane${me ? ' me' : ''}`);
    const name = el('div', 'rshow-lane-name', label);
    name.append(el('small', null, note));
    const track = el('div', 'rshow-track');
    const fill = el('i', `rshow-fill ${kind}`);
    track.append(fill);
    const value = el('div', 'rshow-value', '0');
    node.append(name, track, value);
    return { node, fill, value };
  };
  const targets = [];
  if (row.flagship != null) targets.push({ key: 'last', lane: lane(lastName, 'your last flagship', 'k-last'), score: row.flagship });
  targets.push({ key: 'rival', lane: lane(leader, 'best rival', 'k-rival'), score: row.rival });
  const mine = lane(newName, 'new', 'k-new', true);
  const verdict = el('div', 'rshow-verdict');
  scene.append(title, ...targets.map((target) => target.lane.node), mine.node, verdict);
  await showScene(t, body, scene);

  for (const { lane: target, score } of targets) {
    t.sound(() => sfx.whoosh(0.35, 0.03));
    await countTo(t, target.value, score, 300, { ticks: false, onValue: (value) => { target.fill.style.width = `${value}%`; } });
  }
  await t.wait(300);
  t.sound(() => sfx.whoosh(1.2, 0.05));
  const passed = new Set();
  await countTo(t, mine.value, row.shown, 1100, {
    stepSize: 3,
    base: 294,
    onValue: (value) => {
      mine.fill.style.width = `${value}%`;
      for (const target of targets) {
        if (passed.has(target.key) || value <= target.score) continue;
        passed.add(target.key);
        target.lane.node.classList.add('beaten');
        t.sound(() => sfx.pass(target.key === 'rival' ? 5 : 0));
      }
    },
  });
  for (const target of targets) if (row.shown > target.score) target.lane.node.classList.add('beaten');
  const diff = row.shown - row.rival;
  verdict.replaceChildren(...[flagshipChip(row, lastName), rivalChip(row, leader)].filter(Boolean));
  t.kick(verdict, 'rshow-stamp');
  dots[index].classList.add(diff > 0 ? 'win' : diff < 0 ? 'lose' : 'tie');
  t.kick(dots[index], 'rshow-pop');
  if (diff > 0) {
    t.sound(() => sfx.stamp(0.45));
    t.kick(mine.node, 'rshow-flash');
  } else t.sound(() => (diff < 0 ? sfx.miss() : sfx.pop(-3)));
  await t.wait(700);
}

const ROW_HEIGHT = 54;

async function leaderboardClimb(t, show, launch) {
  const { body, panel, board } = show;
  const scene = el('div', 'rshow-scene rshow-board-scene');
  const title = el('div', 'rshow-title');
  title.append(el('small', null, 'Average of the four capability benchmarks'), 'Leaderboard');
  const rowsNode = el('div', 'rshow-rows');
  const result = el('div', 'rshow-result');
  const ahead = launch.benchmarks.filter((row) => row.shown > row.rival).length;
  const aheadLine = el('div', 'rshow-result-note', `Ahead of ${board.leader} on ${ahead} of ${launch.benchmarks.length} benchmarks`);
  scene.append(title, rowsNode, result, aheadLine);
  const entries = [...board.rows.map((row) => ({ ...row })), { ...board.mine }];
  rowsNode.style.height = `${entries.length * ROW_HEIGHT}px`;
  const labels = { rival: 'Rival lab', own: 'Your lab', new: 'New' };
  for (const entry of entries) {
    const node = el('div', `rshow-row ${entry.kind}`);
    const rank = el('div', 'rshow-rank');
    const name = el('div', 'rshow-row-name', entry.name);
    name.append(el('small', null, labels[entry.kind]));
    const bar = el('div', 'rshow-row-bar');
    const fill = el('i');
    fill.style.width = `${entry.score}%`;
    bar.append(fill);
    const score = el('div', 'rshow-row-score', entry.score.toFixed(1));
    node.append(rank, name, bar, score);
    rowsNode.append(node);
    Object.assign(entry, { node, rank, fill, scoreNode: score });
  }
  const mine = entries.at(-1);
  const layout = () => entries.forEach((entry, index) => {
    entry.node.style.top = `${index * ROW_HEIGHT}px`;
    entry.rank.textContent = `#${index + 1}`;
  });
  layout();
  mine.node.classList.add('waiting');
  await showScene(t, body, scene);
  mine.node.classList.remove('waiting');
  t.sound(() => sfx.pop(0));
  await t.wait(400);

  const target = board.mine.score;
  const from = Math.max(0, Math.min(...board.rows.map((row) => row.score), target) - 8);
  let lastTick = -1;
  t.sound(() => sfx.whoosh(2.2, 0.05));
  await t.tween(2400, (p) => {
    const value = p < 1 ? from + (target - from) * easeOut(p) : target;
    mine.score = value;
    mine.scoreNode.textContent = value.toFixed(1);
    mine.fill.style.width = `${value}%`;
    const step = Math.floor(value / 3);
    if (step !== lastTick && p < 1) {
      lastTick = step;
      t.sound(() => sfx.tick(step, { base: 262, gain: 0.05 }));
    }
    let index = entries.indexOf(mine);
    while (index > 0 && value > entries[index - 1].score) {
      [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
      index -= 1;
      const climbed = entries.length - index;
      t.sound(() => sfx.climb(climbed));
      layout();
    }
  });
  const rank = entries.indexOf(mine) + 1;
  if (rank === 1) {
    mine.node.classList.add('top');
    const crown = el('span', 'rshow-crown', 'New #1');
    mine.node.append(crown);
    t.kick(crown, 'rshow-stamp');
    const margin = oneDecimal(target - entries[1].score);
    result.textContent = margin < 1 ? `#1 by a hair: ${margin.toFixed(1)} ahead of ${entries[1].name}` : `#1, ${margin.toFixed(1)} ahead of ${entries[1].name}`;
    t.sound(() => sfx.fanfare());
    t.kick(panel, 'rshow-shake');
    confetti(t, panel, 532, 200);
  } else {
    const above = entries[rank - 2];
    const gap = oneDecimal(above.score - target).toFixed(1);
    result.textContent = above.kind === 'own' ? `#${rank}: your own ${above.name} still leads by ${gap}` : `#${rank}: ${gap} behind ${above.name}`;
    t.sound(() => sfx.miss());
  }
  t.kick(result, 'rshow-stamp');
  await t.wait(1200);
}

async function pressFlip(t, show, launch) {
  const { body, panel } = show;
  const scene = el('div', 'rshow-scene');
  const title = el('div', 'rshow-title');
  title.append(el('small', null, 'Reviews'), 'The press');
  const cards = el('div', 'rshow-cards');
  const flips = launch.press.map((critic) => {
    const card = el('div', 'rshow-card');
    const back = el('div', 'rshow-face rshow-back', '?');
    const front = el('div', 'rshow-face rshow-front');
    const score = el('div', 'rshow-score');
    score.append(document.createTextNode('–'), el('small', null, '/10'));
    front.append(el('div', 'rshow-critic', critic.name), score, el('div', 'rshow-quip', `"${critic.quip}"`));
    card.append(back, front);
    cards.append(card);
    return { critic, card, front, score };
  });
  const average = el('div', 'rshow-average', 'Average score');
  const averageValue = el('b', null, '–');
  average.append(averageValue);
  average.hidden = true;
  scene.append(title, cards, average);
  await showScene(t, body, scene);

  const roll = async (node, ms, final, random) => {
    await t.tween(ms, (p) => { node.textContent = p < 1 ? random() : final; });
    node.textContent = final;
  };
  for (const { critic, card, front, score } of flips) {
    card.classList.add('flip');
    t.sound(() => sfx.whoosh(0.25, 0.04));
    await t.wait(300);
    t.sound(() => sfx.reel(0.7, 12));
    await roll(score.firstChild, 700, `${critic.score}`, () => `${1 + Math.floor(Math.random() * 10)}`);
    t.kick(score, 'rshow-stamp');
    t.sound(() => {
      sfx.stamp(0.35);
      if (critic.score >= 9) sfx.sparkle(critic.score === 10 ? 1046.5 : 784);
    });
    if (critic.score >= 9) front.classList.add('hot');
    await t.wait(300);
  }
  for (const { card, front, critic, score } of flips) {
    card.classList.add('flip');
    score.firstChild.textContent = `${critic.score}`;
    if (critic.score >= 9) front.classList.add('hot');
  }
  const mean = launch.press.reduce((sum, critic) => sum + critic.score, 0) / launch.press.length;
  average.hidden = false;
  t.sound(() => sfx.roll(1.1));
  await roll(averageValue, 1100, mean.toFixed(1), () => (1 + Math.random() * 9).toFixed(1));
  t.kick(averageValue, 'rshow-stamp');
  t.sound(() => {
    sfx.stamp(0.6);
    if (mean >= 9) sfx.fanfare();
  });
  if (mean >= 9.5) confetti(t, panel, 532, 520);
  await t.wait(1100);
}

async function playShow(t, show, launch) {
  for (const [index, row] of launch.benchmarks.entries()) {
    if (t.ended) return;
    t.beat();
    show.step.textContent = `Benchmark ${index + 1} of ${launch.benchmarks.length}`;
    await benchmarkRace(t, show, row, index);
  }
  if (t.ended) return;
  t.beat();
  show.step.textContent = 'Leaderboard';
  await leaderboardClimb(t, show, launch);
  if (t.ended) return;
  t.beat();
  show.step.textContent = 'The press';
  await pressFlip(t, show, launch);
}

export function showReveal(overlayRoot, { state, model, misalignmentIncident = false, onClose }) {
  const layer = el('div', 'dialog-layer reveal-layer');
  const titleId = `reveal-title-${++nextRevealId}`;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', titleId);
  const veil = el('div', 'dialog-veil');
  veil.setAttribute('aria-hidden', 'true');
  const panel = el('section', 'gp rel reveal');
  panel.tabIndex = -1;

  const top = el('div', 'reveal-top');
  const heading = el('div');
  // A release with a delay (an outside evaluation first) goes live at a later round mark.
  const scheduled = model.activated === false;
  const shipsDay = roundMarkDay(state, Math.max(1, (model.activeFromTurn ?? state.turn) - state.turn));
  const title = el('h1', null, scheduled ? `${model.name} ships ${storyDate(shipsDay).label}` : `${model.name} is out`);
  title.id = titleId;
  const kicker = el('div', 'reveal-kick', 'Model release');
  const side = el('div', 'reveal-side');
  const count = beatCount(model.launch);
  if (count) {
    const badge = el('div', 'reveal-beat');
    badge.append(el('span', 'up'), `Beats your last flagship on ${count.beaten} of ${count.of} benchmarks`);
    side.append(badge);
  }
  side.append(sheet(model, state.era));

  const cols = el('div', 'reveal-cols');
  cols.append(benchmarks(state, model), press(model), reactions(state, model, misalignmentIncident));

  const foot = el('div', 'reveal-foot');
  const usersLine = el('div', 'reveal-users');
  // Owner 2026-09-26 wording for when open weights returns: no user count to show, since nobody
  // signs up for a download (the sales estimate is already omitted for open weights below).
  if (scheduled) usersLine.textContent = `Users and sales start when it ships on ${storyDate(shipsDay).label}.`;
  else if (model.channel === 'open') usersLine.textContent = 'Free download. Anyone can run it now.';
  else usersLine.append('New users this month: ', el('b', null, `+${users(model.newUsers)}`));
  const left = el('div');
  left.append(usersLine);
  const sales = scheduled ? 0 : salesEstimate(model);
  if (sales > 0) {
    const estimate = el('div', 'reveal-estimate');
    estimate.append('About ', el('b', null, `${money(sales)} a month`), ' in sales (estimate)');
    left.append(estimate);
  }
  const done = el('button', 'btn reveal-continue', 'Continue');
  done.type = 'button';
  foot.append(left, done);

  // The show's own header and footer; the title moves into the summary when the show ends.
  const flagship = flagshipBefore(state, model);
  const showHead = el('div', 'rshow-head');
  const showHeading = el('div');
  showHeading.append(kicker, title);
  const showSide = el('div', 'rshow-side');
  const step = el('div', 'rshow-step');
  step.setAttribute('aria-live', 'polite');
  const soundButton = el('button', 'rshow-sound', sfx.enabled ? 'Sound on' : 'Sound off');
  soundButton.type = 'button';
  soundButton.setAttribute('aria-pressed', `${sfx.enabled}`);
  showSide.append(step, soundButton);
  showHead.append(showHeading, showSide);
  const showBody = el('div', 'rshow-body');
  const showFoot = el('div', 'rshow-foot');
  const hint = el('div', 'rshow-hint', 'Click to go faster');
  const tally = el('div', 'rshow-tally');
  const dots = model.launch.benchmarks.map(() => el('span', 'rshow-dot'));
  tally.append(...dots);
  const allResults = el('button', 'rshow-all', 'Show all results');
  allResults.type = 'button';
  showFoot.append(hint, tally, allResults);

  const board = leaderboard(state, model);
  const show = {
    body: showBody,
    panel,
    dots,
    step,
    board,
    leader: board.leader,
    lastName: flagship ? shortName(flagship) : 'Last flagship',
    newName: shortName(model),
  };

  layer.append(veil, panel);

  const previousFocus = document.activeElement;
  let closed = false;
  let phase = 'show';
  const timeline = new Timeline();
  const showSummary = () => {
    if (phase === 'summary') return;
    phase = 'summary';
    timeline.end();
    heading.append(kicker, title);
    top.replaceChildren(heading, side);
    panel.classList.remove('rshow-on');
    panel.replaceChildren(top, cols, foot);
    if (!closed) done.focus();
  };
  const close = () => {
    if (closed) return;
    closed = true;
    timeline.end();
    layer.remove();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    onClose?.();
  };
  soundButton.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    soundButton.textContent = sfx.enabled ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', `${sfx.enabled}`);
  });
  allResults.addEventListener('click', showSummary);
  // Capture phase, so a click anywhere during the show hurries it instead of reaching what is under
  // it. mousedown is where the browser would otherwise move focus off the panel (e.g. to <body> on
  // a veil click, since the veil isn't focusable); blocking that keeps focus inside the layer so the
  // keydown listener below keeps firing after any click.
  const ownButtons = [done, soundButton, allResults];
  layer.addEventListener('mousedown', (event) => {
    if (!ownButtons.includes(event.target)) event.preventDefault();
  }, true);
  layer.addEventListener('click', (event) => {
    if (phase === 'show') {
      if (event.target === soundButton || event.target === allResults) return;
      event.preventDefault();
      event.stopPropagation();
      timeline.advance();
      return;
    }
    if (event.target === done) {
      close();
      return;
    }
    done.focus();
  }, true);
  layer.addEventListener('keydown', (event) => {
    if (phase === 'show') {
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === allResults ? soundButton : allResults).focus();
        return;
      }
      // Enter or Space on a focused show button presses that button.
      if ((event.key === 'Enter' || event.key === ' ') && (event.target === soundButton || event.target === allResults)) return;
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') showSummary();
      else if (!event.repeat) timeline.advance();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      done.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      if (event.repeat) {
        // A key held from the show still auto-repeats here. Without preventDefault, the browser's
        // native Enter/Space activation on the focused Continue button would still fire a click and
        // close the reveal out from under the held key.
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
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showSummary();
  } else {
    panel.classList.add('rshow-on');
    panel.append(showHead, showBody, showFoot);
    panel.focus();
    sfx.unlock();
    playShow(timeline, show, model.launch).then(showSummary);
  }
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
