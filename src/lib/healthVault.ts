// The health vault sync (founder, 11 Nov 2026): copies everything Apple Health has into the person's own rows on our
// server, for the learning engine we will build (food against sleep, running, weight …). The first time it goes back two
// years, a month at a time, quietly in the background; after that it refreshes the last few days. At most every 6 hours.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { shiftISO, todayISO } from './dates';
import { vaultDaily, vaultEvents, vaultWorkouts } from './health';
import { supabase } from './supabase';

const FIRST_DAYS = 730, CHUNK = 30, REFRESH = 3, EVERY = 6 * 3600 * 1000;
let running = false;

async function put(table: string, rows: object[], conflict: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase!.from(table).upsert(rows.slice(i, i + 500), { onConflict: conflict });
    if (error) throw new Error(error.message);
  }
}

/** Copy Apple Health into the vault. Safe to call often: it runs once at a time and at most every 6 hours. */
export async function syncVault() {
  if (running || !supabase) return;
  const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  const uid = data.user?.id;
  if (!uid) return;
  const key = `heal.vault.${uid}`;
  const saved = JSON.parse((await AsyncStorage.getItem(key).catch(() => null)) ?? '{}') as { upto?: string; at?: number };
  if (saved.at && Date.now() - saved.at < EVERY && saved.upto === todayISO()) return;
  running = true;
  try {
    const today = todayISO();
    let from = saved.upto ? shiftISO(saved.upto, -REFRESH) : shiftISO(today, -FIRST_DAYS);
    while (from <= today) {
      const to = [shiftISO(from, CHUNK - 1), today].sort()[0];
      const [daily, workouts, events] = await Promise.all([vaultDaily(from, to), vaultWorkouts(from, to), vaultEvents(from, to)]);
      await put('health_daily', daily.map(r => ({ ...r, user_id: uid, updated_at: new Date().toISOString() })), 'user_id,date,metric');
      await put('health_workouts', workouts.map(r => ({ ...r, user_id: uid })), 'user_id,id');
      await put('health_events', events.map(r => ({ ...r, user_id: uid })), 'user_id,id');
      await AsyncStorage.setItem(key, JSON.stringify({ upto: to, at: Date.now() })).catch(() => {});
      from = shiftISO(to, 1);
    }
  } catch { /* offline or not ready yet: the next run continues from where this one stopped */ }
  finally { running = false; }
}
