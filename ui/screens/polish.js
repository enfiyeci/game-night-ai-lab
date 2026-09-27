import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { flyBubble } from '../fx.js';
import { sfx } from '../sfx.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { flawRows, polishIntro, stripModel } from '../logic/polish.js';
import { openRelease } from './release.js';

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const INTRO_KEY = 'gn-polish-introduced';

// Polishing stays on the day clock while these controls are open.
export function mountPolish(game, { stage, hud, overlay }) {
  const layer = el('<div class="polish-layer"></div>');
  overlay.append(layer);
  const talk = el('<div class="ev-briefing"></div>');
  overlay.append(talk);
  const flights = document.createElement('div');
  flights.id = 'polish-fx';
  stage.querySelector('#fx').after(flights);
  let flawsOpen = false;
  let stripOpen = false;
  let intro = null;
  let introDone = false;
  try { introDone = localStorage.getItem(INTRO_KEY) === '1'; } catch { /* storage may be blocked */ }

  const polishing = () => Boolean(game.state.pendingModel?.polishing) && !game.state.ending;
  const busy = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer, .ev-phone, .screenwall-layer, .intro-layer, .title-layer'));

  // Stage coordinates (1440 × 900) of an element's centre, as the training bubbles use.
  function centre(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const k = s.width / 1440;
    return [(r.left + r.width / 2 - s.left) / k, (r.top + r.height / 2 - s.top) / k];
  }

  function drawFlaws() {
    layer.querySelector('.polish-flaws')?.remove();
    const rows = flawRows(game.state);
    const badge = hud.querySelector('.hud-flaw:not([hidden]) .badge');
    if (!flawsOpen || !rows.length || !badge) {
      flawsOpen = false;
      return;
    }
    const [x, y] = centre(badge);
    const card = el('<section class="polish-flaws" aria-label="Flaws"><div class="polish-flaws-head">Flaws · top one gets fixed next</div></section>');
    card.style.left = `${x - 70}px`;
    card.style.top = `${y + 42}px`;
    for (const row of rows) {
      const item = el(`<div class="polish-flaw ${row.state}"><i class="ico" aria-hidden="true"></i><div class="txt"><div class="n"></div><div class="q"></div></div><div class="st"></div></div>`);
      item.querySelector('.n').textContent = row.name;
      item.querySelector('.q').textContent = `${row.who}: “${row.say}”`;
      item.querySelector('.st').textContent = row.stateLabel;
      if (row.actions.length) {
        const acts = el('<div class="polish-flaw-acts"></div>');
        for (const { action, label } of row.actions) {
          const button = el('<button type="button" class="ev-act ghost"></button>');
          button.textContent = label;
          button.addEventListener('click', () => game.setField('flawActions', [{ flag: row.flag, action }]));
          acts.append(button);
        }
        item.querySelector('.txt').append(acts);
      }
      card.append(item);
    }
    layer.append(card);
  }

  // The calendar strip (option D), as drawn in docs/design/mockups/keep-polishing/img/D.jpg: your lane on top, rivals
  // under it, one date scale, today in coral, Publish on the right.
  const TRACK_LEFT = 36;
  const TRACK_WIDTH = 800;
  function drawStrip() {
    layer.querySelector('.polish-strip')?.remove();
    const strip = stripOpen && polishing() ? stripModel(game.state) : null;
    if (!strip) {
      stripOpen = false;
      return;
    }
    const X = (x) => TRACK_LEFT + x * TRACK_WIDTH;
    const card = el(`<section class="polish-strip" aria-label="Polishing calendar">
      <div class="ps-title"></div><div class="ps-sub">flaws, then polish</div>
      <div class="ps-lane you">YOU</div><div class="ps-lane rivals">RIVALS</div>
      <div class="ps-rule"></div></section>`);
    card.querySelector('.ps-title').textContent = `${hud.querySelector('.hud .pill .t')?.textContent ?? ''} · ${strip.title}`;
    const put = (html, left, extra = {}) => {
      const node = el(html);
      node.style.left = `${left}px`;
      for (const [key, value] of Object.entries(extra)) node.style[key] = value;
      card.append(node);
      return node;
    };
    put('<div class="ps-today"></div>', X(strip.today.x)); // drawn before the bubbles, so it paints under them
    put('<div class="ps-today-label"></div>', Math.min(680, Math.max(360, X(strip.today.x) + 7))).textContent = strip.today.label;
    for (const block of strip.blocks) {
      put(`<div class="ps-block${block.done ? ' done' : ''}"></div>`, X(block.x0) + 1, { width: `${Math.max(12, (block.x1 - block.x0) * TRACK_WIDTH - 3)}px` }).textContent = block.label;
    }
    for (const bubble of strip.bubbles) {
      const node = put(`<div class="ps-bubble${bubble.past ? ' past' : ''}"></div>`, X(bubble.x) - bubble.size / 2, {
        width: `${bubble.size}px`, height: `${bubble.size}px`, top: `${53 - bubble.size / 2}px`,
      });
      if (bubble.size >= 19) node.textContent = `+${Math.round(bubble.gain)}`;
    }
    for (const landed of strip.landed) {
      put('<div class="ps-dot"></div>', X(landed.x) - 5);
      const left = Math.min(X(landed.x) + 9, TRACK_LEFT + TRACK_WIDTH - 150);
      const label = put('<div class="ps-landed"></div>', left, { maxWidth: `${TRACK_LEFT + TRACK_WIDTH - left}px` });
      label.textContent = `${landed.name} launched`;
      label.title = label.textContent;
    }
    // Rivals in the same rumor window share a label instead of printing over one another.
    const windows = new Map();
    for (const window of strip.windows) {
      const key = `${window.x0}:${window.x1}`;
      if (!windows.has(key)) windows.set(key, { ...window, names: [] });
      windows.get(key).names.push(window.name);
    }
    for (const window of windows.values()) {
      put('<div class="ps-window"></div>', X(window.x0), { width: `${Math.max(8, (window.x1 - window.x0) * TRACK_WIDTH)}px` });
      const left = Math.min(X(window.x0) + 4, TRACK_LEFT + TRACK_WIDTH - 160);
      const label = put('<div class="ps-window-label"></div>', left, { maxWidth: `${TRACK_LEFT + TRACK_WIDTH - left}px` });
      label.textContent = `${window.names.join(' / ')} rumored`;
      label.title = label.textContent;
    }
    for (const tick of strip.ticks) {
      put('<div class="ps-tick"></div>', X(tick.x));
      put('<div class="ps-tick-label"></div>', Math.min(X(tick.x), TRACK_LEFT + TRACK_WIDTH - 45)).textContent = tick.label;
    }
    const publish = el('<button type="button" class="hud-publish ps-publish">Publish now</button>');
    publish.addEventListener('click', () => {
      if (busy()) return;
      closeAll();
      openRelease(game, overlay);
    });
    card.append(publish);
    if (strip.leftIn.length) card.append(el(`<div class="ps-left">${strip.leftIn.map((name) => `${name}: left in`).join('<br>')}</div>`));
    layer.append(card);
  }

  function toggleStrip(open = !stripOpen) {
    stripOpen = open && polishing();
    drawStrip();
  }

  function closeAll() {
    flawsOpen = false;
    stripOpen = false;
    drawFlaws();
    drawStrip();
  }

  function endIntro({ done }) {
    intro?.remove();
    intro = null;
    if (!done || introDone) return;
    introDone = true;
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* storage may be blocked */ }
  }

  function maybeIntroduce() {
    if (introDone || intro || !polishing() || busy()) return;
    const era = game.state.era;
    loadAnchors(era).then((anchors) => {
      const head = anchors.heads?.research;
      if (!head || introDone || intro || !polishing() || busy() || game.state.era !== era) return;
      const row = el('<div class="ev-row"><button type="button" class="ev-act ghost">Got it</button></div>');
      intro = bubbleAt(talk, head, { label: ADVISOR_TITLE.research, say: polishIntro(game.state), width: 280, extra: row });
      row.querySelector('button').addEventListener('click', () => endIntro({ done: true }));
    }).catch((error) => console.error(error));
  }

  async function flyFor(events) {
    if (reducedMotion()) return;
    const wanted = events.filter((e) => e.type === 'flawFixed' || e.type === 'polishBubble');
    if (!wanted.length) return;
    const anchors = await loadAnchors(game.state.era);
    wanted.forEach((event, index) => {
      const fix = event.type === 'flawFixed';
      const target = fix ? hud.querySelector('.hud-flaw:not([hidden]) .badge') : hud.querySelector('.hud .pill');
      const head = anchors.heads?.[fix ? 'safety' : 'research'];
      if (!target || !head) return;
      const delay = index * 380;
      setTimeout(() => sfx.pop(-5, 0.04), delay);
      flyBubble(flights, fix ? 'flaw' : 'polish', [head[0], head[1] - 6], centre(target), { delay, duration: 1100, label: fix ? '✓' : `+${Math.round(event.gain)}` })
        .then(() => sfx.tick(fix ? 2 : 5, { base: fix ? 392 : 523.25, gain: 0.06 }));
    });
  }

  overlay.addEventListener('polish-act', (event) => {
    if (!polishing() || busy()) return;
    if (event.detail === 'publish') {
      closeAll();
      openRelease(game, overlay);
    } else if (event.detail === 'flaws') {
      flawsOpen = !flawsOpen;
      drawFlaws();
    } else if (event.detail === 'strip') toggleStrip();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || (!flawsOpen && !stripOpen) || busy()) return;
    event.preventDefault();
    closeAll();
  });
  overlay.addEventListener('gdt-dialog-closed', maybeIntroduce);
  game.subscribe(({ events }) => {
    if (!polishing()) {
      closeAll();
      endIntro({ done: false });
      return;
    }
    drawFlaws();
    drawStrip();
    maybeIntroduce();
    flyFor(events ?? []).catch((error) => console.error(error));
  });
  maybeIntroduce();
  return { toggleStrip, drawStrip: () => drawStrip() };
}
