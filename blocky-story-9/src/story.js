// story.js: "In this town, every hour on your phone makes your eyes bigger."
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, tree, bush } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 91, skin: 'tan', hair: 'short', hairColor: '#1b1210', top: 'hoodie', topColor: '#ffd23f', bottom: 'jeans', bottomColor: '#4f79a7' },
  noah: { seed: 92, skin: 'light', hair: 'messy', hairColor: '#c98a3a', top: 'zip', topColor: '#2b6fe0', inner: '#f4f4f4', sleeves: 'long', bottom: 'joggers', bottomColor: '#15151a' },
  lily: { seed: 93, skin: 'deep', hair: 'buns', hairColor: '#17110f', top: 'vest', topColor: '#2e9e59', inner: '#f4f4f4', bottom: 'shorts', bottomColor: '#c9b48a' },
  mom: { seed: 94, skin: 'tan', hair: 'ponytail', hairColor: '#1b1210', top: 'sweater', topColor: '#e84b6a', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b3a6b', height: 1.15 },
  gamer: { seed: 95, skin: 'fair', hair: 'spiky', hairColor: '#7b3fc4', top: 'tee', topColor: '#15151a', bottom: 'cargo', bottomColor: '#5a5f6a' },
  granny: { seed: 96, skin: 'fair', hair: 'bob', hairColor: '#d9d9d9', top: 'cardigan', topColor: '#9fcfc1', inner: '#f4f4f4', sleeves: 'long', bottom: 'skirt', bottomColor: '#7b3fc4', height: 0.95 },
};
const EYES = { noah: 2.6, gamer: 2.3 };   // resting eye size (1 = normal, drawn by the face decal)
const ALL = [];
const white = mat('#ffffff'), black = new THREE.MeshBasicMaterial({ color: '#111114' }), shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
function eyeRig(av) {   // two 3D eyeballs over the decal eyes; s = size, look = [x, y] pupil direction
  const g = new THREE.Group(), eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.3, 0.73, 0.47);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), white); ball.scale.set(0.2, 0.22, 0.12); e.add(ball);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), black); pupil.scale.set(0.085, 0.095, 0.04); pupil.position.z = 0.1; e.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), shine); glint.scale.set(0.025, 0.025, 0.02); glint.position.set(-0.03, 0.04, 0.13); e.add(glint);
    g.add(e); eyes.push({ e, ball, pupil, glint, sx });
  }
  av.head.add(g);
  av.eyes = (s = 1, look = [0, -0.6]) => {
    g.visible = s > 1.08;
    if (!g.visible) return av;
    for (const { e, ball, pupil, glint, sx } of eyes) {
      const r = 0.2 * s; e.position.set(sx * (0.3 + (s - 1) * 0.08), 0.73 + (s - 1) * 0.05, 0.5); ball.scale.set(r, r * 1.1, r * 0.55);
      pupil.scale.set(r * 0.42, r * 0.46, 0.04); pupil.position.set(look[0] * r * 0.45, look[1] * r * 0.45, r * 0.5); glint.position.set(pupil.position.x - r * 0.12, pupil.position.y + r * 0.14, r * 0.54); glint.scale.setScalar(r * 0.12);
    }
    return av;
  };
  return av;
}
function cast(set, keys) { const o = {}; for (const k of keys) { const a = eyeRig(makeAvatar(LOOK[k])); a.eyeBase = EYES[k] || 1; set.group.add(a.root); ALL.push(a); o[k] = a; } return o; }
PRE.push(() => { for (const a of ALL) { if (a.eyeBase0 === undefined) a.eyeBase0 = a.eyeBase; a.eyeBase = a.eyeBase0; a.eyes(a.eyeBase); } });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
function phone(av) { const g = grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.4)), 0, 0.08, 0)); g.position.set(0, -0.2, 0.32); av.handR.add(g); return prop(g); }
const PH = { aR: [70, -25] };   // phone held in front of the chest, looking down at it
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['PHONES', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'LOOK\nUP!', bannerBg: '#ffd23f', locker: '#e8632b', door: 'ROOM 1', poster: 'NO PHONES\nIN CLASS', posterBg: '#2f7de1' });
  const park = SETS.park();
  const bed = SETS.bedroom({ poster: 'GAME\nON' });
  const home = SETS.livingRoom();
  // treehouse + sunset props in the park
  const th = grp(at(tree(12), 0, 0, 0), at(box(6, 0.4, 5, '#b9783f', 0.05), 0, 6.2, 1.2), at(box(6, 2.4, 0.3, '#c98f52'), 0, 7.6, -1.2), at(box(0.3, 6.2, 0.3, '#8a5628'), -2.6, 3.1, 3.4), at(box(0.3, 6.2, 0.3, '#8a5628'), -1.6, 3.1, 3.4));
  for (let i = 0; i < 6; i++) th.add(at(box(1.3, 0.2, 0.25, '#8a5628'), -2.1, 0.8 + i * 1.0, 3.4));
  park.group.add(th); th.position.set(-18, 0, -6);
  const sun = prop(new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), glow('#ff9a3c', 1.6))); park.group.add(sun); sun.position.set(-6, 16, 160);
  const dusk = prop(new THREE.Mesh(new THREE.SphereGeometry(390, 24, 12), new THREE.MeshBasicMaterial({ color: '#ff8a4a', transparent: true, opacity: 0.45, side: THREE.BackSide, fog: false, depthWrite: false }))); park.group.add(dusk);
  const ball = prop(new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat('#f4f4f4'))); park.group.add(ball);
  const cookies = prop(grp(at(box(3, 0.12, 2, '#9aa0a8', 0.04), 0, 0, 0), ...[[-0.8, -0.4], [0, -0.4], [0.8, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z]) => at(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 16), mat('#c98a3a')), x, 0.13, z)))); home.group.add(cookies);
  const drawer = grp(at(box(4, 3, 2.4, '#f4efe6', 0.08), 0, 1.5, 0), at(box(3.4, 0.9, 0.1, '#e8d8c0'), 0, 2.3, 1.22), at(box(0.8, 0.2, 0.2, '#b9783f'), 0, 2.3, 1.3)); bed.group.add(drawer); drawer.position.set(5, 0, -4.2);
  const S = cast(street, ['nar', 'noah', 'gamer', 'granny', 'lily']);
  const H = cast(hall, ['nar', 'noah', 'lily']);
  const P = cast(park, ['nar', 'noah', 'lily']);
  const B = cast(bed, ['nar', 'mom']);
  const L = cast(home, ['nar', 'mom']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FP = fx(park), FB = fx(bed), FL = fx(home);
  const phones = {}; for (const [k, a] of [['S.noah', S.noah], ['S.gamer', S.gamer], ['H.noah', H.noah], ['P.noah', P.noah], ['B.nar', B.nar], ['P.nar', P.nar], ['S.nar', S.nar]]) phones[k] = phone(a);
  // RULE FIRES: eyes s0 -> s1. scream face, sparkles round the head
  const beat = (F, av, lt, t0, s0, s1, rest, look = [0, 0], spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.45)); av.eyes(Math.max(1, lerp(s0, s1, k)), look);
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) F.sp[spi].at(dt, av.root.position.toArray(), av.root.scale.x);
  };
  const sunset = () => { sun.show(); dusk.show(); };
  const N = H.nar;

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.4, 17.5], look: [0, 4.2, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { walkX(S.gamer, -6, 3.4, 1, lt, c.t, 0.4, 'blank').pose(PH).eyes(2.3); phones['S.gamer'].show(); S.granny.reset().place(4, 4.4, -0.3).idle(c.t).setFace('blank'); S.lily.reset().place(1.2, 1.8, 0.2).pose('wave').idle(c.t).setFace('grin'); } });
  shot({ line: 'every hour on your phone', set: street, cam: frame(0, 5, { size: 'close', side: 12 }),
    act(lt, c) { S.nar.reset().place(0, 5, 0.2).pose(PH).idle(c.t).setFace('smile'); phones['S.nar'].show(); S.nar.head.rotation.x += 0.25; } });
  shot({ line: 'makes your eyes bigger.', set: street, sfx: [['sparkle', 'bigger'], ['pop', 'bigger', 0.7]], cam: frame(0, 5, { size: 'close', side: -10, dist: 1.25 }),
    act(lt, c) { const a = S.nar.reset().place(0, 5, -0.1).pose(PH).idle(c.t).setFace('smile'); phones['S.nar'].show(); beat(FS, a, lt, c.w('bigger'), 1, 2.0, 'neutral', [0, -0.5]); } });
  shot({ line: "That's why gamers have eyes like plates,", set: street, cam: frame(-3, 3, { size: 'close', side: 14, push: 0.05 }),
    act(lt, c) { S.gamer.reset().place(-3, 3, 0.2).pose(PH).idle(c.t).setFace('blank').eyes(2.4, [0.2, -0.7]); phones['S.gamer'].show(); } });
  shot({ line: 'and grandmas', set: street, cam: frame(4, 3, { size: 'medium', h: 0.95, low: 0.4, side: -14 }),
    act(lt, c) { S.granny.reset().place(4, 3, -0.2).pose('hips').idle(c.t).setFace('smile'); } });
  shot({ line: 'have tiny little dots.', set: street, cam: frame(4, 3, { size: 'face', h: 0.95, side: 8, push: 0.06 }),
    act(lt, c) { S.granny.reset().place(4, 3, 0).idle(c.t, 0.5).setFace('blank'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'My eyes were normal.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Noah', set: hall, cam: frame(-7, 0.6, { size: 'close', side: -12 }),
    act(lt, c) { H.noah.reset().place(-7, 0.6, -0.15).pose(PH).idle(c.t).setFace('blank').eyes(2.6, [0, -0.7]); phones['H.noah'].show(); } });
  shot({ line: 'had eyes the size of pizzas.', set: hall, sfx: [['boing', 'pizzas', 0.5]], cam: frame(-7, 0.6, { size: 'face', side: 6, push: 0.07, dist: 1.2 }),
    act(lt, c) { const k = remap(lt, c.w('pizzas'), c.w('pizzas') + 0.3); H.noah.reset().place(-7, 0.6, 0).pose(PH).idle(c.t, 0.3).setFace('blank').eyes(2.6, [lerp(0, 0.6, k), lerp(-0.7, 0.2, k)]); phones['H.noah'].show(); } });
  // plant: never looks up at a sunset
  shot({ line: "He hadn't seen a sunset in a year.", set: park, sfx: [['sad', 'year', 0.4]], light: 'warm', cam: { pos: [-7, 3.4, 9], look: [-7, 4.2, -2], fov: 60, blur: 0.15, push: 0.02 },
    act(lt, c) { sunset(); P.noah.reset().place(-7, -0.9, 0).sit(1.4).pose({ lL: 50, lR: 50 }).pose(PH).idle(c.t, 0.4).setFace('blank').eyes(2.6, [0, -0.8]); P.noah.head.rotation.x += 0.3; phones['P.noah'].show(); } });
  shot({ line: "Meanwhile, Lily didn't own a phone.", set: hall, cam: frame(7, 0.6, { size: 'full', side: -8 }),
    act(lt, c) { H.lily.reset().place(7, 0.6, 0).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'She read books.', set: park, cam: frame(9, -0.9, { size: 'close', side: 14 }),
    act(lt, c) { P.lily.reset().place(9, -0.9, 0.2).sit(1.4).pose({ lL: 50, lR: 50 }).pose({ aL: [60, -20], aR: [60, -20], head: [18, 0, 0] }).idle(c.t).setFace('smile'); } });
  shot({ line: 'She climbed trees.', set: park, cam: { pos: [-14, 6.6, 9], look: [-18.6, 7.4, -4], fov: 58, blur: 0.15 },
    act(lt, c) { P.lily.reset().place(-18.6, -2.6, 0, 6.4).pose('cheer').idle(c.t).setFace('laugh'); } });
  shot({ line: "She knew everyone's name.", set: street, cam: frame(1.2, 3, { size: 'medium', side: -10, dist: 1.1 }),
    act(lt, c) { S.lily.reset().place(1.2, 3, 0.4).pose('wave').idle(c.t).setFace('talk').talk(c.t); S.granny.reset().place(4, 2.4, -0.6).idle(c.t).setFace('grin'); } });

  // ═══════════════ INCITING (bedroom at night) ═══════════════
  shot({ line: 'Then I got a new game,', set: bed, cam: frame(0, 2, { size: 'close', side: 12 }),
    act(lt, c) { B.nar.reset().place(0, 2, 0.2).pose(PH).idle(c.t).setFace(lt < c.w('game') ? 'smile' : 'laugh'); phones['B.nar'].show(); } });
  shot({ line: 'and played all night.', set: bed, light: 'night', cam: frame(-8, 0.4, { size: 'medium', side: 10, dist: 1.1 }),
    act(lt, c) { const a = B.nar.reset().place(-8, -0.4, 0, 0).sit(2.0).pose(PH).idle(c.t).setFace('neutral'); a.eyes(lerp(1.0, 1.5, remap(lt, 0, c.d)), [0, -0.7]); phones['B.nar'].show(); } });
  shot({ line: 'My eyes ballooned.', set: bed, light: 'night', sfx: [['sparkle', 'ballooned'], ['boing', 'ballooned', 0.6]], cam: frame(-8, -0.4, { size: 'close', side: -10, dist: 1.2 }),
    act(lt, c) { const a = B.nar.reset().place(-8, -0.4, 0, 0).sit(2.0).pose(PH).idle(c.t).setFace('neutral'); phones['B.nar'].show(); beat(FB, a, lt, c.w('ballooned'), 1.5, 2.3, 'blank', [0, -0.6]); } });
  shot({ line: 'Mom screamed.', set: bed, sfx: [['pop', 'screamed', 0.6]], cam: frame(3, 3, { size: 'close', h: 1.15, side: 14 }),
    act(lt, c) { B.mom.reset().place(3, 3, -0.5).pose({ aL: [40, 70], aR: [40, 70] }, remap(lt, 0, 0.15)).jump(remap(lt, 0, 0.4), 0.6).setFace('scream'); } });

  // ═══════════════ IDEA + FAILED TRIES ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10, dist: 1.1 }),
    act(lt, c) { N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin').eyes(2.3, [0, 0]); FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I ditched my phone for a day,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18, dist: 1.2 }),
    act(lt, c) { N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk').eyes(2.3, [0.4, 0.4]); } });
  shot({ line: "they'd shrink back.", set: hall, sfx: [['pop', 'shrink', 0.6]], cam: frame(-2, 1, { size: 'close', side: -4, dist: 1.1 }),
    act(lt, c) { const k = E.back(remap(lt, c.w('shrink'), c.w('shrink') + 0.3)); N.reset().place(-2, 1, 0).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin').eyes(lerp(2.3, 1, k), [0, 0]); } });
  shot({ line: 'I hid it in a drawer.', set: bed, cam: frame(5, -1.8, { size: 'medium', side: 14, dist: 1.2 }),
    act(lt, c) { B.nar.reset().place(3, -1.6, -0.9).pose({ aR: [80, -10] }).idle(c.t).setFace('serious').eyes(2.3, [0.6, -0.2]); } });
  shot({ line: 'I checked it anyway. Still huge.', set: bed, cam: frame(3, -1.6, { size: 'close', side: -14, dist: 1.15 }),
    act(lt, c) { B.nar.reset().place(3, -1.6, -0.2).pose(PH).idle(c.t).setFace(lt < c.w('still') ? 'smirk' : 'blank').eyes(2.3, [0, -0.6]); phones['B.nar'].show(); } });
  shot({ line: 'I tried one quick video.', set: bed, cam: frame(0, 1, { size: 'close', side: 12, dist: 1.15 }),
    act(lt, c) { B.nar.reset().place(0, 1, 0.2).pose(PH).idle(c.t).setFace('smile').eyes(lerp(2.3, 2.6, remap(lt, 0, c.d)), [0, -0.7]); phones['B.nar'].show(); } });
  shot({ line: 'Even bigger.', set: bed, sfx: [['boing', 'bigger', 0.6]], cam: frame(0, 1, { size: 'face', side: -8, push: 0.06, dist: 1.3 }),
    act(lt, c) { B.nar.reset().place(0, 1, 0).idle(c.t, 0.3).setFace('blank').eyes(lerp(2.6, 3.0, E.back(remap(lt, c.w('bigger'), c.w('bigger') + 0.3))), [0, 0]); } });

  // ═══════════════ ACCIDENTAL SUCCESS (park) ═══════════════
  shot({ line: 'Then Lily needed help with her treehouse,', set: park, cam: { pos: [-11.6, 5.4, 8], look: [-17.4, 5.4, -3], fov: 60, blur: 0.15 },
    act(lt, c) { P.lily.reset().place(-18.4, -2.6, 0.4, 6.4).pose('wave').talk(c.t).idle(c.t).setFace('talk'); P.nar.reset().place(-15, 0.6, -0.6).idle(c.t).setFace('neutral').eyes(2.3, [-0.5, 0.6]); } });
  shot({ line: 'and I forgot my phone existed.', set: park, sfx: [['tick', 'forgot', 1], ['tick', 'phone', 1], ['tick', 'existed', 1]], cam: frame(-15, 0.6, { size: 'medium', side: 14, dist: 1.15 }),
    act(lt, c) { const a = P.nar.reset().place(-15, 0.6, -0.8).pose({ aR: [130, 0] }).idle(c.t).setFace('laugh').eyes(2.3, [-0.6, 0.4]); a.armR.rotation.x += Math.sin(c.t * 16) * 0.35; } });
  shot({ line: 'My eyes shrank right back.', set: park, sfx: [['sparkle', 'shrank'], ['pop', 'shrank', 0.6]], cam: frame(-15, 0.6, { size: 'close', side: -10, dist: 1.1 }),
    act(lt, c) { const a = P.nar.reset().place(-15, 0.6, 0).idle(c.t).setFace('laugh'); beat(FP, a, lt, c.w('shrank'), 2.3, 1, 'laugh', [0, 0]); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I did real stuff.', set: park, cam: frame(2, 2, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { P.nar.reset().place(2, 2, 0.1).pose('cheer').jump((lt * 2.2) % 1, 0.8).setFace('laugh'); } });
  shot({ line: 'I played soccer.', set: park, sfx: [['thud', 'soccer', 0.6]], cam: frame(4, 2.4, { size: 'full', side: -12, dist: 1.15 }),
    act(lt, c) { const t0 = c.w('soccer'), k = remap(lt, t0, t0 + 0.7); const a = P.nar.reset().place(3, 2.4, Math.PI / 2 - 0.3).setFace('laugh'); if (lt < t0) a.walk(c.t, 0.8); else a.pose({ lR: lt < t0 + 0.2 ? 70 : 0, aL: [40, 30], aR: [40, 30] }); ball.show().position.set(4.2 + k * 8, 0.55 + Math.sin(k * Math.PI) * 3, 2.4 - k * 4); } });
  shot({ line: 'I baked cookies.', set: home, cam: frame(-4, 1.4, { size: 'close', side: 14 }),
    act(lt, c) { L.nar.reset().place(-4, 1.4, 0.2).pose({ aL: [80, -10], aR: [80, -10] }).idle(c.t).setFace('grin'); cookies.show().position.set(-4, 3.2, 3.1); } });
  shot({ line: 'I hugged my mom.', set: home, sfx: [['pop', 'mom', 0.5]], cam: frame(-2.6, 1.4, { size: 'medium', side: -10, dist: 1.1, h: 1.08 }),
    act(lt, c) { L.nar.reset().place(-1.6, 1.4, -0.9).pose('hug').idle(c.t).setFace('happy'); L.mom.reset().place(-3.8, 1.0, 0.9).pose('hug').idle(c.t).setFace(lt < c.w('mom') ? 'wow' : 'love'); } });
  shot({ line: 'By dinner, my eyes were normal.', set: home, light: 'warm', cam: frame(0, 1, { size: 'close', side: 8 }),
    act(lt, c) { L.nar.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I saw Noah,', set: park, light: 'warm', cam: frame(2, 2.4, { size: 'close', side: -14 }),
    act(lt, c) { sunset(); const a = P.nar.reset().place(2, 2.4, -0.2).idle(c.t); const k = remap(lt, c.w('saw'), c.w('saw') + 0.2); a.head.rotation.y -= 0.7 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'alone, glued to his phone.', set: park, light: 'warm', sfx: [['sad', 'phone', 0.8]], cam: { pos: [-4.6, 6.4, 11], look: [-7, 2.8, -1.2], fov: 52, blur: 0.04, push: 0.02 },
    act(lt, c) { sunset(); P.noah.reset().place(-7, -0.9, 0).sit(1.4).pose({ lL: 50, lR: 50 }).pose(PH).idle(c.t, 0.3).setFace('blank').eyes(2.6, [0, -0.8]); P.noah.head.rotation.x += 0.3; phones['P.noah'].show(); } });
  shot({ line: "I'd spent all day outside", set: park, light: 'warm', cam: frame(2, 2.4, { size: 'close', side: 16 }),
    act(lt, c) { sunset(); P.nar.reset().place(2, 2.4, -0.4).idle(c.t, 0.5).setFace(lt < c.w('outside') ? 'worried' : 'sad'); } });
  shot({ line: 'while my best friend was stuck in a screen.', set: park, light: 'warm', cam: frame(2, 2.4, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { sunset(); P.nar.reset().place(2, 2.4, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I sat down. Look up.', set: park, light: 'warm', cam: frame(-5.8, -0.9, { size: 'medium', side: 6, dist: 1.25 }),
    act(lt, c) { sunset(); P.noah.reset().place(-7, -0.9, 0.2).sit(1.4).pose({ lL: 50, lR: 50 }).pose(PH).idle(c.t, 0.3).setFace('blank').eyes(2.6, [0, -0.8]); phones['P.noah'].show(); P.nar.reset().place(-5.2, -0.9, -0.4).sit(1.4).pose({ lL: 50, lR: 50 }).talk(c.t, lt > c.w('look') ? 1 : 0).idle(c.t).setFace(lt < c.w('look') ? 'smile' : 'say'); } });
  shot({ line: 'Why? I pointed at the sky.', set: park, light: 'warm', cam: frame(-6.1, -0.9, { size: 'medium', side: -10, dist: 1.2 }),
    act(lt, c) { sunset(); const n = P.noah.reset().place(-7, -0.9, 0.3).sit(1.4).pose({ lL: 50, lR: 50 }).pose(PH).talk(c.t, lt < c.w('i') ? 1 : 0).idle(c.t).setFace(lt < c.w('i') ? 'say' : 'blank').eyes(2.6, [0.6, -0.4]); phones['P.noah'].show(); P.nar.reset().place(-5.2, -0.9, -0.3).sit(1.4).pose({ lL: 50, lR: 50 }).pose(lt < c.w('pointed') ? 'idle' : { aR: [150, -10] }).idle(c.t).setFace('smile'); } });
  shot({ line: 'His eyes shrank a little.', set: park, light: 'warm', sfx: [['sparkle', 'shrank'], ['pop', 'shrank', 0.5]], cam: frame(-7, -0.9, { size: 'close', side: 10, dist: 1.2 }),
    act(lt, c) { sunset(); const a = P.noah.reset().place(-7, -0.9, 0.1).sit(1.4).pose({ lL: 50, lR: 50 }).pose(PH).idle(c.t).setFace('wow'); a.head.rotation.x -= 0.25; phones['P.noah'].show(); beat(FP, a, lt, c.w('shrank'), 2.6, 1.7, 'wow', [0, 0.8]); } });
  shot({ line: 'Then he put his phone away.', set: park, light: 'warm', sfx: [['sparkle', 'away'], ['ding', 'away', 0.5]], cam: frame(-6.1, -0.9, { size: 'medium', side: -6, dist: 1.15 }),
    act(lt, c) { sunset(); const t0 = c.w('away'); const a = P.noah.reset().place(-7, -0.9, 0.1).sit(1.4).pose({ lL: 50, lR: 50 }).pose(lt < t0 ? PH : 'idle').idle(c.t).setFace('smile'); if (lt < t0) phones['P.noah'].show(); a.eyes(1.7, [0, 0.6]); beat(FP, a, lt, t0, 1.7, 1, 'grin', [0, 0.6], 1); P.nar.reset().place(-5.2, -0.9, -0.3).sit(1.4).pose({ lL: 50, lR: 50 }).idle(c.t).setFace('grin'); } });
  // payoff of the plant
  shot({ line: 'For the first time in a year, Noah watched a sunset.', set: park, light: 'warm', sfx: [['ding', 'sunset', 0.5]], cam: { pos: [-6.1, 6.0, -9.5], look: [-6.1, 5.4, 6], fov: 58, blur: 0.15, push: 0.02 },
    act(lt, c) { sunset(); P.noah.eyes(1), P.noah.reset().place(-7, -0.9, 0).sit(1.4).pose({ lL: 50, lR: 50 }).idle(c.t).setFace('grin'); P.nar.reset().place(-5.2, -0.9, 0).sit(1.4).pose({ lL: 50, lR: 50 }).idle(c.t).setFace('grin'); P.noah.head.rotation.x -= 0.15; P.nar.head.rotation.x -= 0.15; if (lt > c.w('watched')) P.nar.pose({ aL: [80, -60] }, remap(lt, c.w('watched'), c.w('watched') + 0.4)); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then his phone buzzed.', set: park, light: 'warm', sfx: [['tick', 'buzzed', 1.2], ['tick', 0.9, 1.2]], cam: frame(-6.1, -0.9, { size: 'medium', side: 8, dist: 1.1 }),
    act(lt, c) { sunset(); P.noah.eyes(1), P.noah.reset().place(-7, -0.9, 0.2).sit(1.4).pose({ lL: 50, lR: 50 }).idle(c.t).setFace(lt < c.w('buzzed') ? 'grin' : 'shock'); P.nar.reset().place(-5.2, -0.9, -0.2).sit(1.4).pose({ lL: 50, lR: 50 }).idle(c.t).setFace(lt < c.w('buzzed') ? 'grin' : 'shock'); P.noah.hip.position.x += lt > c.w('buzzed') ? Math.sin(c.t * 60) * 0.03 : 0; } });
  shot({ line: 'We both looked.', set: park, light: 'warm', cam: frame(-6.1, -0.9, { size: 'medium', side: -4, push: 0.07, dist: 0.9 }),
    act(lt, c) { sunset(); P.noah.eyes(1), P.noah.reset().place(-7, -0.9, 0.2).sit(1.4).pose({ lL: 50, lR: 50 }).pose({ head: [24, 0, 0] }).idle(c.t, 0.2).setFace('sus'); P.nar.reset().place(-5.2, -0.9, -0.2).sit(1.4).pose({ lL: 50, lR: 50 }).pose({ head: [24, 30, 0] }).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Eh. It can wait.', set: park, light: 'warm', cam: frame(-6.1, -0.9, { size: 'medium', side: -12, low: 0.3, dist: 1.0 }),
    act(lt, c) { sunset(); P.noah.eyes(1), P.noah.reset().place(-7, -0.9, 0.3).sit(1.4).pose({ lL: 50, lR: 50 }).pose(lt < c.w('wait') ? 'shrug' : { aL: [150, 20], aR: [150, 20] }).idle(c.t).setFace(lt < c.w('wait') ? 'smirk' : 'laugh'); P.nar.reset().place(-5.2, -0.9, -0.3).sit(1.4).pose({ lL: 50, lR: 50 }).pose(lt < c.w('wait') ? 'idle' : { aL: [150, 20], aR: [150, 20] }).idle(c.t).setFace(lt < c.w('wait') ? 'grin' : 'laugh'); } });
});
