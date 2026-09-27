// Run with node tools/office-marks-check.mjs. Uses headless Chrome; captures go in shots/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname } from 'node:path';
import { once } from 'node:events';

const root = resolve(import.meta.dirname, '..');
const profile = await mkdtemp(resolve(tmpdir(), 'office-marks-'));
const types = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.html': 'text/html' };
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
    if (!path.startsWith(`${root}/`)) throw new Error('outside root');
    res.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const chrome = spawn(process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 15000);
    let output = '';
    chrome.once('error', reject);
    chrome.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); done(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    clearTimeout(entry.timeout);
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
    else entry.done(message.result);
  });
  const send = (method, params = {}, sessionId) => new Promise((done, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(id, { done, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('gn-phone-introduced', '1');" });
  await call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/index.html?scenario=release&seed=1` });
  for (let tries = 0; tries < 100; tries++) {
    if (await evaluate('Boolean(globalThis.game && document.querySelector(".ev-briefing"))')) break;
    await new Promise((done) => setTimeout(done, 100));
  }
  await evaluate(`game.clock.pause('office-marks-check');
    game.state.warnings = { citations: { turn: game.state.turn } }; game.flush();`);
  const settle = () => evaluate('new Promise(resolve => setTimeout(resolve, 100))');
  await settle();
  const state = () => evaluate(`({
    warning: Boolean(game.state.warnings.citations && !game.state.warnings.citations.deferred),
    marker: Boolean(document.querySelector('[aria-label="policy has a warning for you"]')),
    bubble: Boolean(document.querySelector('.ev-briefing .ghost')),
    say: document.querySelector('.ev-briefing .ev-say')?.textContent ?? ''
  })`);
  const screenshot = async (name) => {
    const { data } = await call('Page.captureScreenshot', { format: 'png' });
    await mkdir(resolve(root, 'shots'), { recursive: true });
    await writeFile(resolve(root, `shots/office-marks-${name}.png`), Buffer.from(data, 'base64'));
  };
  const before = await state();
  assert.ok(before.warning && before.marker && before.bubble, 'injected warning is marked and shown');
  await evaluate('document.querySelector(".ev-briefing .ghost").click()');
  await settle();
  assert.deepEqual(await state(), { warning: true, marker: true, bubble: false, say: '' }, 'Not now dismisses only the bubble');
  await screenshot('dismissed-warning');
  await evaluate('game.flush()');
  await settle();
  assert.deepEqual(await state(), { warning: true, marker: true, bubble: false, say: '' }, 'redraw preserves the dismissed warning without reopening it');
  await evaluate('document.querySelector("#person-policy").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))');
  await settle();
  assert.deepEqual(await state(), before, 'keyboard activation reopens the warning');
  await evaluate('document.querySelector(".ev-briefing .ghost").click(); document.querySelector(\'[aria-label="policy has a warning for you"]\').click()');
  await settle();
  assert.deepEqual(await state(), before, 'marker activation reopens the warning');
  await screenshot('reopened-warning');
  await evaluate('document.querySelector(".ev-briefing .ev-act:not(.ghost)").click()');
  await settle();
  assert.deepEqual(await state(), { warning: false, marker: false, bubble: false, say: '' }, 'Look into it answers the warning and clears its mark');
  await screenshot('answered-warning');
  await evaluate('document.querySelector("#person-policy").dispatchEvent(new MouseEvent("click", { bubbles: true }))');
  await settle();
  assert.ok(!(await state()).bubble && (await state()).say, 'ordinary speech resumes after answering');
  await evaluate(`game.state.warnings = { citations: { turn: game.state.turn } }; game.flush();`);
  await settle();
  assert.ok((await state()).bubble && (await state()).marker, 'a new warning raises again');
  await evaluate('document.querySelector(".ev-briefing .ghost").click(); delete game.state.warnings.citations; game.flush()');
  await settle();
  assert.equal((await state()).marker, false, 'external resolution also clears a dismissed warning');
  console.log('PASS: warning dismissal, redraw, keyboard/marker reopening, answer, recurrence, external resolution');
} finally {
  socket?.close();
  const stopped = once(chrome, 'exit');
  chrome.kill();
  await stopped;
  await new Promise((done) => server.close(done));
  await rm(profile, { recursive: true, force: true });
}
