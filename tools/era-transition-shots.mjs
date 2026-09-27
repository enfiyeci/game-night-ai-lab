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
  const out = resolve(root, 'shots/era-transitions');
  await mkdir(out, { recursive: true });
  const results = [];
  for (const variant of (process.env.GALLERY_ONLY ? [] : process.env.VARIANTS?.split(',') ?? ['default', 'A', 'B', 'C'])) {
    for (const era of (process.env.ERAS?.split(',').map(Number) ?? [2, 3, 4, 5])) {
      errors.length = 0;
      await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/index.html?scenario=beforeEra${era}&seed=1&paused${variant === 'default' ? '' : `&eraTransition=${variant}`}` });
      await until(`globalThis.game?.state.era === ${era - 1} && game.state.dayInRound > 0`);
      await evaluate('document.fonts.ready');
      if (era === 2) {
        await evaluate('game.advanceDays(1)');
      } else {
        // The board owns these gates. Drive its real conversation and result before inspecting the transition.
        for (let i = 0; i < 35; i++) {
          const done = await evaluate(`game.state.era === ${era} && !document.querySelector('.mt-layer')`);
          if (done) break;
          const labels = await evaluate(`Array.from(document.querySelectorAll('.mt-layer button:not([disabled])')).map(b=>({text:b.textContent,cls:b.className}))`);
          const chosen = labels.find(b => /(^| )(join|mt-call-vote|mt-next|dialog-ok)( |$)/.test(b.cls));
          if (process.env.DEBUG) console.log(era, i, chosen);
          if (chosen) await evaluate(`Array.from(document.querySelectorAll('.mt-layer button:not([disabled])')).find(b=>b.textContent===${JSON.stringify(chosen.text)})?.click()`);
          await wait(100);
        }
      }
      await until(`game.state.era === ${era}`);
      if (variant !== 'default') await until(`!!document.querySelector('.et-layer.dialog-open')`);
      await wait(250);
      const snapshot = await evaluate(`({era:game.state.era,day:game.state.day,ending:game.state.ending,clock:game.clock.now(),transition:document.querySelector('.et-layer')?.textContent,dialogs:Array.from(document.querySelectorAll('.dialog-layer')).map(e=>e.className)})`);
      assert.equal(snapshot.ending, null);
      if (variant !== 'default') {
        assert.ok(snapshot.clock.reasons.includes('era-transition'));
        assert.ok(snapshot.transition);
        assert.equal(await evaluate(`document.querySelector('.et-layer').contains(document.activeElement)`), true);
        assert.equal(await evaluate(`document.querySelector('.et-layer').classList.contains('et-play')`), false);
      }
      if ([2, 4].includes(era)) {
        for (const [width, height, suffix] of [[1440, 900, ''], [1000, 700, '-small']]) {
          await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
          await wait(100);
          const shot = await cdp('Page.captureScreenshot', { format: 'png' });
          await writeFile(join(out, `${variant}-${era - 1}-to-${era}${suffix}.png`), Buffer.from(shot.data, 'base64'));
        }
        await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      }
      if (variant !== 'default') {
        await evaluate(`game.clock.setSpeed(${era % 2 === 0 ? 4 : 0})`);
        await evaluate(`document.querySelector('.et-motion').click()`);
        if (process.env.DEBUG) console.log(await evaluate(`document.querySelector('.et-layer').getAnimations({subtree:true}).slice(0,5).map(a=>({name:a.animationName,prop:a.transitionProperty,target:a.effect.target.outerHTML.slice(0,200)}))`));
        assert.equal(await evaluate(`document.querySelector('.et-layer').getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('et-')).length`), 0);
        await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
        await evaluate(`document.querySelector('.et-motion').click()`);
        assert.ok(await evaluate(`document.querySelector('.et-layer').getAnimations({subtree:true}).some(a=>a.animationName?.startsWith('et-'))`));
        await wait(1800);
        assert.equal(await evaluate('game.state.day'), snapshot.day);
        await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        if (era % 2 === 0) await evaluate(`document.querySelector('.et-enter').click()`);
        else await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await until(`!document.querySelector('.et-layer') && !game.clock.now().reasons.includes('era-transition')`);
        assert.equal(await evaluate('game.clock.now().speed'), era % 2 === 0 ? 4 : 0);
      } else assert.equal(snapshot.transition, undefined);
      assert.deepEqual(errors, [], 'browser errors');
      results.push({ variant, era, day: snapshot.day, dialogs: snapshot.dialogs, passed: true });
      console.log(`${variant}: ${era - 1}→${era} passed`);
    }
  }
  if (!process.env.GALLERY_ONLY) await writeFile(join(out, process.env.VARIANTS ? `verification-${process.env.VARIANTS.replaceAll(',', '-')}.json` : 'verification.json'), JSON.stringify(results, null, 2));
  const gallery = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Era transitions · Choose a direction</title>
  <style>*{box-sizing:border-box}body{margin:0;padding:35px;background:#eee5d1;color:#2e2a2b;font-family:system-ui,sans-serif}h1{font-family:Georgia,serif;font-size:34px;margin:0 0 10px}p{margin:0 0 22px}main{display:grid;grid-template-columns:145px 1fr 1fr;gap:25px 20px;align-items:center}img{display:block;width:100%;border:1px solid #bfb499}a{color:inherit}h2{font-size:23px;margin:0 0 14px}small{display:block;font-size:14px;line-height:1.5}header{margin-bottom:26px}.column{font-size:18px;font-weight:600}footer{margin-top:28px;font-size:14px}</style>
  <header><h1>Three ways into the next era</h1><p>Choose A, B, or C. Each holds the clock; motion is an optional preview.</p></header>
  <main><div></div><div class="column">1 → 2 · The scale-up</div><div class="column">3 → 4 · The gigawatt race</div>
  ${[['A','The briefing','A full-screen editorial card. Optional ink reveal.'],['B','Moving day','The office changes around the team. Optional slide into the new room.'],['C','First morning','An experimental desk scene: the new era arrives as work on your desk. Optional lights-on reveal.']].map(([id,title,note])=>`<div><h2>${id}<br>${title}</h2><small>${note}</small></div>${[2,4].map(era=>`<a href="${id}-${era-1}-to-${era}.png"><img alt="Variant ${id}, era ${era-1} to ${era}" src="${id}-${era-1}-to-${era}.png"></a>`).join('')}`).join('')}
  </main><footer>Click any screenshot for the full-size image. Default behavior remains unchanged. No future-era roadmap.</footer></html>`;
  await writeFile(join(out, 'index.html'), gallery);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1400, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/shots/era-transitions/index.html` });
  await until(`document.title === 'Era transitions · Choose a direction' && Array.from(document.images).length === 6 && Array.from(document.images).every(i=>i.complete && i.naturalWidth)`);
  const comparison = await cdp('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(out, 'comparison.png'), Buffer.from(comparison.data, 'base64'));
} finally {
  ws?.close();
  browser?.kill('SIGTERM');
  server.kill('SIGTERM');
  await wait(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
