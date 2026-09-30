import { MAX_MOVES } from '../sim/turn.js';
import { EMERGENCY_OPTIONS, inDangerZone } from '../sim/economy.js';
import { TECHNIQUES, techAvailable } from '../sim/techniques.js';
import { TEAM_OF, TEAMS, busySubject, teamBusyError } from '../sim/teams.js';
import { roundWord, nextRoundDay, storyDate } from '../sim/time.js';
import { projectQueue } from './logic/compute.js';
import { openBudget } from './screens/budget.js';
import { enterTransition, exitTransition } from './components/transition.js';

const registeredHandlers = new Map();

const releaseQueued = (game) => game.queue.moves.some((move) => move.type === 'release');

const MOVE_TYPE = {
  training: 'startRun',
  release: 'release',
  meeting: 'meeting',
  summit: 'summit',
  deals: 'deal',
  power: 'buildSite',
  raise: 'raise',
  research: 'research',
  emergency: 'emergency',
};

const sentenceCase = (text) => text ? `${text[0].toUpperCase()}${text.slice(1)}` : '';

export const ITEMS = [
  { id: 'budget', label: 'Plan the budget', free: true },
  { id: 'training', label: 'Start a training run', unavailable: (state, game) => (game.queue.moves.some((move) => move.type === 'startRun') && `A training run already started this ${roundWord(state.era)}`) || (state.activeRun && 'A run is already under way') || (state.pendingModel && 'Release the trained model first') },
  { id: 'release', label: 'Release a model', editsQueued: (game) => releaseQueued(game), unavailable: (state, game) => !releaseQueued(game) && !state.pendingModel && 'Release needs a finished model' },
  { id: 'automation', label: 'Who does the work', free: true },
  {
    id: 'meeting',
    label: 'Take a meeting',
    unavailable: (_state, game) => !game.state.meeting && 'No meeting is scheduled',
  },
  {
    id: 'summit',
    label: 'Go to the Geneva summit',
    hidden: (state) => !(state.era === 5 && state.turnInEra === 0 && !state.deal),
    unavailable: (_state, game) => game.state.meeting && 'Take the President’s call first', // live: the projection expires an untaken call
  },
  { id: 'company', label: 'Company', free: true, submenu: 'company' },
  { id: 'history', label: 'Lab history', free: true, unavailable: (_state, game) => game.state.models.length === 0 && 'Nothing released yet' },
  { divider: true },
  { id: 'game', label: 'Game', free: true, submenu: 'game' }, // owner pick 3B: things about the game, not the lab
];

export const COMPANY_ITEMS = [
  { id: 'tour', label: 'Tour the lab', free: true },
  { id: 'finance', label: 'Plan the years ahead', free: true },
  { id: 'board', label: 'The board', free: true },
  { id: 'deals', label: 'Sign a compute deal' },
  { id: 'power', label: 'Power sites', hidden: (state) => state.era !== 4 },
  {
    id: 'raise',
    label: 'Raise a round',
    unavailable(state, game) {
      const queued = game.queue.moves.some((move) => move.type === 'raise')
        && game.state.flags.lastRoundEra !== game.state.era
        && state.flags.lastRoundEra === state.era;
      if (queued) return `A round already started this ${roundWord(state.era)}`;
      if (state.era < 2) return 'Investors are not ready yet';
      if (state.flags.lastRoundEra === state.era) return 'You already raised a round this era';
      return '';
    },
  },
  {
    id: 'research',
    label: 'Research a technique early',
    unavailable(state, game) {
      const available = TECHNIQUES.filter((technique) => (
        !techAvailable(state, technique.id) && state.era >= technique.era - 1
      ));
      const queued = new Set(game.queue.moves
        .filter((move) => move.type === 'research')
        .map((move) => move.techId));
      const beforeQueue = TECHNIQUES.filter((technique) => (
        !techAvailable(game.state, technique.id) && game.state.era >= technique.era - 1
      ));
      if (available.some((technique) => state.researchPoints >= technique.researchCost)) return '';
      if (beforeQueue.length > 0 && beforeQueue.every((technique) => queued.has(technique.id))) {
        return `Every available technique already started this ${roundWord(state.era)}`;
      }
      if (available.length > 0) return 'Not enough research points';
      return 'Nothing to research early right now';
    },
  },
  {
    id: 'emergency',
    label: 'Emergency options',
    hidden: (state, game) => !inDangerZone(state) && !inDangerZone(game.state),
    unavailable(state, game) {
      if (inDangerZone(game.state) && !inDangerZone(state)) {
        return 'A queued move already covers the shortfall';
      }
      if (!inDangerZone(state)) return 'Emergency options open only when runway is short';
      const used = new Set(state.flags.emergencyUsed ?? []);
      const available = Object.keys(EMERGENCY_OPTIONS).filter((option) => !used.has(option));
      const queued = new Set(game.queue.moves
        .filter((move) => move.type === 'emergency')
        .map((move) => move.option));
      return available.length > 0 && available.every((option) => queued.has(option))
        ? `Every unused emergency option already started this ${roundWord(state.era)}` : '';
    },
  },
];

export const GAME_ITEMS = [
  {
    id: 'endings',
    label: 'Endings found',
    free: true,
    note(game) {
      const progress = game.collection?.progress();
      return progress ? `${progress.found} of ${progress.total}` : '';
    },
  },
  { id: 'howto', label: 'How to play', free: true }, // replays the first-minute tour (ui/screens/intro.js)
  { id: 'sound', label: 'Sound and music', free: true },
  { id: 'credits', label: 'Credits', free: true },
];

const SUBMENUS = { company: COMPANY_ITEMS, game: GAME_ITEMS };

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

export function disabledReason(item, game, handler, state = game.state) {
  if (!item.free && state.ending) return 'A queued move ends the run';
  const busy = MOVE_TYPE[item.id] && teamBusyError(game.state, { type: MOVE_TYPE[item.id] });
  if (busy) return sentenceCase(busy);
  const unavailable = item.unavailable?.(state, game);
  if (unavailable) return unavailable;
  if (!item.free && game.movesLeft() === 0 && !item.editsQueued?.(game)) return `Both team actions are used this ${roundWord(state.era)}`;
  if (!handler && item.id !== 'budget' && !item.submenu) return 'Not built yet';
  return '';
}

function appendTeamTag(button, item, game) {
  const type = MOVE_TYPE[item.id];
  const team = TEAM_OF[type];
  if (!team) return;
  const busy = teamBusyError(game.state, { type });
  const busyPrefix = `${busySubject(team)} `;
  const status = busy?.startsWith(busyPrefix) ? busy.slice(busyPrefix.length) : busy;
  const tag = document.createElement('span');
  tag.className = `team${busy ? ' busy' : ''}`;
  tag.textContent = `${sentenceCase(TEAMS[team])} · ${status ?? 'free'}`;
  button.append(tag);
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
  let submenu = null; // the one open submenu (Company or Game)
  let submenuButton = null; // the main-menu button that opened it
  const submenuButtons = new Map(); // submenu id -> its main-menu button
  // `picked` says a screen is about to open, so a decision card that stepped aside waits for that screen instead.
  const close = ({ picked = false } = {}) => {
    if (closed) return;
    closed = true;
    exitTransition(layer).then(() => {
      if (!picked && previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
      overlay.dispatchEvent(new CustomEvent('gdt-menu-closed', { detail: { picked } }));
    });
  };

  const focusFirstIn = (list) => {
    const first = list.querySelector('[role="menuitem"]:not([aria-disabled="true"])')
      ?? list.querySelector('[role="menuitem"]');
    first?.focus();
  };

  function closeSubmenu({ focusParent = false } = {}) {
    submenu?.remove();
    submenu = null;
    submenuButton?.setAttribute('aria-expanded', 'false');
    if (focusParent) submenuButton?.focus();
    submenuButton = null;
  }

  function openSubmenu(parent, { focusFirst = true } = {}) {
    const button = submenuButtons.get(parent.submenu);
    if (submenu && submenuButton === button) {
      if (focusFirst) focusFirstIn(submenu);
      return;
    }
    closeSubmenu();
    submenu = document.createElement('div');
    submenu.className = `ctx submenu ${parent.submenu}-submenu`;
    submenu.setAttribute('role', 'menu');
    submenu.setAttribute('aria-label', `${parent.label} actions`);
    submenuButton = button;
    button.setAttribute('aria-expanded', 'true');
    const projected = projectQueue(game.state, game.queue);

    for (const item of SUBMENUS[parent.submenu]) {
      if (item.hidden?.(projected, game)) continue;
      const customHandler = handlerFor(item.id, handlers);
      const reason = !item.free && game.movesLeft() === 0
        ? `Both team actions are used this ${roundWord(game.state.era)}`
        : disabledReason(item, game, customHandler, projected);
      const entry = document.createElement('button');
      entry.className = 'it';
      entry.type = 'button';
      entry.setAttribute('role', 'menuitem');
      entry.dataset.menuId = item.id;
      entry.textContent = item.label;
      const note = item.note?.(game);
      if (note) {
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = note;
        entry.append(count);
      }
      appendTeamTag(entry, item, game);
      if (reason) appendDisabledReason(entry, reason);
      else {
        entry.addEventListener('click', () => {
          close({ picked: true });
          customHandler(game, overlay);
        });
      }
      submenu.append(entry);
    }

    layer.append(submenu);
    const menuRect = menu.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const submenuWidth = submenu.offsetWidth;
    const submenuHeight = submenu.offsetHeight;
    const menuLeft = Number.parseFloat(menu.style.left);
    const menuTop = Number.parseFloat(menu.style.top);
    const opensLeft = menuLeft + menu.offsetWidth + 8 + submenuWidth > 1440 - 12;
    submenu.classList.toggle('opens-left', opensLeft);
    submenu.style.left = `${opensLeft ? menuLeft - submenuWidth - 8 : menuLeft + menu.offsetWidth + 8}px`;
    const zoom = menuRect.height / menu.offsetHeight || 1; // the stage may be scaled to fit the window
    const buttonTop = menuTop + (buttonRect.top - menuRect.top) / zoom;
    const submenuTop = Math.max(12, Math.min(900 - submenuHeight - 12, buttonTop - 5));
    submenu.style.top = `${submenuTop}px`;
    // The pointer stays level with its button when the submenu is pushed up to fit the screen.
    const tail = buttonTop + buttonRect.height / zoom / 2 - submenuTop - 6;
    submenu.style.setProperty('--tail-top', `${Math.max(8, Math.min(submenuHeight - 20, tail))}px`);

    submenu.addEventListener('keydown', (event) => {
      const items = [...submenu.querySelectorAll('[role="menuitem"]')];
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
        closeSubmenu({ focusParent: true });
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
    if (focusFirst) focusFirstIn(submenu);
  }

  const projected = projectQueue(game.state, game.queue);
  for (const item of ITEMS) {
    if (item.hidden?.(projected, game)) continue;
    if (item.divider) {
      const divider = document.createElement('div');
      divider.className = 'sep';
      divider.setAttribute('role', 'separator');
      menu.append(divider);
      continue;
    }

    const customHandler = handlerFor(item.id, handlers);
    const reason = disabledReason(item, game, customHandler, projected);
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
      submenuButtons.set(item.submenu, button);
      button.addEventListener('click', () => {
        if (submenuButton === button) closeSubmenu({ focusParent: true });
        else openSubmenu(item);
      });
    } else button.textContent = item.label;
    appendTeamTag(button, item, game);
    if (reason) {
      appendDisabledReason(button, reason);
    } else if (!item.submenu) {
      button.addEventListener('click', () => {
        close({ picked: true });
        if (item.id === 'budget') openBudget(game, overlay);
        else customHandler(game, overlay);
      });
    }
    menu.append(button);
  }

  const used = MAX_MOVES - game.movesLeft();
  const counter = document.createElement('div');
  counter.className = 'menu-moves';
  counter.textContent = `${used} of ${MAX_MOVES} team actions this ${roundWord(game.state.era)}`;
  menu.append(counter);
  const help = document.createElement('div');
  help.className = 'menu-action-help';
  help.textContent = `Two actions total; one per team. Resets ${storyDate(nextRoundDay(game.state)).label}. Research stays busy while training. Budget, planning and card responses use no team action.`;
  menu.append(help);
  layer.append(markerAt(x, y), menu);
  overlay.append(layer);
  enterTransition(layer);

  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  menu.style.left = `${Math.max(12, Math.min(1440 - menuWidth - 12, x + 8))}px`;
  menu.style.top = `${Math.max(12, Math.min(900 - menuHeight - 12, y + 8))}px`;

  if (companyOpen) openSubmenu(ITEMS.find((item) => item.submenu === 'company'));

  const menuItems = () => [...menu.querySelectorAll('[role="menuitem"]')];
  menu.addEventListener('keydown', (event) => {
    const items = menuItems();
    const current = items.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key === 'ArrowRight' && [...submenuButtons.values()].includes(document.activeElement)) {
      event.preventDefault();
      openSubmenu(ITEMS.find((item) => submenuButtons.get(item.submenu) === document.activeElement));
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
  if (!companyOpen) focusFirstIn(menu);
  return { element: layer, close: () => close() };
}
