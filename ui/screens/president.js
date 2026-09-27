import { roundWord } from '../../sim/time.js';
import { registerMenuHandler } from '../menu.js';
import { enterTransition, exitTransition } from '../components/transition.js';
import {
  answersPayload,
  hatedWord,
  meetingFor,
  moodFor,
  patienceTrail,
} from '../logic/president.js';

let assetsPromise = null;
// Event cards, the phone and the screen wall sit above dialogs, so the scene waits for them too (as main.js blocked() does).
const BLOCKING = '.dialog-layer, .event-layer, .ev-phone, .screenwall-layer';
let nextPresidentId = 0;

// OWNER WRITES (placeholder)
const WHISPERS = [
  { min: 8, text: 'He likes you. Keep it short.' },
  { min: 5, text: 'He is getting restless. Plain words.' },
  { min: 1, text: 'He is checking his watch. No more long words.' },
];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      fetch('ui/assets/president.svg').then((response) => {
        if (!response.ok) throw new Error('could not load the President scene');
        return response.text();
      }),
      fetch('ui/assets/president-anchors.json').then((response) => {
        if (!response.ok) throw new Error('could not load the President scene anchors');
        return response.json();
      }),
    ]).then(([svg, anchors]) => ({ svg, anchors })).catch((error) => {
      assetsPromise = null;
      throw error;
    });
  }
  return assetsPromise;
}

function whisperFor(patience) {
  return WHISPERS.find((entry) => patience >= entry.min)?.text ?? '';
}

function focusable(root) {
  return [...root.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.closest('[hidden]'));
}

export async function openPresident(game, overlayRoot, options = {}) {
  const meeting = meetingFor(game.state);
  if (!meeting || game.state.ending || !overlayRoot || overlayRoot.querySelector(BLOCKING)) return null;
  const { svg, anchors } = await loadAssets();
  if (!game.state.meeting || game.state.meeting.id !== meeting.id || game.state.ending
    || overlayRoot.querySelector(BLOCKING)) return null;

  const previousFocus = document.activeElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const advanceDelay = reducedMotion ? 150 : 1200;
  const picked = Array.isArray(options.picked)
    ? options.picked.slice(0, meeting.exchanges.length)
    : [];
  let current = Math.min(picked.length, meeting.exchanges.length - 1);
  let timer = null;
  let closed = false;

  const initialTrail = patienceTrail(game.state, picked);
  let patience = initialTrail.trail.at(-1) ?? game.state.meeting.patience;
  let walkedOutAt = initialTrail.walkedOutAt;
  let mood = moodFor(patience);

  const layer = el('div', 'dialog-layer pres-layer');
  const titleId = `president-title-${++nextPresidentId}`;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', titleId);
  layer.tabIndex = -1;

  const art = el('div', 'pres-art');
  art.innerHTML = svg;
  const scene = art.querySelector('svg');
  scene.dataset.mood = mood;

  const bubble = el('section', 'pres-pbub');
  bubble.style.width = '440px';
  const bubbleHeader = el('div', 'pres-hdr');
  const who = el('span', 'pres-who', 'The President');
  who.id = titleId;
  const patienceDots = el('span', 'pres-pat');
  const prompt = el('div', 'pres-say');
  bubbleHeader.append(who, patienceDots);
  bubble.append(bubbleHeader, prompt);

  const whisper = el('aside', 'pres-sb');
  whisper.style.width = '250px';
  whisper.hidden = true;
  const whisperLabel = el('b', null, 'Policy and Comms');
  const whisperText = el('div', 'pres-say');
  whisper.append(whisperLabel, whisperText);

  const tag = el('div', 'pres-tagf');
  tag.hidden = true;

  const answerBox = el('section', 'pres-ansbox');
  answerBox.style.width = '680px';

  layer.append(art, bubble, whisper, tag, answerBox);

  const close = () => {
    if (closed) return;
    closed = true;
    if (timer !== null) clearTimeout(timer);
    exitTransition(layer).then(() => {
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
      overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    });
  };
  Object.defineProperty(layer, 'close', { value: close });

  function positionBubble() {
    const head = anchors.president[mood] ?? anchors.president.uneasy;
    bubble.style.left = `${head[0] + 84}px`;
    bubble.style.top = `${head[1] + 60 - bubble.offsetHeight}px`;
  }

  function positionWhisper() {
    const [x, y] = anchors.policy;
    whisper.style.left = `${x - 68}px`;
    whisper.style.top = `${y - 150 - whisper.offsetHeight}px`;
  }

  function renderPatience() {
    patienceDots.replaceChildren();
    patienceDots.setAttribute('role', 'img');
    const filled = Math.max(0, Math.min(patience, 10));
    patienceDots.setAttribute('aria-label', `Patience ${filled} of 10`);
    for (let index = 0; index < 10; index += 1) {
      const dot = el('i', index < filled ? '' : 'gone');
      dot.setAttribute('aria-hidden', 'true');
      patienceDots.append(dot);
    }
  }

  function setMood(nextMood) {
    mood = nextMood;
    scene.dataset.mood = mood;
    positionBubble();
  }

  function showWhisper(text, alarmed = false) {
    whisper.hidden = !text;
    if (!text) return;
    whisperLabel.textContent = alarmed ? 'Policy and Comms · alarmed' : 'Policy and Comms';
    whisperText.textContent = text;
    positionWhisper();
  }

  function showTag(answer) {
    const word = hatedWord(answer);
    tag.hidden = !word;
    if (!word) return;
    tag.textContent = `He did not like “${word}”`;
    tag.style.left = '150px';
    tag.style.top = '470px';
  }

  function stepBars() {
    const steps = el('span', 'pres-steps');
    steps.setAttribute('aria-label', `Question ${current + 1} of ${meeting.exchanges.length}`);
    meeting.exchanges.forEach((_, index) => {
      const step = el('i', index <= current ? 'on' : '');
      step.setAttribute('aria-hidden', 'true');
      steps.append(step);
    });
    return steps;
  }

  function errorView(error) {
    answerBox.replaceChildren();
    const top = el('div', 'pres-top');
    top.append(el('span', 'pres-kick', 'You could not meet him'));
    const message = el('p', 'pres-finish', error);
    message.setAttribute('role', 'alert');
    const back = el('button', 'pres-back', 'Back');
    back.type = 'button';
    back.addEventListener('click', close);
    answerBox.append(top, message, back);
    back.focus();
  }

  function queueMeeting() {
    // Actions apply at once, so setField would flush the answers before the move arrives.
    game.queue.presidentAnswers = answersPayload(meeting, picked);
    const result = game.addMove({ type: 'meeting' });
    if (!result.ok && !result.events?.some((event) => event.type === 'meetingOutcome')) {
      delete game.queue.presidentAnswers;
      const message = result.error[0].toUpperCase() + result.error.slice(1);
      errorView(message);
      return;
    }
    close();
  }

  function finishView(message) {
    answerBox.replaceChildren();
    const top = el('div', 'pres-top');
    top.append(el('span', 'pres-kick', 'Your answer'), stepBars());
    const text = el('p', 'pres-finish', message);
    const proceed = el('button', 'btn pres-continue', 'Continue');
    proceed.type = 'button';
    proceed.addEventListener('click', queueMeeting);
    answerBox.append(top, text, proceed);
    proceed.focus();
  }

  function walkOut() {
    setMood('gone');
    bubble.hidden = true;
    whisper.hidden = true;
    finishView('He walked out.');
  }

  function advance() {
    timer = null;
    if (walkedOutAt !== null) {
      walkOut();
      return;
    }
    if (picked.length >= meeting.exchanges.length) {
      finishView('The meeting is over.');
      return;
    }
    current = picked.length;
    renderExchange();
  }

  function pickAnswer(answer, buttons) {
    if (timer !== null || walkedOutAt !== null) return;
    layer.focus();
    answerBox.querySelector('.pres-later')?.remove();
    buttons.forEach((button) => { button.disabled = true; });
    picked.push(answer.id);
    const result = patienceTrail(game.state, picked);
    patience = result.trail.at(-1);
    walkedOutAt = result.walkedOutAt;
    renderPatience();
    setMood(walkedOutAt === null ? moodFor(patience) : 'uneasy');
    showTag(answer);
    showWhisper(walkedOutAt === null ? whisperFor(patience) : '', patience < 5);
    timer = setTimeout(advance, advanceDelay);
  }

  function renderExchange() {
    const exchange = meeting.exchanges[current];
    prompt.textContent = exchange.prompt;
    renderPatience();
    positionBubble();

    answerBox.replaceChildren();
    const top = el('div', 'pres-top');
    top.append(el('span', 'pres-kick', 'Your answer'));
    if (picked.length === 0) {
      const later = el('div', 'pres-later');
      const notNow = el('button', 'pres-not-now', 'Not now');
      notNow.type = 'button';
      notNow.addEventListener('click', close);
      later.append(el('span', null, `He leaves if you have not met him by the end of the ${roundWord(game.state.era)}.`), notNow);
      top.append(later);
    }
    top.append(stepBars());
    const answers = el('div', 'pres-answers');
    const buttons = exchange.answers.map((answer, index) => {
      const button = el('button', 'pres-ans');
      button.type = 'button';
      const key = el('span', 'pres-key', `${index + 1}`);
      key.setAttribute('aria-hidden', 'true');
      button.append(key, el('span', 'pres-label', answer.text));
      button.addEventListener('click', () => pickAnswer(answer, buttons));
      answers.append(button);
      return button;
    });
    answerBox.append(top, answers);
    buttons[0]?.focus();
  }

  layer.addEventListener('keydown', (event) => {
    if (event.repeat && event.key !== 'Tab') {
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      if (picked.length === 0) {
        event.preventDefault();
        close();
      }
      return;
    }
    if (event.key === 'Tab') {
      const items = focusable(layer);
      const first = items[0];
      const last = items.at(-1);
      if (!first) {
        event.preventDefault();
        layer.focus();
      } else if (!items.includes(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    const buttons = [...answerBox.querySelectorAll('.pres-ans:not([disabled])')];
    if (/^[1-9]$/u.test(event.key)) {
      const button = buttons[Number(event.key) - 1];
      if (button) {
        event.preventDefault();
        button.click();
      }
      return;
    }
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    if (buttons.length === 0) return;
    const at = buttons.indexOf(document.activeElement);
    let next = at;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (at + 1) % buttons.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (at - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else next = buttons.length - 1;
    event.preventDefault();
    buttons[next].focus();
  });

  layer.addEventListener('mousedown', (event) => {
    if (!event.target.closest('button, input')) event.preventDefault();
  }, true);

  overlayRoot.append(layer);
  if (picked.length > 0) {
    const previousAnswer = meeting.exchanges[picked.length - 1]?.answers.find((answer) => (
      answer.id === picked[picked.length - 1]
    ));
    showTag(previousAnswer);
    showWhisper(walkedOutAt === null ? whisperFor(patience) : '', patience < 5);
  } else if (game.state.meeting.grudges?.length) {
    showWhisper(`He remembers your promise: “${game.state.meeting.grudges[0]}”`);
  }

  if (walkedOutAt !== null) walkOut();
  else if (picked.length >= meeting.exchanges.length) {
    finishView('The meeting is over.');
  } else renderExchange();
  enterTransition(layer);
  return layer;
}

export function mountPresident(game, overlayRoot) {
  let pending = false;
  let frame = null;
  loadAssets().catch((error) => console.error(error));

  const schedule = () => {
    if (!pending || frame !== null) return;
    frame = requestAnimationFrame(async () => {
      frame = null;
      if (!pending || overlayRoot.querySelector(BLOCKING)) return;
      try {
        const opened = await openPresident(game, overlayRoot);
        if (opened || !game.state.meeting) pending = false;
      } catch (error) {
        pending = false;
        console.error(error);
      }
    });
  };

  const unregister = registerMenuHandler('meeting', () => {
    openPresident(game, overlayRoot).catch((error) => console.error(error));
  });
  const unsubscribe = game.subscribe(({ events }) => {
    if (!events.some((event) => event.type === 'meetingDue')) return;
    pending = true;
    schedule();
  });
  // Retry whenever the overlay changes: dialogs, event cards and the phone all close by leaving it.
  const observer = new MutationObserver(() => schedule());
  observer.observe(overlayRoot, { childList: true, subtree: true });

  return () => {
    unregister();
    unsubscribe();
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  };
}
