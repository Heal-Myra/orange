// "Share to Happy Orange" (founder, 22 Oct 2026): in YouTube, Instagram, LinkedIn, Facebook or a browser, tap Share and
// pick Happy Orange. The link lands in today's Learning (Mind tab, Phone activity) and Myra writes what it teaches
// in up to 10 words. Only on builds that include the share extension (expo-share-intent); others skip it entirely.

import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { useHeal } from '../lib/store';
import { firstUrl, rememberSharedTitle } from '../lib/shared';
import { optional } from '../lib/native';

type Lib = typeof import('expo-share-intent');
const lib: Lib | null = optional(['ExpoShareIntentModule'], () => require('expo-share-intent'));

/** Wraps the app with the share listener when this build has it. */
export function ShareProvider({ children }: { children: ReactNode }) {
  if (!lib) return <>{children}</>;
  const P = lib.ShareIntentProvider;
  return <P>{children}</P>;
}

// Learning was removed from Mind (founder, 24 Oct 2026), so shared links are not used for now; the share menu stays
// in the app for a future use. Kept switched off rather than deleted.
const SHARE_TO_LEARNING = false;
export function ShareReceiver() {
  return lib && SHARE_TO_LEARNING ? <Receiver lib={lib} /> : null;
}

function Receiver({ lib }: { lib: Lib }) {
  const { hasShareIntent, shareIntent, resetShareIntent } = lib.useShareIntentContext();
  const { update } = useHeal();
  useEffect(() => {
    if (!hasShareIntent) return;
    const link = shareIntent.webUrl || firstUrl(shareIntent.text);
    const words = !link ? (shareIntent.text ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 10).join(' ') : '';
    if (link || words) {
      if (link) rememberSharedTitle(link, shareIntent.meta?.title);
      update(d => { d.mind = { ...d.mind, learned: link ? { link, text: '' } : { ...(d.mind.learned ?? {}), text: words } }; });
      router.navigate({ pathname: '/mind', params: { card: 'phone', at: String(Date.now()) } });
    }
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent, update]);
  return null;
}
