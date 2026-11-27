# python3 tools/audio.py        (reads audio/vo.wav, sfx.json, optional audio/music.(wav|mp3)) -> audio/final_audio.wav
# numpy only. Builds a quiet upbeat bed if no music file exists, places sound effects, ducks the bed under the voice,
# then masters to the reference loudness (-14 LUFS, true peak -1 dB).
import json, os, wave, subprocess, glob
import numpy as np
SR = 48000
def load(p):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ar', str(SR), '-ac', '1', 'audio/_t.wav'], check=True); p = 'audio/_t.wav'
    f = wave.open(p); return np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768
def save(p, x):
    w = wave.open(p, 'w'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x * x)) + 1e-9)
t_ = lambda d: np.arange(int(d * SR)) / SR
rs = np.random.RandomState(7)
def env(d, a=0.005, r=None): t = t_(d); r = r or d; return np.minimum(1, t / a) * np.exp(-t / (r / 4))
def tone(f, d, a=0.004, harm=(1, 0.3, 0.1)): t = t_(d); return sum(h * np.sin(2 * np.pi * f * (i + 1) * t) for i, h in enumerate(harm)) * env(d, a)
def noise(d): return rs.randn(int(d * SR))
def smooth(x, n): return np.convolve(x, np.ones(n) / n, 'same')
SFX = {
    'whoosh': lambda: smooth(noise(0.34), 60) * np.sin(np.pi * t_(0.34) / 0.34) ** 2 * 5.0,                       # big camera moves, entrances
    'pop': lambda: np.sin(2 * np.pi * (520 * t_(0.09) + 2600 * t_(0.09) ** 2)) * env(0.09, 0.002),                # things appearing, face snaps
    'sparkle': lambda: sum(np.pad(tone(f, 0.5, 0.002, (1, 0.2)), (int(i * 0.045 * SR), int((4 - i) * 0.045 * SR))) for i, f in enumerate([1568, 1976, 2349, 3136, 3951])) * 0.5,  # the rule firing
    'ding': lambda: tone(1760, 0.7, 0.002, (1, 0.4, 0.15)) * 0.7,                                                  # idea bulb
    'boing': lambda: np.sin(2 * np.pi * np.cumsum(180 + 240 * np.abs(np.sin(2 * np.pi * 7 * t_(0.38)))) / SR) * env(0.38, 0.004),
    'thud': lambda: np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t_(0.25) * 14) + 45) / SR) * env(0.25, 0.002) * 1.4,
    'sad': lambda: np.concatenate([tone(392, 0.28, 0.01, (1, 0.5)), tone(311, 0.5, 0.01, (1, 0.5))]) * 0.6,
    'rise': lambda: np.sin(2 * np.pi * np.cumsum(300 + 900 * (t_(0.5) / 0.5) ** 2) / SR) * np.sin(np.pi * t_(0.5) / 0.5) * 0.6,   # floating up, growing
    'fall': lambda: np.sin(2 * np.pi * np.cumsum(1100 - 800 * (t_(0.5) / 0.5)) / SR) * np.sin(np.pi * t_(0.5) / 0.5) * 0.6,
    'tick': lambda: tone(2400, 0.04, 0.001, (1,)) * 0.5,
}
def bed(d):  # 112 bpm, C major I-V-vi-IV, marimba plucks + soft bass + shaker. Deliberately simple and quiet.
    out = np.zeros(int(d * SR) + SR); beat = 60 / 112; chords = [[261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6]]
    def put(x, t, g=1.0):
        i = int(t * SR)
        if i < len(out): n = min(len(x), len(out) - i); out[i:i + n] += x[:n] * g
    b = 0
    while b * beat < d:
        ch = chords[(b // 4) % 4]; step = b % 4
        put(tone(ch[0] / 2, 0.4, 0.004, (1, 0.5, 0.2)), b * beat, 0.5)
        put(tone(ch[[0, 2, 1, 2][step]] * 2, 0.3, 0.002, (1, 0.25)), b * beat, 0.35); put(tone(ch[[1, 0, 2, 1][step]] * 2, 0.25, 0.002, (1, 0.25)), (b + 0.5) * beat, 0.28)
        for k in (0, 0.5): put(smooth(noise(0.05), 3) * env(0.05, 0.002), (b + k) * beat, 0.05)
        b += 1
    return out[:int(d * SR)]
vo = load('audio/vo.wav'); n = len(vo) + int(0.35 * SR); pad = lambda x: np.pad(x, (0, max(0, n - len(x))))[:n]; vo = pad(vo)
mfile = next((f for f in sorted(glob.glob('audio/music.*'))), None)
music = pad(np.tile(load(mfile), 1 + n // max(1, len(load(mfile))))) if mfile else bed(n / SR)
sfx = np.zeros(n)
for t, name, gain in (json.load(open('sfx.json')) if os.path.exists('sfx.json') else []):
    if name in SFX: x = SFX[name](); i = int(max(0, t) * SR); m = min(len(x), n - i); sfx[i:i + m] += x[:max(m, 0)] * gain
# duck the bed under the voice, then set levels relative to the voice: bed about 22 dB under, effects about 9 dB under
e = smooth(np.abs(vo), int(0.12 * SR)); duck = 1 - 0.45 * np.clip(e / (e.max() * 0.25 + 1e-9), 0, 1)
vr = rms(vo[np.abs(vo) > 0.01]); music *= 10 ** ((vr - 22 - rms(music)) / 20); music *= duck
if np.abs(sfx).max() > 0: sfx *= 10 ** ((vr - 9 - rms(sfx[np.abs(sfx) > 1e-4])) / 20)
mix = vo + music + sfx; fade = int(0.05 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
save('audio/mix.wav', mix * 0.8)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'audio/mix.wav', '-af', 'acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1:LRA=5', '-ar', '48000', '-ac', '2', 'audio/final_audio.wav'], check=True)
print(json.dumps({'seconds': round(n / SR, 2), 'voice_rms_db': round(float(vr), 1), 'bed_rms_db': round(float(rms(music)), 1), 'sfx_events': int(len(json.load(open('sfx.json')))) if os.path.exists('sfx.json') else 0, 'music': mfile or 'synth bed'}))
if os.path.exists('audio/_t.wav'): os.remove('audio/_t.wav')
