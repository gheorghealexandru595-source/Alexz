// story.js: "In this town, every lie you tell makes you shrink."  Owning up grows you back.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, canvasTex, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 51, skin: 'tan', hair: 'spiky', hairColor: '#2b1b14', top: 'vest', topColor: '#2f95e6', inner: '#f4f4f4', bottom: 'cargo', bottomColor: '#5a5f6a' },
  sam: { seed: 52, skin: 'light', hair: 'curly', hairColor: '#e8632b', top: 'stripes', topColor: '#ffd23f', stripe: '#e8413c', bottom: 'jeans', bottomColor: '#4f79a7', glasses: true },
  nora: { seed: 53, skin: 'brown', hair: 'bob', hairColor: '#17110f', top: 'sweater', topColor: '#ff6fae', sleeves: 'long', bottom: 'skirt', bottomColor: '#2b3a6b' },
  teacher: { seed: 54, skin: 'fair', hair: 'ponytail', hairColor: '#9a6a3a', top: 'cardigan', topColor: '#2e9e59', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: true },
  kidA: { seed: 55, skin: 'deep', hair: 'afro', hairColor: '#17110f', top: 'hoodie', topColor: '#7b3fc4', bottom: 'joggers', bottomColor: '#15151a' },
  kidB: { seed: 56, skin: 'fair', hair: 'buns', hairColor: '#e8b04a', top: 'tee', topColor: '#2e9e59', bottom: 'shorts', bottomColor: '#e84b6a' },
  dad: { seed: 57, skin: 'tan', hair: 'buzz', hairColor: '#333333', top: 'shirt', topColor: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38' },
};
const BASE = { nora: 1.7, teacher: 1.12, dad: 1.15, sam: 0.3 };   // resting sizes
const ALL = [];
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); o[k].base = BASE[k] || 1; set.group.add(o[k].root); ALL.push(o[k]); } return o; }
PRE.push(() => { for (const a of ALL) a.size(a.base); });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed * av.base, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['TRUTH', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'TELL THE\nTRUTH!', bannerBg: '#ffd23f', locker: '#e8632b', door: 'ROOM 2', poster: 'HONESTY\nWEEK', posterBg: '#2f7de1' });
  const cls = SETS.classroom({ board: ['MATH', '2 + 2 = ?'] });
  const caf = SETS.cafeteria({ menu: 'TODAY: TACOS!', rule: 'NO\nFIBBING' });
  const S = cast(street, ['nora', 'kidA', 'kidB', 'dad']);
  const H = cast(hall, ['nar', 'sam', 'nora', 'kidA']);
  const K = cast(cls, ['nar', 'nora', 'teacher', 'sam']);
  const C = cast(caf, ['nar', 'sam', 'nora']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FC = fx(caf);
  // RULE FIRES: body size s0 -> s1 (shrink = lie, grow = truth). scream face, arms flare, sparkles.
  const sizeBeat = (F, av, lt, t0, s0, s1, rest, spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.45)), s = Math.max(0.05, lerp(s0, s1, k)); av.size(s);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) F.sp[spi].at(dt, av.root.position.toArray(), s);
    return s;
  };
  // props
  const fountain = grp(at(box(2.2, 1.0, 1.4, '#d9dde3', 0.12), 0, 3.4, 0), at(box(0.3, 0.3, 0.5, '#9aa0a8', 0.05), 0, 4.0, 0.2), at(box(1.6, 2.9, 0.6, '#c4c9d0'), 0, 1.45, -0.35));
  hall.group.add(fountain); fountain.position.set(-16, 0, -5.1);
  const stool = prop(box(1.4, 2.2, 1.4, '#b9783f', 0.1)); hall.group.add(stool); stool.position.set(-16, 1.1, -3.6);
  const water = prop(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), glow('#8fd8ff', 1.1))); hall.group.add(water);
  const bottle = prop(grp((() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.6, 18), new THREE.MeshLambertMaterial({ color: '#8fd8ff', transparent: true, opacity: 0.75 })); c.position.y = 0.8; return c; })(), at(box(0.5, 0.3, 0.5, '#2f7de1', 0.08), 0, 1.75, 0)));
  hall.group.add(bottle);
  const doodle = (() => { const t = canvasTex(256, 256, g => { g.strokeStyle = '#e8413c'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(128, 128, 90, 0, 7); g.stroke(); g.beginPath(); g.arc(95, 105, 10, 0, 7); g.arc(161, 105, 10, 0, 7); g.fillStyle = '#e8413c'; g.fill(); g.beginPath(); g.arc(128, 140, 50, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.moveTo(70, 165); g.quadraticCurveTo(128, 120, 186, 165); g.stroke(); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(4.6, 6.6, -5.78); cls.group.add(m); return m; })();
  const lunchbox = prop(grp(at(box(2.2, 0.12, 1.4, '#e8413c'), 0, 0.06, 0), at(box(2.2, 0.7, 0.1, '#e8413c'), 0, 0.4, 0.65), at(box(2.2, 0.7, 0.1, '#e8413c'), 0, 0.4, -0.65), at(box(0.1, 0.7, 1.4, '#e8413c'), 1.05, 0.4, 0), at(box(0.1, 0.7, 1.4, '#e8413c'), -1.05, 0.4, 0), at(box(2.2, 1.3, 0.1, '#c42f2a'), 0, 1.25, -0.75)));
  caf.group.add(lunchbox);
  const teddy = prop(grp((() => { const g = grp(); const m = mat('#b9783f'); for (const [x, y, r] of [[0, 0.5, 0.5], [0, 1.25, 0.38], [-0.3, 1.58, 0.14], [0.3, 1.58, 0.14]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); s.position.set(x, y, 0); g.add(s); } return g; })()));
  H.nar.handR.add(teddy); teddy.position.set(0, -0.3, 0.6); teddy.rotation.x = -Math.PI / 2;
  const N = H.nar;
  caf.reset = () => { caf.tables[1].visible = true; const t = caf.tables[1].children; t[1].visible = t[2].visible = false; };
  const TY = 2.83, TX = -2.4, TZ = 6.6;    // Sam's lunchbox on the centre table (top at y 2.7)

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.0, 19], look: [0, 5.0, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { S.nora.reset().place(-3.6 + lt * 1.4, 3, Math.PI / 2).walk(c.t, 0.4).setFace('smile'); S.kidA.reset().place(3, 4.6, -0.3).size(0.35).idle(c.t).setFace('worried'); S.kidB.reset().place(1, 5.6, 0.2).idle(c.t).setFace('smile'); } });
  shot({ line: 'every lie you tell', set: street, cam: frame(1, 5, { size: 'close', side: 12 }),
    act(lt, c) { S.kidB.reset().place(1, 5, 0.2).pose('shrug').talk(c.t, lt > c.w('lie') ? 1 : 0).idle(c.t).setFace(lt < c.w('lie') ? 'smile' : 'say'); } });
  shot({ line: 'makes you shrink.', set: street, sfx: [['sparkle', 'shrink'], ['fall', 'shrink']], cam: frame(1, 5, { size: 'full', side: -8, dist: 0.9, low: 0.2 }),
    act(lt, c) { const a = S.kidB.reset().place(1, 5, -0.1).pose('shrug').idle(c.t).setFace('say'); sizeBeat(FS, a, lt, c.w('shrink'), 1, 0.55, 'worried'); } });
  shot({ line: "That's why honest people", set: street, cam: { pos: [-1.5, 1.4, 12], look: [-1.5, 9.4, 2], fov: 62, blur: 0.25 },
    act(lt, c) { S.nora.reset().place(-1.5, 2, 0).pose('hips').idle(c.t).setFace('grin'); } });
  shot({ line: 'duck under doorframes,', set: street, sfx: [['thud', 'doorframes', 0.5]], cam: { pos: [6.4, 5.6, 13.5], look: [0, 6.6, -2.4], fov: 60, blur: 0.12 },
    act(lt, c) { const k = remap(lt, 0, c.d); const n = S.nora.reset().place(0, lerp(2.8, -1.4, k), Math.PI).walk(c.t, 0.4).setFace('neutral'); n.hip.rotation.x = 0.45 * clamp(k * 2); } });
  shot({ line: 'and liars get stepped on.', set: street, sfx: [['thud', 'stepped', 0.9]], cam: frame(4, 3, { size: 'full', h: 0.7, low: 0.15, side: 10 }),
    act(lt, c) { const t0 = c.w('stepped'); S.kidA.reset().place(4 + E.out(remap(lt, t0 - 0.1, t0 + 0.2)) * 0.9, 3, -0.1).size(0.35).pose(lt < t0 ? 'idle' : { aL: [160, 30], aR: [160, 30] }).jump(remap(lt, t0 - 0.1, t0 + 0.25), 1.0).setFace(lt < t0 - 0.05 ? 'smirk' : 'shock'); S.dad.reset().place(1.2 + lt * 2.6, 1.6, Math.PI / 2).walk(c.t, 0.6).setFace('neutral'); FS.puff.at(lt - t0, [4.4, 0, 3.4]); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'I was about average.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Sam', set: hall, cam: frame(-6, 2, { size: 'close', h: 0.3, side: -12, low: 0.2 }),
    act(lt, c) { H.sam.reset().place(-6, 2, -0.15).pose('wave', remap(lt, 0.1, 0.3)).idle(c.t).setFace('grin'); H.sam.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: 'was the size of a water bottle.', set: hall, sfx: [['pop', 'bottle', 0.5]], cam: frame(-6.6, 2, { size: 'full', h: 0.38, low: 0.15, side: 8 }),
    act(lt, c) { H.sam.reset().place(-6, 2, -0.3).pose('open').idle(c.t).setFace('smile'); bottle.show().position.set(-7.4, 0, 2.2); } });
  // plant: the water fountain he can only reach from a stool
  shot({ line: 'He needed a stool to reach the water fountain.', set: hall, sfx: [['boing', 'stool', 0.5]], cam: { pos: [-13.6, 3.0, 2.8], look: [-16, 3.0, -4], fov: 60, blur: 0.25 },
    act(lt, c) { stool.show(); const k = remap(lt, c.w('stool'), c.w('stool') + 0.5); H.sam.reset().place(-16, -3.6 + 0.2 * (1 - k), Math.PI, lerp(0, 2.2, E.out(k))).pose(k < 1 ? { aL: [150, 10], aR: [150, 10] } : 'reach').jump(k, 0.8).setFace(k < 1 ? 'worried' : 'grin'); } });
  shot({ line: 'Meanwhile, Nora never lied.', set: hall, cam: { ...frame(6, 0.6, { size: 'full', h: 1.55, side: -8 }), blur: 0.2 },
    act(lt, c) { H.nora.reset().place(6, 0.6, 0).pose('hips').idle(c.t).setFace('neutral'); walkX(H.kidA, 1.6, 2.6, 1, lt, c.t, 0.6, 'smile'); } });
  shot({ line: 'Ugly sweater? She said so.', set: hall, sfx: [['pop', 'said', 0.5]], cam: frame(6, 0.6, { size: 'close', h: 1.75, side: 14, dist: 1.15 }),
    act(lt, c) { H.nora.reset().place(6, 0.6, 0.3).pose(lt < c.w('she') ? 'idle' : 'point').talk(c.t, lt > c.w('she') ? 1 : 0).idle(c.t).setFace(lt < c.w('she') ? 'sus' : 'say'); } });
  shot({ line: 'Burnt cookies? She said so.', set: hall, sfx: [['pop', 'said', 0.5]], cam: frame(6, 0.6, { size: 'close', h: 1.75, side: -14, dist: 1.15 }),
    act(lt, c) { H.nora.reset().place(6, 0.6, -0.3).pose(lt < c.w('she') ? 'idle' : 'shrug').talk(c.t, lt > c.w('she') ? 1 : 0).idle(c.t).setFace(lt < c.w('she') ? 'serious' : 'say'); } });
  shot({ line: 'Bad singing? Also said so.', set: hall, sfx: [['pop', 'also', 0.5]], cam: frame(6, 0.6, { size: 'face', h: 1.75, side: 4, push: 0.06, dist: 1.15 }),
    act(lt, c) { H.nora.reset().place(6, 0.6, 0).talk(c.t, lt > c.w('also') ? 1 : 0).idle(c.t, 0.4).setFace(lt < c.w('also') ? 'serious' : 'smug'); } });

  // ═══════════════ INCITING (classroom) ═══════════════
  shot({ line: 'Then our teacher asked who drew on the board.', set: cls, cam: { pos: [1.6, 5.6, 9.5], look: [2.4, 5.8, -3], fov: 60, blur: 0.15 },
    act(lt, c) { cls.desks.visible = false; K.teacher.reset().place(-0.6, -2.2, 0.35).pose(lt < c.w('who') ? 'idle' : 'point').talk(c.t, lt > c.w('asked') ? 1 : 0).idle(c.t).setFace(lt < c.w('asked') ? 'serious' : 'say'); } });
  shot({ line: 'I said, not me.', set: cls, cam: frame(3, 2.6, { size: 'close', side: 12 }),
    act(lt, c) { cls.desks.visible = false; K.nar.reset().place(3, 2.6, -0.3).pose('shrug').talk(c.t, lt > c.w('not') ? 1 : 0).idle(c.t).setFace(lt < c.w('not') ? 'smile' : 'say'); } });
  shot({ line: 'I shrank two inches.', set: cls, sfx: [['sparkle', 'shrank'], ['fall', 'shrank']], cam: frame(3, 2.6, { size: 'full', side: -10, dist: 0.95 }),
    act(lt, c) { cls.desks.visible = false; const a = K.nar.reset().place(3, 2.6, 0).pose('shrug').idle(c.t); sizeBeat(FK, a, lt, c.w('shrank'), 1, 0.82, 'worried'); } });
  shot({ line: 'Nora raised an eyebrow.', set: cls, cam: frame(-3.4, 1.6, { size: 'close', h: 1.75, side: 16, push: 0.05, dist: 1.15 }),
    act(lt, c) { cls.desks.visible = false; K.nora.reset().place(-3.4, 1.6, 0.5).idle(c.t, 0.3).setFace(lt < c.w('eyebrow') ? 'neutral' : 'sus').lookAt(3, 2.6); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10, h: 0.82 }),
    act(lt, c) { N.reset().place(-2, 1, 0.1).size(0.82).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin'); FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I only told the truth,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18, h: 0.82 }),
    act(lt, c) { N.reset().place(-2, 1, 0.3).size(0.82).pose('think').idle(c.t).setFace('smirk'); } });
  shot({ line: "I'd be tall like Nora.", set: hall, sfx: [['rise', 'tall', 0.6]], cam: frame(0.4, 0.2, { size: 'full', h: 1.4, dist: 1.0 }),
    act(lt, c) { const k = E.back(remap(lt, c.w('tall') - 0.05, c.w('tall') + 0.35)); N.reset().place(-2, 1, 0.2).size(lerp(0.82, 1.65, k)).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'); H.nora.reset().place(2.6, -0.6, -0.3).idle(c.t).setFace('neutral'); } });
  shot({ line: 'The sky is blue. Nothing.', set: hall, cam: frame(-10, -3.2, { size: 'close', side: 12, h: 0.82 }),
    act(lt, c) { N.reset().place(-10, -3.2, 0.1).size(0.82).pose(lt < c.w('nothing') ? 'open' : 'idle').talk(c.t, lt < c.w('nothing') ? 1 : 0).idle(c.t).setFace(lt < c.w('nothing') ? 'say' : 'blank'); } });
  shot({ line: 'Water is wet.', set: hall, cam: frame(3, 0.4, { size: 'medium', side: 8, h: 0.82 }),
    act(lt, c) { N.reset().place(3, 0.4, 0).size(0.82).pose('point').talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(3, 0.4, { size: 'face', side: -10, push: 0.06, h: 0.82 }),
    act(lt, c) { N.reset().place(3, 0.4, 0).size(0.82).idle(c.t, 0.3).setFace('sus'); } });

  // ═══════════════ ACCIDENTAL SUCCESS (classroom) ═══════════════
  shot({ line: 'Then I told the teacher it was me.', set: cls, cam: { pos: [1.6, 4.4, 8.6], look: [0.6, 4.4, -0.4], fov: 60, blur: 0.3 },
    act(lt, c) { cls.desks.visible = false; K.nar.reset().place(2.2, 0.8, -0.8).size(0.82).pose(lt < c.w('me') ? 'idle' : { aR: [60, -30] }).talk(c.t, lt > c.w('told') ? 1 : 0).idle(c.t).setFace(lt < c.w('told') ? 'worried' : 'say'); K.teacher.reset().place(-1.2, -1.6, 0.7).idle(c.t).setFace(lt < c.w('me') ? 'serious' : 'wow'); } });
  shot({ line: 'I grew right back.', set: cls, sfx: [['sparkle', 'grew'], ['rise', 'grew']], cam: frame(2.2, 0.8, { size: 'full', side: -8, dist: 1.0 }),
    act(lt, c) { cls.desks.visible = false; const a = K.nar.reset().place(2.2, 0.8, -0.2).idle(c.t); sizeBeat(FK, a, lt, c.w('grew'), 0.82, 1.0, 'laugh'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I told the truth all day.', set: hall, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95, h: 1.1 }),
    act(lt, c) { N.reset().place(0, 1.4, 0.1).size(lerp(1.0, 1.15, remap(lt, 0, c.d))).pose('open').talk(c.t).idle(c.t).setFace('talk'); } });
  shot({ line: 'I hate broccoli.', set: caf, sfx: [['pop', 'broccoli', 0.6]], cam: frame(-7.5, 0.6, { size: 'close', side: 14, h: 1.2 }),
    act(lt, c) { const s = lerp(1.15, 1.25, E.back(remap(lt, c.w('broccoli'), c.w('broccoli') + 0.3))); C.nar.reset().place(-7.5, 0.6, -0.2).size(s).pose({ aR: [70, 0] }).talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: "I'm scared of ducks.", set: hall, sfx: [['pop', 'ducks', 0.6]], cam: frame(8, 0.6, { size: 'close', side: -14, h: 1.35 }),
    act(lt, c) { const s = lerp(1.25, 1.35, E.back(remap(lt, c.w('ducks'), c.w('ducks') + 0.3))); N.reset().place(8, 0.6, 0.2).size(s).pose({ aL: [40, -20], aR: [40, -20] }).talk(c.t).idle(c.t).setFace('worried'); } });
  shot({ line: 'I sleep with a teddy bear.', set: hall, sfx: [['pop', 'bear', 0.6]], cam: frame(-4, 0, { size: 'medium', side: 10, h: 1.45, dist: 1.05 }),
    act(lt, c) { const s = lerp(1.35, 1.45, E.back(remap(lt, c.w('bear'), c.w('bear') + 0.3))); N.reset().place(-4, 0, 0).size(s).pose({ aR: [60, -20] }).talk(c.t).idle(c.t).setFace('cute'); teddy.show(); } });
  shot({ line: 'By lunch, I was almost as tall as Nora.', set: caf, cam: { pos: [-7.5, 5.4, 11.5], look: [-7.5, 6.2, 0], fov: 60, blur: 0.08, push: 0.02 },
    act(lt, c) { C.nar.reset().place(-9.4, 0.4, 0.2).size(1.55).pose('cheer').idle(c.t).setFace('laugh'); C.nora.reset().place(-5.6, -0.4, -0.2).idle(c.t).setFace('smile'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I saw Sam,', set: caf, cam: frame(-7.5, 0.6, { size: 'close', side: -14, h: 1.55 }),
    act(lt, c) { const a = C.nar.reset().place(-7.5, 0.6, -0.2).size(1.55).idle(c.t); const k = remap(lt, c.w('saw'), c.w('saw') + 0.2); a.head.rotation.y -= 0.6 * k; a.head.rotation.x += 0.4 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'sitting in a lunchbox, alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [TX + 0.8, 5.0, TZ + 5.4], look: [TX, 3.3, TZ], fov: 50, blur: 0.15, push: 0.02 },
    act(lt, c) { lunchbox.show().position.set(TX, 2.7, TZ); C.sam.reset().place(TX, TZ, 0.2, TY).size(0.22).sit(0.3).pose({ head: [18, 0, 0] }).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'd spent all day growing", set: caf, cam: frame(-7.5, 0.6, { size: 'close', side: 16, h: 1.55 }),
    act(lt, c) { C.nar.reset().place(-7.5, 0.6, -0.3).size(1.55).idle(c.t, 0.5).setFace(lt < c.w('growing') ? 'worried' : 'sad'); } });
  shot({ line: 'while my best friend kept shrinking.', set: caf, cam: frame(-7.5, 0.6, { size: 'face', side: -6, push: 0.05, h: 1.55 }),
    act(lt, c) { C.nar.reset().place(-7.5, 0.6, -0.1).size(1.55).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I asked, why do you lie?', set: caf, cam: { pos: [TX + 3.2, 6.6, TZ + 6.6], look: [TX + 0.6, 4.2, TZ - 0.6], fov: 60, blur: 0.25 },
    act(lt, c) { lunchbox.show().position.set(TX, 2.7, TZ); C.sam.reset().place(TX, TZ, 0.4, TY).size(0.22).sit(0.3).idle(c.t, 0.3).setFace('sad'); C.nar.reset().place(TX + 2.6, TZ - 1.4, -0.9).size(1.0).pose({ lean: [20, 0] }).talk(c.t, lt > c.w('why') ? 1 : 0).idle(c.t).setFace(lt < c.w('why') ? 'worried' : 'say'); } });
  shot({ line: 'So people like me.', set: caf, cam: { pos: [TX + 0.3, TY + 1.0, TZ + 2.0], look: [TX, TY + 0.85, TZ], fov: 60, blur: 0.6, push: 0.04 },
    act(lt, c) { lunchbox.show().position.set(TX, 2.7, TZ); C.sam.reset().place(TX, TZ, 0.1, TY).size(0.22).sit(0.3).talk(c.t).idle(c.t, 0.3).setFace('cry'); } });
  shot({ line: 'I like the real you.', set: caf, cam: frame(TX + 2.6, TZ - 1.4, { size: 'close', side: 18 }),
    act(lt, c) { C.nar.reset().place(TX + 2.6, TZ - 1.4, -0.5).pose({ lean: [12, 0], aR: [50, 20] }).talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'He took a deep breath.', set: caf, cam: { pos: [TX - 0.3, TY + 1.0, TZ + 1.8], look: [TX, TY + 0.85, TZ], fov: 60, blur: 0.6, push: 0.05 },
    act(lt, c) { lunchbox.show().position.set(TX, 2.7, TZ); const s = C.sam.reset().place(TX, TZ, -0.1, TY).size(0.22).sit(0.3).idle(c.t, 0.2).setFace(lt < c.w('deep') ? 'worried' : 'sleepy'); s.hip.position.y += Math.sin(remap(lt, c.w('deep'), c.d) * Math.PI) * 0.12; } });
  shot({ line: 'I hate my haircut.', set: caf, sfx: [['sparkle', 'haircut'], ['rise', 'haircut']], cam: { pos: [TX + 0.6, TY + 2.4, TZ + 4.2], look: [TX, TY + 1.6, TZ], fov: 60, blur: 0.4 },
    act(lt, c) { const a = C.sam.reset().place(TX, TZ - 0.2, 0, TY).pose('open').talk(c.t, lt < c.w('haircut') ? 1 : 0).idle(c.t).setFace('say'); sizeBeat(FC, a, lt, c.w('haircut'), 0.22, 0.5, 'wow', 0); } });
  shot({ line: "And I can't swim.", set: caf, sfx: [['sparkle', 'swim'], ['rise', 'swim'], ['pop', 'swim', 0.6]], cam: frame(TX, TZ - 5.6, { size: 'full', side: -6, dist: 1.0 }),
    act(lt, c) { caf.tables[1].visible = false; const t0 = c.w('swim'), a = C.sam.reset().place(TX, TZ - 5.6, 0).pose('open').talk(c.t, lt < t0 ? 1 : 0).idle(c.t).setFace('say'); sizeBeat(FC, a, lt, t0, 0.5, 1.0, 'laugh', 1); C.nar.reset().place(TX + 3.4, TZ - 6.4, -0.5).idle(c.t).setFace(lt < t0 + 0.3 ? 'worried' : 'wow'); } });
  // payoff of the plant
  shot({ line: 'For the first time, Sam drank from the fountain by himself.', set: hall, sfx: [['ding', 'himself', 0.6]], cam: { pos: [-11.4, 5.2, 5.6], look: [-15.6, 3.8, -3.4], fov: 58, blur: 0.15 },
    act(lt, c) { const t0 = c.w('drank'); const a = H.sam.reset().size(1); if (lt < t0) a.place(-14.2 + Math.min(lt, t0) * 0.6, -1.4, Math.PI * 0.85).walk(c.t, 0.5).setFace('grin'); else { a.place(-16, -3.4, Math.PI).pose({ lean: [30, 0], head: [10, 0, 0] }).idle(c.t); water.show().position.set(-16, 4.4, -4.6); water.rotation.x = 0.8; if (lt > c.w('himself')) { a.reset().place(-16, -3.4, 0.4).pose('cheer').setFace('laugh'); } } } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he said, I drew on the board too.', set: hall, sfx: [['pop', 'too', 0.5]], cam: frame(-13, -1.6, { size: 'close', side: -14 }),
    act(lt, c) { H.sam.reset().size(1).place(-13, -1.6, 0.3).talk(c.t, lt > c.w('i') ? 1 : 0).idle(c.t).setFace(lt < c.w('i') ? 'smirk' : lt < c.w('too') + 0.2 ? 'say' : 'smug'); } });
  shot({ line: 'I stared at him.', set: hall, cam: frame(-10, -0.8, { size: 'face', side: 8, push: 0.07, h: 1.15 }),
    act(lt, c) { N.reset().place(-10, -0.8, -0.2).size(1.15).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'So we told the teacher. Together.', set: cls, cam: frame(1.0, 1.4, { size: 'full', side: -10, low: 0.3, dist: 1.05 }),
    act(lt, c) { cls.desks.visible = false; K.nar.reset().place(2.4, 1.6, -0.3).size(1.15).pose(lt < c.w('together') ? 'idle' : 'cheer').idle(c.t).setFace(lt < c.w('together') ? 'smile' : 'laugh'); K.sam.reset().size(1).place(-0.2, 1.2, 0.3).pose(lt < c.w('together') ? 'idle' : 'cheer').idle(c.t).setFace(lt < c.w('together') ? 'smile' : 'laugh'); } });
});
