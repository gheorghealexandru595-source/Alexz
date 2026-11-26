// story.js: "In this town, every smile you give someone makes you a little lighter. Give enough, and you float."
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar, FACES } from './avatar.js';
FACES.braces = ['arc', 'soft', 'teeth'];   // Theo's real smile, braces and all
FACES.forced = ['round', 'up', 'teeth'];   // a strained fake smile
import { neighbourhood, court, FINNX } from './night.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, mat, glow, sign, rng, PRE } from './util.js';
import * as THREE from 'three';

const LOOK = {
  nar: { seed: 121, skin: 'brown', hair: 'afro', hairColor: '#17110f', top: 'hoodie', topColor: '#7fd0ff', bottom: 'jeans', bottomColor: '#4f79a7' },
  theo: { seed: 122, skin: 'fair', hair: 'swoop', hairColor: '#e8b04a', top: 'zip', topColor: '#e8632b', inner: '#f4f4f4', sleeves: 'long', bottom: 'cargo', bottomColor: '#5a5f6a' },
  daisy: { seed: 123, skin: 'tan', hair: 'long', hairColor: '#2b1b14', top: 'dress', topColor: '#ffd23f', bottom: 'skirt', bottomColor: '#2e9e59' },
  mailman: { seed: 124, skin: 'deep', hair: 'buzz', hairColor: '#1b1210', top: 'shirt', topColor: '#2b6fe0', sleeves: 'long', bottom: 'shorts', bottomColor: '#2b3a6b', cap: '#2b6fe0', height: 1.12 },
  girl: { seed: 125, skin: 'light', hair: 'buns', hairColor: '#e8632b', top: 'tee', topColor: '#ff6fae', bottom: 'skirt', bottomColor: '#7fd0ff', height: 0.65 },
  grump: { seed: 126, skin: 'tan', hair: 'bald', top: 'vest', topColor: '#6a6e76', bottom: 'slacks', bottomColor: '#2b2f38', height: 1.12 },
  kidA: { seed: 127, skin: 'light', hair: 'ponytail', hairColor: '#7a4a2e', top: 'stripes', topColor: '#f4f4f4', stripe: '#2e9e59', bottom: 'jeans', bottomColor: '#274b8f' },
};
function cast(set, keys) { const o = {}; for (const k of keys) { o[k] = makeAvatar(LOOK[k]); set.group.add(o[k].root); } return o; }
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, a, g]) => { if (!Array.isArray(a)) return [n, a, g]; let k = a[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(a[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile', y = 0) => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2, y).walk(t + x0, speed).setFace(face);
const fl = (t, s = 0) => Math.sin(t * 1.5 + s) * 0.22;
// a firework burst: 48 glowing beads flying outward and falling, fading out
function firework(parent, col, seed) {
  const g = new THREE.Group(), r = rng(seed), beads = [];
  for (let i = 0; i < 48; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), glow(i % 5 ? col : '#ffffff', 2.2)); const th = r() * 6.28, ph = Math.acos(2 * r() - 1); b.userData = { d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)), v: 7 + r() * 3 }; g.add(b); beads.push(b); }
  parent.add(g); g.visible = false; PRE.push(() => { g.visible = false; });
  return (dt, pos) => { g.visible = dt >= 0 && dt < 1.6; if (!g.visible) return; g.position.set(...pos); const k = E.out(remap(dt, 0, 1.0)); for (const b of beads) { const u = b.userData; b.position.copy(u.d).multiplyScalar(u.v * k); b.position.y -= dt * dt * 1.6; b.scale.setScalar(Math.max(0.001, 1 - remap(dt, 0.9, 1.6))); } };
}
function bus() {
  const g = grp(at(box(14, 3.4, 5, '#ffc61a', 0.2), 0, 2.5, 0), at(box(14.2, 0.5, 5.2, '#1b1d22', 0.1), 0, 0.9, 0), at(box(14, 0.5, 5, '#ffc61a', 0.2), 0, 6.5, 0), at(box(2.6, 3.0, 5, '#ffc61a', 0.2), 5.7, 4.2, 0));
  for (let i = 0; i < 6; i++) for (const z of [-2.45, 2.45]) g.add(at(box(0.35, 2.1, 0.12, '#ffc61a'), -6.8 + i * 2.2, 5.25, z));
  for (const x of [-4.6, 4.2]) for (const z of [-2.5, 2.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 18), mat('#1b1d22')); w.rotation.x = Math.PI / 2; w.position.set(x, 1, z); g.add(w); }
  g.add(at(sign('SCHOOL BUS', 7, 1.0, { bg: '#ffc61a', fg: '#1b1d22' }), -1.6, 2.6, 2.52), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.6)), 7.05, 2.2, 1.6), at(box(0.2, 0.9, 0.9, glow('#fff3c4', 1.6)), 7.05, 2.2, -1.6));
  return g;
}
function cat() {
  const m = mat('#6a6e76'), g = grp(at(box(1.6, 0.8, 0.8, m, 0.15), 0, 1.0, 0), at(box(0.8, 0.8, 0.8, m, 0.15), 1.0, 1.5, 0));
  for (const z of [-0.25, 0.25]) g.add(at(box(0.15, 0.4, 0.2, m), 1.0, 2.05, z), at(box(0.06, 0.18, 0.18, glow('#9bff6a', 1.6)), 1.42, 1.6, z));
  for (const [x, z] of [[-0.55, -0.25], [-0.55, 0.25], [0.55, -0.25], [0.55, 0.25]]) g.add(at(box(0.22, 0.65, 0.22, m), x, 0.33, z));
  const tail = at(box(0.14, 1.1, 0.14, m), -0.9, 1.6, 0); tail.rotation.z = 0.4; g.add(tail);
  return g;
}

start(() => {
  const town = neighbourhood(), park = court();
  town.reset = () => { town.finnLit.visible = true; town.finnDark.visible = false; town.finnLights.visible = true; };
  const T = cast(town, ['nar', 'theo', 'daisy', 'mailman', 'girl', 'grump', 'kidA']);
  const P = cast(park, ['nar', 'theo', 'daisy', 'kidA', 'grump']);
  const fx = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FT = fx(town), FP = fx(park);
  const fwP = ['#ff6fae', '#7fd0ff', '#ffd23f', '#9be37a', '#ff9a3c', '#c77dff'].map((c, i) => firework(park.group, c, i + 1));
  const fwT = ['#ff6fae', '#7fd0ff', '#ffd23f'].map((c, i) => firework(town.group, c, i + 11));
  const fireworks = (fw, t, spots) => fw.forEach((f, i) => { const per = 1.9, ph = (t + i * 0.63) % per; const n = Math.floor((t + i * 0.63) / per); const s = spots[(i + n) % spots.length]; f(ph, s); });
  const SKY_P = [[-10, 26, -30], [6, 30, -36], [16, 24, -28], [-2, 34, -42], [-16, 30, -40], [12, 36, -46]];
  // RULE FIRES: a smile lifts you from y0 to y1, with a whoosh, scream face, sparkles under the feet
  const lift = (F, av, lt, t0, y0, y1, rest = 'grin', spi = 0) => {
    const dt = lt - t0, k = dt < 0 ? 0 : E.back(remap(dt, 0.05, 0.45)), y = lerp(y0, y1, k); av.root.position.y = y;
    if (dt >= 0 && dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else if (dt >= 0.47) av.setFace(rest);
    if (dt >= 0) F.sp[spi].at(dt, [av.root.position.x, y, av.root.position.z], av.root.scale.x);
    return y;
  };
  // props
  const mailbox = grp(at(box(0.3, 3, 0.3, '#5a5f6a'), 0, 1.5, 0), at(box(1.4, 1.0, 1.8, '#2b6fe0', 0.3), 0, 3.4, 0), at(box(0.12, 0.8, 0.5, '#e8413c'), 0.75, 3.8, -0.4)); town.group.add(mailbox); mailbox.position.set(-12, 0, 6.2);
  const rope = prop(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1, 0.06), new THREE.MeshBasicMaterial({ color: '#f4f4f4' }))); town.group.add(rope);
  const mirror = prop(grp(at(box(2.4, 5.2, 0.3, '#b9783f'), 0, 2.6, 0), at(box(2.0, 4.8, 0.05, glow('#bfe8ff', 1.05)), 0, 2.6, 0.18))); town.group.add(mirror);
  const icecream = prop(grp((() => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 12), mat('#d9a55a')); c.rotation.x = Math.PI; return c; })(), at(new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), mat('#ff9fc8')), 0, 0.55, 0))); town.group.add(icecream);
  const icecream2 = prop(grp((() => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 12), mat('#d9a55a')); c.rotation.x = Math.PI; return c; })(), at(new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), mat('#9be37a')), 0, 0.55, 0))); T.nar.handR.add(icecream2); icecream2.position.set(0, -0.4, 0.3); icecream2.rotation.x = -Math.PI / 2;
  const theBus = prop(bus()); town.group.add(theBus);
  const kitty = prop(cat()); town.group.add(kitty);
  const N = T.nar;

  // ═══════════════ HOOK ═══════════════
  shot({ line: 'In this town,', set: town, sfx: [['whoosh', 0]], cam: { pos: [-22, 20, 40], look: [0, 8, 2], fov: 55, blur: 0.04, push: 0, to: { pos: [-15, 18, 34] }, ease: 'lin' },
    act(lt, c) { T.daisy.reset().place(-12, 8, 0.3, 10 + fl(c.t)).pose('cheer').setFace('grin'); T.kidA.reset().place(4 + lt, 6, 0, 12 + fl(c.t, 2)).pose({ aL: [10, 40], aR: [10, 40] }).setFace('grin'); walkX(T.grump, 8, 9, -1, lt, c.t, 0.4, 'mad'); } });
  shot({ line: 'every smile you give someone', set: town, cam: frame(-3, 9, { size: 'medium', side: 10, dist: 1.25 }),
    act(lt, c) { T.kidA.reset().place(-4.6, 9, Math.PI / 2 - 0.4).idle(c.t).setFace(lt < c.w('smile') ? 'neutral' : 'grin'); T.girl.reset().place(-1.6, 9, -Math.PI / 2 + 0.4).idle(c.t).setFace(lt < c.w('give') ? 'neutral' : 'happy'); } });
  shot({ line: 'makes you a little lighter.', set: town, sfx: [['sparkle', 'lighter'], ['rise', 'lighter', 0.6]], cam: frame(-4.6, 9, { size: 'full', side: -6, dist: 1.0 }),
    act(lt, c) { const a = T.kidA.reset().place(-4.6, 9, 0).idle(c.t).setFace('grin'); lift(FT, a, lt, c.w('lighter'), 0, 1.0); } });
  shot({ line: 'Give enough, and you float.', set: town, sfx: [['rise', 'float', 0.8]], cam: { pos: [-4.6, 3.6, 22], look: [-4.6, 7, 9], fov: 60, blur: 0.12, push: 0, to: { look: [-4.6, 12, 9] }, t0: 0.3, ease: 'out' },
    act(lt, c) { const k = E.out(remap(lt, c.w('float'), c.w('float') + 0.9)); T.kidA.reset().place(-4.6, 9, 0, 1 + k * 6 + fl(c.t) * k).pose(k > 0 ? 'cheer' : 'idle').idle(c.t).setFace(k > 0 ? 'laugh' : 'grin'); } });
  shot({ line: "That's why happy people drift over the rooftops,", set: town, cam: lt => ({ pos: [-15 + lt * 3.6, 14.5, 17], look: [-16 + lt * 3.6, 11.8, 1], fov: 60, blur: 0.12, push: 0 }),
    act(lt, c) { T.daisy.reset().place(-16 + lt * 3.6, 0, Math.PI / 2, 10.5 + fl(c.t)).pose({ aL: [10, 40], aR: [10, 40] }).setFace('grin'); T.kidA.reset().place(-21 + lt * 3.6, 2, Math.PI / 2, 12 + fl(c.t, 1)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'and grumpy people', set: town, cam: frame(4, 9, { size: 'medium', h: 1.12, low: 0.4, side: -14 }),
    act(lt, c) { T.grump.reset().place(4, 9, -0.2).pose('hips').idle(c.t).setFace('mad'); } });
  shot({ line: 'stomp around on the sidewalk.', set: town, sfx: [['thud', 'stomp', 0.8], ['thud', 'sidewalk', 0.8]], cam: frame(4, 9, { size: 'full', h: 1.12, side: 10, dist: 1.05 }),
    act(lt, c) { const g = walkX(T.grump, 6, 9, -1, lt, c.t, 0.4, 'angry'); g.hip.position.y -= Math.abs(Math.sin(c.t * 7.2 * 0.4)) * 0.1; FT.puff.at((lt * 1.4) % 0.6, [g.root.position.x, 0, 9.4]); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL ═══════════════
  shot({ line: 'I hovered about knee high.', set: town, cam: frame(-10, 9, { size: 'full', side: -6, dist: 1.0, y: 1.6 }),
    act(lt, c) { N.reset().place(-10, 9, 0.1, 1.6 + fl(c.t)).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'But my best friend Theo', set: town, cam: frame(3, 8.6, { size: 'close', side: -12 }),
    act(lt, c) { const o = T.theo.reset().place(3, 8.6, -0.15).pose('wave', remap(lt, 0.1, 0.4)).idle(c.t).setFace('neutral'); o.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  shot({ line: 'never smiled. Not once.', set: town, sfx: [['thud', 'once', 0.5]], cam: { ...frame(3, 8.6, { size: 'wide', dist: 0.7 }), blur: 0.08 },
    act(lt, c) { T.theo.reset().place(3, 8.6, 0).idle(c.t, 0.3).setFace('serious'); T.daisy.reset().place(6, 7.6, -0.4, 2.4 + fl(c.t)).pose('wave').setFace('grin'); } });
  // plant: never seen the fireworks from up high
  shot({ line: "He'd never seen the fireworks from up high.", set: park, cam: { pos: [3, 2.2, 12], look: [1, 9, -6], fov: 62, blur: 0.12 },
    act(lt, c) { fireworks(fwP, lt + 0.6, SKY_P); P.theo.reset().place(1, 2, Math.PI).idle(c.t, 0.4).setFace('sad'); P.theo.head.rotation.x -= 0.4; P.daisy.reset().place(-4, -1, 0, 9 + fl(c.t)).pose('cheer').setFace('laugh'); P.kidA.reset().place(6, -2, 0, 7 + fl(c.t, 2)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'Meanwhile, Daisy smiled so much', set: town, cam: { pos: [-12, 4, 18], look: [-12, 9, 6], fov: 62, blur: 0.15 },
    act(lt, c) { T.daisy.reset().place(-12, 6.6, 0, 3.6 + fl(c.t)).pose({ aL: [10, 40], aR: [10, 40] }).setFace('grin'); rope.show().position.set(-12.3, 3.9 + 1.3, 6.4); rope.scale.y = 2.6; } });
  shot({ line: 'she had to tie herself to a mailbox.', set: town, sfx: [['tick', 'mailbox', 0.6]], cam: frame(-12, 6.6, { size: 'medium', y: 3.6, side: 14, dist: 1.2 }),
    act(lt, c) { T.daisy.reset().place(-12, 6.6, 0.3, 3.6 + fl(c.t) * 0.6).pose({ aR: [-20, 10] }).setFace('wink'); rope.show().position.set(-12.3, 3.9 + 1.3, 6.4); rope.scale.y = 2.6; } });
  shot({ line: 'She smiled at dogs.', set: park, cam: frame(-4, 2, { size: 'close', side: 14, y: 2.4 }),
    act(lt, c) { P.daisy.reset().place(-4, 2, 0.3, 2.4 + fl(c.t)).pose({ head: [24, 0, 0] }).setFace('grin'); } });
  shot({ line: 'She smiled at mailmen.', set: town, cam: frame(-6, 9.4, { size: 'medium', side: -10, dist: 1.3 }),
    act(lt, c) { T.daisy.reset().place(-8, 9.4, 0.6, 2 + fl(c.t)).setFace('grin'); T.mailman.reset().place(-4, 9.4, -0.7).idle(c.t).setFace(lt < 0.4 ? 'neutral' : 'happy'); } });
  shot({ line: 'She smiled at her own reflection.', set: town, cam: frame(-8, 9.4, { size: 'close', side: 30, y: 1.2 }),
    act(lt, c) { mirror.show().position.set(-5.4, 0, 9.4); mirror.rotation.y = -Math.PI / 2; T.daisy.reset().place(-8, 9.4, Math.PI / 2, 1.2 + fl(c.t)).setFace('love'); } });

  // ═══════════════ INCITING ═══════════════
  shot({ line: 'Then the mailman waved at me,', set: town, cam: frame(-6.6, 9.6, { size: 'medium', side: 10, dist: 1.3, h: 1.05 }),
    act(lt, c) { T.mailman.reset().place(-4.4, 9.4, -0.6).pose('wave', remap(lt, c.w('waved'), c.w('waved') + 0.2)).idle(c.t).setFace('grin'); T.mailman.armR.rotation.z += lt > c.w('waved') ? Math.sin(c.t * 14) * 0.25 : 0; N.reset().place(-8.6, 9.8, 0.6, 1.6 + fl(c.t)).idle(c.t).setFace('neutral'); } });
  shot({ line: 'and I smiled back.', set: town, cam: frame(-8.6, 9.8, { size: 'face', y: 1.6, side: -8, push: 0.05 }),
    act(lt, c) { N.reset().place(-8.6, 9.8, 0.3, 1.6 + fl(c.t) * 0.5).idle(c.t, 0.3).setFace(lt < c.w('smiled') ? 'neutral' : 'grin'); } });
  shot({ line: 'Whoosh. I floated a whole foot.', set: town, sfx: [['whoosh', 0, 0.9], ['sparkle', 0], ['rise', 0, 0.5]], cam: frame(-8.6, 9.8, { size: 'full', side: 8, dist: 1.1, y: 2.4 }),
    act(lt, c) { const a = N.reset().place(-8.6, 9.8, 0).idle(c.t); lift(FT, a, lt, 0, 1.6, 3.2, 'laugh'); } });

  // ═══════════════ IDEA + FAILED TRIES ═══════════════
  shot({ line: "And that's when I had an idea.", set: town, sfx: [['ding', 'idea']], cam: frame(-10, 9, { size: 'close', side: -10, y: 3.2 }),
    act(lt, c) { N.reset().place(-10, 9, 0.1, 3.2 + fl(c.t) * 0.5).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin'); FT.bulb.at(lt - c.w('idea'), N); } });
  shot({ line: 'If I smiled enough,', set: town, cam: frame(-10, 9, { size: 'face', side: 18, y: 3.2 }),
    act(lt, c) { N.reset().place(-10, 9, 0.3, 3.2 + fl(c.t) * 0.5).pose('think').idle(c.t).setFace('smirk'); } });
  shot({ line: "I'd watch the fireworks from the sky.", set: park, sfx: [['pop', 'fireworks', 0.5], ['pop', 'sky', 0.5]], cam: { pos: [0, 12, 16], look: [0, 22, -20], fov: 62, blur: 0.08 },
    act(lt, c) { fireworks(fwP, lt, SKY_P); P.nar.reset().place(0, 0, Math.PI, 14 + fl(c.t)).pose('cheer').setFace('laugh'); } });
  shot({ line: 'I smiled at a mirror. Nothing.', set: town, cam: frame(-7, 9.4, { size: 'close', side: -30, y: 3.2 }),
    act(lt, c) { mirror.show().position.set(-4.4, 0, 9.4); mirror.rotation.y = -Math.PI / 2; N.reset().place(-7, 9.4, Math.PI / 2 - 0.3, 3.2).idle(c.t).setFace(lt < c.w('nothing') ? 'grin' : 'blank'); } });
  shot({ line: 'I forced the biggest smile ever.', set: town, cam: frame(-10, 9, { size: 'face', side: 6, y: 3.2, push: 0.06 }),
    act(lt, c) { N.reset().place(-10, 9, 0, 3.2).idle(c.t, 0.3).setFace('forced'); N.head.rotation.z = Math.sin(c.t * 30) * 0.03; } });
  shot({ line: 'My face just hurt.', set: town, cam: frame(-10, 9, { size: 'close', side: -14, y: 3.2 }),
    act(lt, c) { N.reset().place(-10, 9, -0.2, 3.2).pose({ aL: [130, -40], aR: [130, -40] }).idle(c.t, 0.3).setFace('cry'); } });

  // ═══════════════ ACCIDENTAL SUCCESS ═══════════════
  shot({ line: 'Then a little girl dropped her ice cream,', set: town, sfx: [['thud', 'ice', 0.6]], cam: frame(1, 9.4, { size: 'medium', side: 12, dist: 1.2, h: 0.8 }),
    act(lt, c) { const t0 = c.w('dropped'), k = E.in(remap(lt, t0, t0 + 0.35)); T.girl.reset().place(1, 9.4, 0.3).pose(lt < t0 ? { aR: [70, -10] } : { aL: [30, 40], aR: [30, 40] }).idle(c.t).setFace(lt < t0 ? 'smile' : lt < t0 + 0.4 ? 'shock' : 'cry'); icecream.show().position.set(0.6, lerp(2.2, 0.3, k), 10.4); icecream.rotation.z = k * 2.2; } });
  shot({ line: 'so I gave her mine.', set: town, cam: frame(2.2, 9.4, { size: 'medium', side: -8, dist: 1.2, h: 0.85 }),
    act(lt, c) { const k = remap(lt, c.w('gave'), c.w('gave') + 0.3); N.reset().place(3.6, 9.6, -0.8, 3.2 - k * 2.4).pose({ aR: [lerp(60, 90, k), 0], lean: [k * 18, 0] }).idle(c.t).setFace('smile'); icecream2.show(); T.girl.reset().place(1, 9.4, 0.6).idle(c.t).setFace(lt < c.w('mine') ? 'cry' : 'wow'); } });
  shot({ line: 'She smiled. I smiled. Whoosh.', set: town, sfx: [['whoosh', 'whoosh', 0.9], ['sparkle', 'whoosh'], ['rise', 'whoosh', 0.6]], cam: frame(2.2, 9.4, { size: 'full', side: 6, dist: 1.15 }),
    act(lt, c) { T.girl.reset().place(1, 9.4, 0.4).pose({ aR: [70, -10] }).idle(c.t).setFace(lt < c.w('she') + 0.1 ? 'cry' : 'happy'); const a = N.reset().place(3.6, 9.6, -0.4).idle(c.t).setFace(lt < c.w('i') ? 'smile' : 'grin'); lift(FT, a, lt, c.w('whoosh'), 0.8, 4.4, 'laugh'); } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I smiled at everyone.', set: town, cam: frame(-6, 9, { size: 'full', side: 6, dist: 1.0, y: 4.4 }),
    act(lt, c) { N.reset().place(-6, 9, 0.1, 4.4 + fl(c.t)).pose('open').idle(c.t).setFace('grin'); } });
  shot({ line: 'The whole street.', set: town, sfx: [['pop', 'street', 0.5]], cam: { pos: [-8, 9, 24], look: [-2, 6, 6], fov: 58, blur: 0.08 },
    act(lt, c) { N.reset().place(-6 + lt * 3, 10, Math.PI / 2, 5.2 + fl(c.t)).pose('wave').setFace('grin'); T.kidA.reset().place(-2, 7.4, 0.4).pose('wave').idle(c.t).setFace('grin'); T.mailman.reset().place(3, 8.4, -0.3).pose('wave').idle(c.t).setFace('grin'); } });
  shot({ line: 'The bus driver.', set: town, sfx: [['boing', 'driver', 0.5]], cam: { pos: [-8, 7.4, 28], look: [-2, 5.4, 16], fov: 58, blur: 0.1 },
    act(lt, c) { theBus.show().position.set(-2 + lt * 0.8, 0, 18); N.reset().place(-6, 12, 0.4, 6 + fl(c.t)).pose('wave').setFace('grin'); } });
  shot({ line: 'A very confused cat.', set: town, sfx: [['pop', 'cat', 0.5]], cam: frame(-8.2, 11, { size: 'full', side: -12, dist: 1.0, y: 0.6 }),
    act(lt, c) { kitty.show().position.set(-6.6, 0, 11.6); kitty.rotation.y = Math.PI * 0.8; N.reset().place(-9.6, 11, 0.6, 2.4 + fl(c.t)).pose({ lean: [20, 0] }).setFace('grin'); } });
  shot({ line: 'By sunset, I was floating over the rooftops.', set: town, sfx: [['rise', 'floating', 0.6]], cam: { pos: [-8, 9, 28], look: [-4, 13, 4], fov: 60, blur: 0.08 },
    act(lt, c) { const k = E.out(remap(lt, c.w('floating') - 0.2, c.w('floating') + 0.8)); N.reset().place(-4, 6, 0, lerp(6, 14, k) + fl(c.t)).pose('cheer').setFace('laugh'); } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'Then I looked down and saw Theo,', set: town, cam: frame(-4, 6, { size: 'close', y: 14, side: -14 }),
    act(lt, c) { const a = N.reset().place(-4, 6, 0, 14 + fl(c.t)).idle(c.t); const k = remap(lt, c.w('looked'), c.w('looked') + 0.25); a.head.rotation.x += 0.55 * k; a.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'alone on the ground, staring up.', set: town, sfx: [['sad', 'alone', 0.8]], cam: { pos: [1, 18, 16], look: [2, 1, 8.6], fov: 52, blur: 0.04, push: 0.02 },
    act(lt, c) { T.theo.reset().place(2, 8.6, 0.4).pose({ head: [-30, 0, 0] }).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: "I'd spent all day smiling at strangers", set: town, cam: frame(-4, 6, { size: 'close', y: 14, side: 16 }),
    act(lt, c) { N.reset().place(-4, 6, -0.4, 14 + fl(c.t)).idle(c.t, 0.5).setFace(lt < c.w('strangers') ? 'worried' : 'sad'); } });
  shot({ line: "while my best friend couldn't even leave the ground.", set: town, cam: frame(-4, 6, { size: 'face', y: 14, side: -6, push: 0.05 }),
    act(lt, c) { N.reset().place(-4, 6, -0.1, 14 + fl(c.t) - remap(lt, c.w('ground'), c.d) * 1.5).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: "So I floated down and asked, why don't you smile?", set: town, sfx: [['fall', 'down', 0.6]], cam: frame(3.2, 8.6, { size: 'full', side: 6, dist: 1.0 }),
    act(lt, c) { const k = E.inOut(remap(lt, 0, c.w('asked'))); N.reset().place(4.6, 8.8, -0.6, lerp(9, 0.6, k)).pose(k < 1 ? 'cheer' : 'open').idle(c.t).setFace(lt < c.w('asked') ? 'smile' : 'say').talk(c.t, lt > c.w('asked') ? 1 : 0); T.theo.reset().place(1.8, 8.6, 0.5).idle(c.t).setFace('neutral'); } });
  shot({ line: 'He mumbled, my braces.', set: town, cam: frame(1.8, 8.6, { size: 'close', side: -12 }),
    act(lt, c) { T.theo.reset().place(1.8, 8.6, 0.4).pose({ aR: [140, -40] }).talk(c.t, 0.5).idle(c.t).setFace('worried'); } });
  shot({ line: 'Everyone laughs.', set: town, cam: frame(1.8, 8.6, { size: 'face', side: 8, push: 0.06 }),
    act(lt, c) { T.theo.reset().place(1.8, 8.6, 0.2).idle(c.t, 0.3).setFace('sad'); } });
  shot({ line: 'So I made the goofiest face I could.', set: town, sfx: [['boing', 'goofiest', 0.6]], cam: frame(4.6, 8.8, { size: 'close', y: 0.6, side: 16 }),
    act(lt, c) { const k = lt > c.w('goofiest'); N.reset().place(4.6, 8.8, -0.6, 0.6).pose(k ? { aL: [100, 40], aR: [100, 40] } : 'idle').idle(c.t).setFace(k ? 'laugh' : 'smile'); if (k) { N.head.rotation.z = Math.sin(c.t * 9) * 0.25; N.head.scale.set(1.15, 0.9, 1); } else N.head.scale.set(1, 1, 1); } });
  shot({ line: 'He laughed.', set: town, sfx: [['sparkle', 'laughed', 0.6], ['rise', 'laughed', 0.4]], cam: frame(1.8, 8.6, { size: 'full', side: -8, dist: 1.0 }),
    act(lt, c) { N.head.scale.set(1, 1, 1); const a = T.theo.reset().place(1.8, 8.6, 0.2).idle(c.t); if (lt > c.w('laughed') + 0.47) a.hip.position.y += Math.abs(Math.sin(c.t * 15)) * 0.08; lift(FT, a, lt, c.w('laughed'), 0, 0.8, 'laugh'); } });
  shot({ line: 'Then he smiled, braces and all.', set: town, sfx: [['sparkle', 'smiled'], ['whoosh', 'braces', 0.7], ['rise', 'smiled', 0.6]], cam: { pos: [2.6, 6, 16], look: [1.8, 7, 8.6], fov: 60, blur: 0.15, push: 0, to: { look: [1.8, 10, 8.6] }, t0: 0.3, ease: 'out' },
    act(lt, c) { const a = T.theo.reset().place(1.8, 8.6, 0).idle(c.t); lift(FT, a, lt, c.w('smiled'), 0.8, 5, 'braces', 1); if (lt > c.w('smiled') + 0.47) a.pose('cheer'); N.reset().place(4.6, 8.8, -0.4, 0.6).idle(c.t).setFace(lt < c.w('smiled') + 0.3 ? 'wow' : 'laugh'); } });
  // payoff of the plant
  shot({ line: 'And for the first time, Theo watched the fireworks from the sky.', set: park, sfx: [['pop', 'fireworks', 0.6], ['pop', 'sky', 0.6], ['ding', 'sky', 0.4]], cam: { pos: [0, 15, 14], look: [0, 22, -24], fov: 62, blur: 0.06, push: 0.02 },
    act(lt, c) { fireworks(fwP, lt, SKY_P); P.theo.reset().place(-1.6, 2, Math.PI + 0.2, 14 + fl(c.t)).pose(lt < c.w('watched') ? 'idle' : 'cheer').setFace('braces'); P.nar.reset().place(1.8, 2, Math.PI - 0.2, 14.4 + fl(c.t, 1)).pose('cheer').setFace('laugh'); } });

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then he said, your goofy face is still the worst.', set: park, sfx: [['pop', 'worst', 0.5]], cam: frame(-1.6, 2, { size: 'close', y: 14, side: -14 }),
    act(lt, c) { fireworks(fwP, lt + 1, SKY_P); P.theo.reset().place(-1.6, 2, 0.4, 14 + fl(c.t)).talk(c.t, lt > c.w('your') ? 1 : 0).setFace(lt < c.w('your') ? 'smirk' : lt < c.w('worst') + 0.2 ? 'say' : 'braces'); } });
  shot({ line: 'I stared at him.', set: park, cam: frame(1.8, 2, { size: 'face', y: 14.4, side: 8, push: 0.07 }),
    act(lt, c) { fireworks(fwP, lt + 2, SKY_P); P.nar.reset().place(1.8, 2, -0.2, 14.4 + fl(c.t, 1) * 0.5).setFace('sus'); } });
  shot({ line: 'Then we both smiled, and floated even higher.', set: park, sfx: [['rise', 'floated', 0.7]], cam: { pos: [0.2, 13, 10], look: [0.2, 17.6, 2], fov: 60, blur: 0.15, push: 0, to: { look: [0.2, 20.6, 2] }, t0: 0.3, ease: 'out' },
    act(lt, c) { fireworks(fwP, lt + 3, SKY_P); const k = E.out(remap(lt, c.w('floated') - 0.1, c.d)); P.theo.reset().place(-1.6, 2, 0.3, 14 + k * 4 + fl(c.t)).pose('cheer').setFace(lt < c.w('smiled') ? 'smile' : 'braces'); P.nar.reset().place(1.8, 2, -0.3, 14.4 + k * 4 + fl(c.t, 1)).pose('cheer').setFace(lt < c.w('smiled') ? 'smile' : 'laugh'); } });
});
