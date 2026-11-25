// night.js: night-town sets (sky with moon and stars, pastel houses, string lights, basketball court)
import * as THREE from 'three';
import { TEX, floor, tree, lampPost } from './sets.js';
import { box, grp, at, mat, glow, sign, canvasTex, rng } from './util.js';
// ───────── night neighbourhood (built here: houses, string lights, moon, stars, basketball court) ─────────
export function nightSky() {
  const t = canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1230'); gr.addColorStop(0.55, '#24305e'); gr.addColorStop(1, '#4a4a7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * w, r() * h * 0.6, s, s); } });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), glow('#fff6dc', 1.5)); moon.position.set(60, 110, -300);
  return grp(dome, moon);
}
export function house(color, roof, lit) {
  const g = grp(at(box(10, 7, 8, color, 0.1), 0, 3.5, 0));
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 3.6, 4, 1), mat(roof)); r.rotation.y = Math.PI / 4; r.scale.set(1.08, 1, 0.86); r.position.y = 8.8; r.castShadow = true; g.add(r);
  const win = c => glow(c, lit ? 1.5 : 0.25);
  g.add(at(box(2.4, 4.6, 0.3, '#5a3524'), 0, 2.3, 4.05), at(box(0.25, 0.25, 0.3, '#ffd23f'), 0.8, 2.3, 4.25));
  for (const x of [-3.2, 3.2]) g.add(at(box(2.2, 2.0, 0.2, win(lit ? '#ffd98a' : '#2a3150')), x, 4.0, 4.05), at(box(2.5, 0.2, 0.3, '#f4f4f4'), x, 2.95, 4.1));
  g.add(at(box(3.6, 0.5, 1.6, '#9aa0a8'), 0, 0.25, 4.8));   // step
  return g;
}
export function stringLights(w, y = 0, cols = ['#ffcf5a', '#ff6fae', '#7fd0ff', '#9be37a']) {
  const g = grp(), n = Math.floor(w / 1.4);
  for (let i = 0; i < n; i++) { const k = i / (n - 1), b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glow(cols[i % cols.length], 1.6)); b.position.set(-w / 2 + k * w, y - Math.sin(k * Math.PI) * 1.2, 0); g.add(b); }
  return g;
}
export const HOUSES = [['#f2c7d0', '#b84a5a'], ['#bfe3ff', '#2f5f9a'], ['#fff0b8', '#c9822a'], ['#d6f2c4', '#3f8a4a'], ['#e4d0ff', '#6a4ab0'], ['#ffd9c2', '#b8603a']];
export const FINNX = 0;   // Finn's house sits at x = 0 on the near row
export function neighbourhood() {
  const g = grp(nightSky(), at(floor(260, 160, TEX.grass('#3f8a4a'), 6), 0, -0.03, -20), at(floor(260, 8, TEX.concrete('#b8b4ad'), 5), 0, 0.02, 7), at(floor(260, 14, TEX.road(), 6), 0, 0.01, 18));
  for (let i = -10; i <= 10; i++) g.add(at(box(4, 0.04, 0.6, '#ffe45c'), i * 9, 0.04, 18));
  const lit = [], dark = [];
  for (let i = -3; i <= 3; i++) {
    const [c, r] = HOUSES[(i + 9) % 6], x = i * 14;
    const hl = at(house(c, r, true), x, 0, -2), hd = at(house(i === 0 ? '#9aa0b0' : c, i === 0 ? '#4a4f5e' : r, false), x, 0, -2);
    g.add(hl, hd); lit.push(hl); dark.push(hd); hd.visible = i === 0; hl.visible = i !== 0;
    if (i !== 0) g.add(at(stringLights(9, 0), x, 7.4, 2.2));
    g.add(at(tree(9 + (i % 2) * 2, '#2f7a3a'), x + 7, 0, -6));
  }
  for (let i = -4; i <= 4; i++) { const [c, r] = HOUSES[(i + 7) % 6]; g.add(at(house(c, r, true), i * 14 + 7, 0, 36, Math.PI)); }
  for (const x of [-21, -7, 7, 21]) g.add(at(lampPost(), x, 0, 10.8));
  const finnLit = lit[3], finnDark = dark[3];
  const finnLights = at(stringLights(11, 0, ['#ffcf5a', '#ff6fae', '#7fd0ff', '#9be37a', '#ffd23f']), FINNX, 7.6, 2.4); g.add(finnLights);
  return { group: g, light: 'night', finnLit, finnDark, finnLights, reset() { finnLit.visible = false; finnDark.visible = true; finnLights.visible = false; } };
}
export function court() {
  const g = grp(nightSky(), at(floor(200, 140, TEX.grass('#3f8a4a'), 6), 0, -0.03, -20));
  const c = box(30, 0.1, 18, '#3f7fd8'); c.position.set(0, 0.05, 0); g.add(c, at(box(11, 0.11, 6, '#ff8a3c'), 0, 0.06, -4.5), at(box(30, 0.12, 0.25, '#ffffff'), 0, 0.07, 0), at(box(0.25, 0.12, 18, '#ffffff'), 0, 0.07, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 20), mat('#ff6a1c')); ring.rotation.x = Math.PI / 2; ring.position.set(0, 9.2, -6.6);
  g.add(at(box(0.5, 9.5, 0.5, '#2b2f38'), 0, 4.75, -8.6), at(box(5, 3.2, 0.25, '#f4f4f4'), 0, 10.3, -7.6), ring);
  g.add(at(sign(['GUEST  HOME', '12   21'], 6, 2.6, { bg: '#15171c', fg: '#ffd23f' }), 9, 9.4, -9.2));
  for (let i = 0; i < 4; i++) g.add(at(box(22, 0.6, 1.6, '#9aa0a8'), -2, 0.3 + i * 0.7, -10.6 - i * 1.4));
  g.add(at(stringLights(34, 0), 0, 13, -9), at(lampPost(13), -16, 0, -9), at(lampPost(13), 16, 0, -9), at(tree(10, '#2f7a3a'), -22, 0, -12), at(tree(11, '#2f7a3a'), 22, 0, -13));
  return { group: g, light: 'night' };
}

