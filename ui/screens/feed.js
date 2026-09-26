import { el, loadAnchors, post } from '../components/eventBits.js';
import { lookIntoCost, openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';

// The phone on the CEO desk (plan 2D option A): a count of what waits for you, and the feed.
export function mountFeed(game, { overlay, events }) {
  const button = el('<button type="button" class="ev-phone-button"></button>');
  overlay.append(button);
  let panel = null;

  const waitingWarnings = () => openWarnings(game.state, game.queue.addressWarnings ?? []);
  const count = () => events.waiting().length + waitingWarnings().length;

  function drawButton() {
    const n = count();
    button.setAttribute('aria-label', n ? `Your phone: ${n} waiting` : 'Your phone: the feed');
    button.innerHTML = `<svg viewBox="-30 -25 60 50" width="60" height="50" aria-hidden="true">
      <g transform="rotate(-30)"><rect x="-15" y="-8" width="30" height="16" rx="4" style="fill:var(--ink)"/><rect x="-12" y="-5.5" width="24" height="11" rx="2" style="fill:color-mix(in oklab, var(--sky) 55%, var(--paper))"/></g>
      ${n ? `<circle cx="18" cy="-16" r="9" style="fill:var(--coral);stroke:var(--paper);stroke-width:2"/><text x="18" y="-12" text-anchor="middle" style="font:900 11px Nunito;fill:var(--paper)">${n}</text>` : ''}</svg>`;
  }

  function place() {
    loadAnchors(game.state.era).then((anchors) => {
      const [x, y] = anchors.heads.ceo;
      button.style.left = `${x - 3}px`;
      button.style.top = `${y + 96}px`;
    }).catch((error) => console.error(error));
  }

  function section(title) {
    const node = el('<div class="ev-phone-sec"></div>');
    node.textContent = title;
    return node;
  }

  function closePanel() {
    panel?.remove();
    panel = null;
    button.focus();
  }

  function drawPanel() {
    const fresh = el('<section class="ev-phone" role="dialog" aria-label="Your phone"><div class="ev-phone-scr"><div class="ev-phone-notch"></div><div class="ev-phone-top"><h2>Feed</h2><button type="button" class="ev-act ghost" aria-label="Close the phone">×</button></div><div class="ev-phone-list"></div></div></section>');
    const list = fresh.querySelector('.ev-phone-list');
    const cards = events.waiting();
    if (cards.length) {
      list.append(section('Waiting for you'));
      for (const card of cards) {
        const row = el('<div class="ev-phone-row"><b></b><span class="ev-phone-hint"></span><button type="button" class="ev-act">Open</button></div>');
        row.querySelector('b').textContent = card.title;
        row.querySelector('.ev-phone-hint').textContent = card.due ?? '';
        row.querySelector('button').addEventListener('click', () => {
          closePanel();
          events.openCard(card.id);
        });
        list.append(row);
      }
    }
    const warnings = waitingWarnings();
    if (warnings.length) {
      list.append(section('Warnings'));
      for (const warning of warnings) {
        const row = el('<div class="ev-phone-row stack"><button type="button" class="ev-act"></button></div>');
        row.prepend(post(warning));
        const act = row.querySelector('button');
        act.textContent = `Look into it (${money(lookIntoCost(game.state))})`;
        act.addEventListener('click', () => {
          queueLookInto(game, warning.id);
          overlay.dispatchEvent(new CustomEvent('events-changed'));
        });
        list.append(row);
      }
    }
    list.append(section('Latest'));
    for (const item of (game.state.feed ?? []).slice(-20).reverse()) {
      const row = el('<div class="ev-phone-item"></div>');
      row.append(post(item));
      list.append(row);
    }
    fresh.querySelector('.ev-phone-top button').addEventListener('click', closePanel);
    fresh.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePanel();
    });
    if (panel) panel.replaceWith(fresh);
    else overlay.append(fresh);
    panel = fresh;
  }

  button.addEventListener('click', () => {
    if (panel) {
      closePanel();
      return;
    }
    drawPanel();
    panel.querySelector('.ev-phone-top button').focus();
  });
  overlay.addEventListener('events-changed', () => {
    drawButton();
    if (panel) drawPanel();
  });
  game.subscribe(() => {
    place();
    drawButton();
    if (panel) drawPanel();
  });
  place();
  drawButton();
}
