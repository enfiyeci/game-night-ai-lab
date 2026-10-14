// An advisor explaining a screen from inside it (ui/logic/explainers.js): the recipe briefing's grammar, a face, a
// small name label and plain speech. `screenHelp` is the dialog header's "?" that brings the explanation back.
import { lead } from '../../sim/leads.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { portrait } from './portraits.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Only one dialog is open at a time, so one id serves the "?" button's aria-controls.
const EXPLAINS_ID = 'advisor-explains';

// The screen's explanation, hidden unless `shown`, in the voice of whoever the player hired for that seat.
export function advisorExplains(advisor, text, shown, state) {
  const profile = lead(state, advisor);
  const root = element('section', 'advisor-explains');
  root.id = EXPLAINS_ID;
  root.setAttribute('aria-label', `${profile.name} explains this screen`);
  root.hidden = !shown;
  const face = element('span', 'advisor-explains-face');
  face.innerHTML = portrait(profile.look, 34, 'flat');
  const words = element('div');
  words.append(element('b', '', `${profile.name} · ${profile.title}`), element('p', '', text));
  root.append(face, words);
  return root;
}

// One line under the tabs about the tab on show.
export function advisorTabLine(advisor, text) {
  const line = element('p', 'advisor-tabline');
  line.append(element('b', '', ADVISOR_TITLE[advisor]), document.createTextNode(` ${text}`));
  return line;
}

// The "?" in a dialog's header: shows or hides the explanation in place; onToggle(shown) keeps it for the next tab.
// A view that redraws its body (the books) makes a new explanation, so the button looks it up on every click.
export function screenHelp(dialogLayer, onToggle) {
  const panel = dialogLayer.querySelector('.dlg');
  const note = () => dialogLayer.querySelector('.advisor-explains');
  if (!panel || !note()) return null;
  const button = element('button', 'screen-help', '?');
  button.type = 'button';
  button.setAttribute('aria-label', 'How to read this screen');
  button.setAttribute('aria-controls', EXPLAINS_ID);
  const sync = () => {
    button.setAttribute('aria-expanded', `${!note().hidden}`);
    button.classList.toggle('on', !note().hidden);
  };
  button.addEventListener('click', () => {
    const shown = note().hidden;
    note().hidden = !shown;
    sync();
    onToggle?.(shown);
  });
  sync();
  panel.append(button);
  return button;
}
