// App state: the selected day, every logged day and the person's targets.
// Milestone 1 saves on the phone only (AsyncStorage). Milestone 2 adds Supabase sync.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { shiftISO, todayISO } from './dates';
import { DEFAULT_PROFILE, emptyDay, type DayLog, type Profile } from './types';

const STORAGE_KEY = 'heal.v1';

interface Saved { days: Record<string, DayLog>; profile: Profile }

interface HealState {
  ready: boolean;
  date: string;
  day: DayLog;
  days: Record<string, DayLog>;
  profile: Profile;
  setDate: (iso: string) => void;
  goDay: (delta: number) => void;
  update: (change: (d: DayLog) => void) => void;
  setProfile: (p: Profile) => void;
}

const HealContext = createContext<HealState | null>(null);

export function HealProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(text => {
        if (!text) return;
        const saved = JSON.parse(text) as Partial<Saved>;
        if (saved.days) setDays(saved.days);
        if (saved.profile) setProfileState({ ...DEFAULT_PROFILE, ...saved.profile });
      })
      .catch(() => { /* start fresh if storage is unreadable */ })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((next: Saved) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {}); }, 400);
  }, []);

  const update = useCallback((change: (d: DayLog) => void) => {
    setDays(prev => {
      const copy: DayLog = JSON.parse(JSON.stringify(prev[date] ?? emptyDay(date)));
      change(copy);
      const next = { ...prev, [date]: copy };
      persist({ days: next, profile });
      return next;
    });
  }, [date, profile, persist]);

  const setProfile = useCallback((p: Profile) => {
    setProfileState(p);
    persist({ days, profile: p });
  }, [days, persist]);

  const value = useMemo<HealState>(() => ({
    ready, date, days, profile, update, setProfile, setDate,
    day: days[date] ?? emptyDay(date),
    goDay: (delta: number) => setDate(d => { const n = shiftISO(d, delta); return n > todayISO() ? d : n; }),
  }), [ready, date, days, profile, update, setProfile]);

  return <HealContext.Provider value={value}>{children}</HealContext.Provider>;
}

export function useHeal(): HealState {
  const ctx = useContext(HealContext);
  if (!ctx) throw new Error('useHeal must be used inside HealProvider');
  return ctx;
}
