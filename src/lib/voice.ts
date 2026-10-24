// Myra's voice for guided sessions (founder, 24 Oct 2026: "needs to be a female voice, and slower"): the phone's own
// speech (expo-speech, build 9 onward) or the browser's on the website. We choose a woman's voice for the language,
// preferring Enhanced/Premium quality, speak slowly, and leave a short pause between sentences.
// With no voice for the language the session still plays, silently, with the words on screen.
import { Platform } from 'react-native';
import { optional } from './native';

const Speech = optional(['ExpoSpeech'], () => require('expo-speech') as typeof import('expo-speech'));
const web = Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

// Women's voices commonly found on iPhones, Android phones and browsers (Indian voices first).
const FEMALE = ['isha', 'veena', 'lekha', 'kiyara', 'aditi', 'raveena', 'neerja', 'swara', 'heera', 'kalpana', 'priya', 'ananya',
  'samantha', 'karen', 'moira', 'tessa', 'serena', 'kate', 'ava', 'allison', 'susan', 'zoe', 'nicky', 'fiona', 'victoria', 'female',
  'google हिन्दी', 'google uk english female'];
const MALE = ['rishi', 'aaron', 'arthur', 'daniel', 'fred', 'gordon', 'oliver', 'rocko', 'alex', 'tom', 'evan', 'nathan', 'male', 'ravi', 'hemant'];

export const voiceLang = (code: string) => (code === 'hi' ? 'hi-IN' : code.includes('-') ? code : `${code}-IN`);

interface Picked { id?: string; webVoice?: SpeechSynthesisVoice }
const cache: Record<string, Picked | null> = {};

function score(name: string, quality?: string) {
  const n = name.toLowerCase();
  let s = 0;
  if (FEMALE.some(f => n.includes(f))) s += 10;
  if (MALE.some(m => n.includes(m))) s -= 20;
  if (/premium|enhanced|neural|natural/i.test(`${name} ${quality ?? ''}`)) s += 3;
  return s;
}

/** The best woman's voice for a language (e.g. "en-IN", "hi-IN"); falls back to any voice of that language. */
export async function pickVoice(bcp47: string): Promise<Picked | null> {
  if (bcp47 in cache) return cache[bcp47];
  const base = bcp47.slice(0, 2).toLowerCase();
  let best: Picked | null = null;
  try {
    if (web) {
      let v = web.getVoices();
      if (!v.length) { await new Promise(r => setTimeout(r, 400)); v = web.getVoices(); }
      const same = v.filter(x => x.lang.toLowerCase().replace('_', '-').startsWith(base));
      // Same country first (en-IN over en-US), then the most female, best quality.
      same.sort((a, b) => (score(b.name) + (b.lang.toLowerCase().endsWith(bcp47.slice(3).toLowerCase()) ? 2 : 0)) - (score(a.name) + (a.lang.toLowerCase().endsWith(bcp47.slice(3).toLowerCase()) ? 2 : 0)));
      best = same[0] ? { webVoice: same[0] } : null;
    } else if (Speech) {
      const v = (await Speech.getAvailableVoicesAsync()).filter(x => x.language.toLowerCase().replace('_', '-').startsWith(base));
      const region = bcp47.slice(3).toLowerCase();
      v.sort((a, b) => (score(`${b.name} ${b.identifier}`, String(b.quality)) + (b.language.toLowerCase().endsWith(region) ? 2 : 0))
        - (score(`${a.name} ${a.identifier}`, String(a.quality)) + (a.language.toLowerCase().endsWith(region) ? 2 : 0)));
      best = v[0] ? { id: v[0].identifier } : null;
    }
  } catch { best = null; }
  cache[bcp47] = best;
  return best;
}

/** Whether a voice exists for this language. */
export async function hasVoice(bcp47: string): Promise<boolean> { return (await pickVoice(bcp47)) != null; }

/** Rates: guide = slow and calm. iOS multiplies by its default speed, so 0.8 is about 20% slower than normal speech. */
const RATE = { guide: Platform.OS === 'ios' ? 0.78 : 0.82, normal: 0.95 };

/** Speak, sentence by sentence with a short pause between, then call done. Returns a stop function. */
export function speak(text: string, bcp47: string, done: () => void, opts: { pace?: 'guide' | 'normal'; pauseMs?: number } = {}): () => void {
  let stopped = false, timer: ReturnType<typeof setTimeout> | null = null;
  const parts = (text.match(/[^.!?।…]+[.!?।…]*/g) ?? [text]).map(x => x.trim()).filter(Boolean);
  const rate = RATE[opts.pace ?? 'guide'], pause = opts.pauseMs ?? 650;
  const finish = () => { if (!stopped) { stopped = true; done(); } };
  if (!web && !Speech) { setTimeout(finish, 0); return () => { stopped = true; }; }
  const say = (k: number, picked: Picked | null) => {
    if (stopped) return;
    if (k >= parts.length) { finish(); return; }
    const next = () => { if (stopped) return; timer = setTimeout(() => say(k + 1, picked), k + 1 < parts.length ? pause : 0); };
    if (web) {
      const u = new SpeechSynthesisUtterance(parts[k]);
      u.lang = bcp47; u.rate = rate; u.pitch = 1.05;
      if (picked?.webVoice) u.voice = picked.webVoice;
      u.onend = next; u.onerror = next;
      web.speak(u);
    } else if (Speech) {
      Speech.speak(parts[k], { language: bcp47, voice: picked?.id, rate, pitch: 1.05, useApplicationAudioSession: false, onDone: next, onError: next, onStopped: () => {} });
    }
  };
  web?.cancel();
  pickVoice(bcp47).then(p => say(0, p)).catch(() => say(0, null));
  return () => { stopped = true; if (timer) clearTimeout(timer); if (web) web.cancel(); else Speech?.stop(); };
}
