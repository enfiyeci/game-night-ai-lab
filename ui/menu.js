import { MAX_MOVES } from '../sim/turn.js';
import { inDangerZone } from '../sim/economy.js';
import { TECHNIQUES, techAvailable } from '../sim/techniques.js';
import { openBudget } from './screens/budget.js';

const registeredHandlers = new Map();

const ITEMS = [
  { id: 'budget', label: "Plan this turn's budget", free: true },
  { id: 'training', label: 'Start a training run', unavailable: (state) => state.activeRun && 'a run is already under way' },
  { id: 'release', label: 'Release a model', unavailable: (state) => !state.pendingModel && 'release needs a finished model' },
  { id: 'internal', label: 'Deploy a model internally', unavailable: (state) => state.era < 3 && 'internal deployment opens in era 3' },
  { id: 'constitution', label: 'Amend the constitution' },
  { id: 'meeting', label: 'Take a meeting', unavailable: (state) => !state.meeting && 'no meeting is scheduled' },
  { id: 'company', label: 'Company', free: true, submenu: true },
  { divider: true },
  { id: 'endTurn', label: 'End turn', free: true },
];

const COMPANY_ITEMS = [
  { id: 'deals', label: 'Sign a compute deal' },
  {
    id: 'raise',
    label: 'Raise a round',
    unavailable(state) {
      if (state.era < 2) return 'Funding rounds open in era 2';
      if (state.flags.lastRoundEra === state.era) return 'You already raised a round this era';
      return '';
    },
  },
  {
    id: 'research',
    label: 'Research a technique early',
    unavailable(state) {
      const available = TECHNIQUES.some((technique) => (
        !techAvailable(state, technique.id) && state.era >= technique.era - 1
      ));
      return available ? '' : 'Nothing to research early right now';
    },
  },
  { id: 'emergency', label: 'Emergency options', hidden: (state) => !inDangerZone(state) },
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
  if (!handler && item.id !== 'budget' && item.id !== 'endTurn' && item.id !== 'company') return 'Not built yet';
  return '';
}

function appendDisabledReason(button, reason) {
  button.classList.add('off');
  button.setAttribute('aria-disabled', 'true');
  button.tabIndex = -1;
  button.title = reason;
  const hidden = document.createElement('span');
  hidden.className = 'visually-hidden';
  hidden.textContent = `: ${reason}`;
  button.append(hidden);
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

export function openMenu(game, point, { overlay = document.querySelector('#overlay'), handlers, companyOpen = false } = {}) {
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
  let submenu = null;
  let companyButton = null;
  const close = () => {
    if (closed) return;
    closed = true;
    layer.remove();
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
  };

  function closeCompany({ focusParent = false } = {}) {
    submenu?.remove();
    submenu = null;
    companyButton?.setAttribute('aria-expanded', 'false');
    if (focusParent) companyButton?.focus();
  }

  function openCompany({ focusFirst = true } = {}) {
    if (submenu) {
      if (focusFirst) submenu.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
      return;
    }
    submenu = document.createElement('div');
    submenu.className = 'ctx company-submenu';
    submenu.setAttribute('role', 'menu');
    submenu.setAttribute('aria-label', 'Company actions');
    companyButton.setAttribute('aria-expanded', 'true');

    for (const item of COMPANY_ITEMS) {
      if (item.hidden?.(game.state)) continue;
      const customHandler = handlerFor(item.id, handlers);
      const reason = game.movesLeft() === 0
        ? 'Both moves are used this turn'
        : disabledReason(item, game, customHandler);
      const button = document.createElement('button');
      button.className = 'it';
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      button.dataset.menuId = item.id;
      button.textContent = item.label;
      if (reason) appendDisabledReason(button, reason);
      else {
        button.addEventListener('click', () => {
          close();
          customHandler(game, overlay);
        });
      }
      submenu.append(button);
    }

    layer.append(submenu);
    const menuRect = menu.getBoundingClientRect();
    const companyRect = companyButton.getBoundingClientRect();
    const submenuWidth = submenu.offsetWidth;
    const submenuHeight = submenu.offsetHeight;
    const menuLeft = Number.parseFloat(menu.style.left);
    const menuTop = Number.parseFloat(menu.style.top);
    const opensLeft = menuLeft + menu.offsetWidth + 8 + submenuWidth > 1440 - 12;
    submenu.classList.toggle('opens-left', opensLeft);
    submenu.style.left = `${opensLeft ? menuLeft - submenuWidth - 8 : menuLeft + menu.offsetWidth + 8}px`;
    const companyTop = menuTop + companyRect.top - menuRect.top;
    submenu.style.top = `${Math.max(12, Math.min(900 - submenuHeight - 12, companyTop - 5))}px`;

    submenu.addEventListener('keydown', (event) => {
      const items = [...submenu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
      const current = items.indexOf(document.activeElement);
      let next = current;
      if (items.length === 0 && !['ArrowLeft', 'Escape'].includes(event.key)) return;
      if (event.key === 'ArrowDown') next = (current + 1) % items.length;
      else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeCompany({ focusParent: true });
        return;
      } else if ((event.key === 'Enter' || event.key === ' ') && current >= 0) {
        event.preventDefault();
        event.stopPropagation();
        items[current].click();
        return;
      } else return;
      event.preventDefault();
      event.stopPropagation();
      items[next]?.focus();
    });
    if (focusFirst) submenu.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
  }

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
    if (item.submenu) {
      const label = document.createElement('span');
      label.textContent = item.label;
      const arrow = document.createElement('span');
      arrow.className = 'submenu-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '▸';
      button.append(label, arrow);
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', 'false');
      companyButton = button;
      button.addEventListener('click', () => {
        if (submenu) closeCompany({ focusParent: true });
        else openCompany();
      });
    } else button.textContent = item.label;
    if (reason) {
      appendDisabledReason(button, reason);
    } else if (!item.submenu) {
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

  if (companyOpen) openCompany();

  const enabled = () => [...menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
  menu.addEventListener('keydown', (event) => {
    const items = enabled();
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowRight' && document.activeElement === companyButton) {
      event.preventDefault();
      openCompany();
      return;
    }
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
    if (!menu.contains(event.target) && !submenu?.contains(event.target)) close();
  });
  if (!companyOpen) enabled()[0]?.focus();
  return { element: layer, close };
}
