let nextDialogId = 0;
const closers = new WeakMap();

function appendContent(root, content) {
  if (typeof content === 'string') root.innerHTML = content;
  else if (content) root.append(content);
}

function sidePanel(side, position) {
  if (!side) return null;
  const panel = document.createElement('section');
  panel.className = `gp dialog-side dialog-${position}`;

  const heading = document.createElement('div');
  heading.className = 'hd';
  heading.textContent = side.title;

  const content = document.createElement('div');
  content.className = 'dialog-side-content';
  appendContent(content, side.content);
  panel.append(heading, content);
  return panel;
}

export function dialog({ title, subtitle, left, right, body, okLabel = 'OK', backLabel, onBack, onOk, onCancel }) {
  const layer = document.createElement('div');
  layer.className = 'dialog-layer';

  const veil = document.createElement('div');
  veil.className = 'dialog-veil';
  veil.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('section');
  const titleId = `dialog-title-${++nextDialogId}`;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', titleId);
  panel.className = 'gp dlg dialog-centre';
  panel.tabIndex = -1;

  const heading = document.createElement('h1');
  heading.id = titleId;
  heading.textContent = title;
  panel.append(heading);

  if (subtitle) {
    const subheading = document.createElement('div');
    subheading.className = 'subt';
    subheading.textContent = subtitle;
    panel.append(subheading);
  }

  const rule = document.createElement('div');
  rule.className = 'rule';
  panel.append(rule);

  const content = document.createElement('div');
  content.className = 'dialog-body';
  appendContent(content, body);
  panel.append(content);

  const ok = document.createElement('button');
  ok.className = 'btn dialog-ok';
  ok.type = 'button';
  ok.textContent = okLabel;
  ok.addEventListener('click', () => onOk?.());
  if (backLabel) {
    const actions = document.createElement('div');
    actions.className = 'dialog-actions';
    const back = document.createElement('button');
    back.className = 'dialog-back';
    back.type = 'button';
    back.textContent = backLabel;
    back.addEventListener('click', () => onBack?.());
    actions.append(back, ok);
    panel.append(actions);
  } else panel.append(ok);

  panel.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onCancel?.();
  });

  const leftPanel = sidePanel(left, 'left');
  const rightPanel = sidePanel(right, 'right');
  layer.append(veil);
  if (leftPanel) layer.append(leftPanel);
  layer.append(panel);
  if (rightPanel) layer.append(rightPanel);
  return layer;
}

const focusable = (root) => [...root.querySelectorAll(
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
)].filter((element) => !element.closest('[hidden]'));

export function closeDialog(target) {
  const layer = target?.classList?.contains('dialog-layer') ? target : target?.querySelector?.('.dialog-layer');
  closers.get(layer)?.();
}

export function openDialog(overlayRoot, opts) {
  closeDialog(overlayRoot);
  const previousFocus = document.activeElement;
  let layer;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    layer.classList.remove('dialog-open');
    layer.remove();
    closers.delete(layer);
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
  };
  const cancel = () => {
    try {
      opts.onCancel?.();
    } finally {
      close();
    }
  };

  // opts.build swaps the GDT trio for a screen's own layer; it must hold a .dialog-veil and a focusable .dialog-centre.
  layer = (opts.build ?? dialog)({ ...opts, onCancel: cancel });
  closers.set(layer, close);
  Object.defineProperty(layer, 'close', { value: close });
  layer.querySelector('.dialog-veil').addEventListener('click', cancel);
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation(); // a built layer has no GDT panel to stop it, so the key would also close the turn summary and bubbles
      cancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable(layer);
    if (items.length === 0) {
      event.preventDefault();
      layer.querySelector('.dialog-centre').focus();
      return;
    }
    const first = items[0];
    const last = items.at(-1);
    if (!items.includes(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  overlayRoot.append(layer);
  requestAnimationFrame(() => layer.classList.add('dialog-open'));
  layer.querySelector('.dialog-centre').focus();
  return layer;
}
