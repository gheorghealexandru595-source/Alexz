# python3 tools/voice.py vo_raw.(wav|mp3) script.txt [target_wps=3.5]
#   -> audio/vo.wav (48 kHz mono, pauses tightened, sped up to the reference pace) + timings.json ([[start,end],...] per caption word)
# Word timing = forced alignment of the known script with pocketsphinx (pip install pocketsphinx; model is bundled, works offline).
# Measured on the reference short: median error 0.03 s. Fallback when pocketsphinx is missing: pause detection + spread by syllables.
import sys, re, json, wave, subprocess, os, difflib
import numpy as np
src, script = sys.argv[1:3]; target = float(sys.argv[3]) if len(sys.argv) > 3 else 3.5
os.makedirs('audio', exist_ok=True)
norm = lambda w: re.sub(r"[^a-z0-9'\-$%]", '', w.lower().replace('’', "'"))
raw = open(script).read().split(); toks = [(w, norm(w)) for w in raw if norm(w)]; N = len(toks)
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
def num(n):
    if n < 20: return [ONES[n]]
    if n < 100: return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000: return [ONES[n // 100], 'hundred'] + (num(n % 100) if n % 100 else [])
    if n < 10**6: return num(n // 1000) + ['thousand'] + (num(n % 1000) if n % 1000 else [])
    return num(n // 10**6) + ['million'] + (num(n % 10**6) if n % 10**6 else [])
def spoken(tok):  # caption token -> list of plain words the aligner knows
    out = []
    for part in re.split(r'-', tok):
        m = re.fullmatch(r"(\$?)(\d+)(%?)(st|nd|rd|th|s)?", part)
        if m: out += num(int(m.group(2))) + (['dollars'] if m.group(1) else []) + (['percent'] if m.group(3) else [])
        elif part: out.append(part)
    return [re.sub(r"[^a-z']", '', p) for p in out if re.sub(r"[^a-z']", '', p)]
def syl(w): return max(1, len(re.findall(r'[aeiouy]+', re.sub(r'e$', '', w) if len(w) > 3 else w)))
WT = np.array([sum(syl(p) + 0.12 * len(p) for p in spoken(t[1])) + 0.3 for t in toks])

run = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
run('-i', src, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse', '-ar', '48000', '-ac', '1', 'audio/_trim.wav')
run('-i', 'audio/_trim.wav', '-ar', '16000', '-ac', '1', 'audio/_16k.wav')
f = wave.open('audio/_trim.wav'); sr = f.getframerate(); a = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768; dur = len(a) / sr

def forced():
    from pocketsphinx import Decoder
    d = Decoder(samprate=16000, loglevel='FATAL', beam=1e-300, wbeam=1e-200, pbeam=1e-300, maxhmmpf=-1, maxwpf=-1)
    L = dict(a='AE', b='B', c='K', d='D', e='EH', f='F', g='G', h='HH', i='IH', j='JH', k='K', l='L', m='M', n='N', o='OW', p='P', q='K', r='R', s='S', t='T', u='AH', v='V', w='W', x='K S', y='Y', z='Z')
    DG = dict(sh='SH', ch='CH', th='TH', ph='F', ck='K', ng='NG', ee='IY', oo='UW', ou='AW', ow='OW', ai='EY', ay='EY', ea='IY', oa='OW', oi='OY', oy='OY', qu='K W')
    def g2p(w):  # crude letter-to-sound for names and made-up words; good enough to anchor an alignment
        w = re.sub(r'[^a-z]', '', w); o = []; i = 0
        while i < len(w):
            if w[i:i + 2] in DG: o.append(DG[w[i:i + 2]]); i += 2
            else:
                if not (w[i] == 'e' and i == len(w) - 1 and len(w) > 3): o.append(L[w[i]])
                i += 1
        return ' '.join(o) or 'AH'
    seq = []  # (token index, word)
    for i, (_, t) in enumerate(toks):
        for p in spoken(t):
            if d.lookup_word(p) is None:
                q = re.sub(r"[^a-z]", '', p)
                if q and d.lookup_word(q) is None: d.add_word(q, g2p(q), True)
                p = q
            if p: seq.append((i, p))
    pcm = wave.open('audio/_16k.wav'); data = pcm.readframes(pcm.getnframes())
    d.set_align_text(' '.join(p for _, p in seq)); d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
    segs = [(re.sub(r'\(\d+\)$', '', s.word), s.start_frame / 100, s.end_frame / 100) for s in (d.seg() or []) if not s.word.startswith('<') and s.word != '(NULL)']
    if len(segs) < 0.8 * len(seq): raise RuntimeError(f'aligner returned {len(segs)} of {len(seq)} words')
    T = [None] * N; sm = difflib.SequenceMatcher(None, [p for _, p in seq], [s[0] for s in segs], autojunk=False)
    for i, j, n in sm.get_matching_blocks():
        for k in range(n):
            ti = seq[i + k][0]; s, e = segs[j + k][1], segs[j + k][2]
            T[ti] = [s, e] if T[ti] is None else [T[ti][0], e]
    return T

def pauses():
    hop = int(sr * 0.01); env = np.sqrt(np.convolve(a * a, np.ones(hop * 2) / (hop * 2), 'same'))[::hop]; db = 20 * np.log10(env + 1e-7)
    sp = db > np.percentile(db, 95) - 30; iv = []; s = None
    for i, v in enumerate(np.append(sp, False)):
        if v and s is None: s = i
        if not v and s is not None: iv.append([s * 0.01, i * 0.01]); s = None
    mg = []
    for x in iv:
        if mg and x[0] - mg[-1][1] < 0.11: mg[-1][1] = x[1]
        else: mg.append(x)
    mg = [x for x in mg if x[1] - x[0] > 0.06]; ph = []; cur = []
    for i, (r, n) in enumerate(toks):
        cur.append(i)
        if re.search(r'[.,!?;:—]["\')]*$', r) or i == N - 1: ph.append(cur); cur = []
    P, M = len(ph), len(mg)
    while M > P: g = int(np.argmin([mg[i + 1][0] - mg[i][1] for i in range(M - 1)])); mg[g][1] = mg[g + 1][1]; del mg[g + 1]; M -= 1
    pw = np.array([WT[p].sum() for p in ph]); rate = sum(x[1] - x[0] for x in mg) / pw.sum(); cum = np.concatenate([[0], np.cumsum(pw)])
    D = np.full((M + 1, P + 1), 1e18); B = np.zeros((M + 1, P + 1), int); D[0, 0] = 0
    for m in range(1, M + 1):
        Ln = mg[m - 1][1] - mg[m - 1][0]
        for p in range(m, P - (M - m) + 1):
            for q in range(m - 1, p):
                c = D[m - 1, q] + abs((cum[p] - cum[q]) * rate - Ln)
                if c < D[m, p]: D[m, p] = c; B[m, p] = q
    T = [None] * N; p = P
    for m in range(M, 0, -1):
        q = B[m, p]; idx = [i for g in ph[q:p] for i in g]; s, e = mg[m - 1]; ww = WT[idx]; t = s
        for i, w in zip(idx, ww): dd = (e - s) * w / ww.sum(); T[i] = [t, t + dd]; t += dd
        p = q
    print(f'WARNING pause fallback: {M} spoken chunks for {P} phrases. Captions may drift by 0.1-0.3 s; pip install pocketsphinx for frame-accurate timing.')
    return T

method = 'forced'
try: T = forced()
except Exception as ex: print('forced alignment unavailable:', repr(ex)[:160]); method = 'pauses'; T = pauses()
i = 0
while i < N:  # fill the few words the aligner skipped
    if T[i]: i += 1; continue
    j = i
    while j < N and not T[j]: j += 1
    s = T[i - 1][1] if i else 0.0; e = T[j][0] if j < N else dur; ww = WT[i:j]; t = s
    for k in range(i, j): dd = (e - s) * WT[k] / ww.sum(); T[k] = [t, t + dd]; t += dd
    i = j
# tighten: the reference has no pause longer than ~0.08 s. Find truly silent stretches by energy, cut each down to MAXGAP, remap times.
MAXGAP = 0.08; hop = int(sr * 0.01); env = np.sqrt(np.convolve(a * a, np.ones(hop * 2) / (hop * 2), 'same'))[::hop]; db = 20 * np.log10(env + 1e-7)
quiet = np.append(db < np.percentile(db, 95) - 38, False); cuts = []; s0 = None
for i, v in enumerate(quiet):
    if v and s0 is None: s0 = i
    if not v and s0 is not None:
        qs, qe = s0 * 0.01, i * 0.01; s0 = None
        if qe - qs > MAXGAP + 0.04 and qs > 0.05 and qe < dur - 0.05: cuts.append((qs + MAXGAP / 2, qe - MAXGAP / 2))
def remap(t):
    off = 0.0
    for c0, c1 in cuts:
        if t >= c1: off += c1 - c0
        elif t > c0: return c0 - off
    return t - off
T2 = [[remap(s), remap(e)] for s, e in T]; fade = int(sr * 0.004); parts = []; pos = 0.0
for c0, c1 in cuts + [(dur, dur)]:
    seg = a[int(pos * sr):int(c0 * sr)].copy()
    if len(seg) > 2 * fade: seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    parts.append(seg); pos = c1
tight = np.concatenate(parts); w = wave.open('audio/_tight.wav', 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(tight, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
d2 = len(tight) / sr; k = min(1.45, max(1.0, target / (N / d2)))
run('-i', 'audio/_tight.wav', '-af', f'atempo={k:.4f}', '-ar', '48000', '-ac', '1', 'audio/vo.wav')
T3 = [[round(s / k, 3), round(e / k, 3)] for s, e in T2]
for i in range(1, N): T3[i][0] = max(T3[i][0], round(T3[i - 1][0] + 0.034, 3))   # every word gets at least one frame
json.dump(T3, open('timings.json', 'w'))
for x in ('_trim', '_16k', '_tight'): os.remove(f'audio/{x}.wav')
print(json.dumps({'method': method, 'words': N, 'raw_seconds': round(dur, 2), 'pauses_removed_s': round(dur - d2, 2), 'tempo': round(k, 3), 'final_seconds': round(d2 / k, 2), 'final_wps': round(N / (d2 / k), 2)}))
