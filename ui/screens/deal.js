// The Geneva deal in play: the deal pill under the clock, Jules's suspicions with the verb the agreed checks allow,
// and what happened when someone was caught. Breaking the deal yourself happens in the run and release screens.
import { dealBinds } from '../../sim/summit.js';
import { PARTY_INFO, partyBadge } from './summit.js';
import { enterTransition, exitTransition } from '../components/transition.js';

const VERBS = Object.freeze(['Accuse them in public', 'Demand their report', 'Ask the testers', 'Send the inspectors']);
const SIGNS = Object.freeze({
  openbrain: 'OpenBrain just booked every spare GPU in Iowa. Could be a sale. Could be a very big run.',
  deepthink: 'DeepThink’s benchmark scores jumped overnight. Nobody jumps like that on a small run.',
  qilin: 'Qilin’s power draw is up 40% this week. Could be a heatwave. Could be a very big run.',
  lodestar: 'Lodestar went quiet and cancelled its testers’ visit. Lodestar never goes quiet.',
});

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const name = (id) => PARTY_INFO[id]?.name ?? id;

// A switch for the last stage of a training run while the cap binds. Returns null when there is no cap.
export function genevaCapRow(state) {
  if (!dealBinds(state, 'computeCap')) return null;
  const panel = document.createElement('section');
  panel.className = 'gp dl-cap-panel';
  panel.innerHTML = `<div class="hd">The Geneva deal</div><label class="dl-cap"><input type="checkbox" id="dl-break-cap"><span><b>Run past the cap</b>
    <small>No ceiling on this run. It breaks the deal, and the agreed checks may catch it.</small></span></label>`;
  return panel;
}

function pill(state, dismissedIds) {
  const deal = state.deal;
  const signers = [...new Set(Object.values(deal.signed).flat())];
  const seals = ['you', ...signers].map((id) => partyBadge(id, true)).join('')
    + deal.expelled.map((id) => `<span class="dl-out">${partyBadge(id, true)}</span>`).join('');
  const status = deal.collapsed ? 'collapsed' : deal.playerShipped ? 'you broke it' : deal.expelled.length ? `holding, ${deal.expelled.length} out` : 'holding';
  const waiting = (deal.suspicions ?? []).filter((s) => dismissedIds.has(s.id)).length;
  return `<span>Geneva deal</span><span class="dl-seals">${seals}</span><small>${esc(status)}</small>${waiting ? `<span class="dl-waiting">${waiting}</span>` : ''}`;
}

export function mountDeal(game, overlayRoot) {
  const pillNode = document.createElement('button');
  pillNode.type = 'button';
  pillNode.className = 'dl-pill';
  pillNode.setAttribute('aria-label', 'Geneva deal: show warnings you set aside');
  pillNode.addEventListener('click', () => {
    dismissed.clear();
    render();
  });
  overlayRoot.append(pillNode);
  const bubbles = document.createElement('div');
  bubbles.className = 'dl-bubbles';
  overlayRoot.append(bubbles);
  const dismissed = new Set();
  const queue = [];
  let heads = null;
  fetch('ui/assets/anchors-era5.json').then((r) => r.json()).then((a) => { heads = a.heads; render(); }).catch(() => {});

  function render() {
    const state = game.state;
    if (!state.deal || state.ending) {
      pillNode.hidden = true;
      bubbles.replaceChildren();
      return;
    }
    pillNode.hidden = false;
    pillNode.innerHTML = pill(state, dismissed);
    const open = (state.deal.suspicions ?? []).filter((s) => !dismissed.has(s.id));
    const [x, y] = heads?.policy ?? [355, 380];
    bubbles.innerHTML = open.slice(0, 1).map((s) => {
      const signedCards = state.deal.proposals.filter((c) => (state.deal.signed[c] ?? []).includes(s.party));
      const level = Math.max(0, ...signedCards.map((c) => state.deal.checks[c] ?? 1));
      const days = Math.max(0, s.dueAt - state.day);
      return `<div class="ev-bubble dl-bubble" style="left:${x - 33}px;top:${y - 205}px;width:300px;--tail:26px">
        <b>Jules · Policy and Comms</b><div class="ev-say">${esc(SIGNS[s.party] ?? `${name(s.party)} is acting strangely.`)}</div>
        <div class="ev-due"><span>Goes cold in about ${days} day${days === 1 ? '' : 's'}</span><div class="ev-due-bar"><i style="width:${Math.round((days / 5) * 100)}%"></i></div></div>
        <div class="ev-row"><button type="button" class="ev-act" data-investigate="${s.id}">${esc(VERBS[level])}</button><button type="button" class="ev-act ghost" data-dismiss="${s.id}">Not now</button></div>
      </div>`;
    }).join('');
  }

  bubbles.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.dismiss) {
      dismissed.add(button.dataset.dismiss); // the deal pill shows a count and brings it back
      render();
      return;
    }
    if (button.dataset.investigate) game.setField('investigate', [button.dataset.investigate]);
  });

  function outcome(event) {
    if (event.type === 'dealBreakCaught') {
      return { title: `${name(event.party)} broke the Geneva deal, and got caught`, lines: [
        'The checks caught it before the run paid off.',
        `${name(event.party)} is out of the deal. ${event.collapsed ? "The last coalition is gone: the deal collapses." : "Remaining commitments need another lab and a government to keep holding."}`,
        'You pushed for the checks, and the public noticed: trust in your lab goes up.',
      ] };
    }
    if (event.type === 'investigated' && event.found) {
      return { title: `${name(event.party)} broke the Geneva deal, and got caught`, lines: [
        `${name(event.party)} scraps the run. The lead it bought is gone.`,
        `${name(event.party)} is out of the deal. ${event.collapsed ? "The last coalition is gone: the deal collapses." : "Remaining commitments need another lab and a government to keep holding."}`,
        'You pushed for the checks, and the public noticed: trust in your lab goes up.',
      ] };
    }
    if (event.type === 'investigated' && !event.insulted) {
      return { title: `Nothing found at ${name(event.party)}`, lines: ['The trail went cold before anyone could prove it.', 'Jules: “Could be nothing. Could be very good at hiding things.”'] };
    }
    if (event.type === 'investigated') {
      return { title: `Nothing found at ${name(event.party)}`, lines: event.level === 0
        ? ['You accused them in public with no proof. The public noticed, and not kindly.', `${name(event.party)} is insulted, and likelier to cut corners now.`]
        : [`${name(event.party)} is insulted, and likelier to cut corners now.`, 'Jules: “We looked. That is the job. They will get over it. Probably.”'] };
    }
    if (event.type === 'playerCaught') {
      return { title: 'You were caught breaking the Geneva deal', lines: [
        'The deal collapses for everyone.', 'Public trust and the West’s favor drop.', 'Every lab is racing again.',
      ] };
    }
    if (event.type === 'dealCollapsed' && event.reason === 'noCoalition') {
      return { title: 'The Geneva coalition has fallen apart', lines: ['No binding commitment still has both a rival lab and a government behind it.', 'The caps are lifted. A negotiated pace is no longer available from this agreement.'] };
    }
    if (event.type === 'presidentAngry') {
      return { title: 'The President saw the inspection line', lines: ['“China inspecting us? A disaster. A total disaster.”', 'The West’s favor drops.'] };
    }
    return null;
  }

  function showNext() {
    if (!queue.length || overlayRoot.querySelector('.dialog-layer, .event-layer, .ev-phone, .screenwall-layer')) return;
    const card = queue.shift();
    const layer = document.createElement('div');
    layer.className = 'dialog-layer dl-layer';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', card.title);
    layer.innerHTML = `<section class="gp dl-card"><div class="sm-kick">The Geneva deal</div><h2>${esc(card.title)}</h2>
      <div class="dl-lines">${card.lines.map((line) => `<div><i>•</i>${esc(line)}</div>`).join('')}</div>
      <div class="sm-actions"><button type="button" class="btn">Continue</button></div></section>`;
    layer.querySelector('button').addEventListener('click', () => {
      exitTransition(layer).then(() => overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed')));
    });
    overlayRoot.append(layer);
    enterTransition(layer);
    layer.querySelector('button').focus();
  }

  game.subscribe(({ events }) => {
    for (const event of events) {
      const card = outcome(event);
      if (card) queue.push(card);
    }
    render();
    requestAnimationFrame(showNext);
  });
  new MutationObserver(() => requestAnimationFrame(showNext)).observe(overlayRoot, { childList: true });
  render();
}
