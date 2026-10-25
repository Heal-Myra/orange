// Myra's natural voice (founder, 25 Oct 2026). Sentences are made once on our server with Google's calm woman's voice and
// kept in our own storage (supabase/functions/voice); the phone plays those files with expo-audio (build 11 onward).
// Without that build, offline, or for a language Google cannot speak yet, the phone's own voice is used (src/lib/voice.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { optional } from './native';
import { supabase } from './supabase';

const Audio = optional(['ExpoAudio'], () => require('expo-audio') as typeof import('expo-audio'));

/** Languages with a natural server voice (Odia and Assamese not yet). */
export const SERVER_LANGS = ['en', 'hi', 'mr', 'bn', 'gu', 'pa', 'ta', 'te', 'kn', 'ml', 'ur'];
export const serverVoiceFor = (code: string) => !!Audio && SERVER_LANGS.includes(code);

/** Sentences, the way they are spoken (one file each, with a short pause between). */
export const sentences = (text: string) => (text.match(/[^.!?।…]+[.!?।…]*/g) ?? [text]).map(x => x.trim()).filter(Boolean);

const urls: Record<string, Record<string, string>> = {};
const storeKey = (code: string) => `heal.voiceurl.${code}`;
async function load(code: string) {
  if (!urls[code]) {
    try { urls[code] = JSON.parse((await AsyncStorage.getItem(storeKey(code))) ?? '{}'); } catch { urls[code] = {}; }
  }
  return urls[code];
}

/** The saved file for a sentence, if made. */
export const urlFor = (code: string, sentence: string): string | undefined => urls[code]?.[sentence];

/** Make sure every sentence of these lines has its file (made on the server once, then remembered on the phone). */
export async function prepareVoice(code: string, lines: string[]): Promise<boolean> {
  if (!serverVoiceFor(code) || !supabase) return false;
  const map = await load(code);
  const missing = Array.from(new Set(lines.flatMap(sentences))).filter(s => !map[s]);
  if (!missing.length) return true;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return false;
  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    const { data, error } = await supabase.functions.invoke('voice', { body: { lang: code, lines: chunk } });
    if (error || !Array.isArray(data?.urls)) return false;
    chunk.forEach((s, k) => { if (data.urls[k]) map[s] = data.urls[k]; });
  }
  AsyncStorage.setItem(storeKey(code), JSON.stringify(map)).catch(() => {});
  return missing.every(s => map[s]);
}

/** Prepare the voice for a session's lines; `preparing` is true until done (or given up after 25 seconds). */
export function useServerVoice(code: string, lines: string[], ready = true): { preparing: boolean } {
  const [preparing, setPreparing] = useState(serverVoiceFor(code));
  const sig = lines.join('|');
  useEffect(() => {
    if (!ready || !serverVoiceFor(code)) { setPreparing(!ready && serverVoiceFor(code)); return; }
    let live = true;
    setPreparing(true);
    const giveUp = setTimeout(() => live && setPreparing(false), 25_000);
    prepareVoice(code, lines).catch(() => false).finally(() => { clearTimeout(giveUp); if (live) setPreparing(false); });
    return () => { live = false; clearTimeout(giveUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, sig, ready]);
  return { preparing };
}

let modeSet = false;
/** Play one file; calls done when it ends (or fails). Returns a stop function. */
export function playUrl(url: string, done: () => void): () => void {
  if (!Audio) { setTimeout(done, 0); return () => {}; }
  if (!modeSet) { modeSet = true; Audio.setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {}); }
  let over = false;
  const player = Audio.createAudioPlayer(url);
  const end = () => {
    if (over) return; over = true; clearTimeout(guard);
    try { sub.remove(); } catch { /* fine */ }
    try { player.remove(); } catch { /* fine */ }
  };
  const sub = player.addListener('playbackStatusUpdate', s => { if (s.didJustFinish) { end(); done(); } });
  const guard = setTimeout(() => { end(); done(); }, 40_000); // never get stuck on a file that does not load
  try { player.play(); } catch { end(); setTimeout(done, 0); }
  return () => { try { player.pause(); } catch { /* fine */ } end(); };
}
