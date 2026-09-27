import { openDialog } from '../components/dialog.js';
import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { CLOCK_NOTE, TOUR, markTourSeen } from '../logic/intro.js';
import { FAMILY_MAX, cleanFamily, needsFamilyName } from '../logic/naming.js';
import { openMenu, registerMenuHandler } from '../menu.js';
import { openRecipe } from './recipe.js';

// Anything that holds the stage before the tour may start.
const HOLDERS = '.dialog-layer, .event-layer, .title-layer, .menu-layer, .screenwall-layer';

// The first-minute tour (owner pick B). The clock waits while the team talks; the last stop waits for the floor click.
export function mountIntro(game, { stage, overlay, storage }) {
  let layer = null;
  let index = 0;
  let anchors = null;
  let watcher = null;
  let starting = false;

  // A HUD element's box in stage coordinates (the page may be zoomed to fit the window).
  function stageBox(selector) {
    const node = stage.querySelector(selector);
    if (!node) return null;
    const stageRect = stage.getBoundingClientRect();
    const scale = stageRect.width / 1440;
    const rect = node.getBoundingClientRect();
    return {
      x: (rect.left - stageRect.left) / scale,
      y: (rect.top - stageRect.top) / scale,
      w: rect.width / scale,
      h: rect.height / scale,
    };
  }

  function outline(box, pad = 8) {
    if (!box) return;
    const node = el('<div class="intro-mark" aria-hidden="true"></div>');
    Object.assign(node.style, {
      left: `${box.x - pad}px`, top: `${box.y - pad}px`, width: `${box.w + pad * 2}px`, height: `${box.h + pad * 2}px`,
    });
    layer.append(node);
  }

  function finish() {
    if (!layer) return;
    watcher?.disconnect();
    watcher = null;
    layer.remove();
    layer = null;
    document.removeEventListener('keydown', onKey, true);
    markTourSeen(storage);
    game.clock?.resume('intro');
  }

  function onKey(event) {
    if (event.key !== 'Escape' || !layer) return;
    event.preventDefault();
    event.stopPropagation();
    finish();
  }

  function show() {
    const step = TOUR[index];
    const last = index === TOUR.length - 1;
    layer.replaceChildren();
    layer.classList.toggle('intro-open', last); // the last stop lets clicks through to the floor
    const head = anchors.heads[step.who];
    if (!last) {
      const hole = el('<div class="intro-hole" aria-hidden="true"></div>');
      hole.style.left = `${head[0] - 95}px`;
      hole.style.top = `${head[1] + 52 - 95}px`;
      layer.append(hole);
    }
    if (step.point === 'badges') {
      const cap = stageBox('.hud .ctr.cap');
      const ali = stageBox('.hud .ctr.ali');
      if (cap && ali) outline({ x: cap.x, y: cap.y, w: ali.x + ali.w - cap.x, h: Math.max(cap.h, ali.h) }, 10);
    }
    if (step.point === 'money') {
      outline(stageBox('#hud .info'));
      outline(stageBox('#hud [data-open="money"]'), 5);
    }
    if (step.point === 'compute') outline(stageBox('#hud [data-open="compute"]'), 5);
    if (step.point === 'floor') {
      const [x, y] = anchors.floorMenu;
      const ring = el('<div class="intro-ring" aria-hidden="true"></div>');
      ring.style.left = `${x - 45}px`;
      ring.style.top = `${y - 75}px`;
      layer.append(ring);
      const clock = stageBox('#hud .clock');
      if (clock) {
        const note = bubbleAt(layer, [clock.x + clock.w - 70, clock.y + clock.h + 18], { label: 'Clock', say: CLOCK_NOTE, width: 280, tail: 238, dy: 0 });
        note.classList.add('intro-up');
        note.style.top = `${clock.y + clock.h + 16}px`;
      }
    }
    bubbleAt(layer, head, { label: ADVISOR_TITLE[step.who], say: step.say, width: 300, tail: 30, dy: -34 }).classList.add('intro-say');

    const bar = el(`<section class="gp intro-bar" aria-label="Tour of the office">
      <span class="intro-bar-title"></span><span class="intro-dots" aria-hidden="true"></span>
      <button type="button" class="intro-skip"></button><button type="button" class="btn intro-next">Next</button>
    </section>`);
    bar.querySelector('.intro-bar-title').textContent = last ? 'Your turn: click the floor' : 'Meet your team';
    for (let i = 0; i < TOUR.length; i += 1) bar.querySelector('.intro-dots').append(el(`<i class="${i === index ? 'on' : ''}"></i>`));
    const skip = bar.querySelector('.intro-skip');
    skip.textContent = last ? 'Close' : 'Skip the tour';
    skip.addEventListener('click', finish);
    const next = bar.querySelector('.intro-next');
    // On the last stop the button opens the same menu the floor does, so keyboard players can finish too.
    if (last) next.textContent = 'Open the menu';
    next.addEventListener('click', () => {
      if (last) {
        // The same screens that block a floor click (ui/main.js) block this button.
        if (!overlay.querySelector('.dialog-layer, .event-layer, .ev-phone, .screenwall-layer')) openMenu(game, anchors.floorMenu, { overlay });
        return;
      }
      index += 1;
      show();
    });
    layer.append(bar);
    next.focus();
  }

  async function start() {
    if (layer || starting || game.state.ending) return;
    starting = true;
    game.clock?.pause('intro'); // at once: no story day passes while the office art's anchors load
    try {
      anchors = await loadAnchors(game.state.era);
    } catch (error) {
      game.clock?.resume('intro');
      throw error;
    } finally {
      starting = false;
    }
    if (game.state.ending || overlay.querySelector(HOLDERS)) { // something took the stage meanwhile: wait for it
      game.clock?.resume('intro');
      startWhenClear();
      return;
    }
    layer = el('<div class="intro-layer" role="dialog" aria-label="Meet your team"></div>');
    overlay.append(layer);
    index = 0;
    document.addEventListener('keydown', onKey, true);
    // The tour ends when the player opens the floor menu on the last stop, as it asks.
    watcher = new MutationObserver(() => {
      if (index === TOUR.length - 1 && overlay.querySelector('.menu-layer')) finish();
    });
    watcher.observe(overlay, { childList: true });
    show();
  }

  // Wait until nothing else holds the stage (a title screen, a dialog), then begin.
  function startWhenClear() {
    if (!overlay.querySelector(HOLDERS)) {
      start().catch((error) => console.error(error));
      return;
    }
    const waiting = new MutationObserver(() => {
      if (overlay.querySelector(HOLDERS)) return;
      waiting.disconnect();
      start().catch((error) => console.error(error));
    });
    waiting.observe(overlay, { childList: true, subtree: true });
  }

  return { start: startWhenClear, finish, get open() { return Boolean(layer); } };
}

// The first "Start a training run" asks for the model family's name before the recipe opens (owner pick N1),
// as Game Dev Tycoon names a game before development starts. Later runs go straight to the recipe.
export function openNaming(game, overlayRoot, { onDone } = {}) {
  const body = el(`<div class="naming-body">
    <label class="naming-label" for="first-model-family">Family name</label>
    <input id="first-model-family" class="naming-input" type="text" autocomplete="off" placeholder="Type a name">
    <div class="naming-preview"></div>
    <div class="dialog-error" role="alert"></div>
  </div>`);
  const input = body.querySelector('input');
  input.maxLength = FAMILY_MAX;
  const preview = body.querySelector('.naming-preview');
  const error = body.querySelector('.dialog-error');
  const refresh = () => {
    const name = cleanFamily(input.value);
    preview.textContent = name ? `The first one will be ${name} 1.` : '';
    error.textContent = '';
  };
  input.addEventListener('input', refresh);
  refresh();

  const opened = openDialog(overlayRoot, {
    title: 'Your first model',
    subtitle: 'Every model you ship will carry this family name',
    body,
    okLabel: 'Plan the run',
    backLabel: 'Back',
    onBack: () => opened.close(),
    onOk() {
      const name = cleanFamily(input.value);
      if (!name) {
        error.textContent = 'Type a family name for your models';
        input.focus();
        return;
      }
      game.state.modelFamily = name; // kept on the state, as the lab name is, until the first release records it
      opened.close();
      onDone?.();
    },
  });
  opened.classList.add('naming-dialog');
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    opened.querySelector('.dialog-ok').click();
  });
  input.focus();
  return opened;
}

// Registered after the recipe's own handler, so the menu's "Start a training run" asks for the name first.
export function mountNaming(game, overlayRoot) {
  return registerMenuHandler('training', () => {
    if (needsFamilyName(game.state)) return openNaming(game, overlayRoot, { onDone: () => openRecipe(game, overlayRoot) });
    return openRecipe(game, overlayRoot);
  });
}
