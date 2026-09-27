// The Compute button's screen (owner pick C1, 2026-09-26): where your units go this month, then where your models'
// capability puts you, and the race tab second. Rivals hold compute too (compute race plan).
import { openDialog } from '../components/dialog.js';
import { computeBar } from '../logic/compute.js';
import { computeAmount } from '../logic/format.js';
import { raceTab } from './race.js';
import { advisorExplains, advisorTabLine, screenHelp } from '../components/advisorSays.js';
import { COMPUTE_ADVISOR, COMPUTE_SEEN_KEY, COMPUTE_TAB_LINES, computeExplainer, firstOpen, pageStorage } from '../logic/explainers.js';

const PARTS = {
  training: { label: 'Training', say: 'Training your next model right now.' },
  idle: { label: 'Free for training', say: 'Idle until you start a run. You pay for these units anyway.' },
  safety: { label: 'Safety', say: 'Checks and alignment work. You set the share in the compute split.' },
  serving: { label: 'Serving', say: 'Runs your released models for their users. Grows as users grow.' },
  control: { label: 'Watching your AI', say: 'Monitors your AI agents’ work.' },
};
const ORDER = ['training', 'idle', 'safety', 'serving', 'control'];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// `race` lets another screen supply the second tab's content: a function (game) => { body, stacked }.
export function openComputeInfo(game, overlayRoot, { view = 'where', race = raceTab } = {}) {
  const state = game.state;
  let opened;
  // Research explains the screen the first time it opens in this browser; the header's "?" brings her back.
  let explaining = firstOpen(pageStorage(), COMPUTE_SEEN_KEY);
  const withHelp = () => screenHelp(opened, (shown) => { explaining = shown; });

  // The CFO's explanation (hidden unless asked for), the tabs, then her one line on the tab on show.
  function tabs(current) {
    const row = element('div', 'finance-tabs');
    row.setAttribute('role', 'tablist');
    for (const [key, label] of [['where', 'Where it goes'], ['race', 'The race']]) {
      const tab = element('button', key === current ? 'on' : '', label);
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', `${key === current}`);
      tab.addEventListener('click', () => { if (key !== current) (key === 'race' ? showRace : showWhere)(); });
      row.append(tab);
    }
    const head = document.createDocumentFragment();
    head.append(advisorExplains(COMPUTE_ADVISOR, computeExplainer(state.era), explaining), row, advisorTabLine(COMPUTE_ADVISOR, COMPUTE_TAB_LINES[current]));
    return head;
  }

  function showWhere() {
    const bar = computeBar(state);
    const online = Math.max(0, bar.online);
    const segments = ORDER.map((key) => ({ key, units: bar.segments.find((s) => s.key === key)?.units ?? 0 })).filter((s) => s.units >= 0.5);
    const body = element('div', 'compute-info-body');
    body.append(tabs('where'));
    body.append(element('h6', '', `Where your ${Math.round(online)} units go this month`));
    const stack = element('div', 'compute-stack');
    const explain = element('div', 'compute-explain');
    if (online < 0.5) stack.append(element('span', 'compute-stack-empty', 'No compute online yet'));
    for (const seg of segments) {
      const part = element('div', `compute-part ${seg.key}`);
      part.style.flexGrow = `${seg.units}`;
      part.title = `${PARTS[seg.key].label}: ${Math.round(seg.units)} units`;
      if (seg.units / Math.max(1, online) > 0.12) part.append(element('b', '', `${Math.round(seg.units)}`), element('span', '', PARTS[seg.key].label));
      stack.append(part);
      const note = element('div', seg.key);
      note.append(element('b', '', `${PARTS[seg.key].label}, ${Math.round(seg.units)} units`), document.createTextNode(PARTS[seg.key].say));
      explain.append(note);
    }
    body.append(stack, explain);

    body.append(element('h6', '', 'Where that puts you · overall capability'));
    const labs = [{ name: 'You', capability: state.capability, you: true }, ...state.rivals.map((r) => ({ name: r.name, capability: r.capability }))]
      .sort((a, b) => b.capability - a.capability);
    const top = Math.max(1, ...labs.map((l) => l.capability));
    const ladder = element('div', 'compute-ladder');
    for (const lab of labs) {
      const row = element('div', lab.you ? 'you' : '');
      const track = element('span', 'compute-ladder-bar');
      const fill = element('i');
      fill.style.width = `${(lab.capability / top) * 100}%`;
      track.append(fill);
      row.append(element('span', '', lab.name), track, element('span', 'n', `${Math.round(lab.capability)}`));
      ladder.append(row);
    }
    body.append(ladder);
    const chain = element('div', 'compute-chain');
    ['More compute', 'bigger training runs', 'more capable models', 'a higher rank'].forEach((step, i) => {
      if (i) chain.append(element('span', 'a', '→'));
      chain.append(element('span', 's', step));
    });
    body.append(chain);

    opened = openDialog(overlayRoot, {
      title: 'Compute',
      subtitle: `${Math.round(online)} units online · capability is what ranks you`,
      body,
      okLabel: 'Close',
      onOk: () => opened.close(),
    });
    opened.classList.add('compute-info');
    withHelp();
  }

  function showRace() {
    const { body, stacked } = race(game);
    body.prepend(tabs('race'));
    opened = openDialog(overlayRoot, {
      title: 'Compute',
      subtitle: `Era ${state.era} · ${computeAmount(Math.round(state.compute.online), state.era)} online · who can train what, and who takes which deal`,
      body,
      okLabel: 'Close',
      onOk: () => opened.close(),
    });
    // Same size as the first tab, so switching tabs does not move the dialog.
    opened.classList.add('compute-info', 'compute-info-race');
    if (stacked) opened.classList.add('history-race-stacked');
    withHelp();
  }

  if (view === 'race') showRace();
  else showWhere();
  return opened;
}
