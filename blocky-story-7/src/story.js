// story.js: "In this town, every secret you keep makes you see-through."  Telling it makes you solid again.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, sign, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 71, skin: 'fair', hair: 'short', hairColor: '#9a6a3a', top: 'hoodie', topColor: '#2e9e59', bottom: 'jeans', bottomColor: '#4f79a7' },
  jonah: { seed: 72, skin: 'brown', hair: 'messy', hairColor: '#1b1210', top: 'zip', topColor: '#ff9f2e', inner: '#f4f4f4', sleeves: 'long', bottom: 'joggers', bottomColor: '#2b3a6b' },
  bella: { seed: 73, skin: 'light', hair: 'ponytail', hairColor: '#e8b04a', top: 'tee', topColor: '#ff6fae', bottom: 'skirt', bottomColor: '#7b3fc4' },
  mom: { seed: 74, skin: 'fair', hair: 'long', hairColor: '#9a6a3a', top: 'sweater', topColor: '#7fd0ff', sleeves: 'long', bottom: 'slacks', bottomColor: '#5a5f6a', height: 1.15 },
  teacher: { seed: 75, skin: 'deep', hair: 'bald', top: 'shirt', topColor: '#f4f4f4', suspenders: '#e8413c', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: true, height: 1.12 },
  kidA: { seed: 76, skin: 'tan', hair: 'buns', hairColor: '#2b1b14', top: 'stripes', topColor: '#f4f4f4', stripe: '#7b3fc4', bottom: 'shorts', bottomColor: '#2e9e59' },
  kidB: { seed: 77, skin: 'light', hair: 'spiky', hairColor: '#e8632b', top: 'vest', topColor: '#ffd23f', bottom: 'cargo', bottomColor: '#5a5f6a' },
};
const BASEOP = { jonah: 0.3 };
const ALL = [];
function cast(set, keys) {
  const o = {};
  for (const k of keys) {
    const a = makeAvatar(LOOK[k]); a.base = BASEOP[k] ?? 1; a.base0 = LOOK[k].height || 1; a.mats = [];
    a.root.traverse(m => { if (m.isMesh) for (const mt of [].concat(m.material)) { if (mt.map && mt.map.image && mt.map.image.width === 768) { mt.isFace = true; m.renderOrder = 1; } if (!a.mats.includes(mt)) { mt.transparent = true; a.mats.push(mt); } } });
    a.meshes = []; a.root.traverse(m => { if (m.isMesh) a.meshes.push(m); });
    set.group.add(a.root); ALL.push(a); o[k] = a;
  }
  return o;
}
// see-through: 1 = solid, 0 = gone
function op(av, a) {
  if (av._op === a) return av; av._op = a;
  for (const m of av.mats) { m.opacity = a; m.depthWrite = !m.isFace; }
  for (const m of av.meshes) m.castShadow = a > 0.6;
  return av;
}
PRE.push(() => { for (const a of ALL) op(a, a.base); });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['GLASS', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'SPEAK\nUP!', bannerBg: '#ffd23f', locker: '#2e9e59', door: 'ROOM 5', poster: 'TALENT\nSHOW', posterBg: '#7b3fc4' });
  const cls = SETS.classroom({ board: ['ROLL CALL', 'Mon - Fri'] });
  const home = SETS.livingRoom();
  const caf = SETS.cafeteria({ menu: 'TODAY: PIZZA!', rule: 'NO\nWHISPERING' });
  const S = cast(street, ['kidA', 'kidB', 'bella', 'jonah', 'nar']);
  const H = cast(hall, ['nar', 'jonah', 'bella', 'kidA']);
  const K = cast(cls, ['nar', 'jonah', 'teacher']);
  const L = cast(home, ['nar', 'mom']);
  const C = cast(caf, ['nar', 'jonah', 'bella']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FL = fx(home), FC = fx(caf);
  // RULE FIRES: opacity a0 -> a1 with scream face + sparkles
  const beat = (F, av, lt, t0, a0, a1, rest, spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.out(remap(dt, 0.05, 0.45)); op(av, lerp(a0, a1, k));
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) F.sp[spi].at(dt, av.root.position.toArray(), av.root.scale.x);
  };
  // props
  const vaseTable = grp(at(box(2.4, 2.4, 2.4, '#b9783f', 0.1), 0, 1.2, 0)); home.group.add(vaseTable); vaseTable.position.set(3, 0, -3.4);
  const vase = prop((() => { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 2.0, 18), mat('#2f7de1')); v.position.y = 1.0; return grp(v, at(box(1.1, 0.25, 1.1, '#f4f4f4', 0.05), 0, 1.9, 0)); })()); home.group.add(vase);
  const shards = []; for (let i = 0; i < 6; i++) { const s = prop(box(0.5, 0.15, 0.4, i % 2 ? '#2f7de1' : '#f4f4f4', 0.04)); home.group.add(s); shards.push(s); }
  const bowl = prop(grp(new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), new THREE.MeshLambertMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.45 })), at(box(0.5, 0.3, 0.15, '#ff9f2e', 0.06), 0.1, -0.1, 0))); home.group.add(bowl);
  const diary = prop(box(1.4, 0.25, 1.8, '#e84b6a', 0.04)); L.nar.handR.add(diary); diary.position.set(0, -0.3, 0.4);
  const N = H.nar, J = H.jonah, BE = H.bella;
  const notice = prop(sign(['NO RUNNING', 'IN THE HALLS'], 4.4, 2.4, { bg: '#fff3c9', fg: '#d53a2a', border: '#d53a2a' })); hall.group.add(notice); notice.position.set(13, 3.4, -4.75);
  const shardsAt = (lt, t0, x, z) => shards.forEach((s, i) => { const k = E.out(remap(lt, t0, t0 + 0.4)), a = i * 1.05; s.show().position.set(x + Math.cos(a) * 1.2 * k, lerp(3.2, 0.08, E.in(remap(lt, t0, t0 + 0.3))), z + Math.sin(a) * 0.8 * k + 0.6); s.rotation.set(0, a, 0); });

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.4, 17.5], look: [0, 4.2, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { op(walkX(S.jonah, -6, 3.2, 1, lt, c.t, 0.6, 'neutral'), 0.3); S.bella.reset().place(3.4, 4.2, -0.3).pose('wave').idle(c.t).setFace('grin'); op(S.kidB.reset().place(-1.2, 5.4, 0.2).idle(c.t).setFace('worried'), 0.55); } });
  shot({ line: 'every secret you keep', set: street, cam: frame(1, 5, { size: 'close', side: 12 }),
    act(lt, c) { S.kidA.reset().place(1, 5, 0.2).pose(lt < c.w('secret') ? 'idle' : { aR: [150, -50] }).idle(c.t).setFace(lt < c.w('secret') ? 'smile' : 'smirk'); } });
  shot({ line: 'makes you see-through.', set: street, sfx: [['sparkle', 'see-through'], ['fall', 'see-through', 0.6]], cam: frame(1, 5, { size: 'full', side: -8, dist: 0.95 }),
    act(lt, c) { const a = S.kidA.reset().place(1, 5, -0.1).pose({ aR: [150, -50] }).idle(c.t).setFace('smirk'); beat(FS, a, lt, c.w('see-through'), 1, 0.4, 'worried'); } });
  shot({ line: "That's why blabbermouths are rock solid,", set: street, cam: { pos: [3.4, 1.6, 11.5], look: [3.4, 5.4, 3], fov: 60, blur: 0.25 },
    act(lt, c) { S.bella.reset().place(3.4, 3, 0).pose('open').talk(c.t).idle(c.t).setFace('talk'); } });
  shot({ line: 'and secret keepers', set: street, cam: frame(-3, 3, { size: 'medium', low: 0.42, side: -14 }),
    act(lt, c) { op(S.kidB.reset().place(-3, 3, -0.2).pose({ aL: [40, -20], aR: [40, -20] }).idle(c.t).setFace('worried'), 0.4); } });
  shot({ line: 'are basically ghosts.', set: street, sfx: [['whoosh', 'ghosts', 0.5]], cam: { ...frame(-2, 3, { size: 'wide', dist: 0.75 }), blur: 0.08 },
    act(lt, c) { op(S.kidB.reset().place(-3, 3, 0).idle(c.t).setFace('worried'), 0.4); op(walkX(S.jonah, -8, 4.6, 1, lt, c.t, 0.7, 'neutral'), 0.2); op(walkX(S.kidA, 4, 2, -1, lt, c.t, 0.6, 'worried'), 0.45); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'I was pretty solid.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Jonah', set: hall, cam: frame(-9.6, -2.6, { size: 'close', side: -12 }),
    act(lt, c) { J.reset().place(-9.6, -2.6, -0.15).pose('wave', remap(lt, 0.1, 0.4)).idle(c.t).setFace('smile'); J.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: 'was so faint you could read through him.', set: hall, sfx: [['pop', 'read', 0.5]], cam: { pos: [13.2, 4.2, 3.4], look: [13, 3.6, -5.8], fov: 56, blur: 0.15, push: 0.03 },
    act(lt, c) { notice.visible = true; J.reset().place(13, -4.2, 0).idle(c.t).setFace('smile'); } });
  // plant: marked absent every day
  shot({ line: 'Our teacher had marked him absent for a month.', set: cls, cam: { pos: [0.4, 5.2, 12.4], look: [0.4, 4.6, -1], fov: 60, blur: 0.12 },
    act(lt, c) { cls.desks.visible = false; K.teacher.reset().place(-2.4, -2.2, 0.35).pose({ aR: [70, -10] }).talk(c.t, lt > c.w('marked') ? 1 : 0).idle(c.t).setFace(lt < c.w('absent') ? 'serious' : 'sad'); K.jonah.reset().place(3.2, 1.2, -0.4).pose('wave').idle(c.t).setFace(lt < c.w('absent') ? 'smile' : 'sad'); } });
  shot({ line: 'Meanwhile, Bella had zero secrets.', set: hall, cam: frame(7, 0.6, { size: 'full', side: -8 }),
    act(lt, c) { BE.reset().place(7, 0.6, 0).pose('hips').idle(c.t).setFace('grin'); } });
  shot({ line: 'Her crush? Everyone knew.', set: hall, sfx: [['pop', 'everyone', 0.5]], cam: frame(7, 0.6, { size: 'close', side: 14 }),
    act(lt, c) { BE.reset().place(7, 0.6, 0.3).pose(lt < c.w('everyone') ? 'shy' : 'cheer').idle(c.t).setFace(lt < c.w('everyone') ? 'love' : 'laugh'); } });
  shot({ line: 'Her diary? Read it out loud.', set: hall, cam: frame(7, 0.6, { size: 'close', side: -14 }),
    act(lt, c) { BE.reset().place(7, 0.6, -0.3).pose({ aL: [80, -10], aR: [80, -10] }).talk(c.t, lt > c.w('read') ? 1 : 0).idle(c.t).setFace(lt < c.w('read') ? 'smile' : 'talk'); } });
  shot({ line: 'Her password? Bella one two three.', set: hall, sfx: [['pop', 'three', 0.5]], cam: frame(7, 0.6, { size: 'face', side: 4, push: 0.06 }),
    act(lt, c) { BE.reset().place(7, 0.6, 0).talk(c.t, lt > c.w('bella') ? 1 : 0).idle(c.t, 0.4).setFace(lt < c.w('bella') ? 'smile' : lt < c.w('three') + 0.3 ? 'say' : 'wink'); } });

  // ═══════════════ INCITING (home) ═══════════════
  shot({ line: "Then I broke my mom's favorite vase,", set: home, sfx: [['thud', 'vase', 1.0], ['pop', 'vase', 0.6]], cam: frame(2.4, -1.6, { size: 'full', side: 10, dist: 1.05 }),
    act(lt, c) { const t0 = c.w('broke'); vase.show(); vase.position.set(3, 2.4, -3.4); if (lt > t0) { vase.visible = false; shardsAt(lt, t0, 3, -3.4); } L.nar.reset().place(lt < t0 ? 0.4 + lt * 0.8 : 0.4 + t0 * 0.8, -1.4, lt < t0 ? Math.PI / 2 - 0.4 : 0).pose(lt < t0 ? 'idle' : { aL: [140, -20], aR: [140, -20] }).walk(lt < t0 ? c.t : 0, lt < t0 ? 0.6 : 0).setFace(lt < t0 ? 'smile' : 'shock'); } });
  shot({ line: 'and hid the pieces.', set: home, cam: frame(1.6, -0.6, { size: 'medium', side: -16, dist: 1.1 }),
    act(lt, c) { L.nar.reset().place(1.6, -0.6, -0.5).pose({ aR: [60, 10], lean: [20, 0] }).idle(c.t).setFace('smirk'); } });
  shot({ line: 'I went see-through.', set: home, sfx: [['sparkle', 'see-through'], ['fall', 'see-through', 0.6]], cam: frame(1.6, -0.6, { size: 'full', side: 8, dist: 0.95 }),
    act(lt, c) { const a = L.nar.reset().place(1.6, -0.6, 0).idle(c.t); beat(FL, a, lt, c.w('see-through'), 1, 0.45, 'worried'); } });
  shot({ line: 'Mom walked right past me.', set: home, cam: { ...frame(1.6, -0.6, { size: 'wide', dist: 0.7 }), blur: 0.08 },
    act(lt, c) { op(L.nar.reset().place(1.6, -0.6, 0).idle(c.t).setFace('worried'), 0.45); walkX(L.mom, -6, 1.6, 1, lt, c.t, 0.8, 'smile'); } });

  // ═══════════════ IDEA + FAILED TRIES ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10 }),
    act(lt, c) { op(N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'worried' : 'grin'), 0.45); FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I spilled all my secrets,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18 }),
    act(lt, c) { op(N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk'), 0.45); } });
  shot({ line: "I'd be solid like Bella.", set: hall, sfx: [['pop', 'solid', 0.6]], cam: frame(0.4, 0.4, { size: 'full', dist: 1.05 }),
    act(lt, c) { const k = remap(lt, c.w('solid') - 0.05, c.w('solid') + 0.3); op(N.reset().place(-2, 1, 0.2).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'), lerp(0.45, 1, k)); BE.reset().place(2.6, -0.6, -0.3).pose('wave').idle(c.t).setFace('grin'); } });
  shot({ line: 'I told my goldfish. Nothing.', set: home, cam: { pos: [-7.6, 4.6, 4.4], look: [-9.4, 4.0, -1.2], fov: 58, blur: 0.4 },
    act(lt, c) { bowl.show().position.set(-10.8, 3.3, -2.4); op(L.nar.reset().place(-8.6, -0.6, -0.9).pose({ lean: [14, 0] }).talk(c.t, lt < c.w('nothing') ? 1 : 0).idle(c.t).setFace(lt < c.w('nothing') ? 'say' : 'blank'), 0.45); } });
  shot({ line: 'I wrote it in my diary.', set: home, cam: frame(-4, 1.4, { size: 'close', side: 30 }),
    act(lt, c) { op(L.nar.reset().place(-4, 1.4, 0.2).pose({ aR: [40, -20] }).idle(c.t).setFace('serious'), 0.45); diary.show(); L.nar.armL.rotation.x = -1.2 + Math.sin(c.t * 16) * 0.12; } });
  shot({ line: 'Still nothing.', set: home, cam: frame(-4, 1.4, { size: 'face', side: -10, push: 0.06 }),
    act(lt, c) { op(L.nar.reset().place(-4, 1.4, 0).idle(c.t, 0.3).setFace('sus'), 0.45); } });

  // ═══════════════ ACCIDENTAL SUCCESS (home) ═══════════════
  shot({ line: 'Then my mom asked about the vase,', set: home, cam: frame(2.6, 1.0, { size: 'medium', h: 1.1, side: 12, dist: 1.2 }),
    act(lt, c) { L.mom.reset().place(4.2, 0.6, -0.7).pose(lt < c.w('vase') ? 'hips' : { aR: [80, 10] }).talk(c.t, lt > c.w('asked') ? 1 : 0).idle(c.t).setFace(lt < c.w('asked') ? 'serious' : 'say'); op(L.nar.reset().place(1, 1.4, 0.6).idle(c.t).setFace('worried'), 0.45); } });
  shot({ line: 'and I told her the truth.', set: home, cam: frame(1, 1.4, { size: 'close', side: -14 }),
    act(lt, c) { op(L.nar.reset().place(1, 1.4, 0.3).pose('open', remap(lt, c.w('told'), c.w('told') + 0.15)).talk(c.t, lt > c.w('told') ? 1 : 0).idle(c.t).setFace(lt < c.w('told') ? 'worried' : 'say'), 0.45); } });
  shot({ line: 'I went solid again.', set: home, sfx: [['sparkle', 'solid'], ['rise', 'solid', 0.6]], cam: frame(2.4, 1.0, { size: 'full', side: -6, dist: 1.1, h: 1.08 }),
    act(lt, c) { const a = L.nar.reset().place(1, 1.4, 0.3).idle(c.t); beat(FL, a, lt, c.w('solid'), 0.45, 1, 'laugh'); L.mom.reset().place(4.0, 0.6, -0.6).pose(lt > c.w('again') ? 'hug' : 'idle').idle(c.t).setFace(lt < c.w('solid') + 0.3 ? 'shock' : 'smile'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I told everyone everything.', set: hall, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { N.reset().place(0, 1.4, 0.1).pose('open').talk(c.t).idle(c.t).setFace('talk'); walkX(H.kidA, -6, -1.4, 1, lt, c.t, 0.6, 'shock'); } });
  shot({ line: "I can't whistle.", set: hall, cam: frame(8, 0.6, { size: 'close', side: -14 }),
    act(lt, c) { N.reset().place(8, 0.6, 0.2).pose('shrug').idle(c.t).setFace('cute'); } });
  shot({ line: "I'm scared of pigeons.", set: street, cam: frame(-4, 3, { size: 'close', side: 14 }),
    act(lt, c) { S.nar.reset().place(-4, 3, 0.2).pose({ aL: [40, -20], aR: [40, -20] }).idle(c.t).setFace('worried'); } });
  shot({ line: 'I cried at a cartoon.', set: home, sfx: [['sad', 'cartoon', 0.5]], cam: { pos: [10.4, 4.6, 2.6], look: [6.6, 4.2, 1.6], fov: 60, blur: 0.4 },
    act(lt, c) { L.nar.reset().place(6.6, 1.6, Math.PI / 2 - 0.3).idle(c.t).setFace(lt < c.w('cried') ? 'sad' : 'cry'); } });
  shot({ line: 'By lunch, I was as solid as Bella.', set: caf, cam: { ...frame(-7.5, 0, { size: 'wide', dist: 0.62 }), blur: 0.08 },
    act(lt, c) { C.nar.reset().place(-9.6, 0.4, 0.2).pose('cheer').idle(c.t).setFace('laugh'); C.bella.reset().place(-5.4, -0.4, -0.2).pose('cheer').idle(c.t).setFace('laugh'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I almost sat on Jonah.', set: caf, sfx: [['boing', 'jonah', 0.8]], cam: frame(-1.2, 3.4, { size: 'full', side: 6, dist: 0.9 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const t0 = c.w('jonah'), k = remap(lt, c.w('sat') - 0.3, t0); C.jonah.reset().place(-2.4, 3.4, 0).sit(1.5).idle(c.t).setFace(lt < t0 ? 'sad' : 'shock'); const n = C.nar.reset().place(lerp(-0.2, -2.4, E.out(k)), 3.4 + 0.1, 0); if (lt < t0) n.sit(lerp(2.6, 1.9, k)).setFace('smile'); else n.pose('cheer').jump(remap(lt, t0, t0 + 0.4), 1.6).setFace('shock'); } });
  shot({ line: 'He was almost gone, eating alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [-0.6, 6.4, 13], look: [-2.4, 3.6, 3.4], fov: 50, blur: 0.04, push: 0.02 },
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; C.jonah.reset().place(-2.4, 3.4, 0).sit(1.5).pose('slump').idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'd spent all day spilling secrets", set: caf, cam: frame(1.6, 1.0, { size: 'close', side: 16 }),
    act(lt, c) { C.nar.reset().place(1.6, 1.0, -0.4).idle(c.t, 0.5).setFace(lt < c.w('secrets') ? 'worried' : 'sad'); } });
  shot({ line: 'while my best friend was disappearing.', set: caf, cam: frame(1.6, 1.0, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { C.nar.reset().place(1.6, 1.0, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'What are you hiding?', set: caf, cam: { pos: [-0.9, 7.2, 12.2], look: [-0.9, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).talk(c.t).idle(c.t).setFace('say'); C.jonah.reset().place(-2.4, 3.4, 0.3).sit(1.5).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'm moving away next month.", set: caf, sfx: [['sparkle', 'month'], ['rise', 'month', 0.5]], cam: frame(-2.4, 3.4, { size: 'close', side: -12 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const a = C.jonah.reset().place(-2.4, 3.4, 0.3).sit(1.5).talk(c.t, lt < c.w('month') ? 1 : 0).idle(c.t).setFace('cry'); beat(FC, a, lt, c.w('month'), 0.16, 0.55, 'cry', 0); } });
  shot({ line: "And I'm scared you'll forget me.", set: caf, sfx: [['sparkle', 'forget'], ['rise', 'forget', 0.5]], cam: frame(-1.2, 3.4, { size: 'full', side: -6, dist: 0.8 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const a = C.jonah.reset().place(-2.4, 3.4, 0.2).sit(1.5).talk(c.t, lt < c.w('forget') ? 1 : 0).idle(c.t).setFace('sad'); op(a, 0.55); beat(FC, a, lt, c.w('forget'), 0.55, 1, 'cry', 1); C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).idle(c.t).setFace(lt < c.w('forget') + 0.3 ? 'sad' : 'wow'); } });
  shot({ line: 'I could never forget you.', set: caf, cam: frame(0.2, 3.4, { size: 'close', side: 18 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).pose({ aR: [70, 40] }).talk(c.t).idle(c.t).setFace(lt < c.w('you') ? 'say' : 'smile'); } });
  // payoff of the plant
  shot({ line: 'The next day at roll call,', set: cls, cam: frame(-2.4, -2.2, { size: 'medium', h: 1.12, side: 10, dist: 1.15 }),
    act(lt, c) { cls.desks.visible = false; K.teacher.reset().place(-2.4, -2.2, 0.4).pose({ aR: [70, -10] }).idle(c.t).setFace('neutral'); } });
  shot({ line: 'Jonah? Here!', set: cls, sfx: [['ding', 'here', 0.7]], cam: { pos: [0.6, 5.2, 12.6], look: [0.6, 4.4, 0], fov: 60, blur: 0.1 },
    act(lt, c) { cls.desks.visible = false; const h = c.w('here'); K.teacher.reset().place(-2.4, -2.2, 0.4).pose({ aR: [70, -10] }).talk(c.t, lt < h ? 1 : 0).idle(c.t).setFace(lt < h ? 'say' : 'wow'); op(K.jonah.reset().place(3.2, 1.2, -0.4).pose(lt < h ? 'idle' : 'cheer').idle(c.t).setFace(lt < h ? 'smile' : 'laugh'), 1); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he said, also, I took your pencil.', set: hall, sfx: [['pop', 'pencil', 0.5]], cam: frame(-3, 1, { size: 'close', side: -14 }),
    act(lt, c) { op(J.reset().place(-3, 1, 0.3).talk(c.t, lt > c.w('also') ? 1 : 0).idle(c.t).setFace(lt < c.w('also') ? 'smirk' : lt < c.w('pencil') + 0.2 ? 'say' : 'smug'), 1); } });
  shot({ line: 'I stared at him.', set: hall, cam: frame(0, 0.4, { size: 'face', side: 8, push: 0.07 }),
    act(lt, c) { N.reset().place(0, 0.4, -0.2).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Best month ever.', set: hall, cam: frame(-1.4, 0.6, { size: 'medium', side: -10, low: 0.3, dist: 1.1 }),
    act(lt, c) { N.reset().place(0, 0.4, -0.3).pose(lt < c.w('ever') ? 'open' : 'cheer').idle(c.t).setFace(lt < c.w('month') ? 'laugh' : 'grin'); op(J.reset().place(-3, 1, 0.3).pose(lt < c.w('ever') ? 'idle' : 'cheer').idle(c.t).setFace('laugh'), 1); } });
});
