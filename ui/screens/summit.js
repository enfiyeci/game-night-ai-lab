// The Geneva summit (spec docs/superpowers/specs/2026-09-26-summit-design.md): a front-on hall, the delegates'
// demands, a checking level per proposal, up to three promises, then the vote. Time stops while it is open.
import { readTheRoom, demandStatus, COMMITMENTS, PARTIES } from '../../sim/summit.js';
import { DEMANDS, PROMISES, MAX_PROMISES, DEFAULT_CHECK } from '../../sim/data/summit.js';
import { registerMenuHandler } from '../menu.js';

export const PARTY_INFO = Object.freeze({
  openbrain: { name: 'OpenBrain', ab: 'OB', line: 'Qilin first, then we talk. And testers at most: inspectors make our lawyers cry.' },
  deepthink: { name: 'DeepThink', ab: 'DT', line: 'Cap our runs and we sign nothing. Anything else, make it worth our while.' },
  west: { name: 'The West', ab: 'W', line: 'Inspectors from the East in our labs? He would fire me on live television. Give me something to hand him.' },
  east: { name: 'The East', ab: 'E', line: 'We open our labs when you open yours. Both ways, or we fly home.' },
  qilin: { name: 'Qilin', ab: 'QL', line: 'Our government decides. Talk to them. Or make it worth our while directly.' },
  lodestar: { name: 'Lodestar', ab: 'LS', line: 'We came here to sign. Just make the checks real.' },
});

export const CARD_INFO = Object.freeze({
  evaluators: { name: 'Outside testers in every lab', ask: 'Independent testers sit inside each lab and can publish what they find.' },
  computeCap: { name: 'A cap on training runs', ask: 'No single training run bigger than an agreed size.' },
  releaseDelay: { name: 'A wait between launches', ask: 'Each lab waits a set time before its next model.' },
  sharedSafety: { name: 'Pooled safety research', ask: 'Every signer pays into one shared safety lab.' },
  pauseAutomation: { name: 'No AI doing AI research', ask: 'Labs stop letting their own models run their research.' },
  verification: { name: 'West–East inspection line', ask: 'Both governments check each other’s labs.' },
});

export const CHECK_NAMES = Object.freeze(['On trust', 'Self-reports', 'Outside testers', 'Inspectors']);

const PROMISE_COPY = Object.freeze({
  pay: { label: 'We pay for it', cost: '$50M toward the checks' },
  goFirst: { label: 'Our lab goes first', cost: 'Testers start in our lab now' },
  inspectors: { label: 'Inspect us too', cost: 'Inspectors can check our own runs' },
});

// Seat order left to right, with the drawing for each delegate.
const SKIN = ['color-mix(in oklab, var(--wood) 55%, var(--paper))', 'color-mix(in oklab, var(--wood) 80%, var(--ink))', 'color-mix(in oklab, var(--wood) 35%, var(--paper))', 'color-mix(in oklab, var(--wood) 68%, var(--ink))'];
const SEATS = Object.freeze([
  { id: 'openbrain', x: 210, y: 452, skin: SKIN[2], hair: 'var(--ink)', style: 2 },
  { id: 'deepthink', x: 420, y: 418, skin: SKIN[0], hair: 'color-mix(in oklab, var(--wood) 60%, var(--ink))', style: 1, glasses: true },
  { id: 'west', x: 620, y: 404, skin: SKIN[2], hair: 'color-mix(in oklab, var(--wood) 30%, var(--paper))', style: 2 },
  { id: 'east', x: 820, y: 404, skin: SKIN[3], hair: 'var(--ink)', style: 0, glasses: true },
  { id: 'qilin', x: 1020, y: 418, skin: SKIN[0], hair: 'var(--ink)', style: 3 },
  { id: 'lodestar', x: 1230, y: 452, skin: SKIN[1], hair: 'var(--ink)', style: 1 },
]);
const FLAG_X = [150, 245, 340, 1100, 1195, 1290];

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const partyBadge = (id, small = false) => `<span class="sm-pb${small ? ' sm' : ''}" data-p="${id}">${esc(id === 'you' ? 'YOU' : PARTY_INFO[id].ab)}</span>`;

function figure(seat, raise) {
  const { x, y, skin, hair, style, glasses } = seat;
  const suit = 'color-mix(in oklab, var(--pc) 40%, var(--ink))';
  const hairPath = [
    'M-17 -4 Q-18 -24 0 -25 Q18 -24 17 -4 Q14 -16 0 -17 Q-12 -17 -17 -4Z',
    'M-18 2 Q-20 -26 0 -26 Q20 -26 18 2 Q16 -14 8 -17 Q-2 -12 -14 -14 Q-17 -8 -18 2Z',
    'M-16 -8 Q-12 -26 4 -24 Q18 -22 17 -8 Q8 -18 -16 -8Z',
    'M-19 12 Q-22 -26 0 -26 Q22 -26 19 12 L14 12 Q16 -12 0 -15 Q-16 -12 -14 12Z',
  ][style % 4];
  const card = raise === 'yes' ? ['var(--teal)', 'SIGN'] : raise === 'maybe' ? ['var(--wood)', '?'] : ['color-mix(in oklab, var(--ink) 20%, var(--paper))', 'NO'];
  const arm = raise ? `<path d="M20 22 L30 -18" style="stroke:${suit};stroke-width:11;stroke-linecap:round"/><rect x="18" y="-50" width="36" height="28" rx="4" style="fill:${card[0]};stroke:var(--paper);stroke-width:2"/><text x="36" y="-31" text-anchor="middle" style="font:900 12px Nunito;fill:var(--paper)">${card[1]}</text>` : '';
  return `<g class="sm-seat" data-party="${seat.id}" data-p="${seat.id}" transform="translate(${x} ${y}) scale(1.6)">
    <path d="M-30 58 Q-30 18 0 16 Q30 18 30 58Z" style="fill:${suit}"/>
    <path d="M-7 17 L0 30 L7 17Z" style="fill:var(--paper)"/>
    <rect x="-6" y="8" width="12" height="10" style="fill:${skin}"/>
    ${arm}
    <ellipse cx="0" cy="-6" rx="17" ry="19" style="fill:${skin}"/><path d="${hairPath}" style="fill:${hair}"/>
    <circle cx="-6" cy="-5" r="2.1" style="fill:var(--ink)"/><circle cx="6" cy="-5" r="2.1" style="fill:var(--ink)"/>
    <path d="M-5 5 Q0 8.5 5 5" style="fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linecap:round"/>
    ${glasses ? '<circle cx="-6" cy="-5" r="5" style="fill:none;stroke:var(--ink);stroke-width:1.5"/><circle cx="6" cy="-5" r="5" style="fill:none;stroke:var(--ink);stroke-width:1.5"/>' : ''}
  </g>`;
}

function screenTitle() {
  return `<text x="720" y="112" text-anchor="middle" style="font:900 13px Nunito;letter-spacing:.2em;fill:color-mix(in oklab, var(--sky) 40%, var(--paper))">GENEVA</text>
    <text x="720" y="152" text-anchor="middle" style="font:300 38px Nunito;fill:var(--paper)">The Pacing Summit</text>
    <text x="720" y="184" text-anchor="middle" style="font:700 14px Nunito;fill:color-mix(in oklab, var(--paper) 70%, var(--sky))">Six delegations · up to three proposals · one vote</text>`;
}

function screenVote(result, plan) {
  const rows = plan.proposals.map((card, i) => {
    const y = 132 + i * 30;
    const who = ['you', ...result.signed[card]];
    const seals = who.map((id, j) => `<g data-p="${id}" transform="translate(${772 + j * 23} ${y - 5})"><circle r="10.5" style="fill:var(--pc);stroke:var(--paper);stroke-width:1.5"/><text y="3.5" text-anchor="middle" style="font:900 8px Nunito;fill:var(--paper)">${id === 'you' ? 'YOU' : PARTY_INFO[id].ab}</text></g>`).join('');
    const binds = result.binding.includes(card);
    return `<text x="470" y="${y}" style="font:800 15px Nunito;fill:var(--paper)">${esc(CARD_INFO[card].name)}</text>${seals}
      <text x="975" y="${y}" text-anchor="end" style="font:900 12px Nunito;fill:${binds ? 'color-mix(in oklab, var(--teal) 45%, var(--paper))' : 'color-mix(in oklab, var(--wood) 45%, var(--paper))'}">${binds ? 'BINDING' : 'PLEDGE ONLY'}</text>`;
  }).join('');
  return `<text x="720" y="100" text-anchor="middle" style="font:900 12px Nunito;letter-spacing:.2em;fill:color-mix(in oklab, var(--sky) 40%, var(--paper))">THE VOTE</text>${rows}`;
}

function hallSvg({ raised = {}, screen = screenTitle() } = {}) {
  const flags = PARTIES.map((id, i) => `<g data-p="${id}" transform="translate(${FLAG_X[i]} ${i < 3 ? 70 : 150})"><rect width="3" height="150" style="fill:color-mix(in oklab, var(--ink) 45%, var(--paper))"/><path d="M3 4 H62 Q56 20 62 36 H3Z" style="fill:var(--pc)"/><text x="30" y="25" text-anchor="middle" style="font:900 12px Nunito;fill:var(--paper)">${PARTY_INFO[id].ab}</text></g>`).join('');
  const placards = SEATS.map((seat) => {
    const t = (seat.x - 80) / 1280;
    const y = 524 - 288 * t * (1 - t);
    return `<g data-p="${seat.id}" transform="translate(${seat.x} ${y})"><path d="M-50 0 H50 L46 26 H-46Z" style="fill:var(--paper);stroke:color-mix(in oklab, var(--ink) 18%, transparent);stroke-width:1"/><rect x="-50" width="100" height="5" style="fill:var(--pc)"/><text y="19" text-anchor="middle" style="font:900 13px Nunito;fill:var(--ink)">${PARTY_INFO[seat.id].name}</text></g>`;
  }).join('');
  return `<svg class="sm-hall" width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true">
    <rect width="1440" height="900" style="fill:color-mix(in oklab, var(--cream) 70%, var(--paper))"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 92}" width="88" height="480" style="fill:color-mix(in oklab, var(--wood) ${i % 2 ? 22 : 16}%, var(--paper))"/>`).join('')}
    <rect y="470" width="1440" height="14" style="fill:color-mix(in oklab, var(--wood) 45%, var(--paper))"/>
    ${flags}
    <rect x="440" y="62" width="560" height="148" rx="10" style="fill:color-mix(in oklab, var(--ink) 92%, var(--sky))"/>
    <rect x="450" y="72" width="540" height="128" rx="6" style="fill:color-mix(in oklab, var(--sky) 38%, var(--ink))"/>
    ${screen}
    <rect y="484" width="1440" height="416" style="fill:color-mix(in oklab, var(--wood) 26%, var(--paper))"/>
    <ellipse cx="720" cy="760" rx="600" ry="150" style="fill:color-mix(in oklab, var(--sky) 20%, var(--paper))"/>
    ${SEATS.map((seat) => figure(seat, raised[seat.id])).join('')}
    <path d="M80 548 Q720 404 1360 548 L1360 590 Q720 446 80 590Z" style="fill:color-mix(in oklab, var(--wood) 62%, var(--ink))"/>
    <path d="M80 522 Q720 378 1360 522 L1360 552 Q720 408 80 552Z" style="fill:var(--wood)"/>
    ${placards}
  </svg>`;
}

// A follower's demand is met on a card when the party it follows signs that card.
// Every demand is judged on the selected proposal, as the placards are.
function demandMet(party, plan, room, selected) {
  if (Object.hasOwn(plan.promises, party)) return true;
  const rule = DEMANDS[party].rule;
  if (!selected) return rule.follows ? false : demandStatus(plan)[party];
  const level = plan.checks[selected] ?? DEFAULT_CHECK;
  if (rule.promiseOnly) return false;
  if (rule.refuses) return selected !== rule.refuses;
  if (rule.minCheck != null) return level >= rule.minCheck;
  return room[selected]?.[rule.follows] === 'yes' && !(rule.maxCheck != null && level > rule.maxCheck);
}

function forecast(read) {
  const labs = ['openbrain', 'deepthink', 'qilin', 'lodestar'].filter((id) => read[id] === 'yes');
  const govs = ['west', 'east'].filter((id) => read[id] === 'yes');
  if (labs.length && govs.length) return { binds: true, text: `Looks binding: ${[...labs, ...govs].map((id) => PARTY_INFO[id].name).join(', ')}` };
  return { binds: false, text: labs.length ? 'Needs a government' : govs.length ? 'Needs a lab' : 'Needs a lab and a government' };
}

export function openSummit(game, overlayRoot) {
  if (overlayRoot.querySelector('.sm-layer')) return null;
  const state = game.state;
  const plan = { proposals: [], checks: {}, promises: {} };
  let selected = null;
  let talking = null;
  let error = '';
  const previousFocus = document.activeElement;

  const layer = document.createElement('div');
  layer.className = 'dialog-layer sm-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', 'The Geneva summit');
  layer.tabIndex = -1;

  const close = () => {
    layer.remove();
    if (previousFocus?.isConnected) previousFocus.focus?.();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
  };

  const presidentNote = () => (state.meetingsHeld?.includes('second')
    ? '<div class="sm-sticky"><b>From the President’s call</b>“Sign nothing that helps China. Nothing!” Letting the East inspect the West will cost you his favor.</div>'
    : '');

  function demandBubbles(room) {
    return SEATS.map((seat) => {
      const met = demandMet(seat.id, plan, room, selected);
      const promised = plan.promises[seat.id];
      const status = promised ? `Promised: ${PROMISE_COPY[promised].label}` : met ? 'Met' : 'Not met yet';
      const shift = seat.id === 'openbrain' ? 16 : seat.id === 'lodestar' ? -16 : 0;
      return `<button type="button" class="sm-demand${met ? ' met' : ''}${talking === seat.id ? ' talking' : ''}" data-talk="${seat.id}" data-p="${seat.id}"
        style="left:${seat.x - 89 + shift}px;top:${seat.y - 208}px" aria-label="Talk to ${PARTY_INFO[seat.id].name}">
        ${esc(DEMANDS[seat.id].text)}<small>${esc(status)}</small></button>`;
    }).join('');
  }

  function proposalRows(room) {
    return plan.proposals.map((card) => {
      const read = room[card];
      const level = plan.checks[card] ?? DEFAULT_CHECK;
      const f = forecast(read);
      return `<div class="sm-prow${card === selected ? ' sel' : ''}" data-select="${card}">
        <div><b>${esc(CARD_INFO[card].name)}</b><span class="sm-bind${f.binds ? ' yes' : ''}">${esc(f.text)}</span></div>
        <div class="sm-steps" role="radiogroup" aria-label="How ${esc(CARD_INFO[card].name)} is checked">
          ${CHECK_NAMES.map((name, i) => `<button type="button" role="radio" aria-checked="${i === level}" class="${i === level ? 'on' : ''}" data-check="${card}" data-level="${i}">${name}</button>`).join('')}
        </div>
        <div class="sm-leans">${SEATS.map((seat) => `<span class="sm-pb sm ${read[seat.id]}" data-p="${seat.id}" title="${PARTY_INFO[seat.id].name}: ${read[seat.id]}">${PARTY_INFO[seat.id].ab}</span>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function roomPanel(room) {
    const chips = Object.keys(COMMITMENTS).map((card) => {
      const on = plan.proposals.includes(card);
      const full = !on && plan.proposals.length >= 3;
      return `<button type="button" class="sm-card${on ? ' on' : ''}" data-card="${card}" ${full ? 'disabled' : ''} aria-pressed="${on}">${esc(CARD_INFO[card].name)}</button>`;
    }).join('');
    const promised = Object.entries(plan.promises);
    const slots = Array.from({ length: MAX_PROMISES }, (_, i) => {
      const entry = promised[i];
      return entry ? `<span class="sm-pr">${partyBadge(entry[0], true)}${esc(PROMISE_COPY[entry[1]].label)}</span>` : '<span class="sm-pr empty">Open</span>';
    }).join('');
    return `<section class="gp sm-props" aria-label="Your proposals">
      <div class="hd"><span>Put up to three on the table · then choose how each one is checked</span><span>Jules’s read of who signs</span></div>
      <div class="sm-body">
        <div class="sm-cards">${chips}</div>
        ${plan.proposals.length ? proposalRows(room) : '<p class="sm-empty">Pick the proposals you want to put forward. Each delegate’s demand is in the bubble above them; click one to make them a promise.</p>'}
        <div class="sm-foot">
          <div class="sm-promises"><span>Promises</span>${slots}<span class="sm-muted">One per delegate. Click a delegate to talk.</span></div>
          <div class="sm-actions"><button type="button" class="sm-leave" data-leave>Leave without a deal</button><button type="button" class="btn" data-vote ${plan.proposals.length ? '' : 'disabled'}>Call the vote</button></div>
        </div>
        ${error ? `<p class="sm-error" role="alert">${esc(error)}</p>` : ''}
      </div></section>`;
  }

  function talkCard(party) {
    const promised = plan.promises[party];
    const full = !promised && Object.keys(plan.promises).length >= MAX_PROMISES;
    const choices = Object.keys(PROMISES).map((type) => {
      const cash = PROMISES[type].cash ?? 0;
      const spent = Object.values(plan.promises).reduce((sum, t) => sum + (PROMISES[t].cash ?? 0), 0) - (promised ? PROMISES[promised].cash ?? 0 : 0);
      const cannot = full || (cash > 0 && state.cash < spent + cash);
      return `<button type="button" class="sm-answer${promised === type ? ' chosen' : ''}" data-promise="${type}" ${cannot ? 'disabled' : ''}><b>${esc(PROMISE_COPY[type].label)}</b><span>${esc(PROMISE_COPY[type].cost)}</span></button>`;
    }).join('');
    return `<section class="gp sm-talk" aria-label="Talking to ${esc(PARTY_INFO[party].name)}">
      <div class="sm-talk-top"><div><div class="sm-kick">${full ? 'All three promises are made' : `Promise ${Object.keys(plan.promises).length + (promised ? 0 : 1)} of ${MAX_PROMISES}`} · to ${esc(PARTY_INFO[party].name)}</div><h2>What do you offer?</h2></div></div>
      <div class="sm-choices">${choices}<button type="button" class="sm-answer" data-promise="none"><b>${promised ? 'Take it back' : 'Not now'}</b><span>${promised ? 'Keep the promise for someone else' : 'Back to the table'}</span></button></div>
    </section>`;
  }

  function render() {
    const room = readTheRoom(state, plan);
    if (selected && !plan.proposals.includes(selected)) selected = null;
    if (!selected && plan.proposals.length) selected = plan.proposals[0];
    const raised = selected ? room[selected] : {};
    const seat = talking && SEATS.find((s) => s.id === talking);
    layer.innerHTML = `${hallSvg({ raised })}${demandBubbles(room)}${presidentNote()}
      ${seat ? `<div class="sm-say" data-p="${seat.id}" style="left:${Math.min(1440 - 330, Math.max(30, seat.x - 150))}px;top:606px"><b>${esc(PARTY_INFO[seat.id].name)}</b>${esc(PARTY_INFO[seat.id].line)}</div>` : ''}
      ${talking ? talkCard(talking) : roomPanel(room)}`;
  }

  function showVote(result) {
    const raised = Object.fromEntries(PARTIES.map((id) => [id, Object.values(result.signed).some((list) => list.includes(id)) ? 'yes' : 'no']));
    const binding = result.binding.map((card) => CARD_INFO[card].name);
    const title = binding.length >= 2 ? 'The deal binds.' : binding.length === 1 ? 'One card binds.' : 'Nothing binds. Only your own pledges stand.';
    const outside = PARTIES.filter((id) => raised[id] === 'no').map((id) => PARTY_INFO[id].name);
    layer.innerHTML = `${hallSvg({ raised, screen: screenVote(result, plan) })}
      <section class="gp sm-talk sm-result" aria-live="polite">
        <div class="sm-kick">The vote</div><h2>${esc(title)}</h2>
        <p>${binding.length ? `Binding: ${esc(binding.join(', '))}.` : 'A card binds only when another lab and a government sign it.'} ${outside.length ? `Signed nothing: ${esc(outside.join(', '))}.` : 'Everyone signed something.'}</p>
        <div class="sm-actions"><button type="button" class="btn" data-done>Back to the lab</button></div>
      </section>`;
    layer.querySelector('[data-done]').focus();
  }

  layer.addEventListener('click', (event) => {
    const target = event.target.closest('button, [data-select], .sm-seat');
    if (!target) return;
    if (target.matches('[data-done]')) { close(); return; }
    if (target.matches('[data-leave]')) { close(); return; }
    if (target.matches('[data-card]')) {
      const card = target.dataset.card;
      if (plan.proposals.includes(card)) {
        plan.proposals = plan.proposals.filter((c) => c !== card);
        delete plan.checks[card];
      } else if (plan.proposals.length < 3) {
        plan.proposals.push(card);
        plan.checks[card] = DEFAULT_CHECK;
        selected = card;
      }
      error = '';
      render();
      return;
    }
    if (target.matches('[data-check]')) {
      plan.checks[target.dataset.check] = Number(target.dataset.level);
      selected = target.dataset.check;
      render();
      return;
    }
    if (target.matches('[data-talk]') || target.matches('.sm-seat')) {
      talking = target.dataset.talk ?? target.dataset.party;
      render();
      layer.querySelector('.sm-answer')?.focus();
      return;
    }
    if (target.matches('[data-promise]')) {
      const type = target.dataset.promise;
      if (type === 'none') delete plan.promises[talking];
      else plan.promises[talking] = type;
      talking = null;
      render();
      return;
    }
    if (target.matches('[data-vote]')) {
      const result = game.addMove({ type: 'summit', proposals: [...plan.proposals], checks: { ...plan.checks }, promises: { ...plan.promises } });
      if (!result.ok) {
        error = result.error ? result.error[0].toUpperCase() + result.error.slice(1) : 'The vote could not be called.';
        render();
        return;
      }
      const summit = result.events.find((e) => e.type === 'summit');
      showVote(summit ?? { signed: game.state.deal.signed, binding: game.state.deal.binding });
      return;
    }
    if (target.matches('[data-select]')) {
      selected = target.dataset.select;
      render();
    }
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && talking) {
      event.preventDefault();
      talking = null;
      render();
    }
  });

  render();
  overlayRoot.append(layer);
  requestAnimationFrame(() => layer.classList.add('dialog-open'));
  layer.focus();
  return layer;
}

const summitOpen = (state) => state.era === 5 && state.turnInEra === 0 && !state.deal && !state.ending;

// Opens once by itself when the summit week begins and nothing else is on screen; the menu reopens it.
export function mountSummit(game, overlayRoot) {
  let offered = false;
  const BLOCKING = '.dialog-layer, .event-layer, .ev-phone, .menu-layer';
  const tryOpen = () => {
    if (offered || !summitOpen(game.state) || game.state.meeting || overlayRoot.querySelector(BLOCKING)) return;
    offered = true;
    openSummit(game, overlayRoot);
  };
  const unregister = registerMenuHandler('summit', () => openSummit(game, overlayRoot));
  const unsubscribe = game.subscribe(() => requestAnimationFrame(tryOpen));
  const observer = new MutationObserver(() => requestAnimationFrame(tryOpen));
  observer.observe(overlayRoot, { childList: true });
  requestAnimationFrame(tryOpen);
  return () => { unregister(); unsubscribe(); observer.disconnect(); };
}
