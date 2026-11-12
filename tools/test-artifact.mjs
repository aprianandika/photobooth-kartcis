// Local check of out/kartcis-frame-uji.html in headless Chrome at phone size (no claude.ai viewer, so `downloads`
// is absent and Save must fall back to the long-press sheet). Loads a test photo through the gallery input,
// pans and zooms it, exports every frame, and writes screenshots to out/uji-*.png.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const PAGE = path.join(OUT, 'kartcis-frame-uji.html');
const PHOTO = process.argv[2];
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// The artifact skeleton adds doctype + viewport; mimic it so the local page lays out like the published one.
const wrapped = path.join(OUT, '_uji-wrapped.html');
fs.writeFileSync(wrapped, '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kartcis-uji-'));
const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res, rej) => {
  let b = '';
  ch.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\S+)/); if (m) res(m[1]); });
  setTimeout(() => rej(new Error('devtools tidak muncul')), 20000);
});
const ws = new WebSocket(wsUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0;
const pend = new Map(), logs = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('ERR ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
};
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const finish = code => { execFile('taskkill', ['/pid', String(ch.pid), '/T', '/F'], () => process.exit(code)); };

try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, s); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }, s); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64')); console.log('screenshot', name); };
  await send('Page.enable', {}, s);
  await send('Runtime.enable', {}, s);
  await send('DOM.enable', {}, s);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, s);
  await send('Page.navigate', { url: pathToFileURL(wrapped).href }, s);
  let ok = false;
  for (let i = 0; i < 180 && !ok; i++) { await sleep(250); try { ok = await ev('!!(window.KF && window.KF.ready())'); } catch { /* loading */ } }
  if (!ok) {
    const diag = await ev('JSON.stringify({ url: location.href, rs: document.readyState, kf: typeof window.KF, title: document.title, scripts: document.scripts.length, chips: document.querySelectorAll(".chip").length })').catch(e => e.message);
    throw new Error('halaman tidak siap; ' + diag + ' | ' + logs.join(' | '));
  }
  await sleep(400);
  console.log('lebar halaman vs viewport:', await ev('[document.documentElement.scrollWidth, innerWidth].join(" / ")'));
  await shot('uji-1-contoh.png');

  if (PHOTO) {
    const { root } = await send('DOM.getDocument', {}, s);
    const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#fileGal' }, s);
    await send('DOM.setFileInputFiles', { nodeId, files: [path.resolve(PHOTO)] }, s);
    for (let i = 0; i < 40; i++) { await sleep(150); if (await ev('window.KF.state().photo')) break; }
    console.log('foto dimuat:', JSON.stringify(await ev('window.KF.state()')));
    await ev('window.KF.setZoom(1.4)');
    await ev('window.KF.pan(-40, 30)');
    await sleep(300);
    console.log('setelah geser/zoom:', JSON.stringify(await ev('window.KF.state()')));
    await ev('window.KF.select(1)');
    await sleep(300);
    await shot('uji-2-foto.png');
    for (let i = 0; i < 3; i++) console.log(`frame ${i + 1}:`, JSON.stringify(await ev(`window.KF.capture(${i})`)));
    await ev("document.getElementById('save').click()");
    for (let i = 0; i < 40; i++) { await sleep(150); if (await ev("!document.getElementById('sheet').hidden")) break; }
    console.log('lembar simpan (tanpa downloads) tampil:', await ev("!document.getElementById('sheet').hidden"));
    await sleep(300);
    await shot('uji-3-simpan.png');
  }
  console.log(logs.length ? 'log galat:\n' + logs.join('\n') : 'tidak ada galat konsol');
  fs.unlinkSync(wrapped);
  finish(logs.length ? 1 : 0);
} catch (e) {
  console.error('GAGAL', e.message);
  finish(1);
}
