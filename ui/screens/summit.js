// The Geneva summit (spec docs/superpowers/specs/2026-09-26-summit-design.md): a front-on hall where the player
// tables up to three motions one at a time, sets each one's checks, may win over holdouts with promises, and the
// room votes on it before the next. Time stops while it is open.
import { readTheRoom, voteMotion, COMMITMENTS, PARTIES } from '../../sim/summit.js';
import { DEMANDS, PROMISES, MAX_PROMISES, DEFAULT_CHECK } from '../../sim/data/summit.js';
import { registerMenuHandler } from '../menu.js';
import { ART } from '../assets/summitArt.js';

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

// Seats left to right, where the generated hall art draws each delegate's head.
const SEATS = Object.freeze(ART.seats.map((seat) => ({ id: seat.id, x: seat.head[0], y: seat.head[1] })));

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const partyBadge = (id, small = false) => `<span class="sm-pb${small ? ' sm' : ''}" data-p="${id}">${esc(id === 'you' ? 'YOU' : PARTY_INFO[id].ab)}</span>`;

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

// The hall (tools/office/gen_summit.py), seen over your and Jules's shoulders. A delegate's face and
// placard follow their lean; with no lean they sit neutral and hold no placard.
function hallSvg({ raised = {}, screen = '' } = {}) {
  const seats = ART.seats.map((seat) => `<g class="sm-seat" data-party="${seat.id}" data-p="${seat.id}">${seat.body}${seat.faces[raised[seat.id] ?? 'maybe']}</g>`).join('');
  const placards = ART.seats.map((seat) => (raised[seat.id] ? seat.placards[raised[seat.id]] : '')).join('');
  return `<svg class="sm-hall" width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true">${ART.back}${seats}${ART.desk}${ART.seats.map((seat) => seat.hands).join('')}${placards}
    <g transform="translate(0 20)">${screen}</g>${ART.front}</svg>`;
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
  if (overlayRoot.querySelector('.sm-layer, .event-layer, .ev-phone, .screenwall-layer')) return null;
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

  // While the summit is open, focus never leaves it: acting on the game behind it would change votes already shown.
  const focusPanel = () => {
    const target = layer.querySelector('.sm-panel button:not([disabled]), .sm-talk button:not([disabled])');
    if (target) target.focus();
    else layer.focus();
  };
  const keepFocus = (event) => {
    if (layer.isConnected && !layer.contains(event.target)) focusPanel();
  };
  document.addEventListener('focusin', keepFocus);

  const close = () => {
    document.removeEventListener('focusin', keepFocus);
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
  // Jules's read of a promise to this delegate on the motion on the floor (the promise's kind does not change it).
  const promiseRead = (party) => {
    const before = readNow();
    const after = readTheRoom(game.state, { ...plan(), promises: { ...promised(), [party]: 'goFirst' } })[current.card];
    const follow = SEATS.map((seat) => seat.id).filter((id) => id !== party && before[id] !== 'yes' && after[id] === 'yes');
    return { lean: after[party], follow };
  };
  const hint = (party) => {
    const { lean, follow } = promiseRead(party);
    const also = follow.length ? ` ${follow.map((id) => PARTY_INFO[id].name).join(' and ')} would follow.` : '';
    if (lean === 'yes') return `Jules: a promise should win them.${also}`;
    if (lean === 'maybe') return `Jules: could go either way.${also}`;
    return 'Jules: a promise won’t be enough.';
  };
  const bestHoldout = (read) => {
    const who = holdouts(read);
    return who.find((id) => promiseRead(id).lean === 'yes') ?? who.find((id) => promiseRead(id).lean === 'maybe') ?? who[0];
  };

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
        style="left:${seat.x - 89 + shift}px;top:${seat.y - 150}px" aria-label="Talk to ${PARTY_INFO[id].name}">
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
    if (phase === 'table' && !motions.length && game.movesLeft() <= 0) {
      return `<section class="gp sm-panel narrow" aria-label="No team action left">${kick()}<h2>Both team actions are used.</h2>
        <p>The summit's vote takes one team action. There is none left this round.</p>
        <div class="sm-row end"><button type="button" class="btn" data-leave>Back to the lab</button></div></section>`;
    }
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
      const party = swingParty ?? bestHoldout(read);
      const cards = who.map((id) => `<button type="button" class="sm-who${id === party ? ' sel' : ''}" data-talk="${id}" data-p="${id}">${partyBadge(id)}<span>${esc(DEMANDS[id].text)}<small>${esc(hint(id))}</small></span></button>`).join('');
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
      if (phase === 'swing') shown = [swingParty ?? bestHoldout(read)].filter(Boolean);
    }
    if (phase === 'result') {
      const r = results[results.length - 1];
      raised = Object.fromEntries(SEATS.map((s) => [s.id, r.signed.includes(s.id) ? 'yes' : 'no']));
    }
    const seat = phase === 'swing' && SEATS.find((s) => s.id === (swingParty ?? bestHoldout(read)));
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
      focusPanel();
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
      const party = swingParty ?? bestHoldout(readNow());
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
    focusPanel();
  });
  layer.addEventListener('keydown', (event) => {
    // Keep focus inside the summit: acting on the game behind it would change the votes already shown.
    if (event.key === 'Tab') {
      const items = [...layer.querySelectorAll('button:not([disabled])')];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !layer.contains(document.activeElement) || document.activeElement === layer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === 'Escape' && phase === 'swing') {
      event.preventDefault();
      phase = 'room';
      swingParty = null;
      render();
      focusPanel();
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
  const BLOCKING = '.dialog-layer, .event-layer, .ev-phone, .menu-layer, .screenwall-layer';
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
