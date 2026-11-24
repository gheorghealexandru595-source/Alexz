// util.js: maths, seeded random, canvas textures, basic meshes. No render-time randomness anywhere.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// hooks run at the start of every frame: avatars and effects hide themselves, a shot shows only what it touches
export const PRE = [];
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const remap = (x, a, b) => clamp((x - a) / (b - a));
export const E = {
  lin: k => k,
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  // overshoot then settle (used for pops and growth)
  back: k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export const col = c => new THREE.Color(c);
export function shade(c, k) { // k<0 darker, k>0 lighter
  const o = col(c); return '#' + (k < 0 ? o.multiplyScalar(1 + k) : o.lerp(col('#fff'), k)).getHexString();
}

export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
}
// soft fabric / plastic shading drawn into a texture so flat boxes do not look flat
export function fabric(g, w, h, base, seed = 1, amt = 0.05) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${amt * r()})` : `rgba(0,0,0,${amt * r()})`;
    const x = r() * w, y = r() * h; g.fillRect(x, y, 2 + r() * w * 0.12, 1 + r() * 2);
  }
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.16)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
export const mat = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
export const tmat = (map, o = {}) => new THREE.MeshLambertMaterial({ map, ...o });
export const glow = (color, k = 1.6) => new THREE.MeshBasicMaterial({ color: col(color).multiplyScalar(k), toneMapped: false });

export function box(w, h, d, material, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(g, typeof material === 'string' ? mat(material) : material);
  m.castShadow = m.receiveShadow = true; return m;
}
export function at(o, x = 0, y = 0, z = 0, ry = 0) { o.position.set(x, y, z); o.rotation.y = ry; return o; }
export function grp(...kids) { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; }

// sign / poster / board with text. lines: string or [strings]. Returns a plane w x h (studs) facing +z.
export function sign(text, w, h, o = {}) {
  const { bg = '#e8632b', fg = '#3a1c0c', font = 'Montserrat', weight = 800, border = null, pad = 0.12, glowing = false, align = 'center' } = o;
  const lines = Array.isArray(text) ? text : String(text).split('\n');
  const px = 128, cw = Math.round(w * px), ch = Math.round(h * px);
  const t = canvasTex(cw, ch, g => {
    g.fillStyle = bg; g.fillRect(0, 0, cw, ch);
    if (border) { g.strokeStyle = border; g.lineWidth = px * 0.1; g.strokeRect(px * 0.05, px * 0.05, cw - px * 0.1, ch - px * 0.1); }
    let size = (ch * (1 - 2 * pad)) / lines.length;
    g.textBaseline = 'middle'; g.textAlign = align; g.fillStyle = fg;
    const fit = () => { g.font = `${weight} ${size}px ${font}`; return Math.max(...lines.map(l => g.measureText(l).width)); };
    while (fit() > cw * (1 - 2 * pad) && size > 8) size *= 0.94;
    lines.forEach((l, i) => g.fillText(l, align === 'center' ? cw / 2 : cw * pad, ch / 2 + (i - (lines.length - 1) / 2) * size * 1.08));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowing ? new THREE.MeshBasicMaterial({ map: t }) : tmat(t));
  m.receiveShadow = true; return m;
}
