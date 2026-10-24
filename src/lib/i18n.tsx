// Language: English or Hindi, chosen on the very first screen and changeable in Profile (founder, 20 Oct 2026).
// Every visible text goes through tr('English text'); the Hindi lives in src/lib/hi.ts, keyed by the English.
// Missing Hindi falls back to English, so nothing ever shows blank. Changing the language redraws the whole app.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HI } from './hi';

export type Lang = 'en' | 'hi';
const KEY = 'heal.lang';

let current: Lang = 'en';

/** Translate a fixed English text. {name} placeholders are filled from vars. */
export function tr(en: string, vars?: Record<string, string | number>): string {
  let s = current === 'hi' ? HI[en] ?? en : en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Translate into a given language, whatever the app language (guided sessions have their own voice language). */
export const trIn = (to: Lang, en: string): string => (to === 'hi' ? HI[en] ?? en : en);

export const lang = () => current;
/** Locale for dates and numbers. */
export const locale = () => (current === 'hi' ? 'hi-IN' : 'en-IN');

interface LangState { lang: Lang; chosen: boolean; ready: boolean; setLang: (l: Lang) => void }
const Ctx = createContext<LangState | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Lang>('en');
  const [chosen, setChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'en' || v === 'hi') { current = v; setValue(v); setChosen(true); }
    }).catch(() => {}).finally(() => setReady(true));
  }, []);

  const setLang = useCallback((l: Lang) => {
    current = l; setValue(l); setChosen(true);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  }, []);

  const state = useMemo(() => ({ lang: value, chosen, ready, setLang }), [value, chosen, ready, setLang]);
  // key={value}: the whole app is drawn again in the new language.
  return <Ctx.Provider value={state}><LangKey k={value}>{children}</LangKey></Ctx.Provider>;
}

function LangKey({ k, children }: { k: string; children: ReactNode }) {
  return <Fragment key={k}>{children}</Fragment>;
}

export function useLang(): LangState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang must be used inside LangProvider');
  return c;
}
