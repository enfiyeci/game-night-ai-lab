import { flyBubble } from '../fx.js';
import { sfx } from '../sfx.js';
import { badgeCounts, bubbleSpawns, floorHint, readyNote } from '../logic/training.js';

const anchorsByEra = new Map();
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

async function anchorsFor(era) {
  if (!anchorsByEra.has(era)) {
    anchorsByEra.set(era, fetch(`ui/assets/anchors-era${era}.json`).then((response) => {
      if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
      return response.json();
    }));
  }
  return anchorsByEra.get(era);
}

function sourcePoint(anchors, source) {
  if (source === 'rack') return [anchors.rack[0] - 10, anchors.rack[1] - 70];
  const [x, y] = anchors.heads[source];
  return [x, y - 6];
}

export function mountTraining(game, { stage, hud, overlay }) {
  const layer = document.createElement('div');
  layer.id = 'training-fx';
  stage.querySelector('#fx').after(layer);

  let shown = badgeCounts(game.state, game.lastAlignShare);
  let generation = 0;
  let flying = false;
  const tickTimers = new Map();

  const badges = () => ({
    capability: hud.querySelector('.cap .badge'),
    alignment: hud.querySelector('.ali .badge'),
  });

  // The counts on screen are kept here, not read back from the badges: the HUD can redraw them at any moment.
  let displayed = { ...shown };

  function writeCounts(counts) {
    displayed = { ...counts };
    const current = badges();
    current.capability.textContent = `${counts.capability}`;
    current.alignment.textContent = `${counts.alignment}`;
  }

  function centre(element) {
    const stageRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const scale = stageRect.width / 1440;
    return [
      (rect.left + rect.width / 2 - stageRect.left) / scale,
      (rect.top + rect.height / 2 - stageRect.top) / scale,
    ];
  }

  function tick(kind) {
    writeCounts({ ...displayed, [kind]: displayed[kind] + 1 });
    const badge = badges()[kind];
    badge.classList.remove('tick');
    void badge.offsetWidth;
    badge.classList.add('tick');
    globalThis.clearTimeout(tickTimers.get(kind));
    tickTimers.set(kind, globalThis.setTimeout(() => badge.classList.remove('tick'), 180));
  }

  function updateReadyNote() {
    const text = readyNote(game.state);
    let note = overlay.querySelector('.ready-note');
    if (!text) {
      note?.remove();
    } else if (!note) {
      note = document.createElement('div');
      note.className = 'ready-note';
      note.textContent = text;
      overlay.append(note);
    }
    updateFloorHint();
  }

  // Owner pick 2A: while the first model waits, a ring on the floor shows where the menu is, until the player opens it.
  let menuSeen = false;
  function updateFloorHint() {
    const want = () => floorHint(game.state) && !menuSeen;
    const hint = layer.querySelector('.floor-hint');
    if (!want() || (hint && hint.dataset.era !== `${game.state.era}`)) hint?.remove();
    if (!want() || layer.querySelector('.floor-hint')) return;
    const era = game.state.era;
    anchorsFor(era).then((anchors) => {
      if (!want() || game.state.era !== era || layer.querySelector('.floor-hint')) return;
      const [x, y] = anchors.floorMenu;
      const node = document.createElement('div');
      node.className = 'floor-hint';
      node.dataset.era = `${era}`;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.setAttribute('aria-hidden', 'true'); // the ready note says the same in words
      node.innerHTML = '<i class="floor-hint-ring"></i><i class="floor-hint-dot"></i><span class="floor-hint-label">Click the floor for the menu</span>';
      layer.append(node);
    }).catch((error) => console.error(error));
  }

  // Only a menu opened while the model waits counts: the player opens it earlier to start the run itself.
  new MutationObserver(() => {
    if (menuSeen || !floorHint(game.state) || !overlay.querySelector(':scope > .menu-layer')) return;
    menuSeen = true;
    updateFloorHint();
  }).observe(overlay, { childList: true });

  // Real time: the counts can rise every in-game day, so a rise while bubbles fly adds bubbles rather than
  // cancelling the ones in the air. A drop (a release, a new run) snaps straight to the new counts.
  let inFlight = 0;

  function snap(target) {
    generation += 1;
    layer.querySelectorAll('.fly-bubble').forEach((bubble) => bubble.remove());
    inFlight = 0;
    flying = false;
    shown = target;
    writeCounts(target);
  }

  async function launch(from, to) {
    const spawns = bubbleSpawns(from, to);
    if (spawns.length === 0) return;
    const flightGeneration = generation;
    flying = true;
    inFlight += spawns.length;

    let anchors;
    try {
      anchors = await anchorsFor(game.state.era);
    } catch (error) {
      if (generation === flightGeneration) snap(shown);
      throw error;
    }
    if (generation !== flightGeneration) return;

    const currentBadges = badges();
    const destinations = {
      capability: centre(currentBadges.capability),
      alignment: centre(currentBadges.alignment),
    };
    const gap = Math.min(420, 3600 / spawns.length);
    spawns.forEach((spawn, index) => {
      // Owner 2026-09-26: the bubbles get sound, from the release show's kit: a soft pop as a bubble
      // leaves a desk, and a blip on landing that climbs as the badge fills (capability higher than alignment).
      setTimeout(() => { if (generation === flightGeneration && !reducedMotion()) sfx.pop(-5, 0.04); }, index * gap);
      flyBubble(layer, spawn.kind, sourcePoint(anchors, spawn.source), destinations[spawn.kind], { delay: index * gap })
        .then(() => {
          if (generation !== flightGeneration) return;
          tick(spawn.kind);
          if (!reducedMotion()) sfx.tick(displayed[spawn.kind] % 10, { base: spawn.kind === 'capability' ? 523.25 : 392, gain: 0.06 });
          inFlight -= 1;
          if (inFlight === 0) {
            flying = false;
            writeCounts(shown);
          }
        });
    });
  }

  function render() {
    updateReadyNote();
    const target = badgeCounts(game.state, game.lastAlignShare);
    if (reducedMotion()) {
      snap(target);
      return;
    }
    const same = target.capability === shown.capability && target.alignment === shown.alignment;
    if (same) {
      writeCounts(flying ? displayed : target); // the HUD has just redrawn the badges at the target
      return;
    }
    const grows = target.capability >= shown.capability && target.alignment >= shown.alignment;
    if (!grows) {
      snap(target);
      return;
    }
    const from = shown;
    shown = target;
    writeCounts(displayed); // the bubbles, not the HUD redraw, carry the badges up
    launch(from, target).catch((error) => console.error(error));
  }

  // The HUD also redraws itself (the info toggle); keep the in-flight counts rather than jumping to the target.
  new MutationObserver(() => {
    if (flying) writeCounts(displayed);
  }).observe(hud, { childList: true });

  overlay.addEventListener('hazard-chosen', updateReadyNote);
  game.subscribe(render);
  updateReadyNote();

  return {
    replay(from = { capability: 0, alignment: 0 }) {
      const target = badgeCounts(game.state, game.lastAlignShare);
      snap(from);
      if (reducedMotion()) {
        snap(target);
        return Promise.resolve();
      }
      shown = target;
      return launch(from, target).catch((error) => console.error(error));
    },
  };
}
