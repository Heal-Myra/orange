"""Sounds for the guided breathing sessions (founder, 18 Nov 2026: "voice, instructions, pacing and feel" rebuilt).
Made in code so there is nothing to license:
  tanpura.m4a  a 64-second seamless tanpura drone (Pa-Sa-Sa-Sa, C# tonic), the quiet bed under every session
  tick.m4a     a soft wooden tick that keeps the pace for Bhastrika and Kapalbhati
  chime.m4a    a small, gentle bell for each nostril switch and the end of a round
Run: python3 scripts/make-breath-sounds.py"""
import subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = 'assets/sounds'

def save(name, x):
    x = np.clip(x, -1, 1)
    wavfile.write('/tmp/_s.wav', SR, (x * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/_s.wav', '-c:a', 'aac', '-b:a', '96k', f'{OUT}/{name}.m4a'], check=True)

def norm(x, peak): return x / (np.max(np.abs(x)) + 1e-9) * peak

# ---- Tanpura: four strings plucked in turn (Pa, Sa', Sa', Sa), each a bright, buzzing (jawari) tone that rings long.
LEN = 64; N = SR * LEN
t = np.arange(N) / SR
SA = 138.59  # C#3
strings = [SA * 1.5 / 2, SA, SA, SA / 2]  # Pa (low), Sa, Sa, Sa (low)
drone = np.zeros(N + SR * 8)
cycle = 4.0  # seconds for one round of four plucks
for k in range(int(LEN / cycle)):
    for j, f in enumerate(strings):
        at = k * cycle + j * (cycle / 4) + (0.04 * np.sin(k + j))  # a human, slightly uneven hand
        s = int(at * SR); dur = 7.5; tt = np.arange(int(dur * SR)) / SR
        tone = np.zeros_like(tt)
        for h in range(1, 18):  # rich harmonics; the jawari makes the upper ones bloom and sway
            sway = 1 + 0.35 * np.sin(2 * np.pi * (0.25 + h * 0.07) * tt + h)
            tone += (1 / h ** 0.9) * sway * np.sin(2 * np.pi * f * h * tt + h * 0.3) * np.exp(-tt / (2.6 + 0.8 / h))
        att = int(0.01 * SR); tone[:att] *= np.linspace(0, 1, att)
        drone[s:s + len(tt)] += tone * (0.8 if j == 0 else 1.0)
# wrap the ringing tail round to the start: a seamless loop
loop = drone[:N].copy(); loop[: len(drone) - N] += drone[N:]
loop = sosfilt(butter(2, 3500, 'low', fs=SR, output='sos'), loop)
save('tanpura', norm(loop, 0.5))

# ---- Tick: a short, soft wood knock.
tt = np.arange(int(0.12 * SR)) / SR
tick = (np.sin(2 * np.pi * 820 * tt) * 0.7 + np.sin(2 * np.pi * 1650 * tt) * 0.3) * np.exp(-tt / 0.018)
tick += 0.15 * np.random.default_rng(3).standard_normal(len(tt)) * np.exp(-tt / 0.004)
tick = sosfilt(butter(2, [300, 4000], 'band', fs=SR, output='sos'), tick)
save('tick', norm(tick, 0.55))

# ---- Chime: a small bell, gentle attack, long soft ring.
tt = np.arange(int(3.0 * SR)) / SR
chime = np.zeros_like(tt)
for ratio, gain, decay in [(1, 1, 1.4), (2.76, 0.45, 0.8), (5.4, 0.2, 0.4), (8.9, 0.08, 0.25)]:
    chime += gain * np.sin(2 * np.pi * 880 * ratio * tt) * np.exp(-tt / decay)
att = int(0.006 * SR); chime[:att] *= np.linspace(0, 1, att)
save('chime', norm(chime, 0.45))
print('made tanpura, tick, chime')
