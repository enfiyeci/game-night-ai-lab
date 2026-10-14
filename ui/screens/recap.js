// The Daily Token's era-in-review front page (owner pick RC, ported from the mockup's recapC; each story opens RA2's
// "what this was about" panel). It opens when an era ends, after the board meeting and before moving day
// (ui/screens/eraTransition.js), and its button turns the page to moving day. The model is ui/logic/recap.js.
import { openDialog } from '../components/dialog.js';
import { portrait } from '../components/portraits.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// One column's story (a button) and its explanation panel, which opens under the three columns at full width with a
// notch pointing up at its story, so the page grows by a few lines rather than by a column's height.
function story(item, index, count, toggle) {
  const column = el('div', 'rc-col');
  const button = el('button', 'rc-story');
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `rc-explain-${index}`);
  // A button holds phrasing content only, so the column's headline and story are spans styled as blocks.
  button.append(el('span', 'rc-head', item.head));
  if (item.auto) button.append(el('span', 'rc-auto', item.auto));
  button.append(el('span', 'rc-body', item.story));
  button.append(el('span', `rc-tag rc-${item.verdict}`, item.verdictWord));
  button.addEventListener('click', () => toggle(index));
  column.append(button);
  const panel = el('div', 'rc-explain');
  panel.id = `rc-explain-${index}`;
  panel.hidden = true;
  panel.style.setProperty('--notch', `${((index + 0.5) / Math.max(3, count)) * 100}%`);
  const about = el('p');
  about.append(el('b', null, `${item.explain.heading}. `));
  if (item.explain.about) about.append(document.createTextNode(item.explain.about));
  panel.append(about, el('p', 'rc-views', item.explain.lines.join(' ')));
  return { column, panel };
}

export function buildRecapLayer(model) {
  const layer = el('div', 'dialog-layer rc-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'rc-headline');
  layer.dataset.era = `${model.era}`;
  const veil = el('div', 'dialog-veil rc-veil');
  veil.setAttribute('aria-hidden', 'true');
  const stage = el('section', 'dialog-centre rc-stage');
  stage.tabIndex = -1;

  const page = el('article', 'rc-page');
  page.append(el('div', 'rc-mast', model.masthead));
  const dateline = el('div', 'rc-dl');
  for (const part of model.dateline) dateline.append(el('span', null, part));
  page.append(dateline);
  const headline = el('h1', 'rc-hl', model.headline);
  headline.id = 'rc-headline';
  page.append(headline, el('p', 'rc-dek', model.dek));

  const cols = el('div', 'rc-cols');
  const columns = [];
  const panels = [];
  const toggle = (index) => {
    columns.forEach((column, at) => {
      const open = at === index && panels[at].hidden;
      column.classList.toggle('open', open);
      panels[at].hidden = !open;
      column.querySelector('.rc-story').setAttribute('aria-expanded', `${open}`);
    });
    page.classList.toggle('rc-opened', panels.some((panel) => !panel.hidden));
  };
  model.stories.forEach((item, index) => {
    const { column, panel } = story({ ...item, verdictWord: model.verdictWords[item.verdict] }, index, model.stories.length, toggle);
    columns.push(column);
    panels.push(panel);
  });
  cols.append(...columns, ...panels);
  page.append(cols);

  const critics = el('div', 'rc-crit');
  for (const critic of model.critics) {
    const quote = el('div');
    quote.innerHTML = portrait(`advisor-${critic.role}`, 34, critic.mood);
    const words = el('span');
    words.append(el('b', null, `${critic.name} · ${critic.title}`), document.createTextNode(critic.text));
    quote.append(words);
    critics.append(quote);
  }
  page.append(critics);

  const foot = el('div', 'rc-foot');
  if (model.stories.length) foot.append(el('span', 'rc-hint', model.hint));
  const go = el('button', 'rc-go', model.next);
  go.type = 'button';
  foot.append(go);
  stage.append(page, foot);
  layer.append(veil, stage);
  return layer;
}

// Opens the page over the office; closing it (the button, or Escape) hands the stage back to the era transition.
export function openRecap(overlay, model) {
  const layer = openDialog(overlay, { build: () => buildRecapLayer(model) });
  const go = layer.querySelector('.rc-go');
  go.addEventListener('click', () => layer.close());
  go.focus();
  return layer;
}
