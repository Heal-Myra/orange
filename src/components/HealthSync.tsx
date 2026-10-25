// Apple Health → Happy Orange, with no typing: once connected, today's steps, exercise minutes and last night's sleep
// are read whenever the app opens or comes back to the front, and every 15 minutes while it is open.
// Numbers typed by hand are kept unless Apple Health has a value for that day (founder: manual entry is the last resort).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { connectHealth, healthAvailable, HEALTH_READ_VERSION, readHealthDay } from '../lib/health';
import { planFor } from '../lib/targets';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Note } from './ui';

const KEY = 'heal.health.connected';
const VERSION_KEY = 'heal.health.version';
export const HEALTH_SOURCE = 'Apple Health';

interface HealthState { available: boolean; connected: boolean; lastSync: Date | null; connect: () => Promise<void>; syncNow: () => Promise<void> }
const Ctx = createContext<HealthState>({ available: false, connected: false, lastSync: null, connect: async () => {}, syncNow: async () => {} });

const dayStartMs = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

export function HealthProvider({ children }: { children: ReactNode }) {
  const { updateOn, ready, profile, setProfile, days } = useHeal();
  const daysRef = useRef(days);
  daysRef.current = days;
  const available = Platform.OS === 'ios' && healthAvailable();
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => { AsyncStorage.getItem(KEY).then(v => setConnected(v === '1')).catch(() => {}); }, []);

  const syncNow = useCallback(async () => {
    if (!available || !connected || !ready) return;
    const iso = todayISO();
    const h = await readHealthDay(iso).catch(() => ({} as Awaited<ReturnType<typeof readHealthDay>>));
    updateOn(iso, d => {
      // A number the person typed is never overwritten by Apple Health that day (founder, 21 Oct 2026).
      if (h.steps != null && !d.activity.stepsTyped) { d.activity.steps = h.steps; d.activity.source = HEALTH_SOURCE; }
      if (h.activeMin != null && !d.activity.activeTyped) { d.activity.activeMin = h.activeMin; d.activity.source = HEALTH_SOURCE; }
      // Sleep typed by hand (no watch at night) is never overwritten by Apple Health (founder, 21 Oct 2026).
      if (h.sleepHours != null && d.sleep.source !== 'Typed in') { d.sleep.hours = h.sleepHours; d.sleep.source = HEALTH_SOURCE; }
      const health = { ...(d.health ?? {}) };
      // A weighing newer than the typed weight wins (founder, 23 Oct 2026: the Withings reading did not show).
      // Older typed weights have no time: then any weighing from today wins.
      if (health.weightTyped && h.weightAt != null && h.weightAt > (health.weightTypedAt ?? dayStartMs(iso))) { health.weightTyped = false; health.weightTypedAt = undefined; }
      for (const k of ['weightKg', 'bodyFatPct', 'restingHr', 'hrv', 'vo2max', 'activeKcal', 'mindfulMin', 'workouts', 'sleepStages'] as const) {
        if (h[k] != null && !(k === 'weightKg' && health.weightTyped)) (health as Record<string, unknown>)[k] = h[k];
      }
      // When the scale's weighing was taken, so the 3 pm "no weight yet" nudge knows whether today has one (25 Oct 2026).
      if (h.weightKg != null && h.weightAt != null && !health.weightTyped) health.weightAt = h.weightAt;
      if (Object.keys(health).length) d.health = health;
      // Mindful minutes from Apple Watch or other apps count as meditation (the larger of the two, never both).
      if (h.mindfulMin != null && h.mindfulMin > (d.mind.meditationMin ?? 0)) d.mind.meditationMin = h.mindfulMin;
    });
    // A new weight from the scale (e.g. Withings → Apple Health) keeps "About you" and the targets current.
    const me = profile.me;
    const typed = daysRef.current[iso]?.health;
    const typedWins = typed?.weightTyped && !(h.weightAt != null && h.weightAt > (typed.weightTypedAt ?? dayStartMs(iso)));
    if (me && h.weightKg != null && !typedWins && Math.abs(h.weightKg - me.weightKg) >= 0.1) {
      const next = { ...me, weightKg: h.weightKg };
      const p = planFor(next);
      setProfile({ ...profile, kcal: p.kcal, protein: p.protein, steps: p.steps, active: p.active, me: next });
    }
    setLastSync(new Date());
  }, [available, connected, ready, updateOn, profile, setProfile]);

  const connect = useCallback(async () => {
    const ok = await connectHealth().catch(() => false);
    if (ok) { setConnected(true); AsyncStorage.setItem(KEY, '1').catch(() => {}); AsyncStorage.setItem(VERSION_KEY, String(HEALTH_READ_VERSION)).catch(() => {}); }
  }, []);

  // People who connected before more items were added see Apple's sheet once more, for the new items only.
  useEffect(() => {
    if (!connected || !available) return;
    AsyncStorage.getItem(VERSION_KEY).then(async v => {
      if (Number(v ?? 1) >= HEALTH_READ_VERSION) return;
      await connectHealth().catch(() => false);
      AsyncStorage.setItem(VERSION_KEY, String(HEALTH_READ_VERSION)).catch(() => {});
      syncNow();
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, available]);

  useEffect(() => {
    if (!connected) return;
    syncNow();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') syncNow(); });
    const t = setInterval(syncNow, 15 * 60 * 1000);
    return () => { sub.remove(); clearInterval(t); };
  }, [connected, syncNow]);

  const value = useMemo(() => ({ available, connected, lastSync, connect, syncNow }), [available, connected, lastSync, connect, syncNow]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useHealth = () => useContext(Ctx);

/** Body tab: one line under Sleep and Movement. Offers to connect once; afterwards shows where the numbers come from. */
export function HealthLine() {
  const { available, connected, lastSync, connect } = useHealth();
  if (!available) return null;
  if (!connected) {
    return (
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="heart" size={20} color={colors.insight} />
          <Text style={{ fontWeight: '600', color: colors.ink, flex: 1 }}>{tr('Fill these in from Apple Health')}</Text>
        </View>
        <Note>{tr('Steps, workouts, sleep, heart and weight from your iPhone, Apple Watch and scale, read automatically. Nothing is written back.')}</Note>
        <Button title={tr('Connect Apple Health')} onPress={connect} />
      </Card>
    );
  }
  return <Note>{tr('From Apple Health')}{lastSync ? ` · ${tr('Updated {time}', { time: lastSync.toTimeString().slice(0, 5) })}` : ''}</Note>;
}

/** Body tab: one quiet line of body measures from Apple Health (weight, body fat, resting heart rate, HRV, VO2 max). */
export function BodyMeasures() {
  const { day } = useHeal();
  const h = day.health;
  if (!h) return null;
  const parts = [
    h.weightKg != null ? `${h.weightKg} kg` : null,
    h.bodyFatPct != null ? tr('{n}% body fat', { n: h.bodyFatPct }) : null,
    h.restingHr != null ? tr('resting heart {n}', { n: h.restingHr }) : null,
    h.hrv != null ? `HRV ${h.hrv} ms` : null,
    h.vo2max != null ? `VO₂ max ${h.vo2max}` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return (
    <Card style={{ gap: 4, paddingVertical: 12 }}>
      <Text style={{ fontWeight: '600', color: colors.ink }}>{tr('Your body')}</Text>
      <Text style={{ color: colors.muted }}>{parts.join(' · ')}</Text>
    </Card>
  );
}
