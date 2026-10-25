// Quick updates without closing the app by hand (founder, 25 Oct 2026: "why was it not downloaded?").
// iPhone keeps apps paused rather than closed, so an update downloaded on one launch could wait days to be used.
// Now: whenever the app comes back to the front (at most every 10 minutes) it checks for a new version and downloads it;
// the next time the person returns after being away for a minute or more, the app restarts into it (a second's flash).
// Never during a guided session or cooking guide. iPhone app only.
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

let U: typeof import('expo-updates') | null = null;
try { U = Platform.OS === 'web' || __DEV__ ? null : require('expo-updates'); } catch { U = null; }

export function UpdateWatcher() {
  const path = usePathname();
  const pathRef = useRef(path); pathRef.current = path;
  const ready = useRef(false), lastCheck = useRef(0), awaySince = useRef<number | null>(null);

  useEffect(() => {
    if (!U || !U.isEnabled) return;
    const Upd = U;
    const check = async () => {
      if (ready.current || Date.now() - lastCheck.current < 10 * 60_000) return;
      lastCheck.current = Date.now();
      try {
        const r = await Upd.checkForUpdateAsync();
        if (r.isAvailable) { await Upd.fetchUpdateAsync(); ready.current = true; }
      } catch { /* offline: try again later */ }
    };
    check();
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') { awaySince.current = Date.now(); return; }
      const away = awaySince.current ? Date.now() - awaySince.current : 0;
      awaySince.current = null;
      const busy = /breathe|yoga-nidra|cook/.test(pathRef.current ?? '');
      if (ready.current && away > 60_000 && !busy) { Upd.reloadAsync().catch(() => {}); return; }
      check();
    });
    return () => sub.remove();
  }, []);
  return null;
}
