// story.js: launch night. The whole town glows blue with one game, except the kid working the night shift at the chicken shop.
// Brand names are only spoken. On screen the shop is a generic "CHICKEN" shop and the game has no logo.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS, TEX, floor, tree, room, table, sofa, tv, rug } from './sets.js';
import { nightSky } from './night.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, rng, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 131, skin: 'tan', hair: 'short', hairColor: '#2b1b14', top: 'shirt', topColor: '#e8413c', bottom: 'slacks', bottomColor: '#15151a', cap: '#f4f4f4' },
  marco: { seed: 132, skin: 'light', hair: 'messy', hairColor: '#2b1b14', top: 'hoodie', topColor: '#2b3a6b', bottom: 'joggers', bottomColor: '#5a5f6a' },
  boss: { seed: 133, skin: 'fair', hair: 'bald', top: 'shirt', topColor: '#e8413c', bottom: 'slacks', bottomColor: '#15151a', glasses: true, height: 1.12 },
  kid: { seed: 134, skin: 'brown', hair: 'spiky', hairColor: '#17110f', top: 'tee', topColor: '#2e9e59', bottom: 'shorts', bottomColor: '#274b8f' },
  teacher: { seed: 135, skin: 'deep', hair: 'buns', hairColor: '#17110f', top: 'cardigan', topColor: '#7b3fc4', inner: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', glasses: true, height: 1.1 },
  mayor: { seed: 136, skin: 'light', hair: 'swoop', hairColor: '#d9d9d9', top: 'suit', topColor: '#2b2f38', tie: '#e8413c', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', height: 1.15 },
  kidB: { seed: 137, skin: 'fair', hair: 'ponytail', hairColor: '#e8b04a', top: 'stripes', topColor: '#f4f4f4', stripe: '#ff6fae', bottom: 'jeans', bottomColor: '#4f79a7' },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);
// controller held in both hands (on the right hand, centred between them when arms point forward)
function controller(av) { const g = grp(box(1.8, 0.35, 0.9, '#1b1d22', 0.15), at(box(0.5, 0.3, 0.7, '#1b1d22', 0.15), -0.75, -0.1, -0.25), at(box(0.5, 0.3, 0.7, '#1b1d22', 0.15), 0.75, -0.1, -0.25), at(box(0.18, 0.1, 0.18, glow('#7fd0ff', 1.6)), 0.4, 0.2, 0)); g.position.set(1.45, -0.3, 0.35); g.rotation.x = -0.7; g.scale.setScalar(0.6); av.handR.add(g); return prop(g); }
const PAD = { aL: [40, -24], aR: [40, -24], head: [16, 0, 0] };
const TVBLUE = '#7fb8ff';

// ───────── launch-night town: every window lit by a TV (shared material so a blackout kills them all) ─────────
function town() {
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(TVBLUE).multiplyScalar(1.5), toneMapped: false });
  const g = grp(nightSky(), at(floor(260, 160, TEX.grass('#3f8a4a'), 6), 0, -0.03, -20), at(floor(260, 8, TEX.concrete('#b8b4ad'), 5), 0, 0.02, 7), at(floor(260, 14, TEX.road(), 6), 0, 0.01, 18));
  for (let i = -10; i <= 10; i++) g.add(at(box(4, 0.04, 0.6, '#ffe45c'), i * 9, 0.04, 18));
  const COLS = [['#f2c7d0', '#b84a5a'], ['#bfe3ff', '#2f5f9a'], ['#fff0b8', '#c9822a'], ['#d6f2c4', '#3f8a4a'], ['#e4d0ff', '#6a4ab0'], ['#ffd9c2', '#b8603a']];
  const house = (c, r) => { const h = grp(at(box(10, 7, 8, c, 0.1), 0, 3.5, 0)); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 3.6, 4, 1), mat(r)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.08, 1, 0.86); roof.position.y = 8.8; h.add(roof); h.add(at(box(2.4, 4.6, 0.3, '#5a3524'), 0, 2.3, 4.05)); for (const x of [-3.2, 3.2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 0.2), winMat); w.position.set(x, 4.0, 4.05); h.add(w, at(box(2.5, 0.2, 0.3, '#f4f4f4'), x, 2.95, 4.1)); } return h; };
  for (let i = -3; i <= 3; i++) { if (i === 1) continue; const [c, r] = COLS[(i + 9) % 6]; g.add(at(house(c, r), i * 14, 0, -2)); g.add(at(tree(9 + (i % 2) * 2, '#2f7a3a'), i * 14 + 7, 0, -6)); }
  for (let i = -4; i <= 4; i++) { const [c, r] = COLS[(i + 7) % 6]; g.add(at(house(c, r), i * 14 + 7, 0, 36, Math.PI)); }
  // the chicken shop at x = 14: red and white stripes, glowing sign (never goes dark: generator)
  const shop = grp(at(box(12, 8, 9, '#f4f4f4', 0.1), 0, 4, 0), at(box(12.2, 1.4, 9.2, '#e8413c'), 0, 8.4, 0));
  for (let i = 0; i < 6; i++) shop.add(at(box(2, 0.4, 2.4, i % 2 ? '#f4f4f4' : '#e8413c'), -5 + i * 2, 6.6, 5.4));
  shop.add(at(sign('CHICKEN', 9, 1.8, { bg: '#e8413c', fg: '#fff', glowing: true }), 0, 10.4, 4.7), at(box(9, 4, 0.2, glow('#ffe7b0', 1.4)), 0, 3, 4.55), at(box(2.4, 5, 0.3, '#5a3524'), 4.2, 2.5, 4.6));
  g.add(at(shop, 14, 0, -2.5));
  return { group: g, light: 'night', winMat, shop, blackout(on) { winMat.color.set(on ? '#10131f' : new THREE.Color(TVBLUE).multiplyScalar(1.5)); } };
}
// ───────── inside the chicken shop ─────────
function shopInside() {
  const g = room({ floorTex: TEX.checker('#ffffff', '#e8413c'), tile: 4, wallColor: '#fff3e6', trim: '#e8413c', trimY: 4, w: 36, d: 26, lights: 2 });
  const counter = grp(at(box(16, 3.2, 2.2, '#f4f4f4'), 0, 1.6, -0.6), at(box(16.4, 0.3, 2.5, '#e8413c', 0.06), 0, 3.35, -0.6)); g.add(counter);
  for (const x of [-5, -2, 1]) g.add(at(box(2.4, 3.6, 2.2, '#9aa0a8', 0.1), x, 1.8, -4.4), at(box(2.0, 0.1, 1.8, glow('#ffb347', 1.3)), x, 3.62, -4.4));
  g.add(at(sign(['BUCKETS', 'WINGS', 'FRIES'], 7, 3.4, { bg: '#1b1d22', fg: '#ffd23f', border: '#e8413c', glowing: true }), 7, 8.2, -5.85), at(sign('CHICKEN', 8, 1.8, { bg: '#e8413c', fg: '#fff' }), -4, 9.6, -5.85));
  const tables = []; for (const [x, z] of [[-10, 7], [0, 8], [10, 7]]) { const t = table(5, 3.2, '#e8413c', 2.7); at(t, x, 0, z); g.add(t); tables.push([x, z]); }
  const candles = []; for (const [x, z] of tables) { const c = grp(at(box(0.3, 0.6, 0.3, '#f4efe6'), 0, 3.15, 0), at(box(0.22, 0.32, 0.22, glow('#ffb347', 2.2)), 0, 3.6, 0)); at(c, x, 0, z); g.add(c); prop(c); candles.push(c); }
  return { group: g, light: 'warm', tables, candles, counter, reset() { counter.visible = true; } };
}

start(() => {
  const T = town(), S = shopInside(), home = SETS.livingRoom();
  const TC = cast(T, ['nar', 'marco', 'kid', 'kidB', 'teacher', 'mayor', 'boss']);
  const SC = cast(S, ['nar', 'marco', 'kid', 'kidB', 'teacher', 'mayor', 'boss']);
  const HC = cast(home, ['marco']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FT = fx(T), FS = fx(S), FH = fx(home);
  T.reset = () => T.blackout(false);
  // props
  const pads = {}; for (const [k, a] of [['T.kid', TC.kid], ['T.kidB', TC.kidB], ['T.marco', TC.marco], ['S.kid', SC.kid], ['H.marco', HC.marco], ['S.kidB', SC.kidB], ['S.marco', SC.marco]]) pads[k] = controller(a);
  const phone = prop(grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.4)), 0, 0.08, 0))); SC.nar.handR.add(phone); phone.position.set(0, -0.2, 0.32);
  const bossPhone = prop(grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.4)), 0, 0.08, 0))); SC.boss.handR.add(bossPhone); bossPhone.position.set(0, -0.2, 0.32);
  const bucket = prop(grp((() => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.3, 18), mat('#e8413c')); b.position.y = 0.65; return b; })(), at(box(1.3, 0.2, 1.3, '#f4f4f4'), 0, 0.9, 0), ...[0, 1, 2, 3].map(i => at(box(0.45, 0.35, 0.3, '#c98a3a', 0.12), Math.cos(i * 1.6) * 0.35, 1.45, Math.sin(i * 1.6) * 0.35)))); S.group.add(bucket);
  const basket = prop(grp(at(box(1.6, 0.6, 1.0, '#9aa0a8', 0.05), 0, 0, 0), ...[0, 1, 2].map(i => at(box(0.45, 0.32, 0.3, '#d9a55a', 0.12), -0.4 + i * 0.4, 0.4, 0)))); SC.nar.handR.add(basket); basket.position.set(0, -0.3, 0.6); basket.rotation.x = -Math.PI / 2;
  const drum = prop(grp(at(box(0.5, 0.7, 0.5, '#c98a3a', 0.2), 0, 0, 0), at(box(0.15, 0.5, 0.15, '#f4efe6'), 0, -0.55, 0))); S.group.add(drum);
  const guitar = prop(grp(at(box(1.1, 1.3, 0.35, '#c98a3a', 0.3), 0, 0, 0), at(box(0.25, 1.8, 0.2, '#5a3524'), 0, 1.4, 0))); SC.kidB.handR.add(guitar); guitar.position.set(0.9, -0.4, 0.5); guitar.rotation.set(-1.2, 0, 1.0);
  const homeGlow = []; home.group.traverse(m => { if (m.isMesh && m.material && m.material.isMeshBasicMaterial && !m.material.map && m.material.color.b > 1.0) homeGlow.push(m); });
  home.reset = () => homeGlow.forEach(m => { m.visible = true; });
  const flash = function (lt) { const t = this.ft ?? -9; const d = lt - t; return d >= 0 && d < 0.18 ? (d < 0.06 ? 0.85 : d < 0.12 ? 0.2 : 0.6) : 0; };
  const shopX = 14;

  // ═══════════════ HOOK ═══════════════
  shot({ line: 'In this town,', set: T, sfx: [['whoosh', 0]], cam: { pos: [-22, 22, 40], look: [2, 4, 0], fov: 55, blur: 0.04, push: 0, to: { pos: [-15, 19, 34] }, ease: 'lin' },
    act(lt, c) { walkX(TC.kidB, -6, 9, 1, lt, c.t, 0.5, 'smile'); } });
  shot({ line: 'the night GTA 6 came out,', set: T, cam: frame(-8, 9, { size: 'close', side: 10 }),
    act(lt, c) { TC.kid.reset().place(-8, 9, 0.1).pose(PAD).idle(c.t).setFace(lt < c.w('out') ? 'wow' : 'laugh'); pads['T.kid'].show(); } });
  shot({ line: 'everybody stopped everything.', set: T, sfx: [['tick', 'stopped', 1.2]], cam: { ...frame(-4, 9, { size: 'wide', dist: 0.7 }), blur: 0.06 },
    act(lt, c) { const st = c.w('stopped'); const fz = lt < st ? lt : st; walkX(TC.kidB, -10, 8.4, 1, fz, lt < st ? c.t : 0, 0.6, lt < st ? 'smile' : 'wow'); walkX(TC.teacher, 3, 10, -1, fz, lt < st ? c.t : 0, 0.5, lt < st ? 'smile' : 'wow'); walkX(TC.mayor, -1, 9.2, 1, fz, lt < st ? c.t + 1 : 0, 0.4, lt < st ? 'smile' : 'wow'); if (lt > st) for (const a of [TC.kidB, TC.teacher, TC.mayor]) a.head.rotation.y = 0; } });
  shot({ line: 'Every window glowed blue.', set: T, sfx: [['pop', 'blue', 0.6]], cam: { pos: [-30, 14, 26], look: [-6, 4, -2], fov: 50, blur: 0.04, push: 0, to: { pos: [-18, 13, 26] }, ease: 'lin' },
    act(lt, c) { } });
  shot({ line: 'Every kid had a controller.', set: T, cam: frame(-6, 9, { size: 'medium', side: -10, dist: 1.25 }),
    act(lt, c) { TC.kid.reset().place(-8, 9, 0.4).pose(PAD).idle(c.t).setFace('laugh'); pads['T.kid'].show(); TC.kidB.reset().place(-4.2, 9.2, -0.4).pose(PAD).idle(c.t).setFace('grin'); pads['T.kidB'].show(); } });
  shot({ line: 'Everybody except me.', set: S, sfx: [['sad', 'me', 0.5]], cam: frame(-2, -2.4, { size: 'close', side: 10 }),
    act(lt, c) { SC.nar.reset().place(-2, -2.4, 0.1).idle(c.t, 0.5).setFace(lt < c.w('me') ? 'neutral' : 'sad'); } });
  shot({ line: 'Because I worked the night shift at KFC.', set: S, sfx: [['tick', 'shift', 0.6]], cam: frame(-2, -1.6, { size: 'medium', side: 12, dist: 1.1 }),
    act(lt, c) { S.counter.visible = false; SC.nar.reset().place(-2, -1.6, 0.05).pose({ aR: [70, 0] }).idle(c.t).setFace('neutral'); SC.nar.armR.rotation.x += Math.sin(c.t * 8) * 0.12; FS.puff.at((lt * 1.2) % 0.6, [-2, 3.8, -4.4]); } });
  shot({ line: 'While everyone else was stealing cars,', set: home, light: 'night', cam: frame(-4, 0.4, { size: 'medium', side: 8, dist: 1.2 }),
    act(lt, c) { HC.marco.reset().place(-4, -3.0, 0).sit(1.6).pose(PAD).idle(c.t).setFace('laugh'); HC.marco.armR.rotation.x += Math.sin(c.t * 22) * 0.1; pads['H.marco'].show(); } });
  shot({ line: 'I was stealing fries from the fryer.', set: S, cam: frame(-2, -2.4, { size: 'close', side: -14 }),
    act(lt, c) { SC.nar.reset().place(-2, -2.4, -0.3).pose({ aR: [150, -40] }, remap(lt, c.w('fries'), c.w('fries') + 0.2)).idle(c.t).setFace(lt < c.w('fries') ? 'sus' : 'smirk'); } });
  shot({ line: 'My best friend Marco called.', set: S, sfx: [['tick', 'called', 1.0], ['tick', 0.9, 1.0]], cam: frame(-2, -2.4, { size: 'close', side: 10 }),
    act(lt, c) { SC.nar.reset().place(-2, -2.4, 0.1).pose({ aR: [80, -20] }, remap(lt, c.w('called'), c.w('called') + 0.2)).idle(c.t).setFace('neutral'); if (lt > c.w('called')) phone.show(); } });
  shot({ line: "Bro, you're missing everything.", set: home, light: 'night', cam: frame(-4, -3, { size: 'close', side: 34 }),
    act(lt, c) { HC.marco.reset().place(-4, -3.0, 0.2).sit(1.6).pose({ aL: [40, -24], aR: [80, -20] }).talk(c.t).idle(c.t).setFace('talk'); } });
  shot({ line: "I said, I'm frying chicken.", set: S, cam: frame(-2, -2.4, { size: 'face', side: 24, push: 0.06 }),
    act(lt, c) { SC.nar.reset().place(-2, -2.4, 0).pose({ aR: [55, -35] }).talk(c.t, lt > c.w("i'm") ? 1 : 0).idle(c.t, 0.3).setFace(lt < c.w("i'm") ? 'neutral' : 'sus'); phone.show(); } });
  shot({ line: 'A kid came in for a bucket,', set: S, sfx: [['tick', 'in', 0.6]], cam: frame(2, 2.6, { size: 'full', side: -10, dist: 1.2 }),
    act(lt, c) { walkX(SC.kid, 8, 3.0, -1, Math.min(lt, 0.9), lt < 0.9 ? c.t : 0, 0.6, 'smile').pose(PAD); pads['S.kid'].show(); SC.nar.reset().place(-1, -1.6, 0.2).idle(c.t).setFace('smile'); } });
  shot({ line: 'still holding his controller.', set: S, cam: frame(4.2, 3.0, { size: 'close', side: 14 }),
    act(lt, c) { SC.kid.reset().place(4.2, 3.0, -0.4).pose(PAD).idle(c.t).setFace('blank'); SC.kid.armR.rotation.x += Math.sin(c.t * 22) * 0.1; pads['S.kid'].show(); } });
  shot({ line: "He asked if I'd seen the map.", set: S, cam: frame(4.2, 3.0, { size: 'close', side: -10 }),
    act(lt, c) { SC.kid.reset().place(4.2, 3.0, -0.6).pose(PAD).talk(c.t).idle(c.t).setFace('say'); pads['S.kid'].show(); } });
  shot({ line: 'I had not seen the map.', set: S, cam: frame(-1, -1.6, { size: 'face', side: 6, push: 0.07 }),
    act(lt, c) { SC.nar.reset().place(-1, -1.6, 0).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Even my manager was playing it', set: S, cam: { pos: [3.2, 5.6, 3.4], look: [-3.4, 4.4, -4.2], fov: 58, blur: 0.25 },
    act(lt, c) { SC.boss.reset().place(-3.4, -3.0, 0.4).pose({ aR: [80, -20], head: [24, 0, 0] }).idle(c.t).setFace('laugh'); bossPhone.show(); } });
  shot({ line: 'behind the fryer.', set: S, cam: frame(-3.4, -3.0, { size: 'close', h: 1.12, side: 20 }),
    act(lt, c) { SC.boss.reset().place(-3.4, -3.0, 0.4).pose({ aR: [80, -20], head: [24, 0, 0] }).idle(c.t).setFace('laugh'); bossPhone.show(); } });
  shot({ line: 'I fried chicken for six hours straight.', set: S, cam: frame(-2, -1.6, { size: 'close', side: -12 }),
    act(lt, c) { S.counter.visible = false; const a = SC.nar.reset().place(-2, -1.6, 0.1).pose({ aR: [70, 0], aL: [70, 0] }).idle(c.t).setFace('sleepy'); a.armR.rotation.x += Math.sin(c.t * 9) * 0.15; FS.puff.at((lt * 1.2) % 0.6, [-2, 3.8, -4.4]); } });

  // ═══════════════ THE STORM ═══════════════
  { const d = shot({ line: "And that's when the storm hit. Boom.", set: T, sfx: [['thud', 'boom', 1.4], ['whoosh', 'storm', 0.6]], cam: { pos: [-20, 12, 30], look: [0, 10, -10], fov: 55, blur: 0.04 },
      act(lt, c) { c.shot.ft = c.w('boom'); } }); d.flash = flash; }
  { const d = shot({ line: 'The whole town went dark.', set: T, sfx: [['fall', 'dark', 0.8]], cam: { pos: [-30, 14, 26], look: [-6, 4, -2], fov: 50, blur: 0.04, push: 0.02 },
      act(lt, c) { T.blackout(lt > c.w('dark')); } }); }
  shot({ line: 'Every TV. Every console.', set: home, light: 'night', cam: frame(-4, -3, { size: 'medium', side: 6, dist: 1.2 }),
    act(lt, c) { const off = lt > c.w('tv'); HC.marco.reset().place(-4, -3.0, 0).sit(1.6).pose(PAD).idle(c.t).setFace(off ? 'shock' : 'laugh'); pads['H.marco'].show(); homeGlow.forEach(m => { m.visible = !off; }); } });
  shot({ line: 'Every single save file.', set: home, light: 'night', sfx: [['sad', 'file', 0.6]], cam: frame(-4, -3, { size: 'face', side: -6, push: 0.07 }),
    act(lt, c) { homeGlow.forEach(m => { m.visible = false; }); HC.marco.reset().place(-4, -3.0, 0).sit(1.6).idle(c.t, 0.2).setFace(lt < c.w('file') ? 'shock' : 'cry'); } });
  shot({ line: 'Except one building.', set: T, cam: { pos: [-4, 6, 26], look: [shopX, 6, -2], fov: 50, blur: 0.06, push: 0.03 },
    act(lt, c) { T.blackout(true); } });
  shot({ line: 'Our fryers ran on a generator.', set: S, sfx: [['tick', 'generator', 0.6]], cam: frame(-2, -1.6, { size: 'full', side: 8, dist: 1.0 }),
    act(lt, c) { S.counter.visible = false; SC.nar.reset().place(-2, -1.6, 0.2).pose('hips').idle(c.t).setFace('smug'); } });
  shot({ line: 'So the whole town showed up.', set: T, sfx: [['whoosh', 'showed', 0.6]], cam: { pos: [2, 6, 24], look: [shopX, 4, 2], fov: 56, blur: 0.06 },
    act(lt, c) { T.blackout(true); [TC.kid, TC.kidB, TC.teacher, TC.mayor, TC.marco].forEach((a, i) => { walkX(a, -6 - i * 3, 8 + (i % 2) * 1.6, 1, lt, c.t + i, 0.7, 'smile'); }); pads['T.kid'].show(); pads['T.marco'].show(); } });
  shot({ line: 'Hungry. Bored. Lost without their game.', set: S, cam: { ...frame(2, 4, { size: 'wide', dist: 0.6 }), blur: 0.08 },
    act(lt, c) { [SC.kid, SC.kidB, SC.teacher, SC.mayor].forEach((a, i) => a.reset().place(-6 + i * 4, 4 + (i % 2) * 1.6, 0).idle(c.t + i).setFace(['blank', 'sad', 'sleepy', 'worried'][i])); pads['S.kid'].show(); } });
  shot({ line: 'And for one night,', set: S, cam: frame(-1, -1.6, { size: 'close', side: -10 }),
    act(lt, c) { SC.nar.reset().place(-1, -1.6, 0).idle(c.t).setFace('neutral'); } });
  shot({ line: 'I was the most popular kid in town.', set: S, sfx: [['ding', 'popular', 0.5]], cam: { ...frame(-1, -1.2, { size: 'full', low: 0.4, dist: 1.0 }) },
    act(lt, c) { S.counter.visible = false; SC.nar.reset().place(-1, -1.2, 0).pose('cheer').idle(c.t).setFace('laugh'); } });
  shot({ line: 'I served wings to my teacher.', set: S, sfx: [['pop', 'teacher', 0.5]], cam: frame(-1.6, -0.4, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { SC.nar.reset().place(-3, -1.6, 0.6).pose({ aR: [80, 20] }).idle(c.t).setFace('grin'); basket.show(); SC.teacher.reset().place(0.4, 1.4, -0.6).idle(c.t).setFace(lt < c.w('teacher') ? 'smile' : 'love'); } });
  shot({ line: 'Fries to the mayor.', set: S, sfx: [['pop', 'mayor', 0.5]], cam: frame(-1.6, -0.4, { size: 'medium', h: 1.1, side: -10, dist: 1.25 }),
    act(lt, c) { SC.nar.reset().place(-3, -1.6, 0.6).pose({ aR: [80, 20] }).idle(c.t).setFace('grin'); basket.show(); SC.mayor.reset().place(0.4, 1.4, -0.6).idle(c.t).setFace(lt < c.w('mayor') ? 'neutral' : 'grin'); } });
  shot({ line: 'A bucket to Marco,', set: S, sfx: [['pop', 'marco', 0.5]], cam: frame(-1.6, -0.4, { size: 'medium', side: 8, dist: 1.25 }),
    act(lt, c) { SC.nar.reset().place(-3, -1.6, 0.6).pose({ aR: [80, 20] }).idle(c.t).setFace('grin'); bucket.show().position.set(-1.6, 3.5, -0.6); SC.marco.reset().place(0.4, 1.4, -0.6).idle(c.t).setFace('smile'); } });
  shot({ line: 'who looked kind of guilty.', set: S, cam: frame(0.4, 1.4, { size: 'face', side: -10, push: 0.06 }),
    act(lt, c) { SC.marco.reset().place(0.4, 1.4, -0.2).pose({ head: [10, 0, 0] }).idle(c.t, 0.3).setFace('worried'); } });
  shot({ line: 'He said, sorry I made fun of your job.', set: S, cam: frame(0.4, 1.4, { size: 'close', side: 14 }),
    act(lt, c) { SC.marco.reset().place(0.4, 1.4, -0.4).pose('shy').talk(c.t, lt > c.w('sorry') ? 1 : 0).idle(c.t).setFace(lt < c.w('sorry') ? 'worried' : 'say'); } });
  shot({ line: "I said, sit down. I've got a break.", set: S, cam: frame(-3, -1.6, { size: 'close', side: -14 }),
    act(lt, c) { SC.nar.reset().place(-3, -1.6, 0.4).pose('open', remap(lt, c.w('sit'), c.w('sit') + 0.2)).talk(c.t, lt > c.w('sit') ? 1 : 0).idle(c.t).setFace(lt < c.w('sit') ? 'smile' : 'grin'); } });
  shot({ line: 'We ate chicken by candlelight', set: S, cam: { pos: [1.4, 6.0, 15.4], look: [0, 3.6, 8], fov: 56, blur: 0.25 },
    act(lt, c) { S.candles.forEach(cd => cd.show()); SC.nar.reset().place(-1.4, 6.6, 0).sit(1.5).pose({ aR: [80, -10] }).idle(c.t).setFace('laugh'); SC.marco.reset().place(1.6, 6.6, 0).sit(1.5).pose({ aR: [80, -10] }).idle(c.t).setFace('laugh'); bucket.show().position.set(0, 2.83, 8.4); } });
  shot({ line: 'and everyone traded stories.', set: S, cam: { ...frame(0, 6, { size: 'wide', dist: 0.62 }), blur: 0.08 },
    act(lt, c) { S.candles.forEach(cd => cd.show()); [SC.kid, SC.kidB, SC.teacher, SC.mayor, SC.boss].forEach((a, i) => { const [x, z] = [[-11.6, 5.4], [-8.4, 5.4], [8.4, 5.4], [11.6, 5.4], [3, 6]][i]; a.reset().place(x, z, 0).sit(1.5).talk(c.t + i * 0.7, i % 2).idle(c.t + i).setFace(['laugh', 'talk', 'laugh', 'grin', 'laugh'][i]); }); SC.nar.reset().place(-1.4, 6.6, 0).sit(1.5).idle(c.t).setFace('laugh'); SC.marco.reset().place(1.6, 6.6, 0).sit(1.5).idle(c.t).setFace('talk').talk(c.t); } });
  shot({ line: 'Somebody even brought a guitar.', set: S, sfx: [['ding', 'guitar', 0.4]], cam: frame(10, 5.6, { size: 'medium', side: -12, dist: 1.2 }),
    act(lt, c) { S.candles.forEach(cd => cd.show()); const a = SC.kidB.reset().place(10.6, 4.4, -0.3).sit(1.5).pose({ aL: [70, -20], aR: [60, 20] }).idle(c.t).setFace('grin'); a.armR.rotation.x += Math.sin(c.t * 12) * 0.25; guitar.show(); } });
  shot({ line: 'Nobody looked at a screen once.', set: S, cam: { pos: [-6, 9.4, 18], look: [0, 3.6, 6], fov: 56, blur: 0.06, push: 0.02 },
    act(lt, c) { S.candles.forEach(cd => cd.show()); [SC.kid, SC.kidB, SC.teacher, SC.mayor].forEach((a, i) => { const [x, z] = [[-11.6, 5.4], [-8.4, 5.4], [8.4, 5.4], [11.6, 5.4]][i]; a.reset().place(x, z, 0).sit(1.5).idle(c.t + i).setFace(['laugh', 'grin', 'laugh', 'grin'][i]); }); SC.nar.reset().place(-1.4, 6.6, 0).sit(1.5).idle(c.t).setFace('laugh'); SC.marco.reset().place(1.6, 6.6, 0).sit(1.5).idle(c.t).setFace('laugh'); } });
  shot({ line: 'When the power came back,', set: T, sfx: [['ding', 'back', 0.6]], cam: { pos: [-30, 14, 26], look: [-6, 4, -2], fov: 50, blur: 0.04, push: 0.02 },
    act(lt, c) { T.blackout(lt < c.w('back')); } });
  shot({ line: 'nobody even moved.', set: S, cam: { pos: [1.4, 6.0, 15.4], look: [0, 3.6, 8], fov: 56, blur: 0.25, push: 0.03 },
    act(lt, c) { SC.nar.reset().place(-1.4, 6.6, 0).sit(1.5).idle(c.t).setFace('grin'); SC.marco.reset().place(1.6, 6.6, 0).sit(1.5).idle(c.t).setFace('grin'); bucket.show().position.set(0, 2.83, 8.4); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then Marco whispered,', set: S, cam: frame(1.6, 6.6, { size: 'close', side: -14 }),
    act(lt, c) { SC.marco.reset().place(1.6, 6.6, -0.5).sit(1.5).pose({ lean: [12, 0] }).idle(c.t).setFace('smirk'); } });
  shot({ line: "don't worry, I'll tell you how the game ends.", set: S, sfx: [['pop', 'ends', 0.5]], cam: frame(1.6, 6.6, { size: 'face', side: 8 }),
    act(lt, c) { SC.marco.reset().place(1.6, 6.6, -0.3).sit(1.5).talk(c.t).idle(c.t).setFace(lt < c.w('ends') + 0.2 ? 'say' : 'smug'); } });
  shot({ line: 'I threw a drumstick at him.', set: S, sfx: [['whoosh', 'threw', 0.6], ['thud', 'him', 0.7]], cam: { pos: [0.2, 5.8, 13.6], look: [0.2, 4.6, 6.6], fov: 58, blur: 0.25 },
    act(lt, c) { const t0 = c.w('threw'), k = remap(lt, t0, c.w('him')); SC.nar.reset().place(-1.4, 6.6, 0.6).sit(1.5).pose(lt < t0 ? 'idle' : { aR: [140, 0] }).idle(c.t).setFace('smirk'); drum.show().position.set(lerp(-1.6, 1.6, k), 5.2 + Math.sin(k * Math.PI) * 1.2, 6.6); drum.rotation.z = k * 8; SC.marco.reset().place(1.6, 6.6, -0.5).sit(1.5).idle(c.t).setFace(k < 1 ? 'smug' : 'shock'); } });
  shot({ line: 'Best launch night ever.', set: S, cam: frame(0, 6.6, { size: 'medium', side: -8, low: 0.3, dist: 1.1 }),
    act(lt, c) { S.candles.forEach(cd => cd.show()); SC.nar.reset().place(-1.4, 6.6, 0.2).sit(1.5).pose(lt < c.w('ever') ? 'idle' : { aL: [150, 30], aR: [150, 30] }).idle(c.t).setFace('laugh'); SC.marco.reset().place(1.6, 6.6, -0.2).sit(1.5).pose(lt < c.w('ever') ? 'idle' : { aL: [150, 30], aR: [150, 30] }).idle(c.t).setFace('laugh'); } });
});
