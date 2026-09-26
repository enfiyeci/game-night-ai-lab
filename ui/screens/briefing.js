import { bubbleAt, dueBar, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE, formatStoryTime, jokeFor, lookIntoCost, openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';

const ROLES = ['research', 'safety', 'cfo', 'policy'];
const WARNING_BAR_DAYS = 21;

// Advisors speak when clicked (owner pick 7A) and raise warnings at their desks (pick 1C).
// Warnings only inform, so they never pause the clock. Updates can arrive every story week,
// so a live bubble stays up until the player answers it or its warning goes away.
export function mountBriefing(game, { office, overlay }) {
  const root = el('<div class="ev-briefing"></div>');
  overlay.append(root);
  let anchors = null;
  const raised = new Set(); // warning ids already raised this time round
  let waiting = [];
  let live = null; // { warning, node }
  let talking = null;

  const cardOpen = () => Boolean(overlay.querySelector('.event-layer'));
  const bandOf = (role) => game.state.lastBriefing?.find((reading) => reading.id === role)?.band ?? 'calm';
  const lookedInto = () => game.queue.addressWarnings ?? [];

  function clearTalking() {
    talking?.remove();
    talking = null;
  }

  function speak(role) {
    if (!anchors?.heads?.[role] || cardOpen()) return;
    clearTalking();
    const reading = game.state.lastBriefing?.find((candidate) => candidate.id === role);
    const band = bandOf(role);
    const say = [reading?.line ?? 'Nothing to report yet.', jokeFor(role, band, game.state.turn)].filter(Boolean).join(' ');
    talking = bubbleAt(root, anchors.heads[role], { label: `${ADVISOR_TITLE[role]} · ${band}`, say, width: 260 });
    // Their "!" clears until the office next redraws its markers.
    for (const marker of overlay.parentElement.querySelectorAll('.advisor-marker')) {
      if (marker.getAttribute('aria-label')?.startsWith(`${role} `)) marker.remove();
    }
  }

  function makeClickable() {
    for (const role of ROLES) {
      const person = office.querySelector(`#person-${role}`);
      if (!person || person.hasAttribute('tabindex')) continue;
      person.setAttribute('tabindex', '0');
      person.setAttribute('role', 'button');
      person.setAttribute('aria-label', `${ADVISOR_TITLE[role]}: hear what they think`);
      person.style.cursor = 'pointer';
    }
  }

  const roleOf = (target) => ROLES.find((role) => target.closest?.(`#person-${role}`));
  office.addEventListener('click', (event) => {
    const role = roleOf(event.target);
    if (role) speak(role);
  });
  office.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const role = roleOf(event.target);
    if (!role) return;
    event.preventDefault();
    speak(role);
  });
  document.addEventListener('pointerdown', (event) => {
    if (talking && !talking.contains(event.target) && !roleOf(event.target)) clearTalking();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearTalking();
  });
  new MutationObserver(makeClickable).observe(office, { childList: true });

  function warningBubble(warning) {
    const head = anchors?.heads?.[warning.advisor];
    if (!head) return null;
    const extra = el('<div></div>');
    const dueAt = game.state.warnings?.[warning.id]?.dueAt;
    if (Number.isFinite(dueAt) && Number.isFinite(game.state.day)) {
      const days = Math.max(0, dueAt - game.state.day);
      extra.append(dueBar(`Gets worse in ${formatStoryTime(days)} if nobody acts`, days / WARNING_BAR_DAYS, { calm: true })); // OWNER WRITES
    }
    const row = el('<div class="ev-row"><button type="button" class="ev-act"></button><button type="button" class="ev-act ghost">Not now</button></div>');
    const act = row.querySelector('.ev-act');
    act.textContent = `Look into it (${money(lookIntoCost(game.state))})`;
    extra.append(row);
    const node = bubbleAt(root, head, {
      label: `${ADVISOR_TITLE[warning.advisor]} · ${bandOf(warning.advisor)}`,
      say: `Heads up: “${warning.text}” Might be nothing. It is never nothing.`, // OWNER WRITES
      width: 300,
      tail: 30,
      dy: bandOf(warning.advisor) === 'calm' ? -34 : -64, // clear their "!" marker
      extra,
    });
    const done = () => {
      node.remove();
      live = null;
      showNextWarning();
    };
    act.addEventListener('click', () => {
      queueLookInto(game, warning.id);
      overlay.dispatchEvent(new CustomEvent('events-changed'));
      done();
    });
    row.querySelector('.ghost').addEventListener('click', done);
    return node;
  }

  function showNextWarning() {
    while (!cardOpen() && !live && waiting.length) {
      const warning = waiting.shift();
      const node = warningBubble(warning);
      if (node) live = { warning, node };
    }
  }

  function refresh(state) {
    const open = openWarnings(state, lookedInto());
    const openIds = new Set(open.map((warning) => warning.id));
    // A warning that was answered or became a card can be raised again if it comes back later.
    for (const id of [...raised]) if (!openIds.has(id)) raised.delete(id);
    waiting = waiting.filter((warning) => openIds.has(warning.id));
    if (live && !openIds.has(live.warning.id)) {
      live.node.remove();
      live = null;
    }
    for (const warning of open) {
      if (raised.has(warning.id)) continue;
      raised.add(warning.id);
      waiting.push(warning);
    }
    loadAnchors(state.era).then((loaded) => {
      anchors = loaded;
      makeClickable();
      showNextWarning();
    }).catch((error) => console.error(error));
  }

  overlay.addEventListener('event-card-closed', showNextWarning);
  // A card takes the stage; a raised warning steps aside and comes back when the card closes.
  overlay.addEventListener('event-card-open', () => {
    clearTalking();
    if (!live) return;
    live.node.remove();
    waiting.unshift(live.warning);
    live = null;
  });
  game.subscribe(({ state }) => refresh(state));
  refresh(game.state);
}
