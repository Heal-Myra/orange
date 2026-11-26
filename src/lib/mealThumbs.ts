// Small meal photos for the day line in "Food and your body" (founder, 26 Nov 2026). Kept on this phone only, never
// sent anywhere: about 4 KB each, the newest 300.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { shrink } from './photo';

const KEY = 'heal.mealthumbs.v1';
type Thumbs = Record<string, string>; // meal time (ISO) → data URI
let cache: Thumbs | null = null;
const listeners = new Set<(t: Thumbs) => void>();

async function load(): Promise<Thumbs> {
  if (cache) return cache;
  try { cache = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}') as Thumbs; } catch { cache = {}; }
  return cache;
}

/** Keep a tiny copy of a meal photo under the meal's time. Never throws. */
export async function saveMealThumb(at: string, uri: string): Promise<void> {
  try {
    const img = await shrink(uri, null, null, 120);
    const t = { ...(await load()), [at]: `data:${img.type};base64,${img.data}` };
    const keys = Object.keys(t).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 300))) delete t[k];
    cache = t;
    listeners.forEach(f => f(t));
    await AsyncStorage.setItem(KEY, JSON.stringify(t));
  } catch { /* the line shows a plate icon instead */ }
}

export function useMealThumbs(): Thumbs {
  const [t, setT] = useState<Thumbs>(cache ?? {});
  useEffect(() => { load().then(setT); listeners.add(setT); return () => { listeners.delete(setT); }; }, []);
  return t;
}
