"""Sound bath sounds for Happy Orange (founder, 13 Nov 2026), made in code so there is nothing to license.
Each is a 64-second seamless loop, mono, 44.1 kHz, saved as AAC (.m4a). Run: python3 scripts/make-sounds.py"""
import subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR, LEN = 44100, 64
N = SR * LEN
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def loop_safe(x, fade=3.0):
    """Make the end flow into the start: overlap the last `fade` s onto the first."""
    f = int(fade * SR)
    head, tail = x[:f].copy(), x[-f:].copy()
    w = np.linspace(0, 1, f)
    x = x[:-f].copy()
    x[:f] = head * w + tail * (1 - w)
    return x

def strike(freq, partials, at, dur, amp, n):
    """A struck metal note: inharmonic partials, each with its own decay and a slow beat."""
    out = np.zeros(n)
    s = int(at * SR); e = min(n, s + int(dur * SR))
    tt = np.arange(e - s) / SR
    for ratio, gain, decay in partials:
        beat = 1 + 0.12 * np.sin(2 * np.pi * (0.4 + ratio * 0.15) * tt)
        out[s:e] += amp * gain * np.sin(2 * np.pi * freq * ratio * tt) * np.exp(-tt / decay) * beat
    att = int(0.004 * SR)
    out[s:s + att] *= np.linspace(0, 1, att)
    return out

def wrap(x, n):
    """Strikes that run past the end wrap round to the start, so the loop is seamless."""
    y = x[:n].copy(); y[: len(x) - n] += x[n:]; return y

def norm(x, peak=0.6): return x / (np.max(np.abs(x)) + 1e-9) * peak

def noise(kind='pink', n=N):
    w = rng.standard_normal(n)
    if kind == 'white': return w
    spec = np.fft.rfft(w); f = np.fft.rfftfreq(n, 1 / SR); f[0] = f[1]
    spec /= np.sqrt(f) if kind == 'pink' else f
    return np.fft.irfft(spec, n)

def lp(x, hz): return sosfilt(butter(4, hz, 'low', fs=SR, output='sos'), x)
def hp(x, hz): return sosfilt(butter(2, hz, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

def bowls():
    BOWL = [(1, 1.0, 9), (2.76, 0.45, 6), (5.40, 0.22, 4), (8.93, 0.1, 2.5)]
    x = np.zeros(N + SR * 20)
    for at, f, a in [(0, 196, 1), (9, 261.6, .8), (18, 174.6, .9), (28, 220, .8), (37, 196, .9), (47, 293.7, .6), (55, 174.6, .8)]:
        x += strike(f, BOWL, at, 20, a, len(x))
    return norm(wrap(x, N))

def bells():
    BELL = [(0.5, 0.5, 6), (1, 1.0, 4), (1.19, 0.6, 3.5), (1.5, 0.4, 3), (2.0, 0.5, 2.5), (2.51, 0.25, 1.8), (3.0, 0.2, 1.4)]
    x = np.zeros(N + SR * 14)
    for at in [0, 15, 31, 47]:
        x += strike(523.3, BELL, at, 14, 1, len(x))
        x += strike(659.3, BELL, at + 7.5, 12, 0.35, len(x))
    return norm(wrap(x, N), 0.55)

def rain():
    bed = lp(hp(noise('pink'), 300), 6000) * 0.5
    drops = np.zeros(N)
    for i in rng.integers(0, N - 2000, 9000):
        f = rng.uniform(1800, 5200); L = 900
        tt = np.arange(L) / SR
        drops[i:i + L] += rng.uniform(0.2, 1) * np.sin(2 * np.pi * f * tt) * np.exp(-tt * rng.uniform(60, 140))
    tin = bp(drops, 1500, 7000)
    return norm(loop_safe(bed / np.std(bed) * 0.3 + tin / np.std(tin) * 0.5), 0.5)

def fan():
    air = lp(noise('brown'), 900)
    air /= np.std(air)
    blades = 1 + 0.08 * np.sin(2 * np.pi * 3.75 * t)  # 3.75 Hz: a fan at ~75 rpm × 3 blades, felt more than heard
    hum = 0.04 * np.sin(2 * np.pi * 100 * t) + 0.02 * np.sin(2 * np.pi * 200 * t)
    return norm(loop_safe(air * blades * 0.6 + hum), 0.45)

def sea():
    body = lp(noise('brown'), 1400); body /= np.std(body)
    hiss = lp(hp(noise('pink'), 800), 5000); hiss /= np.std(hiss)
    wave = 0.5 - 0.5 * np.cos(2 * np.pi * t / 8.0)   # a wave every 8 s (64 s = 8 waves: loops cleanly)
    wave = wave ** 2
    return norm(body * (0.35 + 0.65 * wave) + hiss * 0.5 * wave ** 3, 0.5)

def om():
    f0 = 136.1  # the "Om" tone of the Earth year, as used in Indian sound practice
    x = np.zeros(N)
    for k, g in [(1, 1), (2, .5), (3, .3), (4, .15), (5, .08)]:
        for det in (-0.25, 0.25):  # two voices, slightly apart, for a soft chorus
            x += g * np.sin(2 * np.pi * (f0 * k + det) * t + rng.uniform(0, 6.28))
    breath = 0.75 + 0.25 * np.sin(2 * np.pi * t / 16)  # a slow breath, 4 per loop
    return norm(lp(x * breath, 2500), 0.5)

for name, fn in [('bowls', bowls), ('bells', bells), ('rain', rain), ('fan', fan), ('sea', sea), ('om', om)]:
    x = fn()
    wav = f'/tmp/{name}.wav'
    wavfile.write(wav, SR, (x * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '64k', f'assets/sounds/{name}.m4a'], check=True)
    print(name, 'ok')
