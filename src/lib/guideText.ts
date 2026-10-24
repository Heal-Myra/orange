// Guided sessions in the person's language (founder, 24 Oct 2026: "language can be also regional"). English and Hindi are
// built in; other languages are translated by Myra once per line and kept on the phone, so the next session is instant.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { translateLines } from './ai';
import { trIn } from './i18n';

const key = (lang: string) => `heal.guide.${lang}`;

/** Returns a function that gives each line in the language, and whether the translation is still loading. */
export function useGuideText(lang: string, lines: string[]): { say: (en: string) => string; loading: boolean; error: string | null } {
  const builtIn = lang === 'en' || lang === 'hi';
  const [map, setMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!builtIn);
  const [error, setError] = useState<string | null>(null);
  const sig = lines.join('|');
  useEffect(() => {
    if (builtIn) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      const saved: Record<string, string> = JSON.parse((await AsyncStorage.getItem(key(lang)).catch(() => null)) ?? '{}');
      const missing = Array.from(new Set(lines.filter(l => l && !saved[l])));
      try {
        for (let i = 0; i < missing.length; i += 120) {
          const chunk = missing.slice(i, i + 120);
          const r = await translateLines(chunk, lang);
          chunk.forEach((l, k) => { if (r.lines[k]) saved[l] = r.lines[k]; });
        }
        AsyncStorage.setItem(key(lang), JSON.stringify(saved)).catch(() => {});
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); }
      if (!cancelled) { setMap(saved); setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, sig]);
  const say = (en: string) => (builtIn ? trIn(lang as 'en' | 'hi', en) : map[en] ?? en);
  return { say, loading, error };
}
