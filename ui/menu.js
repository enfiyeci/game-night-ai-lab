import { MAX_MOVES } from '../sim/turn.js';
import { openBudget } from './screens/budget.js';

const registeredHandlers = new Map();

const ITEMS = [
  { id: 'budget', label: "Plan this turn's budget", free: true },
  { id: 'training', label: 'Start a training run', unavailable: (state) => state.activeRun && 'a run is already under way' },
  { id: 'release', label: 'Release a model', unavailable: (state) => !state.pendingModel && 'release needs a finished model' },
  { id: 'internal', label: 'Deploy a model internally', unavailable: (state) => state.era < 3 && 'internal deployment opens in era 3' },
  { id: 'constitution', label: 'Amend the constitution' },
  { id: 'meeting', label: 'Take a meeting', unavailable: (state) => !state.meeting && 'no meeting is scheduled' },
  { divider: true },
  { id: 'endTurn', label: 'End turn', free: true },
];

export function registerMenuHandler(id, fn) {
  if (typeof fn === 'function') registeredHandlers.set(id, fn);
  else registeredHandlers.delete(id);
  return () => registeredHandlers.delete(id);
}

function handlerFor(id, handlers) {
  if (handlers instanceof Map && handlers.has(id)) return handlers.get(id);
  if (handlers && typeof handlers[id] === 'function') return handlers[id];
  return registeredHandlers.get(id);
}

function disabledReason(item, game, handler) {
  const unavailable = item.unavailable?.(game.state);
  if (unavailable) return unavailable;
  if (!item.free && game.movesLeft() === 0) return 'Both moves are used this turn';
  if (!handler && item.id !== 'budget' && item.id !== 'endTurn') return 'Not built yet';
  return '';
}

function markerAt(x, y) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('menu-ping');
  svg.setAttribute('width', '1440');
  svg.setAttribute('height', '900');
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<ellipse cx="${x}" cy="${y}" rx="16" ry="8"></ellipse><ellipse cx="${x}" cy="${y}" rx="7" ry="3.5"></ellipse>`;
  return svg;
}

export function openMenu(game, point, { overlay = document.querySelector('#overlay'), handlers } = {}) {
  if (!overlay || overlay.querySelector('.dialog-layer')) return null;
  overlay.querySelector('.menu-layer')?.remove();

  const x = Number.isFinite(point?.[0]) ? point[0] : 720;
  const y = Number.isFinite(point?.[1]) ? point[1] : 450;
  const previousFocus = document.activeElement;
  const layer = document.createElement('div');
  layer.className = 'menu-layer';
  const menu = document.createElement('div');
  menu.className = 'ctx';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Office actions');

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    layer.remove();
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
  };

  for (const item of ITEMS) {
    if (item.divider) {
      const divider = document.createElement('div');
      divider.className = 'sep';
      divider.setAttribute('role', 'separator');
      menu.append(divider);
      continue;
    }

    const customHandler = handlerFor(item.id, handlers);
    const reason = disabledReason(item, game, customHandler);
    const button = document.createElement('button');
    button.className = 'it';
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.dataset.menuId = item.id;
    button.textContent = item.label;
    if (reason) {
      button.classList.add('off');
      button.setAttribute('aria-disabled', 'true');
      button.tabIndex = -1;
      button.title = reason;
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = `: ${reason}`;
      button.append(hidden);
    } else {
      button.addEventListener('click', () => {
        if (item.id === 'budget') {
          close();
          openBudget(game, overlay);
        } else if (item.id === 'endTurn') {
          game.endTurn();
          close();
        } else {
          close();
          customHandler(game, overlay);
        }
      });
    }
    menu.append(button);
  }

  const used = MAX_MOVES - game.movesLeft();
  const counter = document.createElement('div');
  counter.className = 'menu-moves';
  counter.textContent = `${used} of ${MAX_MOVES} moves used`;
  menu.append(counter);
  layer.append(markerAt(x, y), menu);
  overlay.append(layer);

  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  menu.style.left = `${Math.max(12, Math.min(1440 - menuWidth - 12, x + 8))}px`;
  menu.style.top = `${Math.max(12, Math.min(900 - menuHeight - 12, y + 8))}px`;

  const enabled = () => [...menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
  menu.addEventListener('keydown', (event) => {
    const items = enabled();
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    } else if ((event.key === 'Enter' || event.key === ' ') && current >= 0) {
      event.preventDefault();
      items[current].click();
      return;
    } else return;
    event.preventDefault();
    items[next].focus();
  });
  layer.addEventListener('pointerdown', (event) => {
    if (!menu.contains(event.target)) close();
  });
  enabled()[0]?.focus();
  return { element: layer, close };
}
