// "Share to Happy Orange" (founder, 22 Oct 2026): in YouTube, Instagram, LinkedIn, Facebook or a browser, tap Share and
// pick Happy Orange. The link lands in today's Learning (Mind tab, Phone activity) and Myra writes what it teaches
// in up to 10 words. Works from the build that includes expo-share-intent; older builds and the website skip it.

import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import { useHeal } from '../lib/store';
import { firstUrl, rememberSharedTitle } from '../lib/shared';

export function ShareReceiver() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
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
