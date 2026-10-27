// The phone and iPhone Duo layout (owner picks 2026-10-26: 1-A two halves sideways, 2-N1 tap the floor, 3-H1 the
// Game Dev Tycoon top strip, 4-S1 builders on both halves, 5-T2 type 15/13/12; pick page
// https://claude.ai/artifact/PEfEyGp2MTWqf1brmadFS3). The desktop build keeps its 1440 x 900 stage scaled to fit.
//
// On a phone the stage and the overlay stay 1440 x 900 at the window's corner, unscaled, and the HUD takes the window.
// Three transforms, set as CSS variables on <html> (ui/phone.css): --world fits the era's room into the office half
// (the office, its fx and anything drawn in room coordinates); --legacy scales a screen not yet redesigned as one
// 1440 x 900 picture, as the desktop zoom did; --world-inv undoes --world, so a panel inside a room-coordinate layer
// (the event card, the floor menu) lands on the decision half in window points. Each overlay child turns about the
// overlay's corner, not its own (--ox and --oy, measured from where it sits), so a child placed at a point in room or
// stage coordinates lands where that point lands. Children are never moved: several screens bench their siblings
// (ui/screens/end.js, boardMeeting.js, title.js) and one looks for `:scope > .menu-layer` (training.js).
// When nothing waits the office fills the screen; a panel opening moves it to the left half (to the top half when the
// window is taller than wide, as on the opened Duo held upright). On the opened Duo the halves meet at the hinge.

const params = new URLSearchParams(location.search);
const FORCED = params.get('layout'); // debug: ?layout=phone or ?layout=desktop
// debug: ?insets=l,t,r,b in points stands in for a phone's safe area in a desktop browser (iPhone sideways: 62,0,62,21)
const FAKE_INSETS = params.get('insets')?.split(',').map(Number);

// Panels that take the decision half. Each sits inside a layer drawn in room coordinates.
export const PANELS = '.event-layer > .ev-card, .menu-layer > .ctx';
// Layers drawn in room coordinates (ui/phone.css lists the same ones); any other full-frame overlay layer is a screen
// not yet redesigned, shown as the scaled desktop picture.
const ROOM_LAYERS = '.event-layer, .menu-layer, .ev-briefing, .bd-say, .ev-phone-button, .polish-layer, .ready-note, .floor-hint, .dl-bubbles, .racks-panel, .racks-safety';
const NOTICE = '#stage > .cash-warning.pn-expanded:not([hidden])'; // the cash notice, opened from its chip
const FALLBACK_ROOM = { x: 170, y: 80, width: 1100, height: 815 }; // era 3's room, measured 2026-10-26
const HUD_STRIP = 56; // the top strip's height when the office has the whole width
const HUD_HALF = 104; // two rows when the office has half the width
const HUD_COLUMN = 190; // the strip's right column (date, money, buttons) keeps this much width clear
const NEXT_SPEED = { 0: 1, 1: 2, 2: 4, 4: 1 };

export function phoneMode() {
  if (FORCED) return FORCED === 'phone';
  const coarse = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse && !(innerWidth >= 1100 && innerHeight >= 700);
}

let cachedInsets = null; // measured on resize and fold changes only: the probe forces a layout
function insets() {
  if (cachedInsets) return cachedInsets;
  cachedInsets = measureInsets();
  return cachedInsets;
}

function measureInsets() {
  if (FAKE_INSETS?.length === 4 && FAKE_INSETS.every(Number.isFinite)) {
    const [l, t, r, b] = FAKE_INSETS;
    return { l, t, r, b };
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;top:env(safe-area-inset-top,0px);left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);bottom:env(safe-area-inset-bottom,0px)';
  document.body.append(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  return { l: box.left, t: box.top, r: innerWidth - box.right, b: innerHeight - box.bottom };
}

// The native shell reports the crease of a half-folded Duo (ios-shell contract, 2026-10-26).
function fold() {
  const style = getComputedStyle(document.documentElement);
  const read = (name) => Number.parseFloat(style.getPropertyValue(name)) || 0;
  return { x: read('--native-fold-x'), width: read('--native-fold-width'), y: read('--native-fold-y'), height: read('--native-fold-height') };
}

// The room's drawing in stage coordinates; the office layer is 1440 x 900 with the room inside it.
function roomBox() {
  const svg = document.querySelector('#office .office-room-current, #office svg.room');
  try {
    const box = svg?.getBBox?.();
    if (box && box.width > 200 && box.height > 200) return box;
  } catch { /* not rendered yet */ }
  return FALLBACK_ROOM;
}

const px = (value) => `${Math.round(value * 100) / 100}px`;

// A screen not yet redesigned is up: a dialog, or any other full-frame layer that is not drawn in room coordinates.
function legacyOpen() {
  for (const node of document.querySelector('#overlay')?.children ?? []) {
    // A layer that lets taps through (the tour's last stop, which asks for a tap on the floor) does not count.
    if (node.hidden || node.matches(ROOM_LAYERS) || getComputedStyle(node).pointerEvents === 'none') continue;
    if (node.matches('.dialog-layer, .ev-phone') || (node.offsetWidth >= 1440 && node.offsetHeight >= 900)) return true;
  }
  return false;
}

export function mountPhone(game) {
  const root = document.documentElement;
  const overlay = document.querySelector('#overlay');
  const office = document.querySelector('#office');
  const hud = document.querySelector('#hud');
  let on = false;

  function layout() {
    on = phoneMode();
    root.classList.toggle('phone', on);
    if (!on) return;
    const W = innerWidth;
    const H = innerHeight;
    if (!W || !H) return;
    const ins = insets();
    const wide = W >= H;
    const card = Boolean(overlay?.querySelector(PANELS));
    const legacy = legacyOpen();
    const open = card || (!legacy && Boolean(document.querySelector(NOTICE))); // a legacy screen hides the notice
    root.classList.toggle('pn-open', open);
    root.classList.toggle('pn-card', card);
    root.classList.toggle('pn-tall', !wide);
    root.classList.toggle('pn-legacy', legacy);

    // The halves meet at the window's middle, or at the crease of a half-folded Duo: the office ends where the crease
    // starts and the decision half begins where it ends, so nothing sits on the fold.
    const crease = fold();
    const vertical = crease.width > 0 && crease.x > 0 && crease.x + crease.width < W;
    const horizontal = crease.height > 0 && crease.y > 0 && crease.y + crease.height < H;
    const officeEndX = vertical ? crease.x : W / 2;
    const panelX = vertical ? crease.x + crease.width : W / 2;
    const officeEndY = horizontal ? crease.y : H / 2;
    const panelY = horizontal ? crease.y + crease.height : H / 2;
    // The decision half is measured whether or not a panel is up, so a panel never draws a frame without its place.
    const panel = wide ? { x: panelX, y: 0, w: W - panelX, h: H } : { x: 0, y: panelY, w: W, h: H - panelY };
    let area;
    if (!open) area = { x: ins.l + 8, y: ins.t + HUD_STRIP, w: W - ins.l - ins.r - 16 - (wide ? HUD_COLUMN : 0), h: H - ins.t - HUD_STRIP - ins.b - 6 };
    else if (wide) area = { x: ins.l + 6, y: ins.t + HUD_HALF, w: officeEndX - ins.l - 12, h: H - ins.t - HUD_HALF - ins.b - 6 };
    else area = { x: ins.l + 8, y: ins.t + HUD_HALF, w: W - ins.l - ins.r - 16, h: officeEndY - ins.t - HUD_HALF - 8 };
    if (area.w <= 0 || area.h <= 0) return; // a window too small to hold the room (a keyboard up): keep the last layout

    const room = roomBox();
    const k = Math.min(area.w / room.width, area.h / room.height);
    const tx = area.x + (area.w - room.width * k) / 2 - room.x * k;
    const ty = area.y + (area.h - room.height * k) / 2 - room.y * k;
    const lk = Math.min(W / 1440, H / 900);
    const set = (name, value) => root.style.setProperty(name, value);
    set('--world', `translate(${px(tx)}, ${px(ty)}) scale(${k.toFixed(5)})`);
    set('--world-inv', `scale(${(1 / k).toFixed(5)}) translate(${px(-tx)}, ${px(-ty)})`);
    set('--world-k', k.toFixed(5));
    // Speech bubbles and small buttons drawn in the room keep a readable size whatever the room's scale.
    set('--world-read', Math.min(1 / k, 3.2).toFixed(4));
    set('--legacy', `translate(${px((W - 1440 * lk) / 2)}, ${px((H - 900 * lk) / 2)}) scale(${lk.toFixed(5)})`);
    for (const [name, value] of Object.entries(ins)) set(`--ins-${name}`, px(value));
    set('--vw', px(W));
    set('--vh', px(H));
    for (const [name, value] of Object.entries(panel)) set(`--pnl-${name}`, px(value));
    set('--split-x', px(wide ? officeEndX : W));
    set('--split-y', px(open && !wide ? officeEndY : H));
  }

  // Phone-only controls on the HUD: the menu button (it taps the floor, so the office's own checks decide), the speed
  // button that steps x1 → x2 → x4, and the money box opening Money as the desktop's Money button does.
  const view = hud?.querySelector('.hud-view');
  if (view && !view.querySelector('.pn-menu')) {
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'pn-menu';
    menuButton.setAttribute('aria-label', 'Lab menu');
    menuButton.innerHTML = '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><rect x="2" y="3" width="14" height="2.4" rx="1.2"/><rect x="2" y="8" width="14" height="2.4" rx="1.2"/><rect x="2" y="13" width="14" height="2.4" rx="1.2"/></svg>';
    menuButton.addEventListener('click', () => {
      office?.querySelector('#floor')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    view.prepend(menuButton);
  }
  hud?.addEventListener('click', (event) => {
    if (!on) return;
    // A screen not yet redesigned covers only its scaled picture; the HUD beside it must not act, as on desktop
    // where the screen covers it. With the floor menu up the HUD waits too (the menu button is hidden then).
    if (legacyOpen() || overlay.querySelector('.menu-layer > .ctx')) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    const speed = event.target.closest?.('.clock button[data-speed]');
    if (speed && speed.dataset.speed !== '0') {
      event.stopPropagation();
      game.clock?.setSpeed(NEXT_SPEED[game.clock.now().speed] ?? 1);
      return;
    }
    if (event.target.closest?.('.hud-right .info')) {
      event.stopPropagation();
      hud.querySelector('[data-open="money"]')?.click();
    }
  }, true);

  // A tap on the floor leaves a ring where it landed, as the desktop menu's ping does (that one is drawn at the click).
  office?.addEventListener('click', (event) => {
    if (!on || !event.isTrusted || !event.target.closest?.('#floor')) return;
    const ring = document.createElement('div');
    ring.className = 'pn-ripple';
    ring.style.left = px(event.clientX);
    ring.style.top = px(event.clientY);
    hud.append(ring);
    setTimeout(() => ring.remove(), 600);
  });

  // The cash notice folds to a chip; a tap on the chip opens it on the decision half, Hide or any of its buttons folds it.
  function wireNotice() {
    const notice = document.querySelector('#stage > .cash-warning');
    if (!notice || notice.querySelector('.pn-hide')) return;
    const hide = document.createElement('button');
    hide.type = 'button';
    hide.className = 'pn-hide';
    hide.textContent = 'Hide';
    notice.append(hide);
    const open = () => {
      notice.classList.add('pn-expanded');
      relayout();
    };
    notice.addEventListener('click', (event) => {
      if (!on) return;
      if (!notice.classList.contains('pn-expanded')) {
        event.stopPropagation();
        open();
      } else if (event.target.closest('button')) {
        notice.classList.remove('pn-expanded');
        relayout();
      }
    }, true);
    notice.addEventListener('keydown', (event) => {
      if (!on || notice.classList.contains('pn-expanded') || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      open();
    });
    new MutationObserver(relayout).observe(notice, { attributes: true, attributeFilter: ['hidden'], subtree: true });
  }

  // The folded chip is a button; a checkpoint that waits on "Continue — I understand" opens the notice by itself,
  // since its only way on is inside it. A notice that goes away folds back.
  function syncNotice() {
    const notice = document.querySelector('#stage > .cash-warning');
    if (!notice) return;
    const waits = !notice.hidden && [...notice.querySelectorAll('.cash-warning-actions button')]
      .some((button) => !button.hidden && /understand/i.test(button.textContent)); // "Continue — I understand"
    if (notice.hidden) notice.classList.remove('pn-expanded');
    else if (waits) notice.classList.add('pn-expanded');
    notice.querySelector('.pn-hide')?.toggleAttribute('hidden', waits); // a checkpoint cannot be hidden, only answered
    const folded = on && !notice.hidden && !notice.classList.contains('pn-expanded');
    if (folded) {
      notice.setAttribute('role', 'button');
      notice.tabIndex = 0;
      notice.setAttribute('aria-expanded', 'false');
    } else {
      notice.removeAttribute('role');
      notice.removeAttribute('tabindex');
      notice.removeAttribute('aria-expanded');
    }
  }

  // Labels that say what the phone controls now do; the desktop's labels come back when a tablet turns to desktop.
  function labelControls() {
    for (const button of hud.querySelectorAll('.clock button[data-speed]:not([data-speed="0"])')) {
      const label = on ? 'Next speed' : `Speed ${button.dataset.speed}`;
      if (button.getAttribute('aria-label') !== label) button.setAttribute('aria-label', label);
    }
    const info = hud.querySelector('.hud-right .info');
    if (!info) return;
    if (on && info.getAttribute('aria-label') !== 'Money: open the Money screen') {
      info.setAttribute('aria-label', 'Money: open the Money screen');
      info.removeAttribute('aria-controls');
    } else if (!on && info.hasAttribute('aria-label')) {
      info.removeAttribute('aria-label');
      info.setAttribute('aria-controls', 'lab-stats');
    }
  }

  // An event card's advisors argue over their desks on desktop; on a phone their lines join the card.
  function copySays(card) {
    if (card.querySelector('.pn-says')) return;
    const bubbles = [...card.parentElement.querySelectorAll(':scope > .ev-bubble')];
    if (!bubbles.length) return;
    const list = document.createElement('div');
    list.className = 'pn-says';
    for (const bubble of bubbles) {
      const item = document.createElement('div');
      item.className = 'pn-say';
      const who = document.createElement('b');
      who.textContent = bubble.querySelector('b')?.textContent ?? '';
      const say = document.createElement('span');
      say.textContent = bubble.querySelector('.ev-say')?.textContent ?? '';
      item.append(who, say);
      const pick = bubble.querySelector('.ev-pick')?.textContent;
      if (pick) {
        const chip = document.createElement('i');
        chip.textContent = pick;
        item.append(chip);
      }
      list.append(item);
    }
    card.querySelector('.ev-choices')?.after(list);
  }

  // A submenu (Company, Game) covers the menu on a phone; a Back row returns to it, as the arrow key does on desktop.
  function addBack(submenu) {
    if (submenu.querySelector('.pn-back')) return;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'pn-back';
    back.setAttribute('role', 'menuitem');
    back.textContent = 'Back';
    back.addEventListener('click', () => submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
    submenu.prepend(back);
  }

  // The overlay's and the stage's own children turn about the 1440 x 900 frame's corner.
  const CORE = new Set(['office', 'fx', 'hud', 'overlay', 'training-fx', 'polish-fx']);
  function pivot(node) {
    const ox = px(-node.offsetLeft);
    const oy = px(-node.offsetTop);
    if (node.style.getPropertyValue('--ox') !== ox) node.style.setProperty('--ox', ox);
    if (node.style.getPropertyValue('--oy') !== oy) node.style.setProperty('--oy', oy);
  }
  function pivots() {
    for (const node of overlay.children) pivot(node);
    for (const node of document.querySelector('#stage')?.children ?? []) if (!CORE.has(node.id)) pivot(node);
  }

  // Room speech bubbles are drawn at a readable size, so they can outgrow the office area; nudge each back inside it
  // (in room units, before the bubble's own scale).
  function keepBubblesIn() {
    const k = Number.parseFloat(root.style.getPropertyValue('--world-k')) || 1;
    const ins = insets();
    const open = root.classList.contains('pn-open');
    const tall = root.classList.contains('pn-tall');
    const top = ins.t + (open ? HUD_HALF : HUD_STRIP);
    const right = open && !tall ? Number.parseFloat(root.style.getPropertyValue('--split-x')) - 6
      : innerWidth - ins.r - 6 - (!open && !tall ? HUD_COLUMN : 0);
    const left = ins.l + 6;
    for (const bubble of overlay.querySelectorAll('.ev-briefing .ev-bubble')) {
      const dx0 = Number.parseFloat(bubble.style.getPropertyValue('--pn-dx')) || 0;
      const dy0 = Number.parseFloat(bubble.style.getPropertyValue('--pn-dy')) || 0;
      const box = bubble.getBoundingClientRect();
      const base = { left: box.left - dx0 * k, right: box.right - dx0 * k, top: box.top - dy0 * k };
      let dx = 0;
      if (base.right > right) dx = right - base.right;
      if (base.left + dx < left) dx = left - base.left;
      const dy = Math.max(0, top - base.top);
      if (bubble.style.getPropertyValue('--pn-dx') !== px(dx / k)) bubble.style.setProperty('--pn-dx', px(dx / k));
      if (bubble.style.getPropertyValue('--pn-dy') !== px(dy / k)) bubble.style.setProperty('--pn-dy', px(dy / k));
    }
  }

  let queued = false;
  const relayout = () => {
    if (queued) return;
    queued = true;
    setTimeout(() => { // a timer, not a frame: a background tab never runs frames, and the layout must still follow
      queued = false;
      layout();
      labelControls();
      if (!on) return;
      pivots();
      wireNotice();
      syncNotice();
      keepBubblesIn();
      for (const card of overlay.querySelectorAll('.event-layer > .ev-card')) copySays(card);
      for (const submenu of overlay.querySelectorAll('.menu-layer > .ctx.submenu')) addBack(submenu);
    }, 0);
  };
  // Only what can move the layout: overlay children coming and going (a panel inside a layer included) and a direct
  // child's own position or visibility. Daily redraws deep inside layers (bubbles, tweens) are skipped.
  new MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList' || record.target.parentElement === overlay)) relayout();
  }).observe(overlay, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  new MutationObserver(relayout).observe(document.querySelector('#stage'), { childList: true });
  if (office) new MutationObserver(relayout).observe(office, { childList: true });
  const remeasure = () => {
    cachedInsets = null;
    relayout();
  };
  addEventListener('resize', remeasure);
  addEventListener('orientationchange', remeasure);
  addEventListener('native-layout', remeasure);
  // A bubble measured mid-slide is measured again once the room has settled.
  office?.addEventListener('transitionend', (event) => { if (event.target === office) relayout(); });
  layout();
  setTimeout(() => root.classList.add('pn-ready'), 120);
  return { layout, isOn: () => on };
}
