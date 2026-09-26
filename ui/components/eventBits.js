// Small DOM helpers shared by the event, briefing and feed screens (plan 2B Task 8).
const AVATAR_TONES = ['var(--teal)', 'var(--coral)', 'var(--sky)', 'var(--wood)'];
const anchorCache = new Map();

export function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function loadAnchors(era) {
  if (!anchorCache.has(era)) {
    anchorCache.set(era, fetch(`ui/assets/anchors-era${era}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
        return response.json();
      })
      .catch((error) => {
        anchorCache.delete(era);
        throw error;
      }));
  }
  return anchorCache.get(era);
}

export function post({ handle, text }) {
  const node = el('<div class="ev-post"><div class="ev-av" aria-hidden="true"></div><div><div class="ev-handle"></div><div class="ev-text"></div></div></div>');
  const letter = (handle.replace('@', '')[0] ?? '?').toUpperCase();
  const avatar = node.querySelector('.ev-av');
  avatar.textContent = letter;
  avatar.style.background = AVATAR_TONES[letter.charCodeAt(0) % AVATAR_TONES.length];
  node.querySelector('.ev-handle').textContent = handle;
  node.querySelector('.ev-text').textContent = text;
  return node;
}

function chip(text, kind) {
  const node = el(`<span class="ev-chip ${kind}"></span>`);
  node.textContent = text;
  return node;
}

export function choiceButton(choice) {
  const row = el('<button type="button" class="ev-choice"><span class="ev-choice-label"></span><span class="ev-choice-cost">Cost: <b></b></span><span class="ev-who"></span></button>');
  row.querySelector('.ev-choice-label').textContent = choice.label;
  row.querySelector('.ev-choice-cost b').textContent = choice.cost;
  const who = row.querySelector('.ev-who');
  if (choice.fallback) who.append(chip('If time runs out', 'idle'));
  for (const name of choice.backers) who.append(chip(`✓ ${name}`, 'for'));
  for (const name of choice.opposers) {
    const against = chip(name, 'against');
    against.setAttribute('aria-label', `${name} is against`);
    who.append(against);
  }
  return row;
}

export function dueBar(text, fraction, { calm = false } = {}) {
  const node = el(`<div class="ev-due${calm ? ' calm' : ''}"><span></span><div class="ev-due-bar"><i></i></div></div>`);
  node.querySelector('span').textContent = text;
  node.querySelector('i').style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  return node;
}

// A speech bubble whose tail points at a head anchor (K2 and E2 bubble grammar). root must be in the DOM.
export function bubbleAt(root, [x, y], { label, say, pick = null, width = 240, tail = 26, dy = -34, extra = null }) {
  const node = el('<div class="ev-bubble"><b></b><div class="ev-say"></div></div>');
  node.querySelector('b').textContent = label;
  node.querySelector('.ev-say').textContent = say;
  if (pick) {
    const picked = el('<span class="ev-pick"></span>');
    picked.textContent = `✓ ${pick}`;
    node.append(picked);
  }
  if (extra) node.append(extra);
  node.style.width = `${width}px`;
  node.style.setProperty('--tail', `${tail}px`);
  root.append(node);
  node.style.left = `${x - tail - 7}px`;
  node.style.top = `${y + dy - node.offsetHeight}px`;
  return node;
}
