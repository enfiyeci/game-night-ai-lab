import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { flyBubble } from '../fx.js';
import { sfx } from '../sfx.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { flawRows, polishIntro } from '../logic/polish.js';
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

  function drawStrip() {}

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
