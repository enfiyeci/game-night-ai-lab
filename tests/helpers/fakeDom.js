// A small stand-in for the browser DOM, enough to build the recipe dialog and Safety's draft and click through them in
// node. Selectors: comma lists of compound selectors made of tag, #id, .class, [attr], [attr="value"] and :not(...);
// no descendant combinators.

class FakeText {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = String(text);
    this.parentNode = null;
  }
}

const camel = (name) => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

function parseCompound(text) {
  const parts = [];
  const pattern = /:not\(([^)]*)\)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]|(\*|[a-zA-Z][\w-]*)/g;
  let match;
  while ((match = pattern.exec(text))) {
    if (match[1] != null) parts.push({ not: parseCompound(match[1]) });
    else if (match[2]) parts.push({ id: match[2] });
    else if (match[3]) parts.push({ cls: match[3] });
    else if (match[4]) parts.push({ attr: match[4], value: match[5] });
    else if (match[6] && match[6] !== '*') parts.push({ tag: match[6].toUpperCase() });
  }
  return parts;
}

function matchesCompound(element, parts) {
  return parts.every((part) => {
    if (part.not) return !matchesCompound(element, part.not);
    if (part.id) return element.id === part.id;
    if (part.cls) return element.classList.contains(part.cls);
    if (part.tag) return element.tagName === part.tag;
    const value = element.getAttribute(part.attr);
    return part.value == null ? value != null : value === part.value;
  });
}

const matches = (element, selector) => selector.split(',').some((one) => matchesCompound(element, parseCompound(one.trim())));

class FakeElement {
  constructor(tag, doc) {
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.ownerDocument = doc;
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.className = '';
    this.id = '';
    this.innerHTMLSource = '';
    const self = this;
    this.classList = {
      add: (...names) => { for (const name of names) if (!self.classList.contains(name)) self.className = `${self.className} ${name}`.trim(); },
      remove: (...names) => { self.className = self.className.split(/\s+/).filter((name) => name && !names.includes(name)).join(' '); },
      contains: (name) => self.className.split(/\s+/).includes(name),
      toggle: (name, force = !self.classList.contains(name)) => {
        if (force) self.classList.add(name);
        else self.classList.remove(name);
        return force;
      },
    };
  }

  get children() { return this.childNodes.filter((node) => node.nodeType === 1); }
  get isConnected() {
    let node = this;
    while (node.parentNode) node = node.parentNode;
    return node === this.ownerDocument.body;
  }

  get textContent() { return this.childNodes.map((node) => node.textContent).join(''); }
  set textContent(value) {
    this.replaceChildren();
    if (value != null && value !== '') this.append(String(value));
  }

  set innerHTML(value) { this.replaceChildren(); this.innerHTMLSource = String(value); }
  get innerHTML() { return this.innerHTMLSource; }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[camel(name.slice(5))] = String(value);
  }
  getAttribute(name) {
    if (name === 'class') return this.className || null;
    if (name === 'id') return this.id || null;
    if (name.startsWith('data-')) return this.dataset[camel(name.slice(5))] ?? null;
    if (name === 'disabled') return this.disabled ? '' : null;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.getAttribute(name) != null; }

  append(...nodes) {
    for (const node of nodes) {
      const child = typeof node === 'object' ? node : new FakeText(node);
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
    }
  }
  prepend(...nodes) {
    const rest = this.childNodes;
    this.childNodes = [];
    this.append(...nodes);
    this.childNodes.push(...rest);
  }
  replaceChildren(...nodes) {
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    this.append(...nodes);
  }
  removeChild(child) {
    this.childNodes = this.childNodes.filter((node) => node !== child);
    child.parentNode = null;
  }
  remove() { this.parentNode?.removeChild(this); }
  contains(node) {
    for (let at = node; at; at = at.parentNode) if (at === this) return true;
    return false;
  }

  matches(selector) { return matches(this, selector); }
  closest(selector) {
    for (let at = this; at && at.nodeType === 1; at = at.parentNode) if (at.matches(selector)) return at;
    return null;
  }
  querySelectorAll(selector) {
    const found = [];
    const walk = (element) => {
      for (const child of element.children) {
        if (child.matches(selector)) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener));
  }
  dispatchEvent(event) {
    event.target ??= this;
    for (let at = this; at && !event.stopped; at = at.parentNode) {
      for (const listener of [...(at.listeners?.get(event.type) ?? [])]) listener(event);
    }
    return !event.defaultPrevented;
  }
  click() { if (!this.disabled) this.dispatchEvent(new FakeEvent('click')); }
  focus() { this.ownerDocument.activeElement = this; }
  blur() { if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = this.ownerDocument.body; }
  scrollIntoView() {}
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }; }
}

export class FakeEvent {
  constructor(type, init = {}) {
    Object.assign(this, init);
    this.type = type;
    this.defaultPrevented = false;
    this.stopped = false;
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this.stopped = true; }
}

// Installs document, CustomEvent and requestAnimationFrame on globalThis; returns the document.
export function installFakeDom() {
  const doc = { createElement: (tag) => new FakeElement(tag, doc) };
  doc.body = new FakeElement('body', doc);
  doc.activeElement = doc.body;
  globalThis.document = doc;
  globalThis.CustomEvent = FakeEvent;
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  return doc;
}
