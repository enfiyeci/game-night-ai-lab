import { el, loadAnchors } from '../components/eventBits.js';
import { openWarnings } from '../logic/events.js';
import { openFlock, unseenCount } from './flock.js';

// The phone on the CEO desk (plan 2D option A): a count of what waits for you, and Flock, the feed.
export function mountFeed(game, { overlay, events }) {
  const button = el('<button type="button" class="ev-phone-button"></button>');
  overlay.append(button);
  let panel = null;

  const waitingWarnings = () => openWarnings(game.state, game.queue.addressWarnings ?? []);
  const count = () => events.waiting().length + waitingWarnings().length;

  // Coral: things waiting for your answer. Sky: new posts since you last looked (the phone buzzes with the feed).
  function drawButton() {
    const n = count();
    const fresh = Math.min(99, unseenCount(game.state));
    const shown = n || fresh;
    const tone = n ? 'var(--coral)' : 'var(--sky)';
    button.setAttribute('aria-label', n ? `Your phone: ${n} waiting` : fresh ? `Your phone: ${fresh} new posts` : 'Your phone: the feed');
    button.innerHTML = `<svg viewBox="-30 -25 60 50" width="60" height="50" aria-hidden="true">
      <g transform="rotate(-30)"><rect x="-15" y="-8" width="30" height="16" rx="4" style="fill:var(--ink)"/><rect x="-12" y="-5.5" width="24" height="11" rx="2" style="fill:color-mix(in oklab, var(--sky) 55%, var(--paper))"/></g>
      ${shown ? `<circle cx="18" cy="-16" r="${shown > 9 ? 10.5 : 9}" style="fill:${tone};stroke:var(--paper);stroke-width:2"/><text x="18" y="-12" text-anchor="middle" style="font:900 ${shown > 9 ? 10 : 11}px Nunito;fill:var(--paper)">${shown}</text>` : ''}</svg>`;
  }

  function place() {
    loadAnchors(game.state.era).then((anchors) => {
      const [x, y] = anchors.heads.ceo;
      button.style.left = `${x - 3}px`;
      button.style.top = `${y + 96}px`;
    }).catch((error) => console.error(error));
  }

  function closePanel() {
    panel = null;
    drawButton();
    button.focus();
  }

  // The phone opens Flock, the full-page feed (ui/screens/flock.js). Cards waiting and warnings sit under Notifications.
  function openPanel() {
    panel = openFlock(game, { overlay, events, onClose: closePanel });
  }

  button.addEventListener('click', () => {
    if (panel) panel.close();
    else openPanel();
  });
  overlay.addEventListener('events-changed', () => {
    drawButton();
    if (panel) panel.redraw();
  });
  game.subscribe(() => {
    place();
    drawButton();
  });
  place();
  drawButton();
}
