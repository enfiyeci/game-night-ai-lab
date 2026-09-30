// The Compute dialog's race tab (compute race spec §3). Mounted by ui/screens/computeInfo.js.
import { raceModel } from '../logic/race.js';
import { roundWord } from '../../sim/time.js';
import { computeAmount } from '../logic/format.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const SIZE_CLASS = { Small: 'small', Medium: 'medium', Large: 'large', XL: 'xl' };
const WORD_CLASS = { 'launch rumored soon': 'hot', 'training now': 'mine', 'no run yet': 'mine' };

export function raceTab(game) {
  const state = game.state;
  const model = raceModel(state);
  const body = element('div', 'compute-info-body race-tab');
  body.append(element('h6', '', `Who holds the frontier's compute this ${roundWord(state.era)}`));
  const bar = element('div', 'race-share');
  let rival = 0;
  for (const lab of model.shares) {
    // Rivals shade from dark to light by share; you are the one accent.
    const part = element('div', `race-share-part ${lab.you ? 'you' : `r${++rival}`}`);
    part.style.flexGrow = `${lab.share}`;
    part.title = `${lab.name}: ${Math.round(lab.share * 100)}%`;
    if (lab.share >= 0.08) part.append(element('b', '', `${Math.round(lab.share * 100)}%`), element('span', '', lab.name));
    bar.append(part);
  }
  body.append(bar);
  const table = element('table', 'race-table');
  const head = element('tr');
  for (const [label, cls] of [['Lab'], ['Score', 'n'], ['Compute', 'n'], ['Next model'], ['Word around town']]) head.append(element('th', cls, label));
  table.append(head);
  for (const row of model.rows) {
    const tr = element('tr', row.you ? 'you' : '');
    const compute = element('td', 'n');
    compute.append(element('b', '', computeAmount(Math.round(row.compute), state.era)), element('small', '', row.computeNote));
    const size = element('td');
    size.append(element('span', `race-size ${SIZE_CLASS[row.size] ?? 'none'}`, row.size));
    const word = element('td');
    word.append(element('span', `race-word ${WORD_CLASS[row.word] ?? ''}`, row.word));
    tr.append(element('td', '', row.name), element('td', 'n', `${Math.round(row.score)}`), compute, size, word);
    table.append(tr);
  }
  body.append(table);
  const boxes = element('div', 'race-boxes');
  const whyBox = element('div', 'race-box');
  const [lead, ...rest] = model.why.split('. ');
  whyBox.append(element('b', '', rest.length ? `${lead}.` : model.why));
  if (rest.length) whyBox.append(document.createTextNode(` ${rest.join('. ')}`));
  const endBox = element('div', 'race-box end');
  endBox.append(element('b', '', `At the ${roundWord(state.era)}'s end`));
  for (const line of model.roundEnd) endBox.append(element('p', '', line));
  boxes.append(whyBox, endBox);
  body.append(boxes);
  return { body, stacked: false };
}
