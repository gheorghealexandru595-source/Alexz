// story.js: "In this town, every thank-you you say makes you glow."  Ungrateful people walk around in the dark.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, canvasTex, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 81, skin: 'light', hair: 'swoop', hairColor: '#e8b04a', top: 'hoodie', topColor: '#2f7de1', bottom: 'jeans', bottomColor: '#4f79a7' },
  eli: { seed: 82, skin: 'tan', hair: 'curly', hairColor: '#2b1b14', top: 'tee', topColor: '#7b3fc4', bottom: 'cargo', bottomColor: '#5a5f6a', backpack: '#e8413c' },
  rosa: { seed: 83, skin: 'brown', hair: 'long', hairColor: '#17110f', top: 'dress', topColor: '#ffd23f', bottom: 'skirt', bottomColor: '#ff9f2e' },
  grandma: { seed: 84, skin: 'fair', hair: 'bob', hairColor: '#d9d9d9', top: 'cardigan', topColor: '#e84b6a', inner: '#f4f4f4', sleeves: 'long', bottom: 'skirt', bottomColor: '#7b3fc4', glasses: true, height: 0.95 },
  janitor: { seed: 85, skin: 'deep', hair: 'buzz', hairColor: '#222222', top: 'shirt', topColor: '#2e9e59', sleeves: 'long', bottom: 'slacks', bottomColor: '#4a4a4a', cap: '#2e9e59', height: 1.12 },
  lady: { seed: 86, skin: 'tan', hair: 'buns', hairColor: '#2b1b14', top: 'shirt', topColor: '#f4f4f4', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b3a6b', height: 1.1 },
  kidA: { seed: 87, skin: 'fair', hair: 'messy', hairColor: '#c98a3a', top: 'stripes', topColor: '#f4f4f4', stripe: '#2e9e59', bottom: 'shorts', bottomColor: '#2b3a6b' },
  sis: { seed: 88, skin: 'light', hair: 'ponytail', hairColor: '#e8b04a', top: 'tee', topColor: '#ff6fae', bottom: 'skirt', bottomColor: '#7fd0ff', height: 0.65 },
};
const BASE = { nar: 0.35, eli: -0.8, rosa: 1.0 };   // light level: -1 dark ... 0 normal ... 1 glowing
const ALL = [];
const haloTex = canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,230,140,0.9)'); gr.addColorStop(0.5, 'rgba(255,210,90,0.35)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const shadeTex = canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(20,20,40,0.55)'); gr.addColorStop(1, 'rgba(20,20,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
function cast(set, keys) {
  const o = {};
  for (const k of keys) {
    const a = makeAvatar(LOOK[k]); a.base = BASE[k] ?? 0; a.mats = [];
    a.root.traverse(m => { if (m.isMesh) for (const mt of [].concat(m.material)) { const face = mt.map && mt.map.image && mt.map.image.width === 768; if (!face && !a.mats.includes(mt)) { mt.base = mt.color.clone(); a.mats.push(mt); } } });
    a.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); a.halo.position.set(0, 3.2, -0.6); a.halo.scale.set(9, 11, 1); a.root.add(a.halo);
    a.shade = new THREE.Sprite(new THREE.SpriteMaterial({ map: shadeTex, transparent: true, depthWrite: false })); a.shade.position.set(0, 3.0, -0.7); a.shade.scale.set(8, 10, 1); a.root.add(a.shade);
    set.group.add(a.root); ALL.push(a); o[k] = a;
  }
  return o;
}
const warm = new THREE.Color('#ffc861');
function lit(av, v) {
  if (av._v === v) return av; av._v = v;
  const dim = v < 0 ? 1 + v * 0.85 : 1, em = v > 0 ? v * 0.32 : 0;
  for (const m of av.mats) { m.color.copy(m.base).multiplyScalar(dim); m.emissive.copy(warm).multiplyScalar(em); }
  av.halo.visible = v > 0.05; av.halo.material.opacity = clamp(v * 0.55, 0, 0.7);
  av.shade.visible = v < -0.05; av.shade.material.opacity = clamp(-v, 0, 1);
  return av;
}
PRE.push(() => { for (const a of ALL) lit(a, a.base); });
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['LAMPS', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'SAY\nTHANKS!', bannerBg: '#ffd23f', locker: '#2f7de1', door: 'ROOM 3', poster: 'PICTURE\nDAY', posterBg: '#e8413c' });
  const cls = SETS.classroom({ board: ['CLASS PHOTO', 'SMILE!'] });
  const home = SETS.livingRoom();
  const caf = SETS.cafeteria({ menu: 'TODAY: SANDWICHES!', rule: 'SAY\nPLEASE' });
  caf.reset = () => { caf.tables[1].visible = true; };
  const S = cast(street, ['nar', 'eli', 'rosa', 'kidA', 'janitor']);
  const H = cast(hall, ['nar', 'eli', 'rosa', 'kidA', 'janitor']);
  const K = cast(cls, ['nar', 'eli', 'rosa', 'kidA', 'lady']);
  const L = cast(home, ['nar', 'grandma', 'sis']);
  const C = cast(caf, ['nar', 'eli', 'rosa', 'lady']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fx(street), FH = fx(hall), FK = fx(cls), FL = fx(home), FC = fx(caf);
  // RULE FIRES: light v0 -> v1 (brighter = sparkle + rise, dimmer = fall), scream face then rest face
  const beat = (F, av, lt, t0, v0, v1, rest, spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.out(remap(dt, 0.05, 0.4)); lit(av, lerp(v0, v1, k));
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0 && v1 > v0) F.sp[spi].at(dt, av.root.position.toArray(), av.root.scale.x);
    if (dt >= 0 && v1 < v0) F.puff.at(dt, [av.root.position.x, 3, av.root.position.z + 0.6]);
  };
  // props
  const sweater = prop(grp(box(2.2, 2.0, 0.4, '#e84b6a', 0.15), at(box(2.2, 0.3, 0.42, '#f4f4f4'), 0, 0.4, 0), at(box(2.2, 0.3, 0.42, '#f4f4f4'), 0, -0.4, 0))); L.grandma.handR.add(sweater); sweater.position.set(1.5, -0.4, 0.4); sweater.rotation.x = -Math.PI / 2;
  const stopSign = prop(grp(at(box(0.15, 3.4, 0.15, '#9aa0a8'), 0, 0, 0), at(sign('STOP', 1.6, 1.6, { bg: '#e8413c', fg: '#fff' }), 0, 2.0, 0.1))); S.janitor.handR.add(stopSign); stopSign.position.set(0, -0.3, 0.4); stopSign.rotation.x = -Math.PI / 2;
  const camBox = prop(grp(box(1.6, 1.1, 0.9, '#17181c', 0.1), (() => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.6, 18), mat('#2b2f38')); l.rotation.x = Math.PI / 2; l.position.z = 0.7; return l; })())); K.lady.root.add(camBox); camBox.position.set(0, 4.7, 1.1);
  const sandwich = prop(grp(box(1.2, 0.18, 1.0, '#f2c14e', 0.05), at(box(1.25, 0.12, 1.05, '#2e9e59'), 0, 0.15, 0), at(box(1.2, 0.18, 1.0, '#f2c14e', 0.05), 0, 0.3, 0))); C.nar.handR.add(sandwich); sandwich.position.set(0, -0.3, 0.4);
  const wrench = prop(grp(box(0.25, 1.6, 0.25, '#9aa0a8'), at(box(0.7, 0.3, 0.25, '#9aa0a8'), 0, 0.8, 0))); H.janitor.handR.add(wrench); wrench.position.set(0, -0.3, 0.3); wrench.rotation.x = -Math.PI / 2;
  const N = H.nar, EL = H.eli, R = H.rosa;
  const tT = () => { const t = caf.tables[1].children; t[1].visible = t[2].visible = false; };
  const flashW = function (lt) { return (this.ft || []).reduce((m, t) => Math.max(m, lt - t >= 0 && lt - t < 0.1 ? 0.75 * (1 - (lt - t) / 0.1) : 0), 0); };

  // ═══════════════ HOOK (street) ═══════════════
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [0, 4.4, 17.5], look: [0, 4.2, 2], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) { S.rosa.reset().place(3.6, 3.4, -0.3).pose('wave').idle(c.t).setFace('grin'); walkX(S.eli, -6, 4.6, 1, lt, c.t, 0.5, 'sad'); S.kidA.reset().place(-1, 2, 0.2).idle(c.t).setFace('smile'); } });
  shot({ line: 'every thank-you you say', set: street, cam: frame(-1, 4, { size: 'close', side: 12 }),
    act(lt, c) { S.kidA.reset().place(-1, 4, 0.2).pose(lt < c.w('thank-you') ? 'idle' : 'open').talk(c.t, lt > c.w('thank-you') ? 1 : 0).idle(c.t).setFace(lt < c.w('thank-you') ? 'smile' : 'talk'); } });
  shot({ line: 'makes you glow.', set: street, sfx: [['sparkle', 'glow'], ['rise', 'glow', 0.6]], cam: frame(-1, 4, { size: 'full', side: -8, dist: 0.95 }),
    act(lt, c) { const a = S.kidA.reset().place(-1, 4, -0.1).pose('open').idle(c.t); beat(FS, a, lt, c.w('glow'), 0, 1.0, 'grin'); } });
  shot({ line: "That's why polite people light up the street,", set: street, cam: { pos: [-6, 3.8, 13], look: [-6, 4, 3], fov: 60, blur: 0.15, push: 0, to: { pos: [5, 3.8, 13], look: [5, 4, 3] }, ease: 'lin' },
    act(lt, c) { S.rosa.reset().place(-5, 3.6, 0.2).pose('wave').idle(c.t).setFace('grin'); lit(walkX(S.kidA, -1, 2.2, 1, lt, c.t, 0.6, 'grin'), 0.8); lit(S.nar.reset().place(5.4, 3.4, -0.2).pose('open').idle(c.t).setFace('smile'), 0.9); } });
  shot({ line: 'and rude people', set: street, cam: frame(-4, 3, { size: 'medium', low: 0.42, side: -14 }),
    act(lt, c) { lit(S.janitor.reset().place(-4, 3, -0.2).pose('hips').idle(c.t).setFace('mad'), -0.8); } });
  shot({ line: 'walk around in the dark.', set: street, sfx: [['thud', 'dark', 0.8]], cam: frame(-6.8, 5.6, { size: 'full', side: 12, h: 1.12, dist: 1.05 }),
    act(lt, c) { const t0 = c.w('dark'), k = remap(lt, 0, t0); const j = lit(S.janitor.reset().place(lerp(-11, -8.3, k), 7.6, Math.PI / 2).walk(lt < t0 ? c.t : 0, lt < t0 ? 0.6 : 0).setFace(lt < t0 ? 'mad' : 'shock'), -0.8); if (lt > t0) j.pose({ aL: [140, -20], aR: [140, -20], lean: [-12, 0] }); FS.puff.at(lt - t0, [-8, 5.4, 7.6]); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'I had a nice warm glow.', set: hall, cam: frame(0, 1, { size: 'full', side: -6, dist: 0.9 }),
    act(lt, c) { N.reset().place(0, 1, 0.1).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Eli', set: hall, cam: frame(-7, 0.6, { size: 'close', side: -12 }),
    act(lt, c) { const e = EL.reset().place(-7, 0.6, -0.15).pose('wave', remap(lt, 0.1, 0.4)).idle(c.t).setFace('smile'); e.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: 'was so dark people bumped into him.', set: hall, sfx: [['thud', 'bumped', 0.9]], cam: frame(-6, 0.8, { size: 'full', side: 10, dist: 1.1 }),
    act(lt, c) { const t0 = c.w('bumped'); EL.reset().place(-6, 0.6, 0).idle(c.t).setFace(lt < t0 ? 'sad' : 'shock'); const k = remap(lt, 0, t0); const b = H.kidA.reset().place(lerp(-11, -7.8, k), 0.6, Math.PI / 2); if (lt < t0) b.walk(c.t, 0.7).setFace('smile'); else b.pose({ aL: [60, 30], aR: [60, 30] }).jump(remap(lt, t0, t0 + 0.4), 0.6).setFace('shock'); } });
  // plant: never visible in the class photo
  snapShot();
  function snapShot() {
    const d = shot({ line: "He hadn't shown up in a class photo in two years.", set: cls, sfx: [['tick', 'photo', 1.4]], cam: { pos: [1.6, 5.2, 13.4], look: [1.4, 3.8, -1], fov: 58, blur: 0.08 },
      act(lt, c) { cls.desks.visible = false; c.shot.ft = [c.w('photo')]; K.lady.reset().place(-5.6, 7.4, Math.PI + 0.55).pose({ aL: [96, -24], aR: [96, -24] }).idle(c.t); camBox.show(); K.rosa.reset().place(-3, 0, 0.2).pose('cheer').idle(c.t).setFace('grin'); K.kidA.reset().place(0, -0.6, 0).pose('open').idle(c.t).setFace('grin'); K.eli.reset().place(3, 0, -0.2).idle(c.t).setFace(lt < c.w('two') ? 'smile' : 'sad'); K.nar.reset().place(5.6, -0.6, -0.3).pose('cheer').idle(c.t).setFace('grin'); } });
    d.flash = flashW;
  }
  shot({ line: 'Meanwhile, Rosa thanked everything.', set: hall, cam: frame(7, 0.6, { size: 'full', side: -8 }),
    act(lt, c) { R.reset().place(7, 0.6, 0).pose('open').idle(c.t).setFace('grin'); walkX(H.kidA, 12, 2.4, -1, lt, c.t, 0.6, 'smile'); } });
  shot({ line: 'The bus driver? Thanks!', set: street, sfx: [['pop', 'thanks', 0.5]], cam: frame(3, 3, { size: 'close', side: 14 }),
    act(lt, c) { S.rosa.reset().place(3, 3, 0.3).pose(lt < c.w('thanks') ? 'idle' : 'wave').talk(c.t, lt > c.w('thanks') ? 1 : 0).idle(c.t).setFace(lt < c.w('thanks') ? 'smile' : 'talk'); } });
  shot({ line: 'Her sandwich? Thanks!', set: caf, sfx: [['pop', 'thanks', 0.5]], cam: frame(-7.5, 0.4, { size: 'close', side: -14 }),
    act(lt, c) { C.rosa.reset().place(-7.5, 0.4, -0.3).pose({ aR: [80, -10] }).talk(c.t, lt > c.w('thanks') ? 1 : 0).idle(c.t).setFace(lt < c.w('thanks') ? 'smile' : 'talk'); } });
  shot({ line: 'A pigeon? Thanks!', set: street, sfx: [['pop', 'thanks', 0.5]], cam: frame(-3, 2, { size: 'face', side: 4, push: 0.06 }),
    act(lt, c) { S.rosa.reset().place(-3, 2, 0).talk(c.t, lt > c.w('thanks') ? 1 : 0).idle(c.t, 0.4).setFace(lt < c.w('thanks') ? 'smile' : 'wink'); } });

  // ═══════════════ INCITING (home) ═══════════════
  shot({ line: 'Then my grandma knit me a sweater,', set: home, sfx: [['pop', 'sweater', 0.5]], cam: frame(2.2, 1.2, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { L.grandma.reset().place(3.6, 1.0, -0.6).pose({ aL: [78, -8], aR: [78, -8] }).idle(c.t).setFace('grin'); sweater.show(); lit(L.nar.reset().place(0.6, 1.4, 0.6).idle(c.t).setFace('smile'), 0.35); } });
  shot({ line: "and I just said, it's itchy.", set: home, cam: frame(0.6, 1.4, { size: 'close', side: -14 }),
    act(lt, c) { lit(L.nar.reset().place(0.6, 1.4, 0.3).pose('shrug', remap(lt, c.w("it's"), c.w("it's") + 0.2)).talk(c.t, lt > c.w("it's") ? 1 : 0).idle(c.t).setFace(lt < c.w("it's") ? 'neutral' : 'smirk'), 0.35); } });
  shot({ line: 'I went dim.', set: home, sfx: [['fall', 'dim', 0.8], ['sad', 'dim', 0.5]], cam: frame(1.0, 1.4, { size: 'full', side: 8, dist: 0.95 }),
    act(lt, c) { const a = L.nar.reset().place(1.0, 1.4, 0).idle(c.t); beat(FL, a, lt, c.w('dim'), 0.35, -0.8, 'worried'); } });
  shot({ line: 'Grandma squinted to find me.', set: home, cam: frame(3.6, 1.0, { size: 'close', h: 0.95, side: -40 }),
    act(lt, c) { L.grandma.reset().place(3.6, 1.0, -0.4).pose({ lean: [14, 0], head: [6, 0, 0] }).idle(c.t).setFace('sus').lookAt(1, 1.4); } });

  // ═══════════════ IDEA + FAILED TRIES (hallway) ═══════════════
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-2, 1, { size: 'close', side: -10 }),
    act(lt, c) { lit(N.reset().place(-2, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'worried' : 'grin'), -0.6); FH.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I thanked everyone,', set: hall, cam: frame(-2, 1, { size: 'face', side: 18 }),
    act(lt, c) { lit(N.reset().place(-2, 1, 0.3).pose('think').idle(c.t).setFace('smirk'), -0.6); } });
  shot({ line: "I'd glow like Rosa.", set: hall, sfx: [['rise', 'glow', 0.6]], cam: frame(0.4, 0.4, { size: 'full', dist: 1.05 }),
    act(lt, c) { const k = remap(lt, c.w('glow') - 0.05, c.w('glow') + 0.3); lit(N.reset().place(-2, 1, 0.2).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'), lerp(-0.6, 1, k)); R.reset().place(2.6, -0.6, -0.3).pose('wave').idle(c.t).setFace('grin'); } });
  shot({ line: 'I thanked a wall. Nothing.', set: hall, cam: frame(-10, -3.2, { size: 'close', side: 30 }),
    act(lt, c) { lit(N.reset().place(-10, -3.4, -0.6).pose({ lean: [10, 0] }).talk(c.t, lt < c.w('nothing') ? 1 : 0).idle(c.t).setFace(lt < c.w('nothing') ? 'say' : 'blank'), -0.6); } });
  shot({ line: 'I yelled thank you really loud.', set: hall, sfx: [['pop', 'loud', 0.6]], cam: frame(3, 0.4, { size: 'medium', side: 8 }),
    act(lt, c) { lit(N.reset().place(3, 0.4, 0).pose('cheer').talk(c.t, 2).idle(c.t).setFace('angry'), -0.6); } });
  shot({ line: 'Still nothing.', set: hall, cam: frame(3, 0.4, { size: 'face', side: -10, push: 0.06 }),
    act(lt, c) { lit(N.reset().place(3, 0.4, 0).idle(c.t, 0.3).setFace('sus'), -0.6); } });

  // ═══════════════ ACCIDENTAL SUCCESS (hallway) ═══════════════
  shot({ line: 'Then the janitor fixed my locker,', set: hall, sfx: [['tick', 'fixed', 1], ['tick', 'locker', 1]], cam: frame(-11, -2.6, { size: 'medium', side: 14, dist: 1.3 }),
    act(lt, c) { H.janitor.reset().place(-12.4, -3.6, -0.5).pose({ aR: [90, 0] }).idle(c.t).setFace('smile'); H.janitor.armR.rotation.x += Math.sin(c.t * 16) * 0.15; wrench.show(); lit(N.reset().place(-9.4, -2.4, -0.6).idle(c.t).setFace('worried'), -0.6); } });
  shot({ line: 'and I really meant it. Thank you.', set: hall, cam: frame(-9.4, -2.4, { size: 'close', side: -16 }),
    act(lt, c) { lit(N.reset().place(-9.4, -2.4, -0.5).pose(lt < c.w('thank') ? 'idle' : 'open').talk(c.t, lt > c.w('thank') ? 1 : 0).idle(c.t).setFace(lt < c.w('thank') ? 'cute' : 'say'), -0.6); } });
  shot({ line: 'I lit right up.', set: hall, sfx: [['sparkle', 'lit'], ['rise', 'lit', 0.6]], cam: frame(-10.6, -2.4, { size: 'full', side: -6, dist: 1.1 }),
    act(lt, c) { const a = N.reset().place(-9.4, -2.4, -0.2).idle(c.t); beat(FH, a, lt, c.w('lit'), -0.6, 0.8, 'laugh'); H.janitor.reset().place(-12.4, -3.6, 0.3).idle(c.t).setFace(lt < c.w('lit') + 0.3 ? 'shock' : 'grin'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I thanked everyone.', set: hall, cam: frame(0, 1.4, { size: 'full', side: 6, dist: 0.95 }),
    act(lt, c) { lit(N.reset().place(0, 1.4, 0.1).pose('open').talk(c.t).idle(c.t).setFace('talk'), 0.8); } });
  shot({ line: 'The lunch lady.', set: caf, sfx: [['pop', 'lady', 0.5]], cam: frame(-7.5, 0.4, { size: 'medium', side: 10, dist: 1.2, h: 1.05 }),
    act(lt, c) { C.lady.reset().place(-9.2, -0.4, 0.5).idle(c.t).setFace(lt < c.w('lady') ? 'neutral' : 'grin'); lit(C.nar.reset().place(-6, 0.6, -0.6).pose('wave').talk(c.t).idle(c.t).setFace('talk'), 0.9); } });
  shot({ line: 'The crossing guard.', set: street, sfx: [['pop', 'guard', 0.5]], cam: frame(1, 3, { size: 'medium', side: -10, dist: 1.25, h: 1.05 }),
    act(lt, c) { S.janitor.reset().place(2.8, 2.6, -0.5).pose({ aR: [80, 0] }).idle(c.t).setFace(lt < c.w('guard') ? 'neutral' : 'grin'); stopSign.show(); lit(S.nar.reset().place(-0.4, 3.4, 0.6).pose('wave').talk(c.t).idle(c.t).setFace('talk'), 1.0); } });
  shot({ line: 'My little sister.', set: home, sfx: [['pop', 'sister', 0.5]], cam: frame(-2, 1.4, { size: 'medium', side: 12, dist: 1.1 }),
    act(lt, c) { L.sis.reset().place(-3.4, 1.2, 0.6).pose(lt < c.w('sister') ? 'idle' : 'cheer').idle(c.t).setFace(lt < c.w('sister') ? 'neutral' : 'laugh'); lit(L.nar.reset().place(-0.4, 1.6, -0.6).pose('hug').idle(c.t).setFace('grin'), 1.1); } });
  shot({ line: 'By lunch, I was glowing like Rosa.', set: caf, cam: { ...frame(-7.5, 0, { size: 'wide', dist: 0.62 }), blur: 0.08 },
    act(lt, c) { lit(C.nar.reset().place(-9.6, 0.4, 0.2).pose('cheer').idle(c.t).setFace('laugh'), 1.0); C.rosa.reset().place(-5.4, -0.4, -0.2).pose('cheer').idle(c.t).setFace('laugh'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I bumped into Eli,', set: caf, sfx: [['thud', 'bumped', 0.7]], cam: frame(-1.0, 1.4, { size: 'full', side: 8, dist: 1.0 }),
    act(lt, c) { caf.tables[1].visible = false; const t0 = c.w('bumped'), k = remap(lt, 0, t0); C.eli.reset().place(-2.4, 1.4, 0).idle(c.t).setFace(lt < t0 ? 'sad' : 'shock'); const n = lit(C.nar.reset().place(lerp(2.4, -0.2, k), 1.4, -Math.PI / 2), 1.0); if (lt < t0) n.walk(c.t, 0.7).setFace('laugh'); else n.pose({ aL: [60, 30], aR: [60, 30] }).jump(remap(lt, t0, t0 + 0.4), 0.6).setFace('shock'); } });
  shot({ line: 'sitting in the dark, alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [-0.6, 6.4, 13], look: [-2.4, 3.6, 3.4], fov: 50, blur: 0.04, push: 0.02 },
    act(lt, c) { tT(); C.eli.reset().place(-2.4, 3.4, 0).sit(1.5).pose('slump').idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'd spent all day glowing", set: caf, cam: frame(1.6, 0.6, { size: 'close', side: 16 }),
    act(lt, c) { lit(C.nar.reset().place(1.6, 0.6, -0.4).idle(c.t, 0.5).setFace(lt < c.w('glowing') ? 'worried' : 'sad'), 1.0); } });
  shot({ line: 'while my best friend was fading out.', set: caf, cam: frame(1.6, 0.6, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { lit(C.nar.reset().place(1.6, 0.6, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'), lerp(1.0, 0.5, remap(lt, c.w('fading'), c.d))); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'So I gave him half my sandwich.', set: caf, cam: { pos: [-0.9, 7.2, 12.2], look: [-0.9, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) { tT(); lit(C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).pose({ aR: [80, 30] }, remap(lt, c.w('half'), c.w('half') + 0.2)).idle(c.t).setFace('smile'), 0.8); sandwich.show(); C.eli.reset().place(-2.4, 3.4, 0.3).sit(1.5).idle(c.t, 0.3).setFace(lt < c.w('sandwich') ? 'sad' : 'wow'); } });
  shot({ line: 'He asked, why?', set: caf, cam: frame(-2.4, 3.4, { size: 'close', side: -12 }),
    act(lt, c) { tT(); C.eli.reset().place(-2.4, 3.4, 0.3).sit(1.5).talk(c.t, lt > c.w('why') ? 1 : 0).idle(c.t).setFace(lt < c.w('why') ? 'neutral' : 'say'); } });
  shot({ line: "Because you're my best friend.", set: caf, cam: frame(0.2, 3.4, { size: 'close', side: 18 }),
    act(lt, c) { tT(); lit(C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).pose({ aR: [60, 30] }).talk(c.t).idle(c.t).setFace(lt < c.w('friend') ? 'say' : 'smile'), 0.8); } });
  shot({ line: 'He smiled. Thank you.', set: caf, sfx: [['sparkle', 'thank'], ['rise', 'thank', 0.5]], cam: frame(-2.4, 3.4, { size: 'close', side: 10 }),
    act(lt, c) { tT(); const a = C.eli.reset().place(-2.4, 3.4, 0.1).sit(1.5).talk(c.t, lt > c.w('thank') ? 1 : 0).idle(c.t).setFace(lt < c.w('smiled') ? 'neutral' : 'smile'); beat(FC, a, lt, c.w('thank'), -0.8, 0.2, 'smile', 0); } });
  shot({ line: 'No, really. Thank you.', set: caf, sfx: [['sparkle', 'thank'], ['ding', 'you', 0.5]], cam: { pos: [-1.6, 7.0, 12.0], look: [-1.2, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) { tT(); const a = C.eli.reset().place(-2.4, 3.4, 0.2).sit(1.5).talk(c.t, lt > c.w('no') ? 1 : 0).idle(c.t).setFace('say'); beat(FC, a, lt, c.w('thank'), 0.2, 1.1, 'laugh', 1); lit(C.nar.reset().place(0.2, 3.4, -0.5).sit(1.5).idle(c.t).setFace(lt < c.w('thank') + 0.3 ? 'smile' : 'laugh'), 0.8); } });
  // payoff of the plant
  (() => { const d = shot({ line: 'For the first time in two years, Eli showed up in the class photo.', set: cls, sfx: [['tick', 'photo', 1.4], ['ding', 'photo', 0.6]], cam: { pos: [1.6, 5.2, 13.4], look: [1.4, 3.8, -1], fov: 58, blur: 0.08 },
    act(lt, c) { cls.desks.visible = false; c.shot.ft = [c.w('photo')]; K.lady.reset().place(-5.6, 7.4, Math.PI + 0.55).pose({ aL: [96, -24], aR: [96, -24] }).idle(c.t); camBox.show(); K.rosa.reset().place(-3, 0, 0.2).pose('cheer').idle(c.t).setFace('grin'); K.kidA.reset().place(0, -0.6, 0).pose('open').idle(c.t).setFace('grin'); lit(K.eli.reset().place(3, 0, -0.2).pose(lt < c.w('showed') ? 'idle' : 'cheer').idle(c.t).setFace('laugh'), 1.0); lit(K.nar.reset().place(5.6, -0.6, -0.3).pose('cheer').idle(c.t).setFace('grin'), 0.9); } }); d.flash = flashW; })();

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he said, the sandwich was gross though.', set: hall, sfx: [['pop', 'gross', 0.5]], cam: frame(-3, 1, { size: 'close', side: -14 }),
    act(lt, c) { lit(EL.reset().place(-3, 1, 0.3).talk(c.t, lt > c.w('the') ? 1 : 0).idle(c.t).setFace(lt < c.w('the') ? 'smirk' : lt < c.w('gross') + 0.2 ? 'say' : 'smug'), 1.0); } });
  shot({ line: 'I stared at him.', set: hall, cam: frame(0, 0.4, { size: 'face', side: 8, push: 0.07 }),
    act(lt, c) { lit(N.reset().place(0, 0.4, -0.2).idle(c.t, 0.2).setFace('sus'), 0.8); } });
  shot({ line: 'Then I said, thanks for eating it.', set: hall, sfx: [['sparkle', 'thanks', 0.5]], cam: frame(-1.4, 0.6, { size: 'medium', side: -10, low: 0.3, dist: 1.1 }),
    act(lt, c) { lit(N.reset().place(0, 0.4, -0.3).pose(lt < c.w('thanks') ? 'idle' : 'cheer').talk(c.t, lt > c.w('said') ? 1 : 0).idle(c.t).setFace(lt < c.w('thanks') ? 'smile' : 'laugh'), lt < c.w('thanks') ? 0.8 : 1.2); lit(EL.reset().place(-3, 1, 0.3).pose(lt < c.w('thanks') ? 'idle' : 'cheer').idle(c.t).setFace('laugh'), 1.1); } });
});
