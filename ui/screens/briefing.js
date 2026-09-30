import { bubbleAt, dueBar, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE, formatStoryTime, jokeFor, openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';
import { advisorMarks } from '../logic/advisorMarks.js';

const ROLES = ['research', 'safety', 'cfo', 'policy'];

export function warningProgress(warning, day) {
  const start = Number.isFinite(warning.day) ? warning.day : warning.dueAt;
  const span = Math.max(1, warning.dueAt - start);
  return Math.max(0, warning.dueAt - day) / span;
}

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

  // An event card or any dialog (the release reveal, a menu screen) holds the stage.
  const cardOpen = () => Boolean(overlay.querySelector('.event-layer, .dialog-layer'));
  const bandOf = (role) => game.state.lastBriefing?.find((reading) => reading.id === role)?.band ?? 'calm';
  const lookedInto = () => game.queue.addressWarnings ?? [];
  const unresolved = () => openWarnings(game.state, lookedInto());

  function clearTalking() {
    talking?.remove();
    talking = null;
  }

  // An advisor with a warning waiting for an answer raises it first; otherwise they say how things look.
  function speak(role) {
    if (!anchors?.heads?.[role] || cardOpen()) return;
    if (live?.warning.advisor === role) return; // their warning is already up at their desk
    const warning = waiting.find((candidate) => candidate.advisor === role)
      ?? unresolved().find((candidate) => candidate.advisor === role);
    if (warning) {
      clearTalking();
      waiting = waiting.filter((candidate) => candidate.id !== warning.id);
      if (live) waiting.unshift(live.warning); // the other advisor's warning waits its turn again
      live?.node.remove();
      live = null;
      waiting.unshift(warning);
      showNextWarning();
      return;
    }
    clearTalking();
    const reading = game.state.lastBriefing?.find((candidate) => candidate.id === role);
    const band = bandOf(role);
    const say = [reading?.line ?? 'Nothing to report yet.', jokeFor(role, band, game.state.turn)].filter(Boolean).join(' ');
    talking = bubbleAt(root, anchors.heads[role], { label: `${ADVISOR_TITLE[role]} · ${band}`, say, width: 260 });
    // Heard: their mark stays away until they have something new to say (ui/logic/advisorMarks.js).
    advisorMarks.heard(role, reading);
  }

  // Dismissing a bubble does not answer its warning; the sim and queued answers own that state.
  const syncTasks = () => advisorMarks.setTasks(unresolved());

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

  // The person, or the invisible area around their desk (ui/office.js, addHitAreas).
  const roleOf = (target) => ROLES.find((role) => target.closest?.(`#person-${role}, [data-advisor="${role}"]`));
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
    const due = warningDue(warning.id);
    if (due) extra.append(due);
    const row = el('<div class="ev-row"><button type="button" class="ev-act"></button><button type="button" class="ev-act ghost">Not now</button></div>');
    const act = row.querySelector('.ev-act');
    act.textContent = `${warning.response.label} (${money(warning.response.cost)})`;
    act.disabled = game.state.cash < warning.response.cost;
    if (act.disabled) act.title = 'Not enough cash for this response';
    extra.append(row);
    const node = bubbleAt(root, head, {
      label: `${ADVISOR_TITLE[warning.advisor]} · ${bandOf(warning.advisor)}`,
      say: warning.say,
      width: 340,
      tail: 30,
      dy: -64, // clear their "!" marker, which stays up until the warning is answered
      extra,
    });
    const done = () => {
      node.remove();
      if (live?.node === node) live = null;
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

  function warningDue(id) {
    const warning = game.state.warnings?.[id];
    if (!Number.isFinite(warning?.dueAt) || !Number.isFinite(game.state.day)) return null;
    const days = Math.max(0, warning.dueAt - game.state.day);
    return dueBar(`Gets worse in ${formatStoryTime(days)} if nobody acts`, warningProgress(warning, game.state.day), { calm: true }); // OWNER WRITES
  }

  function showNextWarning() {
    while (!cardOpen() && !live && waiting.length) {
      const warning = waiting.shift();
      const node = warningBubble(warning);
      if (node) live = { warning, node };
    }
    syncTasks();
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
    // Story days pass while a warning stays up; keep its countdown current.
    const oldDue = live?.node.querySelector('.ev-due');
    const newDue = live ? warningDue(live.warning.id) : null;
    if (oldDue && newDue) oldDue.replaceWith(newDue);
    for (const warning of open) {
      if (raised.has(warning.id)) continue;
      raised.add(warning.id);
      waiting.push(warning);
    }
    syncTasks();
    loadAnchors(state.era).then((loaded) => {
      anchors = loaded;
      makeClickable();
      showNextWarning();
    }).catch((error) => console.error(error));
  }

  overlay.addEventListener('event-card-closed', showNextWarning);
  // A warning looked into from the phone (ui/screens/flock.js) is answered too: its mark goes at once.
  overlay.addEventListener('events-changed', () => refresh(game.state));
  overlay.addEventListener('gdt-dialog-closed', showNextWarning);
  // A card or a dialog takes the stage; a raised warning steps aside and comes back when it closes.
  function stepAside() {
    clearTalking();
    if (!live) return;
    live.node.remove();
    waiting.unshift(live.warning);
    live = null;
  }
  overlay.addEventListener('event-card-open', stepAside);
  // Dialogs (the release flow, a menu screen) send no open event, so watch for them as the clock does.
  new MutationObserver(() => {
    if ((live || talking) && cardOpen()) stepAside();
  }).observe(overlay, { childList: true, subtree: true });
  game.subscribe(({ state }) => refresh(state));
  refresh(game.state);
}
