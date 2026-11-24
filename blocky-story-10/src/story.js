// story.js: "In this town, every friend you make lights a lantern above your head."  Night-town party style.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, TEX, floor, tree, bush, lampPost, bench, windowPane } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, canvasTex, rng, shade, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 101, skin: 'light', hair: 'short', hairColor: '#2b1b14', top: 'hoodie', topColor: '#f08a1c', bottom: 'jeans', bottomColor: '#4f79a7' },
  finn: { seed: 102, skin: 'tan', hair: 'curly', hairColor: '#5a3524', top: 'sweater', topColor: '#6a6e76', sleeves: 'long', bottom: 'jeans', bottomColor: '#274b8f', glasses: true },
  coco: { seed: 103, skin: 'brown', hair: 'long', hairColor: '#17110f', top: 'dress', topColor: '#ff6fae', bottom: 'skirt', bottomColor: '#ffd23f' },
  jake: { seed: 104, skin: 'fair', hair: 'spiky', hairColor: '#e8632b', top: 'jersey', topColor: '#e8413c', number: '5', bottom: 'shorts', bottomColor: '#15151a' },
  newkid: { seed: 105, skin: 'deep', hair: 'buzz', hairColor: '#1b1210', top: 'shirt', topColor: '#bfe3ff', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b3a6b', glasses: true, backpack: '#2e9e59' },
  skater: { seed: 106, skin: 'light', hair: 'messy', hairColor: '#e8b04a', top: 'stripes', topColor: '#15151a', stripe: '#ffd23f', bottom: 'cargo', bottomColor: '#5a5f6a', cap: '#2e9e59' },
  lady: { seed: 107, skin: 'tan', hair: 'buns', hairColor: '#2b1b14', top: 'shirt', topColor: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b3a6b', height: 1.1 },
};
const LAN = { nar: 3, finn: 0, coco: 28, jake: 6, newkid: 2, skater: 5, lady: 4 };   // resting lantern counts (28 drawn = "ninety-nine")
const ALL = [];
const LCOL = ['#ffcf5a', '#ff9a3c', '#ffe58a', '#ff7a6b', '#ffd23f'];
// lantern cloud above the head. n = how many are lit; pop = index that is popping (with its age dt)
function lanterns(av, max = 28) {
  const g = new THREE.Group(), items = [], r = rng(av.o.seed * 13 + 1);
  for (let i = 0; i < max; i++) {
    const c = LCOL[i % LCOL.length];
    const l = grp(box(0.55, 0.72, 0.55, glow(c, 1.35), 0.12), at(box(0.62, 0.12, 0.62, '#8a2a1c'), 0, 0.42, 0), at(box(0.62, 0.12, 0.62, '#8a2a1c'), 0, -0.42, 0));
    const a = i * 2.39996, rad = i === 0 ? 0 : 0.9 + Math.sqrt(i) * 0.75, h = 6.9 + (i % 4) * 0.35 + Math.sqrt(i) * 0.25;
    l.userData = { x: Math.sin(a) * rad, z: Math.cos(a) * rad * 0.6 - 0.4, y: h, ph: r() * 6.28 };
    g.add(l); items.push(l);
  }
  av.root.add(g);
  av.lan = (n, t = 0, pop = -1, dt = 0) => {
    items.forEach((l, i) => {
      const u = l.userData, on = i < n || i === pop;
      l.visible = on; if (!on) return;
      let s = 1; if (i === pop) s = dt < 0 ? 0.001 : Math.max(0.001, E.back(remap(dt, 0, 0.35)));
      l.position.set(u.x, u.y + Math.sin(t * 1.6 + u.ph) * 0.12, u.z); l.rotation.y = Math.sin(t * 0.7 + u.ph) * 0.4; l.scale.setScalar(s);
    });
    return av;
  };
  av.lanOff = (n, i, dt, t) => { av.lan(n, t); const l = items[i]; if (!l) return av; l.visible = dt < 0.5; const k = remap(dt, 0, 0.5); l.position.set(l.userData.x, l.userData.y + k * 1.2, l.userData.z); l.scale.setScalar(Math.max(0.001, 1 - E.in(k))); return av; };
  return av;
}
const hatCols = ['#ff6fae', '#2f95e6', '#ffd23f', '#2e9e59', '#7b3fc4'];
function partyHat(av, i) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 16), mat(hatCols[i % 5])); h.position.set(0.12, 1.65, 0); h.rotation.z = -0.15; const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#ffffff')); p.position.y = 0.6; h.add(p); av.head.add(h); h.visible = false; PRE.push(() => { h.visible = false; }); av.hat = () => { h.visible = true; return av; }; }
function cast(set, keys) { const o = {}; for (const k of keys) { const a = lanterns(makeAvatar(LOOK[k])); a.lanBase = LAN[k] ?? 0; partyHat(a, a.o.seed); set.group.add(a.root); ALL.push(a); o[k] = a; } return o; }
PRE.push(() => { for (const a of ALL) a.lan(a.lanBase, 0); });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

// ───────── night neighbourhood (built here: houses, string lights, moon, stars, basketball court) ─────────
function nightSky() {
  const t = canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1230'); gr.addColorStop(0.55, '#24305e'); gr.addColorStop(1, '#4a4a7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * w, r() * h * 0.6, s, s); } });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), glow('#fff6dc', 1.5)); moon.position.set(60, 110, -300);
  return grp(dome, moon);
}
function house(color, roof, lit) {
  const g = grp(at(box(10, 7, 8, color, 0.1), 0, 3.5, 0));
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 3.6, 4, 1), mat(roof)); r.rotation.y = Math.PI / 4; r.scale.set(1.08, 1, 0.86); r.position.y = 8.8; r.castShadow = true; g.add(r);
  const win = c => glow(c, lit ? 1.5 : 0.25);
  g.add(at(box(2.4, 4.6, 0.3, '#5a3524'), 0, 2.3, 4.05), at(box(0.25, 0.25, 0.3, '#ffd23f'), 0.8, 2.3, 4.25));
  for (const x of [-3.2, 3.2]) g.add(at(box(2.2, 2.0, 0.2, win(lit ? '#ffd98a' : '#2a3150')), x, 4.0, 4.05), at(box(2.5, 0.2, 0.3, '#f4f4f4'), x, 2.95, 4.1));
  g.add(at(box(3.6, 0.5, 1.6, '#9aa0a8'), 0, 0.25, 4.8));   // step
  return g;
}
function stringLights(w, y = 0, cols = ['#ffcf5a', '#ff6fae', '#7fd0ff', '#9be37a']) {
  const g = grp(), n = Math.floor(w / 1.4);
  for (let i = 0; i < n; i++) { const k = i / (n - 1), b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glow(cols[i % cols.length], 1.6)); b.position.set(-w / 2 + k * w, y - Math.sin(k * Math.PI) * 1.2, 0); g.add(b); }
  return g;
}
const HOUSES = [['#f2c7d0', '#b84a5a'], ['#bfe3ff', '#2f5f9a'], ['#fff0b8', '#c9822a'], ['#d6f2c4', '#3f8a4a'], ['#e4d0ff', '#6a4ab0'], ['#ffd9c2', '#b8603a']];
const FINNX = 0;   // Finn's house sits at x = 0 on the near row
function neighbourhood() {
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
function court() {
  const g = grp(nightSky(), at(floor(200, 140, TEX.grass('#3f8a4a'), 6), 0, -0.03, -20));
  const c = box(30, 0.1, 18, '#3f7fd8'); c.position.set(0, 0.05, 0); g.add(c, at(box(11, 0.11, 6, '#ff8a3c'), 0, 0.06, -4.5), at(box(30, 0.12, 0.25, '#ffffff'), 0, 0.07, 0), at(box(0.25, 0.12, 18, '#ffffff'), 0, 0.07, 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 20), mat('#ff6a1c')); ring.rotation.x = Math.PI / 2; ring.position.set(0, 9.2, -6.6);
  g.add(at(box(0.5, 9.5, 0.5, '#2b2f38'), 0, 4.75, -8.6), at(box(5, 3.2, 0.25, '#f4f4f4'), 0, 10.3, -7.6), ring);
  g.add(at(sign(['GUEST  HOME', '12   21'], 6, 2.6, { bg: '#15171c', fg: '#ffd23f' }), 9, 9.4, -9.2));
  for (let i = 0; i < 4; i++) g.add(at(box(22, 0.6, 1.6, '#9aa0a8'), -2, 0.3 + i * 0.7, -10.6 - i * 1.4));
  g.add(at(stringLights(34, 0), 0, 13, -9), at(lampPost(13), -16, 0, -9), at(lampPost(13), 16, 0, -9), at(tree(10, '#2f7a3a'), -22, 0, -12), at(tree(11, '#2f7a3a'), 22, 0, -13));
  return { group: g, light: 'night' };
}

start(() => {
  const town = neighbourhood(), park = court();
  const hall = SETS.hallway({ banner: 'MAKE A\nFRIEND!', bannerBg: '#ffd23f', locker: '#2f7de1', door: 'ROOM 10', poster: 'NEW KID\nWEEK', posterBg: '#2e9e59' });
  const caf = SETS.cafeteria({ menu: 'TODAY: CAKE!', rule: 'SIT\nTOGETHER' });
  const T = cast(town, ['nar', 'finn', 'coco', 'jake', 'newkid', 'skater', 'lady']);
  const P = cast(park, ['nar', 'jake', 'coco', 'skater', 'newkid']);
  const H = cast(hall, ['nar', 'newkid', 'skater', 'finn']);
  const C = cast(caf, ['nar', 'newkid', 'lady', 'coco']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2), makeSparkles(set.group, 3)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FT = fx(town), FP = fx(park), FH = fx(hall), FC = fx(caf);
  // RULE FIRES: a new lantern lights (index n) with scream face + sparkles at the head
  const lightUp = (F, av, lt, t0, n, rest, spi = 0) => {
    const dt = lt - t0; av.lan(dt < 0 ? n : n, lt, n, dt);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) { const p = av.root.position; F.sp[spi].at(dt, [p.x, p.y + 3.2, p.z], 0.8); }
  };
  // props
  const bike = prop((() => { const g = grp(); for (const x of [-1.1, 1.1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 8, 18), mat('#1b1d22')); w.position.set(x, 0.85, 0); g.add(w); } g.add(at(box(2.2, 0.15, 0.15, '#e8413c'), 0, 1.4, 0), at(box(0.15, 1.0, 0.15, '#e8413c'), 0.6, 1.4, 0), at(box(0.7, 0.15, 0.5, '#1b1d22'), -0.4, 1.95, 0)); return g; })()); park.group.add(bike);
  const plane = prop(grp(box(4, 0.8, 0.8, '#d9dde3', 0.2), at(box(1.2, 0.15, 5, '#d9dde3'), 0, 0, 0), at(box(0.8, 1.0, 0.2, '#d9dde3'), -1.8, 0.6, 0), at(box(0.3, 0.3, 0.3, glow('#ff3b30', 2)), 0, -0.2, 2.5), at(box(0.3, 0.3, 0.3, glow('#3bff6a', 2)), 0, -0.2, -2.5))); town.group.add(plane);
  const flyers = prop(grp(at(box(0.9, 0.05, 1.2, '#f4f4f4'), 0, 0, 0), at(box(0.9, 0.05, 1.2, '#ffd23f'), 0.1, 0.06, 0.05))); H.nar.handR.add(flyers); flyers.position.set(0, -0.25, 0.4);
  const candy = prop(grp((() => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.6, 18), mat('#7fd0ff')); return b; })(), ...[0, 1, 2, 3, 4].map(i => at(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(['#e8413c', '#ffd23f', '#2e9e59', '#ff6fae', '#7b3fc4'][i])), Math.cos(i * 1.3) * 0.4, 0.35, Math.sin(i * 1.3) * 0.4)))); H.nar.handR.add(candy); candy.position.set(0, -0.3, 0.7);
  const hatHand = prop(new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 16), mat('#ff6fae'))); T.nar.handR.add(hatHand); hatHand.position.set(0, -0.3, 0.5); hatHand.rotation.x = Math.PI / 2;
  const chess = prop(grp(at(box(2.4, 0.12, 2.4, '#f4efe6'), 0, 0, 0), ...[...Array(8)].map((_, i) => at(box(0.22, 0.45, 0.22, i % 2 ? '#1b1d22' : '#f4f4f4'), -0.9 + (i % 4) * 0.6, 0.28, i < 4 ? -0.8 : 0.8)))); caf.group.add(chess);
  const skate = prop(grp(at(box(2.4, 0.12, 0.8, '#e8413c', 0.05), 0, 0.35, 0), ...[-0.8, 0.8].map(x => at(box(0.3, 0.3, 0.9, '#1b1d22'), x, 0.15, 0)))); park.group.add(skate);
  const N = H.nar;

  // ═══════════════ HOOK (aerial night town) ═══════════════
  shot({ line: 'In this town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [-22, 24, 40], look: [0, 3, 2], fov: 55, blur: 0.04, push: 0, to: { pos: [-16, 21, 34] }, ease: 'lin' },
    act(lt, c) { T.coco.reset().place(-14, 8, 0.3).idle(c.t).setFace('grin').lan(28, c.t); walkX(T.jake, -2, 9, 1, lt, c.t, 0.6, 'smile').lan(6, c.t); walkX(T.finn, 8, 8.4, -1, lt, c.t, 0.4, 'sad'); T.skater.reset().place(16, 8, -0.3).idle(c.t).setFace('smile').lan(5, c.t); } });
  shot({ line: 'every friend you make', set: park, sfx: [['pop', 'friend', 0.6]], cam: frame(0, 2, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { const k = remap(lt, c.w('make') - 0.2, c.w('make') + 0.1); P.jake.reset().place(-1.6, 2, Math.PI / 2 - 0.4).pose({ aR: [lerp(90, 160, k), -10] }).idle(c.t).setFace('grin').lan(0, c.t); P.skater.reset().place(1.6, 2, -Math.PI / 2 + 0.4).pose({ aR: [lerp(90, 160, k), -10] }).idle(c.t).setFace('grin').lan(0, c.t); } });
  shot({ line: 'lights a lantern above your head.', set: park, sfx: [['sparkle', 'lights'], ['ding', 'lantern', 0.5]], cam: { pos: [-1.6, 6.2, 9.4], look: [-1.6, 6.4, 2], fov: 60, blur: 0.4, push: 0.02 },
    act(lt, c) { const a = P.jake.reset().place(-1.6, 2, 0.1).idle(c.t).lan(0, c.t); lightUp(FP, a, lt, c.w('lights'), 0, 'grin'); a.head.rotation.x -= 0.3; } });
  shot({ line: "That's why popular kids glow like birthday cakes,", set: town, cam: { pos: [-16, 4.4, 22], look: [-16, 6, 8], fov: 60, blur: 0.15, push: 0, to: { pos: [-6, 4.4, 22], look: [-6, 6, 8] }, ease: 'lin' },
    act(lt, c) { walkX(T.coco, -18, 8.4, 1, lt, c.t, 0.5, 'grin').lan(28, c.t); walkX(T.skater, -23, 9.8, 1, lt, c.t, 0.5, 'smile').lan(8, c.t); } });
  shot({ line: 'and lonely kids', set: town, cam: frame(3.5, 8.4, { size: 'medium', low: 0.42, side: -14 }),
    act(lt, c) { T.finn.reset().place(3.5, 8.4, -0.2).pose({ aL: [30, -20], aR: [30, -20] }).idle(c.t).setFace('sad'); } });
  shot({ line: 'walk home in the dark.', set: town, sfx: [['sad', 'dark', 0.5]], cam: { pos: [1.2, 5.0, 20], look: [4.2, 3.6, 8.4], fov: 58, blur: 0.08, push: 0.015 },
    act(lt, c) { walkX(T.finn, 6.6, 8.4, -1, lt, c.t, 0.4, 'sad'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'I had about three lanterns.', set: town, cam: frame(-10, 9, { size: 'full', side: -6, dist: 1.0 }),
    act(lt, c) { T.nar.reset().place(-10, 9, 0.1).pose('open').idle(c.t).setFace('grin').lan(3, c.t); } });
  shot({ line: 'But my best friend Finn', set: town, cam: frame(3, 8.6, { size: 'close', side: -12 }),
    act(lt, c) { const f = T.finn.reset().place(3, 8.6, -0.15).pose('wave', remap(lt, 0.1, 0.4)).idle(c.t).setFace('smile'); f.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: "didn't have a single one.", set: town, sfx: [['sad', 'one', 0.4]], cam: { ...frame(3, 8.6, { size: 'full', side: 10, dist: 1.0 }), look: [3, 5.6, 8.6] },
    act(lt, c) { T.finn.reset().place(3, 8.6, 0.2).idle(c.t).setFace(lt < c.w('single') ? 'smile' : 'sad'); if (lt > c.w('single')) T.finn.head.rotation.x -= 0.4; } });
  shot({ line: 'His was the only dark house on the street.', set: town, cam: { pos: [-30, 18, 30], look: [0, 4, -2], fov: 50, blur: 0.04, push: 0, to: { pos: [-10, 16, 30], look: [0, 4, -2] }, ease: 'lin' },
    act(lt, c) { } });
  // plant: never had a birthday party
  shot({ line: "He'd never had a birthday party,", set: town, cam: { pos: [3.4, 4.4, 13.5], look: [0.6, 4.2, 2.8], fov: 58, blur: 0.25 },
    act(lt, c) { T.finn.reset().place(0, 4.4, 0, 0.5).sit(0.8).pose({ aL: [40, -10], aR: [40, -10] }).idle(c.t, 0.4).setFace('sad'); } });
  shot({ line: 'because nobody could find his house.', set: town, cam: { pos: [6, 3.4, 26], look: [0, 4.6, 0], fov: 50, blur: 0.06, push: 0.02 },
    act(lt, c) { walkX(T.jake, 12, 10, -1, lt, c.t, 0.6, 'neutral').lan(6, c.t); T.jake.head.rotation.y -= 0.5; } });
  shot({ line: 'Meanwhile, Coco had ninety-nine lanterns.', set: town, sfx: [['ding', 'ninety-nine', 0.5]], cam: { pos: [-14, 3.0, 19], look: [-14, 8.4, 8], fov: 62, blur: 0.15 },
    act(lt, c) { T.coco.reset().place(-14, 8, 0).pose('hips').idle(c.t).setFace('smug').lan(28, c.t); } });
  shot({ line: 'She lit up the whole block.', set: town, cam: { pos: [-22, 20, 32], look: [-14, 4, 6], fov: 52, blur: 0.05, push: 0.02 },
    act(lt, c) { walkX(T.coco, -18, 8.6, 1, lt, c.t, 0.5, 'grin').lan(28, c.t); } });
  shot({ line: 'Moths followed her home.', set: town, cam: frame(-14, 8.4, { size: 'close', side: 14 }),
    act(lt, c) { T.coco.reset().place(-14, 8.4, 0.3).idle(c.t).setFace('sus').lan(28, c.t); T.coco.armR.rotation.x = -2.2 + Math.sin(c.t * 18) * 0.3; } });
  shot({ line: 'Planes waved at her.', set: town, sfx: [['whoosh', 'planes', 0.7]], cam: { pos: [-14, 3.4, 18], look: [-10, 14, 2], fov: 62, blur: 0.12 },
    act(lt, c) { T.coco.reset().place(-14, 8, 0.2).pose('wave').idle(c.t).setFace('grin').lan(28, c.t); plane.show().position.set(-26 + lt * 18, 17, -2); plane.rotation.set(0, 0, Math.sin(c.t * 8) * 0.25); } });

  // ═══════════════ INCITING (court) ═══════════════
  shot({ line: 'Then Jake fell off his bike,', set: park, sfx: [['thud', 'fell', 1.0]], cam: frame(2, 2, { size: 'full', side: 10, dist: 1.2 }),
    act(lt, c) { const t0 = c.w('fell'), k = remap(lt, t0, t0 + 0.4), x = -6 + Math.min(lt, t0) * 5; bike.show().position.set(x + k * 1.5, 0, 2); bike.rotation.set(0, 0, k * 1.4); const j = P.jake.reset().lan(6, c.t); if (lt < t0) j.place(x, 2, Math.PI / 2, 0.4).sit(1.3).setFace('grin'); else { j.place(x + 1.6 + k * 1.6, 2.4, Math.PI / 2 - 0.4, 0).pose({ aL: [150, 30], aR: [150, 30] }).setFace('shock'); j.root.rotation.z = -E.out(k) * 1.4; FP.puff.at(lt - t0 - 0.35, [x + 3, 0, 2.4]); } } });
  shot({ line: 'and I laughed at him.', set: park, cam: frame(-4, 3.4, { size: 'close', side: -14 }),
    act(lt, c) { const a = P.nar.reset().place(-4, 3.4, 0.4).pose({ aR: [88, 30] }).idle(c.t).lan(3, c.t).setFace(lt < c.w('laughed') ? 'smirk' : 'laugh'); if (lt > c.w('laughed')) a.hip.position.y += Math.abs(Math.sin(c.t * 15)) * 0.08; } });
  shot({ line: 'Pop. One of my lanterns went out.', set: park, sfx: [['pop', 0, 0.9], ['fall', 0, 0.6]], cam: { pos: [-4, 6.4, 11.6], look: [-4, 6.2, 3.4], fov: 60, blur: 0.4 },
    act(lt, c) { const a = P.nar.reset().place(-4, 3.4, 0).idle(c.t); a.lanOff(2, 2, lt, c.t); a.setFace(lt < 0.47 ? 'scream' : 'sad'); if (lt < 0.47) a.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(lt, 0, 0.47) * Math.PI)); FP.puff.at(lt, [a.root.position.x + 0.5, 7.2, 3.0]); } });
  shot({ line: "Jake didn't even look at me.", set: park, cam: { ...frame(-0.6, 2.6, { size: 'wide', dist: 0.82 }), blur: 0.08 },
    act(lt, c) { walkX(P.jake, 3, 2.6, 1, lt, c.t, 0.4, 'sad').lan(6, c.t); P.nar.reset().place(-4, 3.4, 0.6).idle(c.t).setFace('sad').lan(2, c.t); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10 }),
    act(lt, c) { N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin').lan(2, c.t); FH.bulb.at(lt - c.w('idea'), N, 1.6); } });
  shot({ line: 'If I made a hundred friends,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18 }),
    act(lt, c) { N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk').lan(2, c.t); } });
  shot({ line: "I'd beat Coco.", set: hall, sfx: [['pop', 'beat', 0.5], ['pop', 'coco', 0.5]], cam: { pos: [-1, 5.4, 11], look: [-2, 7.4, 0], fov: 62, blur: 0.25 },
    act(lt, c) { const n = Math.round(lerp(2, 28, E.out(remap(lt, c.w('beat') - 0.1, c.d)))); N.reset().place(-2, 1, 0).pose('cheer').idle(c.t).setFace('laugh').lan(n, c.t); } });
  shot({ line: 'I handed out flyers. Nothing.', set: hall, cam: frame(4, 0.6, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { N.reset().place(3, 0.6, 0.8).pose({ aR: [80, 0] }).idle(c.t).setFace(lt < c.w('nothing') ? 'grin' : 'blank').lan(2, c.t); flyers.show(); walkX(H.skater, 4, 2.6, -1, lt, c.t, 0.5, 'neutral'); } });
  shot({ line: 'I offered free candy.', set: hall, cam: frame(-8, 0.6, { size: 'close', side: 14 }),
    act(lt, c) { N.reset().place(-8, 0.6, 0.2).pose({ aR: [80, 0] }).idle(c.t).setFace('smile').lan(2, c.t); candy.show(); } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(-8, 0.6, { size: 'face', side: -10, push: 0.06 }),
    act(lt, c) { N.reset().place(-8, 0.6, 0).idle(c.t, 0.3).setFace('sus').lan(2, c.t); } });

  // ═══════════════ ACCIDENTAL SUCCESS ═══════════════
  shot({ line: 'Then I helped a new kid find his classroom.', set: hall, cam: frame(2, 0.4, { size: 'medium', side: -10, dist: 1.25 }),
    act(lt, c) { const k = remap(lt, 0, c.d); N.reset().place(0.4 + k * 1.6, 0.6, Math.PI / 2 - 0.6).walk(c.t, 0.5).pose({ aR: [80, 20] }).setFace('smile').lan(2, c.t); H.newkid.reset().place(2.6 + k * 1.6, 1.2, Math.PI / 2 - 0.3).walk(c.t + 1, 0.5).setFace(lt < c.w('find') ? 'worried' : 'smile'); } });
  shot({ line: 'We talked all through lunch.', set: caf, cam: frame(-7.5, 0.4, { size: 'medium', side: 6, dist: 1.25 }),
    act(lt, c) { C.nar.reset().place(-5.8, 0.4, -0.7).talk(c.t).idle(c.t).setFace('talk').lan(2, c.t); C.newkid.reset().place(-9.2, 0.2, 0.7).talk(c.t + 0.5).idle(c.t).setFace('laugh'); } });
  shot({ line: 'Ding. A new lantern lit up.', set: caf, sfx: [['ding', 0], ['sparkle', 0]], cam: { pos: [-5.4, 6.2, 9], look: [-5.8, 6.2, 0.4], fov: 60, blur: 0.4 },
    act(lt, c) { const a = C.nar.reset().place(-5.8, 0.4, -0.2).idle(c.t).lan(2, c.t); lightUp(FC, a, lt, 0, 2, 'laugh'); a.head.rotation.x -= 0.25; } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I made friends everywhere.', set: town, cam: frame(-10, 9, { size: 'full', side: 6, dist: 1.0 }),
    act(lt, c) { T.nar.reset().place(-10, 9, 0.1).pose('cheer').jump((lt * 2.2) % 1, 0.8).setFace('laugh').lan(Math.round(lerp(3, 8, remap(lt, 0, c.d))), c.t); } });
  shot({ line: 'The chess club.', set: caf, sfx: [['pop', 'club', 0.5]], cam: frame(-7.5, -0.6, { size: 'medium', side: 12, dist: 1.2 }),
    act(lt, c) { chess.show().position.set(-7.5, 2.85, 1.6); C.newkid.reset().place(-9.6, 0, 0.6).pose({ aR: [60, 10] }).idle(c.t).setFace('serious'); C.nar.reset().place(-5.4, 0, -0.6).idle(c.t).setFace(lt < c.w('club') ? 'serious' : 'laugh').lan(lt < c.w('club') ? 8 : 9, c.t, 8, lt - c.w('club')); } });
  shot({ line: 'The skaters.', set: park, sfx: [['pop', 'skaters', 0.5]], cam: frame(4, 2, { size: 'full', side: -12, dist: 1.2 }),
    act(lt, c) { skate.show().position.set(2 + lt * 4, 0, 2.6); P.skater.reset().place(2 + lt * 4, 2.6, Math.PI / 2, 0.45).pose({ aL: [40, 50], aR: [40, 50], lL: 20 }).setFace('laugh'); P.nar.reset().place(4.6, 0.8, -0.4).pose('cheer').idle(c.t).setFace('laugh').lan(lt < c.w('skaters') ? 10 : 11, c.t, 10, lt - c.w('skaters')); } });
  shot({ line: 'The lunch lady.', set: caf, sfx: [['pop', 'lady', 0.5]], cam: frame(-7.5, 0, { size: 'medium', side: 10, dist: 1.25, h: 1.05 }),
    act(lt, c) { C.lady.reset().place(-9.2, -0.4, 0.5).idle(c.t).setFace(lt < c.w('lady') ? 'neutral' : 'love'); C.nar.reset().place(-6, 0.4, -0.6).pose('hug').idle(c.t).setFace('grin').lan(lt < c.w('lady') ? 12 : 13, c.t, 12, lt - c.w('lady')); } });
  shot({ line: 'By the weekend, I had twenty lanterns.', set: town, sfx: [['ding', 'twenty', 0.5]], cam: { pos: [-10, 3.0, 20], look: [-10, 8.4, 9], fov: 62, blur: 0.12 },
    act(lt, c) { T.nar.reset().place(-10, 9, 0).pose('cheer').idle(c.t).setFace('laugh').lan(Math.round(lerp(13, 20, remap(lt, 0, c.w('twenty')))), c.t); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: "But then I walked past Finn's house.", set: town, cam: { pos: [-8, 5, 21], look: [-2, 4.6, 8], fov: 58, blur: 0.12 },
    act(lt, c) { walkX(T.nar, -8, 9.4, 1, lt, c.t, 0.5, 'laugh').lan(20, c.t); if (lt > c.w('past')) T.nar.lookAt(0, 0); } });
  shot({ line: 'It was still completely dark.', set: town, sfx: [['sad', 'dark', 0.6]], cam: { pos: [0, 6, 22], look: [0, 4.6, -1], fov: 52, blur: 0.04, push: 0.02 },
    act(lt, c) { } });
  shot({ line: 'Finn was sitting on his steps, alone.', set: town, cam: { pos: [2.6, 4.6, 12.8], look: [0.2, 4.0, 2.8], fov: 58, blur: 0.3, push: 0.02 },
    act(lt, c) { T.finn.reset().place(0, 4.4, 0, 0.5).sit(0.8).pose({ aL: [40, -10], aR: [40, -10], head: [16, 0, 0] }).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'd spent all week collecting friends", set: town, cam: frame(-3, 9.4, { size: 'close', side: 16 }),
    act(lt, c) { T.nar.reset().place(-3, 9.4, -0.4).idle(c.t, 0.5).setFace(lt < c.w('friends') ? 'worried' : 'sad').lan(20, c.t); } });
  shot({ line: 'while forgetting my oldest one.', set: town, cam: frame(-3, 9.4, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { T.nar.reset().place(-3, 9.4, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('oldest') ? 'sad' : 'cry').lan(20, c.t); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I knocked on his door with a party hat.', set: town, sfx: [['tick', 'knocked', 1.2], ['tick', 'on', 1.2]], cam: { pos: [4.2, 5.2, 13], look: [0.6, 4.6, 3.6], fov: 58, blur: 0.2 },
    act(lt, c) { T.nar.reset().place(1.6, 6.0, -0.5).pose(lt < c.w('party') ? { aR: [100, -20] } : { aR: [80, -10] }).idle(c.t).setFace('smile').lan(20, c.t); if (lt > c.w('party')) hatHand.show(); T.finn.reset().place(-0.6, 4.6, 0.6, 0.5).idle(c.t).setFace(lt < c.w('door') ? 'sad' : 'wow'); } });
  shot({ line: "He asked, what's this?", set: town, cam: frame(-0.6, 4.6, { size: 'close', y: 0.5, side: -12 }),
    act(lt, c) { T.finn.reset().place(-0.6, 4.6, 0.4, 0.5).talk(c.t, lt > c.w("what's") ? 1 : 0).idle(c.t).setFace(lt < c.w("what's") ? 'neutral' : 'say'); } });
  shot({ line: 'Your birthday party. You never had one.', set: town, cam: frame(1.6, 6.0, { size: 'close', side: 18 }),
    act(lt, c) { T.nar.reset().place(1.6, 6.0, -0.6).pose({ aR: [80, -10] }).talk(c.t).idle(c.t).setFace(lt < c.w('never') ? 'grin' : 'say').lan(20, c.t); hatHand.show(); } });
  shot({ line: 'Then I invited everyone.', set: town, sfx: [['pop', 'everyone', 0.6]], cam: { pos: [-6, 5, 22], look: [-4, 4.6, 9], fov: 58, blur: 0.1 },
    act(lt, c) { T.nar.reset().place(-4, 9.4, 0).pose('cheer').talk(c.t).idle(c.t).setFace('talk').lan(20, c.t); } });
  shot({ line: 'One by one, they showed up.', set: town, sfx: [['pop', 'one', 0.5], ['pop', ['one', 1], 0.5], ['pop', 'showed', 0.5]], cam: { pos: [6, 6, 24], look: [0, 4, 6], fov: 56, blur: 0.06 },
    act(lt, c) { [[T.jake, 'one', -10], [T.skater, ['one', 1], 12], [T.newkid, 'showed', -14], [T.lady, 'up', 15]].forEach(([a, w, x0], i) => { const t0 = Array.isArray(w) ? c.w(w[0], w[1]) : c.w(w); if (lt < t0) return; const k = remap(lt, t0, t0 + 1.2); a.reset().place(lerp(x0, (i - 1.5) * 2.6, E.out(k)), lerp(10, 6.6 + (i % 2) * 1.2, E.out(k)), k < 1 ? (x0 < 0 ? Math.PI / 2 : -Math.PI / 2) : 0).walk(k < 1 ? c.t + i : 0, k < 1 ? 0.8 : 0).setFace('grin').hat(); }); T.finn.reset().place(-0.6, 4.6, 0, 0.5).idle(c.t).setFace('wow'); } });
  shot({ line: 'And one by one, his lanterns lit up.', set: town, sfx: [['sparkle', 'one'], ['ding', ['one', 1], 0.5], ['sparkle', 'lanterns'], ['ding', 'lit', 0.6]], cam: { pos: [-0.6, 5.6, 12.2], look: [-0.6, 7.6, 4.6], fov: 60, blur: 0.3 },
    act(lt, c) { const f = T.finn.reset().place(-0.6, 4.6, 0, 0.5).idle(c.t).hat(); const steps = [c.w('one'), c.w('one', 1), c.w('lanterns'), c.w('lit')]; let n = 0; steps.forEach(s => { if (lt >= s) n++; }); const last = steps[Math.max(0, n - 1)]; f.lan(n > 0 ? (n - 1) * 3 : 0, c.t, n > 0 ? (n - 1) * 3 : -1, lt - last); if (n > 0) for (let i = 0; i < 3; i++) f.lan(n * 3, c.t, (n - 1) * 3 + i, lt - last); f.setFace(n === 0 ? 'wow' : lt - last < 0.4 ? 'scream' : 'laugh'); FT.sp[n % 3].at(lt - last, [-0.6, 3.8, 4.6], 0.9); } });
  // payoff of the plant
  shot({ line: "By midnight, Finn's house was the brightest on the street.", set: town, sfx: [['ding', 'brightest', 0.6]], cam: { pos: [-18, 22, 34], look: [0, 4, -1], fov: 50, blur: 0.04, push: 0, to: { pos: [-3, 17, 32], look: [0, 5, 0] }, ease: 'lin' },
    act(lt, c) { town.finnDark.visible = false; town.finnLit.visible = true; town.finnLights.visible = true; const f = T.finn.reset().place(0, 6.4, 0).pose('cheer').idle(c.t).setFace('laugh').hat().lan(24, c.t); [T.jake, T.skater, T.newkid, T.nar].forEach((a, i) => a.reset().place((i - 1.5) * 3, 9 + (i % 2), 0).pose('cheer').jump((c.t * 1.6 + i * 0.3) % 1, 0.6).setFace('laugh').hat()); T.nar.lan(20, c.t); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Even Coco came.', set: town, sfx: [['whoosh', 'coco', 0.5]], cam: frame(4, 8.6, { size: 'full', side: -10, dist: 1.1 }),
    act(lt, c) { town.finnDark.visible = false; town.finnLit.visible = true; town.finnLights.visible = true; const k = remap(lt, 0, c.d); T.coco.reset().place(lerp(10, 5, E.out(k)), 8.6, -Math.PI / 2).walk(k < 0.9 ? c.t : 0, 0.6).setFace('grin').lan(28, c.t).hat(); } });
  shot({ line: 'She squinted and said, I need sunglasses.', set: town, sfx: [['pop', 'sunglasses', 0.5]], cam: frame(5, 8.6, { size: 'close', side: 14 }),
    act(lt, c) { town.finnLit.visible = true; town.finnDark.visible = false; town.finnLights.visible = true; T.coco.reset().place(5, 8.6, -0.5).pose(lt < c.w('said') ? { aR: [150, -40] } : 'shrug').talk(c.t, lt > c.w('said') ? 1 : 0).idle(c.t).setFace(lt < c.w('said') ? 'sus' : 'say').lan(28, c.t).hat(); } });
  shot({ line: 'Best party in town.', set: town, cam: frame(-1, 8, { size: 'medium', side: -10, low: 0.3, dist: 1.15 }),
    act(lt, c) { town.finnLit.visible = true; town.finnDark.visible = false; town.finnLights.visible = true; T.nar.reset().place(0.6, 8, -0.3).pose(lt < c.w('party') ? 'open' : 'cheer').idle(c.t).setFace(lt < c.w('party') ? 'grin' : 'laugh').lan(20, c.t).hat(); T.finn.reset().place(-2.4, 8.4, 0.3).pose('cheer').idle(c.t).setFace('laugh').lan(24, c.t).hat(); } });
});
