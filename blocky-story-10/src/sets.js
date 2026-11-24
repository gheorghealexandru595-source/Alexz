// sets.js: prop library + ready-made sets in the bright toy-town look. 1 unit = 1 stud; an avatar is 5.2 tall.
// Every set returns { group, light, ... }. Sets face the camera: back wall at -z, camera lives at +z looking toward -z.
import * as THREE from 'three';
import { canvasTex, mat, tmat, glow, box, at, grp, sign, rng, shade, fabric } from './util.js';

// ── tiling textures
export const TEX = {
  checker: (a, b) => canvasTex(128, 128, g => { g.fillStyle = a; g.fillRect(0, 0, 128, 128); g.fillStyle = b; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); }),
  wood: (c = '#d99a4e') => canvasTex(256, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(5); for (let y = 0; y < h; y += 32) { g.fillStyle = shade(c, (r() - 0.5) * 0.16); g.fillRect(0, y, w, 31); g.fillStyle = shade(c, -0.3); g.fillRect(0, y + 31, w, 1.5); const x = r() * w; g.fillRect(x, y, 1.5, 32); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(90,50,10,0.10)'; g.fillRect(r() * w, y + r() * 30, 40 + r() * 80, 1.2); } } }),
  brick: (c = '#d9634f', m = '#f1ded4') => canvasTex(256, 256, (g, w, h) => { g.fillStyle = m; g.fillRect(0, 0, w, h); const r = rng(9); for (let j = 0; j < 8; j++) for (let i = -1; i < 4; i++) { g.fillStyle = shade(c, (r() - 0.5) * 0.2); g.fillRect(i * 64 + (j % 2) * 32 + 2, j * 32 + 2, 60, 28); } }),
  grass: (c = '#58b94a') => canvasTex(128, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 500; i++) { g.fillStyle = shade(c, (r() - 0.5) * 0.22); g.fillRect(r() * w, r() * h, 3, 3); } }),
  road: () => canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#3f4046'; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } }),
  concrete: (c = '#cfcbc4') => canvasTex(128, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); const r = rng(6); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } g.strokeStyle = 'rgba(0,0,0,0.12)'; g.strokeRect(0, 0, w, h); }),
};
const rep = (t, x, y) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(x, y); c.needsUpdate = true; return c; };
export function floor(w, d, tex, tile = 4) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tmat(rep(tex, w / tile, d / tile))); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; }
export function wall(w, h, color, o = {}) { // wall plane facing +z with optional wainscot/trim strip
  const g = grp(); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), o.tex ? tmat(rep(o.tex, w / 8, h / 8)) : mat(color)); m.position.y = h / 2; m.receiveShadow = true; g.add(m);
  if (o.trim) g.add(at(box(w, 0.5, 0.2, o.trim), 0, o.trimY || 7.6, 0.1)); if (o.base) g.add(at(box(w, 0.6, 0.16, o.base), 0, 0.3, 0.08)); return g;
}
export function lightPanel(w = 4, d = 1.6) { return box(w, 0.2, d, glow('#ffffff', 2.4)); }
export function windowPane(w = 4, h = 4, sky = '#9fd8ff') { const g = grp(box(w + 0.5, h + 0.5, 0.25, '#ffffff')); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(sky, 1.25)); p.position.z = 0.14; g.add(p, at(box(0.16, h, 0.3, '#ffffff'), 0, 0, 0.05), at(box(w, 0.16, 0.3, '#ffffff'), 0, 0, 0.05)); return g; }

// ── props (origin at floor centre unless noted)
export function lockers(n = 6, color = '#2f7de1') {
  const g = grp(), t = canvasTex(128, 512, (c, w, h) => { fabric(c, w, h, color, 3, 0.03); c.strokeStyle = shade(color, -0.35); c.lineWidth = 5; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = shade(color, -0.38); for (let i = 0; i < 3; i++) c.fillRect(26, 40 + i * 22, w - 52, 9); c.fillStyle = '#d9dde3'; c.fillRect(w - 26, h * 0.5, 9, 44); });
  for (let i = 0; i < n; i++) { const m = box(1.7, 6.6, 1.1, [mat(shade(color, -0.1)), mat(shade(color, -0.1)), mat(shade(color, -0.15)), mat(color), tmat(t), mat(color)]); m.position.set((i - (n - 1) / 2) * 1.7, 3.3, 0); g.add(m); } return g;
}
export function door(text = 'ROOM 12', color = '#b9783f') { const g = grp(at(box(4.3, 8.3, 0.3, '#f4efe6'), 0, 4.15, 0), at(box(3.7, 7.8, 0.2, color), 0, 3.9, 0.12), at(box(1.5, 2, 0.06, glow('#bfe6ff', 1.1)), 0.8, 5.6, 0.24), at(box(0.3, 0.3, 0.3, '#d8c070', 0.1), -1.4, 3.8, 0.3)); if (text) g.add(at(sign(text, 2.6, 0.9, { bg: '#1f6b43', fg: '#fff' }), 0, 9.1, 0.1)); return g; }
export function bunting(w = 20, colors = ['#f0892b', '#2f9e55', '#ffffff']) { const g = grp(); const n = Math.floor(w / 1.1); for (let i = 0; i < n; i++) { const f = box(0.8, 1.1, 0.04, colors[i % colors.length]); f.position.set((i - (n - 1) / 2) * 1.1, -0.55 - Math.sin((i / (n - 1)) * Math.PI) * 0.7, 0); g.add(f); } return g; }
export function desk(color = '#e2b36b') { return grp(at(box(3.4, 0.22, 2.2, color, 0.06), 0, 2.6, 0), ...[[-1.5, -0.9], [1.5, -0.9], [-1.5, 0.9], [1.5, 0.9]].map(p => at(box(0.16, 2.5, 0.16, '#5c6068'), p[0], 1.25, p[1]))); }
export function chair(color = '#2b7de0', seatY = 1.5) { return grp(at(box(1.9, 0.2, 1.8, color, 0.06), 0, seatY, 0), at(box(1.9, 2.3, 0.2, color, 0.06), 0, seatY + 1.25, -0.85), ...[[-0.8, -0.75], [0.8, -0.75], [-0.8, 0.75], [0.8, 0.75]].map(p => at(box(0.14, seatY, 0.14, '#6a6e76'), p[0], seatY / 2, p[1]))); }
export function table(w = 9, d = 3.2, color = '#2f95e6', y = 2.7) { return grp(at(box(w, 0.26, d, color, 0.08), 0, y, 0), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(p => at(box(0.2, y, 0.2, '#7a7e86'), p[0] * (w / 2 - 0.5), y / 2, p[1] * (d / 2 - 0.4)))); }
export function bookStack(n = 7, seed = 2) { const g = grp(), r = rng(seed), cs = ['#f26a1b', '#7b3fc4', '#f2b01e', '#2e9e59', '#e0228c', '#19a7a0', '#3d6fe0']; for (let i = 0; i < n; i++) { const b = box(1.9 + r() * 0.3, 0.34, 1.4, cs[i % cs.length]); b.position.set((r() - 0.5) * 0.25, 0.17 + i * 0.34, 0); b.rotation.y = (r() - 0.5) * 0.3; g.add(b); } return g; }
export function bookshelf(w = 5, h = 7) { const g = grp(at(box(w, h, 1.2, '#b9783f'), 0, h / 2, 0)), r = rng(8), cs = ['#e0422e', '#2e7de0', '#f2b01e', '#2e9e59', '#8a4fd0']; for (let s = 0; s < 4; s++) { g.add(at(box(w - 0.4, 1.3, 0.2, '#8a5628'), 0, 1 + s * 1.6, 0.56)); for (let x = -w / 2 + 0.5; x < w / 2 - 0.4; x += 0.36) g.add(at(box(0.3, 0.9 + r() * 0.3, 0.8, cs[Math.floor(r() * 5)]), x, 0.9 + s * 1.6, 0.3)); } return g; }
export function tray(food = true) { const g = grp(at(box(2.4, 0.1, 1.6, '#ff9f2e', 0.04), 0, 0.05, 0)); if (food) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 3), mat('#ffd23f')); p.position.set(0.4, 0.17, 0); p.rotation.y = 0.5; g.add(p); for (const q of [[0.3, 0.1], [0.55, -0.15], [0.2, -0.25]]) g.add(at(box(0.16, 0.05, 0.16, '#d62c2c', 0.03), q[0], 0.25, q[1])); const a = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mat('#e02020')); a.position.set(-0.7, 0.38, 0.3); g.add(a, at(box(0.36, 0.6, 0.36, '#f4f4f4'), -0.7, 0.4, -0.4), at(box(0.38, 0.18, 0.38, '#3d8ee8'), -0.7, 0.78, -0.4)); } return g; }
export function trashCan(color = '#2aa86a') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 1.9, 16), mat(color)); m.position.y = 0.95; m.castShadow = true; return grp(m); }
export function plant() { const g = grp(at(box(1, 1, 1, '#c8703a', 0.1), 0, 0.5, 0)); for (const p of [[0, 1.8, 0, 0.8], [0.4, 1.4, 0.2, 0.55], [-0.4, 1.5, -0.1, 0.6]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 12, 9), mat('#3aa64a')); s.position.set(p[0], p[1], p[2]); s.castShadow = true; g.add(s); } return g; }
export function tree(h = 9, c = '#3f9b3f') { const g = grp(at(box(0.9, h * 0.55, 0.9, '#8a5a34'), 0, h * 0.27, 0)); for (const p of [[0, h * 0.72, 0, h * 0.3], [h * 0.16, h * 0.6, 0.3, h * 0.2], [-h * 0.17, h * 0.62, -0.2, h * 0.21], [0, h * 0.9, 0.1, h * 0.19]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 16, 12), mat(c)); s.position.set(p[0], p[1], p[2]); s.castShadow = true; g.add(s); } return g; }
export function bush(c = '#3f9b3f') { const g = grp(); for (const p of [[0, 0.7, 0, 0.9], [0.8, 0.55, 0.1, 0.7], [-0.8, 0.55, 0, 0.7]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(p[3], 12, 9), mat(c)); s.position.set(p[0], p[1], p[2]); s.castShadow = true; g.add(s); } return g; }
export function lampPost(h = 11) { return grp(at(box(0.3, h, 0.3, '#17181c'), 0, h / 2, 0), at(box(1, 0.3, 1, '#17181c'), 0, 0.15, 0), at(box(1.1, 1.3, 1.1, glow('#fff3c4', 1.2)), 0, h + 0.5, 0), at(box(1.4, 0.25, 1.4, '#17181c'), 0, h + 1.25, 0)); }
export function bench(c = '#b9783f') { return grp(at(box(4.2, 0.25, 1.4, c, 0.05), 0, 1.4, 0), at(box(4.2, 1.5, 0.22, c, 0.05), 0, 2.3, -0.6), at(box(0.25, 1.4, 1.3, '#3b3d44'), -1.8, 0.7, 0), at(box(0.25, 1.4, 1.3, '#3b3d44'), 1.8, 0.7, 0)); }
export function counter(w = 7, c = '#ffffff', top = '#ff2f92') { return grp(at(box(w, 3, 1.8, c), 0, 1.5, 0), at(box(w + 0.3, 0.3, 2.1, top, 0.06), 0, 3.15, 0)); }
export function register() { return grp(at(box(1.5, 0.9, 1.3, '#e9eef2', 0.08), 0, 0.45, 0), at(box(1.3, 0.8, 0.12, '#2b2f38'), 0, 1.35, -0.3), at(box(0.9, 0.12, 0.5, '#5ad1c2'), 0, 0.92, 0.25)); }
export function shelf(w = 7, color = '#ff5fa8', seed = 4) { const g = grp(), r = rng(seed), cs = ['#ffb37a', '#ff7aa8', '#ffe07a', '#f4f4f4', '#ff9a5a']; for (let s = 0; s < 4; s++) { g.add(at(box(w, 0.25, 1.4, color), 0, 1.6 + s * 2, 0)); for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 1.25) g.add(at(box(0.85, 0.9 + r() * 0.5, 0.9, cs[Math.floor(r() * 5)], 0.06), x, 2.2 + s * 2, 0)); } return g; }
export function bed(c = '#4f8fe8') { return grp(at(box(4.6, 1.2, 8, '#f4efe6', 0.15), 0, 1.3, 0), at(box(4.7, 0.5, 5.4, c, 0.2), 0, 2, 1.2), at(box(3.2, 0.6, 1.6, '#ffffff', 0.25), 0, 2.1, -2.8), at(box(4.9, 3.6, 0.4, '#b9783f', 0.1), 0, 1.8, -4.1), at(box(4.6, 0.7, 8, '#b9783f'), 0, 0.35, 0)); }
export function sofa(c = '#e8734f') { return grp(at(box(7, 1.3, 2.8, c, 0.25), 0, 1.1, 0), at(box(7, 2.4, 0.9, c, 0.25), 0, 2.4, -1), at(box(0.9, 2, 2.8, c, 0.25), -3.4, 1.6, 0), at(box(0.9, 2, 2.8, c, 0.25), 3.4, 1.6, 0)); }
export function tv() { return grp(at(box(6, 1.6, 1.6, '#b9783f'), 0, 0.8, 0), at(box(5.2, 3, 0.25, '#17181c'), 0, 3.3, 0), at(box(4.8, 2.6, 0.06, glow('#7fd0ff', 1.1)), 0, 3.3, 0.14)); }
export function rug(w = 8, d = 5, c = '#f2a7c3') { return at(box(w, 0.06, d, c, 0.02), 0, 0.03, 0); }
// building facade (shop, school wing, house). o: {brick, sign, signBg, awning, door, windows:[cols,rows]}
export function building(w = 16, h = 14, d = 8, color = '#f2c7d0', o = {}) {
  const g = grp(), body = box(w, h, d, o.brick ? tmat(rep(TEX.brick(o.brick === true ? '#d9634f' : o.brick), w / 5, h / 5)) : mat(color)); body.position.y = h / 2; g.add(body, at(box(w + 0.6, 0.6, d + 0.6, '#ffffff'), 0, h + 0.3, 0));
  const [cols, rows] = o.windows || [3, 2]; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = (c - (cols - 1) / 2) * (w / cols), y = (o.door ? 9 : 5) + r * 4.6; if (y + 2 < h) g.add(at(windowPane(2.6, 3, '#9fd8ff'), x, y, d / 2 + 0.05)); }
  if (o.door !== false) { g.add(at(box(3.6, 6.6, 0.3, '#ffffff'), 0, 3.3, d / 2 + 0.05), at(box(3, 6.2, 0.2, o.doorColor || '#2f8fe6'), 0, 3.1, d / 2 + 0.16)); }
  if (o.awning) { for (let i = 0; i < 8; i++) g.add(at(box(w / 8, 0.3, 2.6, i % 2 ? '#ffffff' : o.awning), -w / 2 + (i + 0.5) * w / 8, 7.4, d / 2 + 1.2)); }
  if (o.sign) g.add(at(sign(o.sign, Math.min(w - 2, 11), 1.7, { bg: o.signBg || '#ffffff', fg: o.signFg || '#2c8a4b', border: o.signFg || '#2c8a4b' }), 0, o.signY || 8.8, d / 2 + 0.5));
  return g;
}
export function sky(top = '#3fa9f5', bottom = '#bfe8ff') { // gradient dome + soft clouds; also add to any outdoor set
  const t = canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.6, bottom); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(11); for (let i = 0; i < 16; i++) { const x = r() * w, y = 120 + r() * 170; g.fillStyle = 'rgba(255,255,255,0.75)'; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(x + j * 13 - 26, y + (j % 2) * 5, 20, 9, 0, 0, 7); g.fill(); } } });
  return new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
}
// room shell: floor + back wall + side walls + ceiling with light panels. Interior width w (x), depth d (z), height h.
export function room(o = {}) {
  const { w = 44, d = 26, h = 13, floorTex = TEX.checker('#ffffff', '#a9d3ee'), tile = 4.4, wallColor = '#efe6cf', trim = '#a56a3a', ceiling = '#dcd8cf', lights = 3, back = -6 } = o;
  const g = grp(at(floor(w, d, floorTex, tile), 0, 0, back + d / 2));
  g.add(at(wall(w, h, wallColor, { trim, trimY: o.trimY || 7.8 }), 0, 0, back));
  const l = at(wall(d, h, wallColor, { trim, trimY: o.trimY || 7.8 }), -w / 2, 0, back + d / 2, Math.PI / 2), r = at(wall(d, h, wallColor, { trim, trimY: o.trimY || 7.8 }), w / 2, 0, back + d / 2, -Math.PI / 2); g.add(l, r);
  const c = box(w, 0.3, d, new THREE.MeshBasicMaterial({ color: ceiling })); c.position.set(0, h + 0.15, back + d / 2); c.castShadow = false; g.add(c);
  for (let i = 0; i < lights; i++) for (let j = 0; j < 2; j++) g.add(at(lightPanel(), (i - (lights - 1) / 2) * (w / lights), h - 0.05, back + 5 + j * 9));
  return g;
}

// ───────────────────────── ready-made sets ─────────────────────────
// Characters stand around z = 0..6. Back wall at z = -6. Typical camera z = 8..20.
export const SETS = {
  hallway(o = {}) { // school corridor: lockers along the back wall, checker floor, banner, door, bunting
    const { locker = '#2f6fd8', banner = 'GO\nTIGERS!', bannerBg = '#e8632b', door: dr = 'ROOM 12' } = o;
    const g = room({ floorTex: TEX.checker('#ffffff', '#a9d3ee'), wallColor: o.wall || '#efe6cf', w: 60 });
    g.add(at(lockers(9, locker), -10, 0, -5.4), at(lockers(8, locker), 12.6, 0, -5.4), at(door(dr), 2.7, 0, -5.9));
    if (banner) g.add(at(sign(banner, 4.6, 3.2, { bg: bannerBg, fg: shade(bannerBg, -0.72) }), -10, 9.9, -5.85));
    if (o.poster) g.add(at(sign(o.poster, 4.4, 2.4, { bg: o.posterBg || '#7b3fc4', fg: '#fff' }), 13, 9.6, -5.85));
    g.add(at(bunting(40), 0, 12.6, 2), at(trashCan(), 20.5, 0, -4.6), at(plant(), -19, 0, -4.8));
    return { group: g, light: 'indoor' };
  },
  classroom(o = {}) { // wood floor, mint walls, whiteboard, desk grid behind the action
    const g = room({ floorTex: TEX.wood('#dca55a'), tile: 6, wallColor: o.wall || '#cfe9da', trim: '#f0cf63', trimY: 11.2, w: 40 });
    g.add(at(sign(o.board || ['READING', 'Chapter 7'], 15, 6.6, { bg: '#fbfbf8', fg: '#2d5fd0', weight: 500, border: '#5b5f66' }), 0, 6.6, -5.85));
    g.add(at(sign('A B C D E F G H I J K L M N O P', 16, 0.8, { bg: '#fff3c9', fg: '#d53a2a' }), 0, 10.6, -5.84), at(bookshelf(), -15, 0, -5), at(plant(), 15, 0, -4.8), at(windowPane(5, 5), -19.9, 6.5, 4, Math.PI / 2));
    // desks face the board. seats[i] = [x, z] of each chair (sit with av.place(x, z, Math.PI).sit(1.5)); hide with set.desks.visible = false
    const desks = grp(), seats = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { desks.add(at(grp(desk(), at(chair('#2b7de0'), 0, 0, 1.9, Math.PI)), (c - 1.5) * 6, 0, 8 + r * 6)); seats.push([(c - 1.5) * 6, 9.9 + r * 6]); } g.add(desks);
    return { group: g, light: 'indoor', desks, seats, reset() { desks.visible = true; } };
  },
  cafeteria(o = {}) { // yellow checker floor, blue tables, menu chalkboard, big windows
    const g = room({ floorTex: TEX.checker('#fff6cf', '#ffd95e'), wallColor: o.wall || '#e9eef2', trim: '#8fd0c0', trimY: 4.2, w: 56, d: 34 });
    g.add(at(sign(o.menu || 'TODAY: PIZZA!', 11, 2.6, { bg: '#22262b', fg: '#ffd84a', border: '#b9783f' }), -8, 8.4, -5.85), at(sign(o.rule || 'NO FOOD\nFIGHTS', 4.6, 2.8, { bg: '#e84b4b', fg: '#fff' }), 9, 8.6, -5.85));
    for (const x of [18, 24]) g.add(at(windowPane(4.6, 6), x, 7, -5.85));
    // 3 x 2 tables. Table centre c,r is at x = (c-1)*15, z = 6 + r*10, top at y = 2.7. Chairs at x±2.4, z±2.6 (seat y 1.5).
    // Sit facing the camera: av.place(tx - 2.4, tz - 2.6, 0).sit(1.5). The standing zone is z = -3..2 in front of the wall.
    const tables = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const t = grp(table(), at(chair(c % 2 ? '#2e9e59' : '#2b7de0'), -2.4, 0, 2.6, Math.PI), at(chair('#f2b01e'), 2.4, 0, 2.6, Math.PI), at(chair('#2b7de0'), -2.4, 0, -2.6), at(chair('#2e9e59'), 2.4, 0, -2.6)); at(t, (c - 1) * 15, 0, 6 + r * 10); g.add(t); tables.push(t); }
    return { group: g, light: 'indoor', tables };
  },
  schoolFront(o = {}) { // brick school with sign, clock, flag, lawn, sidewalk and road
    const g = grp(sky(), at(floor(160, 80, TEX.grass(), 6), 0, -0.02, -20), at(floor(160, 9, TEX.concrete(), 5), 0, 0.02, 6), at(floor(160, 16, TEX.road(), 6), 0, 0.01, 18.5));
    for (let i = -6; i <= 6; i++) g.add(at(box(4, 0.04, 0.6, '#ffffff'), i * 9, 0.04, 18.5));
    g.add(at(building(46, 17, 12, '#c2483a', { brick: true, windows: [7, 2], sign: o.name || 'MAPLE HILL SCHOOL', signY: 9.4, doorColor: '#2f8fe6' }), 0, 0, -12));
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 28), mat('#ffffff')); clock.rotation.x = Math.PI / 2; clock.position.set(7, 13.4, -5.8); g.add(clock, at(box(0.12, 1, 0.1, '#222'), 7, 13.8, -5.6), at(box(0.7, 0.12, 0.1, '#222'), 7.3, 13.4, -5.6));
    g.add(at(box(0.3, 20, 0.3, '#d9dde3'), -17, 10, -2), at(box(3.6, 2.2, 0.1, o.flag || '#e8413c'), -15.1, 18.6, -2), at(box(3.6, 0.7, 0.12, '#ffffff'), -15.1, 18.6, -2));
    g.add(at(lampPost(), -6, 0, 2.4), at(lampPost(), 16, 0, 2.4), at(trashCan(), -11, 0, 2.6), at(bush(), -14, 0, -4.6), at(bush(), 13, 0, -4.6), at(tree(11), -26, 0, -3), at(tree(10), 28, 0, -2));
    return { group: g, light: 'outdoor' };
  },
  street(o = {}) { // pastel town street: row of shops with awnings, lamp posts, trees
    const g = grp(sky(), at(floor(200, 60, TEX.grass(), 6), 0, -0.03, -30), at(floor(200, 10, TEX.concrete(), 5), 0, 0.02, 4), at(floor(200, 16, TEX.road(), 6), 0, 0.01, 17));
    for (let i = -8; i <= 8; i++) g.add(at(box(4, 0.04, 0.6, '#ffe45c'), i * 9, 0.04, 17));
    const shops = o.shops || [['BAKERY', '#f8c5c7', '#e84b6a'], ['TOYS', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['PETS', '#e4d0ff', '#7b3fc4']];
    shops.forEach((s, i) => g.add(at(building(15, 13 + (i % 2) * 3, 10, s[1], { sign: s[0], signFg: s[2], awning: s[2], windows: [2, 2], doorColor: s[2] }), (i - (shops.length - 1) / 2) * 16.5, 0, -7)));
    for (const x of [-25, -8, 8, 25]) g.add(at(lampPost(), x, 0, 7.6)); g.add(at(tree(9), -17, 0, 8), at(tree(9), 17, 0, 8), at(bench(), 0, 0, 0.5), at(trashCan(), 4.5, 0, 0.6));
    return { group: g, light: 'outdoor' };
  },
  shop(o = {}) { // boutique: pink shelves, counter with register
    const g = room({ floorTex: TEX.checker('#ffffff', '#ffe3ee'), wallColor: o.wall || '#fff4ea', trim: '#ff8fbd', w: 36, d: 24 });
    g.add(at(shelf(8), -10, 0, -5), at(shelf(8, '#ff8fbd', 9), 10, 0, -5), at(counter(), 0, 0, -2), at(register(), 1.8, 3.3, -2));
    if (o.sign) g.add(at(sign(o.sign, 8, 1.8, { bg: '#ff2f92', fg: '#fff' }), 0, 10.6, -5.85));
    return { group: g, light: 'indoor' };
  },
  bedroom(o = {}) {
    const g = room({ floorTex: TEX.wood('#d8a25c'), tile: 6, wallColor: o.wall || '#cfe0ff', trim: '#ffffff', trimY: 0.6, w: 30, d: 22, lights: 1 });
    g.add(at(bed(o.bed), -8, 0, -1.2), at(rug(9, 6, o.rug || '#ffd0df'), 3, 0, 4), at(windowPane(5, 5), 4, 7.4, -5.85), at(bookshelf(4, 6), 12, 0, -5), at(desk('#f4efe6'), 9, 0, 3), at(sign(o.poster || 'DREAM\nBIG', 3, 3.6, { bg: '#ffcf3f', fg: '#3a2a00' }), -3, 8.6, -5.85));
    return { group: g, light: 'warm' };
  },
  livingRoom(o = {}) {
    const g = room({ floorTex: TEX.wood('#c98f52'), tile: 6, wallColor: o.wall || '#f6e4c8', trim: '#ffffff', trimY: 0.6, w: 34, d: 24, lights: 1 });
    g.add(at(sofa(o.sofa), -4, 0, -3.6), at(rug(11, 6, '#9fd3c7'), -4, 0, 2), at(tv(), 12, 0, 0, -Math.PI / 2), at(plant(), -13, 0, -4.6), at(windowPane(6, 5), 6, 7.4, -5.85), at(sign('HOME\nSWEET\nHOME', 3, 3, { bg: '#fff', fg: '#e8632b', border: '#b9783f' }), -4, 9, -5.85));
    return { group: g, light: 'warm' };
  },
  park(o = {}) {
    const g = grp(sky(), at(floor(200, 120, TEX.grass('#5cc04c'), 6), 0, -0.02, -20), at(floor(200, 7, TEX.concrete('#e6dcc6'), 5), 0, 0.02, 3));
    const r = rng(21); for (let i = 0; i < 12; i++) g.add(at(tree(8 + r() * 5, r() < 0.5 ? '#3f9b3f' : '#58b044'), (i - 5.5) * 13 + r() * 5, 0, -10 - r() * 26));
    g.add(at(bench(), -7, 0, -1.4), at(bench(), 9, 0, -1.4), at(lampPost(), 1, 0, -1.6), at(bush(), -14, 0, -3), at(bush(), 16, 0, -3.4), at(trashCan(), 13.5, 0, -1.2));
    return { group: g, light: 'outdoor' };
  },
};
