// Myra's voice for guides: the phone's own speech (expo-speech, from build 9) or the browser's speech on the website.
// If the phone or browser has no voice for the language, guides still play, silently, with the words on screen.
import { Platform } from 'react-native';
import { optional } from './native';

const Speech = optional(['ExpoSpeech'], () => require('expo-speech') as typeof import('expo-speech'));
const web = Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/** Whether a voice exists for this language (e.g. "ta-IN"). */
export async function hasVoice(bcp47: string): Promise<boolean> {
  const base = bcp47.slice(0, 2).toLowerCase();
  try {
    if (web) {
      let v = web.getVoices();
      if (!v.length) { await new Promise(r => setTimeout(r, 400)); v = web.getVoices(); }
      return v.some(x => x.lang.toLowerCase().replace('_', '-').startsWith(base));
    }
    if (Speech) return (await Speech.getAvailableVoicesAsync()).some(x => x.language.toLowerCase().replace('_', '-').startsWith(base));
  } catch { /* no voice */ }
  return false;
}

/** Speak, then call done. Returns a stop function. */
export function speak(text: string, bcp47: string, done: () => void): () => void {
  let stopped = false;
  const finish = () => { if (!stopped) { stopped = true; done(); } };
  if (web) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp47; u.rate = 0.95;
    const v = web.getVoices().find(x => x.lang.toLowerCase().replace('_', '-').startsWith(bcp47.slice(0, 2).toLowerCase()));
    if (v) u.voice = v;
    u.onend = finish; u.onerror = finish;
    web.cancel(); web.speak(u);
    return () => { stopped = true; web.cancel(); };
  }
  if (Speech) {
    Speech.speak(text, { language: bcp47, rate: 0.95, useApplicationAudioSession: false, onDone: finish, onError: finish, onStopped: () => {} });
    return () => { stopped = true; Speech.stop(); };
  }
  setTimeout(finish, 0);
  return () => { stopped = true; };
}
