// Kartcis Frame: camera photobooth. Everything runs in the browser; photos are never uploaded.
import { W, H, FRAMES, renderOverlay, composite } from './frames.js';

const $ = id => document.getElementById(id);
const view = $('view'), vctx = view.getContext('2d');
const state = { frame: 0, facing: 'user', stream: null, video: null, photo: null, overlays: [], blob: null, timer: false, busy: false };

const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });

async function init() {
  await Promise.race([document.fonts.load('800 60px Poppins'), new Promise(r => setTimeout(r, 2500))]);
  await document.fonts.load('900 60px Poppins').catch(() => {});
  const assets = { logo: await loadImg('assets/logo-a2.png') };
  state.overlays = FRAMES.map(f => renderOverlay(f, assets));
  FRAMES.forEach((f, i) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = f.name; b.setAttribute('aria-pressed', String(i === 0));
    b.onclick = () => selectFrame(i);
    $('frames').append(b);
  });
  bind();
  await startCamera();
  requestAnimationFrame(loop);
}

function selectFrame(i) {
  state.frame = i;
  [...$('frames').children].forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
}

async function startCamera() {
  stopCamera();
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: state.facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: false });
    // The video sits full-size right behind the preview canvas. A detached <video> may never decode frames
    // (iOS Safari, headless Chrome), and an invisible one gets paused, either way the photo window goes black.
    if (state.video) state.video.remove();
    const v = document.createElement('video');
    v.playsInline = true; v.muted = true; v.autoplay = true; v.srcObject = state.stream;
    v.setAttribute('playsinline', '');
    v.className = 'feed';
    document.querySelector('.stage').prepend(v);
    await v.play();
    state.video = v; state.photo = null;
    $('perm').hidden = true;
  } catch (e) {
    state.video = null;
    $('permText').textContent = e && e.name === 'NotAllowedError'
      ? 'Akses kamera ditolak. Izinkan kamera di pengaturan browser, atau pakai foto dari galeri.'
      : 'Kamera tidak tersedia di perangkat ini. Pakai foto dari galeri saja.';
    if (!state.photo) $('perm').hidden = false;
  }
}

function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach(t => t.stop());
  state.stream = null;
}

function source() {
  if (state.photo) return { src: state.photo, w: state.photo.width, h: state.photo.height, mirror: false };
  const v = state.video;
  if (v && v.videoWidth) return { src: v, w: v.videoWidth, h: v.videoHeight, mirror: state.facing === 'user' };
  return { src: null, w: 0, h: 0, mirror: false };
}

function loop() {
  const s = source(), k = view.width / W;
  vctx.setTransform(k, 0, 0, k, 0, 0);
  composite(vctx, s.src, s.w, s.h, FRAMES[state.frame], state.overlays[state.frame], s.mirror);
  requestAnimationFrame(loop);
}

/** Full-resolution 1080×1920 JPEG of the current frame. */
function captureBlob(frameIndex = state.frame) {
  const s = source(), out = document.createElement('canvas');
  out.width = W; out.height = H;
  composite(out.getContext('2d'), s.src, s.w, s.h, FRAMES[frameIndex], state.overlays[frameIndex], s.mirror);
  return new Promise(res => out.toBlob(res, 'image/jpeg', 0.92));
}

async function shoot() {
  if (state.busy) return;
  state.busy = true;
  if (state.timer) {
    for (let n = 3; n > 0; n--) { $('count').textContent = n; await new Promise(r => setTimeout(r, 1000)); }
    $('count').textContent = '';
  }
  $('flash').classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => $('flash').classList.remove('on')));
  state.blob = await captureBlob();
  $('shot').src = URL.createObjectURL(state.blob);
  const file = new File([state.blob], 'kartcis-frame.jpg', { type: 'image/jpeg' });
  $('share').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
  $('result').hidden = false;
  state.busy = false;
}

function save() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(state.blob);
  a.download = `kartcis-frame-${Date.now()}.jpg`;
  document.body.append(a); a.click(); a.remove();
}

async function share() {
  const file = new File([state.blob], 'kartcis-frame.jpg', { type: 'image/jpeg' });
  try { await navigator.share({ files: [file], title: 'Kartcis Frame', text: 'Aku nonton pakai Kartcis! kartcis.id' }); }
  catch (e) { if (e.name !== 'AbortError') save(); }
}

function bind() {
  $('shutter').onclick = shoot;
  $('flip').onclick = () => { state.facing = state.facing === 'user' ? 'environment' : 'user'; state.photo = null; startCamera(); };
  $('timer').onclick = () => { state.timer = !state.timer; $('timer').setAttribute('aria-pressed', String(state.timer)); };
  $('upload').onclick = $('gallery').onclick = () => $('file').click();
  $('retry').onclick = startCamera;
  $('file').onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    state.photo = await createImageBitmap(f);
    $('perm').hidden = true;
    e.target.value = '';
  };
  $('save').onclick = save;
  $('share').onclick = share;
  $('again').onclick = () => { $('result').hidden = true; };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); else if (!state.photo) startCamera(); });
}

// Small hook for automated checks (headless Chrome with a fake camera).
window.KF = {
  ready: () => !!(state.video && state.video.videoWidth),
  select: selectFrame,
  shoot,
  async exportAll() {
    const out = [];
    for (let i = 0; i < FRAMES.length; i++) {
      const b = await captureBlob(i);
      out.push(await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }));
    }
    return out;
  },
};

init();
