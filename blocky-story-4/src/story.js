// story.js: "In this town, every time you get angry, your head gets bigger."  Letting it go shrinks it back.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 41, skin: 'fair', hair: 'swoop', hairColor: '#c98a3a', top: 'tee', topColor: '#e8413c', bottom: 'shorts', bottomColor: '#2b3a6b' },
  max: { seed: 42, skin: 'tan', hair: 'buzz', hairColor: '#2b1b14', top: 'jersey', topColor: '#2e9e59', number: '9', bottom: 'joggers', bottomColor: '#15151a' },
  ivy: { seed: 43, skin: 'deep', hair: 'long', hairColor: '#17110f', top: 'cardigan', topColor: '#ffd23f', inner: '#f4f4f4', sleeves: 'long', bottom: 'skirt', bottomColor: '#9fcfc1' },
  grump: { seed: 44, skin: 'light', hair: 'bald', top: 'suit', topColor: '#6a6e76', tie: '#e8413c', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', height: 1.12 },
  kidA: { seed: 45, skin: 'brown', hair: 'messy', hairColor: '#1b1210', top: 'hoodie', topColor: '#ff9f2e', bottom: 'jeans', bottomColor: '#4f79a7' },
  kidB: { seed: 46, skin: 'light', hair: 'bob', hairColor: '#e8b04a', top: 'stripes', topColor: '#f4f4f4', stripe: '#7b3fc4', bottom: 'skirt', bottomColor: '#2f95e6' },
};
const ALL = [];
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); ALL.push(o[k]); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
PRE.push(() => { for (const a of ALL) a.head.scale.setScalar(1); });
const HS = { max: 3.2, ivy: 0.45, grump: 2.8 }; const NA = 2.6;              // resting head sizes
const hd = (av, s) => { av.head.scale.setScalar(s); return av; };
// Ivy's head is tiny: aim at her face, not her collar
const ivyCam = (x, z, side = 0, d = 6, o = {}) => { const a = side * Math.PI / 180; return { pos: [x + Math.sin(a) * d, 3.7, z + Math.cos(a) * d], look: [x, 3.6, z], fov: 60, blur: o.blur ?? 0.5, push: o.push }; };
const bob = (t, s = 0) => Math.sin(t * 2.2 + s) * 0.04;
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['HATS', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'STAY\nCOOL!', bannerBg: '#7fd0ff', locker: '#2f6fd8', door: 'ROOM 6', poster: 'DEEP\nBREATHS', posterBg: '#2e9e59' });
  const cls = SETS.classroom({ board: ['MATH TEST', 'grade: D'] });
  const caf = SETS.cafeteria({ menu: 'TODAY: PUDDING!', rule: 'NO\nYELLING' });
  const S = cast(street, ['grump', 'kidA', 'kidB', 'ivy']);
  const H = cast(hall, ['nar', 'max', 'ivy', 'kidA', 'kidB']);
  const K = cast(cls, ['nar']);
  const C = cast(caf, ['nar', 'ivy', 'kidA', 'kidB']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FC = fx(caf);
  // RULE FIRES: head goes from s0 to s1 (grow = anger, shrink = letting go). scream face, arms flare, sparkles round the head.
  const headBeat = (F, av, lt, t0, s0, s1, rest, spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.45)), s = Math.max(0.2, lerp(s0, s1, k)); hd(av, s);
    if (dt >= 0 && dt < 0.47) { av.setFace(s1 > s0 ? 'angry' : 'scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) { const p = av.root.position; F.sp[spi].at(dt, [p.x, p.y + 2.2, p.z], 0.9); }
    return s;
  };
  // props
  const hat = prop(grp((() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.69, 0.42, 28), mat('#e8413c')); c.position.y = 1.08; return c; })(), at(box(1.0, 0.07, 0.6, '#e8413c'), 0, 0.87, 0.82)));
  H.max.head.add(hat);
  const hatHand = prop(grp((() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.67, 0.69, 0.42, 28), mat('#e8413c')); return c; })(), at(box(1.0, 0.07, 0.6, '#e8413c'), 0, -0.2, 0.3)));
  H.max.handR.add(hatHand); hatHand.position.set(0, -0.3, 0.3);
  const pudding = prop(grp((() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.32, 0.5, 18), mat('#f4f4f4')); c.position.y = 0.25; return c; })(), (() => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 18), mat('#7a4a2e')); t.position.y = 0.48; return t; })()));
  caf.group.add(pudding);
  const milk = prop(grp(box(0.6, 1.0, 0.6, '#f4f4f4'), at(box(0.62, 0.3, 0.62, '#2f95e6'), 0, 0.2, 0))); caf.group.add(milk);
  const milkSplash = prop(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat('#ffffff'))); caf.group.add(milkSplash);
  const juice = prop(grp(box(0.5, 0.8, 0.5, '#ff9f2e'))); hall.group.add(juice);
  const N = H.nar, M = H.max;

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.6, 18], look: [0, 4.8, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) {
      hd(S.grump.reset().place(-4.4 + lt * 1.6, 3.2, Math.PI / 2).walk(c.t, 0.4).setFace('angry'), HS.grump);
      hd(S.ivy.reset().place(4, 4.4, -0.4).pose('wave').idle(c.t).setFace('grin'), HS.ivy);
      S.kidA.reset().place(1, 5.6, 0.2).idle(c.t).setFace('smile');
    } });
  shot({ line: 'every time you get angry,', set: street, cam: frame(1, 5, { size: 'close', side: 12 }),
    act(lt, c) { S.kidA.reset().place(1, 5, 0.2).pose(lt < c.w('angry') ? 'idle' : { aL: [40, -20], aR: [40, -20] }).idle(c.t).setFace(lt < c.w('angry') ? 'neutral' : 'mad'); } });
  shot({ line: 'your head gets bigger.', set: street, sfx: [['sparkle', 'bigger'], ['rise', 'bigger']], cam: frame(1, 5, { size: 'full', side: -8, dist: 1.0, h: 1.35 }),
    act(lt, c) { const a = S.kidA.reset().place(1, 5, -0.1).pose({ aL: [40, -20], aR: [40, -20] }).idle(c.t).setFace('mad'); headBeat(FS, a, lt, c.w('bigger'), 1, 2.4, 'angry'); } });
  shot({ line: "That's why grumpy people", set: street, cam: { pos: [-15.5, 2.0, 9], look: [-16.5, 7.2, -1.5], fov: 62, blur: 0.2 },
    act(lt, c) { hd(S.grump.reset().place(-16.5, 0.4, 0.1).pose('hips').idle(c.t).setFace('angry'), HS.grump); } });
  shot({ line: "can't fit through doors,", set: street, sfx: [['thud', 'doors', 0.8]], cam: { pos: [-11.6, 5.0, 8.4], look: [-16.5, 4.6, -1.6], fov: 58, blur: 0.15 },
    act(lt, c) { const t = c.w('doors'), k = (lt * 1.8) % 1; const g = S.grump.reset().place(-16.5, -0.4 + Math.sin(k * Math.PI) * 0.15, Math.PI).pose({ aL: [100, 20], aR: [100, 20], lean: [14, 0] }).walk(c.t, 0.3).setFace('angry'); hd(g, HS.grump + 0.4); } });
  shot({ line: 'and calm people', set: street, cam: ivyCam(4, 3, -10, 8, { blur: 0.3 }),
    act(lt, c) { hd(S.ivy.reset().place(4, 3, -0.1).pose('open').idle(c.t).setFace('smile'), HS.ivy); } });
  shot({ line: 'have heads like grapes.', set: street, sfx: [['pop', 'grapes', 0.5]], cam: ivyCam(4, 3, 12, 4.4, { push: 0.05 }),
    act(lt, c) { hd(S.ivy.reset().place(4, 3, 0.2).idle(c.t).setFace(lt < c.w('grapes') ? 'smile' : 'grin'), HS.ivy); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'My head was pretty normal.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); walkX(H.kidB, -7, -1.6, 1, lt, c.t, 0.7, 'smile'); } });
  shot({ line: 'But my best friend Max', set: hall, cam: frame(-7, 0.6, { size: 'close', side: -12, h: 1.75 }),
    act(lt, c) { hd(M.reset().place(-7, 0.6, -0.15).idle(c.t, 0.5).setFace('mad'), HS.max); } });
  shot({ line: 'had the biggest head in school.', set: hall, sfx: [['thud', 'school', 0.6]], cam: { ...frame(-7, 0.6, { size: 'full', side: 14, h: 1.5 }), blur: 0.15 },
    act(lt, c) { hd(M.reset().place(-7, 0.6, 0.2).pose('hips').idle(c.t).setFace('angry'), HS.max); walkX(H.kidA, -13, 3, 1, lt, c.t, 0.6, 'shock'); } });
  // plant: the hat that doesn't fit
  shot({ line: "He hadn't worn a hat in three years.", set: hall, cam: frame(-3, 0.4, { size: 'medium', side: 10, h: 1.75 }),
    act(lt, c) {
      const a = hd(M.reset().place(-3, 0.4, 0.15).idle(c.t, 0.4).setFace('mad'), HS.max);
      if (lt < c.w('hat')) { a.pose({ aR: [70, 0] }); hatHand.show(); }
      else { a.pose({ aR: [150, 10], aL: [150, 10] }); hat.show(); hat.scale.setScalar(1 / HS.max); hat.position.set(0, 0.25, 0); a.setFace(lt < c.w('three') ? 'mad' : 'sad'); }
    } });
  shot({ line: 'Meanwhile, Ivy never got mad.', set: hall, cam: { ...frame(8, 1, { size: 'full', side: -8 }), blur: 0.2 },
    act(lt, c) { hd(H.ivy.reset().place(8, 1, 0).pose('open').idle(c.t).setFace('grin'), HS.ivy); } });
  shot({ line: 'Stepped on her foot? Smile.', set: hall, sfx: [['thud', 'stepped', 0.6]], cam: ivyCam(8, 1, 14, 7),
    act(lt, c) { hd(H.ivy.reset().place(8, 1, 0.2).idle(c.t).setFace(lt < c.w('smile') ? 'neutral' : 'grin'), HS.ivy); walkX(H.kidA, 11.6, 1.6, -1, lt, c.t, 0.6, 'neutral'); } });
  shot({ line: 'Juice on her sweater? Smile.', set: hall, cam: ivyCam(8, 1, -14, 5),
    act(lt, c) { hd(H.ivy.reset().place(8, 1, -0.2).idle(c.t).setFace(lt < c.w('smile') ? 'neutral' : 'grin'), HS.ivy); const k = remap(lt, 0, 0.3); juice.show().position.set(8.7 + k * 0.3, 3.4 - k * 0.4, 1.8); juice.rotation.z = -k * 2.2; FH.puff.at(lt - 0.25, [8.3, 2.6, 1.6]); } });
  shot({ line: 'Took her seat? Still smiling.', set: hall, cam: ivyCam(8, 1, 6, 3.8, { push: 0.06 }),
    act(lt, c) { hd(H.ivy.reset().place(8, 1, 0).idle(c.t, 0.4).setFace('grin'), HS.ivy); } });

  // ═══════════════ INCITING (cafeteria) ═══════════════
  shot({ line: 'Then someone ate my pudding.', set: caf, sfx: [['pop', 'pudding', 0.6]], cam: frame(-7.5, 0.4, { size: 'medium', side: 10, dist: 1.15 }),
    act(lt, c) { C.nar.reset().place(-6.4, 0.4, -0.3).pose(lt < c.w('ate') ? 'idle' : { aL: [40, 40], aR: [40, 40] }).idle(c.t).setFace(lt < c.w('pudding') ? 'smile' : 'shock'); C.kidB.reset().place(-9.4, -0.6, 0.6).pose({ aR: [110, -20] }).idle(c.t).setFace('smirk'); pudding.show().position.set(-8.4, 3.6, 0.6); } });
  shot({ line: 'My head blew up like a balloon.', set: caf, sfx: [['sparkle', 'blew'], ['rise', 'blew'], ['boing', 'balloon', 0.6]], cam: frame(-6.4, 0.4, { size: 'full', side: -10, dist: 1.1, h: 1.45 }),
    act(lt, c) { const a = C.nar.reset().place(-6.4, 0.4, 0).pose({ aL: [40, -20], aR: [40, -20] }).idle(c.t).setFace('mad'); headBeat(FC, a, lt, c.w('blew'), 1, NA, 'angry'); } });
  shot({ line: 'Ivy gasped.', set: caf, cam: ivyCam(-9.5, -0.6, 16, 4.6, { push: 0.05 }),
    act(lt, c) { hd(C.ivy.reset().place(-9.5, -0.6, 0.4).pose({ aL: [130, -20], aR: [130, -20] }, remap(lt, 0, 0.15)).setFace('shock'), HS.ivy); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10, h: 1.55 }),
    act(lt, c) { hd(N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'mad' : 'grin'), NA); FH.bulb.at(lt - c.w('idea'), N, 2.5); } });
  shot({ line: 'If I stayed calm all day,', set: hall, cam: frame(-2, 1, { size: 'close', side: 18, h: 1.7 }),
    act(lt, c) { hd(N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk'), NA); } });
  shot({ line: "I'd have a tiny head like Ivy.", set: hall, sfx: [['pop', 'tiny', 0.6]], cam: frame(0, 0.4, { size: 'full', dist: 1.0 }),
    act(lt, c) { const k = E.back(remap(lt, c.w('tiny') - 0.05, c.w('tiny') + 0.3)); hd(N.reset().place(-2, 1, 0).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'), lerp(NA, 0.55, k)); hd(H.ivy.reset().place(2.2, -0.6, -0.3).pose('wave').idle(c.t).setFace('grin'), HS.ivy); } });
  shot({ line: 'I counted to ten. Nothing.', set: hall, cam: frame(-10, -3.2, { size: 'close', side: 12, h: 1.7, dist: 1.15 }),
    act(lt, c) { const a = hd(N.reset().place(-10, -3.2, 0.1).idle(c.t).setFace(lt < c.w('nothing') ? 'sleepy' : 'mad'), NA); a.pose({ aR: [60, 0] }); a.armR.rotation.z += Math.sin(c.t * 8) * 0.1; } });
  shot({ line: 'I tried yoga.', set: hall, cam: frame(4, 0.4, { size: 'full', side: 8, h: 1.45 }),
    act(lt, c) { hd(N.reset().place(4, 0.4, 0).pose({ aL: [175, 8], aR: [175, 8], lR: 70 }).idle(c.t, 0.3).setFace('sleepy'), NA); N.hip.rotation.z = Math.sin(c.t * 3) * 0.06; } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(4, 0.4, { size: 'close', side: -10, push: 0.06, h: 1.7 }),
    act(lt, c) { hd(N.reset().place(4, 0.4, 0).idle(c.t, 0.3).setFace('sus'), NA); } });

  // ═══════════════ ACCIDENTAL SUCCESS (cafeteria) ═══════════════
  shot({ line: 'Then a kid spilled milk on me,', set: caf, sfx: [['pop', 'milk', 0.7]], cam: frame(8.2, 0.4, { size: 'full', side: -8, dist: 1.1, h: 1.45 }),
    act(lt, c) {
      const t0 = c.w('spilled'), k = remap(lt, t0, t0 + 0.35);
      hd(C.nar.reset().place(7.2, 0.4, 0.4).idle(c.t).setFace(lt < t0 + 0.2 ? 'mad' : 'shock'), NA);
      C.kidA.reset().place(9.8, 0.8, -1.2).pose({ aR: [90 + k * 40, -10] }).idle(c.t).setFace(lt < t0 ? 'smile' : 'worried');
      milk.show().position.set(lerp(9.2, 7.8, k), lerp(3.4, 6.4, Math.sin(k * Math.PI * 0.8)), 1.0); milk.rotation.z = k * 2.4;
      if (k > 0.6) { const m = remap(lt, t0 + 0.2, t0 + 0.5); milkSplash.show().position.set(7.2, 4 + 1.2 * NA, 0.4); milkSplash.scale.set(1.4 * m, 0.5 + m * 0.5, 1.2 * m); }
    } });
  shot({ line: 'and I just laughed.', set: caf, cam: frame(7.2, 0.4, { size: 'close', side: 12, h: 1.6 }),
    act(lt, c) { const a = hd(C.nar.reset().place(7.2, 0.4, 0.2).idle(c.t), NA); a.setFace(lt < c.w('laughed') ? 'shock' : 'laugh'); if (lt > c.w('laughed')) a.hip.position.y += Math.abs(Math.sin(c.t * 15)) * 0.08; } });
  shot({ line: 'My head shrank right back.', set: caf, sfx: [['sparkle', 'shrank'], ['fall', 'shrank', 0.6]], cam: frame(7.2, 0.4, { size: 'full', side: -6, dist: 0.95, h: 1.35 }),
    act(lt, c) { const a = C.nar.reset().place(7.2, 0.4, 0).idle(c.t); headBeat(FC, a, lt, c.w('shrank'), NA, 1.0, 'laugh'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I let everything go.', set: hall, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { hd(N.reset().place(0, 1.4, 0.1).pose('open').idle(c.t).setFace('grin'), 0.9); } });
  shot({ line: 'Someone cut in line? Fine.', set: caf, cam: frame(-7.5, -1, { size: 'medium', side: 14, dist: 1.25 }),
    act(lt, c) { hd(C.nar.reset().place(-5.9, -1, -0.3).idle(c.t).setFace(lt < c.w('fine') ? 'neutral' : 'grin'), 0.85); C.kidB.reset().place(-8.3 + Math.min(lt, 0.5) * 2, -0.2, Math.PI / 2).walk(c.t, lt < 0.5 ? 0.8 : 0).setFace('smirk'); } });
  shot({ line: 'Bad grade? Fine.', set: cls, cam: frame(-2, 2, { size: 'close', side: -12 }),
    act(lt, c) { cls.desks.visible = false; hd(K.nar.reset().place(-2, 2, -0.2).pose({ aR: [70, 10] }).idle(c.t).setFace(lt < c.w('fine') ? 'worried' : 'grin'), 0.8); } });
  shot({ line: 'By the end of the day, my head was tiny.', set: hall, sfx: [['pop', 'tiny', 0.6]], cam: { ...frame(2, 0, { size: 'wide', dist: 0.62 }), blur: 0.08 },
    act(lt, c) { const s = lerp(0.8, 0.55, E.back(remap(lt, c.w('tiny'), c.w('tiny') + 0.25))); hd(N.reset().place(0, 0.6, 0.2).pose('cheer').idle(c.t).setFace('laugh'), s); hd(H.ivy.reset().place(4, -0.4, -0.3).pose('cheer').idle(c.t).setFace('laugh'), HS.ivy); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I saw Max,', set: hall, cam: frame(-2, 0.6, { size: 'close', side: -14, h: 0.9 }),
    act(lt, c) { const a = hd(N.reset().place(-2, 0.6, -0.2).idle(c.t), 0.55); const k = remap(lt, c.w('saw'), c.w('saw') + 0.2); a.head.rotation.y += 0.7 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'stuck in a door, alone.', set: hall, sfx: [['sad', 'alone', 0.8]], cam: { pos: [6.0, 5.0, 8.4], look: [2.7, 4.6, -4.4], fov: 58, blur: 0.05, push: 0.02 },
    act(lt, c) { const k = (lt * 1.2) % 1; const a = hd(M.reset().place(2.7, -3.6, Math.PI + 0.25).pose({ aL: [100, 30], aR: [100, 30], lean: [10, 0] }).walk(c.t, 0.25).setFace('mad'), HS.max + 0.6); a.hip.position.y += Math.sin(k * Math.PI) * 0.06; } });
  shot({ line: "I'd spent all day staying calm", set: hall, cam: frame(-2, 0.6, { size: 'close', side: 16, h: 0.9 }),
    act(lt, c) { hd(N.reset().place(-2, 0.6, -0.3).idle(c.t, 0.5).setFace(lt < c.w('calm') ? 'worried' : 'sad'), 0.55); } });
  shot({ line: 'while my best friend was stuck.', set: hall, cam: frame(-2, 0.6, { size: 'face', side: -6, push: 0.05, h: 0.85 }),
    act(lt, c) { hd(N.reset().place(-2, 0.6, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'), 0.55); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: "So I pulled him free. What's wrong?", set: hall, sfx: [['pop', 'free', 0.8]], cam: frame(2.6, -1.2, { size: 'full', side: 18, dist: 1.25, h: 1.6 }),
    act(lt, c) { const f = c.w('free'), k = E.out(remap(lt, f - 0.1, f + 0.2)); hd(M.reset().place(2.7, lerp(-3.6, -1.6, k), lerp(Math.PI + 0.25, 0.3, k)).pose(k < 1 ? { aL: [100, 30], aR: [100, 30] } : 'idle').idle(c.t).setFace(k < 1 ? 'mad' : 'sad'), HS.max + 0.6 * (1 - k)); hd(N.reset().place(0, lerp(-2.4, -0.8, k), lerp(Math.PI * 0.8, 0.6, k)).pose(k < 1 ? { aL: [90, -10], aR: [90, -10], lean: [-10, 0] } : 'open').idle(c.t).setFace(lt < c.w("what's") ? 'worried' : 'say').talk(c.t, lt > c.w("what's") ? 1 : 0), 0.55); } });
  shot({ line: 'Everything makes me mad.', set: hall, sfx: [['boing', 'mad', 0.5]], cam: frame(2.7, -1.6, { size: 'close', side: -12, h: 1.8 }),
    act(lt, c) { const a = M.reset().place(2.7, -1.6, 0.3).pose({ aL: [40, -20], aR: [40, -20] }).talk(c.t).idle(c.t).setFace('angry'); hd(a, HS.max + E.back(remap(lt, c.w('mad'), c.w('mad') + 0.25)) * 0.2); } });
  shot({ line: 'Just forgive one thing.', set: hall, cam: frame(0, -0.8, { size: 'close', side: 16, h: 0.9 }),
    act(lt, c) { hd(N.reset().place(0, -0.8, -0.5).pose({ aR: [60, 20] }).talk(c.t).idle(c.t).setFace('say'), 0.55); } });
  shot({ line: 'He thought really hard.', set: hall, cam: frame(2.7, -1.6, { size: 'close', side: -6, push: 0.06, h: 1.95 }),
    act(lt, c) { hd(M.reset().place(2.7, -1.6, 0.1).pose('think').idle(c.t, 0.3).setFace(lt < c.w('hard') ? 'sus' : 'serious'), HS.max + 0.2); } });
  shot({ line: 'I forgive the door.', set: hall, sfx: [['sparkle', 'door'], ['fall', 'door', 0.6]], cam: frame(2.7, -1.6, { size: 'full', side: 8, dist: 1.0, h: 1.6 }),
    act(lt, c) { const a = M.reset().place(2.7, -1.6, 0).pose('open').talk(c.t, lt < c.w('door') ? 1 : 0).idle(c.t).setFace('say'); headBeat(FH, a, lt, c.w('door'), HS.max + 0.2, 2.0, 'wow', 0); } });
  shot({ line: 'And my little brother.', set: hall, sfx: [['sparkle', 'brother'], ['pop', 'brother', 0.6]], cam: frame(2.7, -1.6, { size: 'medium', side: -8, dist: 1.05, h: 1.3 }),
    act(lt, c) { const a = M.reset().place(2.7, -1.6, 0).pose('open').talk(c.t, lt < c.w('brother') ? 1 : 0).idle(c.t).setFace('say'); headBeat(FH, a, lt, c.w('brother'), 2.0, 1.0, 'laugh', 1); } });
  // payoff of the plant
  shot({ line: 'For the first time in three years, Max wore a hat.', set: hall, sfx: [['ding', 'hat', 0.6]], cam: frame(2.7, -1.6, { size: 'medium', side: 10, dist: 1.05 }),
    act(lt, c) { const t0 = c.w('wore'), a = M.reset().place(2.7, -1.6, 0.1).idle(c.t); if (lt < t0) { a.pose({ aR: [70, 0] }).setFace('grin'); hatHand.show(); } else { a.pose({ aL: [150, 30], aR: [150, 30] }, remap(lt, c.w('hat'), c.w('hat') + 0.2)).setFace(lt < c.w('hat') ? 'grin' : 'laugh'); hat.show(); hat.scale.setScalar(1); hat.position.set(0, 0, 0); } } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Also, I ate your pudding.', set: hall, sfx: [['pop', 'pudding', 0.5]], cam: frame(2.7, -1.6, { size: 'close', side: -14 }),
    act(lt, c) { const a = M.reset().place(2.7, -1.6, 0.3).talk(c.t).idle(c.t).setFace(lt < c.w('pudding') + 0.2 ? 'say' : 'smirk'); hat.show(); hat.scale.setScalar(1); hat.position.set(0, 0, 0); } });
  shot({ line: 'My head started to grow.', set: hall, sfx: [['rise', 'grow', 0.6]], cam: frame(0, -0.8, { size: 'face', side: 8, push: 0.05, h: 1.05 }),
    act(lt, c) { hd(N.reset().place(0, -0.8, 0).idle(c.t, 0.2).setFace('sus'), lerp(0.55, 1.35, E.out(remap(lt, c.w('grow') - 0.1, c.d)))); } });
  shot({ line: 'I forgave him. Mostly.', set: hall, sfx: [['sparkle', 'forgave', 0.6]], cam: frame(0, -0.8, { size: 'close', side: -16, low: 0.3, h: 1.05 }),
    act(lt, c) { const a = N.reset().place(0, -0.8, -0.3).pose('open').idle(c.t); headBeat(FH, a, lt, c.w('forgave'), 1.35, 0.8, 'laugh', 0); if (lt > c.w('mostly')) a.setFace('smirk'); hd(M.reset().place(3.2, -2.2, -0.4).idle(c.t).setFace('laugh'), 1); hat.show(); hat.scale.setScalar(1); hat.position.set(0, 0, 0); } });
});
