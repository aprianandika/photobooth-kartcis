// Automated check: serves the photobooth, opens it in headless Chrome with a fake camera on a phone-sized viewport,
// screenshots the live UI and the result screen, and exports all frames at full resolution into out/.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.resolve(ROOT, '.' + (rel === '/' ? '/index.html' : rel));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kartcis-pb-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => {
  let b = '';
  ch.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\S+)/); if (m) res(m[1]); });
  setTimeout(() => rej(new Error('devtools tidak muncul')), 20000);
});
const ws = new WebSocket(wsUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0;
const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const finish = code => { server.close(); execFile('taskkill', ['/pid', String(ch.pid), '/T', '/F'], () => process.exit(code)); };

try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, s); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send('Page.enable', {}, s);
  await send('Runtime.enable', {}, s);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, s);
  await send('Browser.grantPermissions', { origin: `http://127.0.0.1:${port}`, permissions: ['videoCapture'] });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }, s);
  let ok = false;
  for (let i = 0; i < 120 && !ok; i++) { await sleep(250); try { ok = await ev('window.KF && window.KF.ready()'); } catch { /* loading */ } }
  if (!ok) {
    const diag = await ev(`JSON.stringify({ perm: !document.getElementById('perm').hidden, text: document.getElementById('permText').textContent, videos: document.querySelectorAll('video').length, readyState: document.querySelector('video')?.readyState, w: document.querySelector('video')?.videoWidth, paused: document.querySelector('video')?.paused, kf: !!window.KF })`).catch(e => e.message);
    throw new Error('kamera palsu tidak siap: ' + diag);
  }
  console.log('kamera aktif');
  await sleep(800);
  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }, s); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64')); console.log('screenshot', name); };
  await shot('ui-live.png');
  const frames = await ev('window.KF.exportAll()');
  frames.forEach((d, i) => { fs.writeFileSync(path.join(OUT, `frame-${i + 1}.jpg`), Buffer.from(d.split(',')[1], 'base64')); });
  console.log('frame diekspor:', frames.length, frames.map(d => Math.round(d.length * 0.75 / 1024) + ' KB').join(', '));
  // the photo window must show the camera, not the overlay background or black
  for (let i = 0; i < 3; i++) {
    await ev(`window.KF.select(${i})`);
    await sleep(200);
    const px = await ev(`(() => { const d = document.getElementById('view').getContext('2d').getImageData(200, 420, 140, 120).data; let s = 0, n = 0; for (let k = 0; k < d.length; k += 4) { s += d[k] + d[k + 1] + d[k + 2]; n += 3; } return Math.round(s / n); })()`);
    console.log(`frame ${i + 1}: rata-rata kecerahan di jendela foto = ${px}/255`);
  }
  await ev('window.KF.select(0)');
  await sleep(300);
  await shot('ui-live.png');
  await ev('window.KF.select(1)');
  await sleep(300);
  await ev('window.KF.shoot()');
  await sleep(700);
  await shot('ui-result.png');
  console.log('share tersedia:', await ev("!document.getElementById('share').hidden"));
  finish(0);
} catch (e) {
  console.error('GAGAL', e.message);
  finish(1);
}
