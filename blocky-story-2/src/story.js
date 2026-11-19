// story.js: "In this town, every time you laugh, you float a little higher."
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, glow, mat, PRE } from './util.js';
import * as THREE from 'three';

// ── cast: one look per character for the whole video
const LOOK = {
  nar: { seed: 21, skin: 'tan', hair: 'messy', hairColor: '#2b1b14', top: 'hoodie', topColor: '#f08a1c', bottom: 'jeans', bottomColor: '#4f79a7' },
  owen: { seed: 22, skin: 'light', hair: 'swoop', hairColor: '#141414', top: 'sweater', topColor: '#2b3a6b', sleeves: 'long', bottom: 'slacks', bottomColor: '#5a5f6a', glasses: true },
  mia: { seed: 23, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'stripes', topColor: '#ffd23f', stripe: '#ff6fae', bottom: 'skirt', bottomColor: '#2f95e6' },
  teacher: { seed: 24, skin: 'fair', hair: 'bob', hairColor: '#9a6a3a', top: 'cardigan', topColor: '#7b3fc4', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: '#7b3fc4', height: 1.12 },
  tiny: { seed: 25, skin: 'deep', hair: 'afro', hairColor: '#17110f', top: 'tee', topColor: '#2e9e59', bottom: 'shorts', bottomColor: '#274b8f', height: 0.62 },
  comic: { seed: 26, skin: 'light', hair: 'bald', top: 'suit', topColor: '#e8413c', tie: '#ffd23f', sleeves: 'long', bottom: 'slacks', bottomColor: '#1c1c22' },
  grump: { seed: 27, skin: 'tan', hair: 'buzz', hairColor: '#555555', top: 'vest', topColor: '#6a6e76', bottom: 'cargo', bottomColor: '#4a4a4a', cap: '#2b2f38' },
  kidA: { seed: 28, skin: 'fair', hair: 'ponytail', hairColor: '#e8b04a', top: 'hoodie', topColor: '#ff6fae', bottom: 'joggers', bottomColor: '#15151a' },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
// sfx entries may name the nth occurrence of a word: ['sparkle', ['laugh', 1]]
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
// ── props (hidden every frame unless a shot calls show())
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
function phone(av) { const g = grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.2)), 0, 0.08, 0)); g.position.set(0, -0.2, 0.32); av.handR.add(g); return prop(g); }
function bookProp(av) { const g = grp(box(2.2, 0.3, 1.5, '#e8413c', 0.04), at(box(2.0, 0.32, 1.3, '#fffbe8'), 0, 0, 0.12)); g.position.set(1.5, -0.25, 0.25); g.rotation.x = 0.5; av.handR.add(g); return prop(g); }
const ballMesh = () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), mat('#f07a1c')); m.castShadow = true; return m; };

// ── beats
const bob = (t, s = 0) => Math.sin(t * 2.2 + s) * 0.14;
// the rule fires: av floats from y0 to y1 with the scream face + sparkles, then rest face. Call last in act.
function rise(av, sp, lt, t0, y0, y1, rest = 'laugh') {
  const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.45)), y = lerp(y0, y1, k);
  av.root.position.y = y;
  if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); }
  else if (dt >= 0.47) av.setFace(rest);
  if (sp) sp.at(dt, [av.root.position.x, y, av.root.position.z], av.root.scale.x);
  return y;
}
const laughing = (av, t, amt = 1) => { av.hip.position.y += Math.abs(Math.sin(t * 15)) * 0.09 * amt; av.head.rotation.x -= 0.22 * amt; av.armL.rotation.x -= 0.5 * amt; av.armR.rotation.x -= 0.5 * amt; return av.setFace('laugh'); };
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile', y = 0) => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2, y).walk(t + x0, speed).setFace(face);

start(() => {
  // ── sets
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['JOKES', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'KEEP\nSMILING!', bannerBg: '#7fd0ff', locker: '#e84b4b', door: 'ROOM 9', poster: 'JOKE\nCLUB', posterBg: '#2e9e59' });
  const cls = SETS.classroom({ board: ['FUNNY', 'Chapter 3'] });
  const caf = SETS.cafeteria({ menu: 'TODAY: PANCAKES!', rule: 'NO\nGIGGLING' });
  const S = cast(street, ['kidA', 'comic', 'grump', 'mia', 'nar', 'owen']);
  const H = cast(hall, ['nar', 'owen', 'mia', 'tiny', 'kidA']);
  const K = cast(cls, ['nar', 'mia', 'teacher', 'kidA']);
  const C = cast(caf, ['nar', 'owen', 'mia', 'kidA']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FC = fx(caf);
  const sPhone = phone(S.kidA), hPhoneN = phone(H.nar), hBook = bookProp(K.nar);
  const peel = prop(grp(at(box(0.9, 0.12, 0.5, '#ffe14a', 0.05), 0, 0.06, 0), at(box(0.3, 0.1, 0.8, '#ffe14a', 0.05), 0.4, 0.05, 0.3, 0.6), at(box(0.3, 0.1, 0.8, '#ffe14a', 0.05), -0.4, 0.05, 0.3, -0.6))); cls.group.add(peel);
  const ballTop = prop(ballMesh()); hall.group.add(ballTop); ballTop.position.set(-7.4, 7.15, -5.2);
  const ballHand = ballMesh(); ballHand.position.set(0, -0.4, 0.2); H.owen.handR.add(ballHand); prop(ballHand);
  const tray = prop(grp(at(box(2.4, 0.1, 1.6, '#ff9f2e', 0.04), 0, 0, 0), at(box(1.2, 0.25, 0.9, '#f2c14e', 0.12), 0, 0.17, 0))); caf.group.add(tray);
  const hideDesks = () => { cls.desks.visible = false; };
  caf.reset = () => { caf.tables[1].visible = true; };
  const hideT = () => { caf.tables[1].visible = false; };

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 3.6, 16.5], look: [0, 5.2, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) {
      laughing(S.comic.reset().place(-3.4, 2.6, 0.3, 6.2 + bob(c.t)).pose('open').idle(c.t), c.t);
      S.mia.reset().place(3.8, 1.6, -0.3, 4.4 + bob(c.t, 2)).pose('wave').idle(c.t).setFace('laugh');
      S.grump.reset().place(-0.4, 4.4, 0).pose('hips').idle(c.t).setFace('mad');
      walkX(S.kidA, -9, 5.2, 1, lt, c.t, 0.8, 'happy');
    } });
  shot({ line: 'every laugh makes', set: street, sfx: [['pop', 'laugh', 0.5]], cam: frame(0, 3, { size: 'close', side: 12 }),
    act(lt, c) { const a = S.kidA.reset().place(0, 3, 0.2).pose({ aR: [96, -12] }).idle(c.t).setFace(lt < c.w('laugh') ? 'smile' : 'laugh'); if (lt > c.w('laugh')) laughing(a, c.t); sPhone.show(); } });
  shot({ line: 'you float higher.', set: street, sfx: [['sparkle', 'float'], ['rise', 'float']], cam: { ...frame(0, 3, { size: 'full', side: -8 }), to: { look: [0, 5.4, 3] }, ease: 'out' },
    act(lt, c) { const a = S.kidA.reset().place(0, 3, -0.1).pose({ aR: [96, -12] }).idle(c.t); laughing(a, c.t); sPhone.show(); rise(a, FS.sp[0], lt, c.w('float'), 0, 2.4); } });
  // world: comedians on the rooftops, grumpy people glued to the pavement
  shot({ line: "That's why comedians live on rooftops,", set: street, cam: { pos: [-11.4, 2.6, 8.4], look: [-15.0, 16.4, -4], fov: 62, blur: 0.12, push: 0.02 },
    act(lt, c) { laughing(S.comic.reset().place(-16.8, -3.4, 0.2, 17.4 + bob(c.t)).pose('open').idle(c.t), c.t); S.mia.reset().place(-13.4, -4.4, -0.2, 17.6 + bob(c.t, 1)).pose('cheer').idle(c.t).setFace('laugh'); } });
  shot({ line: 'and grumpy people', set: street, cam: frame(-4, 2, { size: 'medium', low: 0.42, side: -14 }),
    act(lt, c) { S.grump.reset().place(-4, 2, -0.2).pose({ aL: [60, -30], aR: [60, -30] }).idle(c.t, 0.4).setFace('mad'); } });
  shot({ line: 'never leave the ground.', set: street, sfx: [['thud', 'ground']], cam: { ...frame(-4, 2, { size: 'full', side: 10, low: 0.3 }), blur: 0.1 },
    act(lt, c) { const t0 = c.w('ground'), k = remap(lt, t0 - 0.35, t0); const g = S.grump.reset().place(-4, 2, 0.2).pose('hips').jump(k, 0.6).setFace('mad'); if (k < 1 && k > 0) g.pose({ lL: 40 }); FS.puff.at(lt - t0, [-4, 0, 2.5]); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'I floated about knee high.', set: hall, cam: frame(0, 1, { size: 'full', y: 1.8, side: -6, dist: 0.9 }),
    act(lt, c) { H.nar.reset().place(0, 1, 0.1, 1.8 + bob(c.t)).pose('open').idle(c.t).setFace('grin'); walkX(H.kidA, -6, -1.6, 1, lt, c.t, 0.8, 'smile'); } });
  shot({ line: 'But my best friend Owen', set: hall, cam: frame(-7.4, 0.6, { size: 'close', side: -12 }),
    act(lt, c) { H.owen.reset().place(-7.4, 0.6, -0.15).idle(c.t, 0.4).setFace('serious'); } });
  shot({ line: 'had never laughed once.', set: hall, cam: frame(-7.4, 0.6, { size: 'face', side: 14, push: 0.06 }),
    act(lt, c) { H.owen.reset().place(-7.4, 0.6, 0.2).idle(c.t, 0.2).setFace(lt < c.w('once') ? 'serious' : 'sus'); } });
  // plant: his ball has been stuck on top of the lockers for a year
  shot({ line: 'His ball was stuck on the lockers for a year.', set: hall, sfx: [['boing', 'stuck', 0.6], ['boing', 'lockers', 0.6]], cam: { pos: [-5.4, 3.6, 7.5], look: [-7.4, 5.6, -3.5], fov: 62, blur: 0.15 },
    act(lt, c) {
      ballTop.show();
      const ph = (lt * 1.6) % 1, a = H.owen.reset().place(-7.4, -3.6, Math.PI).pose('reach').jump(ph, 1.1).setFace('serious');
      if (lt > c.w('year')) { a.reset().place(-7.4, -3.6, Math.PI * 0.85).pose('slump').setFace('sad'); }
    } });
  shot({ line: 'Meanwhile, Mia laughed at everything.', set: hall, cam: { pos: [6, 4.2, 11], look: [6, 9.4, -1], fov: 62, blur: 0.15, push: 0.02 },
    act(lt, c) { laughing(H.mia.reset().place(6, -1, 0, 7.2 + bob(c.t)).pose('open').idle(c.t), c.t); } });
  shot({ line: 'Bad cartoons,', set: hall, cam: frame(6, -3, { size: 'close', y: 7.2, side: 14 }),
    act(lt, c) { const m = H.mia.reset().place(6, -3, 0.3, 7.2 + bob(c.t)).pose('shrug').idle(c.t); laughing(m, c.t); } });
  shot({ line: 'loud sneezes,', set: hall, sfx: [['pop', 'sneezes', 0.7]], cam: { pos: [2.6, 5.2, 9], look: [3.6, 6.4, -1], fov: 62, blur: 0.2 },
    act(lt, c) { const t0 = c.w('sneezes'), s = remap(lt, t0, t0 + 0.12); H.kidA.reset().place(2.2, 0.2, 0.4).pose({ head: [-25 + s * 45, 0, 0] }).setFace(lt < t0 ? 'sleepy' : 'shock'); FH.puff.at(lt - t0, [2.2, 4.6, 1.2]); laughing(H.mia.reset().place(6, -1, -0.4, 7.2 + bob(c.t)).pose('open').idle(c.t).lookAt(2.2, 0.2), c.t); } });
  shot({ line: 'and her own shoes.', set: hall, cam: { pos: [7.6, 7.4, 8.6], look: [6, 9.4, -1], fov: 60, blur: 0.3 },
    act(lt, c) { const m = H.mia.reset().place(6, -1, -0.1, 7.2 + bob(c.t)).pose({ lL: 30, lR: -10, head: [30, 0, 0] }).idle(c.t); laughing(m, c.t, 0.8); m.head.rotation.x = 0.5; } });

  // ═══════════════ INCITING MOMENT (classroom) ═══════════════
  shot({ line: 'Then our teacher', set: cls, cam: { pos: [0, 6, 18], look: [0, 4.6, 0], fov: 60, blur: 0.06 },
    act(lt, c) { hideDesks(); K.teacher.reset().place(-2, -2.6, 0.2).pose('point').idle(c.t).setFace('smile'); K.nar.reset().place(4.4, 3.6, -0.4, 1.8 + bob(c.t)).idle(c.t).setFace('smile'); K.kidA.reset().place(-6, 3.4, 0.4).idle(c.t).setFace('neutral'); K.mia.reset().place(8, 0, -0.3, 7.4 + bob(c.t)).idle(c.t).setFace('grin'); } });
  shot({ line: 'slipped on a banana peel.', set: cls, sfx: [['whoosh', 'slipped'], ['thud', 'peel']], cam: frame(-1, -1, { size: 'full', h: 1.12, side: 10, dist: 0.95 }),
    act(lt, c) {
      hideDesks(); const t0 = c.w('slipped'), k = remap(lt, t0, t0 + 0.4), x = -3.4 + Math.min(lt, t0) * 1.6;
      peel.show().position.set(-3.4 + t0 * 1.6 + 0.6, 0, -1);
      const T = K.teacher.reset().place(x, -1, Math.PI / 2 - 0.4);
      if (lt < t0) T.walk(c.t, 0.6).setFace('smile');
      else { T.pose({ lL: 80, lR: 50, aL: [150, 40], aR: [150, 40] }).setFace('shock'); T.root.rotation.x = -E.out(k) * 1.35; T.root.position.y = Math.sin(k * Math.PI) * 1.4; FK.puff.at(lt - t0 - 0.4, [x, 0, -1]); }
    } });
  shot({ line: 'I laughed so hard I hit the ceiling.', set: cls, sfx: [['sparkle', 'laughed'], ['rise', 'laughed'], ['thud', 'ceiling', 0.8]], cam: { pos: [4.4, 4.2, 12.5], look: [4.4, 7.4, 3.6], fov: 62, blur: 0.12, push: 0, to: { look: [4.4, 10.2, 3.6] }, t0: 0.15, ease: 'out' },
    act(lt, c) {
      hideDesks(); const a = K.nar.reset().place(4.4, 3.6, 0, 1.8).idle(c.t); laughing(a, c.t);
      const y = rise(a, FK.sp[0], lt, c.w('laughed'), 1.8, 7.6); const hit = c.w('ceiling');
      if (lt > hit) { a.root.position.y = 7.6 - Math.max(0, 0.4 - (lt - hit)) * 0.6; a.setFace('worried'); }
    } });
  shot({ line: 'Mia waved. Hi, neighbor.', set: cls, cam: { pos: [6.2, 9.4, 11], look: [6.2, 10.1, 3], fov: 60, blur: 0.4 },
    act(lt, c) { K.nar.reset().place(4.0, 3.6, 0.3, 7.6 + bob(c.t)).idle(c.t).setFace('worried'); const m = K.mia.reset().place(8.4, 3.0, -0.5, 7.4 + bob(c.t, 2)).pose('wave', remap(lt, 0, 0.2)).idle(c.t).setFace(lt < c.w('hi') ? 'grin' : 'say').talk(c.t, lt > c.w('hi') ? 1 : 0); m.armR.rotation.z += Math.sin(c.t * 14) * 0.25; hideDesks(); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', y: 1.8, side: -10 }),
    act(lt, c) { H.nar.reset().place(-2, 1, 0.1, 1.8 + bob(c.t)).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin'); FH.bulb.at(lt - c.w('idea'), H.nar); } });
  shot({ line: 'If I laughed all day,', set: hall, cam: frame(-2, 1, { size: 'face', y: 1.8, side: 18 }),
    act(lt, c) { H.nar.reset().place(-2, 1, 0.3, 1.8 + bob(c.t)).pose('think').idle(c.t).setFace('smirk'); } });
  shot({ line: "I'd float higher than Mia.", set: hall, sfx: [['rise', 'higher']], cam: { pos: [1, 3.4, 12], look: [0, 7.4, -1], fov: 62, blur: 0.12 },
    act(lt, c) { H.mia.reset().place(2.6, -1.4, -0.3, 7.0 + bob(c.t)).idle(c.t).setFace(lt < c.w('mia') ? 'grin' : 'shock'); const a = H.nar.reset().place(-1.6, -0.4, 0.2).pose('cheer').idle(c.t).setFace('grin'); a.root.position.y = lerp(1.8, 7.6, E.out(remap(lt, c.w('higher') - 0.1, c.w('mia') + 0.2))); } });
  shot({ line: 'I watched funny videos. Nothing.', set: hall, cam: frame(-10, -3.2, { size: 'close', y: 1.8, side: 12 }),
    act(lt, c) { H.nar.reset().place(-10, -3.2, 0.1, 1.8 + bob(c.t)).pose({ aR: [96, -12] }).idle(c.t).setFace(lt < c.w('nothing') ? 'smile' : 'blank'); hPhoneN.show(); } });
  shot({ line: 'I tickled myself.', set: hall, cam: frame(3, 0.6, { size: 'medium', y: 1.8, side: 8 }),
    act(lt, c) { const s = Math.sin(c.t * 24) * 10; H.nar.reset().place(3, 0.6, 0, 1.8 + bob(c.t)).pose({ aL: [40 + s, -40], aR: [40 - s, -40] }).idle(c.t).setFace('smirk'); } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(3, 0.6, { size: 'face', y: 1.8, side: -10, push: 0.06 }),
    act(lt, c) { H.nar.reset().place(3, 0.6, 0, 1.8 + bob(c.t)).pose({ aL: [40, -40], aR: [40, -40] }).idle(c.t, 0.3).setFace('sus'); } });

  // ═══════════════ ACCIDENTAL SUCCESS ═══════════════
  shot({ line: 'Then a kid told me the worst joke ever,', set: hall, cam: frame(9.2, 1.4, { size: 'medium', y: 0, low: 0.5, side: 18, dist: 0.95 }),
    act(lt, c) { H.tiny.reset().place(9.6, 1.6, -0.6).pose('open').talk(c.t).idle(c.t).setFace('say'); H.nar.reset().place(7.4, 0.6, 0.6, 1.8 + bob(c.t)).idle(c.t).setFace(lt < c.w('worst') ? 'smile' : 'neutral').lookAt(9.6, 1.6); } });
  shot({ line: "and I couldn't stop laughing.", set: hall, sfx: [['sparkle', 'stop'], ['rise', 'stop']], cam: { pos: [7.4, 4.4, 10.5], look: [7.4, 5.2, 0.6], fov: 62, blur: 0.2, push: 0, to: { look: [7.4, 8.4, 0.6] }, t0: 0.2, ease: 'out' },
    act(lt, c) { const a = H.nar.reset().place(7.4, 0.6, 0.2, 1.8).idle(c.t); laughing(a, c.t); rise(a, FH.sp[0], lt, c.w('stop'), 1.8, 4.6); H.tiny.reset().place(9.6, 1.6, -0.6).idle(c.t).setFace('grin').lookAt(7.4, 0.6); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I read joke books,', set: cls, cam: frame(-12, 0.6, { size: 'close', y: 4.6, side: 14 }),
    act(lt, c) { hideDesks(); const a = K.nar.reset().place(-12, 0.6, 0.3, 4.6 + bob(c.t)).pose({ aR: [42, -30], aL: [42, -30] }).idle(c.t); if (lt > 0.4) laughing(a, c.t, 0.6); else a.setFace('smile'); hBook.show(); } });
  shot({ line: 'watched clown shows,', set: hall, cam: frame(-14, 0.4, { size: 'close', y: 5.2, side: -16 }),
    act(lt, c) { const a = H.nar.reset().place(-14, 0.4, -0.3, 5.2 + bob(c.t)).pose({ aR: [96, -12] }).idle(c.t); laughing(a, c.t); hPhoneN.show(); } });
  shot({ line: 'and laughed at everything.', set: caf, cam: frame(-7.5, 1, { size: 'full', y: 5.6, side: 8, low: -0.1 }),
    act(lt, c) { laughing(C.nar.reset().place(-7.5, 1, 0.1, 5.6 + bob(c.t)).pose('open').idle(c.t), c.t); } });
  shot({ line: 'By lunchtime I was almost as high as Mia.', set: caf, cam: { pos: [1, 8.4, 13], look: [1, 9.6, 0], fov: 62, blur: 0.2, push: 0.02 },
    act(lt, c) { laughing(C.nar.reset().place(-1.4, 0.4, 0.2, 6.6 + bob(c.t)).pose('cheer').idle(c.t), c.t); C.mia.reset().place(3.4, -0.6, -0.3, 7.4 + bob(c.t, 2)).pose('wave').idle(c.t).setFace('laugh'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I looked down', set: caf, cam: frame(-1.4, 0.4, { size: 'close', y: 6.6, side: -14 }),
    act(lt, c) { const a = C.nar.reset().place(-1.4, 0.4, 0, 6.6 + bob(c.t)).idle(c.t); const k = remap(lt, c.w('looked'), c.w('looked') + 0.2); a.head.rotation.x += 0.5 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'and saw Owen eating alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [0.6, 9.8, 12.5], look: [-2.4, 3.2, 3.6], fov: 58, blur: 0.04, push: 0.02 },
    act(lt, c) { C.owen.reset().place(-2.4, 3.4, 0).sit(1.5).pose('slump').idle(c.t, 0.3).setFace('sad'); tray.show().position.set(-2.4, 2.84, 4.9); C.kidA.reset().place(15, 3.4, 0).sit(1.5).idle(c.t).setFace('smile'); } });
  shot({ line: "I'd spent all day laughing", set: caf, cam: frame(-1.4, 0.4, { size: 'close', y: 6.6, side: 16 }),
    act(lt, c) { C.nar.reset().place(-1.4, 0.4, -0.3, 6.6 + bob(c.t)).idle(c.t, 0.5).setFace(lt < c.w('laughing') ? 'worried' : 'sad'); } });
  shot({ line: "while my best friend didn't even smile.", set: caf, sfx: [['fall', 'smile', 0.6]], cam: frame(-1.4, 0.4, { size: 'face', y: 6.0, side: -6, push: 0.05 }),
    act(lt, c) { const a = C.nar.reset().place(-1.4, 0.4, -0.1, 6.6 - remap(lt, c.w('smile'), c.d) * 1.2 + bob(c.t)).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I floated down and told him my worst joke.', set: caf, sfx: [['fall', 'down', 0.7]], cam: frame(-0.6, 0.6, { size: 'full', side: 4, dist: 0.85 }),
    act(lt, c) { hideT(); const k = E.inOut(remap(lt, 0, c.w('told'))); C.nar.reset().place(1.2, 0.8, -0.5, lerp(5, 0.9, k) + bob(c.t) * 0.5).pose(k < 1 ? 'idle' : 'open').idle(c.t).setFace(lt < c.w('told') ? 'smile' : 'say').talk(c.t, lt > c.w('told') ? 1 : 0); C.owen.reset().place(-2.2, 0.4, 0.4).idle(c.t, 0.3).setFace('serious').lookAt(1.2, 0.8); } });
  shot({ line: 'Why did the cookie go to the doctor?', set: caf, cam: frame(1.2, 0.8, { size: 'close', y: 0.9, side: 16 }),
    act(lt, c) { hideT(); C.nar.reset().place(1.2, 0.8, -0.4, 0.9 + bob(c.t) * 0.5).pose('open').talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'It felt crummy.', set: caf, sfx: [['tick', 'crummy', 1]], cam: frame(1.2, 0.8, { size: 'face', y: 0.9, side: -8, push: 0.06 }),
    act(lt, c) { hideT(); C.nar.reset().place(1.2, 0.8, -0.2, 0.9 + bob(c.t) * 0.5).pose('shrug', remap(lt, c.w('crummy'), c.w('crummy') + 0.15)).talk(c.t, lt < c.w('crummy') + 0.3 ? 1 : 0).idle(c.t).setFace(lt < c.w('crummy') + 0.3 ? 'say' : 'grin'); } });
  shot({ line: 'Owen stared at me.', set: caf, cam: frame(-2.2, 0.4, { size: 'face', side: -14, push: 0.07 }),
    act(lt, c) { hideT(); C.owen.reset().place(-2.2, 0.4, 0.3).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Then he snorted.', set: caf, sfx: [['pop', 'snorted', 0.8], ['sparkle', 'snorted', 0.6]], cam: frame(-2.2, 0.4, { size: 'close', side: 10 }),
    act(lt, c) { hideT(); const a = C.owen.reset().place(-2.2, 0.4, 0.1).idle(c.t); a.setFace(lt < c.w('snorted') ? 'sus' : 'smirk'); rise(a, FC.sp[0], lt, c.w('snorted'), 0, 0.6, 'smirk'); } });
  shot({ line: 'Then he laughed for real,', set: caf, sfx: [['sparkle', 'laughed'], ['rise', 'laughed']], cam: { pos: [-0.6, 3.6, 11.5], look: [-1.4, 5.0, 0.4], fov: 62, blur: 0.12, push: 0, to: { look: [-1.4, 7.4, 0.4] }, t0: 0.2, ease: 'out' },
    act(lt, c) { hideT(); const a = C.owen.reset().place(-2.2, 0.4, 0.1, 0.6).idle(c.t); if (lt > c.w('laughed')) laughing(a, c.t); else a.setFace('smirk'); rise(a, FC.sp[1], lt, c.w('laughed'), 0.6, 3.8); C.nar.reset().place(1.2, 0.8, -0.3, 0.9 + bob(c.t) * 0.5).idle(c.t).setFace(lt < c.w('laughed') + 0.3 ? 'shock' : 'laugh').lookAt(-2.2, 0.4); } });
  // payoff of the plant
  shot({ line: 'and finally got his ball back.', set: hall, sfx: [['ding', 'ball', 0.7]], cam: { pos: [-5.2, 5.6, 8], look: [-7.4, 6.4, -3.4], fov: 62, blur: 0.15 },
    act(lt, c) {
      const g = c.w('ball'), a = H.owen.reset().place(-7.4, -3.4, lt < g ? Math.PI * 0.95 : 0.3, 2.6 + bob(c.t)).idle(c.t);
      if (lt < g) { a.pose('reach'); a.setFace('grin'); ballTop.show(); } else { a.pose({ aR: [150, 10], aL: [100, 30] }); laughing(a, c.t, 0.6); ballHand.show(); }
    } });
  // RETURN: his joke launches the narrator
  shot({ line: 'Then his joke was so bad', set: hall, cam: frame(-3, 1, { size: 'close', y: 2.6, side: 14 }),
    act(lt, c) { H.owen.reset().place(-3, 1, 0.3, 2.6 + bob(c.t)).pose('open').talk(c.t).idle(c.t).setFace(lt < c.w('so') ? 'say' : 'smug'); } });
  shot({ line: 'I shot up too.', set: hall, sfx: [['sparkle', 'shot'], ['rise', 'shot']], cam: { pos: [0.6, 4.6, 11], look: [0.8, 5.4, 1], fov: 62, blur: 0.15, push: 0, to: { look: [0.8, 8.2, 1] }, t0: 0.15, ease: 'out' },
    act(lt, c) { const a = H.nar.reset().place(1.8, 1, -0.2, 1.8).idle(c.t); laughing(a, c.t); rise(a, FH.sp[1], lt, c.w('shot'), 1.8, 5.4); H.owen.reset().place(-2.4, 0.6, 0.4, 2.6 + bob(c.t)).idle(c.t).setFace('laugh'); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he asked, did you tickle yourself?', set: hall, cam: frame(-2.4, 0.6, { size: 'close', y: 2.6, side: -14 }),
    act(lt, c) { H.owen.reset().place(-2.4, 0.6, 0.3, 2.6 + bob(c.t)).pose(lt < c.w('did') ? 'idle' : { aR: [70, 20] }).talk(c.t, lt > c.w('did') ? 1 : 0).idle(c.t).setFace(lt < c.w('did') ? 'smirk' : lt < c.w('yourself') + 0.2 ? 'say' : 'smug'); } });
  shot({ line: 'I stared at him.', set: hall, cam: frame(1.8, 1, { size: 'face', y: 5.4, side: 8, push: 0.07 }),
    act(lt, c) { H.nar.reset().place(1.8, 1, 0, 5.4 + bob(c.t) * 0.5).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'We floated home together.', set: street, cam: { pos: [1.2, 4.6, 9.6], look: [0, 8.4, 3], fov: 62, blur: 0.25 },
    act(lt, c) { laughing(S.nar.reset().place(1.6, 3, -0.2 + lt * 0.05, 4.4 + bob(c.t)).pose('cheer').idle(c.t), c.t, 0.6); laughing(S.owen.reset().place(-1.6, 3.4, 0.2, 4.0 + bob(c.t, 2)).pose('wave').idle(c.t), c.t, 0.6); } });
});
