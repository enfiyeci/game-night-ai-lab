import { ERAS } from '../../sim/data/eras.js';
import { screenWallView } from '../logic/automation.js';
import { hasLanded, queueAnswer } from '../logic/events.js';

const W = 900;
const H = 290;
const PAD = { left: 50, right: 150, top: 20, bottom: 36 };
const TOTAL_TURNS = ERAS.reduce((sum, era) => sum + era.turns, 0);
const DETAIL = { lockDown: 'Hand choosing back to people', screenOff: 'Keep going quietly' };

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function chart(view) {
  const x = (turn) => PAD.left + (turn / (TOTAL_TURNS - 1)) * (W - PAD.left - PAD.right);
  const y = (speed) => H - PAD.bottom - ((speed - 1) / (view.top - 1)) * (H - PAD.top - PAD.bottom);
  const path = (key) => view.points.map((point, index) => `${index ? 'L' : 'M'}${x(point.turn).toFixed(1)},${y(point[key]).toFixed(1)}`).join(' ');
  let grid = '';
  for (let speed = 1; speed <= view.top; speed += 1) {
    grid += `<text x="${PAD.left - 12}" y="${y(speed) + 4}" class="screenwall-axis" text-anchor="end">×${speed}</text>`;
  }
  let turn = 0;
  for (const era of ERAS) {
    grid += `<line x1="${x(turn)}" y1="${PAD.top}" x2="${x(turn)}" y2="${H - PAD.bottom}" class="screenwall-grid"/>
      <text x="${x(turn) + 6}" y="${H - 12}" class="screenwall-axis">Era ${era.id}</text>`;
    turn += era.turns;
  }
  const latest = view.latest;
  // Late in the run the labels would run past the right edge, so they flip to the left of the latest point.
  const flip = latest && x(latest.turn) > 600;
  const labelAt = (gap) => (flip ? `x="${x(latest.turn) - 12}" text-anchor="end"` : `x="${x(latest.turn) + gap}"`);
  // Measured sits off the x2 line: below it on the right, above it on the left, where the rising line comes in below.
  const measuredY = latest && (flip ? Math.min(y(latest.speed), y(view.line)) - 14 : Math.max(y(latest.speed), y(view.line)) + 22);
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Research speed over the run against our own line">
    ${grid}
    <line x1="${PAD.left}" y1="${y(view.line)}" x2="${W - 20}" y2="${y(view.line)}" class="screenwall-line"/>
    <text x="${PAD.left + 10}" y="${y(view.line) - 8}" class="screenwall-line-label">×${view.line} · our own line</text>
    <path d="${path('claimed')}" class="screenwall-claimed"/>
    <path d="${path('speed')}" class="screenwall-measured"/>
    ${latest ? `<text ${labelAt(10)} y="${y(latest.claimed) + 4}" class="screenwall-claim-label">Head of Research says ×${latest.claimed.toFixed(1)}</text>
    <circle cx="${x(latest.turn)}" cy="${y(latest.speed)}" r="7" class="screenwall-dot"/>
    <text ${labelAt(12)} y="${measuredY}" class="screenwall-measured-label">Measured ×${latest.speed.toFixed(1)}</text>` : ''}
  </svg>`;
  const holder = element('div', 'screenwall-chart');
  holder.innerHTML = svg;
  return holder;
}

function openScreenWall(game, overlayRoot, pending) {
  const view = screenWallView(game.state);
  const layer = element('div', 'screenwall-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', pending.title);
  const panel = element('section', 'screenwall');
  const bar = element('div', 'screenwall-bar');
  bar.append(element('span', '', 'Research speed · screen wall'), element('b', 'screenwall-live', 'Live'));
  const choices = element('div', 'screenwall-choices');
  for (const choice of pending.choices) {
    const button = element('button', 'screenwall-choice');
    button.type = 'button';
    button.append(element('b', '', choice.label), element('small', '', DETAIL[choice.id] ?? `Amend the policy to ×${view.line + 1}`));
    button.addEventListener('click', () => {
      layer.remove();
      game.clock?.resume('screenwall');
      queueAnswer(game, pending.id, choice.id);
      // After the answer, so this wall's own check sees it answered; cards and warnings that waited now open.
      overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    });
    choices.append(button);
  }
  panel.append(bar, element('h2', '', pending.title), chart(view), choices);
  layer.append(element('div', 'dialog-veil'), panel);
  // aria-modal: Tab and Shift+Tab wrap across the three choices instead of leaving the wall.
  layer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const buttons = [...choices.querySelectorAll('button')];
    const at = buttons.indexOf(document.activeElement);
    const next = at === -1 ? 0 : (at + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  });
  overlayRoot.append(layer);
  game.clock?.pause('screenwall'); // the clock only watches .dialog-layer and .menu-layer by itself
  choices.querySelector('button')?.focus();
}

// Opens when the x2 card has landed and nothing else is on screen; the answer applies at once.
export function mountScreenWall(game, overlayRoot) {
  const check = () => {
    if (game.state.ending) return; // a finished run takes no more choices
    const pending = game.state.pendingEvents.find((card) => card.id === 'ownLine' && hasLanded(card, game.state));
    if (!pending || Object.hasOwn(game.queue.eventChoices ?? {}, pending.id)) return;
    if (overlayRoot.querySelector('.dialog-layer, .screenwall-layer')) return;
    openScreenWall(game, overlayRoot, pending);
  };
  overlayRoot.addEventListener('gdt-dialog-closed', check);
  check();
  return game.subscribe(check);
}
