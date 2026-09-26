import { BOARD_MEMBERS } from '../../sim/board.js';
import { boardRead } from '../../sim/boardRead.js';
import { PICTURES } from '../data/crisisArt.js';
import { bubbleAt, choiceButton, dueBar, el, loadAnchors, post, sourcePost } from '../components/eventBits.js';
import { moodForLean, portrait } from '../components/portraits.js';
import {
  ADVISOR_TITLE, argueLines, cardView, catalogRow, consequenceLines, daysLeft, dueText, hasLanded, queueAnswer,
  timingFor,
} from '../logic/events.js';

const CLOCK_REASON = 'event-card';
const LOADING_REASON = 'event-card-loading';
const ERAS = [1, 2, 3, 4, 5];

// Crisis staging in the room (owner pick B). Positions follow the era's rack and head anchors.
function stageRoom(staging, { stage, layerRoot, anchors }) {
  const layer = el(`<div class="ev-theme ev-wash-${staging.room}" aria-hidden="true"><svg width="1440" height="900" viewBox="0 0 1440 900"></svg></div>`);
  const svg = layer.querySelector('svg');
  const [rx, ry] = anchors.rack ?? [1150, 440];
  const restore = [];
  const tag = (text, x, y, tone = '') => {
    const node = el(`<div class="ev-tag ${tone}"></div>`);
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    layer.append(node);
  };

  if (staging.room === 'theft') {
    stage.classList.add('ev-dim-office');
    svg.innerHTML = `
      <defs><pattern id="ev-tape" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="16" style="fill:var(--coral)"/><rect x="8" width="8" height="16" style="fill:var(--ink)"/></pattern></defs>
      <path d="M${rx - 90} ${ry + 80} L${rx + 98} ${ry} L${rx + 98} ${ry + 18} L${rx - 90} ${ry + 98} Z" style="fill:url(#ev-tape);opacity:.92"/>
      <path d="M${rx - 90} ${ry + 160} L${rx + 98} ${ry + 80} L${rx + 98} ${ry + 96} L${rx - 90} ${ry + 176} Z" style="fill:url(#ev-tape);opacity:.92"/>
      <circle cx="${rx}" cy="${ry - 56}" r="30" style="fill:color-mix(in oklab, var(--coral) 40%, transparent)"/>
      <circle cx="${rx}" cy="${ry - 56}" r="9" style="fill:var(--coral);stroke:var(--paper);stroke-width:2"/>`;
    tag(staging.tag, rx - 64, ry - 100, 'coral');
    restore.push(() => stage.classList.remove('ev-dim-office'));
  } else if (staging.room === 'exfil') {
    stage.classList.add('ev-dim-office');
    const dots = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const x = rx + 8 + t * (1432 - rx - 8);
      const y = ry - 36 - t * (ry - 36 - 232) + Math.sin(t * 3) * 14;
      return `<rect x="${x}" y="${y}" width="10" height="7" rx="2" style="fill:var(--sky);opacity:${1 - t * 0.6}"/>`;
    }).join('');
    svg.innerHTML = `<path d="M${rx + 8} ${ry - 36} C${rx + 98} ${ry - 90} ${rx + 188} ${ry - 160} 1432 232" style="fill:none;stroke:var(--sky);stroke-width:3;stroke-dasharray:8 7"/>${dots}`;
    tag(staging.tag, rx + 48, ry - 148, 'sky');
    restore.push(() => stage.classList.remove('ev-dim-office'));
  } else if (staging.room === 'whistle') {
    // The press waits by the door, down and to the left of the Policy desk in every era.
    const [px, py] = anchors.heads.policy;
    tag(staging.tag, px - 230, py - 30);
  } else if (staging.room === 'quits') {
    stage.classList.add('ev-grey-office');
    const hidden = [...stage.querySelectorAll('#person-safety .sitter, #person-safety [class^="face-"]')]
      .filter((node) => node.getAttribute('display') !== 'none');
    for (const node of hidden) node.setAttribute('display', 'none');
    const markers = [...stage.querySelectorAll('.advisor-marker')].filter((node) => node.getAttribute('aria-label')?.startsWith('safety '));
    for (const marker of markers) marker.hidden = true;
    const [sx, sy] = anchors.heads.safety;
    svg.innerHTML = `<g transform="translate(${sx - 19} ${sy + 88})">
      <path d="M-22 -8 L4 -20 L28 -10 L2 2 Z" style="fill:color-mix(in oklab, var(--wood) 45%, var(--paper))"/>
      <path d="M-22 -8 L2 2 L2 26 L-22 16 Z" style="fill:color-mix(in oklab, var(--wood) 65%, var(--cream))"/>
      <path d="M2 2 L28 -10 L28 14 L2 26 Z" style="fill:color-mix(in oklab, var(--wood) 52%, var(--cream))"/>
      <path d="M2 -10 q-4 -20 4 -30 q4 14 -1 30 Z M8 -10 q6 -16 16 -20 q-6 12 -14 20 Z" style="fill:var(--teal)"/></g>`;
    tag(staging.tag, sx - 60, sy - 70);
    restore.push(() => {
      stage.classList.remove('ev-grey-office');
      for (const node of hidden) node.removeAttribute('display');
      for (const marker of markers) marker.hidden = false;
    });
  }
  layerRoot.append(layer);
  return () => {
    layer.remove();
    for (const undo of restore) undo();
  };
}

// Two advisors can sit close enough for their bubbles to touch; lift the higher one clear.
function separate(nodes) {
  const box = (node) => ({ left: node.offsetLeft, top: node.offsetTop, right: node.offsetLeft + node.offsetWidth, bottom: node.offsetTop + node.offsetHeight });
  for (let pass = 0; pass < 3; pass += 1) {
    for (const a of nodes) {
      for (const b of nodes) {
        if (a === b) continue;
        const [upper, lower] = box(a).top <= box(b).top ? [a, b] : [b, a];
        const u = box(upper);
        const l = box(lower);
        if (u.right <= l.left || l.right <= u.left || u.bottom + 8 <= l.top) continue;
        upper.style.top = `${u.top - (u.bottom + 8 - l.top)}px`;
      }
    }
  }
}

const MAX_BUSY_LINES = 6;

function showBusy(overlay, lines, onDismiss) {
  overlay.querySelector('.ev-busy')?.remove();
  if (!lines.length) return;
  const node = el('<section class="ev-busy" aria-live="polite"><div class="ev-busy-head"><strong>While you were busy</strong><button type="button" aria-label="Dismiss">×</button></div><ul></ul></section>');
  for (const line of lines.slice(-MAX_BUSY_LINES)) {
    const item = el(`<li${line.ok ? ' class="ok"' : ''}><b></b><span></span></li>`);
    item.querySelector('b').textContent = line.head;
    item.querySelector('span').textContent = line.text;
    node.querySelector('ul').append(item);
  }
  node.querySelector('button').addEventListener('click', () => {
    node.remove();
    onDismiss();
  });
  overlay.append(node);
  // company.js puts its round toast in the same top-left slot one frame later; sit under it.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const toast = overlay.querySelector('.turn-summary');
    node.style.top = toast ? `${toast.offsetTop + toast.offsetHeight + 10}px` : '104px';
  }));
}

// The card flow follows cards as they land in and leave state.pendingEvents, so it works the same
// whether the game notifies once per turn or once per story week (owner pick 1D).
export function mountEvents(game, { stage, overlay }) {
  let anchors = null;
  let anchorsEra = null;
  let returnTo = null; // where focus goes back when the last card in a chain closes
  const known = new Map(); // id -> card view, for every landed card still pending
  const answered = {}; // id -> the choice the player picked, until the card leaves the sim
  const setAside = new Set();
  let queue = [];
  let current = null;
  let busyLines = [];
  let previewing = false;

  const clock = () => game.clock ?? null;
  const emit = (name) => overlay.dispatchEvent(new CustomEvent(name));
  const pendingOf = (id) => game.state.pendingEvents.find((candidate) => candidate.id === id);
  const remaining = (id) => {
    const pending = pendingOf(id);
    return pending ? daysLeft(pending, game.state) : null;
  };

  function close({ aside = false } = {}) {
    if (!current) return;
    const { id, layer, cleanup, preview } = current;
    current = null;
    if (aside && !preview && !Object.hasOwn(answered, id) && known.has(id)) setAside.add(id);
    layer.remove();
    cleanup?.();
    clock()?.resume(CLOCK_REASON);
    emit('event-card-closed');
    emit('events-changed');
  }

  function sync(state, events) {
    const live = new Set(state.pendingEvents.map((pending) => pending.id));
    const gone = [...known.values()].filter((view) => !live.has(view.id));
    if (gone.length) {
      busyLines = [...busyLines, ...consequenceLines({ before: gone, answered, events })].slice(-MAX_BUSY_LINES);
      for (const view of gone) {
        known.delete(view.id);
        setAside.delete(view.id);
        delete answered[view.id];
      }
      if (current && !current.preview && !live.has(current.id)) close();
      showBusy(overlay, busyLines, () => { busyLines = []; });
    }
    queue = queue.filter((id) => live.has(id));
    const landed = state.pendingEvents
      .filter((pending) => !known.has(pending.id) && hasLanded(pending, state))
      .filter((pending) => pending.id !== 'ownLine')
      .map(cardView)
      .sort((a, b) => Number(b.crisis) - Number(a.crisis));
    for (const view of landed) {
      known.set(view.id, view);
      queue.push(view.id);
    }
  }

  // Open the next waiting card; when none is left, give focus back to where the player was.
  function settle() {
    openNext();
    if (current || !returnTo) return;
    if (returnTo.isConnected) returnTo.focus();
    returnTo = null;
  }

  function openNext() {
    // A dialog that is already up (the release reveal, a menu screen, the screen wall) goes first; cards wait for it.
    if (overlay.querySelector('.dialog-layer, .screenwall-layer')) return;
    while (!current && queue.length) {
      if (openCard(queue.shift())) return;
    }
  }

  function render(view, { preview }) {
    const layer = el('<div class="event-layer"></div>');
    overlay.append(layer);
    clock()?.pause(CLOCK_REASON);
    const cleanup = view.staging ? stageRoom(view.staging, { stage, layerRoot: layer, anchors }) : null;
    current = { id: view.id, layer, cleanup, preview };

    const card = el(`<section class="gp ev-card${view.staging ? '' : ' no-pic'}" role="dialog" aria-modal="false"><div class="ev-card-main"><div class="ev-card-top"><h1></h1></div><div class="ev-choices"></div><div class="ev-card-foot"><button type="button" class="ev-act ghost ev-later">Decide later</button></div></div></section>`);
    const titleId = `ev-title-${view.id.replace(/\W/g, '-')}`;
    card.querySelector('h1').id = titleId;
    card.querySelector('h1').textContent = view.title;
    card.setAttribute('aria-labelledby', titleId);
    if (view.crisis) {
      const band = el('<div class="ev-crisis">Crisis <span></span></div>');
      band.querySelector('span').textContent = clock() ? 'The game is paused' : '';
      card.prepend(band);
    }
    if (view.staging) {
      const figure = el('<figure class="ev-pic"><figcaption></figcaption></figure>');
      figure.prepend(el(PICTURES[view.staging.room]));
      figure.querySelector('figcaption').textContent = view.staging.caption;
      card.querySelector('.ev-card-main').before(figure);
    }
    const days = preview ? null : remaining(view.id);
    if (days !== null) card.querySelector('.ev-card-top').append(dueBar(dueText(view.id, days), days / timingFor(view.id).days));
    card.querySelector('.ev-card-top').after(sourcePost(view.post));
    // Board cards (spec §6.3): the wood kicker bar with the directors watching, their faces from the staff read.
    if (view.kicker) {
      const read = boardRead(game.state);
      const bar = el('<div class="bd-kicker"><span></span><span class="bd-watch">Watching: </span></div>');
      bar.firstElementChild.textContent = view.kicker;
      for (const id of view.watching) {
        const lean = read.members.find((member) => member.id === id)?.lean;
        const face = el(`<i>${portrait(id, 24, moodForLean(lean))}</i>`);
        face.title = BOARD_MEMBERS.find((member) => member.id === id)?.name ?? id;
        bar.lastElementChild.append(face);
      }
      card.prepend(bar);
    }
    for (const choice of view.choices) {
      const button = choiceButton(choice);
      button.addEventListener('click', () => {
        if (!preview) {
          answered[view.id] = choice.id;
          queueAnswer(game, view.id, choice.id);
        }
        // Under real time the answer applies at once and the update may already have closed this
        // card and opened the next one; close only this card.
        if (current?.id === view.id) close();
        settle();
      });
      card.querySelector('.ev-choices').append(button);
    }
    const later = () => {
      close({ aside: true });
      settle();
    };
    card.querySelector('.ev-later').addEventListener('click', later);
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      later();
    });
    layer.append(card);

    const bubbles = [];
    for (const line of argueLines(view)) {
      const head = anchors.heads[line.role];
      if (!head) continue;
      const band = game.state.lastBriefing?.find((reading) => reading.id === line.role)?.band ?? 'calm';
      bubbles.push(bubbleAt(layer, head, { label: ADVISOR_TITLE[line.role], say: line.say, pick: line.pick, width: 240, dy: band === 'calm' ? -34 : -64 })); // clear their "!" marker
    }
    separate(bubbles);
    card.querySelector('.ev-choice')?.focus();
    emit('event-card-open');
  }

  function openCard(id, { preview = null } = {}) {
    const view = preview ? cardView(preview) : known.get(id);
    if (!view || !anchors || (!preview && Object.hasOwn(answered, id))) return false;
    const active = document.activeElement;
    if (!current && active && active !== document.body && !active.closest('.event-layer')) returnTo = active;
    close({ aside: true });
    setAside.delete(id);
    render(view, { preview: Boolean(preview) });
    return true;
  }

  overlay.addEventListener('gdt-dialog-closed', () => {
    if (!previewing) openNext();
  });

  function afterAnchors(state) {
    if (anchors && anchorsEra === state.era) {
      // Open in the same task as the notification, so a multi-day clock step pauses on the card
      // before it can run past the card's deadline.
      if (!previewing) openNext();
      emit('events-changed');
      return Promise.resolve();
    }
    // A new era's office positions are not loaded yet: hold the clock so a card that just landed
    // cannot run out of time before it opens.
    const hold = queue.length > 0 && !previewing;
    if (hold) clock()?.pause(LOADING_REASON);
    return loadAnchors(state.era).then((loaded) => {
      anchors = loaded;
      anchorsEra = state.era;
      if (!previewing) openNext();
      emit('events-changed');
    }).catch((error) => console.error(error)).finally(() => {
      if (hold) clock()?.resume(LOADING_REASON);
    });
  }

  game.subscribe(({ state, events }) => {
    sync(state, events ?? []);
    afterAnchors(state);
  });

  // Warm every era's office positions, so an era change rarely has to wait for a fetch.
  for (const era of ERAS) loadAnchors(era).catch(() => {});

  sync(game.state, []);
  const ready = afterAnchors(game.state);

  return {
    openCard: (id) => openCard(id),
    // Debug route: show any catalog card without queueing an answer.
    async preview(id) {
      const row = catalogRow(id);
      if (!row) return;
      previewing = true;
      await ready;
      openCard(id, {
        preview: {
          id,
          title: row.card.title,
          post: row.card.post,
          choices: row.card.choices.map(({ id: choiceId, label, cost, backers, opposers }) => ({ id: choiceId, label, cost, backers, opposers })),
          kicker: row.card.kicker,
          watching: row.card.watching,
        },
      });
    },
    // Cards the player put aside and can still answer, for the desk phone.
    waiting() {
      return [...setAside].filter((id) => known.has(id) && !Object.hasOwn(answered, id)).map((id) => {
        const days = remaining(id);
        return { id, title: known.get(id).title, due: days === null ? null : dueText(id, days) };
      });
    },
  };
}
