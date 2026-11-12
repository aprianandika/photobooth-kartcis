// Kartcis character cast, drawn in the "explainer cartoon" style: big cream heads, thick black outlines, dot eyes.
// Every character is a list of vector ops {d, fill, stroke, lw, m}, so one definition renders to Canvas (Path2D)
// for video and to SVG for files. Units: origin at the feet, y up is negative, an adult is about 1030 units tall.
export const C = {
  ink: '#1a1a1a', skin: '#fbf6ee', mag: '#ad0358', amb: '#febc59', ambShade: '#eea43c', white: '#ffffff',
  mesh: '#d9d9de', zip: '#8a8f96', pants: '#2d3140', eoTee: '#24262c', khaki: '#8c7b5a', jeans: '#5d7fb8',
  tee: '#ffe3ef', tote: '#ecdfc4', hair: '#1f1a17', gray: '#3a3d45', blush: 'rgba(255,110,150,.42)', mouth: '#5a1626',
  sweat: '#9ad8ff', screen: '#ffffff',
};
const LW = 12;
const f = n => Math.round(n * 10) / 10;

/* ---------- path builders (SVG path strings) ---------- */
export const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
export const ellipse = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
export function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
}
export const poly = (pts, close = true) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + (close ? 'Z' : '');

/** Closed (or open) Catmull-Rom spline through points, as cubic Béziers. */
export function smooth(pts, closed = true) {
  const n = pts.length, k = 1 / 6;
  const P = i => pts[closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) * k)} ${f(p1[1] + (p2[1] - p0[1]) * k)} ${f(p2[0] - (p3[0] - p1[0]) * k)} ${f(p2[1] - (p3[1] - p1[1]) * k)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
const arcPts = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const star = (cx, cy, r) => poly(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }));

/* ---------- a tiny stroke font for lettering, so SVGs never depend on a font ---------- */
const G = {
  K: [0.62, [[[0, 0], [0, 1]], [[0.6, 0], [0.04, 0.56]], [[0.22, 0.4], [0.62, 1]]]],
  A: [0.66, [[[0, 1], [0.33, 0], [0.66, 1]], [[0.13, 0.64], [0.53, 0.64]]]],
  R: [0.6, [[[0, 1], [0, 0], [0.4, 0], [0.56, 0.13], [0.56, 0.32], [0.4, 0.46], [0, 0.46]], [[0.28, 0.46], [0.6, 1]]]],
  T: [0.6, [[[0, 0], [0.6, 0]], [[0.3, 0], [0.3, 1]]]],
  C: [0.58, [[[0.58, 0.14], [0.44, 0], [0.16, 0], [0, 0.2], [0, 0.8], [0.16, 1], [0.44, 1], [0.58, 0.86]]]],
  I: [0.16, [[[0.08, 0], [0.08, 1]]]],
  S: [0.58, [[[0.56, 0.12], [0.42, 0], [0.16, 0], [0.02, 0.13], [0.02, 0.34], [0.16, 0.46], [0.42, 0.54], [0.56, 0.66], [0.56, 0.87], [0.42, 1], [0.16, 1], [0.02, 0.88]]]],
  '!': [0.16, [[[0.08, 0], [0.08, 0.66]], [[0.08, 0.95], [0.08, 0.96]]]],
  '?': [0.56, [[[0.02, 0.2], [0.14, 0.04], [0.32, 0], [0.5, 0.08], [0.56, 0.24], [0.5, 0.38], [0.28, 0.52], [0.28, 0.68]], [[0.28, 0.95], [0.28, 0.96]]]],
  E: [0.54, [[[0.54, 0], [0, 0], [0, 1], [0.54, 1]], [[0, 0.5], [0.44, 0.5]]]],
  V: [0.64, [[[0, 0], [0.32, 1], [0.64, 0]]]],
  Y: [0.62, [[[0, 0], [0.31, 0.5], [0.62, 0]], [[0.31, 0.5], [0.31, 1]]]],
  H: [0.6, [[[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0.5], [0.6, 0.5]]]],
  N: [0.6, [[[0, 1], [0, 0], [0.6, 1], [0.6, 0]]]],
  G: [0.62, [[[0.6, 0.14], [0.46, 0], [0.16, 0], [0, 0.2], [0, 0.8], [0.16, 1], [0.46, 1], [0.62, 0.84], [0.62, 0.56], [0.36, 0.56]]]],
  O: [0.64, [[[0.16, 0], [0.48, 0], [0.64, 0.2], [0.64, 0.8], [0.48, 1], [0.16, 1], [0, 0.8], [0, 0.2], [0.16, 0]]]],
  '0': [0.56, [[[0.14, 0], [0.42, 0], [0.56, 0.2], [0.56, 0.8], [0.42, 1], [0.14, 1], [0, 0.8], [0, 0.2], [0.14, 0]]]],
  '4': [0.6, [[[0.44, 1], [0.44, 0], [0, 0.66], [0.6, 0.66]]]],
  '2': [0.56, [[[0.02, 0.18], [0.14, 0.02], [0.4, 0], [0.54, 0.14], [0.54, 0.34], [0, 1], [0.56, 1]]]],
  U: [0.6, [[[0, 0], [0, 0.8], [0.16, 1], [0.44, 1], [0.6, 0.8], [0.6, 0]]]],
  D: [0.6, [[[0, 0], [0, 1], [0.34, 1], [0.6, 0.76], [0.6, 0.24], [0.34, 0], [0, 0]]]],
  F: [0.54, [[[0.54, 0], [0, 0], [0, 1]], [[0, 0.48], [0.42, 0.48]]]],
  P: [0.56, [[[0, 1], [0, 0], [0.4, 0], [0.56, 0.13], [0.56, 0.32], [0.4, 0.46], [0, 0.46]]]],
  '.': [0.14, [[[0.07, 0.95], [0.07, 0.96]]]],
  ' ': [0.34, []],
};
/** Returns {d, lw} for text centred on (cx, cy), cap height = size. */
export function strokeText(str, cx, cy, size) {
  const gap = 0.2, chars = [...str.toUpperCase()].map(ch => G[ch] || G[' ']);
  const width = chars.reduce((s, [w]) => s + w + gap, -gap) * size;
  let x = cx - width / 2, d = '';
  for (const [w, lines] of chars) {
    for (const ln of lines) d += 'M' + ln.map(([u, v]) => `${f(x + u * size)} ${f(cy - size / 2 + v * size)}`).join('L');
    x += (w + gap) * size;
  }
  return { d, lw: size * 0.17 };
}

/* ---------- op recorder ---------- */
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
export class Rig {
  constructor() { this.ops = []; this.m = [1, 0, 0, 1, 0, 0]; this.stack = []; }
  save() { this.stack.push(this.m); return this; }
  restore() { this.m = this.stack.pop(); return this; }
  translate(x, y) { this.m = mul(this.m, [1, 0, 0, 1, x, y]); return this; }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, s, -s, c, 0, 0]); return this; }
  scale(sx, sy = sx) { this.m = mul(this.m, [sx, 0, 0, sy, 0, 0]); return this; }
  /** Filled shape with an ink outline (lw = 0 means no outline). */
  fill(d, fill, lw = LW, stroke = C.ink) { this.ops.push({ d, fill, stroke: lw ? stroke : null, lw, m: this.m }); return this; }
  /** Open line. */
  line(d, stroke = C.ink, lw = LW * 0.8) { this.ops.push({ d, fill: null, stroke, lw, m: this.m }); return this; }
  text(str, cx, cy, size, color) { const t = strokeText(str, cx, cy, size); return this.line(t.d, color, t.lw); }
}

/* ---------- canvas rendering ---------- */
const P2 = new Map();
const path = d => {
  let p = P2.get(d);
  if (!p) { if (P2.size > 6000) P2.clear(); p = new Path2D(d); P2.set(d, p); }
  return p;
};
function drawOps(ctx, ops, solid = null, grow = 0) {
  for (const o of ops) {
    ctx.save();
    ctx.transform(...o.m);
    const p = path(o.d);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (solid) {
      ctx.fillStyle = solid;
      ctx.strokeStyle = solid;
      if (o.fill) ctx.fill(p);
      ctx.lineWidth = (o.stroke ? o.lw : 0) + grow * 2;
      ctx.stroke(p);
    } else {
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(p); }
      if (o.stroke && o.lw > 0) { ctx.lineWidth = o.lw; ctx.strokeStyle = o.stroke; ctx.stroke(p); }
    }
    ctx.restore();
  }
}
export const STICKER = { grow: 30, shadow: [16, 24] };
/**
 * Paints ops with their origin at (x, y) and scale s (1 = 1 px per unit).
 * sticker: white die-cut outline plus a hard magenta shadow, like the KARTCIS! logo.
 */
export function paint(ctx, ops, x, y, s, { sticker = false, grow = STICKER.grow, shadow = STICKER.shadow, flip = false } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  if (sticker) {
    ctx.save(); ctx.translate(flip ? -shadow[0] : shadow[0], shadow[1]); drawOps(ctx, ops, C.mag, grow); ctx.restore();
    drawOps(ctx, ops, C.white, grow);
  }
  drawOps(ctx, ops);
  ctx.restore();
}

/* ---------- SVG rendering (same ops, same layering) ---------- */
const f4 = n => Math.round(n * 1e4) / 1e4;
function colorAttr(name, col) {
  if (!col) return `${name}="none"`;
  const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(col.replace(/\s/g, ''));
  return m ? `${name}="rgb(${m[1]},${m[2]},${m[3]})" ${name}-opacity="${m[4]}"` : `${name}="${col}"`;
}
function opsSVG(ops, solid = null, grow = 0) {
  return ops.map(o => {
    const fill = solid ? (o.fill ? solid : null) : o.fill;
    const stroke = solid ? solid : (o.stroke && o.lw > 0 ? o.stroke : null);
    const lw = solid ? (o.stroke ? o.lw : 0) + grow * 2 : o.lw;
    return `<path d="${o.d}" transform="matrix(${o.m.map(f4).join(' ')})" ${colorAttr('fill', fill)}${stroke ? ' ' + colorAttr('stroke', stroke) + ` stroke-width="${f(lw)}"` : ''}/>`;
  }).join('');
}
/** One character (or prop) as an SVG group. */
export function svgLayer(ops, { x = 0, y = 0, s = 1, sticker = false, grow = STICKER.grow, shadow = STICKER.shadow, flip = false, cls = '' } = {}) {
  let out = `<g${cls ? ` class="${cls}"` : ''} transform="translate(${f(x)} ${f(y)}) scale(${flip ? -s : s} ${s})">`;
  if (sticker) out += `<g transform="translate(${flip ? -shadow[0] : shadow[0]} ${shadow[1]})">${opsSVG(ops, C.mag, grow)}</g>${opsSVG(ops, C.white, grow)}`;
  return out + opsSVG(ops) + '</g>';
}
export const svgDoc = (vb, w, h, body, head = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map(f).join(' ')}" width="${w}" height="${h}" stroke-linejoin="round" stroke-linecap="round">${head}${body}</svg>`;

/* ---------- shared body parts ---------- */
const HEAD = { x: 0, y: -820, rx: 185, ry: 172 };
const HEAD_SCALE = 1.14; // explainer style: the head carries most of the expression
function headGroup(R, p, draw) { R.save().translate(0, -640).rotate(p.tilt || 0).scale(HEAD_SCALE).translate(0, 640); draw(); R.restore(); }

function ears(R, y = -806) { for (const s of [-1, 1]) R.fill(ellipse(s * 178, y, 30, 38), C.skin); }
function headShape(R) { R.fill(ellipse(HEAD.x, HEAD.y, HEAD.rx, HEAD.ry), C.skin, LW + 2); }

/** Marks drawn above a head: ? (confused), ! (surprised), tear, sweat. Coordinates are head-local. */
function marks(R, e, { top = -1010, side = 1 } = {}) {
  if (e.q) { R.text('?', side * 196, top - 50, 96, C.white).ops.at(-1).lw += 16; R.text('?', side * 196, top - 50, 96, C.ink); }
  if (e.bang) { R.text('!', side * 200, top - 50, 96, C.white).ops.at(-1).lw += 16; R.text('!', side * 200, top - 50, 96, C.mag); }
  if (e.sweat) R.fill(`M150 -935C135 -905 128 -888 128 -876a22 22 0 0 0 44 0C172 -888 165 -905 150 -935Z`, C.sweat, 8);
}

function face(R, e = {}, o = {}) {
  const { eyeY = -800, eyeDX = 64, mouthY = -726, cheeks = false } = o;
  const eyes = e.eyes || 'dot', brows = e.brows || 'none', mouth = e.mouth || 'smile';
  for (const s of [-1, 1]) {
    const x = s * eyeDX;
    if (eyes === 'dot') R.fill(circle(x, eyeY, 15), C.ink, 0);
    else if (eyes === 'wide') { R.fill(circle(x, eyeY, 34), C.white, 9); R.fill(circle(x + s * 3, eyeY + 4, 13), C.ink, 0); }
    else if (eyes === 'happy') R.line(`M${x - 24} ${eyeY + 8}Q${x} ${eyeY - 24} ${x + 24} ${eyeY + 8}`, C.ink, 11);
    else if (eyes === 'closed') R.line(`M${x - 22} ${eyeY - 2}Q${x} ${eyeY + 16} ${x + 22} ${eyeY - 2}`, C.ink, 10);
    const bo = s * (eyeDX + 24), bi = s * (eyeDX - 22);
    if (brows === 'up') R.line(`M${bi} ${eyeY - 60}Q${s * eyeDX} ${eyeY - 74} ${bo} ${eyeY - 60}`, C.ink, 9);
    if (brows === 'worried') R.line(`M${bi} ${eyeY - 70}L${bo} ${eyeY - 52}`, C.ink, 9);
    if (brows === 'angry') R.line(`M${bi} ${eyeY - 46}L${bo} ${eyeY - 64}`, C.ink, 9);
  }
  const my = mouthY;
  if (mouth === 'smile') R.line(`M-44 ${my}Q0 ${my + 36} 44 ${my}`, C.ink, 11);
  if (mouth === 'grin') {
    R.fill(`M-58 ${my - 8}Q0 ${my + 74} 58 ${my - 8}Z`, C.white, 10);
    R.line(`M-50 ${my + 6}Q0 ${my + 16} 50 ${my + 6}M-20 ${my - 6}V${my + 26}M20 ${my - 6}V${my + 26}`, C.ink, 6);
  }
  if (mouth === 'open') R.fill(ellipse(0, my + 14, 26, 32), C.mouth, 10);
  if (mouth === 'talk') R.fill(ellipse(0, my + 8, 30, 18), C.mouth, 10);
  if (mouth === 'wavy') R.line(`M-46 ${my + 8}q11.5 -14 23 0t23 0t23 0t23 0`, C.ink, 9);
  if (mouth === 'flat') R.line(`M-32 ${my + 8}H32`, C.ink, 10);
  if (mouth === 'frown') R.line(`M-40 ${my + 20}Q0 ${my - 12} 40 ${my + 20}`, C.ink, 10);
  if (cheeks || e.blush) for (const s of [-1, 1]) R.fill(ellipse(s * 112, eyeY + 50, 28, 15), C.blush, 0);
  if (e.tear) R.fill(`M${-eyeDX - 6} ${eyeY + 24}C${-eyeDX - 18} ${eyeY + 50} ${-eyeDX - 22} ${eyeY + 62} ${-eyeDX - 22} ${eyeY + 70}a16 16 0 0 0 32 0C${-eyeDX + 10} ${eyeY + 62} ${-eyeDX + 6} ${eyeY + 50} ${-eyeDX - 6} ${eyeY + 24}Z`, C.sweat, 7);
}

/* ---------- limbs: one stroked path each (ink underlay + colour), so joints stay seamless ---------- */
const OUTLINE = 13;
function limb(R, d, w, color) { R.line(d, C.ink, w + OUTLINE); R.line(d, color, w); }
const dirOf = a => [-Math.sin(a), Math.cos(a)];

/* Items held in hand. upright items stay vertical whatever the forearm does (phone, lightstick, HT);
   the others follow the forearm (scanner points where the arm points). */
export const ITEMS = {
  scanner: { draw(R) { R.fill(rrect(-30, 4, 60, 104, 14), C.gray); R.fill(rrect(-20, 20, 40, 40, 6), C.mag, 6); R.line('M-12 40H12', C.amb, 6); } },
  phone: {
    upright: true,
    draw(R) {
      R.fill(rrect(-36, -124, 72, 128, 12), C.ink);
      R.fill(rrect(-27, -114, 54, 106, 7), C.screen, 0);
      R.fill(rrect(-17, -102, 34, 34, 3), C.ink, 0);
      R.fill(rrect(-11, -96, 9, 9, 1) + rrect(2, -96, 9, 9, 1) + rrect(-11, -83, 9, 9, 1), C.white, 0);
      R.fill(rrect(-17, -54, 34, 9, 4), C.mag, 0);
    },
  },
  ht: {
    upright: true,
    draw(R) {
      R.fill(rrect(12, -196, 10, 56, 5), C.gray, 7);
      R.fill(rrect(-26, -150, 52, 116, 10), C.gray);
      R.line('M-14 -128H14M-14 -114H14M-14 -100H14', '#6d717a', 6);
      R.fill(circle(0, -66, 9), C.amb, 0);
    },
  },
  lightstick: {
    upright: true,
    draw(R) {
      R.fill(rrect(-11, -118, 22, 112, 8), C.ink);
      R.fill(ellipse(0, -156, 32, 44), C.amb);
      R.fill(ellipse(-9, -168, 9, 13), C.white, 0);
    },
  },
  mug: {
    upright: true,
    draw(R) {
      R.line('M-14 -150q-10 -16 0 -32M10 -150q-10 -16 0 -32', '#c9c9c9', 7);
      R.line('M30 -100a22 22 0 0 1 0 44', C.ink, 22);
      R.line('M30 -100a22 22 0 0 1 0 44', C.white, 10);
      R.fill(rrect(-36, -126, 72, 92, 12), C.white);
      R.fill(ellipse(0, -122, 30, 8), '#6b4226', 0);
      R.fill(rrect(-36, -90, 72, 18, 0), C.mag, 0);
    },
  },
  moneybag: {
    upright: true,
    draw(R) {
      R.fill('M-20 -150Q-10 -128 -34 -112C-90 -80 -84 -10 0 -8C84 -10 90 -80 34 -112Q10 -128 20 -150Q0 -140 -20 -150Z', '#e8d29b');
      R.line('M-26 -116H26', '#8a6a2a', 9);
      R.text('RP', 0, -58, 34, '#8a6a2a');
    },
  },
};

function hand(R, type, t2) {
  if (type === 'open') {
    for (const [dx, dy] of [[-20, 38], [0, 46], [20, 38]]) R.fill(circle(dx, dy, 12), C.skin, 9);
    R.fill(ellipse(0, 12, 31, 32), C.skin);
    return;
  }
  if (type === 'thumb') {
    const [ux, uy] = [-Math.sin(t2), -Math.cos(t2)]; // world-up, expressed in hand space
    limb(R, `M0 8L${f(ux * 58)} ${f(8 + uy * 58)}`, 25, C.skin);
  }
  if (type === 'point') limb(R, 'M0 14L0 66', 18, C.skin);
  R.fill(circle(0, 8, 27), C.skin);
}

/**
 * Arm from the shoulder. a1 = shoulder angle (0 = hanging, positive = outward/up), a2 = elbow angle relative to the upper arm.
 */
function arm(R, side, [a1, a2], { sleeve = null, sleeveLen = 84, sleeveW = 70, item = null, handType = 'fist' }) {
  const [sx, sy] = [side * 120, -604], L1 = 148, L2 = 132;
  const t1 = -side * a1, t2 = t1 - side * a2;
  const [d1x, d1y] = dirOf(t1), [d2x, d2y] = dirOf(t2);
  const ex = sx + d1x * L1, ey = sy + d1y * L1, wx = ex + d2x * L2, wy = ey + d2y * L2;
  limb(R, `M${f(sx)} ${f(sy)}L${f(ex)} ${f(ey)}L${f(wx)} ${f(wy)}`, 38, C.skin);
  R.save().translate(wx, wy).rotate(t2);
  if (item) { R.save(); if (item.upright) R.rotate(-t2); item.draw(R); R.restore(); }
  hand(R, handType, t2);
  R.restore();
  if (sleeve) {
    R.save().translate(sx, sy).rotate(t1);
    R.fill(`M${-sleeveW / 2} 6Q${-sleeveW / 2} -26 0 -26Q${sleeveW / 2} -26 ${sleeveW / 2} 6L${sleeveW / 2 - 4} ${sleeveLen - 18}H${-sleeveW / 2 + 4}Z`, sleeve);
    R.restore();
  }
}

function leg(R, side, ang, { pants, shoe = C.white, accent = C.mag, w = 72, len = 262 }) {
  const hx = side * 54, hy = -300, [dx, dy] = dirOf(-side * ang), ax = hx + dx * (len - 26), ay = hy + dy * (len - 26);
  limb(R, `M${f(hx)} ${f(hy)}L${f(ax)} ${f(ay)}`, w, pants);
  R.save().translate(ax, ay).rotate(-side * ang);
  R.fill(`M${-side * 30} -18Q${-side * 34} 22 ${side * 2} 22H${side * 52}Q${side * 66} 22 ${side * 60} 0Q${side * 40} -26 ${-side * 30} -18Z`, shoe);
  if (accent) R.line(`M${-side * 14} 4H${side * 34}`, accent, 7);
  R.restore();
}

const TORSO = (w = 1, len = 0) => smooth([[-112 * w, -634], [0, -642], [112 * w, -634], [128 * w, -590], [127 * w, -440], [124 * w, -290 + len], [0, -282 + len], [-124 * w, -290 + len], [-127 * w, -440], [-128 * w, -590]]);

function arms(R, p, opt) {
  for (const [i, side] of [[0, -1], [1, 1]]) {
    arm(R, side, p.arms[i], { ...opt, item: p.items[i] && ITEMS[p.items[i]], handType: p.hands[i] });
  }
}

/* ---------- the cast ---------- */
function crewVestFront(R) {
  R.fill(TORSO(), C.mag);
  R.fill('M-127 -505L127 -505L128 -590Q128 -632 112 -634Q0 -644 -112 -634Q-128 -632 -128 -590Z', C.white, 0);
  let mesh = '';
  for (let x = -104; x <= 104; x += 15) mesh += `M${x} -618V-512`;
  for (let y = -612; y <= -514; y += 15) mesh += `M-118 ${y}H118`;
  R.line(mesh, C.mesh, 3);
  R.line('M-127 -505H127', C.ink, 6);
  R.fill('M-50 -640L0 -520L50 -640Z', C.white, 0);
  R.line('M-50 -640L0 -520L50 -640', C.ink, 6);
  R.line('M0 -520V-288', C.zip, 9);
  R.fill(rrect(-8, -528, 16, 28, 5), C.zip, 5);
  R.fill(rrect(-104, -606, 44, 52, 5), C.amb, 6);
  R.fill(rrect(-106, -610, 48, 20, 5), C.mag, 6);
  R.fill(circle(-82, -598, 4), C.ink, 0);
  R.fill(star(70, -588, 15), C.amb, 4, C.mag);
  R.fill(star(92, -572, 10), C.amb, 4, C.mag);
  for (const x of [-108, 36]) {
    R.fill(rrect(x, -486, 72, 58, 5), C.white, 6);
    R.line(`M${x + 12} -470H${x + 60}M${x + 12} -456H${x + 60}M${x + 12} -442H${x + 60}`, C.mesh, 3);
    R.fill(rrect(x - 2, -504, 76, 22, 5), C.amb, 6);
  }
  R.fill(rrect(-114, -414, 82, 104, 6), C.amb, 6);
  R.fill(rrect(-116, -418, 86, 24, 6), C.white, 6);
  R.line('M-73 -418V-310', C.ambShade, 4);
  R.fill(circle(-96, -406, 4) + circle(-52, -406, 4), C.ink, 0);
  bunnyPatch(R, -92, -356, 0.13);
  R.fill(rrect(32, -414, 82, 104, 6), C.amb, 6);
  R.fill(rrect(30, -418, 86, 24, 6), C.white, 6);
  R.fill(circle(73, -406, 4), C.ink, 0);
  R.fill(rrect(44, -380, 58, 44, 6), C.mag, 0);
  R.text('KART', 73, -368, 11, C.white);
  R.text('CIS!', 73, -350, 11, C.white);
  R.line('M-118 -296Q0 -286 118 -296', C.white, 8);
}

function crewVestBack(R) {
  R.fill(TORSO(), C.mag);
  R.fill('M-127 -470L127 -470L128 -584L-128 -584Z', C.white, 0);
  let mesh = '';
  for (let x = -116; x <= 116; x += 15) mesh += `M${x} -582V-472`;
  for (let y = -578; y <= -474; y += 15) mesh += `M-126 ${y}H126`;
  R.line(mesh, C.mesh, 3);
  R.line('M-127 -584H127M-127 -470H127', C.ink, 6);
  R.fill(rrect(-90, -570, 180, 84, 14), C.mag, 0);
  R.text('KARTCIS!', 0, -540, 30, C.white);
  R.text('EVERYTHING YOU NEED IS HERE.', 0, -506, 7.5, C.white);
  R.fill(rrect(-70, -392, 140, 80, 6), C.amb, 6);
  let m2 = '';
  for (let x = -60; x <= 60; x += 12) m2 += `M${x} -366V-318`;
  R.line(m2, C.ambShade, 3);
  R.fill(rrect(-72, -398, 144, 30, 6), C.white, 6);
  R.fill(circle(0, -384, 5), C.ink, 0);
  R.line('M-118 -296Q0 -286 118 -296', C.white, 8);
}

function bunnyPatch(R, x, y, s) {
  R.save().translate(x, y).scale(s);
  for (const side of [-1, 1]) { R.save().translate(side * 46, -100).rotate(side * 0.18); R.fill(ellipse(0, 0, 30, 92), C.mag); R.restore(); }
  R.fill(ellipse(0, 0, 118, 104), C.mag);
  R.restore();
}

function crewHair(R, back) {
  const top = arcPts(0, -820, 194, 184, Math.PI - 0.12, 2 * Math.PI + 0.12, 14);
  const edge = back
    ? [[186, -790], [150, -726], [80, -700], [0, -694], [-80, -700], [-150, -726], [-186, -790]]
    : [[178, -812], [154, -878], [112, -902], [72, -880], [34, -908], [-6, -884], [-46, -910], [-86, -886], [-126, -902], [-162, -868], [-180, -808]];
  R.fill(smooth([...top, ...edge]), C.hair);
}

function crew(R, p) {
  const back = p.view === 'back';
  leg(R, -1, p.legs[0], { pants: C.pants });
  leg(R, 1, p.legs[1], { pants: C.pants });
  R.fill(TORSO(), C.white);
  if (back) crewVestBack(R); else crewVestFront(R);
  if (!p.armsFront) arms(R, p, { sleeve: C.white, sleeveLen: 70 });
  headGroup(R, p, () => {
    ears(R);
    headShape(R);
    crewHair(R, back);
    if (!back) { face(R, p.expr); marks(R, p.expr); }
  });
  if (p.armsFront) arms(R, p, { sleeve: C.white, sleeveLen: 70 });
}

function eo(R, p) {
  leg(R, -1, p.legs[0], { pants: C.khaki, shoe: '#4a3a2c', accent: null });
  leg(R, 1, p.legs[1], { pants: C.khaki, shoe: '#4a3a2c', accent: null });
  if (!p.legs[0] && !p.legs[1]) for (const s of [-1, 1]) R.fill(rrect(s * 54 - 26 + s * 6, -210, 40, 52, 6), C.khaki, 6);
  R.fill(TORSO(), C.eoTee);
  R.line('M-40 -636L0 -506L40 -636', C.amb, 9);
  R.fill(rrect(-30, -512, 60, 80, 8), C.white, 7);
  R.fill(rrect(-30, -512, 60, 20, 6), C.mag, 0);
  R.line('M-18 -470H18M-18 -456H10', '#9a9a9a', 5);
  R.text('STAFF', 0, -360, 26, C.white);
  if (!p.armsFront) arms(R, p, { sleeve: C.eoTee });
  headGroup(R, p, () => {
    ears(R);
    headShape(R);
    const top = arcPts(0, -820, 194, 184, Math.PI - 0.08, 2 * Math.PI + 0.08, 16).map(([x, y], i) => (i % 2 && i > 2 && i < 14 ? [x * 1.06, -820 + (y + 820) * 1.2] : [x, y]));
    R.fill(smooth([...top, [182, -820], [168, -880], [120, -916], [40, -930], [-40, -948], [-110, -930], [-160, -890], [-184, -818]]), C.hair);
    R.line('M-196 -812A196 196 0 0 1 196 -812', C.ink, 30);
    R.line('M-196 -812A196 196 0 0 1 196 -812', C.gray, 16);
    R.fill(rrect(-222, -858, 44, 92, 18), C.gray);
    R.line('M-190 -790Q-150 -720 -72 -712', C.gray, 10);
    R.fill(circle(-66, -712, 15), C.ink, 0);
    face(R, p.expr);
    marks(R, p.expr);
  });
  if (p.armsFront) arms(R, p, { sleeve: C.eoTee });
}

function fan(R, p) {
  leg(R, -1, p.legs[0], { pants: C.jeans, w: 86 });
  leg(R, 1, p.legs[1], { pants: C.jeans, w: 86 });
  R.fill(TORSO(1.06, 22), C.tee);
  if (p.bib) {
    R.fill(rrect(-70, -500, 140, 104, 10), C.white, 8);
    R.fill(rrect(-70, -500, 140, 26, 8), C.mag, 0);
    R.text('42', 0, -440, 44, C.ink);
    for (const x of [-58, 58]) R.fill(circle(x, -488, 5), C.amb, 0);
  } else {
    R.fill(`M-14 -430c-20 -26 -44 -8 -24 16l24 22l24 -22c20 -24 -4 -42 -24 -16Z`, C.mag, 0);
  }
  if (!p.noBag) {
    R.line('M70 -600Q150 -520 152 -404', '#b9a57d', 10);
    R.fill(rrect(104, -410, 100, 112, 10), C.tote);
  }
  if (!p.armsFront) arms(R, p, { sleeve: C.tee, sleeveLen: 120 });
  headGroup(R, p, () => {
    R.fill(smooth([[0, -1012], [118, -994], [200, -910], [218, -790], [204, -690], [178, -616], [150, -560], [70, -530], [0, -524], [-70, -530], [-150, -560], [-178, -616], [-204, -690], [-218, -790], [-200, -910], [-118, -994]]), C.amb, LW + 2);
    R.line('M-120 -640Q0 -586 120 -640', C.ambShade, 8);
    R.line('M-176 -700Q-150 -600 -110 -560', C.ambShade, 7);
    R.fill(ellipse(0, -806, 142, 138), C.skin, LW);
    face(R, p.expr, { eyeY: -812, eyeDX: 54, mouthY: -742, cheeks: true });
    marks(R, p.expr, { top: -1030 });
  });
  if (p.armsFront) arms(R, p, { sleeve: C.tee, sleeveLen: 120 });
}

function bunny(R, p) {
  const e = p.expr || {}, paws = p.paws || 'ticket';
  for (const s of [-1, 1]) R.fill(ellipse(s * 40, -10, 38, 22), C.mag);
  R.fill(ellipse(0, -96, 80, 88), C.mag);
  R.fill(ellipse(0, -84, 48, 54), C.amb, 6);
  const paw = (x, y, rot = 0) => { R.save().translate(x, y).rotate(rot); R.fill(ellipse(0, 0, 20, 26), C.mag); R.restore(); };
  if (paws === 'ticket') {
    R.fill(rrect(-60, -132, 120, 70, 12), C.amb);
    R.line('M24 -126V-68', C.mag, 5);
    R.fill(star(-16, -97, 16), C.mag, 0);
    paw(-62, -100); paw(62, -100);
  } else if (paws === 'wave' || paws === 'head') paw(-74, -96, 0.3);
  else if (paws === 'side') { paw(-74, -96, 0.3); paw(74, -96, -0.3); }
  R.save().translate(0, -236).rotate(p.tilt || 0).translate(0, 236);
  for (const s of [-1, 1]) {
    R.save().translate(s * 46, -330).rotate(s * (0.16 + (p.earTilt || 0)));
    R.fill(ellipse(0, 0, 32, 100), C.mag);
    R.fill(ellipse(0, 10, 15, 70), C.amb, 0);
    R.restore();
  }
  R.fill(ellipse(0, -236, 120, 108), C.mag, LW + 2);
  const eyes = e.eyes || 'happy';
  for (const s of [-1, 1]) {
    const x = s * 44;
    if (eyes === 'happy') R.line(`M${x - 22} -238Q${x} -266 ${x + 22} -238`, C.ink, 11);
    else if (eyes === 'closed') R.line(`M${x - 20} -246Q${x} -230 ${x + 20} -246`, C.ink, 10);
    else if (eyes === 'wide') { R.fill(circle(x, -248, 26), C.white, 8); R.fill(circle(x, -244, 11), C.ink, 0); }
    else R.fill(circle(x, -246, 13), C.ink, 0);
  }
  R.fill('M-10 -214H10L0 -204Z', '#ff8fb3', 4);
  const mouth = e.mouth || 'w';
  if (mouth === 'w') R.line('M-24 -196q12 14 24 0q12 14 24 0', C.ink, 8);
  else if (mouth === 'frown') R.line('M-20 -182Q0 -200 20 -182', C.ink, 8);
  else R.fill(ellipse(0, -188, 16, 20), C.mouth, 8);
  for (const s of [-1, 1]) R.fill(ellipse(s * 86, -206, 22, 12), 'rgba(255,170,200,.75)', 0);
  if (e.tear) R.fill('M-50 -230C-60 -210 -64 -200 -64 -192a14 14 0 0 0 28 0C-36 -200 -40 -210 -50 -230Z', C.sweat, 6);
  if (e.q) { R.text('?', 150, -420, 80, C.white).ops.at(-1).lw += 14; R.text('?', 150, -420, 80, C.ink); }
  if (e.bang) { R.text('!', 150, -420, 80, C.white).ops.at(-1).lw += 14; R.text('!', 150, -420, 80, C.mag); }
  R.restore();
  // raised paws go in front of the head so they read
  if (paws === 'up') { paw(-152, -250, 0.6); paw(152, -250, -0.6); }
  if (paws === 'wave') paw(158, -270, -0.5);
  if (paws === 'head') paw(80, -334, -0.9);
}

/** Om Calo: fictional side character (ticket tout). Sunglasses, cap, leather jacket, moustache. */
function calo(R, p) {
  leg(R, -1, p.legs[0], { pants: '#3b4252', shoe: '#1f1f1f', accent: null });
  leg(R, 1, p.legs[1], { pants: '#3b4252', shoe: '#1f1f1f', accent: null });
  R.fill(TORSO(), C.white);
  const jacket = '#5a3b2a', lapel = '#7a5238';
  R.fill(poly([[-128, -588], [-112, -632], [-46, -640], [-34, -470], [-40, -290], [-124, -290], [-127, -440]]), jacket);
  R.fill(poly([[128, -588], [112, -632], [46, -640], [34, -470], [40, -290], [124, -290], [127, -440]]), jacket);
  R.fill(poly([[-46, -640], [-96, -626], [-52, -520]]), lapel, 8);
  R.fill(poly([[46, -640], [96, -626], [52, -520]]), lapel, 8);
  R.line('M-34 -600Q0 -540 34 -600', '#e6b422', 8);
  if (!p.armsFront) arms(R, p, { sleeve: jacket, sleeveLen: 150, sleeveW: 76 });
  headGroup(R, p, () => {
    ears(R);
    headShape(R);
    R.fill(smooth([[-170, -880], [-150, -960], [-80, -1005], [0, -1016], [80, -1005], [150, -960], [170, -880], [0, -870]]), '#2e3a59');
    R.fill(ellipse(70, -878, 150, 26), '#243050');
    face(R, p.expr);
    R.fill(rrect(-112, -832, 92, 56, 22) + rrect(20, -832, 92, 56, 22), '#111111', 8);
    R.line('M-20 -812H20', C.ink, 8);
    R.line('M-92 -818l22 -6', '#ffffff', 6);
    R.fill('M-56 -752Q-28 -778 0 -760Q28 -778 56 -752Q28 -740 0 -748Q-28 -740 -56 -752Z', C.ink, 0);
    marks(R, p.expr);
  });
  if (p.armsFront) arms(R, p, { sleeve: jacket, sleeveLen: 150, sleeveW: 76 });
}

const BUILDERS = { crew, eo, fan, bunny, calo };

/* ---------- catalogue: names, expressions, poses ---------- */
export const CAST = {
  crew: { name: 'Mas Cis', role: 'Crew Kartcis', file: 'crew', height: 1040 },
  bunny: { name: 'Kaci', role: 'Kelinci maskot', file: 'kelinci', height: 440 },
  eo: { name: 'Bang Eko', role: 'EO', file: 'eo', height: 1080 },
  fan: { name: 'Nonik', role: 'Penonton/Peserta', file: 'penonton', height: 1030 },
  calo: { name: 'Om Calo', role: 'Karakter sampingan (fiktif)', file: 'calo', height: 1060 },
};

export const EXPRESSIONS = {
  senang: { eyes: 'dot', mouth: 'smile' },
  ketawa: { eyes: 'happy', mouth: 'grin', brows: 'up' },
  kaget: { eyes: 'wide', mouth: 'open', brows: 'up', bang: true },
  bingung: { eyes: 'dot', mouth: 'wavy', brows: 'worried', q: true },
  sedih: { eyes: 'dot', mouth: 'frown', brows: 'worried', tear: true },
  semangat: { eyes: 'dot', mouth: 'grin', brows: 'angry' },
};
export const BUNNY_EXPRESSIONS = {
  senang: { eyes: 'happy', mouth: 'w' },
  ketawa: { eyes: 'happy', mouth: 'open' },
  kaget: { eyes: 'wide', mouth: 'open', bang: true },
  bingung: { eyes: 'dot', mouth: 'w', q: true },
  sedih: { eyes: 'dot', mouth: 'frown', tear: true },
  semangat: { eyes: 'dot', mouth: 'open' },
};
export const exprFor = (id, name) => (id === 'bunny' ? BUNNY_EXPRESSIONS : EXPRESSIONS)[name];

const P = (o, expr) => ({ ...o, exprName: expr });
export const POSES = {
  crew: {
    diam: P({}, 'senang'),
    belakang: P({ view: 'back' }, null),
    melambai: P({ arms: [[0.14, 0.06], [2.0, 0.9]], hands: ['fist', 'open'], armsFront: true }, 'ketawa'),
    menunjuk: P({ arms: [[0.14, 0.06], [1.5, 0]], hands: ['fist', 'point'] }, 'senang'),
    jempol: P({ arms: [[0.14, 0.06], [0.55, -2.1]], hands: ['fist', 'thumb'] }, 'semangat'),
    lompat: P({ arms: [[2.5, 0.2], [2.5, 0.2]], hands: ['open', 'open'], legs: [0.3, 0.3], lift: 110 }, 'ketawa'),
    scan: P({ arms: [[0.6, -1.25], [0.14, 0.06]], items: ['scanner', null] }, 'senang'),
    bingung: P({ arms: [[0.14, 0.06], [2.4, 1.5]], hands: ['fist', 'open'], tilt: 0.08, armsFront: true }, 'bingung'),
  },
  eo: {
    diam: P({}, 'senang'),
    melambai: P({ arms: [[0.14, 0.06], [2.0, 0.9]], hands: ['fist', 'open'], armsFront: true }, 'ketawa'),
    menunjuk: P({ arms: [[0.14, 0.06], [1.5, 0]], hands: ['fist', 'point'] }, 'senang'),
    jempol: P({ arms: [[0.14, 0.06], [0.55, -2.1]], hands: ['fist', 'thumb'] }, 'ketawa'),
    lompat: P({ arms: [[2.5, 0.2], [2.5, 0.2]], hands: ['open', 'open'], legs: [0.3, 0.3], lift: 110 }, 'ketawa'),
    ht: P({ arms: [[0.2, 0.1], [2.55, -2.1]], items: [null, 'ht'], armsFront: true }, 'kaget'),
    panik: P({ arms: [[2.4, 1.5], [2.4, 1.5]], hands: ['open', 'open'] }, 'kaget'),
    lega: P({ arms: [[0.3, 0.2], [0.3, 0.2]], hands: ['open', 'open'], tilt: -0.06 }, 'ketawa'),
    tepok: P({ arms: [[2.6, 0.86], [0.14, 0.06]], hands: ['open', 'fist'], armsFront: true, tilt: -0.1 }, 'bingung'),
    ngopi: P({ arms: [[0.14, 0.06], [0.5, -2.0]], items: [null, 'mug'], armsFront: true }, 'senang'),
  },
  calo: {
    diam: P({}, 'senang'),
    ngetik: P({ arms: [[0.5, -1.9], [0.5, -1.9]], items: ['phone', null], armsFront: true }, 'senang'),
    kabur: P({ arms: [[1.1, -1.2], [0.35, -1.0]], items: [null, 'moneybag'], legs: [0.5, -0.15], lean: 0.16, armsFront: true }, 'ketawa'),
  },
  fan: {
    diam: P({}, 'senang'),
    melambai: P({ arms: [[0.14, 0.06], [2.0, 0.9]], hands: ['fist', 'open'], armsFront: true }, 'ketawa'),
    menunjuk: P({ arms: [[0.14, 0.06], [1.5, 0]], hands: ['fist', 'point'] }, 'senang'),
    jempol: P({ arms: [[0.14, 0.06], [0.55, -2.1]], hands: ['fist', 'thumb'], armsFront: true }, 'semangat'),
    lompat: P({ arms: [[2.5, 0.2], [2.5, 0.2]], hands: ['open', 'open'], legs: [0.3, 0.3], lift: 110 }, 'ketawa'),
    hp: P({ arms: [[0.5, -1.9], [0.12, 0.05]], items: ['phone', null], armsFront: true }, 'senang'),
    lightstick: P({ arms: [[0.14, 0.06], [2.0, 0.85]], items: [null, 'lightstick'], armsFront: true }, 'ketawa'),
    lari: P({ arms: [[0.9, -1.3], [0.35, -1.5]], legs: [0.45, -0.12], lean: 0.08, bib: true, noBag: true }, 'semangat'),
  },
  bunny: {
    diam: P({ paws: 'ticket' }, 'senang'),
    melambai: P({ paws: 'wave' }, 'ketawa'),
    lompat: P({ paws: 'up', lift: 90, earTilt: 0.25 }, 'ketawa'),
    kaget: P({ paws: 'up' }, 'kaget'),
    bingung: P({ paws: 'head', tilt: 0.12 }, 'bingung'),
  },
};

const DEF = { arms: [[0.14, 0.06], [0.14, 0.06]], legs: [0, 0], hands: ['fist', 'fist'], items: [null, null], view: 'front', lift: 0, lean: 0, tilt: 0 };

/** Builds the vector ops for a character. pose may be a POSES name or an object; expr a name or an object. */
export function build(id, pose = {}, expr = undefined) {
  const base = typeof pose === 'string' ? POSES[id][pose] : pose;
  const exprObj = typeof expr === 'string' ? exprFor(id, expr) : expr || (base.exprName ? exprFor(id, base.exprName) : base.expr) || {};
  const p = { ...DEF, ...base, expr: { ...exprObj } };
  const R = new Rig();
  R.translate(0, -(p.lift || 0));
  if (p.lean) R.rotate(p.lean);
  BUILDERS[id](R, p);
  return R.ops;
}
