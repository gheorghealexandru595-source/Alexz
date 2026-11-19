// story.js: "In this town, every picture you take makes another you."
// Sets, cast, props, then one shot() per picture. The spoken script is the shots' `line` strings joined in order.
import { start, shot as kitShot, frame, WORDS, cap } from './core.js';
import { makeAvatar } from './avatar.js';
import { SETS } from './sets.js';
import { makeSparkles, makeBulb, makePuff } from './fx.js';
import { remap, E, lerp, clamp, box, grp, at, glow, mat, PRE } from './util.js';
import * as THREE from 'three';

// ── cast: one look per character for the whole video
const LOOK = {
  nar: { seed: 11, skin: 'light', hair: 'short', hairColor: '#4a2c17', top: 'hoodie', topColor: '#2fa84a', bottom: 'jeans', bottomColor: '#4f79a7' },
  ben: { seed: 12, skin: 'deep', hair: 'dreads', hairColor: '#1a120e', top: 'zip', topColor: '#940c1b', sleeves: 'long', bottom: 'joggers', bottomColor: '#15151a' },
  jade: { seed: 13, skin: 'fair', hair: 'long', hairColor: '#7a4a2e', top: 'cardigan', topColor: '#f6f2ea', inner: '#ff6fae', sleeves: 'long', bottom: 'skirt', bottomColor: '#7b3fc4', glasses: '#ff2f92' },
  kidA: { seed: 14, skin: 'brown', hair: 'buns', hairColor: '#1b1210', top: 'tee', topColor: '#ffd23f', bottom: 'shorts', bottomColor: '#2e9e59' },
  kidB: { seed: 15, skin: 'light', hair: 'spiky', hairColor: '#e8632b', top: 'stripes', topColor: '#f4f4f4', bottom: 'jeans', bottomColor: '#274b8f' },
  kidC: { seed: 16, skin: 'tan', hair: 'bob', hairColor: '#2b1b14', top: 'vest', topColor: '#2b6fe0', bottom: 'cargo', bottomColor: '#c9b48a' },
  kidD: { seed: 17, skin: 'fair', hair: 'curly', hairColor: '#c98a3a', top: 'sweater', topColor: '#9fcfc1', sleeves: 'long', bottom: 'slacks', bottomColor: '#5a5f6a', glasses: true },
  photog: { seed: 18, skin: 'tan', hair: 'buzz', hairColor: '#222', top: 'shirt', topColor: '#f4f4f4', suspenders: '#2b2f38', sleeves: 'long', bottom: 'slacks', bottomColor: '#2b2f38', cap: '#e8413c' },
};
function cast(set, list) { // list: { key: count }  ->  { key: [avatars] }
  const out = {};
  for (const [k, n] of Object.entries(list)) { out[k] = []; for (let i = 0; i < n; i++) { const a = makeAvatar(LOOK[k]); set.group.add(a.root); out[k].push(a); } }
  return out;
}
// ── props (hidden every frame unless a shot calls show())
function prop(obj) { obj.visible = false; PRE.push(() => { obj.visible = false; }); obj.show = () => { obj.visible = true; return obj; }; return obj; }
function phone(av) { // held in the right hand; with the arm pointing forward the phone stands upright facing the holder
  const g = grp(at(box(0.62, 0.14, 1.05, '#1b1d22', 0.05), 0, 0, 0), at(box(0.5, 0.02, 0.9, glow('#8fd8ff', 1.2)), 0, 0.08, 0), at(box(0.16, 0.04, 0.16, glow('#ffffff', 1.5)), 0.16, -0.08, 0.36));
  g.position.set(0, -0.2, 0.32); av.handR.add(g); return prop(g);
}
function bigCam(av) { // photographer's camera held in front of the face (on the root, not the hand)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.6, 20), mat('#2b2f38')); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0, 0.7);
  const g = grp(box(1.5, 1.0, 0.8, '#17181c', 0.1), lens, at(box(0.5, 0.36, 0.4, glow('#ffffff', 1.4)), -0.4, 0.66, 0.1));
  g.position.set(0, 4.55, 1.05); av.root.add(g); return prop(g);
}
function cupProp(av) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 1.0, 16), mat('#ff8fbd')); const s = at(box(0.08, 0.8, 0.08, '#ffffff'), 0.1, 0.7, 0); const g = grp(c, s); g.rotation.x = Math.PI / 2; g.position.set(0, -0.2, 0.25); av.handR.add(g); return prop(g); }
function bagProp(av) { const g = grp(box(2.2, 0.8, 1.5, '#ff5fa8', 0.15), at(box(1.2, 0.12, 0.5, '#ffd23f'), 0, 0.4, 0.3)); g.position.set(1.5, -0.3, 0.1); av.handR.add(g); return prop(g); }
function trayProp(av) { const cs = ['#ff9f2e', '#2f95e6', '#2e9e59', '#e84b6a']; const g = grp(); cs.forEach((c, i) => g.add(at(box(2.4, 0.12, 1.6, c, 0.04), 0, i * 0.22, 0))); g.position.set(0, 3.05, 2.1); av.root.add(g); return prop(g); }
function booksProp(av) { const cs = ['#f26a1b', '#7b3fc4', '#f2b01e', '#2e9e59']; const g = grp(); cs.forEach((c, i) => g.add(at(box(1.6, 0.34, 1.2, c), (i % 2) * 0.12, i * 0.34, 0))); g.position.set(0, 2.9, 1.5); av.root.add(g); return prop(g); }

// sfx entries may name the nth occurrence of a word: ['sparkle', ['pop', 1]]. Resolved to local seconds after timing.
function shot(def) {
  const raw = def.sfx; if (!raw || !raw.some(x => Array.isArray(x[1]))) return kitShot(def);
  delete def.sfx;
  Object.defineProperty(def, 'sfx', { get() { return raw.map(([n, at, g]) => { if (!Array.isArray(at)) return [n, at, g]; let k = at[1]; for (let i = this.w0; i < this.w1; i++) if (WORDS[i].cap === cap(at[0]) && k-- === 0) return [n, WORDS[i].s - this.s, g]; return [n, 0, g]; }); } });
  return kitShot(def);
}
// ── beats
const pulse = dt => (dt >= 0 && dt < 0.1 ? 0.75 * (1 - dt / 0.1) : 0);              // camera flash: 3 frames of white
const bob = (t, s = 0) => Math.sin(t * 2.2 + s) * 0.04;
// the rule fires: a copy pops out of src and slides dx/dz away, scream face + sparkles, then grin
function multiply(src, cp, sp, lt, t0, dx, dz = 0, rest = 'grin', ph = 1) {
  const dt = lt - t0; if (dt < 0) return false;
  const k = E.back(remap(dt, 0.04, 0.42)), p = src.root.position, s = src.root.scale.x;
  cp.reset().place(p.x + dx * k, p.z + dz * k, src.root.rotation.y, 0).size(Math.max(0.02, s * Math.min(k, 1.06))).idle(lt + ph);
  if (dt < 0.47) { cp.setFace('scream'); src.setFace('scream'); src.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); cp.pose({ aL: [20, 70], aR: [20, 70] }, 1 - remap(dt, 0.2, 0.47)); }
  else cp.setFace(rest);
  if (sp) sp.at(dt, [p.x + dx * k, 0, p.z + dz * k], s);
  return true;
}
// shot with camera flashes on the given words
function snapShot(def, words) {
  const act = def.act; def.act = (lt, c) => { c.shot.ft = words.map(w => (Array.isArray(w) ? c.w(w[0], w[1]) : c.w(w))); act(lt, c); };
  def.flash = function (lt) { return Math.max(0, ...(this.ft || []).map(t => pulse(lt - t))); };
  return shot(def);
}
const walkX = (av, x0, z, dir, lt, t, speed = 1, face = 'smile') => av.reset().place(x0 + dir * lt * 4.2 * speed, z, dir * Math.PI / 2).walk(t + x0, speed).setFace(face);

start(() => {
  // ── sets
  const street = SETS.street({ shops: [['BAKERY', '#f8c5c7', '#e84b6a'], ['PHOTO', '#bfe3ff', '#2f7de1'], ['CAFE', '#fff0b8', '#e8632b'], ['BOOKS', '#d6f2c4', '#2e9e59'], ['TOYS', '#e4d0ff', '#7b3fc4']] });
  const hall = SETS.hallway({ banner: 'SAY\nCHEESE!', bannerBg: '#ffd23f', locker: '#2f6fd8', door: 'ROOM 7', poster: 'PICTURE\nDAY!', posterBg: '#e8413c' });
  const caf = SETS.cafeteria({ menu: 'TODAY: TACOS!', rule: 'NO\nSELFIES' });
  const T0 = caf.tables[1];   // centre table, front row: x = 0, z = 6
  caf.reset = () => { for (const t of caf.tables) t.children.forEach(ch => { ch.visible = true; }); };
  const hideFrontChairs = () => { T0.children[1].visible = T0.children[2].visible = false; };

  const S = cast(street, { kidA: 1, kidB: 2, kidC: 4, jade: 7, kidD: 1 });
  const H = cast(hall, { nar: 6, ben: 1, jade: 7, kidA: 1, kidB: 1, photog: 1 });
  const C = cast(caf, { nar: 12, ben: 5, kidA: 1, kidB: 1 });
  const fxs = set => ({ sp: [makeSparkles(set.group, 1), makeSparkles(set.group, 2), makeSparkles(set.group, 3)], bulb: makeBulb(set.group), puff: makePuff(set.group) });
  const FS = fxs(street), FH = fxs(hall), FC = fxs(caf);
  const sPhone = phone(S.kidA[0]);
  const hPhoneA = phone(H.kidA[0]), hPhoneJ = phone(H.jade[0]), hCam = bigCam(H.photog[0]);
  const jBag = bagProp(H.jade[1]), jCup = cupProp(H.jade[2]);
  const hBooks = booksProp(H.kidB[0]), nBooks = booksProp(H.nar[0]);
  const hBookFloor = []; for (let i = 0; i < 4; i++) { const b = prop(box(1.6, 0.34, 1.2, ['#f26a1b', '#7b3fc4', '#f2b01e', '#2e9e59'][i])); hall.group.add(b); hBookFloor.push(b); }
  const cTray = trayProp(C.nar[0]), cPhoneN = phone(C.nar[0]), cPhoneB = phone(C.ben[0]);
  const tacoTray = prop(grp(at(box(2.4, 0.1, 1.6, '#ff9f2e', 0.04), 0, 0, 0), at(box(1.0, 0.4, 0.5, '#f2c14e', 0.15), 0.3, 0.25, 0))); caf.group.add(tacoTray);

  const N = H.nar, J = H.jade;
  // ═══════════════ HOOK (street) ═══════════════
  // 1. wide street: four identical kids walk past; a kid lines up a photo of a friend
  shot({ line: 'In this town,', set: street, sfx: [['whoosh', 0]], cam: { pos: [-1, 3.6, 15.5], look: [-1, 3.3, 2.6], fov: 60, blur: 0.1, push: 0.02 },
    act(lt, c) {
      S.kidC.forEach((a, i) => walkX(a, -13 + i * 2.6, 1.2, 1, lt, c.t, 1, 'grin'));
      S.kidA[0].reset().place(-5, 4.2, Math.PI / 2).pose({ aR: [92, 2] }).idle(c.t).setFace('smile'); sPhone.show();
      S.kidB[0].reset().place(2.6, 4.2, -0.5).pose('cheer').idle(c.t).setFace('grin');
    } });
  // 2. over the photographer's shoulder: phone up, flash on "take"
  snapShot({ line: 'every picture you take', set: street, sfx: [['tick', 'take', 1.4]], cam: { pos: [-9.6, 6.4, 7.6], look: [2.6, 4.0, 4.2], fov: 50, blur: 0.2 },
    act(lt, c) {
      S.kidA[0].reset().place(-5, 4.2, Math.PI / 2).pose({ aR: [92, 2] }).idle(c.t).setFace('smile'); sPhone.show();
      S.kidB[0].reset().place(2.6, 4.2, -0.5).pose('cheer').idle(c.t).setFace(lt < c.w('take') ? 'grin' : 'wow');
    } }, ['take']);
  // 3. RULE FIRES: a second friend pops out
  shot({ line: 'makes another you.', set: street, sfx: [['sparkle', 'another'], ['pop', 'another', 0.7]], cam: frame(3.9, 4.2, { size: 'full', dist: 0.82, side: -8 }),
    act(lt, c) {
      const a = S.kidB[0].reset().place(2.6, 4.2, -0.3).pose('cheer').idle(c.t).setFace('grin');
      multiply(a, S.kidB[1], FS.sp[0], lt, c.w('another'), 2.6, 0.1, 'laugh');
    } });
  // 4-5. "that's why": a famous kid and her crowd of selves. Low angle, then a lateral track along the crowd
  shot({ line: "That's why famous kids", set: street, cam: { pos: [12.5, 1.4, 11.5], look: [12.5, 6.4, 2], fov: 62, blur: 0.3 },
    act(lt, c) {
      const P = [[12.5, 4, 'hips', 'smug'], [9.8, 2.2, 'wave', 'grin'], [15.2, 2.2, 'open', 'grin'], [11.1, 0.4, 'cheer', 'laugh'], [13.9, 0.4, 'hips', 'smug'], [8.2, -0.2, 'open', 'happy'], [16.8, -0.2, 'wave', 'grin']];
      P.forEach(([x, z, p, f], i) => S.jade[i].reset().place(x, z, (12.5 - x) * 0.05).pose(p).idle(c.t + i).setFace(f));
    } });
  shot({ line: 'walk around in crowds of themselves,', set: street, cam: { pos: [7.5, 4.6, 15.5], look: [7.5, 4.4, 2.5], fov: 60, blur: 0.2, push: 0, to: { pos: [14, 4.6, 15.5], look: [14, 4.4, 2.5] }, ease: 'lin' },
    act(lt, c) { S.jade.forEach((a, i) => walkX(a, 3 + i * 2.5 - (i % 2) * 0.6, 2.4 + (i % 2) * 1.6, 1, lt, c.t + i * 0.3, 0.55, i % 3 ? 'grin' : 'smug')); } });
  // 6-7. the other extreme: a camera-shy kid, floor level, then alone on a bench
  shot({ line: 'and camera-shy people', set: street, cam: frame(-5, 3, { size: 'medium', low: 0.42, side: 14 }),
    act(lt, c) { S.kidD[0].reset().place(-5, 3, 0.15).pose({ aL: [150, -26], aR: [150, -26], head: [10, 0, 0] }).idle(c.t, 0.5).setFace('worried'); } });
  shot({ line: 'only ever have one.', set: street, cam: { ...frame(0, 1, { size: 'wide', dist: 0.8 }), blur: 0.05, push: 0.015 },
    act(lt, c) { S.kidD[0].reset().place(0, 0.95, 0).sit(1.4).pose({ head: [14, 0, 0] }).idle(c.t, 0.4).setFace('sad'); } });

  // ═══════════════ NARRATOR + FRIEND + FOIL (hallway) ═══════════════
  shot({ line: 'I had exactly two of me.', set: hall, cam: frame(0.3, 1, { size: 'full', dist: 0.95, side: -6 }),
    act(lt, c) {
      N[0].reset().place(-0.9, 1.2, 0.15).pose('open').idle(c.t).setFace(lt < c.w('two') ? 'smile' : 'grin');
      N[1].reset().place(1.6, 0.6, -0.2).pose(lt < c.w('two') ? 'idle' : 'wave').idle(c.t + 1.3).setFace('grin');
    } });
  shot({ line: 'But my best friend Benny', set: hall, cam: frame(-7, 1, { size: 'close', side: -12 }),
    act(lt, c) { const b = H.ben[0].reset().place(-7, 1, -0.15).setFace('grin').pose('wave', remap(lt, 0.1, 0.4)).idle(c.t); b.armR.rotation.z += Math.sin(c.t * 14) * 0.25; } });
  // 10. sight gag (planted): a phone comes up, Benny throws his arms over his face and dodges
  snapShot({ line: 'had never been in a single photo.', set: hall, sfx: [['tick', 'single', 1.4], ['whoosh', 'single', 0.6]], cam: frame(-9.9, 1.4, { size: 'full', dist: 1.45, side: 6 }),
    act(lt, c) {
      const t0 = c.w('single') - 0.12, k = E.out(remap(lt, t0, t0 + 0.25));
      H.kidA[0].reset().place(-13.2, 1.6, Math.PI / 2).pose({ aR: [92, 2] }, remap(lt, 0, 0.3)).idle(c.t).setFace('grin'); hPhoneA.show();
      const b = H.ben[0].reset().place(-6.6 + k * 1.4, 1.2, -0.3).idle(c.t);
      if (lt < t0) b.setFace('neutral'); else { b.pose({ aL: [152, -26], aR: [152, -26], lean: [0, -12] }, k).setFace('worried'); }
    } }, ['single']);
  // 11-14. the foil: Jade and her forty-two selves, then a list of three
  shot({ line: 'Meanwhile, Jade had forty-two.', set: hall, sfx: [['pop', 'forty-two', 0.6]], cam: { ...frame(10, 1, { size: 'wide', dist: 0.72, side: -10 }), blur: 0.08 },
    act(lt, c) {
      const P = [[10, 2.6], [7.4, 1.4], [12.6, 1.4], [8.6, -0.6], [11.4, -0.6], [5.4, -1.8], [14.6, -1.8]];
      P.forEach(([x, z], i) => J[i].reset().place(x, z, (10 - x) * 0.06).pose(['hips', 'wave', 'open', 'cheer', 'hips', 'open', 'wave'][i]).idle(c.t + i).setFace(i === 0 ? 'smug' : ['grin', 'happy', 'laugh'][i % 3]));
      if (lt > c.w('forty-two')) J[0].pose('flex', remap(lt, c.w('forty-two'), c.w('forty-two') + 0.15));
    } });
  shot({ line: 'One to carry her bag,', set: hall, cam: frame(-12, 0, { size: 'close', side: 16 }),
    act(lt, c) { J[1].reset().place(-12, 0, 0.2).pose({ aL: [62, -8], aR: [62, -8] }).walk(c.t, 0.4, 8).pose({ aL: [62, -8], aR: [62, -8] }).idle(c.t).setFace('grin'); jBag.show(); } });
  shot({ line: 'one to hold her smoothie,', set: hall, cam: frame(5.8, 0.5, { size: 'close', side: -14 }),
    act(lt, c) { J[2].reset().place(5.8, 0.5, -0.25).pose({ aR: [76, -14], aL: [0, 6] }).idle(c.t).setFace('smile'); jCup.show(); } });
  shot({ line: 'and one just to clap.', set: hall, sfx: [['tick', 'clap', 1], ['tick', 0.7, 0.8]], cam: frame(15, 0, { size: 'close', side: 8, push: 0.05 }),
    act(lt, c) { const s = Math.sin(c.t * 22); J[3].reset().place(15, 0, 0).pose({ aL: [82, -18 + s * 14], aR: [82, -18 + s * 14] }).idle(c.t).setFace('laugh'); } });

  // ═══════════════ INCITING MOMENT ═══════════════
  shot({ line: 'Then on picture day,', set: hall, cam: { ...frame(9.4, 1.5, { size: 'wide', dist: 0.68 }), look: [9.4, 5.6, 1.5], blur: 0.08 },
    act(lt, c) {
      H.photog[0].reset().place(12.4, 0.6, -0.5).pose({ aL: [96, -24], aR: [96, -24] }).idle(c.t).setFace('smile'); hCam.show();
      H.kidB[0].reset().place(7, -1.2, 0.5).pose('cheer').idle(c.t).setFace('grin');
      walkX(N[0], 1.5, 2.4, 1, lt, c.t, 0.8, 'happy'); walkX(N[1], -0.6, 3.4, 1, lt, c.t + 0.4, 0.8, 'happy');
    } });
  snapShot({ line: 'the photographer snapped me by accident.', set: hall, sfx: [['tick', 'snapped', 1.5]], cam: { pos: [15.6, 5.8, 2.6], look: [6.4, 4.2, 1.2], fov: 54, blur: 0.25 },
    act(lt, c) {
      H.photog[0].reset().place(12.4, 0.6, -1.25).pose({ aL: [96, -24], aR: [96, -24] }).idle(c.t).setFace('smile'); hCam.show();
      H.kidB[0].reset().place(4.8, -1.4, 1.0).pose('cheer').idle(c.t).setFace('grin');
      const sn = c.w('snapped'), x = 3.6 + Math.min(lt, sn) * 2.4;
      if (lt < sn) walkX(N[0], 3.6, 1.6, 1, lt, c.t, 0.6, 'happy'); else N[0].reset().place(x, 1.6, 1.1).pose('shrug', remap(lt, sn, sn + 0.2)).idle(c.t).setFace('shock');
    } }, ['snapped']);
  shot({ line: 'Pop. Three of me.', set: hall, sfx: [['sparkle', 0], ['pop', 0, 0.8]], cam: frame(5.2, 1.6, { size: 'full', dist: 0.86, side: 6 }),
    act(lt, c) {
      const a = N[0].reset().place(5.4, 1.6, 0).pose('open').idle(c.t).setFace(lt < c.w('three') ? 'grin' : 'laugh');
      N[1].reset().place(7.8, 1.0, -0.25).pose('idle').idle(c.t + 1.3).setFace(lt < 0.5 ? 'shock' : 'grin');
      multiply(a, N[2], FH.sp[0], lt, 0.0, -2.5, -0.4, 'grin', 2.1);
    } });
  shot({ line: 'Everyone gasped.', set: hall, cam: frame(-2, -1, { size: 'close', side: 18, push: 0.05 }),
    act(lt, c) { H.kidB[0].reset().place(-2, -1, 0.3).pose({ aL: [140, -20], aR: [140, -20] }, remap(lt, 0, 0.12)).setFace('shock'); J[4].reset().place(1.4, -2.2, -0.4).setFace('shock').pose('shrug'); } });
  // idea + goal: bulb, then an imagined crowd pops in behind him one by one
  shot({ line: "And that's when I had an idea.", set: hall, sfx: [['ding', 'idea']], cam: frame(-3, 1, { size: 'close', side: -10 }),
    act(lt, c) { N[0].reset().place(-3, 1, 0.1).idle(c.t).setFace(lt < c.w('idea') ? 'neutral' : 'grin'); FH.bulb.at(lt - c.w('idea'), N[0]); } });
  shot({ line: 'If I got enough pictures,', set: hall, cam: frame(-3, 1, { size: 'face', side: 18 }),
    act(lt, c) { N[0].reset().place(-3, 1, 0.3).pose('think').idle(c.t).setFace(lt < c.w('pictures') ? 'smirk' : 'smug'); } });
  shot({ line: "I'd be a crowd like Jade.", set: hall, sfx: [['pop', 'be', 0.6], ['pop', 'crowd', 0.6], ['pop', 'like', 0.6], ['pop', 'jade', 0.6]], cam: frame(-3, 0, { size: 'full', dist: 0.9 }),
    act(lt, c) {
      N[0].reset().place(-3, 1.2, 0).pose('cheer').idle(c.t).setFace('grin');
      [['be', -5.6, -1.2], ['crowd', -0.4, -1.2], ['like', -4.3, -3.3], ['jade', -1.7, -3.3]].forEach(([w, x, z], i) => {
        const k = E.back(remap(lt, c.w(w), c.w(w) + 0.2)); if (k <= 0) return;
        N[i + 1].reset().place(x, z, 0).size(Math.max(0.02, k)).pose(['cheer', 'wave', 'open', 'flex'][i]).idle(c.t + i).setFace(['laugh', 'grin', 'happy', 'grin'][i]);
      });
    } });

  // ═══════════════ TWO FAILED TRIES ═══════════════
  shot({ line: 'I posed by the lockers.', set: hall, cam: frame(-10, -3.4, { size: 'close', side: 12, low: 0.25 }),
    act(lt, c) { N[0].reset().place(-10, -3.4, 0.1).pose('flex', remap(lt, 0, 0.2)).idle(c.t).setFace('smug'); } });
  shot({ line: 'Nobody noticed.', set: hall, cam: { ...frame(-9, -1, { size: 'wide', dist: 0.7, side: -14 }), blur: 0.06 },
    act(lt, c) {
      N[0].reset().place(-10, -3.4, 0.1).pose('flex').idle(c.t).setFace(lt < c.w('noticed') ? 'smug' : 'neutral');
      walkX(H.kidA[0], -15, 0.6, 1, lt, c.t, 0.9, 'smile'); walkX(J[5], -4, 1.8, -1, lt, c.t, 0.8, 'smug'); walkX(H.kidB[0], -18, 3, 1, lt, c.t + 2, 1.1, 'happy');
    } });
  shot({ line: 'I did a backflip.', set: hall, sfx: [['whoosh', 'backflip'], ['thud', 0.95, 0.8]], cam: frame(-6, 1, { size: 'full', side: 10, dist: 1.05 }),
    act(lt, c) {
      const t0 = c.w('backflip') - 0.1, k = remap(lt, t0, t0 + 0.7);
      const a = N[0].reset().place(-6, 1, 0.1).pose(k > 0 && k < 1 ? 'cheer' : 'open').jump(k, 3.4).setFace(k > 0 && k < 1 ? 'laugh' : 'grin');
      a.hip.rotation.x = -Math.PI * 2 * E.inOut(k); FH.puff.at(lt - t0 - 0.7, [-6, 0, 1]);
    } });
  shot({ line: 'Still nothing.', set: hall, cam: { ...frame(-6, 0, { size: 'wide', dist: 0.65, side: 22 }), blur: 0.06 },
    act(lt, c) {
      N[0].reset().place(-6, 1, 0.2).pose('shrug').idle(c.t).setFace('sus');
      walkX(J[5], -1, 2.6, -1, lt, c.t, 0.9, 'smug'); walkX(H.kidA[0], -12.5, -1.6, 1, lt, c.t, 0.9, 'smile'); walkX(H.photog[0], -2, -1, -1, lt, c.t, 0.7, 'neutral');
    } });

  // ═══════════════ ACCIDENTAL SUCCESS ═══════════════
  shot({ line: 'Then a kid dropped his books,', set: hall, sfx: [['thud', 'books', 0.9]], cam: frame(6.4, 1.5, { size: 'full', side: -10, dist: 0.95 }),
    act(lt, c) {
      const t0 = c.w('dropped'), b = H.kidB[0].reset().place(5 + Math.min(lt, t0) * 2.2, 1.5, Math.PI / 2 - 0.5);
      if (lt < t0) { b.walk(c.t, 0.7).pose({ aL: [72, -8], aR: [72, -8] }).setFace('happy'); hBooks.show(); }
      else { b.pose({ aL: [40, 40], aR: [40, 40] }).idle(c.t).setFace('worried');
        hBookFloor.forEach((bk, i) => { const k = E.in(remap(lt, t0 + i * 0.05, t0 + 0.3 + i * 0.05)); bk.show(); bk.position.set(b.root.position.x + 1.2 + (i - 1.5) * 0.9 * k, lerp(3.1 + i * 0.34, 0.17, k), 1.5 + 1.4 + (i % 2) * 0.8 * k); bk.rotation.set(0, i * 0.7 * k, (i % 2 ? 0.4 : -0.3) * (1 - k)); }); }
    } });
  shot({ line: 'so I helped him pick them up,', set: hall, cam: frame(8, 2.2, { size: 'medium', side: 14, dist: 1.2 }),
    act(lt, c) {
      const k = remap(lt, 0, c.d);
      const n = N[0].reset().place(6.6, 3.2, 0.4).pose('reach', 0.7).idle(c.t); n.hip.rotation.x = 0.55 * Math.sin(Math.min(1, k * 1.6) * Math.PI); n.setFace('smile');
      H.kidB[0].reset().place(9.6, 1.6, -0.4).pose({ aL: [72, -8], aR: [72, -8] }).idle(c.t).setFace(k < 0.5 ? 'worried' : 'happy'); hBooks.show();
      hBookFloor.forEach((bk, i) => { if (i / 4 < 1 - k) { bk.show(); bk.position.set(5.6 + (i - 1.5) * 1.1, 0.17, 4.8 + (i % 2) * 0.7); bk.rotation.set(0, i * 0.7, 0); } });
    } });
  snapShot({ line: 'and everyone took my picture.', set: hall, sfx: [['tick', 'everyone', 1.3], ['tick', 'took', 1.3], ['tick', 'picture', 1.3]], cam: { pos: [6.8, 5.2, 13.5], look: [6.6, 4.4, 1.6], fov: 56, blur: 0.35, focus: [6.6, 4.4, 1.6] },
    act(lt, c) {
      N[0].reset().place(6.6, 1.6, 0).pose({ aL: [72, -8], aR: [72, -8] }).idle(c.t).setFace(lt < c.w('everyone') ? 'happy' : 'wow'); nBooks.show();
      H.kidA[0].reset().place(4.2, 6.8, Math.PI - 0.2).pose({ aR: [112, 4] }).idle(c.t); hPhoneA.show();
      J[0].reset().place(9.2, 6.4, Math.PI + 0.25).pose({ aR: [112, 4] }).idle(c.t); hPhoneJ.show();
      H.photog[0].reset().place(10.8, -1.4, -0.6).pose({ aL: [96, -24], aR: [96, -24] }).idle(c.t).setFace('smile'); hCam.show();
    } }, ['everyone', 'took', 'picture']);
  shot({ line: 'Pop. Pop. Pop.', set: hall, sfx: [['sparkle', 'pop'], ['pop', ['pop', 1], 0.7], ['sparkle', ['pop', 1]], ['sparkle', ['pop', 2]], ['pop', ['pop', 2], 0.7]],
    cam: frame(6.6, 0.4, { size: 'full', dist: 1.08, low: 0.2 }),
    act(lt, c) {
      const a = N[0].reset().place(6.6, 1.6, 0).pose({ aL: [72, -8], aR: [72, -8] }).idle(c.t).setFace('laugh'); nBooks.show();
      multiply(a, N[1], FH.sp[0], lt, c.w('pop'), -2.6, -0.6, 'grin', 1);
      multiply(a, N[2], FH.sp[1], lt, c.w('pop', 1), 2.6, -0.6, 'laugh', 2);
      multiply(a, N[3], FH.sp[2], lt, c.w('pop', 2), 0.3, -3.2, 'grin', 3);
      if (lt < c.w('pop', 2) + 0.47) a.setFace('scream');
    } });

  // ═══════════════ MONTAGE ═══════════════
  shot({ line: 'So I started holding doors,', set: hall, cam: frame(1.6, -2.6, { size: 'medium', side: 24, dist: 1.25 }),
    act(lt, c) {
      N[0].reset().place(0, -3.2, 0.5).pose({ aR: [70, 40], aL: [0, 6] }).idle(c.t).setFace('grin');
      walkX(J[6], 7, -1.4, -1, lt, c.t, 0.6, 'happy');
    } });
  shot({ line: 'carrying trays,', set: caf, cam: frame(-8, 0, { size: 'medium', side: -18, dist: 1.1 }),
    act(lt, c) { C.nar[0].reset().place(-9 + lt * 2, 0, Math.PI / 2 - 0.6).walk(c.t, 0.6).pose({ aL: [80, -10], aR: [80, -10] }).setFace('grin'); cTray.show(); } });
  shot({ line: 'and cheering for everyone.', set: caf, sfx: [['boing', 'cheering', 0.7]], cam: frame(-8, 0, { size: 'full', side: 6, dist: 1.1 }),
    act(lt, c) {
      const k = (lt * 2.2) % 1;
      C.nar[0].reset().place(-9.4, 0.4, 0.3).pose('cheer').jump(k, 1.2).setFace('laugh');
      C.nar[1].reset().place(-6.4, -0.6, -0.3).pose('cheer').jump((k + 0.5) % 1, 1.2).setFace('grin');
      C.kidA[0].reset().place(-17.4, 3.4, 0).sit(1.5).idle(c.t).setFace(lt < 0.4 ? 'neutral' : 'happy');
      C.kidB[0].reset().place(-12.6, 3.4, 0).sit(1.5).idle(c.t).setFace('sus');
    } });
  shot({ line: 'By lunchtime there were twelve of me.', set: caf, sfx: [['pop', 'twelve', 0.8]], cam: { pos: [0, 6.4, 13.5], look: [0, 3.6, -0.5], fov: 62, blur: 0.06, push: 0.02 },
    act(lt, c) {
      const P = [[0, 1.6], [-3, 1.0], [3, 1.0], [-6, 0.2], [6, 0.2], [-1.6, -1.6], [1.6, -1.6], [-4.6, -2.4], [4.6, -2.4], [-8.4, 2.6], [8.4, 2.6], [0, -3.4]];
      P.forEach(([x, z], i) => C.nar[i].reset().place(x, z, -x * 0.03).pose(['open', 'cheer', 'wave', 'hips', 'flex', 'cheer', 'open', 'wave', 'cheer', 'open', 'hips', 'cheer'][i]).idle(c.t + i * 0.7).setFace(['grin', 'laugh', 'happy'][i % 3]));
    } });

  // ═══════════════ TURN ═══════════════
  shot({ line: 'But then I noticed Benny', set: caf, cam: frame(10, -0.5, { size: 'close', side: -14 }),
    act(lt, c) { const n = C.nar[0].reset().place(10, -0.5, -0.2).idle(c.t); const k = remap(lt, c.w('noticed'), c.w('noticed') + 0.2); n.head.rotation.y += -0.7 * k; n.setFace(k < 0.5 ? 'laugh' : 'neutral'); } });
  shot({ line: 'eating alone.', set: caf, sfx: [['sad', 'alone', 0.8]], cam: { pos: [1.5, 7.0, 12.5], look: [-1.8, 3.6, 3.4], fov: 58, blur: 0.04, push: 0.02 },
    act(lt, c) { hideFrontChairs(); C.ben[0].reset().place(-2.4, 3.4, 0).sit(1.5).pose('slump').idle(c.t, 0.3).setFace('sad'); tacoTray.show().position.set(-2.4, 2.84, 4.9); } });
  shot({ line: 'Just one of him.', set: caf, cam: frame(-2.4, 3.4, { size: 'close', side: 10, push: 0.05 }),
    act(lt, c) { hideFrontChairs(); C.ben[0].reset().place(-2.4, 3.4, 0).sit(1.5).pose({ head: [16, 0, 0], aL: [42, 4], aR: [42, 4] }).idle(c.t, 0.3).setFace('sad'); tacoTray.show().position.set(-2.4, 2.84, 4.9); } });
  shot({ line: "I'd spent all day collecting myself", set: caf, cam: frame(10, -0.5, { size: 'close', side: 16 }),
    act(lt, c) { C.nar[0].reset().place(10, -0.5, -0.4).idle(c.t, 0.5).setFace(lt < c.w('collecting') ? 'worried' : 'sad'); if (lt > c.w('collecting')) C.nar[0].pose('slump', remap(lt, c.w('collecting'), c.w('collecting') + 0.3)); } });
  shot({ line: 'and ignored my best friend.', set: caf, cam: frame(10, -0.5, { size: 'face', side: -6, push: 0.05 }),
    act(lt, c) { C.nar[0].reset().place(10, -0.5, -0.1).pose({ head: [8, 0, 0] }).idle(c.t, 0.4).setFace(lt < c.w('best') ? 'sad' : 'cry'); } });

  // ═══════════════ MAKING IT RIGHT ═══════════════
  shot({ line: 'I sat down. Benny, smile.', set: caf, cam: { pos: [-0.9, 7.2, 12.2], look: [-0.9, 4.4, 3.4], fov: 60, blur: 0.3 },
    act(lt, c) {
      hideFrontChairs(); tacoTray.show().position.set(-2.4, 2.84, 4.9);
      const n = C.nar[0].reset().place(0.6, 3.4, -0.5).sit(1.5).idle(c.t).setFace(lt < c.w('benny') ? 'smile' : 'say').talk(c.t, lt > c.w('benny') ? 1 : 0);
      if (lt > c.w('smile')) { n.pose({ aR: [96, -10] }, remap(lt, c.w('smile'), c.w('smile') + 0.15)); cPhoneN.show(); }
      C.ben[0].reset().place(-2.4, 3.4, 0.3).sit(1.5).idle(c.t).setFace(lt < c.w('benny') ? 'sad' : 'neutral').lookAt(0.6, 3.4);
    } });
  shot({ line: 'I hate pictures.', set: caf, cam: frame(-2.4, 3.4, { size: 'close', side: -12, dist: 1.2 }),
    act(lt, c) { hideFrontChairs(); C.ben[0].reset().place(-2.4, 3.4, 0.3).sit(1.5).pose('hug').talk(c.t).idle(c.t).setFace(lt < c.w('hate') ? 'say' : 'mad'); } });
  shot({ line: 'Just one.', set: caf, cam: frame(0.6, 3.4, { size: 'close', side: 18 }),
    act(lt, c) { hideFrontChairs(); C.nar[0].reset().place(0.6, 3.4, -0.5).sit(1.5).pose({ aR: [96, -10] }).talk(c.t).idle(c.t).setFace(lt < c.w('one') ? 'say' : 'wink'); cPhoneN.show(); } });
  snapShot({ line: 'Click. Click.', set: caf, sfx: [['tick', 'click', 1.4], ['sparkle', 'click'], ['tick', ['click', 1], 1.4], ['sparkle', ['click', 1]]], cam: frame(-2.4, 2.4, { size: 'full', dist: 1.0, low: 0.2 }),
    act(lt, c) {
      hideFrontChairs(); tacoTray.show().position.set(-2.4, 2.84, 4.9);
      const b = C.ben[0].reset().place(-2.4, 3.4, 0).sit(1.5).idle(c.t).setFace('shock');
      multiply(b, C.ben[1], FC.sp[0], lt, c.w('click'), -2.6, -1.4, 'grin', 1);
      multiply(b, C.ben[2], FC.sp[1], lt, c.w('click', 1), 2.6, -1.4, 'laugh', 2);
    } }, ['click', ['click', 1]]);
  shot({ line: 'For once, Benny had a full table.', set: caf, sfx: [['sparkle', 'full', 0.6]], cam: { pos: [0, 7.6, 14.5], look: [0, 4.3, 2.6], fov: 60, blur: 0.1 },
    act(lt, c) {
      hideFrontChairs(); tacoTray.show().position.set(-2.4, 2.84, 4.9);
      const P = [[-2.4, 3.4, 1], [0, 3.4, 1], [2.4, 3.4, 1], [-1.3, 0.9, 0], [1.4, 0.9, 0]];
      P.forEach(([x, z, sit], i) => { const b = C.ben[i].reset().place(x, z, -x * 0.06); if (sit) b.sit(1.5); else b.pose(i === 3 ? 'cheer' : 'wave'); b.idle(c.t + i).setFace(lt < c.w('full') ? ['happy', 'grin', 'smile', 'grin', 'happy'][i] : ['laugh', 'grin', 'laugh', 'grin', 'laugh'][i]); });
      C.ben[0].pose({ aL: [150, 30], aR: [150, 30] }, remap(lt, c.w('full'), c.w('full') + 0.2));
    } });
  // RETURN: he snaps the narrator back
  shot({ line: 'Then he grabbed my phone', set: caf, sfx: [['whoosh', 'grabbed', 0.6]], cam: frame(-2.4, 3.4, { size: 'close', side: 14 }),
    act(lt, c) { hideFrontChairs(); const k = remap(lt, c.w('grabbed'), c.w('grabbed') + 0.15); const b = C.ben[0].reset().place(-2.4, 3.4, 0.3).sit(1.5).idle(c.t).setFace(k < 1 ? 'smirk' : 'smug'); if (k > 0) { b.pose({ aR: [100, -6] }, k); cPhoneB.show(); } } });
  snapShot({ line: 'and snapped me right back.', set: caf, sfx: [['tick', 'snapped', 1.4], ['sparkle', 'snapped'], ['pop', 'snapped', 0.6]], cam: frame(8.3, 0.6, { size: 'full', dist: 0.85, side: -8 }),
    act(lt, c) { const n = C.nar[0].reset().place(7.5, 0.8, -0.2).pose('open').idle(c.t).setFace(lt < c.w('snapped') ? 'smile' : 'laugh'); multiply(n, C.nar[1], FC.sp[0], lt, c.w('snapped'), 2.5, -0.6, 'grin', 1); } }, ['snapped']);

  // ═══════════════ BUTTON ═══════════════
  shot({ line: 'Then his copy said, nice backflip.', set: caf, sfx: [['pop', 'backflip', 0.5]], cam: frame(4.4, 0.4, { size: 'close', side: -12, push: 0.05 }),
    act(lt, c) { hideFrontChairs(); C.ben[4].reset().place(4.4, 0.4, -0.2).pose(lt < c.w('nice') ? { head: [0, 0, 10] } : { aR: [60, 30] }).talk(c.t, lt > c.w('nice') ? 1 : 0).idle(c.t).setFace(lt < c.w('nice') ? 'smirk' : lt < c.w('backflip') + 0.25 ? 'say' : 'smug'); C.ben[1].reset().place(7.6, -2.2, -0.3).idle(c.t).setFace('grin'); } });
  shot({ line: 'I stared at him.', set: caf, cam: frame(7.5, 0.8, { size: 'face', side: 6, push: 0.07 }),
    act(lt, c) { C.nar[0].reset().place(7.5, 0.8, 0).idle(c.t, 0.2).setFace('sus'); } });
  shot({ line: 'Best picture I ever took.', set: caf, cam: frame(7.5, 0.8, { size: 'close', side: -14, low: 0.36, dist: 1.05 }),
    act(lt, c) {
      hideFrontChairs();
      C.nar[0].reset().place(7.5, 0.8, -0.2).pose('open').idle(c.t).setFace(lt < c.w('picture') ? 'laugh' : 'grin');
      [[4.6, -1.6], [10.6, -1.4], [12.6, 3.4]].forEach(([x, z], i) => { const b = C.ben[i].reset().place(x, z, 0.3); if (z > 3) b.sit(1.5); else b.pose('cheer'); b.idle(c.t + i).setFace('laugh'); });
    } });
});
