// story.js: "In this town, every excuse you make makes you heavier."  Heavier = you sink into the ground.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, chair } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, canvasTex, rng, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 31, skin: 'light', hair: 'curly', hairColor: '#7a4a2e', top: 'zip', topColor: '#2fa84a', inner: '#f4f4f4', sleeves: 'long', bottom: 'jeans', bottomColor: '#4f79a7' },
  leo: { seed: 32, skin: 'brown', hair: 'short', hairColor: '#1b1210', top: 'hoodie', topColor: '#7b3fc4', bottom: 'joggers', bottomColor: '#2b2f38', cap: '#e8413c' },
  zara: { seed: 33, skin: 'fair', hair: 'ponytail', hairColor: '#e8632b', top: 'jersey', topColor: '#2f95e6', number: '1', bottom: 'shorts', bottomColor: '#f4f4f4' },
  teacher: { seed: 34, skin: 'deep', hair: 'buzz', hairColor: '#222222', top: 'shirt', topColor: '#bfe3ff', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: true, height: 1.12 },
  kidA: { seed: 35, skin: 'tan', hair: 'bob', hairColor: '#2b1b14', top: 'tee', topColor: '#ffd23f', bottom: 'skirt', bottomColor: '#e84b6a' },
  kidB: { seed: 36, skin: 'light', hair: 'messy', hairColor: '#c98a3a', top: 'stripes', topColor: '#f4f4f4', stripe: '#2e9e59', bottom: 'cargo', bottomColor: '#c9b48a' },
  kidC: { seed: 37, skin: 'dark', hair: 'afro', hairColor: '#17110f', top: 'vest', topColor: '#ff9f2e', bottom: 'jeans', bottomColor: '#274b8f' },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
// cracked-floor decals around anyone who is sunk into the ground (pooled per set, hidden every frame)
const crackTex = canvasTex(256, 256, (g, w) => {
  const c = w / 2, r = rng(7); g.translate(c, c); g.fillStyle = 'rgba(40,30,25,0.55)'; g.beginPath(); g.ellipse(0, 0, c * 0.42, c * 0.42, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(40,30,25,0.85)'; g.lineCap = 'round';
  for (let i = 0; i < 11; i++) { let a = i / 11 * 6.28 + r() * 0.3, rad = c * 0.38; g.lineWidth = 6 - r() * 3; g.beginPath(); g.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); for (let k = 0; k < 4; k++) { rad += c * (0.1 + r() * 0.1); a += (r() - 0.5) * 0.5; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.stroke(); }
});
function crackPool(set) {
  const list = []; let n = 0; PRE.push(() => { n = 0; list.forEach(m => { m.visible = false; }); });
  return (x, z, s = 1) => { if (n >= list.length) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: crackTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.rotation.x = -Math.PI / 2; set.group.add(m); list.push(m); } const m = list[n++]; m.visible = true; m.position.set(x, 0.03, z); m.scale.set(4.2 * s, 4.2 * s, 1); };
}
const bob = (t, s = 0) => Math.sin(t * 2.2 + s) * 0.04;
const bounceY = (t, s = 0, h = 1.6) => Math.abs(Math.sin(t * 4 + s)) * h;
start(() => {
  const street = SETS.schoolFront({ name: 'OAK RIDGE SCHOOL' });
  const hall = SETS.hallway({ banner: 'OWN\nIT!', bannerBg: '#ffd23f', locker: '#2e9e59', door: 'ROOM 4', poster: 'NO\nEXCUSES', posterBg: '#e8413c' });
  const cls = SETS.classroom({ board: ['HOMEWORK', 'due today'] });
  const caf = SETS.cafeteria({ menu: 'TODAY: NACHOS!', rule: 'SAY\nSORRY' });
  const S = cast(street, ['kidA', 'kidB', 'kidC', 'zara']);
  const H = cast(hall, ['nar', 'leo', 'zara', 'kidA', 'kidB']);
  const K = cast(cls, ['nar', 'leo', 'teacher', 'zara']);
  const C = cast(caf, ['nar', 'leo', 'zara', 'kidC', 'kidA']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group), crack: crackPool(set) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FC = fx(caf);
  // place an avatar sunk `depth` studs into the floor, with cracks around it
  const sunk = (F, av, x, z, ry, depth) => { av.reset().place(x, z, ry, -depth); if (depth > 0.15) F.crack(x, z, 0.7 + Math.min(depth, 4) * 0.12); return av; };
  // RULE FIRES (down): sink from d0 to d1 with scream face, sparkles, dust and fresh cracks. Call last in act.
  const sink = (F, av, lt, t0, d0, d1, rest = 'worried') => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.03, 0.35)), d = lerp(d0, d1, k), p = av.root.position;
    p.y = -d; if (d > 0.15) F.crack(p.x, p.z, 0.7 + Math.min(d, 4) * 0.12);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) { F.puff.at(dt, [p.x, 0, p.z + 0.6]); F.sp[0].at(dt, [p.x, 0, p.z], 1); }
    return d;
  };
  // RULE FIRES (up): lighter, pops up out of the floor
  const lift = (F, av, lt, t0, d0, d1, rest = 'grin', spi = 1) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.42)), d = lerp(d0, d1, k), p = av.root.position;
    p.y = -d; F.crack(p.x, p.z, 0.7 + Math.max(d0, 0.3) * 0.12);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) F.sp[spi].at(dt, [p.x, Math.max(-d, 0), p.z], 1);
    return d;
  };
  // props
  const homework = prop(box(1.4, 0.06, 1.8, '#fbfbf8')); K.teacher.handR.add(homework); homework.position.set(0, -0.2, 0.2);
  const tray = prop(grp(at(box(2.4, 0.1, 1.6, '#ff9f2e', 0.04), 0, 0, 0), at(box(1.0, 0.3, 0.8, '#f2c14e', 0.12), 0.3, 0.2, 0), at(box(0.4, 0.6, 0.4, '#e84b4b'), -0.7, 0.35, 0))); caf.group.add(tray);
  const ballZ = prop(new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 12), mat('#f4f4f4'))); H.zara.handR.add(ballZ); ballZ.position.set(0, -0.4, 0.2);
  const lockerMess = []; for (let i = 0; i < 5; i++) { const b = prop(box(1.4, 0.4, 1.0, ['#e8413c', '#ffd23f', '#2f95e6', '#f4f4f4', '#7b3fc4'][i])); hall.group.add(b); lockerMess.push(b); }
  const lonelyChair = prop(chair('#2b7de0')); cls.group.add(lonelyChair);
  const hideDesks = () => { cls.desks.visible = false; };
  caf.reset = () => { caf.tables[1].visible = false; caf.tables[1].children.forEach(ch => { ch.visible = true; }); };
  const showT = () => { caf.tables[1].visible = true; caf.tables[1].children[1].visible = caf.tables[1].children[2].visible = false; };
  const N = H.nar;
  PRE.push(() => { for (const av of [H.nar, K.nar, C.nar]) av.hair.scale.set(1, 1, 1); });

  // ═══════════════ HOOK ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.2, 18], look: [0, 3.0, 3], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) {
      sunk(FS, S.kidC, -3.2, 4.6, 0.2, 2.6).idle(c.t).setFace('sad');
      S.zara.reset().place(3.4, 3.4, -0.3, bounceY(c.t)).pose('cheer').setFace('laugh');
      sunk(FS, S.kidB, 7.6, 2.2, -0.4, 1.2).idle(c.t).setFace('worried');
      S.kidA.reset().place(-0.4 + lt * 1.2, 6.4, Math.PI / 2).walk(c.t, 0.6).setFace('smile');
    } });
  shot({ line: 'every excuse you make', set: street, cam: frame(0, 5, { size: 'close', side: 12 }),
    act(lt, c) { S.kidA.reset().place(0, 5, 0.2).pose('shrug').talk(c.t).idle(c.t).setFace(lt < c.w('excuse') ? 'smile' : 'say'); } });
  shot({ line: 'makes you heavier.', set: street, sfx: [['thud', 'heavier', 1.2], ['sparkle', 'heavier'], ['fall', 'heavier', 0.6]], cam: frame(0, 5, { size: 'full', side: -8, dist: 0.9 }),
    act(lt, c) { const a = S.kidA.reset().place(0, 5, -0.1).pose('shrug').idle(c.t).setFace('say'); sink(FS, a, lt, c.w('heavier'), 0, 1.6); } });
  // world: lazy kids stuck in the sidewalk; honest people bounce
  shot({ line: "That's why lazy kids", set: street, cam: { pos: [-8, 2.6, 13], look: [-6, 2.2, 3], fov: 60, blur: 0.2, push: 0, to: { pos: [2, 2.6, 13], look: [4, 2.2, 3] }, ease: 'lin' },
    act(lt, c) { sunk(FS, S.kidC, -7, 4, 0.3, 3.0).idle(c.t).setFace('sleepy'); sunk(FS, S.kidB, -2, 3.4, -0.2, 2.2).idle(c.t).setFace('sad'); sunk(FS, S.kidA, 3.4, 4.2, 0.2, 2.8).idle(c.t).setFace('worried'); } });
  shot({ line: 'are stuck waist-deep,', set: street, cam: frame(-2, 3.4, { size: 'medium', side: -10, y: -2.2 }),
    act(lt, c) { const a = sunk(FS, S.kidB, -2, 3.4, -0.2, 2.2).pose({ aL: [40, 30], aR: [40, 30] }).idle(c.t).setFace('sad'); a.root.position.y = -2.2; } });
  shot({ line: 'and honest people', set: street, cam: { pos: [3, 1.0, 12], look: [3, 6.2, 3], fov: 62, blur: 0.25 },
    act(lt, c) { S.zara.reset().place(3, 3, 0, 1.6 + bounceY(c.t, 0, 1.2)).pose('cheer').setFace('grin'); } });
  shot({ line: 'practically bounce.', set: street, sfx: [['boing', 'bounce', 0.7]], cam: { ...frame(3, 3, { size: 'wide', dist: 1.0 }), look: [3, 5.2, 3], blur: 0.1 },
    act(lt, c) { S.zara.reset().place(2 + lt * 1.2, 3, Math.PI / 2 - 0.6, bounceY(c.t, 0, 2.2)).pose('cheer').setFace('laugh'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'I was only ankle-deep.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9, low: 0.25 }),
    act(lt, c) { sunk(FH, N, 0, 1, 0.1, 0.45).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Leo', set: hall, cam: frame(-7, 0.6, { size: 'close', y: -2.6, side: -12 }),
    act(lt, c) { sunk(FH, H.leo, -7, 0.6, -0.15, 2.6).idle(c.t, 0.5).setFace('neutral').pose({ aL: [30, 40], aR: [30, 40] }); H.leo.root.position.y = -2.6; } });
  shot({ line: 'was chest-deep.', set: hall, sfx: [['thud', 'chest-deep', 0.6]], cam: { ...frame(-7, 0.6, { size: 'full', side: 14, dist: 0.85, low: 0.18 }), blur: 0.15 },
    act(lt, c) { sunk(FH, H.leo, -7, 0.6, 0.2, 2.6).pose({ aL: [30, 40], aR: [30, 40] }).idle(c.t, 0.5).setFace(lt < c.w('chest-deep') ? 'neutral' : 'sad'); H.leo.root.position.y = -2.6; } });
  // plant: the chair he can't use
  shot({ line: "He hadn't sat in a chair since fourth grade.", set: cls, cam: { pos: [-3.2, 1.6, 9], look: [-4.6, 2.4, 2], fov: 60, blur: 0.3 },
    act(lt, c) { hideDesks(); lonelyChair.show().position.set(-3.0, 0, 2.4); lonelyChair.rotation.y = -0.4; const l = sunk(FK, K.leo, -6.2, 2.0, 0.6, 2.6).idle(c.t, 0.4).setFace(lt < c.w('fourth') ? 'neutral' : 'sad'); l.root.position.y = -2.6; l.lookAt(-3, 2.4); } });
  shot({ line: 'Meanwhile, Zara never made excuses.', set: hall, cam: { ...frame(8, 1, { size: 'wide', dist: 0.7 }), blur: 0.08 },
    act(lt, c) { H.zara.reset().place(8, 1, 0, bounceY(c.t, 0, 2.2)).pose('cheer').setFace('grin'); sunk(FH, H.kidB, 12, -1.6, -0.3, 2.0).idle(c.t).setFace('sad'); sunk(FH, H.kidA, 4.2, -1.2, 0.3, 1.0).idle(c.t).setFace('worried'); } });
  shot({ line: 'Late for class? My fault.', set: hall, sfx: [['boing', 'my', 0.5]], cam: frame(8, 1, { size: 'close', side: 14, y: 0.6 }),
    act(lt, c) { H.zara.reset().place(8, 1, 0.3, 0.6 + bounceY(c.t, 0, 0.12)).pose(lt < c.w('my') ? 'shrug' : 'open').talk(c.t).idle(c.t).setFace(lt < c.w('my') ? 'neutral' : 'say'); } });
  shot({ line: 'Forgot homework? My fault.', set: hall, sfx: [['boing', 'my', 0.5]], cam: frame(8, 1, { size: 'close', side: -16, y: 0.6 }),
    act(lt, c) { H.zara.reset().place(8, 1, -0.3, 0.6 + bounceY(c.t, 1, 0.12)).pose('shrug').talk(c.t).idle(c.t).setFace(lt < c.w('my') ? 'worried' : 'say'); } });
  shot({ line: 'Broke a window? Also my fault.', set: hall, sfx: [['boing', 'also', 0.8]], cam: { ...frame(8, 1, { size: 'full', side: 8 }), to: { look: [8, 5.4, 1] }, ease: 'out' },
    act(lt, c) { H.zara.reset().place(8, 1, 0, bounceY(c.t, 0, lt < c.w('also') ? 0.6 : 2.4)).pose({ aR: [70, 10] }).idle(c.t).setFace(lt < c.w('also') ? 'worried' : 'laugh'); ballZ.show(); } });

  // ═══════════════ INCITING MOMENT (classroom) ═══════════════
  shot({ line: 'Then I forgot my homework.', set: cls, cam: frame(0, -1.4, { size: 'medium', h: 1.12, side: -10, dist: 1.1 }),
    act(lt, c) { hideDesks(); K.teacher.reset().place(0, -1.4, 0.3).pose({ aR: [80, 0] }, remap(lt, c.w('homework'), c.w('homework') + 0.2)).talk(c.t, lt > c.w('homework') ? 1 : 0).idle(c.t).setFace(lt < c.w('forgot') ? 'smile' : 'serious'); } });
  shot({ line: 'My dog ate it.', set: cls, cam: frame(3, 2.4, { size: 'close', side: 12 }),
    act(lt, c) { hideDesks(); sunk(FK, K.nar, 3, 2.4, -0.3, 0.45).pose('shrug').talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'Thud. I sank to my knees.', set: cls, sfx: [['thud', 0, 1.3], ['sparkle', 0], ['fall', 0, 0.6]], cam: frame(3, 2.4, { size: 'full', side: -10, dist: 0.95, low: 0.18 }),
    act(lt, c) { hideDesks(); const a = K.nar.reset().place(3, 2.4, -0.2).pose('shrug').idle(c.t); sink(FK, a, lt, 0, 0.45, 2.0); } });
  shot({ line: 'Zara winced.', set: cls, cam: frame(-3, 1.6, { size: 'close', side: 16, y: 0.4, push: 0.05 }),
    act(lt, c) { hideDesks(); K.zara.reset().place(-3, 1.6, 0.5, 0.4 + bounceY(c.t, 0, 0.3)).pose({ aL: [130, -20], aR: [130, -20] }, remap(lt, 0, 0.15)).setFace('shock').lookAt(3, 2.4); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', y: -2.0, side: -10 }),
    act(lt, c) { sunk(FH, N, -2, 1, 0.1, 2.0).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin'); N.root.position.y = -2.0; FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I owned up to everything,', set: hall, cam: frame(-2, 1, { size: 'face', y: -2.0, side: 18 }),
    act(lt, c) { sunk(FH, N, -2, 1, 0.3, 2.0).pose('think').idle(c.t).setFace('smirk'); N.root.position.y = -2.0; } });
  shot({ line: "I'd be light as Zara.", set: hall, sfx: [['boing', 'light', 0.7]], cam: frame(-1, 0, { size: 'full', dist: 1.0 }),
    act(lt, c) { const k = remap(lt, c.w('light') - 0.1, c.w('light') + 0.3); N.reset().place(-2.4, 1, 0, k <= 0 ? -2.0 : lerp(-2.0, 0, E.back(k)) + (k >= 1 ? bounceY(c.t, 0, 1.2) : 0)).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'); if (k < 1) FH.crack(-2.4, 1, 0.9); H.zara.reset().place(1.8, -0.6, -0.3, bounceY(c.t, 2, 1.2)).pose('wave').setFace('grin'); } });
  shot({ line: 'I said sorry to a plant. Nothing.', set: hall, cam: frame(-17.4, -2.8, { size: 'medium', y: -2.0, side: -28, dist: 1.05 }),
    act(lt, c) { sunk(FH, N, -16.8, -2.8, -0.55, 2.0).pose({ head: [24, -20, 0], lean: [18, 0] }).idle(c.t, 0.3).setFace(lt < c.w('nothing') ? 'say' : 'blank'); N.root.position.y = -2.0; } });
  shot({ line: 'I apologized for a sneeze.', set: hall, sfx: [['pop', 'sneeze', 0.6]], cam: frame(4, 1, { size: 'medium', y: -2.0, side: -8, dist: 1.1 }),
    act(lt, c) { sunk(FH, N, 4, 1, 0, 2.0).pose({ aR: [170, 10] }, remap(lt, c.w('apologized'), c.w('apologized') + 0.15)).idle(c.t).setFace('smile'); N.root.position.y = -2.0; H.kidA.reset().place(7, -0.8, -0.6).idle(c.t).setFace('sus').lookAt(4, 1); FH.puff.at(lt - 0.05, [0.4, 4.4, 0]); } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(4, 1, { size: 'face', y: -2.0, side: 10, push: 0.06 }),
    act(lt, c) { sunk(FH, N, 4, 1, 0, 2.0).pose({ aR: [170, 10] }).idle(c.t, 0.3).setFace('sus'); N.root.position.y = -2.0; } });

  // ═══════════════ ACCIDENTAL SUCCESS (cafeteria) ═══════════════
  shot({ line: "Then I knocked over a kid's tray,", set: caf, sfx: [['thud', 'tray', 0.8]], cam: frame(-7.5, 0.6, { size: 'full', side: 8, dist: 1.15 }),
    act(lt, c) {
      const t0 = c.w('knocked'), k = remap(lt, t0, t0 + 0.55);
      const n = sunk(FC, C.nar, -9.6 + Math.min(lt, t0) * 1.4, 0.8, Math.PI / 2, 2.0); n.walk(c.t, 0.5); n.root.position.y = -2.0; n.setFace(lt < t0 ? 'neutral' : 'shock');
      C.kidA.reset().place(-5.6, 0.6, -Math.PI / 2).pose({ aL: [78, -8], aR: [78, -8] }, 1 - k).idle(c.t).setFace(lt < t0 ? 'smile' : 'shock');
      tray.show().position.set(-5.6 - 1.6 * k, 3.1 + Math.sin(k * Math.PI) * 1.6 - k * 3.0, 0.6 + k * 0.8); tray.rotation.set(k * 2.4, 0, k * 1.2);
    } });
  shot({ line: 'and said, sorry, my fault.', set: caf, cam: frame(-6.8, 0.8, { size: 'close', y: -2.0, side: -14 }),
    act(lt, c) { sunk(FC, C.nar, -6.8, 0.8, 0.2, 2.0).pose('open', remap(lt, c.w('sorry'), c.w('sorry') + 0.15)).talk(c.t, lt > c.w('sorry') ? 1 : 0).idle(c.t).setFace(lt < c.w('sorry') ? 'worried' : 'say'); C.nar.root.position.y = -2.0; } });
  shot({ line: 'Pop. I shot out of the floor.', set: caf, sfx: [['sparkle', 0], ['rise', 0], ['pop', 0, 0.8]], cam: { pos: [-6.8, 3.4, 9.6], look: [-6.8, 3.4, 0.8], fov: 60, blur: 0.2, push: 0, to: { look: [-6.8, 5.2, 0.8] }, t0: 0.1, ease: 'out' },
    act(lt, c) { const a = C.nar.reset().place(-6.8, 0.8, 0).idle(c.t); lift(FC, a, lt, 0, 2.0, -1.4, 'laugh'); if (lt > 0.42) a.root.position.y = 1.4 + Math.sin((lt - 0.42) * 6) * 0.15; C.kidA.reset().place(-3.4, -0.4, -0.5).idle(c.t).setFace(lt < 0.4 ? 'sad' : 'shock'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I owned everything.', set: hall, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { N.reset().place(0, 1.4, 0.1, bounceY(c.t, 0, 1.0)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'My messy locker.', set: hall, sfx: [['thud', 'messy', 0.6]], cam: frame(-11.4, -3.4, { size: 'medium', side: 18, dist: 1.1 }),
    act(lt, c) { N.reset().place(-11.4, -3.6, 0.3, bounceY(c.t, 0, 0.4)).pose('shrug').idle(c.t).setFace('grin'); const t0 = c.w('messy') - 0.1; lockerMess.forEach((b, i) => { const k = E.in(remap(lt, t0 + i * 0.06, t0 + 0.35 + i * 0.06)); b.show().position.set(-13.2 + (i % 3) * 0.6 - k * (i - 2) * 0.5, lerp(5.6 - i * 0.6, 0.2 + i * 0.36, k), -4.0 + k * 1.2); b.rotation.set(0, i * 0.5 * k, (i % 2 ? 0.4 : -0.3) * k); }); } });
  shot({ line: 'My bad haircut.', set: hall, cam: frame(3, 0, { size: 'close', side: -14, push: 0.05 }),
    act(lt, c) { N.reset().place(3, 0, -0.2, bounceY(c.t, 0, 0.25)).idle(c.t).setFace('grin'); N.hair.scale.set(1.25, 0.55, 1.2); } });
  shot({ line: 'My singing.', set: hall, cam: frame(7, 0.6, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { N.reset().place(5.6, 0.6, 0.2, bounceY(c.t, 0, 0.6)).pose('open').talk(c.t, 2).setFace('talk'); H.kidB.reset().place(9.2, -0.6, -0.5).pose({ aL: [165, -38], aR: [165, -38] }).setFace('angry'); } });
  shot({ line: 'By lunch, I bounced like Zara.', set: caf, sfx: [['boing', 'bounced', 0.6]], cam: { ...frame(0, 0, { size: 'wide', dist: 0.68 }), blur: 0.08 },
    act(lt, c) { C.nar.reset().place(-2.4, 0.4, 0.2, bounceY(c.t, 0, 2.0)).pose('cheer').setFace('laugh'); C.zara.reset().place(2.4, -0.4, -0.2, bounceY(c.t, 1.6, 2.0)).pose('cheer').setFace('laugh'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I saw Leo,', set: caf, cam: frame(-2.4, 0.4, { size: 'close', side: -14, y: 1.0 }),
    act(lt, c) { const a = C.nar.reset().place(-2.4, 0.4, -0.2, lt < c.w('saw') ? bounceY(c.t, 0, 1.0) + 0.4 : 0.4).idle(c.t); const k = remap(lt, c.w('saw'), c.w('saw') + 0.2); a.head.rotation.y -= 0.7 * k; a.head.rotation.x += 0.3 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'chin-deep and alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [-6.6, 4.0, 9.4], look: [-7.5, 0.8, 1], fov: 56, blur: 0.04, push: 0.02 },
    act(lt, c) { sunk(FC, C.leo, -7.5, 1, 0.2, 3.85).idle(c.t, 0.3).setFace('sad'); C.leo.root.position.y = -3.85; } });
  shot({ line: "I'd spent all day bouncing", set: caf, cam: frame(-2.4, 0.4, { size: 'close', side: 16, y: 0.4 }),
    act(lt, c) { C.nar.reset().place(-2.4, 0.4, -0.3, 0.4).idle(c.t, 0.5).setFace(lt < c.w('bouncing') ? 'worried' : 'sad'); } });
  shot({ line: 'while my best friend was sinking.', set: caf, sfx: [['fall', 'sinking', 0.5]], cam: frame(-2.4, 0.4, { size: 'face', side: -6, y: 0.4, push: 0.05 }),
    act(lt, c) { C.nar.reset().place(-2.4, 0.4, -0.1, 0.4 - remap(lt, c.w('sinking'), c.d) * 0.4).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: "I knelt down. What's wrong?", set: caf, cam: frame(-6.2, 1.2, { size: 'medium', side: 4, dist: 1.3, low: 0.3 }),
    act(lt, c) { const n = C.nar.reset().place(-4.8, 1.4, -0.9).sit(0.25).pose({ lean: [22, 0] }).idle(c.t).setFace(lt < c.w("what's") ? 'worried' : 'say').talk(c.t, lt > c.w("what's") ? 1 : 0); sunk(FC, C.leo, -7.5, 1, 0.5, 3.85).idle(c.t, 0.3).setFace('sad'); C.leo.root.position.y = -3.85; } });
  shot({ line: "It's never my fault.", set: caf, sfx: [['thud', 'fault', 0.7]], cam: frame(-7.5, 1, { size: 'close', y: -3.85, side: 12, low: -0.1 }),
    act(lt, c) { const l = C.leo.reset().place(-7.5, 1, 0.3, -3.85).talk(c.t).idle(c.t, 0.3).setFace('mad'); l.root.position.y = -3.85 - E.out(remap(lt, c.w('fault'), c.w('fault') + 0.2)) * 0.25; FC.crack(-7.5, 1, 1.3); } });
  shot({ line: 'Just try once.', set: caf, cam: frame(-4.8, 1.4, { size: 'close', y: -1.4, side: -16 }),
    act(lt, c) { C.nar.reset().place(-4.8, 1.4, -0.7).sit(0.25).pose({ lean: [22, 0], aR: [60, 20] }).talk(c.t).idle(c.t).setFace('say'); } });
  shot({ line: 'He took a deep breath.', set: caf, cam: frame(-7.5, 1, { size: 'face', y: -3.85, side: -8, low: -0.12, push: 0.06 }),
    act(lt, c) { const l = C.leo.reset().place(-7.5, 1, 0.2, -3.85).idle(c.t, 0.2).setFace(lt < c.w('deep') ? 'worried' : 'sleepy'); l.hip.position.y += Math.sin(remap(lt, c.w('deep'), c.d) * Math.PI) * 0.12; FC.crack(-7.5, 1, 1.3); } });
  shot({ line: "I'm scared I'm not good enough.", set: caf, cam: frame(-7.5, 1, { size: 'close', y: -3.85, side: 10, low: -0.1 }),
    act(lt, c) { C.leo.reset().place(-7.5, 1, 0.2, -3.85).talk(c.t).idle(c.t, 0.3).setFace(lt < c.w('good') ? 'sad' : 'cry'); FC.crack(-7.5, 1, 1.3); } });
  shot({ line: 'He shot up to his waist.', set: caf, sfx: [['sparkle', 'shot'], ['rise', 'shot']], cam: frame(-7.5, 1, { size: 'full', side: -8, dist: 0.95, low: 0.25 }),
    act(lt, c) { const l = C.leo.reset().place(-7.5, 1, 0).idle(c.t); lift(FC, l, lt, c.w('shot'), 3.85, 2.0, 'shock', 0); C.nar.reset().place(-4.8, 1.4, -0.9).sit(0.25).idle(c.t).setFace(lt < c.w('shot') + 0.3 ? 'worried' : 'wow'); } });
  shot({ line: 'Also, I broke your pencil.', set: caf, sfx: [['sparkle', 'pencil'], ['rise', 'pencil'], ['pop', 'pencil', 0.7]], cam: { pos: [-6.4, 3.6, 10.5], look: [-7.5, 2.6, 1], fov: 60, blur: 0.2, push: 0, to: { look: [-7.5, 4.4, 1] }, t0: 0.3, ease: 'out' },
    act(lt, c) { const l = C.leo.reset().place(-7.5, 1, 0.1).talk(c.t, lt < c.w('pencil') ? 1 : 0).idle(c.t).setFace('say'); lift(FC, l, lt, c.w('pencil'), 2.0, -0.6, 'laugh', 1); if (lt > c.w('pencil') + 0.42) l.root.position.y = 0.6 + Math.sin((lt - c.w('pencil')) * 6) * 0.1; } });
  // payoff of the plant
  shot({ line: 'For the first time since fourth grade, Leo sat in a chair.', set: caf, sfx: [['ding', 'chair', 0.6]], cam: frame(-2.4, 3.4, { size: 'full', dist: 0.85, side: 6 }),
    act(lt, c) {
      showT();
      const t0 = c.w('sat'), l = C.leo.reset();
      if (lt < t0) l.place(-2.4, 1.6 + (lt / t0) * 1.4, Math.PI, 0).walk(c.t, 0.5).setFace('grin');
      else { l.place(-2.4, 3.4, 0).sit(1.5).idle(c.t); if (lt > c.w('chair')) { l.pose({ aL: [150, 30], aR: [150, 30] }, remap(lt, c.w('chair'), c.w('chair') + 0.2)); l.setFace('laugh'); } else l.setFace('grin'); }
      C.nar.reset().place(1.2, 3.4, -0.3).sit(1.5).idle(c.t).setFace('grin');
    } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Plus, that sneeze was mine.', set: caf, sfx: [['pop', 'mine', 0.5]], cam: frame(-2.4, 3.4, { size: 'close', side: -14 }),
    act(lt, c) { showT(); C.leo.reset().place(-2.4, 3.4, 0.4).sit(1.5).talk(c.t, lt > c.w('that') ? 1 : 0).idle(c.t).setFace(lt < c.w('that') ? 'smirk' : lt < c.w('mine') + 0.25 ? 'say' : 'smug'); } });
  shot({ line: 'I stared at him.', set: caf, cam: frame(1.2, 3.4, { size: 'face', side: 8, push: 0.07 }),
    act(lt, c) { showT(); C.nar.reset().place(1.2, 3.4, -0.2).sit(1.5).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Totally worth it.', set: caf, cam: frame(1.2, 3.4, { size: 'close', side: -16, low: 0.02, dist: 1.05 }),
    act(lt, c) { showT(); C.nar.reset().place(1.2, 3.4, -0.3).sit(1.5).pose('open').idle(c.t).setFace(lt < c.w('worth') ? 'laugh' : 'grin'); C.leo.reset().place(-2.4, 3.4, 0.4).sit(1.5).idle(c.t).setFace('laugh'); } });
});
