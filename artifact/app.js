// Kartcis Frame, test build for a claude.ai Artifact link.
// The viewer frame refuses the live camera and Web Share, so the photo comes from a file input
// (capture="user" opens the phone's own camera app) and saving goes through the `downloads` capability.
// Frames, characters and the logo are the same as the real photobooth (frames.js, chars/characters.js).
const { W, H, FRAMES, renderOverlay } = FR;
const $ = id => document.getElementById(id);
const view = $('view'), vctx = view.getContext('2d');
const state = { frame: 0, photo: null, photoUrl: null, sample: null, overlays: [], zoom: 1, u: 0, v: 0, mirror: false, busy: false };
const dlPromise = window.claude && typeof window.claude.use === 'function'
  ? window.claude.use('downloads').catch(() => null)
  : Promise.resolve(null);

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = src; });
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

/* ---------- sample photo, so the page shows a finished frame before anyone picks a photo ---------- */
function rng(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function makeSample() {
  const cv = document.createElement('canvas');
  cv.width = 1080; cv.height = 1920;
  const c = cv.getContext('2d'), r = rng(7);
  const g = c.createLinearGradient(0, 0, 0, 1920);
  g.addColorStop(0, '#1d0b3d'); g.addColorStop(0.5, '#4b0c4c'); g.addColorStop(1, '#16060f');
  c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
  // stage lights: soft beams from the rig above the crowd
  c.globalCompositeOperation = 'lighter';
  for (const [x, col, tilt] of [[120, '254,188,89', 0.22], [400, '255,255,255', 0.08], [700, '173,3,88', -0.1], [980, '254,188,89', -0.25]]) {
    const b = c.createLinearGradient(0, 0, 0, 1500);
    b.addColorStop(0, `rgba(${col},.42)`); b.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = b;
    c.beginPath(); c.moveTo(x - 14, 0); c.lineTo(x + 14, 0);
    c.lineTo(x + 1500 * tilt + 260, 1500); c.lineTo(x + 1500 * tilt - 260, 1500); c.closePath(); c.fill();
  }
  for (let i = 0; i < 40; i++) {
    const x = r() * 1080, y = 200 + r() * 1100, rad = 10 + r() * 34;
    const rg = c.createRadialGradient(x, y, 0, x, y, rad);
    const col = ['254,188,89', '255,255,255', '255,90,170'][i % 3];
    rg.addColorStop(0, `rgba(${col},.35)`); rg.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = rg; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
  // crowd silhouettes behind the fan
  c.fillStyle = '#12050d';
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 125 + (r() - 0.5) * 40, y = 1430 + r() * 70;
    c.beginPath(); c.arc(x, y, 52, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x, y + 190, 110, 150, 0, 0, Math.PI * 2); c.fill();
  }
  CH.paint(c, CH.build('fan', 'lightstick', 'ketawa'), 560, 2250, 1.45);
  return cv;
}

/* ---------- drawing ---------- */
function srcSize(s) { return [s.naturalWidth || s.width, s.naturalHeight || s.height]; }
/** Cover-fit plus the viewer's zoom; u/v (−1..1) move the photo within the spare room on each axis. */
function place(win, sw, sh) {
  const zoom = state.photo ? state.zoom : 1;
  const s = Math.max(win.w / sw, win.h / sh) * zoom, dw = sw * s, dh = sh * s;
  const sx = (dw - win.w) / 2, sy = (dh - win.h) / 2;
  return state.photo ? { dw, dh, sx, sy, ox: state.u * sx, oy: state.v * sy } : { dw, dh, sx, sy, ox: 0, oy: 0 };
}
function composite(c, i) {
  const f = FRAMES[i], win = f.win, src = state.photo || state.sample;
  c.fillStyle = '#111'; c.fillRect(0, 0, W, H);
  if (src) {
    const [sw, sh] = srcSize(src), p = place(win, sw, sh);
    c.save();
    rr(c, win.x, win.y, win.w, win.h, win.r); c.clip();
    c.translate(win.x + win.w / 2 + p.ox, win.y + win.h / 2 + p.oy);
    if (state.photo && state.mirror) c.scale(-1, 1);
    c.drawImage(src, -p.dw / 2, -p.dh / 2, p.dw, p.dh);
    c.restore();
  }
  c.drawImage(state.overlays[i], 0, 0, W, H);
}
let queued = false;
function draw() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const k = view.width / W;
    vctx.setTransform(k, 0, 0, k, 0, 0);
    composite(vctx, state.frame);
  });
}
function captureBlob(i = state.frame) {
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  composite(out.getContext('2d'), i);
  return new Promise(res => out.toBlob(res, 'image/jpeg', 0.92));
}

/* ---------- UI state ---------- */
function ui() {
  const has = !!state.photo;
  $('tag').hidden = has;
  $('adjust').hidden = !has;
  $('save').disabled = !has;
  $('stage').classList.toggle('can-drag', has);
  $('zoom').value = String(state.zoom);
  $('mirror').setAttribute('aria-pressed', String(state.mirror));
}
function selectFrame(i) {
  state.frame = i;
  [...$('frames').children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  draw();
}
let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3800);
}

async function loadFile(file) {
  if (!file) return;
  if (file.type && !file.type.startsWith('image/')) { toast('File itu bukan gambar. Pilih foto JPG atau PNG.'); return; }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url); // <img> applies the photo's EXIF rotation
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    Object.assign(state, { photo: img, photoUrl: url, zoom: 1, u: 0, v: 0, mirror: false });
    ui(); draw();
    toast('Geser foto untuk atur posisi. Cubit atau pakai slider untuk zoom.');
  } catch {
    URL.revokeObjectURL(url);
    toast('Foto ini tidak bisa dibuka. Coba foto lain, misalnya format JPG.');
  }
}

/* ---------- pan and zoom on the preview ---------- */
const pts = new Map();
let pinch = null;
const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
function pan(dx, dy) {
  const win = FRAMES[state.frame].win, [sw, sh] = srcSize(state.photo), p = place(win, sw, sh);
  const k = W / view.clientWidth;
  if (p.sx > 0.5) state.u = clamp(state.u + dx * k / p.sx, -1, 1);
  if (p.sy > 0.5) state.v = clamp(state.v + dy * k / p.sy, -1, 1);
  draw();
}
function setZoom(z) { state.zoom = clamp(z, 1, 3); $('zoom').value = String(state.zoom); draw(); }

function bind() {
  view.addEventListener('pointerdown', e => {
    if (!state.photo) return;
    view.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) pinch = { d: dist(), z: state.zoom };
    $('stage').classList.add('dragging');
  });
  view.addEventListener('pointermove', e => {
    const prev = pts.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pts.set(e.pointerId, cur);
    if (pts.size === 1) pan(cur.x - prev.x, cur.y - prev.y);
    else if (pts.size === 2 && pinch) setZoom(pinch.z * dist() / pinch.d);
  });
  const up = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!pts.size) $('stage').classList.remove('dragging');
  };
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', e => { if (!state.photo) return; e.preventDefault(); setZoom(state.zoom * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  $('zoom').addEventListener('input', e => setZoom(parseFloat(e.target.value)));
  $('mirror').onclick = () => { state.mirror = !state.mirror; ui(); draw(); };

  $('cam').onclick = () => $('fileCam').click();
  $('gal').onclick = () => $('fileGal').click();
  for (const id of ['fileCam', 'fileGal']) $(id).onchange = e => { loadFile(e.target.files[0]); e.target.value = ''; };
  const stage = $('stage');
  stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('drop'); });
  stage.addEventListener('dragleave', () => stage.classList.remove('drop'));
  stage.addEventListener('drop', e => { e.preventDefault(); stage.classList.remove('drop'); loadFile(e.dataTransfer.files[0]); });
  document.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/')); if (f) loadFile(f); });

  $('save').onclick = save;
  $('close').onclick = () => { $('sheet').hidden = true; };
}

/* ---------- save ---------- */
function showSheet(blob, msg) {
  const img = $('shot');
  if (img.src) URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(blob);
  $('sheetMsg').textContent = msg;
  $('sheet').hidden = false;
}
async function save() {
  if (!state.photo || state.busy) return;
  state.busy = true;
  $('save').disabled = true;
  try {
    const blob = await captureBlob();
    const downloads = await dlPromise;
    const fallback = 'Tekan lama gambar ini, lalu pilih Simpan gambar.';
    if (!downloads) { showSheet(blob, fallback); return; }
    try {
      await downloads.save({ filename: `kartcis-frame-${FRAMES[state.frame].id}.jpg`, data: blob });
      toast('Foto tersimpan. Upload dari galeri ke story Instagram.');
    } catch (e) {
      const code = e && e.code;
      if (code === 'declined') toast('Penyimpanan dibatalkan.');
      else if (code === 'rate_limited') toast('Masih ada konfirmasi simpan yang terbuka. Coba lagi sebentar.');
      else showSheet(blob, fallback);
    }
  } finally {
    state.busy = false;
    $('save').disabled = !state.photo;
  }
}

/* ---------- start ---------- */
let ready = false;
async function init() {
  await Promise.race([Promise.all([document.fonts.load('800 60px Poppins'), document.fonts.load('900 60px Poppins'), document.fonts.load('800 40px "Open Sans"')]), new Promise(r => setTimeout(r, 2500))]).catch(() => {});
  const assets = { logo: await loadImg(LOGO) };
  state.overlays = FRAMES.map(f => renderOverlay(f, assets));
  state.sample = makeSample();
  FRAMES.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = f.name; b.setAttribute('aria-pressed', String(i === 0));
    b.onclick = () => selectFrame(i);
    $('frames').append(b);
  });
  bind(); ui(); draw();
  ready = true;
}

// Hook for the local headless check (tools/test-artifact.mjs).
window.KF = {
  ready: () => ready,
  select: selectFrame,
  pan, setZoom,
  state: () => ({ frame: state.frame, photo: !!state.photo, zoom: state.zoom, u: state.u, v: state.v }),
  async capture(i) { const b = await captureBlob(i); const bmp = await createImageBitmap(b); return { w: bmp.width, h: bmp.height, kb: Math.round(b.size / 1024) }; },
};

init();
