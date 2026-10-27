// The next run, offered (reward-loops O3, Arda's pick 2026-10-26): when a release reveal closes and the research team
// is free, the Head of Research says the next model is planned, with a button to the recipe (which remembers the last
// plan). When no run fits the free compute, the button goes to the recipe's own fixes instead. It never stops the
// clock, steps aside for anything that takes the stage, and lasts until the round's mark; a click on an advisor ends it
// (ui/screens/briefing.js), and its going lets any warning it held back come up.
import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { nextRunOffer, nextRunOpen } from '../logic/training.js';
import { openRecipe } from './recipe.js';

const STAGE = '.event-layer, .dialog-layer, .menu-layer, .screenwall-layer, .intro-layer, .title-layer';
const COPY = { // OWNER WRITES
  ready: { say: '{name} is planned. Start it?', go: 'Plan {name}' }, // OWNER WRITES
  short: { say: '{name} is planned, but there is not enough free compute for a run. Make room?', go: 'Make room' }, // OWNER WRITES
  later: 'Not now', // OWNER WRITES
};
const fill = (text, name) => text.replaceAll('{name}', name);

export function mountNextRun(game, overlay) {
  const layer = el('<div class="ev-briefing ev-next-run"></div>');
  overlay.append(layer);
  let bubble = null;
  let turn = null; // the round it was offered in
  const drop = () => {
    if (!bubble) return;
    bubble.remove();
    bubble = null;
    overlay.dispatchEvent(new CustomEvent('events-changed')); // briefing warnings held back by it come up
  };
  new MutationObserver(() => { if (bubble && overlay.querySelector(STAGE)) drop(); }).observe(overlay, { childList: true });
  // A run started, the run ended, or the round's mark came.
  game.subscribe(({ state }) => { if (bubble && (!nextRunOpen(state) || state.turn !== turn)) drop(); });
  layer.addEventListener('next-run-drop', drop);

  return {
    offer() {
      drop();
      if (!nextRunOffer(game.state)) return;
      const era = game.state.era;
      loadAnchors(era).then((anchors) => {
        const offer = nextRunOffer(game.state);
        const head = anchors.heads?.research;
        if (!offer || !head || bubble || game.state.era !== era || overlay.querySelector(STAGE)) return;
        const copy = offer.short ? COPY.short : COPY.ready;
        const row = el('<div class="ev-row"><button type="button" class="ev-act"></button><button type="button" class="ev-act ghost"></button></div>');
        const [go, later] = row.querySelectorAll('button');
        go.textContent = fill(copy.go, offer.name);
        later.textContent = COPY.later;
        bubble = bubbleAt(layer, head, { label: ADVISOR_TITLE.research, say: fill(copy.say, offer.name), width: 270, extra: row });
        turn = game.state.turn;
        go.addEventListener('click', () => {
          drop();
          openRecipe(game, overlay);
        });
        later.addEventListener('click', drop);
      }).catch((error) => console.error(error));
    },
  };
}
