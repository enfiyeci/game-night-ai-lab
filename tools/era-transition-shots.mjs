// Real sim gates and native headless Chrome; no browser automation dependency.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = await mkdtemp(join(tmpdir(), 'era-transition-'));
const server = spawn('python3', ['-m', 'http.server', '0', '--bind', '127.0.0.1'], { cwd: root, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
let ws;
try {
  const port = await new Promise((resolve, reject) => {
    server.stdout.on('data', data => { const match = `${data}`.match(/port (\d+)/); if (match) resolve(match[1]); });
    server.on('error', reject);
    server.on('exit', code => reject(new Error(`HTTP server exited ${code}`)));
  });
  browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank']);
  const browserUrl = await new Promise((resolve, reject) => {
    browser.stderr.on('data', data => { const match = `${data}`.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]); });
    browser.on('error', reject);
    browser.on('exit', code => reject(new Error(`Chrome exited ${code}`)));
  });
  const pages = await fetch(`${browserUrl.replace('ws:', 'http:').split('/devtools/')[0]}/json/list`).then(r => r.json());
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let serial = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args);
    if (!message.id) return;
    const item = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) item.reject(message.error); else item.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await wait(50); }
    console.error(await evaluate(`({state:game.state.era, ending:game.state.ending, clock:game.clock.now(),buttons:Array.from(document.querySelectorAll("#overlay button")).map(b=>({text:b.textContent,cls:b.className})),text:document.querySelector("#overlay").textContent.slice(-1800)})`));
    throw new Error(`Timed out: ${expression}`);
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const out = resolve(root, 'shots/era-transition-selected');
  await mkdir(out, { recursive: true });
  const results = [];
  for (const motion of ['no-preference', 'reduce']) {
    for (const era of (process.env.ERAS?.split(',').map(Number) ?? [2, 3, 4, 5])) {
      errors.length = 0;
      await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?scenario=beforeEra${era}&seed=1&paused` });
      await until(`globalThis.game?.state.era === ${era - 1} && game.state.dayInRound > 0`);
      await evaluate('document.fonts.ready');
      if (era === 2) {
        await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
        await evaluate('game.advanceDays(1)');
      } else {
        // The board owns these gates. Drive its real conversation and result before inspecting the transition.
        for (let i = 0; i < 35; i++) {
          const done = await evaluate(`game.state.era === ${era} && !document.querySelector('.mt-layer')`);
          if (done) break;
          const labels = await evaluate(`Array.from(document.querySelectorAll('.mt-layer button:not([disabled])')).map(b=>({text:b.textContent,cls:b.className}))`);
          const chosen = labels.find(b => /(^| )(join|mt-call-vote|mt-next|dialog-ok)( |$)/.test(b.cls));
          if (process.env.DEBUG) console.log(era, i, chosen);
          if (chosen?.cls.includes('dialog-ok')) await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
          if (chosen) await evaluate(`Array.from(document.querySelectorAll('.mt-layer button:not([disabled])')).find(b=>b.textContent===${JSON.stringify(chosen.text)})?.click()`);
          await wait(100);
        }
      }
      await until(`game.state.era === ${era}`);
      await until(`!!document.querySelector('.et-layer.dialog-open')`);
      await wait(250);
      const snapshot = await evaluate(`({era:game.state.era,day:game.state.day,ending:game.state.ending,clock:game.clock.now(),transition:document.querySelector('.et-layer')?.textContent,dialogs:Array.from(document.querySelectorAll('.dialog-layer')).map(e=>e.className)})`);
      assert.equal(snapshot.ending, null);
      assert.ok(snapshot.clock.reasons.includes('era-transition'));
      assert.ok(snapshot.transition);
      assert.equal(await evaluate(`document.querySelector('.et-layer').contains(document.activeElement)`), true);
      assert.equal(await evaluate(`document.querySelector('.et-layer').querySelectorAll('button').length`), 1);
      assert.equal(await evaluate(`document.querySelector('.et-layer').getAnimations({subtree:true}).some(a=>a.animationName?.startsWith('et-'))`), motion === 'no-preference');
      await evaluate(`game.clock.setSpeed(${era % 2 === 0 ? 4 : 0})`);
      await wait(1800);
      assert.equal(await evaluate('game.state.day'), snapshot.day);
      if ([2, 4].includes(era)) {
        for (const [width, height, suffix] of [[1440, 900, ''], [1000, 700, '-small']]) {
          await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
          await wait(100);
          const shot = await cdp('Page.captureScreenshot', { format: 'png' });
          await writeFile(join(out, `${motion}-${era - 1}-to-${era}${suffix}.png`), Buffer.from(shot.data, 'base64'));
        }
        await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      }
      if (era % 2 === 0) await evaluate(`document.querySelector('.et-enter').click()`);
      else await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await until(`!document.querySelector('.et-layer') && !game.clock.now().reasons.includes('era-transition')`);
      assert.equal(await evaluate('game.clock.now().speed'), era % 2 === 0 ? 4 : 0);
      assert.deepEqual(errors, [], 'browser errors');
      results.push({ motion, era, day: snapshot.day, dialogs: snapshot.dialogs, passed: true });
      console.log(`${motion}: ${era - 1}→${era} passed`);
    }
  }
  await writeFile(join(out, 'verification.json'), JSON.stringify(results, null, 2));
} finally {
  ws?.close();
  browser?.kill('SIGTERM');
  server.kill('SIGTERM');
  await wait(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
