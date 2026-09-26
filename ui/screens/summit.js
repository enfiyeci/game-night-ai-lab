// The Geneva summit (spec docs/superpowers/specs/2026-09-26-summit-design.md): a front-on hall where the player
// tables up to three motions one at a time, sets each one's checks, may win over holdouts with promises, and the
// room votes on it before the next. Time stops while it is open.
import { readTheRoom, voteMotion, COMMITMENTS, PARTIES } from '../../sim/summit.js';
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
const CHECK_HINT = Object.freeze(['Nobody checks', 'Labs report on themselves', 'Testers can publish', 'Inspectors on site']);

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

// A delegate's demand, judged on the motion on the floor at its current checking level.
function demandMet(party, card, level, promises, read) {
  if (Object.hasOwn(promises, party)) return true;
  const rule = DEMANDS[party].rule;
  if (rule.promiseOnly) return false;
  if (rule.refuses) return card !== rule.refuses;
  if (rule.minCheck != null) return level >= rule.minCheck;
  return read?.[rule.follows] === 'yes' && !(rule.maxCheck != null && level > rule.maxCheck);
}

const binds = (read) => ['openbrain', 'deepthink', 'qilin', 'lodestar'].some((id) => read[id] === 'yes') && ['west', 'east'].some((id) => read[id] === 'yes');
const MOTIONS = 3;

// The agenda on the big screen: voted motions, the one on the floor, and the open slots.
function screenAgenda(motions, results, current, phase) {
  const label = { table: 'YOUR MOVE', checks: 'SETTING CHECKS', room: 'ON THE FLOOR', swing: 'ON THE FLOOR' }[phase];
  const rows = Array.from({ length: MOTIONS }, (_, i) => {
    const y = 124 + i * 30;
    if (i < motions.length) {
      const b = results[i].binds;
      return `<text x="486" y="${y}" style="font:900 12px Nunito;fill:color-mix(in oklab, var(--paper) 66%, var(--sky))">${i + 1}</text>
        <text x="508" y="${y}" style="font:700 15.5px Nunito;fill:color-mix(in oklab, var(--paper) 66%, var(--sky))">${esc(CARD_INFO[motions[i].card].name)}</text>
        <text x="954" y="${y}" text-anchor="end" style="font:900 11.5px Nunito;fill:${b ? 'color-mix(in oklab, var(--teal) 45%, var(--paper))' : 'color-mix(in oklab, var(--wood) 50%, var(--paper))'}">${b ? 'PASSED · BINDING' : 'PLEDGE ONLY'}</text>`;
    }
    if (i === motions.length && phase !== 'result') {
      return `<rect x="472" y="${y - 19}" width="496" height="27" rx="6" style="fill:color-mix(in oklab, var(--paper) 9%, transparent)"/>
        <text x="486" y="${y}" style="font:900 12px Nunito;fill:var(--paper)">${i + 1}</text>
        <text x="508" y="${y}" style="font:900 15.5px Nunito;fill:var(--paper)">${esc(current ? CARD_INFO[current.card].name : i ? 'Choose the next motion' : 'Choose the first motion')}</text>
        <text x="954" y="${y}" text-anchor="end" style="font:900 11.5px Nunito;fill:var(--coral)">${label}</text>`;
    }
    return `<text x="486" y="${y}" style="font:900 12px Nunito;fill:color-mix(in oklab, var(--paper) 45%, var(--sky))">${i + 1}</text>
      <text x="508" y="${y}" style="font:700 15.5px Nunito;fill:color-mix(in oklab, var(--paper) 45%, var(--sky))">Open</text>
      <text x="954" y="${y}" text-anchor="end" style="font:900 11.5px Nunito;fill:color-mix(in oklab, var(--paper) 45%, var(--sky))">—</text>`;
  }).join('');
  return `<text x="486" y="96" style="font:900 12px Nunito;letter-spacing:.2em;fill:color-mix(in oklab, var(--sky) 40%, var(--paper))">THE AGENDA</text>${rows}`;
}

export function openSummit(game, overlayRoot) {
  // An open event card or phone keeps the floor until it is answered.
  if (overlayRoot.querySelector('.sm-layer, .event-layer, .ev-phone')) return null;
  const motions = []; // voted, in order: { card, check, promises made during that motion }
  const results = []; // { signed, binds } for each voted motion
  let current = null; // the motion on the floor
  let phase = 'table'; // table | checks | room | swing | result
  let swingParty = null;
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

  const promised = () => Object.assign({}, ...motions.map((m) => m.promises), current?.promises ?? {});
  const promisesLeft = () => MAX_PROMISES - Object.keys(promised()).length;
  const cashPromised = () => Object.values(promised()).reduce((sum, type) => sum + (PROMISES[type].cash ?? 0), 0);
  const plan = () => ({
    proposals: [...motions.map((m) => m.card), current.card],
    checks: Object.fromEntries([...motions, current].map((m) => [m.card, m.check])),
    promises: promised(),
  });
  const readNow = () => readTheRoom(game.state, plan())[current.card];
  const holdouts = (read) => SEATS.map((s) => s.id).filter((id) => read[id] !== 'yes' && !Object.hasOwn(promised(), id));
  const remaining = () => Object.keys(COMMITMENTS).filter((card) => !motions.some((m) => m.card === card));

  const presidentNote = () => (game.state.meetingsHeld?.includes('second')
    ? '<div class="sm-sticky"><b>From the President’s call</b>“Sign nothing that helps China. Nothing!” Letting the East inspect the West will cost you his favor.</div>'
    : '');

  function bubbles(ids, read) {
    const level = current?.check ?? DEFAULT_CHECK;
    return ids.map((id) => {
      const seat = SEATS.find((s) => s.id === id);
      const p = promised()[id];
      const met = current && demandMet(id, current.card, level, promised(), read);
      const status = p ? `Promised: ${PROMISE_COPY[p].label}` : met ? 'Met' : 'Not met yet';
      const shift = id === 'openbrain' ? 16 : id === 'lodestar' ? -16 : 0;
      return `<button type="button" class="sm-demand${met ? ' met' : ''}${swingParty === id ? ' talking' : ''}" data-talk="${id}" data-p="${id}"
        style="left:${seat.x - 89 + shift}px;top:${seat.y - 208}px" aria-label="Talk to ${PARTY_INFO[id].name}">
        ${esc(DEMANDS[id].text)}<small>${esc(status)}</small></button>`;
    }).join('');
  }

  const kick = (extra = '') => `<div class="sm-kick">Motion ${motions.length + 1} of ${MOTIONS}${extra}</div>`;
  const deck = () => {
    const cards = remaining().map((card) => `<button type="button" class="sm-pc" data-card="${card}"><b>${esc(CARD_INFO[card].name)}</b><span>${esc(CARD_INFO[card].ask)}</span></button>`);
    if (motions.length) cards.push(`<button type="button" class="sm-pc alt" data-close><b>Close the summit</b><span>Stop here. What passed still stands.</span></button>`);
    return `<div class="sm-deck">${cards.join('')}</div>`;
  };
  const tally = (read) => `<div class="sm-tally">${SEATS.map((s) => `<span class="sm-pb${read[s.id] === 'yes' ? '' : ' off'}" data-p="${s.id}" title="${PARTY_INFO[s.id].name}: ${read[s.id]}">${PARTY_INFO[s.id].ab}</span>`).join('')}</div>`;

  function panel(read) {
    if (phase === 'table') {
      return `<section class="gp sm-panel" aria-label="Table a motion">${kick()}<h2>${motions.length ? 'What do you table next?' : 'What do you table first?'}</h2>${deck()}
        ${motions.length ? '' : '<div class="sm-row"><span class="sm-muted">Each motion is voted before the next. A motion binds when a lab and a government sign it.</span><button type="button" class="sm-leave" data-leave>Leave without a deal</button></div>'}</section>`;
    }
    const name = current ? CARD_INFO[current.card].name : '';
    if (phase === 'checks') {
      const levels = CHECK_NAMES.map((n, i) => `<button type="button" class="sm-lv${i === current.check ? ' on' : ''}" role="radio" aria-checked="${i === current.check}" data-level="${i}">
        <b>${n}</b><span class="sm-meter">${[0, 1, 2, 3].map((j) => `<i class="${j <= i ? 'f' : ''}"></i>`).join('')}</span><small>${CHECK_HINT[i]}</small></button>`).join('');
      return `<section class="gp sm-panel" aria-label="How it is checked">${kick(` · ${esc(name)}`)}<h2>How is it checked?</h2>
        <div class="sm-levels" role="radiogroup" aria-label="How ${esc(name)} is checked">${levels}</div>
        <div class="sm-row"><span class="sm-muted">Stricter checks catch cheaters, including you. The placards show who would sign.</span>
        <span class="sm-actions"><button type="button" class="sm-leave" data-back="table">Back</button><button type="button" class="btn" data-room>Put it to the room</button></span></div></section>`;
    }
    if (phase === 'room') {
      const left = promisesLeft();
      const canSwing = left > 0 && holdouts(read).length > 0;
      return `<section class="gp sm-panel" aria-label="Read the room"><div class="sm-row top"><div>${kick(` · ${esc(name)}, ${CHECK_NAMES[current.check].toLowerCase()}`)}
        <h2>${binds(read) ? 'It would bind as it is.' : 'Short of a binding vote.'}</h2></div>${tally(read)}</div>
        <div class="sm-choices two"><button type="button" class="sm-answer" data-swing ${canSwing ? '' : 'disabled'}><b>Win over a holdout</b><span>${left ? `${left} promise${left === 1 ? '' : 's'} left` : 'No promises left'}</span></button>
        <button type="button" class="sm-answer alt" data-vote><b>Vote now</b><span>${binds(read) ? 'Jules: it should bind' : 'Jules: it would be a pledge only'}</span></button></div>
        <div class="sm-row"><span class="sm-muted">Jules’s read. The vote can still surprise you.</span><button type="button" class="sm-leave" data-back="checks">Back</button></div>
        ${error ? `<p class="sm-error" role="alert">${esc(error)}</p>` : ''}</section>`;
    }
    if (phase === 'swing') {
      const who = holdouts(read);
      const party = swingParty ?? who[0];
      const cards = who.map((id) => `<button type="button" class="sm-who${id === party ? ' sel' : ''}" data-talk="${id}" data-p="${id}">${partyBadge(id)}<span>${esc(DEMANDS[id].text)}</span></button>`).join('');
      const choices = Object.keys(PROMISES).map((type) => {
        const cash = PROMISES[type].cash ?? 0;
        const cannot = cash > 0 && game.state.cash < cashPromised() + cash;
        return `<button type="button" class="sm-answer" data-promise="${type}" ${cannot ? 'disabled' : ''}><b>${esc(PROMISE_COPY[type].label)}</b><span>${esc(PROMISE_COPY[type].cost)}</span></button>`;
      }).join('');
      return `<section class="gp sm-panel" aria-label="Win over a holdout">${kick(` · promise ${MAX_PROMISES - promisesLeft() + 1} of ${MAX_PROMISES}`)}<h2>Who do you win over?</h2>
        <div class="sm-holdouts">${cards}</div>
        <div class="sm-choices">${choices}<button type="button" class="sm-answer alt" data-promise="none"><b>Not now</b><span>Back to the room</span></button></div></section>`;
    }
    // result
    const i = motions.length - 1;
    const r = results[i];
    const card = CARD_INFO[motions[i].card].name;
    const more = motions.length < MOTIONS && remaining().length;
    return `<section class="gp sm-panel narrow" aria-live="polite"><div class="sm-kick">Motion ${i + 1} · the vote</div>
      <h2>${esc(card)} ${r.binds ? 'binds.' : 'is a pledge only.'}</h2>
      <p>${r.signed.length ? `Signed: ${esc(r.signed.map((id) => PARTY_INFO[id].name).join(', '))}.` : 'Nobody else signed.'}${r.binds ? '' : ' A motion binds when a lab and a government sign it.'}</p>
      <div class="sm-row end"><button type="button" class="sm-leave" data-close>Close the summit</button>${more ? '<button type="button" class="btn" data-next>Next motion</button>' : ''}</div>
      ${error ? `<p class="sm-error" role="alert">${esc(error)}</p>` : ''}</section>`;
  }

  function render() {
    let read = {};
    let raised = {};
    let shown = [];
    if (current) {
      read = readNow();
      raised = read;
      if (phase === 'checks') shown = SEATS.map((s) => s.id).filter((id) => DEMANDS[id].rule.minCheck != null || DEMANDS[id].rule.maxCheck != null);
      if (phase === 'room') shown = holdouts(read);
      if (phase === 'swing') shown = [swingParty ?? holdouts(read)[0]].filter(Boolean);
    }
    if (phase === 'result') {
      const r = results[results.length - 1];
      raised = Object.fromEntries(SEATS.map((s) => [s.id, r.signed.includes(s.id) ? 'yes' : 'no']));
    }
    const seat = phase === 'swing' && SEATS.find((s) => s.id === (swingParty ?? holdouts(read)[0]));
    layer.innerHTML = `${hallSvg({ raised, screen: screenAgenda(motions, results, current, phase) })}${bubbles(shown, read)}${presidentNote()}
      ${seat ? `<div class="sm-say" data-p="${seat.id}" style="left:${Math.min(1440 - 330, Math.max(30, seat.x - 150))}px;top:560px"><b>${esc(PARTY_INFO[seat.id].name)}</b>${esc(PARTY_INFO[seat.id].line)}</div>` : ''}
      ${panel(read)}`;
  }

  function showFinal(result) {
    const raised = Object.fromEntries(PARTIES.map((id) => [id, Object.values(result.signed).some((list) => list.includes(id)) ? 'yes' : 'no']));
    const binding = result.binding.map((card) => CARD_INFO[card].name);
    const title = binding.length >= 2 ? 'The deal binds.' : binding.length === 1 ? 'One motion binds.' : 'Nothing binds. Only your own pledges stand.';
    layer.innerHTML = `${hallSvg({ raised, screen: screenVote(result, { proposals: motions.map((m) => m.card) }) })}
      <section class="gp sm-talk sm-result" aria-live="polite">
        <div class="sm-kick">The summit closes</div><h2>${esc(title)}</h2>
        <p>${binding.length ? `Binding: ${esc(binding.join(', '))}.` : 'A motion binds only when another lab and a government sign it.'} The deal is checked every week from now on.</p>
        <div class="sm-actions"><button type="button" class="btn" data-done>Back to the lab</button></div>
      </section>`;
    layer.querySelector('[data-done]').focus();
  }

  function closeSummit() {
    if (!motions.length) { close(); return; }
    const result = game.addMove({ type: 'summit', motions: motions.map((m) => ({ card: m.card, check: m.check, promises: { ...m.promises } })) });
    if (!result.ok) {
      error = result.error ? result.error[0].toUpperCase() + result.error.slice(1) : 'The summit could not be closed.';
      render();
      return;
    }
    const summit = result.events.find((e) => e.type === 'summit');
    showFinal(summit ?? { signed: game.state.deal.signed, binding: game.state.deal.binding });
  }

  layer.addEventListener('click', (event) => {
    const target = event.target.closest('button, .sm-seat');
    if (!target) return;
    error = '';
    if (target.matches('[data-done], [data-leave]')) { close(); return; }
    if (target.matches('[data-close]')) { closeSummit(); return; }
    if (target.matches('[data-card]')) {
      current = { card: target.dataset.card, check: DEFAULT_CHECK, promises: {} };
      phase = 'checks';
    } else if (target.matches('[data-level]')) {
      current.check = Number(target.dataset.level);
    } else if (target.matches('[data-back]')) {
      phase = target.dataset.back;
      if (phase === 'table') current = null;
    } else if (target.matches('[data-room]')) {
      phase = 'room';
    } else if (target.matches('[data-swing]')) {
      phase = 'swing';
      swingParty = null;
    } else if (target.matches('[data-talk]') || target.matches('.sm-seat')) {
      const party = target.dataset.talk ?? target.dataset.party;
      if (!current || !['room', 'swing'].includes(phase) || promisesLeft() <= 0 || !holdouts(readNow()).includes(party)) return;
      phase = 'swing';
      swingParty = party;
    } else if (target.matches('[data-promise]')) {
      const type = target.dataset.promise;
      const party = swingParty ?? holdouts(readNow())[0];
      if (type !== 'none' && party) current.promises[party] = type;
      phase = 'room';
      swingParty = null;
    } else if (target.matches('[data-vote]')) {
      const all = [...motions, current];
      results.push(voteMotion(game.state, all, all.length - 1));
      motions.push(current);
      current = null;
      phase = 'result';
    } else if (target.matches('[data-next]')) {
      phase = 'table';
    } else return;
    render();
    layer.querySelector('.sm-panel button:not([disabled])')?.focus();
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && phase === 'swing') {
      event.preventDefault();
      phase = 'room';
      swingParty = null;
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
