// Capture the game at 1440x900 through headless Chrome's DevTools protocol (no npm packages; Node 22 WebSocket).
// Serve the repo first (python3 -m http.server <port> --bind 127.0.0.1), then: node tools/cdp-shot.mjs <jobs.json>
// jobs.json: { "base": "http://127.0.0.1:PORT/", "jobs": [ { "url": "index.html?...", "wait": 1500, "script": "<js run in page, may be async>", "after": 600, "out": "/abs/file.png" } ] }
// Two jobs whose URLs differ only after "#" do not reload the page; add a dummy query parameter to force a fresh load.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { base, jobs, width = 1440, height = 900 } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), 'cdp-shot-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--mute-audio',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 100; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error('chrome did not start');
}

const ws = new WebSocket(await target());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') logs.push(msg.params.exceptionDetails?.exception?.description ?? 'exception');
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') logs.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
try {
  for (const job of jobs) {
    logs.length = 0;
    await send('Page.navigate', { url: new URL(job.url, base).href });
    await sleep(job.wait ?? 1500);
    if (job.script) {
      const res = await send('Runtime.evaluate', { expression: `(async () => { ${job.script} })()`, awaitPromise: true, returnByValue: true });
      if (res.result?.exceptionDetails) logs.push('script: ' + (res.result.exceptionDetails.exception?.description ?? res.result.exceptionDetails.text));
      else if (res.result?.result?.value !== undefined) logs.push('script returned: ' + JSON.stringify(res.result.result.value));
    }
    await sleep(job.after ?? 600);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(job.out, Buffer.from(shot.result.data, 'base64'));
    console.log(`${job.out}${logs.length ? '  | ' + logs.join(' | ') : ''}`);
  }
} finally {
  ws.close();
  chrome.kill();
}
