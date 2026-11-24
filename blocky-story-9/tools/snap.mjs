// node tools/snap.mjs 0.5 2.0 7.3 ...   -> snaps/t0.50.jpg ...   (env: OUT=dir SCALE=0.5 PORT=8123 QUERY=nocap=1)
// node tools/snap.mjs shots             -> one frame from the middle of every shot
// node tools/snap.mjs info              -> writes script.txt + sfx.json + shots.json and prints the shot table
import { chromium } from 'playwright'; import fs from 'fs';
const out = process.env.OUT || 'snaps', scale = process.env.SCALE || '0.5', port = process.env.PORT || 8123; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const p = await b.newPage({ viewport: { width: 540, height: 960 } });
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); }); p.on('pageerror', e => console.log('[pageerror]', e.message));
await p.goto(`http://localhost:${port}/index.html?scale=${scale}&${process.env.QUERY || ''}`); await p.waitForFunction('window.READY===true', null, { timeout: 120000 });
let args = process.argv.slice(2);
if (args[0] === 'info') { const i = await p.evaluate('({script:SCRIPT,words:WORDLIST,shots:SHOTLIST,duration:DURATION,sfx:SFXLIST})'); fs.writeFileSync('script.txt', i.script + '\n'); fs.writeFileSync('sfx.json', JSON.stringify(i.sfx)); fs.writeFileSync('shots.json', JSON.stringify(i.shots, null, 1));
  console.log(`${i.words.length} words, ${i.shots.length} shots, ${i.duration.toFixed(2)} s (${(i.words.length / i.duration).toFixed(2)} words/s), ${i.sfx.length} sound cues`); for (const s of i.shots) console.log(String(s.i).padStart(3), s.s.toFixed(2).padStart(6), (s.e - s.s).toFixed(2).padStart(5) + 's ', s.line); await b.close(); process.exit(0); }
if (args[0] === 'shots') args = (await p.evaluate('SHOTLIST')).map(s => ((s.s + s.e) / 2).toFixed(2));
for (const a of args) { const t = parseFloat(a); const url = await p.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }, t); fs.writeFileSync(`${out}/t${t.toFixed(2).padStart(6, '0')}.jpg`, Buffer.from(url.split(',')[1], 'base64')); }
console.log('wrote', args.length, 'frames to', out); await b.close();
