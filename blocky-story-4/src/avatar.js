// avatar.js: classic six-part blocky avatar (2x2x1 torso, 1x2x1 limbs, rounded cylinder head),
// painted clothing textures, chunky 3D hair, and flat 2D face decals that hard-switch between expressions.
import * as THREE from 'three';
import { canvasTex, fabric, mat, tmat, rng, shade, box, clamp, lerp, PRE } from './util.js';

const D2R = Math.PI / 180;
export const SKIN = { fair: '#f6cfa9', light: '#eeb98f', tan: '#d99a6c', brown: '#a36a45', deep: '#7b4a31', dark: '#5a3524' };

// ───────────────────────── faces ─────────────────────────
// Canvas 768x576 wraps the front 150 degrees of the head. Origin = face centre, +y down, units = px.
const FW = 768, FH = 576, K = '#17120f';
function P(g) { // tiny drawing helpers
  g.lineCap = g.lineJoin = 'round';
  return {
    line(pts, w = 11, c = K) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); },
    curve(x0, y0, cx, cy, x1, y1, w = 11, c = K) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); },
    ell(x, y, rx, ry, fill, stroke = null, w = 9, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); } },
    shape(fn, fill, stroke = K, w = 9) { g.beginPath(); fn(g); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); } },
  };
}
const EX = 112, EY = -52, MY = 92; // eye half-spacing, eye height, mouth height
const eyes = {
  arc(p, o) { for (const s of [-1, 1]) p.curve(s * EX - 44, EY + 12, s * EX, EY - 40, s * EX + 44, EY + 12, 11); },          // closed happy ⌒
  dot(p, o) { for (const s of [-1, 1]) { p.ell(s * EX + o.lx * 10, EY, 22, 30, K); p.ell(s * EX + o.lx * 10 - 7, EY - 11, 6, 8, '#fff'); } },
  round(p, o) { for (const s of [-1, 1]) { p.ell(s * EX, EY, 50, 56, '#fff', K, 9); p.ell(s * EX + o.lx * 18, EY + o.ly * 16, 8, 9, K); } }, // shock
  blank(p, o) { for (const s of [-1, 1]) { p.ell(s * EX, EY - 6, 46, 46, '#f4f4f6', '#8d8d95', 5); p.ell(s * EX + 10, EY + 6, 26, 24, 'rgba(120,120,135,0.28)'); } },
  big(p, o) { for (const s of [-1, 1]) { p.ell(s * EX, EY, 46, 58, K); p.ell(s * EX - 14, EY - 22, 15, 19, '#fff'); p.ell(s * EX + 16, EY + 24, 8, 9, '#fff'); p.curve(s * EX + s * 40, EY - 44, s * EX + s * 58, EY - 54, s * EX + s * 62, EY - 66, 6); } },
  half(p, o) { for (const s of [-1, 1]) { p.ell(s * EX, EY + 6, 34, 15, '#fff', K, 8); p.ell(s * EX + o.lx * 14, EY + 7, 9, 9, K); p.line([[s * EX - 40, EY - 8], [s * EX + 40, EY - 8]], 11); } },
  small(p, o) { for (const s of [-1, 1]) { p.ell(s * EX + o.lx * 8, EY, 13, 15, K); p.curve(s * EX - 26, EY + 30, s * EX, EY + 38, s * EX + 22, EY + 28, 5); } },
  sad(p, o) { for (const s of [-1, 1]) { p.ell(s * EX, EY + 4, 30, 36, K); p.ell(s * EX - 8, EY - 10, 9, 11, '#fff'); p.ell(s * EX + 8, EY + 16, 12, 9, '#58a6ff'); } },
  shut(p, o) { for (const s of [-1, 1]) p.line([[s * EX - 36, EY], [s * EX + 36, EY]], 11); },
  squeeze(p, o) { for (const s of [-1, 1]) p.line([[s * EX - s * 38, EY - 26], [s * EX + s * 26, EY], [s * EX - s * 38, EY + 26]], 11); }, // > <
  wink(p, o) { p.ell(-EX, EY, 22, 30, K); p.ell(-EX - 7, EY - 11, 6, 8, '#fff'); p.curve(EX - 44, EY + 6, EX, EY - 30, EX + 44, EY + 6, 11); },
  heart(p, o) { for (const s of [-1, 1]) p.shape(g => { const x = s * EX, y = EY; g.moveTo(x, y + 40); g.bezierCurveTo(x - 70, y - 10, x - 30, y - 60, x, y - 22); g.bezierCurveTo(x + 30, y - 60, x + 70, y - 10, x, y + 40); }, '#ff3b6b', K, 7); },
};
const brows = {
  none() { },
  soft(p) { for (const s of [-1, 1]) p.curve(s * EX - 40, EY - 74, s * EX, EY - 90, s * EX + 40, EY - 76, 9); },
  up(p) { for (const s of [-1, 1]) p.curve(s * EX - 42, EY - 96, s * EX, EY - 116, s * EX + 42, EY - 98, 9); },
  angry(p) { for (const s of [-1, 1]) p.line([[s * EX - s * 50, EY - 50], [s * EX + s * 44, EY - 96]].map(q => [q[0], q[1]]), 13); },
  sad(p) { for (const s of [-1, 1]) p.line([[s * EX - s * 46, EY - 96], [s * EX + s * 46, EY - 66]], 11); },
  flat(p) { for (const s of [-1, 1]) p.line([[s * EX - 44, EY - 62], [s * EX + 44, EY - 62]], 13); },
  cocked(p) { p.curve(-EX - 44, EY - 62, -EX, EY - 70, -EX + 44, EY - 58, 11); p.curve(EX - 44, EY - 92, EX, EY - 124, EX + 44, EY - 92, 11); },
};
const mouths = {
  line(p) { p.line([[-38, MY], [38, MY]], 10); },
  smile(p) { p.curve(-70, MY - 14, 0, MY + 44, 70, MY - 14, 11); },
  small(p) { p.curve(-34, MY, 0, MY + 22, 34, MY, 10); },
  frown(p) { p.curve(-54, MY + 22, 0, MY - 22, 54, MY + 22, 11); },
  smirk(p) { p.curve(-58, MY + 6, 10, MY + 30, 66, MY - 22, 11); },
  wavy(p) { p.line([[-62, MY + 6], [-34, MY - 8], [-6, MY + 8], [22, MY - 8], [50, MY + 6]], 9); },
  grin(p) { // the big toothy D-smile that dominates this style
    p.shape(g => { g.moveTo(-104, MY - 34); g.quadraticCurveTo(0, MY - 46, 104, MY - 34); g.quadraticCurveTo(96, MY + 60, 0, MY + 62); g.quadraticCurveTo(-96, MY + 60, -104, MY - 34); }, '#fff', K, 10);
    p.curve(-92, MY + 8, 0, MY + 26, 92, MY + 8, 5, '#9a9aa2'); p.curve(-70, MY + 44, 0, MY + 56, 70, MY + 44, 9, 'rgba(120,120,130,0.35)');
  },
  open(p) { p.ell(0, MY + 6, 34, 30, '#6a1420', K, 9); p.ell(0, MY + 20, 22, 13, '#ff5a78'); },                 // talking
  laugh(p) { p.shape(g => { g.moveTo(-84, MY - 30); g.lineTo(84, MY - 30); g.quadraticCurveTo(70, MY + 78, 0, MY + 78); g.quadraticCurveTo(-70, MY + 78, -84, MY - 30); }, '#5a101c', K, 10); p.ell(0, MY + 50, 44, 22, '#ff5a78'); p.shape(g => g.rect(-70, MY - 30, 140, 20), '#fff', null); },
  shock(p) { p.shape(g => { g.moveTo(-62, MY + 44); g.quadraticCurveTo(-52, MY - 30, 0, MY - 32); g.quadraticCurveTo(52, MY - 30, 62, MY + 44); g.quadraticCurveTo(0, MY + 20, -62, MY + 44); }, '#2a1520', K, 10); p.curve(-40, MY - 12, 0, MY - 22, 40, MY - 12, 9, '#fff'); },
  scream(p) { p.shape(g => { g.moveTo(-88, MY + 56); g.bezierCurveTo(-96, MY - 60, -30, MY - 62, 0, MY - 40); g.bezierCurveTo(30, MY - 62, 96, MY - 60, 88, MY + 56); g.quadraticCurveTo(0, MY + 30, -88, MY + 56); }, '#0d0d10', K, 8); },
  o(p) { p.ell(0, MY + 6, 20, 24, '#3a1520', K, 9); },
  teeth(p) { p.shape(g => g.roundRect(-76, MY - 24, 152, 52, 14), '#fff', K, 10); p.line([[-76, MY + 2], [76, MY + 2]], 5); for (const x of [-38, 0, 38]) p.line([[x, MY - 22], [x, MY + 26]], 5); },
};
// name -> [eyes, brows, mouth, extra]
export const FACES = {
  grin: ['arc', 'soft', 'grin'], smile: ['dot', 'soft', 'smile'], happy: ['arc', 'none', 'smile'], neutral: ['dot', 'soft', 'line'],
  talk: ['arc', 'soft', 'open'], say: ['dot', 'soft', 'open'], shock: ['round', 'up', 'shock'], scream: ['blank', 'up', 'scream'],
  cute: ['big', 'soft', 'open'], cry: ['sad', 'sad', 'wavy', 'tears'], sad: ['dot', 'sad', 'frown'], worried: ['round', 'sad', 'wavy', 'sweat'],
  smug: ['half', 'cocked', 'smirk'], sus: ['half', 'flat', 'line'], serious: ['small', 'flat', 'line'], angry: ['dot', 'angry', 'teeth', 'vein'],
  mad: ['dot', 'angry', 'frown'], laugh: ['squeeze', 'none', 'laugh'], wink: ['wink', 'soft', 'smile'], love: ['heart', 'none', 'smile'],
  sleepy: ['shut', 'none', 'small'], wow: ['big', 'up', 'o'], blank: ['small', 'none', 'line'], smirk: ['dot', 'cocked', 'smirk'],
};
function drawFace(g, name, o) {
  const f = FACES[name] || FACES.neutral, p = P(g);
  g.clearRect(0, 0, FW, FH); g.save(); g.translate(FW / 2, FH / 2 + 4); g.scale(1.3, 1.3);
  if (o.blush || name === 'cute' || name === 'love') for (const s of [-1, 1]) p.ell(s * 170, 44, 40, 22, 'rgba(255,105,120,0.33)');
  eyes[f[0]](p, o); brows[f[1]](p, o); mouths[f[2]](p, o);
  if (f[3] === 'tears') for (const s of [-1, 1]) p.shape(g2 => g2.roundRect(s * EX - 15, EY + 30, 30, 190, 15), '#58a6ff', null);
  if (f[3] === 'sweat') p.shape(g2 => { g2.moveTo(214, -150); g2.quadraticCurveTo(250, -92, 214, -84); g2.quadraticCurveTo(178, -92, 214, -150); }, '#69b9ff', '#2a6fd0', 5);
  if (f[3] === 'vein') { for (const a of [0, 1, 2, 3]) { g.save(); g.translate(190, -150); g.rotate(a * Math.PI / 2); p.curve(8, 30, 8, 8, 30, 8, 9, '#e02828'); g.restore(); } }
  g.restore();
}

// ───────────────────────── clothing painters ─────────────────────────
// Each returns textures for: torso front/back/side, arm side, leg side/front.
const TOPS = {
  plain(g, w, h, c) { },
  tee(g, w, h, c, o) { g.strokeStyle = shade(c, -0.28); g.lineWidth = 7; g.beginPath(); g.arc(w / 2, -6, 44, 0, Math.PI); g.stroke(); },
  hoodie(g, w, h, c, o) {
    const d = shade(c, -0.3); g.strokeStyle = d; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.arc(w / 2, -10, 56, 0.15, Math.PI - 0.15); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 20, 40); g.lineTo(w / 2 + s * 22, 104); g.stroke(); g.fillStyle = d; g.fillRect(w / 2 + s * 22 - 4, 100, 8, 12); }
    g.beginPath(); g.moveTo(54, 236); g.lineTo(70, 164); g.lineTo(w - 70, 164); g.lineTo(w - 54, 236); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, 236, w, 20);
  },
  zip(g, w, h, c, o) { // open zip hoodie / jacket over a dark tee
    g.fillStyle = o.inner || '#101014'; g.beginPath(); g.moveTo(w / 2 - 46, 0); g.lineTo(w / 2 + 46, 0); g.lineTo(w / 2 + 8, 150); g.lineTo(w / 2 - 8, 150); g.fill();
    g.strokeStyle = '#d8d8de'; g.lineWidth = 5; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(w / 2, 150); g.lineTo(w / 2, h); g.stroke(); g.setLineDash([]);
    g.strokeStyle = shade(c, -0.3); g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 46, 0); g.lineTo(w / 2 + s * 8, 150); g.stroke(); g.beginPath(); g.moveTo(w / 2 + s * 30, 60); g.lineTo(w / 2 + s * 30, 120); g.stroke(); }
  },
  stripes(g, w, h, c, o) { g.fillStyle = o.stripe || '#15151a'; for (let y = 10; y < h; y += 34) g.fillRect(0, y, w, 16); TOPS.tee(g, w, h, c, o); },
  vest(g, w, h, c, o) { // puffer vest over a dark long sleeve
    g.fillStyle = o.inner || '#131316'; g.fillRect(w / 2 - 30, 0, 60, h);
    g.strokeStyle = shade(c, -0.25); g.lineWidth = 5; for (let y = 50; y < h; y += 52) { g.beginPath(); g.moveTo(0, y); g.lineTo(w / 2 - 30, y); g.moveTo(w / 2 + 30, y); g.lineTo(w, y); g.stroke(); }
  },
  suit(g, w, h, c, o) {
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.moveTo(w / 2 - 40, 0); g.lineTo(w / 2 + 40, 0); g.lineTo(w / 2, 132); g.fill();
    g.fillStyle = o.tie || '#2a2a30'; g.beginPath(); g.moveTo(w / 2 - 10, 6); g.lineTo(w / 2 + 10, 6); g.lineTo(w / 2 + 14, 96); g.lineTo(w / 2, 116); g.lineTo(w / 2 - 14, 96); g.fill();
    g.strokeStyle = shade(c, 0.22); g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 40, 0); g.lineTo(w / 2, 132); g.stroke(); } g.beginPath(); g.moveTo(w / 2, 132); g.lineTo(w / 2, h); g.stroke();
  },
  cardigan(g, w, h, c, o) { g.fillStyle = o.inner || '#111114'; g.fillRect(w / 2 - 62, 0, 124, h); g.strokeStyle = shade(c, -0.14); g.lineWidth = 3; for (let x = 6; x < w; x += 12) { if (Math.abs(x - w / 2) > 62) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } } },
  shirt(g, w, h, c, o) { // collared shirt, optional suspenders
    g.strokeStyle = shade(c, -0.22); g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, 20); g.lineTo(w / 2, h); g.stroke();
    for (const s of [-1, 1]) { g.fillStyle = shade(c, -0.08); g.beginPath(); g.moveTo(w / 2, 22); g.lineTo(w / 2 + s * 50, 0); g.lineTo(w / 2 + s * 44, 50); g.fill(); g.stroke(); }
    if (o.suspenders) { g.fillStyle = o.suspenders; for (const s of [-1, 1]) g.fillRect(w / 2 + s * 70 - 9, 0, 18, h); }
    g.fillStyle = shade(c, -0.3); for (let y = 70; y < h; y += 46) { g.beginPath(); g.arc(w / 2, y, 4, 0, 7); g.fill(); }
  },
  sweater(g, w, h, c, o) { g.strokeStyle = shade(c, -0.12); g.lineWidth = 3; for (let x = 4; x < w; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = shade(c, -0.16); g.fillRect(0, h - 26, w, 26); g.strokeStyle = shade(c, -0.3); g.lineWidth = 7; g.beginPath(); g.arc(w / 2, -8, 46, 0, Math.PI); g.stroke(); },
  jersey(g, w, h, c, o) { g.fillStyle = '#fff'; g.font = '900 120px Montserrat'; g.textAlign = 'center'; g.fillText(o.number || '7', w / 2, 190); TOPS.tee(g, w, h, c, o); },
  dress(g, w, h, c, o) { g.fillStyle = shade(c, 0.3); g.fillRect(0, 150, w, 14); g.strokeStyle = shade(c, -0.2); g.lineWidth = 6; g.beginPath(); g.arc(w / 2, -6, 50, 0, Math.PI); g.stroke(); },
};
const BOTTOMS = {
  plain() { },
  jeans(g, w, h, c) { g.strokeStyle = shade(c, -0.3); g.lineWidth = 4; g.beginPath(); g.moveTo(w * 0.5, 0); g.lineTo(w * 0.5, h * 0.84); g.stroke(); g.strokeStyle = shade(c, 0.28); g.lineWidth = 3; g.setLineDash([7, 6]); g.beginPath(); g.moveTo(w * 0.12, 10); g.lineTo(w * 0.12, h * 0.8); g.stroke(); g.setLineDash([]); },
  joggers(g, w, h, c, o) { g.fillStyle = o.stripe || '#fff'; g.fillRect(w * 0.78, 0, w * 0.09, h * 0.84); },
  cargo(g, w, h, c) { g.strokeStyle = shade(c, 0.3); g.lineWidth = 4; g.strokeRect(w * 0.2, h * 0.34, w * 0.6, h * 0.2); g.beginPath(); g.moveTo(w * 0.2, h * 0.4); g.lineTo(w * 0.8, h * 0.4); g.stroke(); },
  slacks(g, w, h, c) { g.strokeStyle = shade(c, 0.2); g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h * 0.84); g.stroke(); },
  shorts(g, w, h, c, o) { g.fillStyle = o.skin; g.fillRect(0, h * 0.42, w, h); },
  skirt(g, w, h, c, o) { g.fillStyle = o.skin; g.fillRect(0, h * 0.36, w, h); g.strokeStyle = shade(c, -0.2); g.lineWidth = 3; for (let x = 10; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.36); g.stroke(); } },
};
function shoe(g, w, h, o, front) {
  const y = h * 0.84; g.fillStyle = o.shoe; g.fillRect(0, y, w, h - y); g.fillStyle = o.sole; g.fillRect(0, h - 12, w, 12);
  if (front) { g.strokeStyle = shade(o.shoe, -0.35); g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * 0.3, y + 7 + i * 8); g.lineTo(w * 0.7, y + 7 + i * 8); g.stroke(); } }
}
function paintOutfit(o, seed) {
  const T = (w, h, fn) => canvasTex(w, h, g => fn(g, w, h));
  const top = TOPS[o.top] || TOPS.tee, bot = BOTTOMS[o.bottom] || BOTTOMS.plain, c = o.topColor, pc = o.bottomColor;
  const sleeveLen = o.sleeves === 'long' ? 0.86 : o.sleeves === 'none' ? 0 : 0.42;
  const armColor = o.top === 'vest' || o.top === 'cardigan' && false ? (o.inner || '#131316') : (o.sleeveColor || c);
  return {
    front: T(256, 256, (g, w, h) => { fabric(g, w, h, c, seed); top(g, w, h, c, o); if (o.logo) { g.fillStyle = o.logoColor || '#fff'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.fillText(o.logo, w / 2, 150); } }),
    back: T(256, 256, (g, w, h) => { fabric(g, w, h, c, seed + 1); if (o.top === 'stripes') TOPS.stripes(g, w, h, c, o); if (o.top === 'sweater') TOPS.sweater(g, w, h, c, o); }),
    side: T(128, 256, (g, w, h) => { fabric(g, w, h, c, seed + 2); if (o.top === 'stripes') { g.fillStyle = o.stripe || '#15151a'; for (let y = 10; y < h; y += 34) g.fillRect(0, y, w, 16); } }),
    arm: T(128, 256, (g, w, h) => {
      fabric(g, w, h, o.skin, seed + 3, 0.02);
      if (sleeveLen > 0) { g.save(); g.beginPath(); g.rect(0, 0, w, h * sleeveLen); g.clip(); fabric(g, w, h, armColor, seed + 4); if (o.top === 'stripes') { g.fillStyle = o.stripe || '#15151a'; for (let y = 10; y < h; y += 34) g.fillRect(0, y, w, 16); } g.restore(); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, h * sleeveLen - 10, w, 10); }
    }),
    leg: f => T(128, 256, (g, w, h) => { fabric(g, w, h, pc, seed + 5); bot(g, w, h, pc, o); shoe(g, w, h, o, f); }),
  };
}

// ───────────────────────── hair ─────────────────────────
const HR = 0.62, HH = 1.2; // head radius / height
function hairPreset(style, color, seed) {
  const g = new THREE.Group(), r = rng(seed * 7 + 3), m = mat(color), m2 = mat(shade(color, 0.05));
  const blob = (x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, mm = m) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mm); b.position.set(x, y, z); b.scale.set(sx, sy, sz); b.rotation.set(rx, ry, rz); b.castShadow = true; g.add(b); return b; };
  const cap = (down = 0.5, thick = 0.07) => { // skull cap: dome + band around the back and sides
    const R = HR + thick, dome = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.scale.y = 0.62; dome.position.y = HH - 0.26; dome.castShadow = true; g.add(dome);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, down, 28, 1, true, Math.PI * 0.42, Math.PI * 1.16), m); band.material.side = THREE.DoubleSide; band.position.y = HH - 0.26 - down / 2; band.castShadow = true; g.add(band);
  };
  if (style === 'bald') return g;
  if (style === 'buzz') { cap(0.22, 0.03); return g; }
  if (style === 'short' || style === 'swoop') { // neat cap with a chunky side-swept fringe
    cap(0.5); const n = 6;
    for (let i = 0; i < n; i++) { const k = i / (n - 1) - 0.5; blob(k * 1.02, HH - 0.2 + Math.abs(k) * -0.1, HR * 0.86 - Math.abs(k) * 0.16, 0.26, 0.13 + r() * 0.04, 0.2, 0.25, k * 1.1, -0.45 + k * 0.5); }
    blob(0.2, HH - 0.02, 0.18, 0.5, 0.2, 0.52, 0, 0, -0.2); for (const s of [-1, 1]) blob(s * (HR + 0.03), HH - 0.56, 0.2, 0.07, 0.2, 0.14);
    return g;
  }
  if (style === 'messy') { cap(0.46); for (let i = 0; i < 20; i++) { const a = r() * 6.28, rad = 0.12 + r() * 0.52; blob(Math.sin(a) * rad, HH - 0.12 + r() * 0.1 - rad * 0.22, Math.cos(a) * rad + 0.06, 0.2 + r() * 0.08, 0.11, 0.28, r() - 0.5, a, r() - 0.5, r() < 0.4 ? m2 : m); } for (let i = 0; i < 5; i++) blob((i - 2) * 0.24, HH - 0.3, HR * 0.9, 0.16, 0.2, 0.12, 0.3, 0, (i - 2) * 0.2); return g; }
  if (style === 'curly' || style === 'afro') { const big = style === 'afro' ? 1.25 : 1; for (let i = 0; i < 64; i++) { const a = r() * 6.28, e = r() * 1.45, R = (HR + 0.08) * big; const y = HH - 0.3 + Math.cos(e) * 0.5 * big, x = Math.sin(a) * Math.sin(e) * R, z = Math.cos(a) * Math.sin(e) * R; if (z > 0.3 && y < HH - 0.2) continue; const s = (0.16 + r() * 0.1) * big; blob(x, y, z, s, s, s, 0, 0, 0, r() < 0.35 ? m2 : m); } return g; }
  if (style === 'dreads') { cap(0.3, 0.05); for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.28 + r() * 0.2, front = Math.cos(a) > 0.35, len = front ? 0.34 + r() * 0.16 : 0.6 + r() * 0.3; const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, len, 3, 8), i % 3 ? m : m2); const R = HR + 0.06; d.position.set(Math.sin(a) * R, HH - 0.14 - len / 2, Math.cos(a) * R); d.rotation.set(Math.cos(a) * 0.22, 0, -Math.sin(a) * 0.22); d.castShadow = true; g.add(d); } for (let i = 0; i < 9; i++) { const a = r() * 6.28; blob(Math.sin(a) * 0.3, HH + 0.04, Math.cos(a) * 0.3, 0.2, 0.1, 0.2); } return g; }
  if (style === 'long' || style === 'wavy') { // long hair: curtain behind + wavy side strands + parted fringe
    cap(0.6); const back = box(HR * 2.1, 2.1, 0.34, m, 0.16); back.position.set(0, HH - 1.25, -HR * 0.78); g.add(back);
    for (const s of [-1, 1]) for (let i = 0; i < 12; i++) blob(s * (HR + 0.02 + Math.sin(i * 0.9) * 0.05), HH - 0.4 - i * 0.17, 0.02 + Math.cos(i * 0.9) * 0.05, 0.13, 0.17, 0.3, 0, 0, 0, i % 3 ? m : m2);
    for (const s of [-1, 1]) blob(s * 0.33, HH - 0.17, HR * 0.8, 0.4, 0.13, 0.2, 0.35, 0, s * -0.42); return g;
  }
  if (style === 'bob') { cap(0.86); const b = new THREE.Mesh(new THREE.CylinderGeometry(HR + 0.1, HR + 0.16, 0.9, 28, 1, true, Math.PI * 0.36, Math.PI * 1.28), m); b.material.side = THREE.DoubleSide; b.position.y = HH - 0.7; g.add(b); for (let i = 0; i < 5; i++) blob((i - 2) * 0.24, HH - 0.26, HR * 0.9, 0.15, 0.17, 0.12, 0.3); return g; }
  if (style === 'ponytail') { cap(0.5); for (let i = 0; i < 6; i++) blob(0, HH - 0.3 - i * 0.22, -HR - 0.14 - Math.sin(i * 0.7) * 0.14, 0.18 - i * 0.012, 0.18, 0.18); for (let i = 0; i < 5; i++) blob((i - 2) * 0.24, HH - 0.24, HR * 0.9, 0.15, 0.15, 0.12, 0.3); return g; }
  if (style === 'buns') { cap(0.5); for (const s of [-1, 1]) blob(s * 0.52, HH + 0.1, -0.05, 0.26, 0.26, 0.26); for (let i = 0; i < 5; i++) blob((i - 2) * 0.24, HH - 0.24, HR * 0.9, 0.15, 0.15, 0.12, 0.3); return g; }
  if (style === 'spiky') { cap(0.4); for (let i = 0; i < 16; i++) { const a = r() * 6.28, rad = r() * 0.5; const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 8), i % 2 ? m : m2); c.position.set(Math.sin(a) * rad, HH + 0.14 - rad * 0.2, Math.cos(a) * rad); c.rotation.set(Math.cos(a) * rad * 1.3, 0, -Math.sin(a) * rad * 1.3); c.castShadow = true; g.add(c); } return g; }
  cap(0.5); return g;
}

// ───────────────────────── the avatar ─────────────────────────
export const POSES = { // degrees. arm = [forward, outward]. leg = forward. head = [nod(+down), turn(+left), tilt]
  idle: { aL: [0, 5], aR: [0, 5], lL: 0, lR: 0 },
  open: { aL: [38, 52], aR: [38, 52] },            // palms-out explaining / "look at me" (the default hero pose)
  cheer: { aL: [168, 22], aR: [168, 22], head: [-12, 0, 0] },
  shrug: { aL: [10, 62], aR: [10, 62], head: [0, 0, 8] },
  wave: { aR: [165, 28], aL: [0, 6] },
  point: { aR: [88, 4], aL: [0, 6] },
  carry: { aL: [78, -6], aR: [78, -6] },
  reach: { aL: [120, 8], aR: [120, 8] },
  think: { aR: [128, -22], aL: [20, -30] },
  hips: { aL: [-12, 34], aR: [-12, 34] },
  shy: { aL: [24, -14], aR: [24, -14], head: [14, 0, 6] },
  slump: { aL: [6, 2], aR: [6, 2], head: [22, 0, 0], lean: [10, 0] },
  flex: { aL: [150, 60], aR: [150, 60] },
  sit: { lL: 90, lR: 90, aL: [42, 4], aR: [42, 4] },
  hug: { aL: [80, -30], aR: [80, -30] },
};
export function makeAvatar(opts = {}) {
  const o = { skin: SKIN.light, top: 'hoodie', topColor: '#22b01e', sleeves: 'short', bottom: 'jeans', bottomColor: '#3f74c8', shoe: '#f2f2f2', sole: '#d9d9d9', hair: 'short', hairColor: '#2b1b14', face: 'smile', height: 1, seed: 1, ...opts };
  if (SKIN[o.skin]) o.skin = SKIN[o.skin];
  const tx = paintOutfit(o, o.seed), skinM = mat(o.skin), topM = mat(o.topColor);
  const mk = (w, h, d, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); m.castShadow = m.receiveShadow = true; return m; };
  const root = new THREE.Group(), hip = new THREE.Group(); hip.position.y = 2; root.add(hip);
  const sideM = tmat(tx.side);
  const torso = mk(2, 2, 1, [sideM, sideM, topM, mat(o.bottomColor), tmat(tx.front), tmat(tx.back)]); torso.position.y = 1; hip.add(torso);
  const armM = tmat(tx.arm), limb = (x, y, mats, parent) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = mk(1, 2, 1, mats); m.position.y = -0.75 - (y === 0 ? 0.25 : 0); p.add(m); parent.add(p); return p; };
  const armTop = o.sleeves === 'none' ? skinM : mat(o.sleeveColor || o.topColor);
  const armL = limb(1.5, 1.75, [armM, armM, armTop, skinM, armM, armM], hip), armR = limb(-1.5, 1.75, [armM, armM, armTop, skinM, armM, armM], hip);
  const lS = tmat(tx.leg(false)), lF = tmat(tx.leg(true)), soleM = mat(o.sole), legMats = [lS, lS, mat(o.bottomColor), soleM, lF, lS];
  const legL = limb(0.5, 0, legMats, hip), legR = limb(-0.5, 0, legMats, hip);
  // head: rounded cylinder (lathe) + face shell + hair
  const prof = [], cr = 0.2; prof.push(new THREE.Vector2(0.001, 0));
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * Math.PI / 2; prof.push(new THREE.Vector2(HR - cr + Math.cos(a) * cr, cr + Math.sin(a) * cr)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; prof.push(new THREE.Vector2(HR - cr + Math.cos(a) * cr, HH - cr + Math.sin(a) * cr)); }
  prof.push(new THREE.Vector2(0.001, HH));
  const head = new THREE.Group(); head.position.y = 2; hip.add(head);
  const skull = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), skinM); skull.castShadow = true; head.add(skull);
  const neck = mk(0.5, 0.12, 0.5, skinM); neck.position.y = 0; head.add(neck);
  const arc = 150 * D2R, fg = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p.x * 1.006, p.y)), 28, -arc / 2, arc);
  const uv = fg.attributes.uv, pos = fg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) / HH);
  const fc = document.createElement('canvas'); fc.width = FW; fc.height = FH; const fctx = fc.getContext('2d');
  const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
  const faceMesh = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: ftex, transparent: true, depthWrite: false })); head.add(faceMesh);
  const hair = hairPreset(o.hair, o.hairColor, o.seed); head.add(hair);
  if (o.glasses) { const gm = mat(o.glasses === true ? '#16161a' : o.glasses); for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 8, 20), gm); f.position.set(s * 0.22, 0.66, HR * 0.94); f.rotation.y = s * 0.36; head.add(f); } const b = mk(0.14, 0.04, 0.04, gm); b.position.set(0, 0.68, HR + 0.02); head.add(b); }
  if (o.cap) { const cm = mat(o.cap); const c = new THREE.Mesh(new THREE.CylinderGeometry(HR + 0.05, HR + 0.07, 0.42, 28), cm); c.position.y = HH - 0.12; head.add(c); const brim = mk(1.0, 0.07, 0.6, cm); brim.position.set(0, HH - 0.3, HR + 0.2); head.add(brim); hair.visible = o.hair === 'long' || o.hair === 'ponytail'; }
  if (o.backpack) { const b = box(1.5, 1.6, 0.55, mat(o.backpack), 0.12); b.position.set(0, 1.05, -0.78); hip.add(b); }
  const hand = s => { const g = new THREE.Group(); g.position.y = -1.75; (s === 'L' ? armL : armR).add(g); return g; };
  const av = {
    root, hip, torso, head, armL, armR, legL, legR, hair, o, handL: hand('L'), handR: hand('R'), faceName: null, baseHeight: o.height,
    setFace(name, fo = {}) { const key = name + JSON.stringify(fo); if (key === av.faceName) return av; av.faceName = key; drawFace(fctx, name, { lx: 0, ly: 0, ...fo }); ftex.needsUpdate = true; return av; },
    place(x, z, ry = 0, y = 0) { root.position.set(x, y, z); root.rotation.set(0, ry, 0); return av; },
    size(s) { root.scale.setScalar(s); return av; },
    // pose: name or object; k blends from the current pose (1 = snap). Always call reset() first inside a shot.
    pose(p, k = 1) {
      const q = typeof p === 'string' ? POSES[p] : p; if (!q) return av;
      const set = (obj, ax, deg) => { obj.rotation[ax] = lerp(obj.rotation[ax], deg * D2R, k); };
      if (q.aL) { set(armL, 'x', -q.aL[0]); set(armL, 'z', q.aL[1]); } if (q.aR) { set(armR, 'x', -q.aR[0]); set(armR, 'z', -q.aR[1]); }
      if (q.lL !== undefined) set(legL, 'x', -q.lL); if (q.lR !== undefined) set(legR, 'x', -q.lR);
      if (q.head) { set(head, 'x', q.head[0]); set(head, 'y', q.head[1]); set(head, 'z', q.head[2]); }
      if (q.lean) { set(hip, 'x', q.lean[0]); set(hip, 'z', q.lean[1]); }
      return av;
    },
    reset() { for (const p of [armL, armR, legL, legR, head, hip]) p.rotation.set(0, 0, 0); hip.position.set(0, 2, 0); root.visible = true; return av.pose('idle'); },
    // procedural motion layers (call after pose). t in seconds.
    idle(t, amt = 1) { const s = o.seed * 1.7; hip.position.y += Math.sin(t * 2.2 + s) * 0.025 * amt; head.rotation.z += Math.sin(t * 1.3 + s) * 0.03 * amt; head.rotation.y += Math.sin(t * 0.9 + s * 2) * 0.05 * amt; armL.rotation.z += Math.sin(t * 2.2 + s) * 0.02 * amt; armR.rotation.z -= Math.sin(t * 2.2 + s) * 0.02 * amt; return av; },
    talk(t, amt = 1) { head.rotation.x += Math.sin(t * 13) * 0.035 * amt; hip.position.y += Math.abs(Math.sin(t * 6.5)) * 0.03 * amt; return av; },
    walk(t, speed = 1, swing = 38) { const ph = t * 7.2 * speed, s = Math.sin(ph) * swing * D2R; legL.rotation.x = -s; legR.rotation.x = s; armL.rotation.x = s * 0.9; armR.rotation.x = -s * 0.9; hip.position.y = 2 + Math.abs(Math.cos(ph)) * 0.09; hip.rotation.z = Math.sin(ph) * 0.03; return av; },
    run(t, speed = 1) { av.walk(t, speed * 1.5, 62); hip.rotation.x = 0.2; return av; },
    sit(seatY = 1.3) { av.pose('sit'); hip.position.y = seatY + 0.5; return av; },
    jump(k, h = 1) { hip.position.y += Math.sin(clamp(k) * Math.PI) * h; return av; },
    lookAt(x, z) { const dx = x - root.position.x, dz = z - root.position.z; head.rotation.y += clamp(Math.atan2(dx, dz) - root.rotation.y, -1, 1) * 0.8; return av; },
  };
  PRE.push(() => { root.visible = false; });   // hidden unless the shot calls reset()
  av.size(o.height).reset().setFace(o.face); return av;
}
