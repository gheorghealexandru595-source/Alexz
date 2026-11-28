// story.js: every lie makes your shadow longer. Leo lies all week until his shadow covers the town,
// then tells the truth in the middle of the night market to bring the lights back and find his sister.
import { start, shot as kitShot, frame, WORDS, cap, LIGHTS } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, TEX, floor, tree, table, bench, building, door } from './sets.js';
import { nightSky } from './night.js';
import { makeSparkles, makePuff, makeEmote } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, rng, canvasTex, PRE } from './util.js';
import * as THREE from 'three';

LIGHTS.dark = { amb: 0.2, hemi: 0.14, sun: 0.22, dir: [-6, 16, 8], sunColor: '#6f7fb0', bg: '#05070e', exposure: 0.85 };

const LOOK = {
  leo: { seed: 141, skin: 'light', hair: 'swoop', hairColor: '#6b3a1f', top: 'hoodie', topColor: '#f2b01e', bottom: 'jeans', bottomColor: '#3f5f9a' },
  mom: { seed: 142, skin: 'light', hair: 'long', hairColor: '#6b3a1f', top: 'cardigan', topColor: '#e8734f', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#3a3f4a', height: 1.12 },
  rose: { seed: 143, skin: 'deep', hair: 'buns', hairColor: '#17110f', top: 'dress', topColor: '#e0228c', bottom: 'skirt', bottomColor: '#e0228c', glasses: true, height: 1.1 },
  nora: { seed: 144, skin: 'fair', hair: 'bob', hairColor: '#b8b8c2', top: 'sweater', topColor: '#7b3fc4', sleeves: 'long', bottom: 'skirt', bottomColor: '#2b2f38', glasses: true, height: 1.08 },
  mail: { seed: 145, skin: 'brown', hair: 'short', hairColor: '#17110f', top: 'shirt', topColor: '#3d6fe0', bottom: 'shorts', bottomColor: '#2b3a6b', cap: '#3d6fe0', height: 1.1 },
  baker: { seed: 146, skin: 'tan', hair: 'bald', top: 'shirt', topColor: '#f4f4f4', bottom: 'slacks', bottomColor: '#2b2f38', cap: '#ffffff', height: 1.12 },
  mia: { seed: 147, skin: 'light', hair: 'ponytail', hairColor: '#6b3a1f', top: 'stripes', topColor: '#ffb3d1', stripe: '#ffffff', bottom: 'skirt', bottomColor: '#7b3fc4', height: 0.78 },
  pal: { seed: 148, skin: 'brown', hair: 'spiky', hairColor: '#17110f', top: 'jersey', topColor: '#2e9e59', number: '9', bottom: 'shorts', bottomColor: '#f4f4f4' },
  nb: { seed: 149, skin: 'dark', hair: 'curly', hairColor: '#17110f', top: 'vest', topColor: '#e8632b', bottom: 'jeans', bottomColor: '#3f5f9a', height: 1.1 },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }

// ───────── the shadow: a soft black silhouette lying flat on the ground, feet at the avatar's feet ─────────
const SHTEX = canvasTex(128, 512, (g) => {
  g.filter = 'blur(4px)'; g.fillStyle = '#000';
  g.fillRect(40, 300, 21, 205); g.fillRect(67, 300, 21, 205);       // legs (feet at the bottom edge)
  g.fillRect(34, 150, 60, 165);                                      // torso
  g.fillRect(13, 156, 19, 140); g.fillRect(96, 156, 19, 140);        // arms
  g.beginPath(); g.ellipse(64, 98, 31, 38, 0, 0, 7); g.fill();       // head
});
const SHGEO = new THREE.PlaneGeometry(2.7, 6).translate(0, 3, 0).rotateX(-Math.PI / 2).translate(0, 0, 0.15); // extends toward -z
function makeShadow(parent) {
  const m = new THREE.Mesh(SHGEO, new THREE.MeshBasicMaterial({ map: SHTEX, color: '#000', transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.renderOrder = 2; parent.add(m); prop(m);
  // at(av or [x,z], len, [dx,dz]): len = length in body heights
  m.at = (p, len, d = [1, -0.6], wid = 1) => { m.show(); const x = Array.isArray(p) ? p[0] : p.root.position.x, z = Array.isArray(p) ? p[1] : p.root.position.z, s = Array.isArray(p) ? 1 : p.root.scale.x; m.position.set(x, 0.09, z); m.rotation.y = Math.atan2(-d[0], -d[1]); m.scale.set(wid * s, 1, len * s); return m; };
  return m;
}
// a soft dark ribbon from (x0,z0) to (x1,z1): the shadow river
const STTEX = canvasTex(64, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.2, 'rgba(0,0,0,1)'); gr.addColorStop(0.8, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
function makeStrip(parent, soft = true) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: soft ? STTEX : null, color: '#000', transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.renderOrder = 2; parent.add(m); prop(m);
  m.from = (x0, z0, x1, z1, w = 3, k = 1, op = 0.85) => { m.show(); const dx = (x1 - x0) * k, dz = (z1 - z0) * k, L = Math.hypot(dx, dz) || 0.01; m.position.set(x0 + dx / 2, 0.1, z0 + dz / 2); m.rotation.y = Math.atan2(dx, dz) + Math.PI / 2; m.scale.set(L, 1, w); m.material.opacity = op; return m; };
  return m;
}
// growth curve for a lie: holds `from` until t0, then springs to `to`
const grow = (lt, t0, from, to, dur = 0.55) => lerp(from, to, E.back(remap(lt, t0, t0 + dur)));

// ───────── dimmable light rows (string lights and lamps), so the town can go dark and come back street by street ─────────
function lightRow(w, y, cols = ['#ffcf5a', '#ff6fae', '#7fd0ff', '#9be37a']) {
  const ms = cols.map(c => { const m = new THREE.MeshBasicMaterial({ toneMapped: false }); m.userData.base = new THREE.Color(c); return m; });
  const g = grp(), n = Math.floor(w / 1.4);
  for (let i = 0; i < n; i++) { const k = i / (n - 1), b = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), ms[i % ms.length]); b.position.set(-w / 2 + k * w, y - Math.sin(k * Math.PI) * 1.3, 0); g.add(b); }
  g.add(at(box(w, 0.05, 0.05, '#1b1d22'), 0, y, 0));
  g.level = k => { for (const m of ms) m.color.copy(m.userData.base).multiplyScalar(lerp(0.06, 1.7, k)); }; g.level(1);
  return g;
}
function lamp(h = 11) {
  const m = new THREE.MeshBasicMaterial({ toneMapped: false });
  const g = grp(at(box(0.32, h, 0.32, '#17181c'), 0, h / 2, 0), at(box(1, 0.3, 1, '#17181c'), 0, 0.15, 0), at(box(1.1, 1.3, 1.1, m), 0, h + 0.5, 0), at(box(1.4, 0.25, 1.4, '#17181c'), 0, h + 1.25, 0));
  const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffe7a8', transparent: true, opacity: 0.22, depthWrite: false })); pool.position.y = 0.06; pool.renderOrder = 1; g.add(pool);
  g.level = k => { m.color.set('#fff3c4').multiplyScalar(lerp(0.08, 1.5, k)); pool.material.opacity = 0.22 * k; }; g.level(1);
  return g;
}

// ───────── the street (night): warm windows, string lights, the bakery ─────────
function street() {
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd98a').multiplyScalar(1.4), toneMapped: false });
  const g = grp(nightSky(), at(floor(300, 160, TEX.grass('#3f8a4a'), 6), 0, -0.03, -20), at(floor(300, 8, TEX.concrete('#b8b4ad'), 5), 0, 0.02, 7), at(floor(300, 14, TEX.road(), 6), 0, 0.01, 18));
  for (let i = -14; i <= 14; i++) g.add(at(box(4, 0.04, 0.6, '#ffe45c'), i * 9, 0.04, 18));
  const COLS = [['#f2c7d0', '#b84a5a'], ['#bfe3ff', '#2f5f9a'], ['#fff0b8', '#c9822a'], ['#d6f2c4', '#3f8a4a'], ['#e4d0ff', '#6a4ab0'], ['#ffd9c2', '#b8603a']];
  const house = (c, r) => { const h = grp(at(box(10, 7, 8, c, 0.1), 0, 3.5, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 3.6, 4, 1), mat(r)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.08, 1, 0.86); roof.position.y = 8.8; h.add(roof); h.add(at(box(2.4, 4.6, 0.3, '#5a3524'), 0, 2.3, 4.05)); for (const x of [-3.2, 3.2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 0.2), winMat); w.position.set(x, 4.0, 4.05); h.add(w, at(box(2.5, 0.2, 0.3, '#f4f4f4'), x, 2.95, 4.1)); } return h; };
  const rows = [];
  for (let i = -6; i <= 6; i++) {
    if (i === -2) continue; const [c, r] = COLS[(i + 12) % 6];
    g.add(at(house(c, r), i * 14, 0, -2)); if (i % 2 === 0) g.add(at(tree(9 + (i % 4 ? 2 : 0), '#2f7a3a'), i * 14 + 7, 0, -6));
    const row = at(lightRow(9, 0), i * 14, 7.4, 2.2); g.add(row); rows.push(row);
  }
  for (let i = -7; i <= 7; i++) { const [c, r] = COLS[(i + 13) % 6]; g.add(at(house(c, r), i * 14 + 7, 0, 36, Math.PI)); }
  // bakery at x = -28: door at (-28, z = 2.1)
  const bakery = building(14, 12, 8, '#f8c5c7', { sign: 'BAKERY', signFg: '#e84b6a', awning: '#e84b6a', windows: [2, 1], doorColor: '#e84b6a' });
  g.add(at(bakery, -28, 0, -2), at(box(3, 4.4, 0.2, glow('#ffe7b0', 1.3)), -33.5, 3.4, 2.1), at(box(3, 4.4, 0.2, glow('#ffe7b0', 1.3)), -22.5, 3.4, 2.1));
  return { group: g, light: 'night', rows, level(k) { rows.forEach(r => r.level(k)); }, reset() { rows.forEach(r => r.level(1)); } };
}

// ───────── the night market square ─────────
function square() {
  const g = grp(nightSky(), at(floor(260, 200, TEX.concrete('#a9a39a'), 6), 0, -0.03, -20));
  for (const [x, z, c, s] of [[-36, -26, '#f2c7d0', 'BOOKS'], [-12, -30, '#bfe3ff', 'CAFE'], [12, -30, '#fff0b8', 'TOYS'], [36, -26, '#d6f2c4', 'FLOWERS']]) g.add(at(building(20, 14, 8, c, { sign: s, signFg: '#7b3fc4', windows: [3, 2] }), x, 0, z));
  // fountain behind the middle
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.4, 1.4, 32), mat('#cfcbc4')); basin.position.set(0, 0.7, -12);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.2, 32), glow('#6fb8ff', 0.9)); water.position.set(0, 1.35, -12);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 4, 16), mat('#cfcbc4')); spout.position.set(0, 2.6, -12); g.add(basin, water, spout);
  // market stalls: striped roofs on four posts
  const stall = (c, label, food) => { const s = grp(at(box(7, 3, 3, '#b9783f'), 0, 1.5, 0), at(box(7.4, 0.3, 3.4, '#f4f4f4'), 0, 3.15, 0)); for (const x of [-3.4, 3.4]) s.add(at(box(0.3, 7, 0.3, '#5a3524'), x, 3.5, -1.4), at(box(0.3, 7, 0.3, '#5a3524'), x, 3.5, 1.4)); for (let i = 0; i < 7; i++) s.add(at(box(1.1, 0.4, 4.2, i % 2 ? '#f4f4f4' : c), -3.3 + i * 1.1, 7.2, 0)); s.add(at(sign(label, 5, 1.1, { bg: c, fg: '#fff' }), 0, 6, 1.6)); for (let i = 0; i < 4; i++) s.add(at(box(0.9, 0.7, 0.9, food[i % food.length], 0.15), -2.4 + i * 1.6, 3.65, 0.3)); return s; };
  g.add(at(stall('#e84b6a', 'SWEETS', ['#ff9ad1', '#ffe07a']), -17, 0, -6, 0.35), at(stall('#2f7de1', 'CORN', ['#ffd23f']), 17, 0, -7, -0.35), at(stall('#2e9e59', 'TACOS', ['#f2b01e', '#e84b6a']), -24, 0, 6, 0.9), at(stall('#7b3fc4', 'LEMONADE', ['#ffe45c', '#f4f4f4']), 26, 0, 8, -0.9));
  // light rows (z) and lamps; Mia's bench under the lamp at x = 13
  const rows = [-14, -6, 2, 10].map((z, i) => { const r = at(lightRow(56, 0, i % 2 ? ['#ffcf5a', '#7fd0ff', '#ff6fae'] : ['#9be37a', '#ffcf5a', '#ff6fae', '#7fd0ff']), 0, 12, z); g.add(r); return r; });
  const lamps = [[-9, 3], [13, -1.5], [-30, -8], [32, -6]].map(([x, z]) => { const l = at(lamp(11), x, 0, z); g.add(l); return l; });
  g.add(at(bench('#b9783f'), 10.5, 0, -1.2));
  // the big shadow that covers the whole square
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(400, 300).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false })); cover.position.set(0, 0.08, -40); cover.renderOrder = 1; g.add(cover);
  const S = { group: g, light: 'night', rows, lamps, cover,
    level(k) { rows.forEach(r => r.level(k)); lamps.forEach(l => l.level(k)); },
    reset() { S.level(1); cover.material.opacity = 0; cover.visible = true; } };
  return S;
}

start(() => {
  const ST = street(), SQ = square();
  const home = SETS.livingRoom(), cls = SETS.classroom({ board: ['HOMEWORK', 'due today'] }), aunt = SETS.livingRoom({ wall: '#d8ecff', sofa: '#7b3fc4' }), bed = SETS.bedroom({ poster: 'MY\nROOM' }), park = SETS.park();
  cls.group.add(at(door('ROOM 7', '#2f8fe6'), 13, 0, -5.9));
  aunt.group.add(at(table(6, 3.2, '#f4efe6', 2.7), 3, 0, 1.5));
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.55, 0.6, 20), mat('#f4f4f4')); bowl.position.set(3, 3.1, 1.6);
  const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 20), mat('#8a9a3a')); soup.position.set(3, 3.38, 1.6); aunt.group.add(bowl, soup);
  { const r = rng(4), cs = ['#e84b6a', '#2f7de1', '#f2b01e', '#2e9e59', '#f4f4f4']; for (let i = 0; i < 14; i++) bed.group.add(at(box(1.4 + r() * 1.2, 0.3 + r() * 0.5, 1 + r() * 0.8, cs[i % 5], 0.1), -2 + r() * 12, 0.25, 0 + r() * 8, r() * 3)); }
  const goal = grp(at(box(0.3, 5, 0.3, '#f4f4f4'), -5, 2.5, -6), at(box(0.3, 5, 0.3, '#f4f4f4'), 5, 2.5, -6), at(box(10.3, 0.3, 0.3, '#f4f4f4'), 0, 5, -6)); park.group.add(goal);
  const ball = prop(grp((() => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat('#f4f4f4')); b.castShadow = true; return b; })(), at(box(0.4, 0.4, 0.4, '#17181c'), 0, 0, 0.4))); park.group.add(ball);

  const SC = cast(ST, ['leo', 'mail', 'baker', 'nb', 'mom', 'nora']);
  const QC = cast(SQ, ['leo', 'mom', 'mia', 'rose', 'nora', 'nb', 'baker']);
  const HC = cast(home, ['leo', 'mom']), CC = cast(cls, ['leo', 'rose']), AC = cast(aunt, ['leo', 'nora']), BC = cast(bed, ['leo', 'mom']), PC = cast(park, ['leo', 'pal']);
  const shadows = {}; for (const [k, s] of [['st', ST], ['sq', SQ], ['home', home], ['cls', cls], ['aunt', aunt], ['bed', bed], ['park', park]]) shadows[k] = makeShadow(s.group);
  const miaShadow = makeShadow(SQ.group);
  const strips = [makeStrip(ST.group), makeStrip(ST.group), makeStrip(ST.group), makeStrip(SQ.group), makeStrip(SQ.group)], longS = makeStrip(ST.group, false);
  // the long street shadow: silhouette plus a solid body ribbon along the sidewalk so it reads from far away
  const longShadow = (p, len, wid = 1.15) => { shadows.st.at(p, len, towardSidewalkLeft, wid); const x = Array.isArray(p) ? p[0] : p.root.position.x; longS.from(x - 2, 6.2, x - len * 6 * 0.92, 6.2, 3.6 * wid, 1, 0.92); };
  const sp = s => [makeSparkles(s.group, 3)];
  const SPQ = sp(SQ), SPH = sp(home);
  const puffS = makePuff(ST.group), puffQ = makePuff(SQ.group);
  const qm = [makeEmote(ST.group, '?', '#ffd23f'), makeEmote(ST.group, '?', '#ffd23f'), makeEmote(ST.group, '?', '#ffd23f')];
  const bang = makeEmote(ST.group, '!', '#ff3b30'), bangQ = makeEmote(SQ.group, '!', '#ff3b30');
  // the cat (street)
  const cat = prop(grp(at(box(1.8, 0.9, 0.8, '#ff9a3c', 0.2), 0, 0.9, 0), at(box(0.9, 0.8, 0.8, '#ff9a3c', 0.2), 1.1, 1.5, 0), at(box(0.25, 0.35, 0.2, '#ff9a3c'), 1.0, 2.0, -0.25), at(box(0.25, 0.35, 0.2, '#ff9a3c'), 1.0, 2.0, 0.25), ...[[-0.6, -0.25], [-0.6, 0.25], [0.6, -0.25], [0.6, 0.25]].map(([x, z]) => at(box(0.25, 0.6, 0.25, '#ff9a3c'), x, 0.3, z)), at(box(1.2, 0.2, 0.2, '#ff9a3c'), -1.3, 1.6, 0, 0)));
  const catEyes = grp(at(box(0.12, 0.2, 0.05, '#17120f'), 1.56, 1.6, -0.18), at(box(0.12, 0.2, 0.05, '#17120f'), 1.56, 1.6, 0.18)); cat.add(catEyes); ST.group.add(cat);
  // letters flying out of the mail bag
  const letters = [0, 1, 2, 3, 4].map(i => { const l = prop(box(0.9, 0.05, 0.6, '#f4f4f4')); ST.group.add(l); return l; });
  const bag = box(0.9, 1.1, 0.4, '#8a5a34', 0.1); bag.position.set(-1.1, 0.9, 0.3); SC.mail.hip.add(bag);
  // cotton candy for Mia
  const candy = prop(grp(at(box(0.08, 1.4, 0.08, '#f4efe6'), 0, 0.5, 0), (() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10), mat('#ff9ad1')); s.position.y = 1.5; return s; })())); QC.mia.handR.add(candy); candy.position.set(0, -0.2, 0.3);
  // dry toothbrush
  const brush = prop(grp(at(box(0.12, 1.2, 0.12, '#2f9ee8'), 0, 0, 0), at(box(0.2, 0.3, 0.16, '#f4f4f4'), 0, 0.7, 0.08))); HC.leo.handR.add(brush); brush.position.set(0, -0.3, 0.3); brush.rotation.x = -1.2;

  const LEO = [0, 6];
  const towardSidewalkLeft = [-1, 0.0];

  // ═══════════════ HOOK ═══════════════
  shot({ line: 'In this town, every lie you tell', set: ST, sfx: [['whoosh', 'town', 0.5]], cam: { pos: [26, 22, 34], look: [0, 3, 4], fov: 50, blur: 0.04, to: { pos: [14, 9, 22] }, ease: 'out' },
    act(lt, c) { SC.leo.reset().place(-8 + lt * 3.2, 6, Math.PI / 2).walk(c.t).setFace('smile'); shadows.st.at(SC.leo, 1.0, [-0.3, -1]); } });
  shot({ line: 'makes your shadow a little longer.', set: ST, sfx: [['rise', 'longer', 0.7]], cam: { pos: [8, 9, 20], look: [-3, 1.2, 3], fov: 52, blur: 0.12, push: 0.02 },
    act(lt, c) { SC.leo.reset().place(LEO[0], LEO[1], 0.3).idle(c.t).setFace(lt < c.w('longer') ? 'smile' : 'shock'); shadows.st.at(SC.leo, grow(lt, c.w('longer'), 1.0, 2.2), [-0.6, -1]); } });
  shot({ line: "My name's Leo, and I thought I was a pretty honest kid.", set: ST, cam: frame(0, 6, { size: 'medium', side: 10 }),
    act(lt, c) { SC.leo.reset().place(0, 6, 0).pose(lt < c.w('honest') ? 'wave' : 'hips').idle(c.t).talk(c.t, 0.5).setFace(lt < c.w('honest') ? 'grin' : 'smug'); } });

  // ═══════════════ MONDAY ═══════════════
  shot({ line: "Then on Monday, my mom asked if I'd brushed my teeth.", set: home, light: 'night', sfx: [['pop', 'teeth', 0.5]], cam: frame(-3, 1, { size: 'wide', side: -6, dist: 0.85 }),
    act(lt, c) { HC.mom.reset().place(-6, 0.5, 0.5).pose('hips').idle(c.t).talk(c.t).setFace('sus'); HC.leo.reset().place(0, 1.5, -0.4).idle(c.t).setFace('smile'); brush.show(); } });
  shot({ line: 'I said, yes.', set: home, light: 'night', cam: frame(0, 1.5, { size: 'face', side: 8, push: 0.05 }),
    act(lt, c) { HC.leo.reset().place(0, 1.5, 0).pose({ aR: [60, 10] }).idle(c.t).setFace(lt < c.w('yes') ? 'neutral' : 'grin'); brush.show(); } });
  shot({ line: 'My shadow grew one step.', set: home, light: 'night', sfx: [['rise', 'grew', 0.8]], cam: { pos: [6, 9, 16], look: [2, 0.5, -1], fov: 52, blur: 0.08, push: 0.02 },
    act(lt, c) { HC.leo.reset().place(0, 1.5, 0).idle(c.t).pose({ head: [22, 0, 0] }).setFace(lt < c.w('grew') ? 'neutral' : 'shock'); shadows.home.at(HC.leo, grow(lt, c.w('grew'), 1.0, 1.7), [1, -0.7]); } });
  shot({ line: 'Nobody noticed.', set: home, light: 'night', cam: frame(-2, 0.5, { size: 'wide', side: 12, dist: 0.9 }),
    act(lt, c) { HC.mom.reset().place(-8 + lt * 2.5, -0.5, Math.PI / 2).walk(c.t).setFace('neutral'); HC.leo.reset().place(0, 1.5, 0).idle(c.t).setFace('worried'); shadows.home.at(HC.leo, 1.7, [1, -0.7]); } });

  // ═══════════════ TUESDAY ═══════════════
  shot({ line: 'On Tuesday, I told my teacher the dog ate my homework.', set: cls, cam: frame(-8, 0, { size: 'wide', side: 10, dist: 0.85 }),
    act(lt, c) { CC.rose.reset().place(-11, -1, 0.6).pose('hips').idle(c.t).setFace(lt < c.w('dog') ? 'serious' : 'sus'); CC.leo.reset().place(-5, 1, -0.4).pose(lt > c.w('dog') ? 'shrug' : 'open').idle(c.t).talk(c.t).setFace('worried'); shadows.cls.at(CC.leo, 1.7, [1, -0.55]); } });
  shot({ line: "We don't have a dog.", set: cls, cam: frame(-5, 1, { size: 'face', side: -12, push: 0.05 }),
    act(lt, c) { CC.leo.reset().place(-5, 1, 0.2).idle(c.t).setFace(lt < c.w('dog') ? 'smug' : 'wink'); } });
  shot({ line: 'My shadow reached the door.', set: cls, sfx: [['rise', 'reached', 0.8]], cam: { pos: [3, 10, 27], look: [3, 0.5, -2], fov: 62, blur: 0.06, push: 0.02 },
    act(lt, c) { cls.desks.visible = false; CC.leo.reset().place(-5, 1, 0.3).idle(c.t).setFace('shock'); CC.rose.reset().place(-11, -1, 0.6).idle(c.t).setFace('sus'); const d = [13 - -5, -5.6 - 1]; shadows.cls.at(CC.leo, grow(lt, c.w('reached'), 1.7, 3.6), d); } });

  // ═══════════════ WEDNESDAY: LYING ABOUT EVERYTHING ═══════════════
  shot({ line: 'By Wednesday, I was lying about everything.', set: ST, sfx: [['whoosh', 'wednesday', 0.5]], cam: frame(0, 6, { size: 'full', side: -14 }),
    act(lt, c) { SC.leo.reset().place(0, 6, 0).pose('flex').idle(c.t).setFace('smug'); shadows.st.at(SC.leo, 3.4, [-0.8, -1]); } });
  shot({ line: "I said I liked my aunt's soup.", set: aunt, light: 'night', sfx: [['rise', 'soup', 0.7]], cam: frame(3, 1.6, { size: 'wide', side: 0, dist: 0.95 }),
    act(lt, c) { AC.nora.reset().place(7.2, 1.6, -0.5).pose('carry').idle(c.t).setFace('grin'); AC.leo.reset().place(-1.4, 1.8, 0.4).pose('carry').idle(c.t).setFace(lt < c.w('liked') ? 'worried' : 'grin'); shadows.aunt.at(AC.leo, grow(lt, c.w('soup'), 3.4, 4.2), [-0.8, -0.7]); } });
  shot({ line: "I said I'd already cleaned my room.", set: bed, light: 'night', sfx: [['rise', 'room', 0.7]], cam: { pos: [2, 9, 22], look: [3, 1.5, 3], fov: 55, blur: 0.08 },
    act(lt, c) { BC.mom.reset().place(9, 3, -0.6).pose('hips').idle(c.t).setFace('sus'); BC.leo.reset().place(3, 4.5, 0.3).pose('open').idle(c.t).talk(c.t).setFace('grin'); shadows.bed.at(BC.leo, grow(lt, c.w('room'), 4.2, 5.0), [-0.6, -1]); } });
  shot({ line: 'I said I scored a goal.', set: park, light: 'outdoor', sfx: [['rise', 'goal', 0.7]], cam: frame(-1, 2, { size: 'full', side: 14, dist: 1.05 }),
    act(lt, c) { PC.pal.reset().place(-5, 1, 0.5).pose('shrug').idle(c.t).setFace('sus'); PC.leo.reset().place(1, 2.5, -0.3).pose('cheer').idle(c.t).setFace('laugh'); ball.show().position.set(3, 0.55, 3.4); shadows.park.at(PC.leo, grow(lt, c.w('goal'), 5.0, 6.2), [0.9, -1]); } });

  // ═══════════════ THURSDAY: DOWN THE WHOLE STREET ═══════════════
  shot({ line: 'By Thursday, my shadow was so long it went down the whole street.', set: ST, sfx: [['whoosh', 'down', 0.8]], cam: { pos: [40, 12, 22], look: [15, 2, 6], fov: 56, blur: 0.04, push: 0.015 },
    act(lt, c) { SC.leo.reset().place(24, 6, 0).idle(c.t).setFace('shock'); const k = E.out(remap(lt, c.w('down'), c.w('street') + 0.4)); longShadow(SC.leo, lerp(6.2, 24, k)); } });
  shot({ line: 'It tripped the mailman.', set: ST, sfx: [['thud', 'mailman', 0.9], ['whoosh', 'tripped', 0.4]], cam: frame(-6, 6, { size: 'full', side: 22, dist: 1.05 }),
    act(lt, c) {
      const t0 = c.w('tripped') + 0.15, f = remap(lt, t0, t0 + 0.4);
      SC.mail.reset().place(-10 + Math.min(lt, t0) * 3.6 + f * 1.2, 6, Math.PI / 2);
      if (lt < t0) SC.mail.walk(c.t).setFace('smile'); else { SC.mail.pose({ aL: [150, 20], aR: [150, 20], lL: -30, lR: 20 }).setFace('scream'); SC.mail.root.rotation.z = -E.in(f) * 1.45; SC.mail.root.position.y = 0.3 * f; }
      longShadow([24, 6], 24);
      letters.forEach((l, i) => { if (lt < t0) return; const d = lt - t0, a = i * 1.3; l.show().position.set(-6 + Math.cos(a) * d * 3, Math.max(0.1, 4 + d * 6 - d * d * 12), 6 + Math.sin(a) * d * 2.5); l.rotation.set(d * 5 + i, d * 3, d * 4); });
      puffS.at(lt - t0 - 0.4, [-4.5, 0, 6]);
    } });
  shot({ line: "It scared the neighbor's cat.", set: ST, sfx: [['boing', 'scared', 0.8]], cam: { pos: [-10.5, 2.6, 13], look: [-14.5, 1.6, 5.6], fov: 55, blur: 0.25, push: 0.03 },
    act(lt, c) {
      const t0 = c.w('scared'), j = remap(lt, t0, t0 + 0.6);
      cat.show().position.set(-15 + (lt < t0 ? 0 : 0.8 * j), lt < t0 ? 0 : Math.sin(j * Math.PI) * 3.5, 5.6); cat.rotation.y = 0.5; cat.scale.setScalar(lt < t0 ? 1 : 1.25);
      longShadow([24, 6], 24); bang.at(lt - t0, { root: { scale: { x: 0.45 }, position: new THREE.Vector3(-15, 0, 5.6) } });
    } });
  shot({ line: 'And at night, it lay across the whole town like a black river.', set: ST, sfx: [['whoosh', 'river', 0.6]], cam: { pos: [6, 80, 80], look: [-6, 0, 6], fov: 52, blur: 0.02, to: { pos: [-6, 68, 66] }, ease: 'inOut' },
    act(lt, c) {
      SC.leo.reset().place(24, 6, 0).idle(c.t).setFace('sad');
      longShadow(SC.leo, 24);
      const k = E.out(remap(lt, c.w('night'), c.w('river') + 0.3));
      strips[0].from(-7, 6, -7, -60, 8, k); strips[1].from(0, 6, 0, 70, 8, k); strips[2].from(-40, 6, -40, -60, 8, k);
    } });

  // ═══════════════ QUESTIONS ═══════════════
  shot({ line: 'People started asking questions.', set: ST, sfx: [['pop', 'asking', 0.4], ['pop', 'questions', 0.4]], cam: frame(2, 7, { size: 'wide', side: 6, dist: 0.85 }),
    act(lt, c) { const P = [[SC.nb, -4, 8, 0.4], [SC.nora, 1, 9.5, 0.1], [SC.baker, 6, 8.2, -0.4]]; P.forEach(([a, x, z, r], i) => { a.reset().place(x, z, r).pose(i === 1 ? 'think' : 'shrug').idle(c.t).setFace('sus'); qm[i].at(lt - c.w('asking') - i * 0.15, a, 9); }); longShadow([24, 6], 24); } });
  shot({ line: 'Leo, why is your shadow in the bakery?', set: ST, cam: { pos: [-18, 5.5, 20], look: [-27, 3, 3], fov: 52, blur: 0.12, push: 0.02 },
    act(lt, c) { SC.baker.reset().place(-24, 4.2, -0.5).pose('point').idle(c.t).talk(c.t).setFace('mad'); longShadow([24, 6], 24); strips[0].from(-28, 7.5, -28, 1.5, 4.5, E.out(remap(lt, 0, 0.6))); } });
  shot({ line: "I said, that's not my shadow.", set: ST, cam: frame(24, 6, { size: 'face', side: -8, push: 0.05 }),
    act(lt, c) { SC.leo.reset().place(24, 6, 0).idle(c.t).talk(c.t, 0.6).setFace(lt < c.w('not') ? 'smug' : 'smirk'); } });
  shot({ line: 'It grew another block.', set: ST, sfx: [['rise', 'grew', 0.8]], cam: { pos: [40, 12, 22], look: [15, 2, 6], fov: 56, blur: 0.04, push: 0.02 },
    act(lt, c) { SC.leo.reset().place(24, 6, 0).idle(c.t).setFace('shock'); longShadow(SC.leo, grow(lt, c.w('grew'), 24, 34, 0.8), 1.35); } });

  // ═══════════════ THE NIGHT MARKET ═══════════════
  shot({ line: 'Then came the worst part.', set: ST, sfx: [['sad', 'worst', 0.6]], cam: frame(24, 6, { size: 'close', side: 10, push: 0.06 }),
    act(lt, c) { SC.leo.reset().place(24, 6, 0).idle(c.t).setFace(lt < c.w('worst') ? 'worried' : 'sad'); } });
  shot({ line: 'My little sister Mia got lost at the night market.', set: SQ, sfx: [['whoosh', 'night', 0.5]], cam: { pos: [-8, 9, 34], look: [6, 3, -4], fov: 52, blur: 0.05, to: { pos: [-2, 6, 26] }, ease: 'out' },
    act(lt, c) { QC.mia.reset().place(-2 + lt * 2.2, 2 - lt * 1.6, 2.4).walk(c.t).setFace('smile'); candy.show(); QC.mom.reset().place(-14, 4, 1.2).idle(c.t).setFace('smile'); QC.nb.reset().place(-22, 9, 1.4).idle(c.t).setFace('smile'); QC.baker.reset().place(22, 10, -1.2).idle(c.t).setFace('grin'); } });
  shot({ line: 'Everyone was looking for her.', set: SQ, cam: frame(-2, 4, { size: 'wide', side: -10, dist: 1.0 }),
    act(lt, c) { const P = [[QC.mom, -6, 3, 'reach'], [QC.rose, 0, 6, 'think'], [QC.nora, 5, 3, 'reach'], [QC.nb, -12, 6, 'think']]; P.forEach(([a, x, z, p], i) => a.reset().place(x, z, Math.sin(c.t * 1.4 + i * 2) * 0.9).pose(p).idle(c.t).setFace('worried')); } });
  shot({ line: "And I couldn't find her, because my own shadow covered every street.", set: SQ, light: 'dark', sfx: [['whoosh', 'covered', 0.9]], cam: { pos: [0, 70, 60], look: [0, 0, -8], fov: 52, blur: 0.02, push: 0.015 },
    act(lt, c) { const k = E.inOut(remap(lt, c.w('covered') - 0.2, c.w('street') + 0.6)); SQ.cover.material.opacity = 0.9 * k; SQ.level(1 - k); QC.leo.reset().place(0, 4, 0).idle(c.t).pose('reach').setFace('worried'); shadows.sq.at(QC.leo, 12, [0, -1], 2.5); } });
  shot({ line: 'Everything was dark.', set: SQ, light: 'dark', sfx: [['sad', 'dark', 0.6]], cam: frame(0, 4, { size: 'medium', side: 6, push: 0.05 }),
    act(lt, c) { SQ.cover.material.opacity = 0.9; SQ.level(0); QC.leo.reset().place(0, 4, 0).idle(c.t).setFace('cry'); } });

  // ═══════════════ THE TRUTH ═══════════════
  shot({ line: 'So I stood in the middle of the square, and I told the truth.', set: SQ, light: 'dark', sfx: [['ding', 'truth', 0.6]], cam: frame(0, 4, { size: 'full', side: -8, low: 0.4, dist: 1.1, push: 0.05 }),
    act(lt, c) { SQ.cover.material.opacity = 0.9; SQ.level(0); QC.leo.reset().place(0, 4, 0).pose(lt < c.w('told') ? 'slump' : 'open').idle(c.t).setFace(lt < c.w('told') ? 'sad' : 'serious'); } });
  shot({ line: 'Mom, I never brushed my teeth.', set: SQ, light: 'dark', sfx: [['sparkle', 'teeth', 0.5]], cam: frame(-5.2, 4, { size: 'wide', side: -8, dist: 0.72 }),
    act(lt, c) { SQ.cover.material.opacity = lerp(0.9, 0.75, E.out(remap(lt, c.w('teeth'), c.w('teeth') + 0.6))); SQ.level(0.15 * E.out(remap(lt, c.w('teeth'), c.w('teeth') + 0.6))); QC.mom.reset().place(-7.5, 3, 0.7).idle(c.t).setFace(lt < c.w('teeth') ? 'worried' : 'shock'); QC.leo.reset().place(-3, 5, -0.6).pose('open').idle(c.t).talk(c.t).setFace('serious'); } });
  shot({ line: "Miss Rose, I don't have a dog.", set: SQ, light: 'dark', sfx: [['sparkle', 'dog', 0.5]], cam: frame(4.2, 4, { size: 'wide', side: 8, dist: 0.72 }),
    act(lt, c) { const k = E.out(remap(lt, c.w('dog'), c.w('dog') + 0.6)); SQ.cover.material.opacity = lerp(0.75, 0.6, k); SQ.level(lerp(0.15, 0.3, k)); QC.rose.reset().place(6.5, 3, -0.7).pose('hips').idle(c.t).setFace(lt < c.w('dog') ? 'sus' : 'smile'); QC.leo.reset().place(2, 5, 0.6).pose('shrug').idle(c.t).talk(c.t).setFace('worried'); } });
  shot({ line: 'Aunt Nora, your soup is terrible.', set: SQ, light: 'dark', sfx: [['sparkle', 'terrible', 0.5]], cam: frame(-1.2, 4, { size: 'wide', side: -4, dist: 0.72 }),
    act(lt, c) { const k = E.out(remap(lt, c.w('terrible'), c.w('terrible') + 0.6)); SQ.cover.material.opacity = lerp(0.6, 0.45, k); SQ.level(lerp(0.3, 0.45, k)); QC.nora.reset().place(-3.4, 3, 0.4).idle(c.t).setFace(lt < c.w('terrible') ? 'smile' : (lt < c.w('terrible') + 0.5 ? 'shock' : 'laugh')); QC.leo.reset().place(1.5, 5, -0.4).pose('shy').idle(c.t).talk(c.t).setFace('worried'); } });
  shot({ line: 'With every truth, my shadow shrank back.', set: SQ, sfx: [['fall', 'shrank', 0.8], ['sparkle', 'back', 0.6]], cam: { pos: [6, 14, 22], look: [0, 1, -2], fov: 54, blur: 0.06, push: 0.02 },
    act(lt, c) { const k = E.inOut(remap(lt, c.w('shrank') - 0.2, c.w('back') + 0.4)); SQ.cover.material.opacity = lerp(0.45, 0, k); SQ.level(lerp(0.45, 0.6, k)); QC.leo.reset().place(0, 4, 0).pose(k > 0.6 ? 'cheer' : 'open').idle(c.t).setFace(k > 0.6 ? 'grin' : 'wow'); shadows.sq.at(QC.leo, lerp(12, 1.1, k), [0.6, -1], lerp(2.5, 1, k)); SPQ[0].at(lt - c.w('back'), [0, 0, 4], 1); } });
  shot({ line: 'Street by street, the lights came back.', set: SQ, sfx: [['ding', 'street', 0.4], ['ding', ['street', 1], 0.4], ['sparkle', 'lights', 0.6]], cam: { pos: [-20, 18, 40], look: [4, 6, -6], fov: 54, blur: 0.03, to: { pos: [-8, 12, 34] }, ease: 'out' },
    act(lt, c) { const ts = [c.w('street'), c.w('street', 1), c.w('lights'), c.w('came')]; SQ.rows.forEach((r, i) => r.level(lt > ts[i] ? lerp(0.6, 1, E.out(remap(lt, ts[i], ts[i] + 0.3))) : 0.6)); SQ.lamps.forEach((l, i) => l.level(lt > ts[i] ? 1 : 0.6)); QC.leo.reset().place(0, 4, 0.3).pose('cheer').idle(c.t).setFace('grin'); shadows.sq.at(QC.leo, 1.1, [0.6, -1]); } });

  // ═══════════════ MIA ═══════════════
  shot({ line: 'And there, under a lamp, sat Mia, eating cotton candy.', set: SQ, sfx: [['pop', 'mia', 0.5]], cam: frame(10.5, -0.4, { size: 'full', side: -18, h: 0.8, dist: 1.4, to: { pos: [9, 3.6, 7] } }),
    act(lt, c) { QC.mia.reset().place(10.5, -0.4, 0).sit(1.4).pose({ aR: [70, -10] }).idle(c.t).setFace('happy'); candy.show(); miaShadow.at(QC.mia, 0.9, [-0.5, 1]); } });
  shot({ line: "She said, I wasn't lost.", set: SQ, cam: frame(10.5, -0.4, { size: 'close', h: 0.8, side: 10, push: 0.05 }),
    act(lt, c) { QC.mia.reset().place(10.5, -0.4, 0).sit(1.4).pose({ aR: [70, -10] }).idle(c.t).talk(c.t).setFace('smug'); candy.show(); } });
  shot({ line: "I lied so you'd come find me.", set: SQ, cam: frame(8, 1.2, { size: 'wide', side: 18, dist: 0.62 }),
    act(lt, c) { QC.mia.reset().place(10.5, -0.4, 0).sit(1.4).pose({ aR: [70, -10] }).idle(c.t).talk(c.t).setFace(lt < c.w('find') ? 'smug' : 'wink'); candy.show(); QC.leo.reset().place(5, 3.5, 1.1).idle(c.t).setFace(lt < c.w('lied') + 0.3 ? 'smile' : 'shock'); miaShadow.at(QC.mia, 0.9, [-0.5, 1]); } });
  { const d = shot({ line: 'And right behind her, her shadow was just starting to grow.', set: SQ, sfx: [['rise', 'grow', 0.8], ['pop', 'starting', 0.5]], cam: { pos: [5, 8, 17.5], look: [9, 1, 2], fov: 52, blur: 0.08, push: 0.03 },
    act(lt, c) { QC.mia.reset().place(10.5, -0.4, 0).sit(1.4).pose({ aR: [70, -10] }).idle(c.t).setFace(lt < c.w('grow') ? 'smile' : 'smirk'); candy.show(); miaShadow.at(QC.mia, grow(lt, c.w('starting'), 0.9, 2.8, 0.9), [-0.45, 1]); QC.leo.reset().place(6, 3.2, 1.0).idle(c.t).setFace(lt < c.w('shadow') ? 'smile' : 'scream'); bangQ.at(lt - c.w('grow') - 0.2, QC.leo); } }); }
});
