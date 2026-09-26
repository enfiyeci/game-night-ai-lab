// The board (board UI plan Task 5, spec §6.1 and §6.2): one dialog with two views (frame L1 "The board", frame L4
// "What moves the board"), switched like the finance planner's Timeline and The books; the countdown chip under the
// HUD's clock; Policy and Comms' warning bubble; and going quiet (frame P5). Every string comes from
// ui/data/boardCopy.js and every number from ui/logic/board.js; support is only ever drawn as the staff read's band.
import { BOARD_MEMBERS } from '../../sim/board.js';
import * as COPY from '../data/boardCopy.js';
import { openDialog } from '../components/dialog.js';
import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { portrait } from '../components/portraits.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import {
  ISSUE_LINKS, ISSUE_ORDER, boardView, boardWarning, countdownText, issuesView, meetingInfo, nextMeetingRows,
  worryMember, worryTip,
} from '../logic/board.js';
import { registerMenuHandler } from '../menu.js';

const { fill } = COPY;
const LEAN_ORDER = ['with', 'leanWith', 'leanAway', 'against'];
const ARROW = { up: '▲', down: '▼', flat: '–' };
const clockOf = (game) => game.clock ?? null;
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

// "A. B." with the first sentence in bold, as the mockup sets the seats line and the tip.
function boldLead(root, text, splitter) {
  const at = text.indexOf(splitter);
  if (at < 0) root.append(text);
  else root.append(node('b', '', text.slice(0, at + splitter.length).trim()), ` ${text.slice(at + splitter.length)}`);
  return root;
}

const band = (member, width) => `<span class="bd-rb ${member.lean}" style="width:${width}px"><i style="left:${member.lo}%;width:${member.hi - member.lo}%"></i></span>`;

function subtitle(state, game) {
  return fill(COPY.BOARD_SUBTITLE, { era: state.era, countdown: countdownText(meetingInfo(state)) });
}

// ---- the board view (frame L1) ----------------------------------------------------------------------------------
function teamPanel() {
  const root = node('div', 'budget-team');
  for (const line of COPY.TEAM_ON_BOARD) {
    const row = node('div', 'compute-opinion');
    const heading = node('div', 'compute-opinion-heading');
    heading.append(node('span', '', ADVISOR_TITLE[line.id]), node('span', `compute-mood ${line.mood}`, line.mood));
    row.append(heading, node('q', '', line.text));
    root.append(row);
  }
  return root;
}

function nextMeetingPanel(state, game) {
  const root = node('div', 'budget-summary compute-budget-summary');
  for (const [label, value] of nextMeetingRows(state)) {
    const row = node('div', 'budget-summary-row');
    row.append(node('span', '', label), node('b', '', value));
    root.append(row);
  }
  const box = node('div');
  box.append(root, node('p', 'bd-side-note', COPY.NOTE));
  return box;
}

function memberRow(member) {
  const row = el(`<div class="bd-row">${portrait(member.id, 40, member.mood)}
    <span class="bd-who"><b></b><small></small></span>
    <span class="bd-right">${band(member, 170)}<span class="bd-lean ${member.lean}"></span><span class="bd-trend ${member.trend}" role="img"></span></span></div>`);
  row.querySelector('.bd-who b').textContent = member.name;
  const wants = COPY.WANTS_PREFIX + lowerFirst(member.wants);
  row.querySelector('.bd-who small').textContent = wants;
  row.querySelector('.bd-who small').title = wants;
  row.querySelector('.bd-lean').textContent = member.leanWord;
  const trend = row.querySelector('.bd-trend');
  trend.textContent = ARROW[member.trend];
  trend.setAttribute('aria-label', COPY.TREND_WORD[member.trend]);
  return row;
}

function boardBody(state) {
  const view = boardView(state);
  const body = node('div', 'bd-board-body');
  const list = node('div', 'bd-list');
  for (const kind of ['money', 'oversight']) {
    const group = node('div', 'bd-group');
    group.append(node('span', '', COPY.SEAT_GROUPS[kind]), node('span', '', COPY.GROUP_NOTE));
    list.append(group);
    for (const member of view.members.filter((m) => m.kind === kind)) list.append(memberRow(member));
  }
  const seats = node('span', 'bd-seats');
  for (const member of [...view.members].sort((a, b) => LEAN_ORDER.indexOf(a.lean) - LEAN_ORDER.indexOf(b.lean))) {
    const dot = node('i', member.lean);
    dot.title = member.name;
    seats.append(dot);
  }
  const tally = node('div', 'bd-tally');
  tally.append(seats, boldLead(node('span'), view.seatsLine, '. '));
  body.append(list, tally);
  return body;
}

// ---- what moves the board (frame L4) -----------------------------------------------------------------------------
// The mockup's map (frame L4), tightened to fit the dialog under the HUD: the same order and shapes, a little less air.
const MAP = { x: 95, y: 40, W: 870, H: 522, ix: 250, mx: 740 };
const iy = (i) => 70 + i * 52;
const my = (i) => 80 + i * 74;

function movesBody(state) {
  const view = boardView(state);
  const issues = issuesView(state);
  const worry = worryMember(state);
  const tip = worryTip(state);
  const { ix, mx } = MAP;
  const links = view.members.flatMap((member, mi) => ISSUE_LINKS[member.id].map((issueId) => {
    const ii = ISSUE_ORDER.indexOf(issueId);
    const hi = member.id === worry ? ' hi' : '';
    return `<path class="bd-im-link ${issues[ii].state}${hi}" d="M${ix + 88},${iy(ii)} C${(ix + mx) / 2},${iy(ii)} ${(ix + mx) / 2},${my(mi)} ${mx - 40},${my(mi)}"/>`;
  }));
  // Highlighted links draw last, over the others.
  links.sort((a, b) => a.includes(' hi"') - b.includes(' hi"'));
  const issueMarks = issues.map((issue, i) => `<g transform="translate(${ix},${iy(i)})" class="bd-im-issue ${issue.state}">
      <rect x="-150" y="-19" width="238" height="38" rx="19"/><circle cx="68" cy="0" r="12"/>
      <text x="-134" y="5" class="bd-im-l">${esc(issue.label)}</text><text x="52" y="5" class="bd-im-s" text-anchor="end">${esc(issue.say)}</text>
      <text x="68" y="5" text-anchor="middle" class="bd-im-arrow">${ARROW[issue.state]}</text></g>`).join('');
  const members = view.members.map((member, i) => `<g transform="translate(${mx},${my(i)})" class="bd-im-member ${member.lean}${member.id === worry ? ' hi' : ''}">
      <circle r="34" class="bd-im-halo"/><foreignObject x="-28" y="-28" width="56" height="56"><div xmlns="http://www.w3.org/1999/xhtml" class="bd-im-face">${portrait(member.id, 56, member.mood)}</div></foreignObject>
      <text x="48" y="-4" class="bd-im-name">${esc(member.name)}</text><text x="48" y="14" class="bd-im-leanw">${esc(member.leanWord)}</text></g>`).join('');
  const body = node('div', 'bd-moves-body');
  body.innerHTML = `<svg viewBox="${MAP.x} ${MAP.y} ${MAP.W} ${MAP.H}" width="${MAP.W}" height="${MAP.H}" role="img" aria-label="${esc(COPY.MAP_LABEL)}">${links.join('')}${issueMarks}${members}</svg>`;
  const key = node('div', 'bd-im-key');
  for (const state of ['up', 'down', 'flat']) {
    const item = node('span');
    item.append(node('i', state), COPY.ISSUE_KEY[state]);
    key.append(item);
  }
  if (tip) key.append(boldLead(node('span', 'bd-im-tip'), tip, ':'));
  body.append(key);
  return body;
}

// ---- the dialog --------------------------------------------------------------------------------------------------
export function openBoard(game, overlayRoot, { view = 'board' } = {}) {
  const state = game.state;
  let opened;
  const close = () => opened.close();

  function showBoard() {
    opened = openDialog(overlayRoot, {
      title: COPY.BOARD_TITLE,
      subtitle: subtitle(state, game),
      left: { title: COPY.TEAM_TITLE, content: teamPanel() },
      right: { title: COPY.NEXT_MEETING_TITLE, content: nextMeetingPanel(state, game) },
      body: boardBody(state),
      backLabel: COPY.TAB_ISSUES,
      okLabel: COPY.CLOSE,
      onBack: showMoves,
      onOk: close,
    });
    opened.classList.add('bd-dialog', 'bd-board-dialog');
  }

  function showMoves() {
    opened = openDialog(overlayRoot, {
      title: COPY.TAB_ISSUES,
      subtitle: subtitle(state, game),
      body: movesBody(state),
      backLabel: COPY.TAB_BOARD,
      okLabel: COPY.CLOSE,
      onBack: showBoard,
      onOk: close,
    });
    opened.classList.add('bd-dialog', 'bd-moves-dialog');
  }

  if (view === 'moves') showMoves();
  else showBoard();
  return opened;
}

// ---- the countdown chip, the warning and going quiet --------------------------------------------------------------
const CALENDAR = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><path d="M1.5 6.5h13M5 1v3M11 1v3"/></svg>';

function quietPanel(state) {
  const panel = node('div', 'bd-quiet');
  panel.append(node('div', 'bd-quiet-hd', COPY.QUIET_HEAD));
  for (const member of boardView(state).members) {
    const row = el(`<div class="bd-quiet-row">${portrait(member.id, 30, member.mood)}<b></b><span></span><span class="bd-quiet-band">${band(member, 140)}</span></div>`);
    row.querySelector('b').textContent = member.short;
    row.querySelector('span').textContent = COPY.QUIET_SEEN;
    panel.append(row);
  }
  panel.append(node('p', '', COPY.QUIET_FOOT));
  return panel;
}

export function mountBoard(game, { overlay, stage }) {
  registerMenuHandler('board', (g, root) => openBoard(g, root));
  const hud = stage.querySelector('#hud');
  const chip = el(`<div class="bd-count" role="status" hidden>${CALENDAR}<span></span></div>`);
  stage.insertBefore(chip, hud); // under the HUD layer, so the info box covers it if they ever meet
  const quietSlot = node('div', 'bd-quiet-slot');
  stage.insertBefore(quietSlot, hud);
  const sayRoot = node('div', 'bd-say');
  overlay.append(sayRoot);

  let anchors = null;
  let anchorsEra = null;
  const said = new Set(); // "warning:era:kind" and "quiet:era:kind": what each meeting has already raised
  let wanted = []; // bubbles that should be on screen: { kind: 'warning' | 'quiet', role, say }
  let shown = [];

  let meetingOpen = false; // the board meeting (Task 6): the chip and the bubbles step aside until it closes
  const cardOpen = () => meetingOpen || Boolean(overlay.querySelector('.event-layer, .dialog-layer'));

  // Under the HUD's clock (real time), or under the info box when there is no clock.
  function layout() {
    const above = hud?.querySelector('.clock') ?? hud?.querySelector('.info');
    const top = above ? above.offsetTop + above.offsetHeight + 8 : 92;
    chip.style.top = `${top}px`;
    quietSlot.style.top = `${chip.hidden ? top : top + chip.offsetHeight + 8}px`;
  }

  function clearShown() {
    for (const bubble of shown) bubble.remove();
    shown = [];
  }

  function draw() {
    clearShown();
    if (!anchors || cardOpen()) return;
    for (const want of wanted) {
      const head = anchors.heads?.[want.role];
      if (!head) continue;
      let extra = null;
      if (want.kind === 'warning') {
        extra = el('<div class="ev-row"><button type="button" class="ev-act"></button></div>');
        const button = extra.querySelector('button');
        button.textContent = COPY.SEE_BOARD;
        button.addEventListener('click', () => {
          drop('warning');
          openBoard(game, overlay);
        });
      }
      const band = game.state.lastBriefing?.find((reading) => reading.id === want.role)?.band ?? 'calm';
      const width = want.role === 'cfo' ? 230 : 250; // the CFO's bubble stays clear of the quiet panel
      const bubble = bubbleAt(sayRoot, head, {
        label: ADVISOR_TITLE[want.role],
        say: want.say,
        width,
        // Policy and Comms' bubble opens to the left: the Head of Research sits up and to their right in every era.
        tail: want.role === 'policy' ? width - 36 : 26,
        dy: band === 'calm' ? -34 : -64, // clear their "!" marker, as the briefing does
        extra,
      });
      bubble.dataset.kind = want.kind;
      shown.push(bubble);
    }
  }

  function drop(kind) {
    const before = wanted.length;
    wanted = wanted.filter((want) => want.kind !== kind);
    if (wanted.length !== before) draw();
  }

  function update() {
    const state = game.state;
    const info = meetingInfo(state);
    const warning = info ? boardWarning(state) : null;
    const quiet = !state.ending && state.flags.boardQuiet === state.turn;

    chip.hidden = !info || meetingOpen;
    chip.classList.toggle('urgent', Boolean(warning));
    if (info) chip.querySelector('span').textContent = countdownText(info);
    // The panel shows only while the warning is on: the sim's quiet flag lasts the whole vote round,
    // which can be longer than the month the warning covers.
    quietSlot.replaceChildren(...(quiet && warning ? [quietPanel(state)] : []));
    quietSlot.hidden = Boolean(overlay.querySelector('.dialog-layer'));

    const key = info ? `${state.era}:${info.kind}` : null;
    const before = wanted;
    if (!warning) wanted = wanted.filter((want) => want.kind !== 'warning');
    if (!quiet) wanted = wanted.filter((want) => want.kind !== 'quiet');
    // A warning still up keeps its time current ("four weeks", then "three weeks").
    wanted = wanted.map((want) => (want.kind === 'warning' && want.say !== warning.text ? { ...want, say: warning.text } : want));
    // Each meeting raises the warning once and the quiet lines once. Policy and Comms keep the warning and its link
    // while the board goes quiet; their own quiet line is said only when there is no warning.
    if (key && warning && !said.has(`warning:${key}`)) {
      said.add(`warning:${key}`);
      wanted = [...wanted.filter((want) => want.role !== 'policy'), { kind: 'warning', role: 'policy', say: warning.text }];
    }
    if (key && quiet && !said.has(`quiet:${key}`)) {
      said.add(`quiet:${key}`);
      wanted = [
        ...wanted,
        ...(warning ? [] : [{ kind: 'quiet', role: 'policy', say: COPY.QUIET_LINES.policy }]),
        { kind: 'quiet', role: 'cfo', say: COPY.QUIET_LINES.cfo },
      ];
    }
    layout();
    // Redraw only when the bubbles change, so a ticking clock does not rebuild them every day.
    const changed = wanted.length !== before.length || wanted.some((want, i) => want !== before[i]);
    if (anchorsEra === state.era) {
      if (changed) draw();
      return;
    }
    loadAnchors(state.era).then((loaded) => {
      anchors = loaded;
      anchorsEra = state.era;
      draw();
    }).catch((error) => console.error(error));
  }

  // A card or a dialog holds the stage: bubbles step aside and come back when it closes. Opening the board itself
  // answers the warning.
  // The quiet panel also steps aside for a dialog, so it does not peek out behind the dialog's side panels.
  new MutationObserver(() => {
    if (overlay.querySelector('.bd-dialog')) drop('warning');
    quietSlot.hidden = Boolean(overlay.querySelector('.dialog-layer'));
    draw();
  }).observe(overlay, { childList: true });
  overlay.addEventListener('event-card-open', clearShown);
  overlay.addEventListener('board-meeting-open', () => { meetingOpen = true; update(); draw(); });
  overlay.addEventListener('board-meeting-closed', () => { meetingOpen = false; update(); draw(); });
  overlay.addEventListener('gdt-dialog-closed', draw);
  // The advisors' quiet lines are chatter: a click anywhere else puts them away.
  document.addEventListener('pointerdown', (event) => {
    const quietShown = shown.filter((bubble) => bubble.dataset.kind === 'quiet');
    if (quietShown.length && !quietShown.some((bubble) => bubble.contains(event.target))) drop('quiet');
  });
  if (hud) new MutationObserver(layout).observe(hud, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

  game.subscribe(update);
  clockOf(game)?.on?.('tick', update);
  update();
  return {
    open: (view = 'board') => openBoard(game, overlay, { view }),
    refresh: update,
  };
}
