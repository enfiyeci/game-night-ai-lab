const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const decimals = (step) => {
  const text = `${step}`;
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
};

export function vslider({
  label,
  role,
  value,
  min,
  max,
  step,
  colour,
  formatValue = (current) => `${current}%`,
  ariaValueText = (current) => `${current} percent`,
  notches = [],
  disabledValues = [],
  onInput,
}) {
  const root = document.createElement('div');
  root.className = 'vslider';

  const caption = document.createElement('div');
  caption.className = 'vslider-role';
  caption.textContent = role ?? '';

  const track = document.createElement('div');
  track.className = 'vslider-track';
  track.tabIndex = 0;
  track.setAttribute('role', 'slider');
  track.setAttribute('aria-orientation', 'vertical');
  track.setAttribute('aria-label', role ? `${label} · ${role}` : label);

  const fill = document.createElement('div');
  fill.className = 'vslider-fill';
  fill.style.background = `var(--${colour})`;
  const grip = document.createElement('div');
  grip.className = 'vslider-grip';
  track.append(fill, grip);

  const name = document.createElement('div');
  name.className = 'vslider-label';
  name.textContent = label;
  const amount = document.createElement('div');
  amount.className = 'vslider-value';

  const places = decimals(step);
  const fixedUnavailable = notches.filter((notch) => notch.disabled).map((notch) => notch.value);
  let unavailable = new Set([...disabledValues, ...fixedUnavailable]);
  let current = clamp(Number.isFinite(value) ? value : min, min, max);
  const percent = () => ((current - min) / (max - min || 1)) * 100;

  const values = () => {
    const list = [];
    for (let next = min; next <= max + step / 2; next += step) {
      const candidate = Number(next.toFixed(places));
      if (!unavailable.has(candidate)) list.push(candidate);
    }
    return list;
  };

  function updateAriaRange() {
    const allowed = values();
    track.setAttribute('aria-valuemin', `${allowed[0] ?? min}`);
    track.setAttribute('aria-valuemax', `${allowed.at(-1) ?? max}`);
  }

  function nearestAllowed(next) {
    const allowed = values();
    if (allowed.length === 0) return current;
    return allowed.reduce((nearest, candidate) => (
      Math.abs(candidate - next) < Math.abs(nearest - next) ? candidate : nearest
    ));
  }

  function renderNotches() {
    if (notches.length === 0) return;
    notchList.replaceChildren();
    for (const notch of notches) {
      const button = document.createElement('button');
      const isDisabled = unavailable.has(notch.value) || notch.disabled;
      const notchPercent = ((notch.value - min) / (max - min || 1)) * 100;
      button.type = 'button';
      button.className = 'vslider-notch';
      button.classList.toggle('tick-only', !notch.label);
      button.style.top = `${100 - notchPercent}%`;
      button.disabled = isDisabled;
      button.title = notch.title ?? '';
      button.setAttribute('aria-label', notch.ariaLabel ?? notch.label ?? `${notch.value}`);
      if (notch.label) {
        const text = document.createElement('span');
        text.textContent = notch.label;
        button.append(text);
      }
      if (notch.detail) {
        const detail = document.createElement('small');
        detail.textContent = notch.detail;
        button.append(detail);
      }
      if (!isDisabled) button.addEventListener('click', () => setValue(notch.value));
      notchList.append(button);
    }
  }

  function setValue(next, notify = true) {
    const snapped = min + Math.round((clamp(next, min, max) - min) / step) * step;
    current = nearestAllowed(Number(clamp(snapped, min, max).toFixed(places)));
    const pct = percent();
    fill.style.height = `${pct}%`;
    grip.style.bottom = `${pct}%`;
    amount.textContent = formatValue(current);
    track.setAttribute('aria-valuenow', `${current}`);
    track.setAttribute('aria-valuetext', ariaValueText(current));
    if (notify) onInput?.(current);
  }

  function valueAt(clientY) {
    const rect = track.getBoundingClientRect();
    const ratio = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    return min + ratio * (max - min);
  }

  track.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    track.focus();
    track.setPointerCapture(event.pointerId);
    setValue(valueAt(event.clientY));
  });
  track.addEventListener('pointermove', (event) => {
    if (!track.hasPointerCapture(event.pointerId)) return;
    setValue(valueAt(event.clientY));
  });
  track.addEventListener('keydown', (event) => {
    const changes = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    };
    const allowed = values();
    const index = allowed.indexOf(current);
    if (event.key === 'Home') setValue(allowed[0]);
    else if (event.key === 'End') setValue(allowed.at(-1));
    else if (event.key in changes) {
      const direction = changes[event.key] > 0 ? 1 : -1;
      const jump = event.key.startsWith('Page') ? 10 : 1;
      setValue(allowed[clamp(index + direction * jump, 0, allowed.length - 1)]);
    }
    else return;
    event.preventDefault();
  });

  updateAriaRange();
  setValue(current, false);
  let notchList;
  if (notches.length > 0) {
    root.classList.add('vslider-notched');
    const scale = document.createElement('div');
    scale.className = 'vslider-scale';
    notchList = document.createElement('div');
    notchList.className = 'vslider-notches';
    scale.append(track, notchList);
    root.append(caption, scale, name, amount);
    renderNotches();
  } else root.append(caption, track, name, amount);
  Object.defineProperties(root, {
    value: { get: () => current },
    setValue: { value: (next, notify = true) => setValue(next, notify) },
    setDisabledValues: {
      value: (next) => {
        unavailable = new Set([...next, ...fixedUnavailable]);
        renderNotches();
        updateAriaRange();
        if (unavailable.has(current)) setValue(current);
      },
    },
  });
  return root;
}
