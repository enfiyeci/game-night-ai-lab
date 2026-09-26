const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const decimals = (step) => {
  const text = `${step}`;
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;
};

export function vslider({ label, role, value, min, max, step, colour, onInput }) {
  const root = document.createElement('div');
  root.className = 'vslider';

  const caption = document.createElement('div');
  caption.className = 'vslider-role';
  caption.textContent = role ?? '';

  const track = document.createElement('div');
  track.className = 'vslider-track';
  track.tabIndex = 0;
  track.setAttribute('role', 'slider');
  track.setAttribute('aria-label', role ? `${label} · ${role}` : label);
  track.setAttribute('aria-valuemin', `${min}`);
  track.setAttribute('aria-valuemax', `${max}`);

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
  let current = clamp(Number.isFinite(value) ? value : min, min, max);
  const percent = () => ((current - min) / (max - min || 1)) * 100;

  function setValue(next, notify = true) {
    const snapped = min + Math.round((clamp(next, min, max) - min) / step) * step;
    current = Number(clamp(snapped, min, max).toFixed(places));
    const pct = percent();
    fill.style.height = `${pct}%`;
    grip.style.bottom = `${pct}%`;
    amount.textContent = `${current}%`;
    track.setAttribute('aria-valuenow', `${current}`);
    track.setAttribute('aria-valuetext', `${current} percent`);
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
    if (event.key === 'Home') setValue(min);
    else if (event.key === 'End') setValue(max);
    else if (event.key in changes) setValue(current + changes[event.key]);
    else return;
    event.preventDefault();
  });

  setValue(current, false);
  root.append(caption, track, name, amount);
  return root;
}
