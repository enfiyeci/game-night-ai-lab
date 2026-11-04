import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// The iOS shell's document-start script (ios/App/Web/native-shell.js), run against a fake localStorage.
// GameWebView.swift splices the app's copy in as a JavaScript string where the placeholder is.
const SOURCE = readFileSync(new URL('../ios/App/Web/native-shell.js', import.meta.url), 'utf8');
const PLACEHOLDER = "/*SAVED_ITEMS*/'null'";

function runShell(pageItems, appCopy) {
  class Storage {
    constructor(items) { this.map = new Map(Object.entries(items)); }
    get length() { return this.map.size; }
    key(i) { return [...this.map.keys()][i] ?? null; }
    getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
    setItem(key, value) { this.map.set(String(key), String(value)); }
    removeItem(key) { this.map.delete(String(key)); }
    clear() { this.map.clear(); }
  }
  const localStorage = new Storage(pageItems);
  const posted = [];
  const root = { dataset: {}, style: { setProperty() {} }, append() {} };
  const context = vm.createContext({
    Storage, localStorage, navigator: {}, CustomEvent: class {}, dispatchEvent() {},
    document: { documentElement: root, createElement: () => ({}) },
    webkit: { messageHandlers: { gameNightStorage: { postMessage: (m) => posted.push(m) } } },
  });
  context.globalThis = context;
  const literal = JSON.stringify(appCopy === null ? 'null' : JSON.stringify(appCopy));
  assert.equal(SOURCE.split(PLACEHOLDER).length, 2, 'the placeholder appears once');
  vm.runInContext(SOURCE.replace(PLACEHOLDER, literal), context);
  return { items: Object.fromEntries(localStorage.map), posted: JSON.parse(JSON.stringify(posted)) }; // out of the vm's realm
}

test('a key the app copy lacks is removed from the page', () => {
  const { items, posted } = runShell(
    { 'ai-lab-run-save': '{"run":1}', 'ai-lab-run-counter': '2', a: '1', b: '2', c: '3' },
    { 'ai-lab-run-counter': '3' },
  );
  assert.deepEqual(items, { 'ai-lab-run-counter': '3' });
  assert.deepEqual(posted, [{ type: 'snapshot', items: { 'ai-lab-run-counter': '3' } }]);
});

test('without an app copy the page keeps its keys and sends them', () => {
  const { items, posted } = runShell({ 'ai-lab-run-save': '{}', x: '1' }, null);
  assert.deepEqual(items, { 'ai-lab-run-save': '{}', x: '1' });
  assert.deepEqual(posted, [{ type: 'snapshot', items: { 'ai-lab-run-save': '{}', x: '1' } }]);
});

test('every key name in the app copy survives the splice', () => {
  const copy = { __proto__: null, ['__proto__']: 'p', 'quote"s': 'a b', '</script>': '\\' };
  const { items } = runShell({}, copy);
  assert.deepEqual(items, { ['__proto__']: 'p', 'quote"s': 'a b', '</script>': '\\' });
});
