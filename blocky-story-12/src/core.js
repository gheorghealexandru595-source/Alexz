// core.js: renderer, lighting, post (depth of field + bloom + bright grade + intro flash), one-word captions,
// word-timed shot list and the pure function renderAt(t). No clocks, no Math.random at render time.
import * as THREE from 'three';
import { clamp, lerp, remap, E, PRE } from './util.js';

export const W = 1080, H = 1920, FPS = 30;
const Q = new URLSearchParams(location.search);
const SCALE = parseFloat(Q.get('scale') || '1');          // ?scale=0.5 for fast drafts
export const canvas = document.getElementById('c');
canvas.width = W * SCALE; canvas.height = H * SCALE;
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W * SCALE, H * SCALE, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NoToneMapping;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 600);

// ── lighting: bright, soft, high-key. One shadowed key + strong fill, like a game engine's daylight.
const amb = new THREE.AmbientLight('#ffffff', 1.5), hemi = new THREE.HemisphereLight('#ffffff', '#b9c4d6', 1.2);
const sun = new THREE.DirectionalLight('#fff6e8', 2.3);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 5; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.intensity = 0.6;
const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 160;
scene.add(amb, hemi, sun, sun.target);
export const LIGHTS = {
  indoor: { amb: 1.35, hemi: 0.95, sun: 1.15, dir: [-6, 18, 12], sunColor: '#fff4e2', bg: '#e9e6dc', exposure: 1.0 },
  outdoor: { amb: 1.1, hemi: 1.0, sun: 1.6, dir: [-10, 20, 9], sunColor: '#fff3d6', bg: '#6ec3f4', exposure: 1.02 },
  warm: { amb: 1.2, hemi: 0.85, sun: 1.3, dir: [8, 14, 10], sunColor: '#ffd9a0', bg: '#f3d9b0', exposure: 1.0 },
  night: { amb: 0.6, hemi: 0.45, sun: 0.8, dir: [-6, 16, 8], sunColor: '#9fb6ff', bg: '#16203a', exposure: 0.95 },
};
function applyLight(name, target) {
  const L = LIGHTS[name] || LIGHTS.indoor; amb.intensity = L.amb; hemi.intensity = L.hemi; sun.intensity = L.sun; sun.color.set(L.sunColor);
  sun.target.position.copy(target); sun.position.set(target.x + L.dir[0] * 3, target.y + L.dir[1] * 3, target.z + L.dir[2] * 3);
  scene.background = new THREE.Color(L.bg); return L;
}

// ── render targets + post
const rw = Math.round(W * SCALE), rh = Math.round(H * SCALE);
const mainRT = new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType, samples: Q.get('aa') === '0' ? 0 : 4, depthTexture: new THREE.DepthTexture(rw, rh) });
const mkRT = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false });
const bA = mkRT(rw >> 2, rh >> 2), bB = mkRT(rw >> 2, rh >> 2), bC = mkRT(rw >> 3, rh >> 3), bD = mkRT(rw >> 3, rh >> 3);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), qScene = new THREE.Scene(), qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); qScene.add(quad);
const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const brightM = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, thr: { value: 1.02 } }, vertexShader: VS, fragmentShader: 'varying vec2 vUv; uniform sampler2D t; uniform float thr; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=max(c.r,max(c.g,c.b)); gl_FragColor=vec4(c*smoothstep(thr,thr+0.5,l),1.); }' });
const blurM = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } }, vertexShader: VS, fragmentShader: 'varying vec2 vUv; uniform sampler2D t; uniform vec2 d; void main(){ vec3 c=texture2D(t,vUv).rgb*0.227; c+=(texture2D(t,vUv+d*1.385).rgb+texture2D(t,vUv-d*1.385).rgb)*0.316; c+=(texture2D(t,vUv+d*3.231).rgb+texture2D(t,vUv-d*3.231).rgb)*0.0703; gl_FragColor=vec4(c,1.); }' });
export const overlay = document.createElement('canvas'); overlay.width = W; overlay.height = H; const og = overlay.getContext('2d');
const oTex = new THREE.CanvasTexture(overlay); oTex.colorSpace = THREE.NoColorSpace; oTex.generateMipmaps = false; oTex.minFilter = THREE.LinearFilter;
const finalM = new THREE.ShaderMaterial({
  uniforms: { tC: { value: mainRT.texture }, tD: { value: mainRT.depthTexture }, tB1: { value: bB.texture }, tB2: { value: bD.texture }, tO: { value: oTex }, px: { value: new THREE.Vector2(1 / rw, 1 / rh) },
    near: { value: 0.1 }, far: { value: 600 }, focus: { value: 8 }, ap: { value: 0 }, maxCoc: { value: 14 * SCALE }, bloom: { value: 0.55 }, expo: { value: 1 }, sat: { value: 1.24 }, intro: { value: 0 }, flash: { value: 0 } },
  vertexShader: VS,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tC,tD,tB1,tB2,tO; uniform vec2 px; uniform float near,far,focus,ap,maxCoc,bloom,expo,sat,intro,flash;
  float lin(float d){ float z=d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
  float coc(vec2 uv){ float z=lin(texture2D(tD,uv).x); return clamp(abs(z-focus)/z*ap,0.,maxCoc)+intro*maxCoc*3.; }
  void main(){
    float c0=coc(vUv); vec3 col=texture2D(tC,vUv).rgb;
    if(c0>0.6){ vec3 acc=col; float wsum=1.; const float GA=2.39996;
      for(int i=1;i<32;i++){ float fi=float(i); float r=sqrt(fi/32.)*c0; vec2 o=vec2(cos(fi*GA),sin(fi*GA))*r*px; float cs=coc(vUv+o); float w=smoothstep(0.,1.,cs-r+1.5); acc+=texture2D(tC,vUv+o).rgb*w; wsum+=w; }
      col=acc/wsum; }
    vec3 b=texture2D(tB1,vUv).rgb*0.6+texture2D(tB2,vUv).rgb*0.7; col+=b*(bloom+intro*2.);
    col*=expo*(1.+intro*1.4); col=mix(col,vec3(1.),clamp(intro*0.55+flash,0.,1.));
    float l=dot(col,vec3(0.2126,0.7152,0.0722)); col=mix(vec3(l),col,sat);
    col=(col-0.5)*1.06+0.5; col=col/(1.+max(col-0.82,0.)*0.9);                         // soft highlight shoulder, keeps mid-tones untouched
    col=pow(clamp(col,0.,1.),vec3(1./2.2));
    vec4 o=texture2D(tO,vUv); col=mix(col,o.rgb/max(o.a,1e-4),o.a*(1.-intro));
    gl_FragColor=vec4(col,1.); }`,
});
function pass(material, target) { quad.material = material; renderer.setRenderTarget(target); renderer.render(qScene, qCam); }

// ── words, timings, shots
export const SHOTS = [], WORDS = [];   // WORDS: {raw, cap, s, e, shot}
export const cap = w => w.toLowerCase().replace(/[^a-z0-9'’\-$%]/g, '').replace('’', "'");
export function shot(def) { def.i = SHOTS.length; def.w0 = WORDS.length; for (const raw of def.line.trim().split(/\s+/)) { const c = cap(raw); if (c) WORDS.push({ raw, cap: c, shot: def.i }); } def.w1 = WORDS.length; SHOTS.push(def); return def; }
export const fullScript = () => SHOTS.map(s => s.line.trim()).join(' ');
export let DURATION = 0;
const WPS = 3.5, TAIL = 0.3;   // reference pace 3.5 words per second, hard stop right after the last word
export function finalize(timings) {
  if (timings && timings.length === WORDS.length) WORDS.forEach((w, i) => { w.s = timings[i][0]; w.e = timings[i][1]; });
  else { // estimate before a voiceover exists: duration by letters, sentence ends get a short breath
    if (timings) console.warn(`timings.json has ${timings.length} words, story has ${WORDS.length}: using estimates`);
    let t = 0.05; const tot = WORDS.reduce((a, w) => a + w.cap.length + 2.2, 0), per = WORDS.length / WPS / tot;
    for (const w of WORDS) { w.s = t; t += (w.cap.length + 2.2) * per; w.e = t; }
  }
  SHOTS.forEach((s, i) => { s.s = i ? WORDS[s.w0].s : 0; }); SHOTS.forEach((s, i) => { s.e = i + 1 < SHOTS.length ? SHOTS[i + 1].s : WORDS[WORDS.length - 1].e + TAIL; s.d = s.e - s.s; });
  // sound cues: shot.sfx = [['sparkle', 'grew'], ['whoosh', 0], ['pop', 'idea', 0.8]]  (name, word of the line or local seconds, gain)
  window.SFXLIST = []; for (const s of SHOTS) for (const [name, at, gain] of s.sfx || []) { let lt = at; if (typeof at === 'string') { lt = 0; for (let i = s.w0; i < s.w1; i++) if (WORDS[i].cap === cap(at)) { lt = WORDS[i].s - s.s; break; } } window.SFXLIST.push([+(s.s + lt).toFixed(3), name, gain || 1]); }
  DURATION = SHOTS[SHOTS.length - 1].e; window.DURATION = DURATION; window.FRAMES = Math.ceil(DURATION * FPS);
}
function drawCaption(t) {
  og.clearRect(0, 0, W, H); let w = null; for (const x of WORDS) { if (x.s <= t + 1e-6) w = x; else break; }
  if (!w || Q.get('nocap')) return;
  og.font = '700 98px Montserrat'; og.textAlign = 'center'; og.textBaseline = 'alphabetic'; og.lineJoin = 'round';
  const x = W / 2, y = H * 0.623 + 28;                       // caption centre sits 62.3% down the frame, every frame
  og.shadowColor = 'rgba(0,0,0,0.55)'; og.shadowBlur = 14; og.shadowOffsetY = 5; og.strokeStyle = '#000'; og.lineWidth = 15; og.strokeText(w.cap, x, y);
  og.shadowColor = 'transparent'; og.fillStyle = '#fff'; og.fillText(w.cap, x, y);
}

// ── camera. cam = {pos, look, fov, roll, push, to:{pos,look,fov,roll}, ease, focus, blur}
const v3 = a => new THREE.Vector3(a[0], a[1], a[2]), tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();
function setCamera(s, lt) {
  const c = typeof s.cam === 'function' ? s.cam(lt, s) : s.cam, k = clamp(lt / s.d);
  tmpP.copy(v3(c.pos)); tmpL.copy(v3(c.look)); let fov = c.fov || 60, roll = c.roll || 0;
  if (c.to) { const e = (E[c.ease] || E.inOut)(remap(lt, c.t0 || 0, c.t1 || s.d)); if (c.to.pos) tmpP.lerp(v3(c.to.pos), e); if (c.to.look) tmpL.lerp(v3(c.to.look), e); if (c.to.fov) fov = lerp(fov, c.to.fov, e); if (c.to.roll !== undefined) roll = lerp(roll, c.to.roll, e); }
  const push = c.push === undefined ? 0.035 : c.push;         // constant slow push-in: the picture grows about 4-5% per second
  tmpP.lerp(tmpL, clamp(push * lt, -0.6, 0.6));
  camera.position.copy(tmpP); camera.fov = fov; camera.up.set(0, 1, 0); camera.lookAt(tmpL); camera.rotateZ(roll * Math.PI / 180); camera.updateProjectionMatrix();
  const u = finalM.uniforms; u.focus.value = c.focus ? (Array.isArray(c.focus) ? camera.position.distanceTo(v3(c.focus)) : c.focus) : camera.position.distanceTo(tmpL);
  u.ap.value = (c.blur === undefined ? 0.5 : c.blur) * 22 * SCALE; u.near.value = camera.near; u.far.value = camera.far;
  return tmpL;
}
// frame(x, z, opts): camera aimed at an avatar standing at x,z. size: 'face' | 'close' | 'medium' | 'full' | 'wide'.
// h = avatar height scale, y = feet height (floating), side = orbit angle in degrees (+ = camera to screen right),
// low = how far below the aim point the camera sits (0.12 = the style's slight low angle, 0.5 = hero shot from the floor).
// The aim point is the collar or chest, never the face: the head lands in the upper 40% and the caption sits on the chest.
export function frame(x, z, o = {}) {
  const { size = 'medium', h = 1, y = 0, side = 0, low = 0.12, fov = 60, facing = 0 } = o;
  const [D, ly, blur] = { face: [3.4, 4.5, 0.9], close: [4.6, 4.2, 0.8], medium: [6.2, 3.9, 0.5], full: [10, 2.9, 0.25], wide: [17, 3.6, 0.1] }[size];
  const a = (side * Math.PI) / 180 + facing, d = D * h * (o.dist || 1);
  return { pos: [x + Math.sin(a) * d, y + (ly - low * D) * h, z + Math.cos(a) * d], look: [x, y + ly * h, z], fov, blur: o.blur === undefined ? blur : o.blur, push: o.push, roll: o.roll, to: o.to, ease: o.ease };
}
let activeSet = null;
export function renderAt(t) {
  t = clamp(t, 0, DURATION - 1e-4); let s = SHOTS[0]; for (const x of SHOTS) if (x.s <= t + 1e-6) s = x;
  const lt = t - s.s;
  if (activeSet !== s.set) { if (activeSet) scene.remove(activeSet.group); scene.add(s.set.group); activeSet = s.set; }
  const look = setCamera(s, lt), L = applyLight(s.light || s.set.light, look);
  const ctx = { t, lt, d: s.d, k: lt / s.d, shot: s, camera,
    // local time at which a word of this shot's line starts: w('grew') or w(3). Second arg picks the nth match.
    w(key, nth = 0) { for (let i = s.w0; i < s.w1; i++) { if (typeof key === 'number' ? i - s.w0 === key : WORDS[i].cap === cap(key) && nth-- === 0) return WORDS[i].s - s.s; } console.warn('word not in line:', key, s.line); return 0; } };
  for (const f of PRE) f(); if (s.set.reset) s.set.reset(); if (s.act) s.act(lt, ctx); if (s.set.update) s.set.update(t, ctx);
  drawCaption(t); oTex.needsUpdate = true;
  const u = finalM.uniforms; u.expo.value = L.exposure; u.intro.value = s.i === 0 ? Math.pow(1 - remap(t, 0, 6.5 / FPS), 1.6) : 0; u.flash.value = s.flash ? s.flash(lt) : 0;
  renderer.setRenderTarget(mainRT); renderer.render(scene, camera);
  brightM.uniforms.t.value = mainRT.texture; pass(brightM, bA);
  const bl = (src, dst, x, y) => { blurM.uniforms.t.value = src.texture; blurM.uniforms.d.value.set(x / dst.width, y / dst.height); pass(blurM, dst); };
  bl(bA, bB, 1, 0); bl(bB, bA, 0, 1); bl(bA, bB, 1.6, 0); bl(bB, bC, 0, 1.6); bl(bC, bD, 1, 0); bl(bD, bC, 0, 1); bl(bC, bD, 2, 2);
  pass(finalM, null);
}
window.renderAt = renderAt;

// start(build): waits for the fonts (signs and captions are drawn on canvases), runs build() which creates
// sets, avatars and shots, then loads timings.json (word timings from the voiceover) if it exists.
export async function start(build, timingsUrl = 'timings.json') {
  await document.fonts.load('700 98px Montserrat'); for (const w of [500, 800, 900]) await document.fonts.load(w + ' 60px Montserrat'); await document.fonts.ready;
  await build();
  let timings = null; try { const r = await fetch(timingsUrl, { cache: 'no-store' }); if (r.ok) timings = await r.json(); } catch (e) { }
  finalize(timings);
  window.SCRIPT = fullScript(); window.WORDLIST = WORDS.map(w => w.cap); window.SHOTLIST = SHOTS.map(s => ({ i: s.i, s: +s.s.toFixed(3), e: +s.e.toFixed(3), line: s.line }));
  if (Q.has('t')) renderAt(parseFloat(Q.get('t')));
  else if (Q.has('play')) { const a = new Audio('audio/final_audio.wav'); let t0 = null; a.play().catch(() => { }); const loop = now => { if (t0 === null) t0 = now; const t = a.currentTime > 0 ? a.currentTime : (now - t0) / 1000; renderAt(t % DURATION); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  else renderAt(0);
  window.READY = true;
}
