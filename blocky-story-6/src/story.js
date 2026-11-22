// story.js: "In this town, every time you worry, you get slower."  Worriers move in slow motion; calm kids zoom.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff, makeEmote } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 61, skin: 'light', hair: 'messy', hairColor: '#2b1b14', top: 'hoodie', topColor: '#e84b6a', bottom: 'jeans', bottomColor: '#4f79a7' },
  ben: { seed: 62, skin: 'deep', hair: 'curly', hairColor: '#17110f', top: 'sweater', topColor: '#9fcfc1', sleeves: 'long', bottom: 'cargo', bottomColor: '#c9b48a', glasses: true, backpack: '#2f7de1' },
  kai: { seed: 63, skin: 'tan', hair: 'spiky', hairColor: '#f2c14e', top: 'jersey', topColor: '#e8632b', number: '0', bottom: 'shorts', bottomColor: '#15151a', shoe: '#e8413c' },
  teacher: { seed: 64, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'cardigan', topColor: '#7b3fc4', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: true, height: 1.12 },
  kidA: { seed: 65, skin: 'fair', hair: 'ponytail', hairColor: '#e8b04a', top: 'tee', topColor: '#2e9e59', bottom: 'skirt', bottomColor: '#ffd23f' },
  kidB: { seed: 66, skin: 'tan', hair: 'short', hairColor: '#3a2416', top: 'stripes', topColor: '#f4f4f4', stripe: '#2f7de1', bottom: 'jeans', bottomColor: '#274b8f' },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const SLOW = 0.22;   // worriers' clock speed
// a school bus with open windows so riders show through
function bus() {
  const g = grp(at(box(14, 3.4, 5, '#ffc61a', 0.2), 0, 2.5, 0), at(box(14.2, 0.5, 5.2, '#1b1d22', 0.1), 0, 0.9, 0), at(box(14, 0.5, 5, '#ffc61a', 0.2), 0, 6.5, 0), at(box(2.6, 3.0, 5, '#ffc61a', 0.2), 5.7, 4.2, 0));
  for (let i = 0; i < 6; i++) for (const z of [-2.45, 2.45]) g.add(at(box(0.35, 2.1, 0.12, '#ffc61a'), -6.8 + i * 2.2, 5.25, z));
  for (const x of [-4.6, 4.2]) for (const z of [-2.5, 2.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 18), mat('#1b1d22')); w.rotation.x = Math.PI / 2; w.position.set(x, 1, z); g.add(w); }
  g.add(at(sign('SCHOOL BUS', 7, 1.0, { bg: '#ffc61a', fg: '#1b1d22' }), -1.6, 2.6, 2.52), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.4)), 7.05, 2.2, 1.6), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.4)), 7.05, 2.2, -1.6));
  g.add(at(box(0.12, 2.8, 2.0, '#1b1d22'), 7.02, 4.2, 0));
  return g;
}

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['CLOCKS', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'NO\nWORRIES!', bannerBg: '#7fd0ff', locker: '#7b3fc4', door: 'ROOM 8', poster: 'TEST\nFRIDAY', posterBg: '#e8413c' });
  const cls = SETS.classroom({ board: ['TEST', 'TOMORROW!'] });
  const caf = SETS.cafeteria({ menu: 'TODAY: SOUP!', rule: 'NO\nRUNNING' });
  const park = SETS.park();
  const S = cast(street, ['nar', 'ben', 'kai', 'kidA', 'kidB']);
  const H = cast(hall, ['nar', 'ben', 'kai', 'kidA', 'kidB']);
  const K = cast(cls, ['nar', 'kai', 'teacher']);
  const C = cast(caf, ['nar', 'ben', 'kai']);
  const P = cast(park, ['nar', 'kidA', 'kidB']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group), dots: makeEmote(set.group, '...', '#2f7de1'), dots2: makeEmote(set.group, '...', '#2f7de1') });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FC = fx(caf), FP = fx(park);
  // RULE FIRES: scream face + sparkles, the "..." of worry pops in (slower) or a dust burst (faster)
  const beat = (F, av, lt, t0, rest, slower, spi = 0) => {
    const dt = lt - t0; if (dt < 0) return false;
    if (dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else av.setFace(rest);
    F.sp[spi].at(dt, av.root.position.toArray(), av.root.scale.x);
    if (!slower) F.puff.at(dt - 0.3, [av.root.position.x, 0, av.root.position.z + 0.6]);
    return true;
  };
  const slowDots = (F, av, lt, which = 'dots') => F[which].at(lt % 1.1, av, 1.1);
  const theBus = bus(); street.group.add(theBus); prop(theBus);
  const milk = prop(grp(box(0.6, 1.0, 0.6, '#f4f4f4'), at(box(0.62, 0.3, 0.62, '#2f95e6'), 0, 0.2, 0))); C.ben.handR.add(milk); milk.position.set(0, -0.3, 0.3); milk.rotation.x = -Math.PI / 2;
  const plane = prop(grp(at(box(1.4, 0.06, 0.6, '#f4f4f4'), 0, 0, 0), at(box(0.06, 0.3, 1.2, '#f4f4f4'), 0, 0.15, -0.2))); park.group.add(plane);
  const book = prop(box(1.6, 0.25, 1.2, '#2f7de1', 0.03)); S.nar.handR.add(book); book.position.set(0, -0.3, 0.5);
  const book2 = prop(box(1.6, 0.25, 1.2, '#e8413c', 0.03)); S.ben.handR.add(book2); book2.position.set(0, -0.3, 0.5);
  const N = H.nar, B = H.ben, KA = H.kai;
  const BX = 2, BZ = 13.5;   // bus stop on the street

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0.1]], cam: { pos: [0, 4.2, 17], look: [0, 4.0, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { S.kai.reset().place(-12 + lt * 22, 4.2, Math.PI / 2).run(c.t, 1.6).setFace('grin'); FS.puff.at((lt * 2) % 0.6, [-12 + lt * 22 - 2, 0, 4.2]); S.kidB.reset().place(-1.5 + lt * 0.4, 2.6, Math.PI / 2).walk(c.t * SLOW, 1).setFace('worried'); slowDots(FS, S.kidB, lt); S.kidA.reset().place(4, 1.6, -0.3).idle(c.t).setFace('smile'); } });
  shot({ line: 'every time you worry,', set: street, cam: frame(1, 4, { size: 'close', side: 12 }),
    act(lt, c) { S.kidB.reset().place(1, 4, 0.2).idle(c.t).setFace(lt < c.w('worry') ? 'neutral' : 'worried'); } });
  shot({ line: 'you get slower.', set: street, sfx: [['sparkle', 'slower'], ['fall', 'slower', 0.7]], cam: frame(1, 4, { size: 'full', side: -8, dist: 1.1 }),
    act(lt, c) { const t0 = c.w('slower'), sl = lt < t0 ? 1 : SLOW, x = 0 + Math.min(lt, t0) * 2.0 + Math.max(0, lt - t0) * 2.0 * SLOW; const a = S.kidB.reset().place(x, 4, Math.PI / 2 - 0.5).walk(c.t * sl, 1).setFace('worried'); beat(FS, a, lt, t0, 'worried', true); if (lt > t0 + 0.4) slowDots(FS, a, lt - t0); } });
  shot({ line: "That's why calm kids zoom around,", set: street, sfx: [['whoosh', 'zoom']], cam: { pos: [-6, 3.6, 13], look: [-6, 3.6, 3], fov: 60, blur: 0.2, push: 0, to: { pos: [6, 3.6, 13], look: [6, 3.6, 3] }, ease: 'lin' },
    act(lt, c) { const x = -14 + lt * 14; S.kai.reset().place(x, 3, Math.PI / 2).run(c.t, 1.8).setFace('laugh'); FS.puff.at((lt * 3) % 0.6, [x - 1.5, 0, 3]); S.kidA.reset().place(x - 5, 4.6, Math.PI / 2).run(c.t + 1, 1.6).setFace('grin'); } });
  shot({ line: 'and worriers', set: street, cam: frame(-4, 3, { size: 'medium', low: 0.42, side: -14 }),
    act(lt, c) { const a = S.kidB.reset().place(-4, 3, -0.2).pose({ aL: [40, -20], aR: [40, -20] }).idle(c.t * SLOW, 2).setFace('worried'); slowDots(FS, a, lt); } });
  shot({ line: 'move like snails.', set: street, cam: { ...frame(-4, 3, { size: 'wide', dist: 0.75 }), blur: 0.08 },
    act(lt, c) { const a = S.kidB.reset().place(-6 + lt * 0.6, 3, Math.PI / 2).walk(c.t * SLOW, 1).setFace('worried'); slowDots(FS, a, lt); S.kai.reset().place(-14 + ((lt * 18) % 30), 5.2, Math.PI / 2).run(c.t, 1.8).setFace('grin'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'I was pretty average.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Ben', set: hall, cam: frame(-7, 0.6, { size: 'close', side: -12 }),
    act(lt, c) { const b = B.reset().place(-7, 0.6, -0.15).pose('wave', remap(lt, 0, c.d)).idle(c.t * SLOW).setFace('worried'); b.armR.rotation.z += Math.sin(c.t * 14 * SLOW) * 0.25; slowDots(FH, b, lt); } });
  shot({ line: 'was the slowest kid in school.', set: hall, sfx: [['whoosh', 'slowest', 0.6]], cam: { ...frame(-5, 1, { size: 'wide', dist: 0.7, side: 10 }), blur: 0.08 },
    act(lt, c) { const b = B.reset().place(-7 + lt * 0.5, 1, Math.PI / 2).walk(c.t * SLOW, 1).setFace('worried'); slowDots(FH, b, lt); KA.reset().place(-16 + ((lt * 20) % 26), 3.2, Math.PI / 2).run(c.t, 1.8).setFace('grin'); H.kidA.reset().place(4 - lt * 7, -1.2, -Math.PI / 2).run(c.t + 2, 1.2).setFace('smile'); } });
  // plant: the bus he always misses
  shot({ line: "He'd never once made it to the bus on time.", set: street, sfx: [['whoosh', 'bus', 0.6]], cam: { pos: [-3.6, 4.2, 0.4], look: [1.0, 4.0, 11], fov: 60, blur: 0.15 },
    act(lt, c) { theBus.show().position.set(BX + lt * 5, 0, BZ); theBus.rotation.y = 0; const b = S.ben.reset().place(-3.4 + lt * 0.6, 6.4, Math.PI / 2).run(c.t * SLOW, 1).setFace('worried'); slowDots(FS, b, lt); if (lt > c.w('bus')) b.pose({ aR: [120, 10] }, remap(lt, c.w('bus'), c.w('bus') + 0.6)); } });
  shot({ line: 'Meanwhile, Kai never worried.', set: hall, sfx: [['whoosh', 'kai']], cam: frame(6, 0.6, { size: 'full', side: -8 }),
    act(lt, c) { const k = remap(lt, 0, 0.35); KA.reset().place(lerp(-4, 6, E.out(k)), 0.6, k < 1 ? Math.PI / 2 : 0).run(c.t, k < 1 ? 1.8 : 0).pose(k < 1 ? 'idle' : 'hips').setFace('grin'); if (k >= 1) KA.idle(c.t); FH.puff.at(lt - 0.3, [6, 0, 1]); } });
  shot({ line: 'Pop quiz? Done.', set: cls, sfx: [['pop', 'done', 0.6]], cam: frame(-3, 1, { size: 'close', side: 14 }),
    act(lt, c) { cls.desks.visible = false; K.kai.reset().place(-3, 1, 0.2).pose(lt < c.w('done') ? { aR: [70, -10] } : { aR: [150, 10] }).idle(c.t).setFace(lt < c.w('done') ? 'serious' : 'grin'); K.kai.armR.rotation.x += lt < c.w('done') ? Math.sin(c.t * 40) * 0.15 : 0; } });
  shot({ line: 'Fire drill? First out.', set: street, sfx: [['whoosh', 'first']], cam: frame(2, 3, { size: 'full', side: 10, dist: 1.05 }),
    act(lt, c) { const k = remap(lt, c.w('first') - 0.2, c.w('first') + 0.2); S.kai.reset().place(lerp(-8, 2, E.out(k)), 3, k < 1 ? Math.PI / 2 : 0).run(c.t, k < 1 ? 1.8 : 0).setFace('laugh'); if (k >= 1) S.kai.pose('cheer'); } });
  shot({ line: 'Lunch line? Already eating.', set: caf, cam: frame(-7.5, 0.4, { size: 'close', side: 34 }),
    act(lt, c) { C.kai.reset().place(-7.5, 0.4, 0.2).pose({ aR: [95, -45] }).idle(c.t).setFace('laugh'); C.kai.armR.rotation.x += Math.sin(c.t * 18) * 0.2; } });

  // ═══════════════ INCITING (classroom) ═══════════════
  shot({ line: 'Then our teacher said, test tomorrow.', set: cls, cam: { pos: [1.6, 5.4, 10], look: [0.4, 5.6, -3], fov: 60, blur: 0.12 },
    act(lt, c) { cls.desks.visible = false; K.teacher.reset().place(-2.6, -2.2, 0.3).pose(lt < c.w('test') ? 'idle' : 'point').talk(c.t, lt > c.w('said') ? 1 : 0).idle(c.t).setFace(lt < c.w('said') ? 'smile' : 'say'); } });
  shot({ line: 'I started worrying,', set: cls, cam: frame(3, 2.6, { size: 'close', side: 12 }),
    act(lt, c) { cls.desks.visible = false; K.nar.reset().place(3, 2.6, -0.3).idle(c.t).setFace(lt < c.w('worrying') ? 'neutral' : 'worried'); } });
  shot({ line: 'and slowed to half speed.', set: cls, sfx: [['sparkle', 'slowed'], ['fall', 'slowed', 0.7]], cam: frame(3, 2.6, { size: 'full', side: -10, dist: 0.95 }),
    act(lt, c) { cls.desks.visible = false; const t0 = c.w('slowed'), a = K.nar.reset().place(3, 2.6, 0).idle(lt < t0 ? c.t : c.t * SLOW).setFace('worried'); beat(FK, a, lt, t0, 'worried', true); if (lt > t0 + 0.4) slowDots(FK, a, lt - t0); } });
  shot({ line: 'Kai lapped me twice.', set: cls, sfx: [['whoosh', 'lapped'], ['whoosh', 'twice']], cam: frame(3, 2.6, { size: 'wide', dist: 0.6, side: 6 }),
    act(lt, c) { cls.desks.visible = false; const a = K.nar.reset().place(3, 2.6, 0.2).idle(c.t * SLOW).setFace('worried'); slowDots(FK, a, lt); const ang = lt * 7; K.kai.reset().place(3 + Math.sin(ang) * 4.2, 2.6 + Math.cos(ang) * 3.0, ang + Math.PI / 2).run(c.t, 1.8).setFace('laugh'); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10 }),
    act(lt, c) { N.reset().place(-2, 1, 0.1).idle(c.t * SLOW).setFace(lt < c.w('idea') ? 'worried' : 'grin'); FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I stopped worrying,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18 }),
    act(lt, c) { N.reset().place(-2, 1, 0.3).pose('think').idle(c.t * SLOW).setFace('smirk'); } });
  shot({ line: "I'd be fast like Kai.", set: hall, sfx: [['whoosh', 'fast']], cam: frame(0, 0.4, { size: 'full', dist: 1.15 }),
    act(lt, c) { const k = remap(lt, c.w('fast'), c.w('fast') + 0.5); const x = lerp(-3, 4, E.inOut(k)); N.reset().place(x, 1.2, k > 0 && k < 1 ? Math.PI / 2 : 0).run(c.t, k > 0 && k < 1 ? 1.8 : 0).setFace(k > 0 ? 'laugh' : 'grin'); if (k >= 1) N.pose('cheer'); KA.reset().place(1.2, -1.4, 0).pose('hips').idle(c.t).setFace('smug'); } });
  shot({ line: "I told myself, don't worry. Still slow.", set: hall, cam: frame(-10, -3.2, { size: 'close', side: 12 }),
    act(lt, c) { const a = N.reset().place(-10, -3.2, 0.1).pose('open').talk(c.t * SLOW, 3).idle(c.t * SLOW).setFace(lt < c.w('still') ? 'say' : 'sus'); slowDots(FH, a, lt); } });
  shot({ line: 'I tried running.', set: hall, cam: frame(2, 0.6, { size: 'full', side: 8, dist: 1.1 }),
    act(lt, c) { const a = N.reset().place(0 + lt * 0.5, 0.6, Math.PI / 2).run(c.t * SLOW, 1).setFace('worried'); slowDots(FH, a, lt); } });
  shot({ line: 'Even slower.', set: hall, cam: frame(2, 0.6, { size: 'face', side: -10, push: 0.06 }),
    act(lt, c) { const a = N.reset().place(2, 0.6, 0).idle(c.t * 0.1, 0.4).setFace('blank'); slowDots(FH, a, lt * 0.5); } });

  // ═══════════════ ACCIDENTAL SUCCESS (park) ═══════════════
  shot({ line: 'Then a kid asked me to play tag,', set: park, cam: frame(0, 1.6, { size: 'medium', side: 12, dist: 1.3 }),
    act(lt, c) { const a = P.nar.reset().place(-1.4, 1.8, 0.5).idle(c.t * SLOW).setFace(lt < c.w('tag') ? 'worried' : 'neutral'); P.kidA.reset().place(1.8, 1.4, -0.6).pose(lt < c.w('tag') ? 'open' : { aR: [90, -30] }).talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'and I forgot all about the test.', set: park, sfx: [['sparkle', 'forgot'], ['pop', 'forgot', 0.6]], cam: frame(-1.4, 1.8, { size: 'full', side: -8, dist: 1.0 }),
    act(lt, c) { const t0 = c.w('forgot'), a = P.nar.reset().place(-1.4, 1.8, 0).idle(lt < t0 ? c.t * SLOW : c.t).setFace('worried'); beat(FP, a, lt, t0, 'laugh', false); } });
  shot({ line: 'I zoomed off.', set: park, sfx: [['whoosh', 'zoomed']], cam: lt => ({ pos: [-6 + lt * 16 - 2, 4.2, 12], look: [-6 + lt * 16, 4, 2], fov: 60, blur: 0.15, push: 0 }),
    act(lt, c) { const x = -6 + lt * 16; P.nar.reset().place(x, 2, Math.PI / 2).run(c.t, 1.8).setFace('laugh'); FP.puff.at((lt * 3) % 0.6, [x - 1.5, 0, 2]); P.kidA.reset().place(x - 4, 3, Math.PI / 2).run(c.t + 1, 1.6).setFace('laugh'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I kept busy.', set: park, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { P.nar.reset().place(0, 1.4, 0.1).pose('cheer').jump((lt * 2.4) % 1, 0.8).setFace('laugh'); } });
  shot({ line: 'I played tag,', set: park, sfx: [['whoosh', 'tag', 0.6]], cam: frame(6, 1, { size: 'full', side: -12, dist: 1.2 }),
    act(lt, c) { P.nar.reset().place(3.8 + lt * 6, 1, Math.PI / 2).run(c.t, 1.6).pose({ aR: [100, 0] }).setFace('laugh'); P.kidB.reset().place(6.4 + lt * 5.2, 1.6, Math.PI / 2).run(c.t + 1, 1.6).setFace('laugh'); } });
  shot({ line: 'jumped rope,', set: hall, cam: frame(4, 0.6, { size: 'full', side: 10, dist: 1.0 }),
    act(lt, c) { const k = (lt * 2.4) % 1; N.reset().place(4, 0.6, 0).pose({ aL: [30, 40], aR: [30, 40] }).jump(k, 0.9).setFace('laugh'); N.armL.rotation.x = N.armR.rotation.x = -Math.sin(k * Math.PI * 2) * 0.6; } });
  shot({ line: 'and threw paper airplanes.', set: park, sfx: [['whoosh', 'airplanes', 0.5]], cam: frame(-3, 1.2, { size: 'medium', side: -14, dist: 1.2 }),
    act(lt, c) { const t0 = c.w('paper'), k = remap(lt, t0, t0 + 1.0); P.nar.reset().place(-3, 1.2, 0.5).pose(lt < t0 ? { aR: [150, 0] } : { aR: [80, 0] }).idle(c.t).setFace('laugh'); plane.show().position.set(-2.6 + k * 6, 6.2 + Math.sin(k * Math.PI) * 1.2, 1.2 - k * 2); plane.rotation.set(0, -Math.PI / 2 + 0.3, 0.2); } });
  shot({ line: 'By lunch, I was almost as fast as Kai.', set: caf, sfx: [['whoosh', 'fast'], ['whoosh', 'kai', 0.6]], cam: { ...frame(-7.5, 0, { size: 'wide', dist: 0.6 }), blur: 0.08 },
    act(lt, c) { const ang = lt * 5; C.nar.reset().place(-7.5 + Math.sin(ang) * 3.6, 0 + Math.cos(ang) * 1.6, ang + Math.PI / 2).run(c.t, 1.8).setFace('laugh'); C.kai.reset().place(-7.5 + Math.sin(ang + 2.4) * 3.6, Math.cos(ang + 2.4) * 1.6, ang + 2.4 + Math.PI / 2).run(c.t + 1, 1.8).setFace('grin'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I saw Ben,', set: caf, cam: frame(-7.5, 0.4, { size: 'close', side: -14 }),
    act(lt, c) { const a = C.nar.reset().place(-7.5, 0.4, -0.2).idle(c.t); const k = remap(lt, c.w('saw'), c.w('saw') + 0.2); a.head.rotation.y += 0.7 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'still opening his milk, alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [-0.6, 6.4, 13], look: [-2.4, 3.6, 3.4], fov: 52, blur: 0.04, push: 0.02 },
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const b = C.ben.reset().place(-2.4, 3.4, 0).sit(1.5).pose({ aR: [70, -20], aL: [70, -20] }).idle(c.t * SLOW).setFace('worried'); b.armL.rotation.z += Math.sin(c.t * 2 * SLOW) * 0.1; milk.show(); slowDots(FC, b, lt); } });
  shot({ line: "I'd spent all day zooming", set: caf, cam: frame(-7.5, 0.4, { size: 'close', side: 16 }),
    act(lt, c) { C.nar.reset().place(-7.5, 0.4, -0.3).idle(c.t, 0.5).setFace(lt < c.w('zooming') ? 'worried' : 'sad'); } });
  shot({ line: 'while my best friend was stuck in slow motion.', set: caf, cam: frame(-7.5, 0.4, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { C.nar.reset().place(-7.5, 0.4, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: "I sat down. What's wrong?", set: caf, cam: { pos: [-0.9, 7.2, 12.2], look: [-0.9, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).idle(c.t).setFace(lt < c.w("what's") ? 'worried' : 'say').talk(c.t, lt > c.w("what's") ? 1 : 0); const b = C.ben.reset().place(-2.4, 3.4, 0.3).sit(1.5).pose({ aR: [70, -20], aL: [70, -20] }).idle(c.t * SLOW).setFace('worried'); milk.show(); slowDots(FC, b, lt); } });
  shot({ line: 'What if I miss the bus again?', set: caf, cam: frame(-2.4, 3.4, { size: 'close', side: -12 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const b = C.ben.reset().place(-2.4, 3.4, 0.3).sit(1.5).talk(c.t * SLOW, 3).idle(c.t * SLOW).setFace(lt < c.w('bus') ? 'worried' : 'cry'); slowDots(FC, b, lt); } });
  shot({ line: "Then we'll walk. Together.", set: caf, cam: frame(0.2, 3.4, { size: 'close', side: 18 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).pose({ aR: [60, 30] }, remap(lt, c.w('together'), c.w('together') + 0.2)).talk(c.t, lt < c.w('together') + 0.3 ? 1 : 0).idle(c.t).setFace(lt < c.w('together') + 0.3 ? 'say' : 'smile'); } });
  shot({ line: 'He smiled, a little faster.', set: caf, sfx: [['sparkle', 'smiled'], ['pop', 'faster', 0.5]], cam: frame(-2.4, 3.4, { size: 'close', side: 10 }),
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const t0 = c.w('smiled'), b = C.ben.reset().place(-2.4, 3.4, 0).sit(1.5).idle(lt < t0 ? c.t * SLOW : c.t * 0.6).setFace(lt < t0 ? 'worried' : 'smile'); beat(FC, b, lt, t0, 'smile', false); } });
  shot({ line: 'Then he laughed. Full speed.', set: caf, sfx: [['sparkle', 'laughed'], ['whoosh', 'full']], cam: { pos: [-1.6, 7.0, 12.0], look: [-1.2, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; const t0 = c.w('laughed'), b = C.ben.reset().place(-2.4, 3.4, 0).sit(1.5).idle(c.t).setFace('smile'); if (lt > t0) { b.hip.position.y += Math.abs(Math.sin(c.t * 15)) * 0.08; } beat(FC, b, lt, t0, 'laugh', false, 1); C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).idle(c.t).setFace(lt < t0 + 0.3 ? 'smile' : 'laugh'); } });
  // payoff of the plant
  shot({ line: 'And for the first time ever, Ben caught the bus.', set: street, sfx: [['whoosh', 'caught'], ['ding', 'bus', 0.6]], cam: { pos: [-8.5, 5.0, 1.2], look: [BX + 3.5, 3.6, BZ - 3], fov: 58, blur: 0.1 },
    act(lt, c) { theBus.show().position.set(BX, 0, BZ); const t0 = c.w('caught'), k = remap(lt, t0 - 0.5, t0 + 0.1); const b = S.ben.reset(); if (k < 1) b.place(lerp(0, BX + 7.2, E.inOut(k)), lerp(6.4, BZ - 3.4, E.inOut(k)), Math.PI / 2 + 0.4).run(c.t, 1.8).setFace('laugh'); else b.place(BX + 7.2, BZ - 3.4, -0.3).pose('cheer').idle(c.t).setFace('laugh'); if (k > 0 && k < 1) FS.puff.at((lt * 3) % 0.6, [b.root.position.x - 1.5, 0, b.root.position.z]); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he said, wait, test tomorrow?', set: street, sfx: [['pop', 'test', 0.5]], cam: { pos: [BX - 1.6, 5.8, BZ + 6.4], look: [BX - 1.6, 5.4, BZ], fov: 58, blur: 0.5 },
    act(lt, c) { theBus.show().position.set(BX, 0, BZ); S.ben.reset().place(BX - 1.6, BZ, 0, 0.6).sit(2.0).talk(c.t, lt > c.w('wait') ? 1 : 0).idle(c.t).setFace(lt < c.w('wait') ? 'laugh' : lt < c.w('test') ? 'say' : 'shock'); } });
  shot({ line: 'We both slowed down.', set: street, sfx: [['sparkle', 'slowed'], ['fall', 'slowed', 0.6]], cam: { pos: [BX - 0.4, 5.8, BZ + 9], look: [BX - 0.4, 5.2, BZ], fov: 58, blur: 0.3 },
    act(lt, c) { theBus.show().position.set(BX, 0, BZ); const t0 = c.w('slowed'); const b = S.ben.reset().place(BX - 1.6, BZ, 0.2, 0.6).sit(2.0).idle(lt < t0 ? c.t : c.t * SLOW).setFace('worried'); const n = S.nar.reset().place(BX + 1.0, BZ, -0.2, 0.6).sit(2.0).idle(lt < t0 ? c.t : c.t * SLOW).setFace('worried'); beat(FS, b, lt, t0, 'worried', true, 0); beat(FS, n, lt, t0 + 0.05, 'worried', true, 1); if (lt > t0 + 0.4) { slowDots(FS, b, lt - t0); FS.dots2.at((lt - t0) % 1.1, n, 1.1); } } });
  shot({ line: 'So we studied on the bus.', set: street, cam: { pos: [BX + 1.0, 4.4, BZ + 8.0], look: [BX + 0.2, 5.6, BZ], fov: 50, blur: 0.4 },
    act(lt, c) { theBus.show().position.set(BX + lt * 1.2, 0, BZ); const n = S.nar.reset().place(BX + 1.0 + lt * 1.2, BZ, -0.3, 0.6).sit(2.0).pose({ aR: [40, -20] }).idle(c.t).setFace(lt < c.w('studied') ? 'smile' : 'grin'); book.show(); S.ben.reset().place(BX - 1.6 + lt * 1.2, BZ, 0.3, 0.6).sit(2.0).pose({ aR: [40, -20] }).idle(c.t).setFace('laugh'); book2.show(); } });
});
