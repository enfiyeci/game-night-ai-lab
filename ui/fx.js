const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// A point on a rising quadratic arc from `from` to `to` (GDT's bubbles go up first, then across).
function arcPoint([sx, sy], [tx, ty], t) {
  const cx = sx + (tx - sx) * 0.25;
  const cy = Math.min(sy, ty) - 40;
  const u = 1 - t;
  return [u * u * sx + 2 * u * t * cx + t * t * tx, u * u * sy + 2 * u * t * cy + t * t * ty];
}

export function flyBubble(layer, kind, from, to, { duration = 1000, delay = 0 } = {}) {
  if (reducedMotion()) return Promise.resolve();
  const bubble = document.createElement('div');
  bubble.className = `fly-bubble ${kind}`;
  bubble.setAttribute('aria-hidden', 'true');
  layer.append(bubble);
  const frames = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const [x, y] = arcPoint(from, to, t);
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${i === 0 ? 0.3 : i === 12 ? 0.6 : 1})`, opacity: i === 0 ? 0 : i === 12 ? 0.4 : 1 }); // hidden until its launch, so waiting bubbles leave no specks
  }
  // An even ease: a strong ease-out rushes the bubble across and leaves it hanging at the badge, so the arc is never seen.
  const animation = bubble.animate(frames, { duration, delay, easing: 'ease-in-out', fill: 'both' });
  return animation.finished.catch(() => {}).finally(() => bubble.remove());
}
