// Apple Health → Happy Orange, with no typing: once connected, today's steps, exercise minutes and last night's sleep
// are read whenever the app opens or comes back to the front, and every 15 minutes while it is open.
// Numbers typed by hand are kept unless Apple Health has a value for that day (founder: manual entry is the last resort).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { connectHealth, healthAvailable, readHealthDay } from '../lib/health';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Note } from './ui';

const KEY = 'heal.health.connected';
export const HEALTH_SOURCE = 'Apple Health';

interface HealthState { available: boolean; connected: boolean; lastSync: Date | null; connect: () => Promise<void>; syncNow: () => Promise<void> }
const Ctx = createContext<HealthState>({ available: false, connected: false, lastSync: null, connect: async () => {}, syncNow: async () => {} });

export function HealthProvider({ children }: { children: ReactNode }) {
  const { updateOn, ready } = useHeal();
  const available = Platform.OS === 'ios' && healthAvailable();
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => { AsyncStorage.getItem(KEY).then(v => setConnected(v === '1')).catch(() => {}); }, []);

  const syncNow = useCallback(async () => {
    if (!available || !connected || !ready) return;
    const iso = todayISO();
    const h = await readHealthDay(iso).catch(() => ({} as Awaited<ReturnType<typeof readHealthDay>>));
    updateOn(iso, d => {
      if (h.steps != null) { d.activity.steps = h.steps; d.activity.source = HEALTH_SOURCE; }
      if (h.activeMin != null) { d.activity.activeMin = h.activeMin; d.activity.source = HEALTH_SOURCE; }
      if (h.sleepHours != null) d.sleep.hours = h.sleepHours;
    });
    setLastSync(new Date());
  }, [available, connected, ready, updateOn]);

  const connect = useCallback(async () => {
    const ok = await connectHealth().catch(() => false);
    if (ok) { setConnected(true); AsyncStorage.setItem(KEY, '1').catch(() => {}); }
  }, []);

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
        <Note>{tr('Steps, exercise minutes and sleep from your iPhone and Apple Watch, read automatically. Nothing is written back.')}</Note>
        <Button title={tr('Connect Apple Health')} onPress={connect} />
      </Card>
    );
  }
  return <Note>{tr('From Apple Health')}{lastSync ? ` · ${tr('Updated {time}', { time: lastSync.toTimeString().slice(0, 5) })}` : ''}</Note>;
}
