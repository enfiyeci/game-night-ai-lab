// Game › Sound and music (owner pick 6A, 2026-09-26; moved from Company by pick 3B): one dialog with two tabs. Sound has on/off and
// a volume for music and for sound effects, and the track now playing; Credits holds the licence lines
// both music sources require inside the game, word for word as ui/assets/music/README.md records them.
import { openDialog } from '../components/dialog.js';
import { registerMenuHandler } from '../menu.js';
import { music } from '../music.js';
import { sfx } from '../sfx.js';

// Copied from ui/assets/music/README.md, which records where each line came from.
const CREDITS = [
  ['Music', [
    '"Wallpaper" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/',
    '"Bossa Antigua" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/',
    '"City of Tomorrow", "Corporate Ladder", "Network", "Technoscape", "Future Business" by Eric Matyas www.soundimage.org',
  ]],
  ['Sound effects', ['Made in the browser as the game runs.']],
  ['Type', ['Nunito and Libre Baskerville, SIL Open Font License.']],
];

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// One row: a label, an on/off switch and a volume slider for one kind of sound.
function channelRow({ id, label, channel, onChange }) {
  const row = make('div', 'sound-row');
  const name = make('label', 'sound-name', label);
  name.htmlFor = `${id}-volume`;
  const toggle = make('button', 'sound-switch');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', `${label} on`);
  const slider = make('input', 'sound-slider');
  Object.assign(slider, { type: 'range', min: '0', max: '100', step: '5', id: `${id}-volume` });
  const value = make('span', 'sound-value');

  const render = () => {
    toggle.setAttribute('aria-pressed', `${channel.enabled}`);
    toggle.classList.toggle('on', channel.enabled);
    slider.value = `${Math.round(channel.volume * 100)}`;
    slider.disabled = !channel.enabled;
    slider.style.setProperty('--fill', `${Math.round(channel.volume * 100)}%`);
    value.textContent = `${Math.round(channel.volume * 100)}%`;
  };
  toggle.addEventListener('click', () => {
    channel.enabled = !channel.enabled;
    render();
    onChange?.();
  });
  slider.addEventListener('input', () => {
    channel.volume = Number(slider.value) / 100;
    render();
    onChange?.();
  });
  row.append(name, toggle, slider, value);
  render();
  return row;
}

function soundTab() {
  const tab = make('div', 'sound-tab');
  const nowPlaying = make('div', 'sound-now');
  const text = make('div');
  const next = make('button', 'dialog-back sound-next', 'Next track');
  next.type = 'button';
  next.addEventListener('click', () => music.skip());
  const renderNow = () => {
    const track = music.current;
    text.replaceChildren(make('div', 'sound-kicker', 'Now playing'));
    if (!track) text.append(make('b', null, 'Music starts with your first click'));
    else if (!music.enabled) text.append(make('b', null, 'Music is off'));
    else text.append(make('b', null, track.title), make('span', 'sound-by', `${track.artist} · ${track.licence}`));
    next.hidden = !track || !music.enabled;
  };
  nowPlaying.append(text, next);
  tab.append(
    channelRow({ id: 'sound-music', label: 'Music', channel: music, onChange: renderNow }),
    channelRow({ id: 'sound-effects', label: 'Sound effects', channel: sfx, onChange: () => { if (sfx.enabled) sfx.pop(4); else sfx.hush(); } }),
    nowPlaying,
    make('p', 'sound-note', 'Tracks shuffle. The music dips under release shows and stops during ending films.'),
  );
  renderNow();
  return { tab, stop: music.subscribe(renderNow) };
}

function creditsTab() {
  const tab = make('div', 'sound-tab sound-credits');
  for (const [heading, lines] of CREDITS) {
    tab.append(make('div', 'sound-kicker', heading), ...lines.map((line) => make('p', null, line)));
  }
  return tab;
}

export function openSound(game, overlayRoot, { tab = 'sound' } = {}) {
  const body = make('div', 'sound-body');
  const tabs = make('div', 'sound-tabs');
  tabs.setAttribute('role', 'tablist');
  const sound = soundTab();
  const credits = creditsTab();
  const panels = { sound: sound.tab, credits };
  const buttons = Object.fromEntries(['sound', 'credits'].map((id) => {
    const button = make('button', 'sound-tabbtn', id === 'sound' ? 'Sound' : 'Credits');
    button.type = 'button';
    button.id = `sound-tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `sound-panel-${id}`);
    panels[id].id = `sound-panel-${id}`;
    panels[id].setAttribute('role', 'tabpanel');
    panels[id].setAttribute('aria-labelledby', button.id);
    button.addEventListener('click', () => show(id));
    tabs.append(button);
    return [id, button];
  }));
  function show(id) {
    for (const [key, button] of Object.entries(buttons)) {
      button.setAttribute('aria-selected', `${key === id}`);
      button.tabIndex = key === id ? 0 : -1;
      panels[key].hidden = key !== id;
    }
  }
  body.append(tabs, sound.tab, credits);
  show(tab);

  let layer;
  const done = () => layer?.close();
  layer = openDialog(overlayRoot, {
    title: 'Sound and music',
    body,
    okLabel: 'Done',
    onOk: done,
    onCancel: () => {},
  });
  layer.querySelector('.dialog-centre')?.classList.add('sound-dialog');
  overlayRoot.addEventListener('gdt-dialog-closed', () => sound.stop(), { once: true });
  return layer;
}

export function mountSound(game, overlayRoot) {
  const unregister = [
    registerMenuHandler('sound', () => openSound(game, overlayRoot)),
    registerMenuHandler('credits', () => openSound(game, overlayRoot, { tab: 'credits' })), // Game › Credits (pick 3B)
  ];
  return () => unregister.forEach((fn) => fn());
}
