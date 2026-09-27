import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE, openWarnings } from '../logic/events.js';
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

  // The first time the phone has something for you, it buzzes and Policy and Comms says what it is (owner
  // playtest 2026-09-26: "the phone appears magically"). Once per browser; a card or dialog holds it back.
  const INTRO_KEY = 'gn-phone-introduced';
  let introDone = false;
  try { introDone = localStorage.getItem(INTRO_KEY) === '1'; } catch { /* storage may be blocked */ }
  const introLayer = el('<div class="ev-briefing"></div>');
  overlay.append(introLayer);
  let intro = null;
  let introLoading = false;

  const stageBusy = () => Boolean(overlay.querySelector('.event-layer, .dialog-layer, .screenwall-layer'))
    || !button.offsetParent // the phone is hidden (a hazard card holds the desk)
    || Boolean(overlay.querySelector('.ev-briefing .ev-bubble:not(.phone-intro)')); // an advisor is already talking

  function endIntro({ done }) {
    intro?.remove();
    intro = null;
    button.classList.remove('buzz');
    if (!done) return;
    introDone = true;
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* storage may be blocked */ }
  }

  function maybeIntroduce() {
    if (intro && stageBusy()) endIntro({ done: false }); // step aside; it comes back when the stage is clear
    if (introDone || intro || introLoading || panel || !(count() || unseenCount(game.state)) || stageBusy()) return;
    introLoading = true;
    loadAnchors(game.state.era).then((anchors) => {
      introLoading = false;
      const head = anchors.heads?.policy;
      if (!head || introDone || intro || panel || stageBusy()) return;
      const row = el('<div class="ev-row"><button type="button" class="ev-act">Open the phone</button><button type="button" class="ev-act ghost">Not now</button></div>');
      intro = bubbleAt(introLayer, head, {
        label: ADVISOR_TITLE.policy,
        say: "That buzzing on your desk is your phone. Everyone in AI argues on Flock, and a lot of it is about us. Worth a look now and then.", // OWNER WRITES
        width: 280,
        extra: row,
      });
      intro.classList.add('phone-intro');
      button.classList.add('buzz');
      row.querySelector('.ev-act').addEventListener('click', () => {
        endIntro({ done: true });
        openPanel();
      });
      row.querySelector('.ghost').addEventListener('click', () => endIntro({ done: true }));
    }).catch((error) => {
      introLoading = false;
      console.error(error);
    });
  }

  button.addEventListener('click', () => {
    if (intro) endIntro({ done: true });
    if (panel) panel.close();
    else openPanel();
  });
  overlay.addEventListener('events-changed', () => {
    drawButton();
    if (panel) panel.redraw();
    maybeIntroduce();
  });
  overlay.addEventListener('gdt-dialog-closed', maybeIntroduce);
  overlay.addEventListener('event-card-closed', maybeIntroduce);
  game.subscribe(() => {
    place();
    drawButton();
    maybeIntroduce();
  });
  place();
  drawButton();
  maybeIntroduce();
}
