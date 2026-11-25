// story.js: "In this town, every happy birthday you get pops a balloon out of your head. Get enough, and you float."
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { neighbourhood, court, FINNX } from './night.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, rng, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 111, skin: 'fair', hair: 'messy', hairColor: '#e8632b', top: 'hoodie', topColor: '#2e9e59', bottom: 'jeans', bottomColor: '#4f79a7' },
  oscar: { seed: 112, skin: 'deep', hair: 'short', hairColor: '#17110f', top: 'shirt', topColor: '#ffd23f', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b3a6b', glasses: true },
  bianca: { seed: 113, skin: 'light', hair: 'buns', hairColor: '#7a4a2e', top: 'cardigan', topColor: '#bfe3ff', inner: '#ff6fae', sleeves: 'long', bottom: 'skirt', bottomColor: '#7b3fc4' },
  kidA: { seed: 114, skin: 'tan', hair: 'spiky', hairColor: '#2b1b14', top: 'jersey', topColor: '#2f7de1', number: '8', bottom: 'shorts', bottomColor: '#f4f4f4' },
  kidB: { seed: 115, skin: 'brown', hair: 'ponytail', hairColor: '#1b1210', top: 'stripes', topColor: '#f4f4f4', stripe: '#e8413c', bottom: 'jeans', bottomColor: '#274b8f' },
  driver: { seed: 116, skin: 'tan', hair: 'buzz', hairColor: '#333333', top: 'shirt', topColor: '#2b6fe0', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', cap: '#2b6fe0', height: 1.12 },
  lady: { seed: 117, skin: 'fair', hair: 'bob', hairColor: '#c98a3a', top: 'shirt', topColor: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#5a5f6a', height: 1.1 },
};
const BAL = { bianca: 30, kidA: 12, kidB: 3 };
const ALL = [];
const BCOL = ['#e8413c', '#2f95e6', '#ffd23f', '#2e9e59', '#ff6fae', '#7b3fc4', '#ff9f2e'];
// balloon bunch tied to the top of the head. n balloons; pop = index popping in (age dt)
function balloons(av, max = 30) {
  const g = new THREE.Group(), items = [], r = rng(av.o.seed * 7 + 3), strMat = new THREE.MeshBasicMaterial({ color: '#f4f4f4' });
  for (let i = 0; i < max; i++) {
    const b = new THREE.Group();
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), new THREE.MeshLambertMaterial({ color: BCOL[i % BCOL.length], emissive: new THREE.Color(BCOL[i % BCOL.length]).multiplyScalar(0.25) })); s.scale.set(1, 1.18, 1); s.castShadow = true;
    const a = i * 2.39996, rad = i === 0 ? 0 : 0.5 + Math.sqrt(i) * 0.62, h = 8.8 + Math.sqrt(i) * 0.55 + (i % 3) * 0.3;
    const x = Math.sin(a) * rad, z = Math.cos(a) * rad * 0.6 - 0.2;
    s.position.set(x, h, z);
    const len = Math.hypot(x, h - 5.3, z), str = new THREE.Mesh(new THREE.BoxGeometry(0.035, len, 0.035), strMat);
    str.position.set(x / 2, (h + 5.3) / 2 - 0.35, z / 2); str.lookAt(x, h, z); str.rotateX(Math.PI / 2);
    str.position.set(x / 2, 5.3 + (h - 5.3) / 2 - 0.35, z / 2);
    const dir = new THREE.Vector3(x, h - 5.3, z).normalize(); str.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    b.add(s, str); b.userData = { ph: r() * 6.28 }; g.add(b); items.push(b);
  }
  av.root.add(g);
  av.bal = (n, t = 0, pop = -1, dt = 0) => {
    items.forEach((b, i) => {
      const on = i < n || i === pop; b.visible = on; if (!on) return;
      let s = 1; if (i === pop) s = dt < 0 ? 0.001 : Math.max(0.001, E.back(remap(dt, 0, 0.3)));
      b.scale.setScalar(s); b.rotation.z = Math.sin(t * 1.3 + b.userData.ph) * 0.05; b.rotation.x = Math.cos(t * 1.1 + b.userData.ph) * 0.04;
    });
    return av;
  };
  return av;
}
const hatCols = ['#ff6fae', '#2f95e6', '#ffd23f', '#2e9e59', '#7b3fc4'];
function partyHat(av) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 16), mat(hatCols[av.o.seed % 5])); h.position.set(0.12, 1.65, 0); h.rotation.z = -0.15; const p = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#ffffff')); p.position.y = 0.6; h.add(p); av.head.add(h); h.visible = false; PRE.push(() => { h.visible = false; }); av.hat = () => { h.visible = true; return av; }; }
function cast(set, keys) { const o = {}; for (const k of keys) { const a = balloons(makeAvatar(LOOK[k])); a.balBase = BAL[k] ?? 0; partyHat(a); set.group.add(a.root); ALL.push(a); o[k] = a; } return o; }
PRE.push(() => { for (const a of ALL) a.bal(a.balBase, 0); });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
function phone(av) { const g = grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.4)), 0, 0.08, 0)); g.position.set(0, -0.2, 0.32); av.handR.add(g); return prop(g); }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);
const fl = (t, s = 0) => Math.sin(t * 1.6 + s) * 0.25;   // floating bob
function bus() {
  const g = grp(at(box(14, 3.4, 5, '#ffc61a', 0.2), 0, 2.5, 0), at(box(14.2, 0.5, 5.2, '#1b1d22', 0.1), 0, 0.9, 0), at(box(14, 0.5, 5, '#ffc61a', 0.2), 0, 6.5, 0), at(box(2.6, 3.0, 5, '#ffc61a', 0.2), 5.7, 4.2, 0));
  for (let i = 0; i < 6; i++) for (const z of [-2.45, 2.45]) g.add(at(box(0.35, 2.1, 0.12, '#ffc61a'), -6.8 + i * 2.2, 5.25, z));
  for (const x of [-4.6, 4.2]) for (const z of [-2.5, 2.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 18), mat('#1b1d22')); w.rotation.x = Math.PI / 2; w.position.set(x, 1, z); g.add(w); }
  g.add(at(sign('SCHOOL BUS', 7, 1.0, { bg: '#ffc61a', fg: '#1b1d22' }), -1.6, 2.6, 2.52), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.6)), 7.05, 2.2, 1.6), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.6)), 7.05, 2.2, -1.6));
  return g;
}
function dog() {
  const m = mat('#c98a3a'), g = grp(at(box(2.0, 1.0, 1.0, m, 0.15), 0, 1.3, 0), at(box(1.0, 0.9, 0.9, m, 0.15), 1.3, 1.9, 0), at(box(0.4, 0.3, 0.6, '#8a5628', 0.08), 1.9, 1.75, 0), at(box(0.18, 0.18, 0.1, '#17120f'), 2.12, 1.85, 0));
  for (const [x, z] of [[-0.7, -0.35], [-0.7, 0.35], [0.7, -0.35], [0.7, 0.35]]) g.add(at(box(0.3, 0.9, 0.3, m), x, 0.45, z));
  for (const z of [-0.4, 0.4]) g.add(at(box(0.15, 0.5, 0.35, '#8a5628'), 1.1, 2.4, z));
  const tail = at(box(0.15, 0.7, 0.15, m), -1.0, 1.9, 0); tail.rotation.z = 0.6; g.add(tail); g.userData.tail = tail;
  return g;
}

start(() => {
  const town = neighbourhood(), park = court();
  town.reset = () => { town.finnLit.visible = true; town.finnDark.visible = false; town.finnLights.visible = true; };
  const hall = SETS.hallway({ banner: 'HAPPY\nBIRTHDAY!', bannerBg: '#ff6fae', locker: '#7b3fc4', door: 'ROOM 11', poster: 'SAY IT\nOUT LOUD', posterBg: '#2e9e59' });
  const caf = SETS.cafeteria({ menu: 'TODAY: CUPCAKES!', rule: 'SING\nALONG' });
  const T = cast(town, ['nar', 'oscar', 'bianca', 'kidA', 'kidB', 'driver']);
  const P = cast(park, ['nar', 'bianca', 'kidA', 'kidB']);
  const H = cast(hall, ['nar', 'kidA', 'kidB', 'oscar', 'bianca']);
  const C = cast(caf, ['nar', 'lady', 'kidB']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2), makeSparkles(set.group, 3)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FT = fx(town), FP = fx(park), FH = fx(hall), FC = fx(caf);
  // RULE FIRES: balloon number n pops out of the head. scream face + sparkles at the head
  const popB = (F, av, lt, t0, n, rest, spi = 0) => {
    const dt = lt - t0; av.bal(n, lt, n, dt);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) { const p = av.root.position; F.sp[spi].at(dt, [p.x, p.y + 3.4, p.z], 0.8); }
  };
  // props
  const theBus = prop(bus()); town.group.add(theBus);
  const rex = prop(dog()); town.group.add(rex);
  const cake = prop(grp(at(box(2.6, 1.0, 2.6, '#f4f4f4', 0.15), 0, 0.5, 0), at(box(2.7, 0.25, 2.7, '#ff6fae', 0.1), 0, 1.0, 0), ...[-0.7, 0, 0.7].map(x => grp(at(box(0.14, 0.6, 0.14, '#7fd0ff'), x, 1.4, 0), at(box(0.16, 0.26, 0.16, glow('#ffb347', 2)), x, 1.85, 0))))); town.group.add(cake);
  const sgn = prop(sign(['BIRTHDAY', 'BOY'], 2.6, 1.6, { bg: '#ffd23f', fg: '#e8413c', border: '#e8413c' })); H.nar.torso.add(sgn); sgn.position.set(0, 0.05, 0.53);
  const narPhone = phone(T.nar);
  const N = H.nar;

  // ═══════════════ HOOK ═══════════════
  shot({ line: 'In this town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [-22, 22, 40], look: [0, 6, 2], fov: 55, blur: 0.04, push: 0, to: { pos: [-15, 19, 34] }, ease: 'lin' },
    act(lt, c) { T.bianca.reset().place(-10 + lt * 2, 9, Math.PI / 2, 6 + fl(c.t)).pose({ aL: [10, 30], aR: [10, 30] }).setFace('grin'); walkX(T.oscar, 8, 8.4, -1, lt, c.t, 0.4, 'sad'); T.kidA.reset().place(3, 8.6, -0.2, 2.4 + fl(c.t, 1)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'every happy birthday you get', set: park, sfx: [['pop', 'birthday', 0.4]], cam: frame(0, 2, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { P.kidA.reset().place(-1.6, 2, Math.PI / 2 - 0.4).pose('open').talk(c.t).idle(c.t).setFace('talk').bal(0); P.kidB.reset().place(1.6, 2, -Math.PI / 2 + 0.4).idle(c.t).setFace(lt < c.w('birthday') ? 'smile' : 'grin').bal(0); } });
  shot({ line: 'pops a balloon out of your head.', set: park, sfx: [['pop', 'pops', 1.0], ['sparkle', 'pops']], cam: { pos: [1.6, 6.8, 10], look: [1.6, 7.0, 2], fov: 60, blur: 0.4, push: 0.02 },
    act(lt, c) { const a = P.kidB.reset().place(1.6, 2, 0).idle(c.t).bal(0); popB(FP, a, lt, c.w('pops'), 0, 'grin'); } });
  shot({ line: 'Get enough, and you float.', set: park, sfx: [['rise', 'float', 0.8]], cam: { pos: [3, 3.4, 15], look: [3, 8, 2], fov: 60, blur: 0.15, push: 0, to: { look: [3, 11, 2] }, t0: 0.3, ease: 'out' },
    act(lt, c) { const k = E.out(remap(lt, c.w('float'), c.w('float') + 0.8)); P.kidA.reset().place(3, 2, 0, k * 4.6 + fl(c.t) * k).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin').bal(12, c.t); } });
  shot({ line: "That's why popular kids float to their parties,", set: town, cam: { pos: [-16, 9, 24], look: [-16, 9, 8], fov: 60, blur: 0.15, push: 0, to: { pos: [-4, 9, 24], look: [-4, 9, 8] }, ease: 'lin' },
    act(lt, c) { T.bianca.reset().place(-18 + lt * 4.2, 9, Math.PI / 2, 5 + fl(c.t)).pose({ aL: [10, 30], aR: [10, 30] }).setFace('grin'); T.kidA.reset().place(-23 + lt * 4.2, 10.4, Math.PI / 2, 3.4 + fl(c.t, 2)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'and forgotten kids walk.', set: town, sfx: [['sad', 'walk', 0.4]], cam: frame(4, 8.6, { size: 'full', low: 0.3, side: -14, dist: 0.95 }),
    act(lt, c) { walkX(T.oscar, 6, 8.6, -1, lt, c.t, 0.4, 'sad'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'Today was my birthday.', set: town, cam: frame(-10, 9, { size: 'full', side: -6, dist: 1.0 }),
    act(lt, c) { T.nar.reset().place(-10, 9, 0.1).pose('open').idle(c.t).setFace('grin').hat(); } });
  shot({ line: 'I was hoping for ten balloons.', set: town, cam: frame(-10, 9, { size: 'close', side: 12 }),
    act(lt, c) { T.nar.reset().place(-10, 9, 0.2).pose('think').idle(c.t).setFace('smirk').hat(); } });
  shot({ line: 'But my best friend Oscar', set: town, cam: frame(3, 8.6, { size: 'close', side: -12 }),
    act(lt, c) { const o = T.oscar.reset().place(3, 8.6, -0.15).pose('wave', remap(lt, 0.1, 0.4)).idle(c.t).setFace('smile'); o.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: 'had the same birthday,', set: town, sfx: [['pop', 'same', 0.5]], cam: frame(-3.4, 8.8, { size: 'medium', side: 6, dist: 1.25 }),
    act(lt, c) { T.nar.reset().place(-5, 8.8, 0.5).pose('point').idle(c.t).setFace('grin').hat(); T.oscar.reset().place(-1.8, 8.8, -0.5).idle(c.t).setFace('smile'); } });
  shot({ line: 'and nobody ever remembered.', set: town, cam: frame(3, 8.6, { size: 'full', side: 10, dist: 1.0 }),
    act(lt, c) { T.oscar.reset().place(3, 8.6, 0.2).idle(c.t).setFace(lt < c.w('nobody') ? 'smile' : 'sad'); walkX(T.kidB, -2, 10.8, 1, lt, c.t, 0.7, 'smile'); } });
  // plant: never blown out a candle
  shot({ line: "He'd never blown out a single candle.", set: town, cam: { pos: [3.4, 4.4, 13.5], look: [0.6, 4.2, 2.8], fov: 58, blur: 0.25 },
    act(lt, c) { T.oscar.reset().place(FINNX, 4.4, 0, 0.5).sit(0.8).pose({ aL: [40, -10], aR: [40, -10] }).idle(c.t, 0.4).setFace('sad'); } });
  shot({ line: 'Meanwhile, Bianca had so many balloons', set: town, cam: { pos: [-14, 3.4, 20], look: [-14, 11, 8], fov: 62, blur: 0.15 },
    act(lt, c) { T.bianca.reset().place(-14, 8, 0, 1.6 + fl(c.t)).pose({ aL: [10, 30], aR: [10, 30] }).setFace('smug'); } });
  shot({ line: 'she needed a seatbelt.', set: town, sfx: [['tick', 'seatbelt', 0.8]], cam: frame(-14, 8, { size: 'close', y: 1.6, side: 14 }),
    act(lt, c) { T.bianca.reset().place(-14, 8, 0.3, 1.6 + fl(c.t) * 0.4).pose({ aL: [40, -30], aR: [40, -30] }).setFace('wink'); } });
  shot({ line: 'She floated to school.', set: hall, cam: { pos: [6, 6.4, 13], look: [6, 7.6, 0], fov: 60, blur: 0.15 },
    act(lt, c) { /* Bianca is only in town and park; in the hallway we see the balloons go past */ H.bianca.reset().place(4 + lt * 2, 1, Math.PI / 2, 3.6 + fl(c.t)).pose({ aL: [10, 30], aR: [10, 30] }).setFace('grin'); } });
  shot({ line: 'She floated to lunch.', set: park, cam: { pos: [-4, 5, 15], look: [-2, 7, 2], fov: 60, blur: 0.15 },
    act(lt, c) { P.bianca.reset().place(-6 + lt * 3, 2, Math.PI / 2, 4.2 + fl(c.t)).pose({ aR: [90, -20] }).setFace('laugh'); } });
  shot({ line: 'She floated into a tree.', set: park, sfx: [['thud', 'tree', 0.8]], cam: { pos: [-14, 9, 6], look: [-22, 10, -12], fov: 60, blur: 0.12 },
    act(lt, c) { const t0 = c.w('tree'), k = remap(lt, 0, t0); P.bianca.reset().place(lerp(-15, -20.6, k), lerp(-6, -10.5, k), Math.PI * 0.8, 5.6 + fl(c.t) * (1 - remap(lt, t0, t0 + 0.2))).pose(lt < t0 ? 'idle' : { aL: [150, 30], aR: [150, 30] }).setFace(lt < t0 ? 'grin' : 'shock'); FP.puff.at(lt - t0, [-21, 9.6, -10]); } });

  // ═══════════════ INCITING ═══════════════
  shot({ line: 'Then my grandma called.', set: town, sfx: [['tick', 'called', 1], ['tick', 0.9, 1]], cam: frame(-10, 9, { size: 'close', side: -12 }),
    act(lt, c) { T.nar.reset().place(-10, 9, -0.2).pose({ aR: [150, -50] }).idle(c.t).setFace('smile').hat(); narPhone.show(); } });
  shot({ line: 'Happy birthday, sweetie.', set: town, cam: frame(-10, 9, { size: 'face', side: 8, push: 0.05 }),
    act(lt, c) { T.nar.reset().place(-10, 9, 0).pose({ aR: [150, -50] }).idle(c.t).setFace(lt < c.w('sweetie') ? 'smile' : 'cute').hat(); narPhone.show(); } });
  shot({ line: 'Pop. My first balloon.', set: town, sfx: [['pop', 0, 1.0], ['sparkle', 0]], cam: { pos: [-10, 7.4, 18.6], look: [-10, 7.6, 9], fov: 60, blur: 0.4 },
    act(lt, c) { const a = T.nar.reset().place(-10, 9, 0).idle(c.t).hat(); popB(FT, a, lt, 0, 0, 'laugh'); } });

  // ═══════════════ IDEA + FAILED TRIES ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10 }),
    act(lt, c) { N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin').bal(1, c.t).hat(); FH.bulb.at(lt - c.w('idea'), N, -1.6); } });
  shot({ line: 'If I got enough wishes,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18 }),
    act(lt, c) { N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk').bal(1, c.t).hat(); } });
  shot({ line: 'I could fly over the whole town.', set: town, sfx: [['rise', 'fly', 0.7]], cam: { pos: [-20, 26, 36], look: [-4, 14, 6], fov: 55, blur: 0.05 },
    act(lt, c) { const k = E.out(remap(lt, c.w('fly') - 0.1, c.d)); T.nar.reset().place(lerp(-12, -2, k), 9, Math.PI / 2, lerp(4, 14, k) + fl(c.t)).pose('cheer').setFace('laugh').bal(24, c.t).hat(); } });
  shot({ line: 'I wished myself happy birthday. Nothing.', set: hall, cam: frame(4, 0.6, { size: 'close', side: 10 }),
    act(lt, c) { N.reset().place(4, 0.6, 0.2).pose('open').talk(c.t, lt < c.w('nothing') ? 1 : 0).idle(c.t).setFace(lt < c.w('nothing') ? 'talk' : 'blank').bal(1, c.t); } });
  shot({ line: 'I wore a sign that said, birthday boy.', set: hall, cam: frame(-8, 0.6, { size: 'medium', side: 12, dist: 1.1 }),
    act(lt, c) { N.reset().place(-8, 0.6, 0.2).pose('hips').idle(c.t).setFace('grin').bal(1, c.t).hat(); sgn.show(); } });
  shot({ line: 'People just read it.', set: hall, cam: { ...frame(-7, 0.6, { size: 'wide', dist: 0.65 }), blur: 0.08 },
    act(lt, c) { N.reset().place(-8, 0.6, 0.1).pose('hips').idle(c.t).setFace(lt < c.w('read') ? 'grin' : 'sus').bal(1, c.t).hat(); sgn.show(); const a = walkX(H.kidB, -14, 2.6, 1, lt, c.t, 0.5, 'neutral'); a.lookAt(-8, 0.6); walkX(H.kidA, -1, 3.2, -1, lt, c.t, 0.5, 'neutral').lookAt(-8, 0.6); } });

  // ═══════════════ ACCIDENTAL SUCCESS ═══════════════
  shot({ line: 'Then I held the door for the whole class,', set: hall, cam: frame(2.7, -1.6, { size: 'full', side: 16, dist: 1.3 }),
    act(lt, c) { N.reset().place(0.4, -3.4, 0.6).pose({ aR: [70, 40] }).idle(c.t).setFace('smile').bal(1, c.t); walkX(H.kidA, 8, -1.8, -1, lt, c.t, 0.7, 'smile'); walkX(H.kidB, 11, -1.0, -1, lt, c.t, 0.7, 'smile'); walkX(H.oscar, 14, -1.6, -1, lt, c.t, 0.7, 'smile'); } });
  shot({ line: 'and they all sang to me.', set: hall, sfx: [['ding', 'sang', 0.4]], cam: frame(1, -0.4, { size: 'medium', side: -8, dist: 1.4 }),
    act(lt, c) { N.reset().place(1, -2, 0).idle(c.t).setFace(lt < c.w('sang') ? 'smile' : 'wow').bal(1, c.t); [H.kidA, H.kidB, H.oscar].forEach((a, i) => a.reset().place(-2.6 + i * 2.6, 1.8 + (i % 2) * 0.6, Math.PI).pose('cheer').talk(c.t + i).idle(c.t).setFace('talk')); } });
  shot({ line: 'Pop, pop, pop. Eight balloons.', set: hall, sfx: [['pop', 'pop', 0.9], ['pop', ['pop', 1], 0.9], ['pop', ['pop', 2], 0.9], ['sparkle', 'pop'], ['sparkle', 'eight']], cam: { pos: [1, 7.2, 12.4], look: [1, 7.6, -2], fov: 60, blur: 0.35 },
    act(lt, c) { const a = N.reset().place(1, -2, 0).idle(c.t); const ts = [c.w('pop'), c.w('pop', 1), c.w('pop', 2), c.w('eight')]; let n = 1; ts.forEach(t => { if (lt >= t) n++; }); const cnt = Math.min(9, n === 1 ? 1 : n === 5 ? 9 : n); const last = ts[Math.max(0, n - 2)]; popB(FH, a, lt, last, cnt - 1, 'laugh', n % 3); a.bal(cnt, c.t, cnt - 1, lt - last); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'The bus driver honked it.', set: town, sfx: [['boing', 'honked', 0.6], ['pop', 'it', 0.6]], cam: { pos: [-8, 5.4, 26], look: [-2, 4.6, 14], fov: 58, blur: 0.1 },
    act(lt, c) { theBus.show().position.set(-2 + lt * 0.6, 0, 18); T.driver.reset().place(4.6 + lt * 0.6, 18, Math.PI / 2, 0.6).sit(2.0).idle(c.t).setFace('grin'); T.nar.reset().place(-6, 11, 0.4).pose('cheer').idle(c.t).setFace('laugh').bal(lt < c.w('it') ? 9 : 10, c.t, 9, lt - c.w('it')); } });
  shot({ line: 'The lunch lady sang it.', set: caf, sfx: [['pop', 'it', 0.6]], cam: frame(-7.5, 0, { size: 'medium', side: 10, dist: 1.3, h: 1.05 }),
    act(lt, c) { C.lady.reset().place(-9.2, -0.4, 0.5).pose('open').talk(c.t).idle(c.t).setFace('talk'); C.nar.reset().place(-6, 0.4, -0.6).idle(c.t).setFace('laugh').bal(lt < c.w('it') ? 10 : 11, c.t, 10, lt - c.w('it')); } });
  shot({ line: 'Even my dog barked it.', set: town, sfx: [['pop', 'barked', 0.6], ['pop', 'it', 0.6]], cam: frame(-8.6, 9.6, { size: 'full', side: 10, dist: 1.0 }),
    act(lt, c) { rex.show().position.set(-7.8, 0, 11.6); rex.rotation.y = Math.PI * 0.85; rex.userData.tail.rotation.z = 0.6 + Math.sin(c.t * 20) * 0.4; rex.position.y = Math.abs(Math.sin(c.t * 8)) * 0.2; T.nar.reset().place(-10, 9.4, 0.4).pose('cheer').idle(c.t).setFace('laugh').bal(lt < c.w('it') ? 11 : 12, c.t, 11, lt - c.w('it')); } });
  shot({ line: 'By sunset, I was floating over the street.', set: town, sfx: [['rise', 'floating', 0.6]], cam: { pos: [-6, 5, 26], look: [-6, 9, 9], fov: 60, blur: 0.08 },
    act(lt, c) { const k = E.out(remap(lt, c.w('floating') - 0.2, c.w('floating') + 0.8)); T.nar.reset().place(-6, 10, 0, lerp(0, 6, k) + fl(c.t) * k).pose('cheer').setFace('laugh').bal(20, c.t); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'Then I looked down and saw Oscar,', set: town, cam: frame(-6, 10, { size: 'close', y: 6, side: -14 }),
    act(lt, c) { const a = T.nar.reset().place(-6, 10, 0, 6 + fl(c.t)).idle(c.t).bal(20, c.t); const k = remap(lt, c.w('looked'), c.w('looked') + 0.25); a.head.rotation.x += 0.55 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'on his steps. Zero balloons.', set: town, sfx: [['sad', 'zero', 0.8]], cam: { pos: [-3, 14, 15], look: [FINNX, 2.6, 4.4], fov: 52, blur: 0.04, push: 0.02 },
    act(lt, c) { T.oscar.reset().place(FINNX, 4.4, 0, 0.5).sit(0.8).pose({ aL: [40, -10], aR: [40, -10], head: [16, 0, 0] }).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: 'Same birthday. Nobody remembered.', set: town, cam: { pos: [2.6, 4.6, 12.8], look: [0.2, 4.0, 2.8], fov: 58, blur: 0.3, push: 0.02 },
    act(lt, c) { T.oscar.reset().place(FINNX, 4.4, 0, 0.5).sit(0.8).pose({ aL: [40, -10], aR: [40, -10], head: [16, 0, 0] }).idle(c.t, 0.3).setFace('cry'); } });
  shot({ line: "I'd spent all day collecting wishes", set: town, cam: frame(-6, 10, { size: 'close', y: 6, side: 16 }),
    act(lt, c) { T.nar.reset().place(-6, 10, -0.4, 6 + fl(c.t)).idle(c.t, 0.5).setFace(lt < c.w('wishes') ? 'worried' : 'sad').bal(20, c.t); } });
  shot({ line: 'while my best friend got none.', set: town, cam: frame(-6, 10, { size: 'face', y: 6, side: -6, push: 0.05 }),
    act(lt, c) { T.nar.reset().place(-6, 10, -0.1, 6 + fl(c.t)).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry').bal(20, c.t); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I floated down', set: town, sfx: [['fall', 'down', 0.6]], cam: { pos: [4.4, 6, 16], look: [1, 5.6, 5], fov: 58, blur: 0.15 },
    act(lt, c) { const k = E.inOut(remap(lt, 0, c.d)); T.nar.reset().place(lerp(-4, 2.2, k), lerp(9, 5.6, k), -0.6, lerp(7, 0, k)).pose('cheer').setFace('smile').bal(20, c.t); T.oscar.reset().place(FINNX, 4.4, 0.3, 0.5).sit(0.8).idle(c.t, 0.3).setFace(lt < c.d * 0.6 ? 'sad' : 'wow'); } });
  shot({ line: 'and gave him all my balloons.', set: town, sfx: [['pop', 'balloons', 0.6]], cam: { pos: [3.4, 6.6, 15], look: [1, 8, 4.6], fov: 60, blur: 0.15 },
    act(lt, c) { const t0 = c.w('gave'), k = remap(lt, t0, c.w('balloons') + 0.2); T.nar.reset().place(2.2, 5.6, -0.6).pose({ aR: [150, -20] }).idle(c.t).setFace('grin').bal(Math.round(lerp(20, 0, k)), c.t); T.oscar.reset().place(FINNX, 4.4, 0.3, 0.5).sit(0.8).idle(c.t).setFace('wow').bal(Math.round(lerp(0, 20, k)), c.t); } });
  shot({ line: 'Happy birthday, Oscar.', set: town, cam: frame(2.2, 5.6, { size: 'close', side: 18 }),
    act(lt, c) { T.nar.reset().place(2.2, 5.6, -0.6).pose('open').talk(c.t).idle(c.t).setFace(lt < c.w('oscar') ? 'say' : 'grin').hat(); } });
  shot({ line: "Then I yelled, it's his birthday too!", set: town, cam: { pos: [-4, 6.4, 22], look: [-1, 5, 8], fov: 58, blur: 0.1 },
    act(lt, c) { T.nar.reset().place(-2, 9.2, 0).pose('cheer').talk(c.t, 2).idle(c.t).setFace('talk'); T.oscar.reset().place(FINNX + 1.6, 5.4, 0, 2.6 + fl(c.t)).idle(c.t).setFace('wow').bal(20, c.t).hat(); } });
  shot({ line: 'Pop, pop, pop.', set: town, sfx: [['pop', 'pop', 0.9], ['pop', ['pop', 1], 0.9], ['pop', ['pop', 2], 0.9], ['sparkle', 'pop'], ['rise', ['pop', 2], 0.6]], cam: { pos: [1.6, 6.6, 18], look: [1.6, 10, 5.4], fov: 60, blur: 0.15, push: 0, to: { look: [1.6, 13, 5.4] }, ease: 'out' },
    act(lt, c) { const ts = [c.w('pop'), c.w('pop', 1), c.w('pop', 2)]; let n = 0; ts.forEach(t => { if (lt >= t) n++; }); const o = T.oscar.reset().place(FINNX + 1.6, 5.4, 0, 2.6 + n * 1.6 + fl(c.t)).pose('cheer').idle(c.t).hat(); const last = ts[Math.max(0, n - 1)]; if (n > 0) popB(FT, o, lt, last, 19 + n, 'laugh', n % 3); else o.bal(20, c.t).setFace('wow'); o.bal(20 + n, c.t, 19 + n, lt - last); [T.kidA, T.kidB, T.driver].forEach((a, i) => { if (lt < ts[i]) return; a.reset().place(-5 + i * 3.2, 9.6, 0).pose('cheer').talk(c.t + i).idle(c.t).setFace('talk').hat(); }); } });
  // payoff of the plant
  shot({ line: 'That night, Oscar blew out his first candles.', set: town, sfx: [['whoosh', 'blew', 0.4], ['ding', 'candles', 0.6]], cam: { pos: [FINNX + 1, 6.4, 13], look: [FINNX, 4.6, 5.4], fov: 56, blur: 0.25 },
    act(lt, c) { const t0 = c.w('blew'); cake.show().position.set(FINNX, 2.4, 7.4); cake.children.slice(2).forEach(ch => { ch.children[1].visible = lt < t0 + 0.2; }); const o = T.oscar.reset().place(FINNX, 5.4, 0).pose({ lean: [14, 0] }).idle(c.t).hat().bal(23, c.t); o.setFace(lt < t0 ? 'grin' : lt < t0 + 0.3 ? 'wow' : 'laugh'); [T.nar, T.kidA, T.kidB].forEach((a, i) => a.reset().place([-3, 3, -1.6][i], [6.4, 6.4, 4.2][i], [0.6, -0.6, 0.4][i]).pose(lt < t0 + 0.3 ? 'idle' : 'cheer').idle(c.t).setFace('laugh').hat()); } });
  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he looked at me and said,', set: town, cam: frame(FINNX, 5.4, { size: 'close', side: -14 }),
    act(lt, c) { T.oscar.reset().place(FINNX, 5.4, 0.4).idle(c.t).setFace('smirk').hat().bal(23, c.t); } });
  shot({ line: 'happy birthday. Pop.', set: town, sfx: [['pop', 'pop', 1.0], ['sparkle', 'pop']], cam: { pos: [-3, 6.8, 14.6], look: [-3, 7.2, 6.4], fov: 60, blur: 0.4 },
    act(lt, c) { const a = T.nar.reset().place(-3, 6.4, 0).idle(c.t).hat(); popB(FT, a, lt, c.w('pop'), 0, 'laugh'); } });
  shot({ line: 'Best birthday ever.', set: town, cam: frame(-1.5, 6, { size: 'medium', side: -10, low: 0.3, dist: 1.1 }),
    act(lt, c) { T.nar.reset().place(-3, 6.4, -0.3).pose(lt < c.w('ever') ? 'open' : 'cheer').idle(c.t).setFace(lt < c.w('birthday') ? 'grin' : 'laugh').hat().bal(1, c.t); T.oscar.reset().place(0.2, 5.6, 0.3).pose('cheer').idle(c.t).setFace('laugh').hat().bal(23, c.t); } });
});
