// "Share to Happy Orange": in YouTube, Instagram, LinkedIn, Facebook or a browser, tap Share and pick Happy Orange.
// Only on builds that include the share extension (expo-share-intent, build 10 onward); others skip it entirely.

import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { firstUrl } from '../lib/shared';
import { optional } from '../lib/native';

type Lib = typeof import('expo-share-intent');
const lib: Lib | null = optional(['ExpoShareIntentModule'], () => require('expo-share-intent'));

/** Wraps the app with the share listener when this build has it. */
export function ShareProvider({ children }: { children: ReactNode }) {
  if (!lib) return <>{children}</>;
  const P = lib.ShareIntentProvider;
  return <P>{children}</P>;
}

// Shared links open the "Shared with Happy Orange" screen (founder, 24 Oct 2026): save to my journey, or send to the
// team as inspiration (src/app/shared.tsx).
export function ShareReceiver() {
  return lib ? <Receiver lib={lib} /> : null;
}

function Receiver({ lib }: { lib: Lib }) {
  const { hasShareIntent, shareIntent, resetShareIntent } = lib.useShareIntentContext();
  useEffect(() => {
    if (!hasShareIntent) return;
    const link = shareIntent.webUrl || firstUrl(shareIntent.text);
    if (link) router.push({ pathname: '/shared', params: { url: link, title: shareIntent.meta?.title ?? '' } });
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);
  return null;
}
