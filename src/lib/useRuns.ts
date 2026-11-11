// The person's runs from Apple Health for Top of My Game (founder, 11 Nov 2026).
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { readRuns, type Run } from './health';

let cache: { at: number; runs: Run[] } | null = null;
/** The person's runs from Apple Health, read again when the app comes back (at most every 10 minutes). */
export function useRuns() {
  const [runs, setRuns] = useState<Run[]>(cache?.runs ?? []);
  useEffect(() => {
    const load = () => {
      if (cache && Date.now() - cache.at < 10 * 60_000) return;
      readRuns().then(r => { cache = { at: Date.now(), runs: r }; setRuns(r); }).catch(() => {});
    };
    load();
    const a = AppState.addEventListener('change', s => { if (s === 'active') load(); });
    return () => a.remove();
  }, []);
  return runs;
}
