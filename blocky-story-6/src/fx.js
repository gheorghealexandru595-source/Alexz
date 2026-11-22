// fx.js: the effect vocabulary of the style. Every effect is a pure function of time.
import * as THREE from 'three';
import { canvasTex, rng, clamp, remap, E, glow, box, lerp, PRE } from './util.js';

const starTex = canvasTex(128, 128, (g, w) => { // four-point sparkle
  const c = w / 2; g.translate(c, c); const gr = g.createRadialGradient(0, 0, 0, 0, 0, c); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#fff7b0'); gr.addColorStop(1, '#ffe95a');
  g.fillStyle = gr; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? c * 0.2 : c * 0.98; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill();
});
const beamTex = canvasTex(32, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,246,170,0)'); gr.addColorStop(0.5, 'rgba(255,250,200,0.9)'); gr.addColorStop(1, 'rgba(255,246,170,0)'); g.fillStyle = gr; g.fillRect(w * 0.3, 0, w * 0.4, h); });
const sprite = (map, add = true) => new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.35) }));

// Sparkle burst: 12 four-point stars + 5 thin vertical light streaks around a character. Lasts 1.0 s.
// Timeline measured from the reference: stars appear 2 frames after the trigger, peak at 8-12 frames, gone by 30.
export function makeSparkles(parent, seed = 1, n = 12) {
  const g = new THREE.Group(), r = rng(seed), stars = [], beams = [];
  for (let i = 0; i < n; i++) { const s = sprite(starTex); s.userData = { a: r() * 6.28, rad: 1.6 + r() * 1.2, y: 1.6 + r() * 4.2, size: 0.35 + r() * 0.55, del: r() * 0.22, spin: r() * 2 - 1 }; g.add(s); stars.push(s); }
  for (let i = 0; i < 5; i++) { const b = sprite(beamTex); b.userData = { x: (r() - 0.5) * 3.6, z: (r() - 0.5) * 1.2, del: r() * 0.15, h: 3 + r() * 3 }; g.add(b); beams.push(b); }
  g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { group: g,
    // at(dt, pos, scale): dt = seconds since trigger, pos = feet position [x,y,z], scale = character size
    at(dt, pos, sc = 1) {
      g.visible = dt >= 0 && dt < 1.05; if (!g.visible) return; g.position.set(pos[0], pos[1], pos[2]); g.scale.setScalar(sc);
      for (const s of stars) { const u = s.userData, k = remap(dt, 0.06 + u.del, 0.34 + u.del), out = remap(dt, 0.5 + u.del, 0.95 + u.del), sz = u.size * E.back(k) * (1 - out); s.position.set(Math.sin(u.a) * u.rad, u.y + dt * 0.5, Math.cos(u.a) * u.rad * 0.35 + 0.3); s.scale.setScalar(Math.max(sz, 0.0001)); s.material.rotation = u.spin * dt * 1.5; }
      for (const b of beams) { const u = b.userData, k = remap(dt, u.del, u.del + 0.5), a = Math.sin(k * Math.PI); b.position.set(u.x, 2 + k * 3.5, u.z); b.scale.set(0.5, u.h, 1); b.material.opacity = a * 0.9; }
    } };
}
// Growth beat (the signature move). Call every frame: grow(av, sparkles, lt, t0, from, to, restFace)
//  t0+0.00 face snaps to 'scream' (white round eyes, big dark mouth) and arms flare out
//  t0+0.05..0.45 body scales from -> to with a small overshoot, sparkles + light streaks
//  t0+0.47 face snaps back to restFace (usually 'grin')
export function grow(av, sp, lt, t0, from, to, restFace = 'grin') {
  const dt = lt - t0; if (dt < 0) { av.size(from); if (sp) sp.at(-1, [0, 0, 0]); return false; }
  const k = E.back(remap(dt, 0.05, 0.45)); av.size(lerp(from, to, k));
  if (dt < 0.47) { av.setFace('scream'); av.pose({ aL: [20, 70], aR: [20, 70] }, Math.sin(remap(dt, 0, 0.47) * Math.PI)); } else av.setFace(restFace);
  if (sp) sp.at(dt, av.root.position.toArray(), lerp(from, to, k)); return true;
}
// Idea light bulb above a head. at(dt, av): pops in with overshoot, rays flicker.
export function makeBulb(parent) {
  const g = new THREE.Group(), bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), glow('#ffee22', 1.5)); g.add(bulb);
  const base = box(0.42, 0.34, 0.42, '#8a8a8a', 0.06); base.position.y = -0.62; g.add(base);
  const rays = []; for (let i = 0; i < 7; i++) { const a = -0.3 + i * (Math.PI + 0.6) / 6, rr = box(0.5, 0.13, 0.08, glow('#ffee22', 1.4)); rr.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0); rr.rotation.z = a; g.add(rr); rays.push(rr); }
  g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { group: g, at(dt, av, dx = 0.9) { g.visible = dt >= 0; if (!g.visible) return; const s = av.root.scale.x, p = av.root.position; g.position.set(p.x + dx * s, p.y + 6.6 * s, p.z); g.scale.setScalar(Math.max(0.001, E.back(remap(dt, 0, 0.22))) * s); g.rotation.z = -0.25; rays.forEach((r, i) => r.scale.x = 0.8 + 0.3 * Math.sin(dt * 14 + i)); } };
}
// Emote billboard above a head: '?', '!', '!!', '...', '♥', 'zzz', '$'. at(dt, av)
export function makeEmote(parent, text = '!', color = '#ff3b30') {
  const t = canvasTex(256, 256, g => { g.font = '900 190px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 26; g.strokeText(text, 128, 138); g.fillStyle = color; g.fillText(text, 128, 138); });
  const s = sprite(t, false); s.material.color.set('#fff'); s.visible = false; parent.add(s); PRE.push(() => { s.visible = false; });
  return { sprite: s, at(dt, av, hold = 1.2) { s.visible = dt >= 0 && dt < hold; if (!s.visible) return; const sc = av.root.scale.x, p = av.root.position; const k = E.back(remap(dt, 0, 0.18)) * (1 - remap(dt, hold - 0.12, hold)); s.position.set(p.x + 0.9 * sc, p.y + 6.4 * sc + Math.sin(dt * 9) * 0.06, p.z + 0.2); s.scale.setScalar(Math.max(0.001, 1.6 * k * sc)); } };
}
// Dust puff at feet (landing, running start, poof). at(dt, pos)
export function makePuff(parent, seed = 3) {
  const tex = canvasTex(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const g = new THREE.Group(), r = rng(seed), ps = []; for (let i = 0; i < 9; i++) { const s = sprite(tex, false); s.material.color.set('#fff'); s.userData = { a: r() * 6.28, v: 1 + r() * 1.6, s: 0.7 + r() * 0.8 }; g.add(s); ps.push(s); } g.visible = false; parent.add(g); PRE.push(() => { g.visible = false; });
  return { group: g, at(dt, pos) { g.visible = dt >= 0 && dt < 0.6; if (!g.visible) return; g.position.set(pos[0], pos[1], pos[2]); const k = dt / 0.6; for (const s of ps) { const u = s.userData; s.position.set(Math.cos(u.a) * u.v * E.out(k), 0.3 + k * 0.5, Math.sin(u.a) * u.v * E.out(k) * 0.5); s.scale.setScalar(u.s * (0.5 + k)); s.material.opacity = (1 - k) * 0.85; } } };
}
