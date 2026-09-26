// The board meeting as a video call (board UI plan Task 6, spec §6.4), ported from docs/design/mockups/board/meeting.js.
// The call rings over the office, the meeting plays with a private read of the room beside it, the seven votes are
// revealed one at a time from the record the sim kept, then the result dialog (frame 4A) follows.
// It is a round guard (game.beforeRoundEnd): in a round that holds a vote, it opens instead of the round ending, and the
// round ends only when the player calls the vote.
import { BOARD_MEMBERS, boardVoteThisRound, holdVote } from '../../sim/board.js';
import { makeBoardDeals } from '../../sim/boardDeals.js';
import { ERAS } from '../../sim/data/eras.js';
import { boardView, meetingModel, resultModel, voteReveal } from '../logic/board.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import * as COPY from '../data/boardCopy.js';
import { portrait } from '../components/portraits.js';
import { dialog } from '../components/dialog.js';

const { fill } = COPY;
const CLOCK_REASON = 'board-meeting';
const IDS = BOARD_MEMBERS.map((member) => member.id);
const nameOf = (id) => BOARD_MEMBERS.find((member) => member.id === id).name;

// Timings in ms (meeting.js TIMELINE, slowed per the owner: "each voting was a little bit too fast"). A vote lands
// every 2.4 s: a 1 s thinking beat, then the card and its line held for 1.4 s. The last vote thinks for 2.8 s, so the
// room waits 4.2 s for it, and holds 2.2 s before the result.
export const TIMING = {
  chair: 2600,
  think: 1000,
  thinkLast: 2800,
  hold: 1400,
  holdLast: 2200,
  result: 3600,
  letter: 4800,
  backdown: 3200,
  caption: 5000,
};

// Each director on camera in their own room; flat props in the office's palette (meeting.js SCENES; the safety
// chair's handwritten percentage is left off, since the build does not load Caveat and the target changes by era).
const SCENES = {
  growth: `<rect width="320" height="200" fill="color-mix(in oklab, var(--sky) 22%, var(--paper))"/>
    <rect x="190" y="20" width="110" height="120" rx="4" fill="color-mix(in oklab, var(--sky) 45%, var(--paper))"/><path d="M245,20 V140 M190,80 H300" stroke="var(--paper)" stroke-width="4"/>
    <path d="M30,200 C34,150 44,110 40,60" stroke="color-mix(in oklab, var(--wood) 60%, var(--ink))" stroke-width="5" fill="none"/>
    <path d="M40,60 q-30,-6 -44,10 M40,60 q26,-14 44,-4 M40,60 q-10,-26 -30,-30 M40,60 q18,-24 34,-22" stroke="var(--teal)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="96" y="30" width="16" height="130" rx="8" fill="var(--coral)" transform="rotate(8 104 95)"/>`,
  financier: `<rect width="320" height="200" fill="color-mix(in oklab, var(--wood) 55%, var(--ink))"/>
    <path d="M0,40 H320 M0,120 H320" stroke="color-mix(in oklab, var(--wood) 45%, var(--ink))" stroke-width="3"/>
    <rect x="200" y="30" width="96" height="66" fill="var(--paper)"/><rect x="206" y="36" width="84" height="54" fill="color-mix(in oklab, var(--ink) 80%, var(--sky))"/>
    <g fill="color-mix(in oklab, var(--sky) 60%, var(--paper))">${[0, 1, 2, 3].map((i) => `<rect x="${214 + i * 19}" y="58" width="13" height="26"/>`).join('')}</g>
    <circle cx="44" cy="80" r="26" fill="color-mix(in oklab, var(--sky) 55%, var(--ink))"/><path d="M26,72 q18,8 36,0 M24,88 q20,-6 40,2" stroke="var(--teal)" stroke-width="4" fill="none"/>`,
  sovereign: `<rect width="320" height="200" fill="color-mix(in oklab, var(--coral) 30%, var(--wood))"/>
    <rect width="320" height="120" fill="color-mix(in oklab, var(--coral) 45%, var(--sky))"/>
    <g fill="color-mix(in oklab, var(--ink) 70%, var(--sky))">${[[20, 50], [60, 20], [96, 64], [150, 34], [196, 8], [232, 58], [270, 30]].map(([x, y]) => `<rect x="${x}" y="${y}" width="30" height="${140 - y}"/>`).join('')}</g>
    <path d="M0,120 H320" stroke="color-mix(in oklab, var(--ink) 50%, var(--wood))" stroke-width="6"/><path d="M107,0 V120 M213,0 V120" stroke="color-mix(in oklab, var(--ink) 55%, var(--wood))" stroke-width="5"/>`,
  safety: `<rect width="320" height="200" fill="color-mix(in oklab, var(--teal) 15%, var(--paper))"/>
    <rect x="30" y="18" width="260" height="120" rx="4" fill="var(--paper)" stroke="color-mix(in oklab, var(--ink) 30%, var(--paper))" stroke-width="3"/>
    <g stroke="color-mix(in oklab, var(--sky) 60%, var(--ink))" stroke-width="3" fill="none" stroke-linecap="round"><path d="M48,44 h60 M48,64 h90 M48,84 h40"/><path d="M160,110 L190,70 L220,90 L262,40"/></g>
    <ellipse cx="262" cy="42" rx="20" ry="14" fill="none" stroke="var(--coral)" stroke-width="3"/>`,
  candor: `<rect width="320" height="200" fill="color-mix(in oklab, var(--wood) 35%, var(--paper))"/>
    ${[20, 70, 120].map((y) => `<rect x="0" y="${y + 36}" width="320" height="6" fill="color-mix(in oklab, var(--wood) 70%, var(--ink))"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${8 + i * 22 + (y % 3)}" y="${y + (i % 3) * 3}" width="${14 + (i % 2) * 4}" height="${36 - (i % 3) * 3}" fill="${['var(--coral)', 'var(--teal)', 'var(--sky)', 'var(--wood)', 'color-mix(in oklab, var(--ink) 70%, var(--paper))'][(i + y) % 5]}"/>`).join('')}`).join('')}`,
  security: `<rect width="320" height="200" fill="color-mix(in oklab, var(--sky) 45%, var(--ink))"/>
    <path d="M40,200 V20" stroke="color-mix(in oklab, var(--wood) 60%, var(--paper))" stroke-width="4"/>
    <g transform="translate(42,24)">${Array.from({ length: 7 }, (_, i) => `<rect y="${i * 11}" width="80" height="11" fill="${i % 2 ? 'var(--paper)' : 'var(--coral)'}"/>`).join('')}<rect width="34" height="44" fill="color-mix(in oklab, var(--sky) 60%, var(--ink))"/></g>
    <circle cx="250" cy="70" r="36" fill="color-mix(in oklab, var(--wood) 55%, var(--paper))"/><circle cx="250" cy="70" r="28" fill="color-mix(in oklab, var(--sky) 40%, var(--ink))"/><path d="M234,76 l16,-18 l16,18 z" fill="color-mix(in oklab, var(--wood) 55%, var(--paper))"/>`,
  trustee: `<rect width="320" height="200" fill="color-mix(in oklab, var(--cream) 70%, var(--paper))"/>
    <rect x="160" y="16" width="140" height="120" rx="6" fill="color-mix(in oklab, var(--teal) 30%, var(--paper))"/><path d="M230,16 V136 M160,76 H300" stroke="var(--paper)" stroke-width="5"/>
    <g fill="var(--teal)"><ellipse cx="190" cy="120" rx="30" ry="18"/><ellipse cx="270" cy="112" rx="34" ry="24"/></g>
    <rect x="40" y="96" width="36" height="40" rx="6" fill="var(--coral)"/><path d="M58,96 q-18,-40 -6,-60 M58,96 q10,-40 26,-50 M58,96 q2,-30 -2,-56" stroke="var(--teal)" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  ceo: `<rect width="320" height="200" fill="color-mix(in oklab, var(--teal) 55%, var(--paper))"/>
    <rect x="0" y="0" width="320" height="110" fill="color-mix(in oklab, var(--sky) 18%, var(--paper))"/>
    <rect x="200" y="20" width="90" height="70" fill="color-mix(in oklab, var(--ink) 85%, var(--sky))"/><rect x="36" y="30" width="44" height="58" fill="var(--paper)" stroke="var(--wood)" stroke-width="4"/>`,
};

const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>';
const CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const button = (className, text) => {
  const node = make('button', className, text);
  node.type = 'button';
  return node;
};
const html = (markup) => {
  const box = document.createElement('div');
  box.innerHTML = markup.trim();
  return box.firstElementChild;
};

// Which kind of meeting this is, forecast before the vote for the ring. After the vote, 4A uses the record's kind
// ('gate' | 'promise' | 'emergency'); any other kind reads as a plain special meeting.
// The sim holds a called vote (emergency or promise) before the gate's, and one meeting holds one vote.
function meetingKind(state, model) {
  if (state.flags.boardVoteDue === 'emergency' || state.pendingEvents.some((pending) => pending.id === 'boardRevolt')) return 'emergency';
  if (state.flags.boardVoteDue) return 'promise';
  return model.kind === 'gate' ? 'gate' : 'promise'; // otherwise era 5's forecast promise vote
}

// "Growth and Financier" back to director ids: the raise lines name the directors they move.
const raisedBy = (who) => IDS.filter((id) => who.includes(COPY.SHORT[id]));

// The staff read's band for one director, on the dark (meeting.js rangeBar).
const LEAN_CLASS = { with: 'with', leanWith: 'lean-with', leanAway: 'lean-away', against: 'against' };
const band = (member, width = 118) => `<span class="mt-rb ${LEAN_CLASS[member.lean]}" style="width:${width}px" aria-hidden="true"><i style="left:${member.lo}%;width:${Math.max(2, member.hi - member.lo)}%"></i></span>`;

// A vote-kept seat smiles and a remove seat frowns: once a vote is cast it is public, so the face may show it.
const voteMood = (vote) => (vote === 'keep' ? 'happy' : vote === 'remove' ? 'cross' : null);

function nextVoteEra(era) {
  return ERAS.find((candidate) => candidate.id > era && candidate.boardVoteAtGate)?.id ?? null;
}

// The vote as a list of frames: each shows a still; animated, each lasts ms; reduced motion, each waits for a click
// and the thinking beats are skipped (one step per director).
function voteFrames(reveal, reduced) {
  const frames = [{ n: 0, pending: null, ms: TIMING.chair }];
  reveal.order.forEach((id, i) => {
    const last = i === reveal.order.length - 1;
    if (!reduced) frames.push({ n: i, pending: id, ms: last ? TIMING.thinkLast : TIMING.think });
    frames.push({ n: i + 1, pending: null, ms: last ? TIMING.holdLast : TIMING.hold });
  });
  frames.push({ n: reveal.order.length, result: 'score', ms: TIMING.result });
  if (reveal.reversedByStaff) {
    frames.push({ n: reveal.order.length, result: 'letter', ms: TIMING.letter });
    frames.push({ n: reveal.order.length, result: 'backdown', ms: TIMING.backdown });
  }
  return frames;
}

// A vote held on a copy of the state, for the preview routes: the real game is never touched.
function fakeVote(state, kind, picked, variant = 'win') {
  const before = structuredClone(state);
  const after = structuredClone(state);
  if (picked.length) makeBoardDeals(after, picked.map((member) => ({ member, kind: member })));
  if (variant !== 'win') {
    // Lost four to three: the money seats keep you, the oversight seats do not.
    after.board = after.board.map((support, i) => (BOARD_MEMBERS[i].kind === 'money' ? Math.max(support, 70) : Math.min(support, 45)));
    after.flags.staffLetterUsed = variant === 'loss';
    if (variant === 'staff') after.staffTrust = Math.max(after.staffTrust, 80);
  }
  holdVote(after, kind);
  return { reveal: voteReveal(before, after), after };
}

export function mountBoardMeeting(game, { overlay, stage }) {
  let session = null;
  const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  function open({ preview = false, step = 'ring', onCall = null } = {}) {
    session?.close({ quiet: true });
    const state = game.state;
    const model = meetingModel(state);
    const view = boardView(state);
    const lean = Object.fromEntries(view.members.map((member) => [member.id, member]));
    const kind = meetingKind(state, model);
    const previousFocus = document.activeElement;
    const timers = new Set();
    const picked = new Set();
    let unsubscribe = null;
    let closed = false;
    let dealsLocked = false;

    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!closed) fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const stopTimers = () => {
      for (const id of timers) { clearTimeout(id); clearInterval(id); }
      timers.clear();
    };

    const root = make('div', 'dialog-layer mt-layer');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', COPY.MEETING_LABEL);
    root.tabIndex = -1;
    // Whatever is already up (an event card, advisor bubbles, the phone, the round summary) waits under the meeting.
    const benched = [...overlay.children].filter((child) => !child.inert);
    for (const child of benched) child.inert = true;
    overlay.append(root);
    stage?.classList.add('mt-dim');
    game.clock?.pause(CLOCK_REASON);
    overlay.dispatchEvent(new CustomEvent('board-meeting-open'));
    requestAnimationFrame(() => root.classList.add('dialog-open'));

    // A meeting cannot be left: Escape does nothing, and Tab stays inside.
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...root.querySelectorAll('button:not([disabled])')].filter((item) => !item.closest('[inert]'));
      event.preventDefault();
      if (items.length === 0) { root.focus(); return; }
      const at = items.indexOf(document.activeElement);
      const next = at < 0 ? (event.shiftKey ? items.length - 1 : 0) : (at + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
    });

    function close({ quiet = false } = {}) {
      if (closed) return;
      closed = true;
      stopTimers();
      unsubscribe?.();
      root.remove();
      for (const child of benched) child.inert = false;
      stage?.classList.remove('mt-dim');
      game.clock?.resume(CLOCK_REASON);
      if (session?.root === root) session = null;
      overlay.dispatchEvent(new CustomEvent('board-meeting-closed'));
      if (quiet) return;
      overlay.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    }

    // ---- 1. the call rings -------------------------------------------------------------------------------------------
    function ring() {
      root.className = 'dialog-layer mt-layer step-ring' + (root.classList.contains('dialog-open') ? ' dialog-open' : '');
      root.replaceChildren();
      root.append(make('div', 'mt-letterbox top'), make('div', 'mt-letterbox bottom'));
      const card = make('div', 'mt-ring');
      const faces = make('div', 'mt-ring-faces');
      faces.setAttribute('aria-hidden', 'true');
      faces.innerHTML = IDS.map((id, i) => `<span style="--i:${i}">${portrait(id, 64, lean[id].mood)}</span>`).join('');
      const sub = make('div', 'mt-ring-s', fill(COPY.RING[kind], { era: model.era }));
      sub.append(document.createElement('br'), make('b', null, COPY.RING.motion));
      const buttons = make('div', 'mt-ring-b');
      const decline = button('decline', COPY.RING.decline);
      const join = button('join', COPY.RING.join);
      buttons.append(decline, join);
      const joke = make('p', 'mt-ring-joke');
      joke.setAttribute('aria-live', 'polite');
      decline.addEventListener('click', () => { joke.textContent = COPY.DECLINE_JOKE; });
      join.addEventListener('click', () => room());
      card.append(faces, make('div', 'mt-ring-k', COPY.RING.kicker), make('div', 'mt-ring-t', COPY.RING.title), sub, buttons, joke);
      root.append(card);
      join.focus();
    }

    // ---- 2. the meeting ------------------------------------------------------------------------------------------------
    let call = null;
    let rail = null;
    let captionNode = null;
    const tiles = {};

    function tile(id) {
      const you = id === 'ceo';
      const node = make('div', 'mt-tile');
      node.dataset.id = id;
      node.innerHTML = `<svg class="mt-scene" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[id]}</svg>
        <div class="mt-person">${portrait(id, 190, you ? 'flat' : lean[id].mood)}</div>`;
      node.append(make('div', 'mt-name', you ? COPY.YOU : nameOf(id)));
      tiles[id] = node;
      return node;
    }

    function setCaption(who, text) {
      captionNode.replaceChildren(make('b', null, who), document.createTextNode(text));
    }

    function speaking(id) {
      for (const [key, node] of Object.entries(tiles)) node.classList.toggle('speaking', key === id);
    }

    function leanBar() {
      const { sure, maybe, against } = model.tally;
      const bar = make('div', 'mt-lean');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', [fill(COPY.LEAN_BAR.keep, { n: sure }), fill(COPY.LEAN_BAR.maybe, { n: maybe }), fill(COPY.LEAN_BAR.remove, { n: against })].join(', '));
      for (const [cls, n, key] of [['k', sure, 'keep'], ['u', maybe, 'maybe'], ['r', against, 'remove']]) {
        if (!n) continue;
        const part = make('span', cls, fill(COPY.LEAN_BAR[key], { n }));
        part.style.flex = String(n);
        bar.append(part);
      }
      return bar;
    }

    function roomTop() {
      const top = make('div', 'mt-top');
      const clock = make('div', 'mt-clock');
      clock.append(make('span', 'mt-rec'), document.createTextNode(COPY.MINUTES));
      top.append(make('div', 'mt-top-t', COPY.MOTION), leanBar(), clock);
      return top;
    }

    function railBlock(title, caveat) {
      const block = make('div', 'mt-block');
      const head = make('div', 'mt-rk', title);
      if (caveat) head.append(document.createTextNode(' '), make('span', null, caveat));
      block.append(head);
      return block;
    }

    function dealRow(option) {
      const row = button('mt-opt', null);
      row.setAttribute('aria-pressed', 'false');
      row.innerHTML = `${portrait(option.member, 24, lean[option.member].mood)}`;
      const words = make('span', 'mt-opt-words');
      words.append(make('b', null, option.name), document.createTextNode(option.why ?? option.text));
      row.append(words);
      if (option.disabled) row.disabled = true;
      return row;
    }

    function dealsBlock() {
      const block = make('div', 'mt-block mt-deal');
      block.append(make('div', 'mt-rk', COPY.NOTES.dealsHead));
      const rows = [];
      const none = button('mt-opt quiet', COPY.NOTES.noDeal);
      const sync = () => {
        for (const row of rows) row.setAttribute('aria-pressed', String(picked.has(row.dataset.member)));
        none.setAttribute('aria-pressed', String(picked.size === 0));
      };
      for (const option of model.deals) {
        const row = dealRow(option);
        row.dataset.member = option.member;
        row.addEventListener('click', () => {
          if (dealsLocked) return;
          if (picked.has(option.member)) picked.delete(option.member);
          else picked.add(option.member);
          sync();
        });
        rows.push(row);
        block.append(row);
      }
      none.addEventListener('click', () => {
        if (dealsLocked) return;
        picked.clear();
        sync();
      });
      block.append(none, make('p', 'mt-fine', COPY.DEAL_FINE));
      sync();
      return block;
    }

    function dealsMadeBlock() {
      const block = make('div', 'mt-block mt-deal made');
      if (picked.size === 0) {
        block.append(make('div', 'mt-rk', COPY.NOTES.dealsHead), make('p', null, COPY.NOTES.noDeal));
        return block;
      }
      block.append(make('div', 'mt-rk', fill(COPY.NOTES.dealsMade, { n: picked.size })));
      for (const option of model.deals.filter((deal) => picked.has(deal.member))) {
        const line = make('p');
        line.append(make('b', null, option.name), document.createTextNode(` ${option.text}.`));
        block.append(line);
      }
      block.append(make('p', 'mt-fine', COPY.NOTES.dealsAfter));
      return block;
    }

    function buildRail() {
      const aside = make('aside', 'mt-rail');
      const head = make('div', 'mt-rail-hd');
      head.append(make('span', 'mt-rec'), document.createTextNode(COPY.NOTES_HEAD));

      const read = railBlock(COPY.NOTES.read, COPY.NOTES.readCaveat);
      const line = make('div', 'mt-read');
      const { lo, hi } = model.tally;
      const text = fill(lo === hi ? COPY.NOTES.readExact : COPY.NOTES.readLine, { lo, hi });
      const [, count = text, rest = ''] = text.match(/^(.*\d)(.*)$/) ?? [];
      line.append(make('b', null, count), document.createTextNode(`${rest} `), make('span', null, COPY.NOTES.need));
      read.append(line);

      const raise = railBlock(COPY.NOTES.raise);
      const list = make('ul', 'mt-issues');
      for (const item of model.raise) {
        const li = make('li', item.dir, item.text);
        li.append(make('span', null, item.who));
        list.append(li);
      }
      raise.append(list);

      const swing = railBlock(COPY.NOTES.swing);
      if (model.swing.length === 0) swing.append(make('p', 'mt-fine mt-none', COPY.NOTES.noSwing));
      for (const id of model.swing) {
        const row = make('div', 'mt-swing');
        row.innerHTML = portrait(id, 26, lean[id].mood);
        row.append(make('span', null, COPY.SHORT[id]));
        row.insertAdjacentHTML('beforeend', band(lean[id]));
        swing.append(row);
      }
      if (model.messaging) {
        const side = make('div', 'mt-side');
        const [a, b] = model.messaging.map((id) => COPY.SHORT[id]);
        side.append(make('span', 'mt-dot'));
        const words = make('span');
        words.innerHTML = fill(COPY.NOTES.messaging, { a: `<b>${a}</b>`, b: `<b>${b}</b>` });
        side.append(words);
        swing.append(side);
      }

      aside.append(head, read, raise, swing);
      return aside;
    }

    function room({ stillPicks = null } = {}) {
      root.className = 'dialog-layer mt-layer step-room dialog-open';
      root.replaceChildren();
      call = make('div', 'mt-call');
      const grid = make('div', 'mt-grid');
      for (const id of [...IDS, 'ceo']) grid.append(tile(id));
      captionNode = make('div', 'mt-caption');
      captionNode.setAttribute('aria-live', 'polite');
      const bar = make('div', 'mt-bar');
      bar.innerHTML = `<span class="mt-btn">${MIC}</span><span class="mt-btn">${CAM}</span>`;
      const leave = button('mt-btn end', COPY.LEAVE);
      leave.addEventListener('click', () => setCaption(COPY.CHAIR, COPY.LEAVE_JOKE));
      bar.append(leave);
      call.append(roomTop(), grid, captionNode, bar);

      rail = buildRail();
      if (stillPicks) for (const id of stillPicks) picked.add(id);
      const deals = dealsBlock();
      const callVote = button('btn mt-call-vote', COPY.CALL_VOTE);
      callVote.addEventListener('click', () => callTheVote());
      rail.append(deals, callVote);
      root.append(call, rail);

      // Captions cycle through the directors raising their issues, about every 5 s.
      const raisers = [...new Set(model.raise.flatMap((item) => raisedBy(item.who)))];
      const speakers = raisers.length ? raisers : IDS;
      let at = 0;
      const speak = () => {
        const id = speakers[at % speakers.length];
        speaking(id);
        setCaption(nameOf(id), COPY.CAPTIONS[id]);
        at += 1;
      };
      speak();
      if (!reduced() && !stillPicks) {
        const id = setInterval(() => { if (!closed) speak(); }, TIMING.caption);
        timers.add(id);
      }
      (rail.querySelector('.mt-opt:not([disabled])') ?? callVote).focus();
    }

    // ---- 3. the vote ---------------------------------------------------------------------------------------------------
    let meter = null;
    let reveal = null;
    let after = null;

    function toVote() {
      stopTimers();
      dealsLocked = true;
      root.className = 'dialog-layer mt-layer step-vote dialog-open';
      rail.querySelector('.mt-deal')?.replaceWith(dealsMadeBlock());
      rail.querySelector('.mt-call-vote')?.remove();
      rail.inert = true;
      call.querySelector('.mt-bar').inert = true;
      const top = make('div', 'mt-top');
      meter = make('div', 'mt-meter');
      top.append(make('div', 'mt-top-t', COPY.VOTING), meter);
      call.querySelector('.mt-top').replaceWith(top);
      for (const id of IDS) tiles[id].classList.add('dim');
      speaking(null);
      setCaption(COPY.CHAIR, COPY.CHAIR_OPEN);
      root.focus();
    }

    function drawMeter(revealed) {
      const cells = make('div', 'mt-meter-cells');
      cells.setAttribute('aria-hidden', 'true');
      reveal.order.forEach((id, i) => {
        const cell = make('i', revealed.includes(id) ? reveal.votes[id] : '');
        cell.style.setProperty('--i', String(i));
        cells.append(cell);
      });
      const keep = revealed.filter((id) => reveal.votes[id] === 'keep').length;
      const remove = revealed.length - keep;
      const count = make('div', 'mt-meter-n');
      const parts = fill(COPY.METER, { keep: `<b class="k">${keep}</b>`, remove: `<b class="r">${remove}</b>` }).split(' · ');
      count.innerHTML = [...parts.slice(0, -1), `<span>${parts.at(-1)}</span>`].join(' · ');
      meter.replaceChildren(cells, count);
    }

    function setCard(id, vote) {
      const node = tiles[id];
      const current = node.querySelector('.mt-card');
      if (current?.dataset.vote === vote) return;
      current?.remove();
      node.classList.remove('voted', 'keep', 'remove');
      if (!vote) return;
      const card = make('div', `mt-card ${vote}`, COPY.VOTE_CARD[vote]);
      card.dataset.vote = vote;
      node.append(card);
      if (vote !== 'pending') {
        node.classList.add('voted', vote);
        node.querySelector('.mt-person').innerHTML = portrait(id, 190, voteMood(vote));
      }
    }

    function flash(frame) {
      call.querySelector('.mt-flash')?.remove();
      if (!frame.result) return;
      const box = make('div', 'mt-flash');
      box.setAttribute('role', 'status');
      const score = fill(COPY.RESULT_SCORE, { yes: reveal.yes, no: IDS.length - reveal.yes });
      if (frame.result === 'score') {
        box.classList.add(reveal.passed ? 'stay' : 'go');
        box.append(make('b', null, score), make('span', null, reveal.passed ? COPY.RESULT_STAY : reveal.reversedByStaff ? COPY.STAFF_TWIST[0] : COPY.RESULT_GO));
      } else if (frame.result === 'letter') {
        box.classList.add('letter');
        const note = make('div', 'mt-letter');
        note.append(make('div', 'mt-letter-k', COPY.LETTER_KICKER), make('p', null, COPY.STAFF_TWIST[1]));
        const names = make('div', 'mt-letter-names');
        names.setAttribute('aria-hidden', 'true');
        names.innerHTML = Array.from({ length: 18 }, (_, i) => `<i style="--i:${i};width:${38 + ((i * 29) % 34)}px"></i>`).join('');
        note.append(names);
        box.append(note);
      } else {
        box.classList.add('stay');
        box.append(make('b', 'small', COPY.STAFF_TWIST[2]));
      }
      call.append(box);
    }

    function showFrame(frame) {
      const revealed = reveal.order.slice(0, frame.n);
      drawMeter(revealed);
      for (const id of IDS) {
        const vote = revealed.includes(id) ? reveal.votes[id] : id === frame.pending ? 'pending' : null;
        setCard(id, vote);
        tiles[id].classList.toggle('dim', !vote);
      }
      root.classList.toggle('mt-last', Boolean(frame.pending) && frame.pending === reveal.order.at(-1));
      const lastId = revealed.at(-1);
      speaking(frame.pending ?? lastId ?? null);
      // While the next director thinks, the last one's line stays up.
      if (lastId) setCaption(nameOf(lastId), COPY.VOTE_LINES[lastId][reveal.votes[lastId]]);
      else setCaption(COPY.CHAIR, COPY.CHAIR_OPEN);
      if (frame.result) {
        const fails = frame.result === 'backdown' || (frame.result === 'score' && reveal.passed);
        call.querySelector('.mt-top-t').textContent = fails ? COPY.MOTION_FAILS : COPY.MOTION_PASSES;
        root.classList.add('step-result');
      }
      flash(frame);
    }

    function playVote() {
      const frames = voteFrames(reveal, reduced());
      let at = 0;
      if (reduced()) {
        const next = button('btn mt-next', null);
        const label = () => { next.textContent = frames[at + 1] && !frames[at + 1].result ? COPY.NEXT_VOTE : COPY.CONTINUE; };
        next.addEventListener('click', () => {
          at += 1;
          if (at >= frames.length) { next.remove(); resultDialog(); return; }
          showFrame(frames[at]);
          label();
        });
        call.append(next);
        showFrame(frames[0]);
        label();
        next.focus();
        return;
      }
      const step = () => {
        if (at >= frames.length) { resultDialog(); return; }
        const frame = frames[at];
        at += 1;
        showFrame(frame);
        later(step, frame.ms);
      };
      step();
    }

    function callTheVote() {
      if (dealsLocked) return;
      const deals = [...picked];
      toVote();
      if (preview) {
        ({ reveal, after } = fakeVote(game.state, kind, deals));
        playVote();
        return;
      }
      if (deals.length) game.setField('boardDeals', deals.map((member) => ({ member, kind: member })));
      const before = structuredClone(game.state);
      unsubscribe = game.subscribe(({ state: next }) => {
        unsubscribe();
        unsubscribe = null;
        reveal = voteReveal(before, next);
        after = next;
        if (!reveal) { close(); return; } // no vote was held (another ending came first, or left behind): the ending plays
        playVote();
      });
      onCall?.();
    }

    // ---- 4. the result dialog (frame 4A) --------------------------------------------------------------------------
    function resultDialog() {
      stopTimers();
      const result = resultModel(after);
      const recordKind = reveal.kind === 'gate' ? 'gate' : (reveal.kind === 'promise' || reveal.kind === 'emergency' ? reveal.kind : 'special');
      root.classList.add('step-4a');
      call.inert = true;
      rail.inert = true;

      const body = make('div', 'mt-vote-body');
      const seats = make('div', 'mt-vote-seats');
      for (const seatInfo of result.seats) {
        const seatNode = make('div', `mt-vote-seat ${seatInfo.keep ? 'yes' : 'no'}`);
        seatNode.innerHTML = portrait(seatInfo.id, 58, seatInfo.keep ? 'happy' : 'cross');
        seatNode.append(make('b', null, seatInfo.name), make('span', 'mt-verdict', seatInfo.keep ? COPY.VOTE_CARD.keep : COPY.VOTE_CARD.remove));
        seats.append(seatNode);
      }
      const score = make('div', 'mt-vote-score');
      score.append(make('span', 'yes', String(result.yes)), make('i', null, fill(COPY.RESULT_SCORE, { yes: '', no: '' }).trim()), make('span', 'no', String(result.no)));
      const line = result.reversedByStaff ? COPY.RESULT_LINE.reversed
        : !result.passed ? COPY.RESULT_LINE.removed
          : result.yes === 4 ? COPY.RESULT_LINE.close : COPY.RESULT_LINE.stay;
      body.append(seats, score, make('div', 'mt-vote-result', line), make('p', 'mt-vote-why', result.why));

      const team = make('div', 'budget-team');
      const removed = !result.passed && !result.reversedByStaff;
      for (const opinion of removed ? COPY.TEAM_AFTER_REMOVAL : COPY.TEAM_AFTER_VOTE) {
        const row = make('div', 'compute-opinion');
        const heading = make('div', 'compute-opinion-heading');
        heading.append(make('span', null, ADVISOR_TITLE[opinion.id]), make('span', `compute-mood ${opinion.mood}`, opinion.mood));
        row.append(heading, make('q', null, opinion.text));
        team.append(row);
      }
      const since = make('div', 'compute-budget-summary');
      for (const [key, value] of result.since) {
        const row = make('div', 'budget-summary-row');
        const cls = value === COPY.SINCE_KEEPS ? 'kept' : value === COPY.SINCE_AGAINST ? 'after' : '';
        row.append(make('span', null, key), make('b', cls, value));
        since.append(row);
      }
      const prev = after.flags.prevBoardVote;
      const nextEra = nextVoteEra(model.era);
      const notes = [];
      if (prev?.votes && prev.yes === reveal.yes && result.since.length > 2) notes.push(COPY.SINCE_NOTE.same);
      if (result.passed || result.reversedByStaff) notes.push(nextEra ? fill(COPY.SINCE_NOTE.next, { era: nextEra }) : COPY.SINCE_NOTE.none);
      if (notes.length) since.append(make('p', 'mt-side-note', notes.join(' ')));

      const finish = () => close();
      const layer = dialog({
        title: COPY.RESULT_TITLE,
        subtitle: fill(COPY.RESULT_SUBTITLE[recordKind], { era: model.era }),
        body,
        left: { title: COPY.TEAM_TITLE, content: team },
        right: { title: COPY.SINCE_TITLE, content: since },
        okLabel: removed ? COPY.LEAVE_THE_CALL : COPY.BACK_TO_WORK,
        onOk: finish,
        onCancel: finish,
      });
      layer.classList.add('mt-result');
      root.append(layer);
      requestAnimationFrame(() => layer.classList.add('dialog-open'));
      layer.querySelector('.dialog-ok').focus();
    }

    // ---- stills for the preview routes -----------------------------------------------------------------------------
    function still(name) {
      const [base, variant] = name.split(':');
      if (base === 'ring') { ring(); return; }
      const deals = model.deals.filter((deal) => !deal.disabled).slice(-3, -1).map((deal) => deal.member);
      room({ stillPicks: base === 'room' ? deals : [] });
      if (base === 'room') return;
      ({ reveal, after } = fakeVote(game.state, kind, [], variant ?? 'win'));
      toVote();
      const frames = voteFrames(reveal, false);
      const find = {
        vote: () => frames.find((frame) => frame.pending === reveal.order[3]),
        last: () => frames.find((frame) => frame.pending === reveal.order.at(-1)),
        result: () => frames.find((frame) => frame.result === 'score'),
        letter: () => frames.find((frame) => frame.result === 'letter'),
        backdown: () => frames.find((frame) => frame.result === 'backdown'),
        '4a': () => frames.at(-1),
      }[base];
      const frame = find?.();
      if (!frame) return;
      showFrame(frame);
      if (base === '4a') resultDialog();
    }

    session = { root, close, preview };
    if (preview && step !== 'ring') still(step);
    else ring();
    return session;
  }

  // The round guard: in a round that holds a vote the meeting opens, and the round ends when the player calls the vote.
  let calling = null;
  game.beforeRoundEnd.push(() => {
    if (calling) return calling;
    if (!boardVoteThisRound(game.state)) return undefined;
    calling = new Promise((resolve) => {
      open({ onCall: () => { calling = null; resolve(); } });
    });
    return calling;
  });

  // Preview steps (debug routes): ring (Call the vote plays a vote held on a copy), room, vote, last, result, letter,
  // backdown, 4a; add ':loss' or ':staff' for a lost vote or the staff letter.
  const STEPS = {
    ring: 'ring', room: 'room', vote: 'vote', 'vote-last': 'last', result: 'result', 'result-loss': 'result:loss',
    'result-staff': 'letter:staff', 'result-backdown': 'backdown:staff', '4a': '4a', '4a-loss': '4a:loss', '4a-staff': '4a:staff',
  };
  return {
    preview(step = 'ring') {
      if (session && !session.preview) return; // never replace a real meeting: its round is waiting on it
      open({ preview: true, step: STEPS[step] ?? 'ring' });
    },
  };
}
