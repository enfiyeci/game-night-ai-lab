import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { opinions, powerSitesAvailable, projectQueue, sitesView } from '../logic/compute.js';
import { computeAmount, money, roundsToWords } from '../logic/format.js';
import { roundWord } from '../../sim/time.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function siteArt(source) {
  const art = element('div', 'site-art');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 220 140');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', source === 'gas' ? 'Gas turbine site' : source === 'nuclear' ? 'Nuclear restart site' : 'Gulf sovereign campus');
  const ground = `
    <polygon points="32,80 128,135 204,91 108,35" fill="color-mix(in oklab, var(--cream) 78%, var(--ink))" stroke="var(--ink)" stroke-opacity=".3"/>
    <polygon points="32,80 128,135 128,128 32,73" fill="color-mix(in oklab, var(--cream) 62%, var(--ink))"/>
    <polygon points="204,91 128,135 128,128 204,84" fill="color-mix(in oklab, var(--cream) 50%, var(--ink))"/>`;
  const gas = `
    <g fill="color-mix(in oklab, var(--ink) 22%, var(--paper))" stroke="var(--ink)" stroke-opacity=".35">
      <polygon points="52,61 103,90 118,81 67,52"/><polygon points="83,45 134,74 149,65 98,36"/>
      <path d="M112 67v39a7 3 0 0 0 14 0V67z"/><ellipse cx="119" cy="67" rx="7" ry="3" fill="color-mix(in oklab, var(--ink) 60%, var(--paper))"/>
      <path d="M145 49v39a7 3 0 0 0 14 0V49z"/><ellipse cx="152" cy="49" rx="7" ry="3" fill="color-mix(in oklab, var(--ink) 60%, var(--paper))"/>
    </g><g fill="var(--paper)" opacity=".75"><circle cx="158" cy="38" r="7"/><circle cx="166" cy="29" r="9"/><circle cx="159" cy="20" r="6"/></g>`;
  const nuclear = `
    <polygon points="139,82 164,97 185,85 160,70" fill="color-mix(in oklab, var(--paper) 90%, var(--cream))" stroke="var(--ink)" stroke-opacity=".3"/>
    <path d="M73 78C84 48 88 31 84 16h35c-4 15 0 32 11 62a29 10 0 0 1-57 0z" fill="color-mix(in oklab, var(--paper) 90%, var(--cream))" stroke="var(--ink)" stroke-opacity=".35"/>
    <ellipse cx="101" cy="16" rx="18" ry="6" fill="color-mix(in oklab, var(--ink) 55%, var(--paper))"/>
    <g fill="var(--paper)" opacity=".75"><circle cx="107" cy="9" r="6"/><circle cx="116" cy="5" r="7"/></g>`;
  const gulf = `
    <circle cx="47" cy="31" r="17" fill="color-mix(in oklab, var(--wood) 45%, var(--paper))"/>
    <polygon points="55,68 137,115 158,103 76,56" fill="color-mix(in oklab, var(--paper) 92%, var(--cream))" stroke="var(--ink)" stroke-opacity=".3"/>
    <polygon points="91,48 173,95 190,85 108,38" fill="color-mix(in oklab, var(--paper) 92%, var(--cream))" stroke="var(--ink)" stroke-opacity=".3"/>
    <g fill="color-mix(in oklab, var(--ink) 24%, var(--paper))"><rect x="91" y="55" width="9" height="9" transform="rotate(30 91 55)"/><rect x="111" y="67" width="9" height="9" transform="rotate(30 111 67)"/><rect x="131" y="79" width="9" height="9" transform="rotate(30 131 79)"/></g>`;
  svg.innerHTML = ground + (source === 'gas' ? gas : source === 'nuclear' ? nuclear : gulf);
  art.append(svg);
  return art;
}

function sitesPanel(view, era) {
  const root = element('div', 'your-sites');
  if (view.sites.length === 0) root.append(element('p', 'sites-empty', 'No power sites yet. Chips that need a site will stay dark.'));
  for (const site of view.sites) {
    const row = element('div', 'your-site');
    const top = element('div', 'r1');
    top.append(element('span', '', `${site.name} · ${site.source}`), element('span', '', computeAmount(site.units, era)));
    const progress = element('div', 'site-progress');
    const fill = element('i', site.progress < 1 ? 'building' : '');
    fill.style.width = `${site.progress * 100}%`;
    progress.append(fill);
    row.append(top, element('div', 'r2', site.status), progress);
    if (site.warning) {
      const warning = element('div', 'site-warning');
      warning.append(element('span', 'bang', '!'), element('span', '', site.warning));
      row.append(warning);
    }
    root.append(row);
  }
  const total = element('div', 'site-total');
  total.append(element('span', '', 'Power online'), element('b', '', computeAmount(view.powerOnline, era)));
  root.append(total);
  if (view.nextArrival) {
    const future = element('div', 'site-total compact');
    future.append(
      element('span', '', `Power in ${roundsToWords(era, view.nextArrival.turns)}`),
      element('b', '', computeAmount(view.powerOnline + view.nextArrival.units, era)),
    );
    root.append(future);
  }
  return root;
}

export function openPowerSites(game, overlayRoot) {
  if (!powerSitesAvailable(game.state)) return null;
  const state = projectQueue(game.state, game.queue);
  const view = sitesView(state);
  let selected = view.options.find((option) => !option.disabled)?.source ?? '';
  const body = element('div', 'power-body');
  const meter = element('div', 'power-meter');
  const top = element('div', 'power-meter-top');
  const headline = element('div');
  headline.append(
    element('b', '', computeAmount(view.powerOnline, state.era)),
    document.createTextNode(` of power for ${computeAmount(view.chipsNeedingPower, state.era)} of chips`),
  );
  top.append(headline, element('div', 'unpowered-copy', `${computeAmount(view.unpowered, state.era)} unpowered · still billed ${money(view.unpoweredBill)}/mo`));
  const track = element('div', 'power-track');
  track.setAttribute('aria-label', 'Power available against chips contracted');
  const total = Math.max(1, view.chipsNeedingPower, view.powerOnline + (view.nextArrival?.units ?? 0));
  const powered = element('div', 'powered', `Powered · ${computeAmount(Math.min(view.powerOnline, view.chipsNeedingPower), state.era)}`);
  powered.style.flex = `${Math.min(view.powerOnline, view.chipsNeedingPower)} 1 0%`;
  const dark = element('div', 'dark');
  dark.style.flex = `${view.unpowered} 1 0%`;
  if (view.unpowered) dark.append(element('span', '', `Dark · ${computeAmount(view.unpowered, state.era)}`));
  const empty = element('div', 'empty');
  empty.style.flex = `${Math.max(0, total - view.chipsNeedingPower)} 1 0%`;
  track.append(powered, dark, empty);
  const powerLine = element('i', 'power-line');
  powerLine.style.left = `${Math.min(100, (view.powerOnline / total) * 100)}%`;
  powerLine.append(element('em', '', 'Power line'));
  track.append(powerLine);
  if (view.nextArrival) {
    const future = element('i', 'power-future');
    future.style.left = `${Math.min(100, ((view.powerOnline + view.nextArrival.units) / total) * 100)}%`;
    future.append(element('em', '', `${view.nextArrival.name} online in ${roundsToWords(state.era, view.nextArrival.turns)}`));
    track.append(future);
  }
  const legend = element('div', 'power-legend');
  for (const [kind, label] of [['powered', 'Chips with power'], ['dark', 'Chips without power (striped, billed)'], ['future', 'Site arriving (dashed)']]) {
    const item = element('span');
    item.append(element('i', kind), document.createTextNode(label));
    legend.append(item);
  }
  meter.append(top, track, legend);

  const heading = element('div', 'compute-section', 'Build a new site');
  const grid = element('div', 'site-options');
  const buttons = [];
  for (const option of view.options) {
    const button = element('button', `site-option${option.source === selected ? ' selected' : ''}`);
    button.type = 'button';
    button.dataset.source = option.source;
    button.disabled = option.disabled;
    button.setAttribute('aria-pressed', `${option.source === selected}`);
    if (option.source === selected) button.append(element('span', 'company-selected', 'Selected'));
    const name = element('div', 'site-name');
    name.append(element('strong', '', option.name), element('b', '', computeAmount(option.units, state.era)));
    const details = element('div', 'site-kv');
    details.append(
      element('span', '', 'Ready in'), element('b', '', option.readyIn),
      element('span', '', 'Lease'), element('b', '', `${money(option.lease)}/mo`),
      element('span', '', 'Upfront'), element('b', '', 'none'),
    );
    const tags = element('div', 'site-tags');
    for (const tag of option.tags) {
      let className = tag.includes('opposition') ? 'bad' : '';
      let text = tag;
      if (tag === 'Public trust') {
        className = option.source === 'nuclear' ? 'good' : 'bad';
        text = `${option.source === 'nuclear' ? '+' : '−'} Public trust`;
      }
      tags.append(element('span', className, text));
    }
    button.append(siteArt(option.source), name, details, tags);
    if (option.reason) button.append(element('div', 'site-lock', option.reason));
    button.addEventListener('click', () => {
      selected = option.source;
      for (const candidate of buttons) {
        const active = candidate.dataset.source === selected;
        candidate.classList.toggle('selected', active);
        candidate.setAttribute('aria-pressed', `${active}`);
        candidate.querySelector('.company-selected')?.remove();
        if (active) candidate.append(element('span', 'company-selected', 'Selected'));
      }
    });
    buttons.push(button);
    grid.append(button);
  }
  body.append(meter, heading, grid);
  const footer = element('div', 'company-footer');
  footer.append(element('div', 'company-footer-note', `Building uses 1 of your 2 team actions this ${roundWord(state.era)} · lease starts when it is online`));
  const right = sitesPanel(view, state.era);
  const error = element('div', 'dialog-error');
  body.append(error);
  let opened;
  opened = openDialog(overlayRoot, {
    title: 'Power sites',
    subtitle: 'Era 4 · The gigawatt race · chips only run where you have power',
    left: { title: 'Team', content: teamPanel(state, { opinions: opinions(state, 'power') }) },
    right: { title: 'Your sites', content: right },
    body,
    okLabel: 'Build',
    onOk() {
      if (!selected) {
        error.textContent = 'Choose an available site.';
        return;
      }
      const result = game.addMove({ type: 'buildSite', source: selected });
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The site could not be queued.';
    },
  });
  opened.classList.add('company-dialog', 'company-dialog-power');
  const ok = opened.querySelector('.dialog-ok');
  footer.append(ok);
  opened.querySelector('.dialog-body').append(footer);
  return opened;
}
