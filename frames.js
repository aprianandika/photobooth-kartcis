// Kartcis story frames (1080×1920). Each frame is an overlay with a transparent "window" where the photo shows.
// Characters come from the shared vector rig, so the frames need no character images.
// Story safe zone: Instagram covers roughly the top 250 px (profile row) and bottom 250 px (reply bar),
// so logos, text and the URL sit between y 250 and y 1700.
import { build, paint, C } from './chars/characters.js';

export const W = 1080, H = 1920;
const DEEP = '#5b002b';
const TAU = Math.PI * 2;
const font = (s, w = 800, fam = 'Poppins') => `${w} ${s}px "${fam}", "Open Sans", sans-serif`;

function rng(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

/** Sticker-style lettering like the KARTCIS! logo: thick deep shadow, white edge, coloured fill. */
function stickerText(c, txt, x, y, size, { fill = C.amb, shadow = DEEP, edge = '#ffffff', rot = 0, weight = 800, maxW = 960 } = {}) {
  c.save();
  c.font = font(size, weight);
  const s = Math.min(1, maxW / c.measureText(txt).width);
  c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const d = size * 0.08;
  c.fillStyle = shadow; c.strokeStyle = shadow; c.lineWidth = size * 0.22;
  for (let k = d; k > 0; k -= 2) { c.strokeText(txt, k * 0.6, k); c.fillText(txt, k * 0.6, k); }
  c.strokeStyle = edge; c.lineWidth = size * 0.16; c.strokeText(txt, 0, 0);
  c.fillStyle = fill; c.fillText(txt, 0, 0);
  c.restore();
}

function urlPill(c, x, y, size = 40) {
  c.save();
  c.font = font(size, 800, 'Open Sans');
  const w = c.measureText('kartcis.id').width + size * 1.6, h = size * 1.9;
  rr(c, x - w / 2 + 6, y - h / 2 + 10, w, h, h / 2); c.fillStyle = DEEP; c.fill();
  rr(c, x - w / 2, y - h / 2, w, h, h / 2); c.fillStyle = '#ffffff'; c.fill();
  c.lineWidth = 6; c.strokeStyle = C.mag; c.stroke();
  c.fillStyle = C.mag; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('kartcis.id', x, y + 2);
  c.restore();
}

function star(c, x, y, r, rot, fill, line) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.lineJoin = 'round';
  c.lineWidth = r * 0.22; c.strokeStyle = line; c.stroke(); c.fillStyle = fill; c.fill();
  c.restore();
}

/** Decorative QR-like block (not scannable). */
function fakeQR(c, cx, cy, s, col) {
  const n = 21, u = s / n, r = rng(9), x0 = cx - s / 2, y0 = cy - s / 2;
  c.fillStyle = col;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
    if (!finder && r() < 0.5) c.fillRect(x0 + x * u, y0 + y * u, u + 0.3, u + 0.3);
  }
  for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    c.lineWidth = u; c.strokeStyle = col;
    c.strokeRect(x0 + fx * u + u / 2, y0 + fy * u + u / 2, 6 * u, 6 * u);
    c.fillRect(x0 + (fx + 2) * u, y0 + (fy + 2) * u, 3 * u, 3 * u);
  }
}

function punch(c, win) {
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000'; // must be opaque: destination-out removes only as much as the fill's alpha
  rr(c, win.x, win.y, win.w, win.h, win.r); c.fill();
  c.restore();
}

/* ---------- frame 1: "Aku nonton pakai Kartcis!" ---------- */
const STORY_WIN = { x: 70, y: 340, w: 940, h: 1150, r: 48 };
function drawStory(c, A) {
  c.fillStyle = C.mag; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = 0; y < H; y += 90) for (let x = (y / 90) % 2 ? 0 : 90; x < W; x += 180) c.fillRect(x, y, 90, 90);
  punch(c, STORY_WIN);
  rr(c, STORY_WIN.x, STORY_WIN.y, STORY_WIN.w, STORY_WIN.h, STORY_WIN.r);
  c.lineWidth = 18; c.strokeStyle = '#ffffff'; c.stroke();
  const lw = 560, lh = lw * A.logo.height / A.logo.width;
  c.drawImage(A.logo, W / 2 - lw / 2, 270 - lh / 2 - 10, lw, lh);
  star(c, 120, 230, 40, -0.3, C.amb, '#ffffff');
  star(c, 960, 250, 30, 0.4, C.amb, '#ffffff');
  stickerText(c, 'Aku nonton pakai Kartcis!', W / 2, 1580, 60);
  urlPill(c, W / 2, 1680);
  paint(c, build('bunny', 'melambai', 'ketawa'), 915, 1478, 0.58, { sticker: true });
}

/* ---------- frame 2: the photo becomes a ticket ---------- */
const TICKET = { x: 70, y: 250, w: 940, h: 1450, perf: 1420, notch: 48 };
const TICKET_WIN = { x: 112, y: 292, w: 856, h: 1076, r: 30 };
function ticketPath(c, o) {
  const { x, y, w, h, perf, notch } = o, r = 44;
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, perf - notch); c.arc(x + w, perf, notch, -Math.PI / 2, Math.PI / 2, true);
  c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, perf + notch); c.arc(x, perf, notch, Math.PI / 2, -Math.PI / 2, true);
  c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
  c.closePath();
}
function drawTicket(c, A) {
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, DEEP); g.addColorStop(1, C.mag);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = rng(4);
  for (let i = 0; i < 18; i++) star(c, r() * W, r() * H, 10 + r() * 16, r() * TAU, i % 3 ? C.amb : '#ffffff', 'rgba(0,0,0,0)');
  c.save(); c.translate(14, 22); ticketPath(c, TICKET); c.fillStyle = DEEP; c.fill(); c.restore();
  ticketPath(c, TICKET); c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = '#ffffff'; c.stroke();
  c.fillStyle = C.amb; c.fill();
  punch(c, TICKET_WIN);
  rr(c, TICKET_WIN.x, TICKET_WIN.y, TICKET_WIN.w, TICKET_WIN.h, TICKET_WIN.r);
  c.lineWidth = 8; c.strokeStyle = DEEP; c.stroke();
  c.save(); c.setLineDash([22, 20]); c.lineWidth = 9; c.strokeStyle = C.mag;
  c.beginPath(); c.moveTo(TICKET.x + 70, TICKET.perf); c.lineTo(TICKET.x + TICKET.w - 70, TICKET.perf); c.stroke(); c.restore();
  // stub
  const lw = 380, lh = lw * A.logo.height / A.logo.width;
  c.drawImage(A.logo, 130, 1500 - lh / 2, lw, lh);
  c.font = font(38, 800); c.fillStyle = C.mag; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('ADMIT ONE', 140, 1610);
  c.font = font(30, 700, 'Open Sans'); c.fillStyle = DEEP; c.fillText('kartcis.id', 140, 1655);
  rr(c, 770, 1450, 190, 190, 16); c.fillStyle = '#ffffff'; c.fill();
  fakeQR(c, 865, 1545, 160, DEEP);
  paint(c, build('bunny', 'diam', 'senang'), 860, 300, 0.48);
}

/* ---------- frame 3: "Gas Nonton!" full-bleed photo with the cast ---------- */
const GAS_WIN = { x: 0, y: 0, w: W, h: H, r: 0 };
function drawGas(c, A) {
  const top = c.createLinearGradient(0, 0, 0, 560);
  top.addColorStop(0, 'rgba(91,0,43,.7)'); top.addColorStop(1, 'rgba(91,0,43,0)');
  c.fillStyle = top; c.fillRect(0, 0, W, 560);
  const bot = c.createLinearGradient(0, 1300, 0, H);
  bot.addColorStop(0, 'rgba(173,3,88,0)'); bot.addColorStop(1, 'rgba(173,3,88,.85)');
  c.fillStyle = bot; c.fillRect(0, 1300, W, H - 1300);
  const r = rng(12);
  for (let i = 0; i < 26; i++) {
    c.save(); c.translate(40 + r() * (W - 80), 250 + r() * 380); c.rotate(r() * TAU);
    c.fillStyle = [C.amb, '#ffffff', C.mag][i % 3];
    if (i % 4 === 0) star(c, 0, 0, 16, 0, C.amb, '#ffffff'); else c.fillRect(-14, -7, 28, 14);
    c.restore();
  }
  stickerText(c, 'GAS NONTON!', W / 2, 360, 130, { rot: -0.06, weight: 900 });
  paint(c, build('fan', 'lightstick', 'ketawa'), 175, 1985, 0.5, { sticker: true });
  paint(c, build('crew', 'melambai', 'ketawa'), 905, 1985, 0.5, { sticker: true });
  const lw = 420, lh = lw * A.logo.height / A.logo.width;
  c.drawImage(A.logo, W / 2 - lw / 2, 1530 - lh / 2, lw, lh);
  urlPill(c, W / 2, 1660, 36);
  paint(c, build('bunny', 'lompat', 'ketawa'), W / 2 + 250, 1500, 0.42, { sticker: true });
}

export const FRAMES = [
  { id: 'kartcis', name: 'Kartcis', win: STORY_WIN, draw: drawStory },
  { id: 'tiket', name: 'Tiket', win: TICKET_WIN, draw: drawTicket },
  { id: 'gas', name: 'Gas Nonton', win: GAS_WIN, draw: drawGas },
];

/** Pre-renders a frame overlay once (transparent where the photo goes). */
export function renderOverlay(frame, assets) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  frame.draw(cv.getContext('2d'), assets);
  return cv;
}

/**
 * Composites photo + overlay. src is a video or image; mirror flips selfies so they look like the preview.
 * Drawn into a W×H coordinate space (scale the context for smaller previews).
 */
export function composite(c, src, srcW, srcH, frame, overlay, mirror) {
  const win = frame.win;
  c.fillStyle = '#111'; c.fillRect(0, 0, W, H);
  if (src && srcW && srcH) {
    const s = Math.max(win.w / srcW, win.h / srcH), dw = srcW * s, dh = srcH * s;
    c.save();
    rr(c, win.x, win.y, win.w, win.h, win.r); c.clip();
    c.translate(win.x + win.w / 2, win.y + win.h / 2);
    if (mirror) c.scale(-1, 1);
    c.drawImage(src, -dw / 2, -dh / 2, dw, dh);
    c.restore();
  }
  c.drawImage(overlay, 0, 0, W, H);
}
