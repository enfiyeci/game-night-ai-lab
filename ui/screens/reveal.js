import { roundMarkDay, storyDate } from '../../sim/time.js';
import { money, pct, users } from '../logic/format.js';
import { beatCount, checkLabel, flagshipBefore, leaderboard, oneDecimal, perMillion, priceSheet, salesEstimate } from '../logic/release.js';
import { sfx } from '../sfx.js';
import { enterTransition, exitTransition } from '../components/transition.js';

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
    if (row.newTest) title.append(el('span', 'reveal-check', 'New test')); // a harder test than your last flagship took
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
// Numbers are written to Text nodes (`.data`), never with textContent: the clock watches the overlay
// for added and removed nodes (ui/clock.js watch), and each one re-renders the HUD.

// Owner 2026-09-26: numbers and bars start fast and slow down as they near the real value, and the whole
// show runs about 1 min 25 s (about 10 s a benchmark, 12 s for the leaderboard, 23 s for the press).
const easeOut = (p) => 1 - (1 - p) ** 5;

// Waits and tweens the player can hurry: advance() finishes the current beat, end() the whole show.
// hold() keeps a beat's result on screen even after a hurry (owner 2026-09-26: "click to go faster should skip
// the animation but should show the score"): the next click, its time running out, or the show ending moves on.
export class Timeline {
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

  hold(ms, hurriedMs = 1400) {
    if (this.ended) return Promise.resolve();
    return new Promise((resolve) => {
      const entry = { resolve };
      entry.timer = setTimeout(() => { this.pending.delete(entry); resolve(); }, this.fast ? hurriedMs : ms);
      this.pending.add(entry);
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
    if (this.live) {
      sfx.hush();
      sfx.stamp(0.3);
    }
    this.fast = true;
    this.flush();
  }

  end() {
    if (this.live) sfx.hush();
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

// A number the show rewrites every frame, as a Text node inside `node`.
function counter(node, text) {
  const value = document.createTextNode(text);
  node.append(value);
  return value;
}

function confetti(t, root, x, y, count = 30) {
  if (!t.live) return;
  const colours = ['var(--coral)', 'var(--teal)', 'var(--wood)', 'var(--sky)'];
  const burst = el('div', 'rshow-burst');
  for (let i = 0; i < count; i += 1) {
    const bit = el('i', 'rshow-confetti');
    const angle = Math.random() * Math.PI * 2;
    const reach = 80 + Math.random() * 160;
    bit.style.cssText = `left:${x}px;top:${y}px;background:${colours[i % colours.length]};--dx:${Math.cos(angle) * reach}px;--dy:${Math.sin(angle) * reach + 120}px;--r:${Math.random() * 720 - 360}deg`;
    burst.append(bit);
  }
  root.append(burst);
  setTimeout(() => burst.remove(), 1200);
}

// Count a number up, easing into its landing, with a tick on each new value (at most one per 45 ms)
// whose pitch climbs two octaves across 0 to 100.
function countTo(t, text, to, ms, { from = 0, base = 294, ticks = true, onValue } = {}) {
  let lastValue = null;
  let lastTick = 0;
  return t.tween(ms, (p) => {
    const value = Math.round(from + (to - from) * easeOut(p));
    text.data = `${value}`;
    onValue?.(value);
    const now = performance.now();
    if (ticks && p < 1 && value !== lastValue && now - lastTick >= 45) {
      lastTick = now;
      t.sound(() => sfx.tick(Math.round(value / 10), { base }));
    }
    lastValue = value;
  });
}

// A value being decided: it steps through `values` quickly at first, each step slower than the last,
// and lands on the final one (owner 2026-09-26). Each step clicks.
async function slowRoll(t, text, values, { first = 35, growth = 1.22, pitch = 10 } = {}) {
  let gap = first;
  for (const [index, value] of values.entries()) {
    text.data = value;
    if (index === values.length - 1) break;
    t.sound(() => sfx.tick(pitch + (index % 2), { base: 660, gain: 0.04 }));
    await t.wait(gap);
    gap *= growth;
  }
  text.data = values.at(-1);
}

// The scores a critic's card rolls through: counting up round the 1-10 dial and stopping on `score`.
export const dialTo = (score, steps = 12) => Array.from({ length: steps }, (_, i) => `${(((score - steps + i) % 10) + 10) % 10 + 1}`);

// The average narrowing in on its value from alternating sides.
export function narrowTo(mean, steps = 12) {
  const values = [];
  for (let i = 0; i < steps - 1; i += 1) {
    const spread = 3 * (1 - i / (steps - 1)) ** 1.5;
    const value = Math.min(10, Math.max(1, mean + (i % 2 ? spread : -spread)));
    values.push(value.toFixed(1));
  }
  values.push(mean.toFixed(1));
  return values;
}

// The sim scores the safety benchmark's rival bar as a typical lab (around 60), not the leading lab
// (sim/launch.js scoreLaunch), so only the capability rows are named after the leader.
const rivalName = (row, leader) => (row.kind === 'safety' ? 'other labs' : leader);

function rivalChip(row, leader) {
  const name = rivalName(row, leader);
  const diff = row.shown - row.rival;
  if (diff > 0) return el('em', 'rshow-chip up', `▲ ${diff} over ${name}`);
  if (diff === 0) return el('em', 'rshow-chip even', `Ties ${name}`);
  return el('em', 'rshow-chip down', `${-diff} short of ${name}`);
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
  const kind = row.kind === 'safety' ? 'safety benchmark' : 'benchmark';
  title.append(el('small', null, row.newTest ? `New ${kind}` : kind[0].toUpperCase() + kind.slice(1)), row.name);
  const lane = (label, note, kind, me = false) => {
    const node = el('div', `rshow-lane${me ? ' me' : ''}`);
    const name = el('div', 'rshow-lane-name', label);
    name.append(el('small', null, note));
    const track = el('div', 'rshow-track');
    const fill = el('i', `rshow-fill ${kind}`);
    track.append(fill);
    const value = el('div', 'rshow-value');
    node.append(name, track, value);
    return { node, fill, text: counter(value, '0') };
  };
  const targets = [];
  if (row.flagship != null) targets.push({ key: 'last', lane: lane(lastName, 'your last flagship', 'k-last'), score: row.flagship });
  const rivalLane = row.kind === 'safety' ? lane('Other labs', 'typical score', 'k-rival') : lane(leader, 'best rival', 'k-rival');
  targets.push({ key: 'rival', lane: rivalLane, score: row.rival });
  const mine = lane(newName, 'new', 'k-new', true);
  const verdict = el('div', 'rshow-verdict');
  scene.append(title, ...targets.map((target) => target.lane.node), mine.node, verdict);
  await showScene(t, body, scene);
  await t.wait(800);

  for (const { lane: target, score } of targets) {
    t.sound(() => sfx.whoosh(0.8, 0.03));
    await countTo(t, target.text, score, 900, { ticks: false, onValue: (value) => { target.fill.style.width = `${value}%`; } });
    await t.wait(300);
  }
  await t.wait(900);
  t.sound(() => sfx.whoosh(1.2, 0.05));
  const passed = new Set();
  await countTo(t, mine.text, row.shown, 3000, {
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
  await t.hold(2600);
}

const ROW_HEIGHT = 54;

async function leaderboardClimb(t, show, launch) {
  const { body, panel, board } = show;
  const scene = el('div', 'rshow-scene rshow-board-scene');
  const title = el('div', 'rshow-title');
  title.append(el('small', null, 'Average of the four capability benchmarks'), 'Leaderboard');
  const rowsNode = el('div', 'rshow-rows');
  const result = el('div', 'rshow-result');
  const caps = launch.benchmarks.filter((row) => row.kind === 'cap');
  const ahead = caps.filter((row) => row.shown > row.rival).length;
  const aheadLine = el('div', 'rshow-result-note', `Ahead of ${board.leader} on ${ahead} of ${caps.length} capability benchmarks`);
  scene.append(title, rowsNode, result, aheadLine);
  const entries = [...board.rows.map((row) => ({ ...row })), { ...board.mine }];
  rowsNode.style.height = `${entries.length * ROW_HEIGHT}px`;
  const labels = { rival: 'Rival lab', own: 'Your lab', new: 'New' };
  for (const entry of entries) {
    const node = el('div', `rshow-row ${entry.kind}`);
    const rankNode = el('div', 'rshow-rank');
    const name = el('div', 'rshow-row-name', entry.name);
    name.append(el('small', null, labels[entry.kind]));
    const bar = el('div', 'rshow-row-bar');
    const fill = el('i');
    fill.style.width = `${entry.score}%`;
    bar.append(fill);
    const score = el('div', 'rshow-row-score');
    node.append(rankNode, name, bar, score);
    rowsNode.append(node);
    Object.assign(entry, { node, rank: counter(rankNode, ''), fill, scoreText: counter(score, entry.score.toFixed(1)) });
  }
  const mine = entries.at(-1);
  const layout = () => entries.forEach((entry, index) => {
    entry.node.style.top = `${index * ROW_HEIGHT}px`;
    entry.rank.data = `#${index + 1}`;
  });
  layout();
  mine.node.classList.add('waiting');
  await showScene(t, body, scene);
  await t.wait(900);
  mine.node.classList.remove('waiting');
  t.sound(() => sfx.pop(0));
  await t.wait(1000);

  const target = board.mine.score;
  const from = Math.max(0, Math.min(...board.rows.map((row) => row.score), target) - 8);
  let lastTick = 0;
  t.sound(() => sfx.whoosh(2, 0.05));
  await t.tween(5000, (p) => {
    const value = p < 1 ? from + (target - from) * easeOut(p) : target;
    mine.score = value;
    mine.scoreText.data = value.toFixed(1);
    mine.fill.style.width = `${value}%`;
    const now = performance.now();
    if (p < 1 && now - lastTick >= 60) {
      lastTick = now;
      t.sound(() => sfx.tick(Math.round(value / 10), { base: 262, gain: 0.05 }));
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
    const gap = oneDecimal(above.score - target);
    if (gap === 0) result.textContent = above.kind === 'own' ? `#${rank}: level with your own ${above.name}` : `#${rank}: level with ${above.name}`;
    else result.textContent = above.kind === 'own' ? `#${rank}: your own ${above.name} still leads by ${gap.toFixed(1)}` : `#${rank}: ${gap.toFixed(1)} behind ${above.name}`;
    t.sound(() => sfx.miss());
  }
  t.kick(result, 'rshow-stamp');
  await t.hold(4500);
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
    const text = counter(score, '–');
    score.append(el('small', null, '/10'));
    front.append(el('div', 'rshow-critic', critic.name), score, el('div', 'rshow-quip', `"${critic.quip}"`));
    card.append(back, front);
    cards.append(card);
    return { critic, card, front, score, text };
  });
  const average = el('div', 'rshow-average', 'Average score');
  const averageValue = el('b');
  const averageText = counter(averageValue, '–');
  average.append(averageValue);
  average.hidden = true;
  scene.append(title, cards, average);
  await showScene(t, body, scene);
  await t.wait(800);

  for (const { critic, card, front, score, text } of flips) {
    card.classList.add('flip');
    t.sound(() => sfx.whoosh(0.25, 0.04));
    await t.wait(500);
    await slowRoll(t, text, dialTo(critic.score), { first: 60, growth: 1.2 });
    t.kick(score, 'rshow-stamp');
    t.sound(() => {
      sfx.stamp(0.35);
      if (critic.score >= 9) sfx.sparkle(critic.score === 10 ? 1046.5 : 784);
    });
    if (critic.score >= 9) front.classList.add('hot');
    await t.wait(1500);
  }
  for (const { card, front, critic, text } of flips) {
    card.classList.add('flip');
    text.data = `${critic.score}`;
    if (critic.score >= 9) front.classList.add('hot');
  }
  const mean = launch.press.reduce((sum, critic) => sum + critic.score, 0) / launch.press.length;
  await t.wait(800);
  average.hidden = false;
  t.sound(() => sfx.roll(3));
  await slowRoll(t, averageText, narrowTo(mean, 14), { first: 70, growth: 1.18, pitch: 6 });
  t.kick(averageValue, 'rshow-stamp');
  t.sound(() => {
    sfx.stamp(0.6);
    if (mean >= 9) sfx.fanfare();
  });
  if (mean >= 9.5) confetti(t, panel, 532, 520);
  await t.hold(2600);
}

async function playShow(t, show, launch) {
  for (const [index, row] of launch.benchmarks.entries()) {
    if (t.ended) return;
    t.beat();
    show.step.data = `Benchmark ${index + 1} of ${launch.benchmarks.length}`;
    await benchmarkRace(t, show, row, index);
  }
  if (t.ended) return;
  t.beat();
  show.step.data = 'Leaderboard';
  await leaderboardClimb(t, show, launch);
  if (t.ended) return;
  t.beat();
  show.step.data = 'The press';
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
  if (scheduled) usersLine.textContent = `Users and sales start when it ships on ${storyDate(shipsDay).label}.`;
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
  const stepText = counter(step, '');
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
    step: stepText,
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
    exitTransition(layer).then(() => {
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
      overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
      onClose?.();
    });
  };
  soundButton.addEventListener('click', () => {
    if (sfx.enabled) sfx.hush();
    sfx.enabled = !sfx.enabled;
    soundButton.textContent = sfx.enabled ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', `${sfx.enabled}`);
    panel.focus(); // keys keep hurrying the show instead of pressing this button again
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
      if (event.repeat) {
        event.preventDefault();
        return;
      }
      // Enter or Space on a focused show button presses that button.
      if ((event.key === 'Enter' || event.key === ' ') && (event.target === soundButton || event.target === allResults)) return;
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Escape') showSummary();
      else timeline.advance();
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
  enterTransition(layer);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showSummary();
  } else {
    panel.classList.add('rshow-on');
    panel.append(showHead, showBody, showFoot);
    panel.focus();
    playShow(timeline, show, model.launch).catch((error) => console.error(error)).finally(showSummary);
    sfx.unlock();
  }
  // A board meeting that held this reveal restores its own focus right after opening it; take focus
  // back so keys still reach the reveal.
  setTimeout(() => {
    if (!closed && !layer.contains(document.activeElement)) (phase === 'show' ? panel : done).focus();
  }, 0);
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
