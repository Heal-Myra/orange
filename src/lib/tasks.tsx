// "Clear your mind": one to-do list in three groups (Family, Work, Better me).
// Each morning Myra picks one or two tasks for today (the Focus); every other task that was due is given a
// new date automatically, at most two a day, so the list never sits as one heavy pile. Done tasks leave the list.
// Saved on the device first; when signed in (and the `tasks` table exists, migration 0005) also in Supabase.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { useHeal } from './store';
import { shiftISO, todayISO } from './dates';
import { supabase } from './supabase';
import { FOCUS_MAX, defaultFocus, firstFreeDay, reschedule, sortOpen, type Area, type Task } from './taskPlan';
import { habitTitle, type Habit, type Repeat } from './habits';

export { AREAS, areaName, tasksForAI, type Area, type Task } from './taskPlan';


const KEY = 'heal.tasks.v1';

interface Saved { tasks: Task[]; focus: { date: string; ids: string[] }; habits?: Habit[] }

interface TasksState {
  tasks: Task[]; // every task, including done ones
  open: Task[]; // not done, soonest first
  focus: Task[]; // today's one or two
  doneToday: number;
  add: (title: string, area: Area, due?: string) => string | undefined; // returns the day it went on (at most three a day per group)
  habits: Habit[];
  addHabit: (h: { title: string; area: Area; repeat: Repeat; at?: string; weekday?: number }) => void;
  removeHabit: (id: string) => void;
  tickHabit: (id: string) => void; // done (or undone) today
  complete: (id: string) => void;
  moveTo: (id: string, due: string) => void;
  remove: (id: string) => void;
  setFocus: (ids: string[]) => void; // Myra's pick for today
  cloudReady: boolean; // false until migration 0005 has been run
}

const Ctx = createContext<TasksState | null>(null);
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const toRow = (userId: string, t: Task) => ({
  id: t.id, user_id: userId, title: t.title, area: t.area, due: t.due ?? null, done_at: t.doneAt ?? null,
  moved: t.moved, created_at: t.createdAt, updated_at: new Date().toISOString(),
});
const fromRow = (r: Record<string, unknown>): Task => ({
  id: String(r.id), title: String(r.title), area: r.area as Area, due: (r.due as string) ?? undefined,
  doneAt: (r.done_at as string) ?? undefined, moved: Number(r.moved ?? 0), createdAt: String(r.created_at),
});


export function TasksProvider({ children }: { children: ReactNode }) {
  const { session, consented } = useAuth();
  const userId = session && consented ? session.user.id : null;
  const { updateOn, profile, setProfile } = useHeal();
  const [habitsLocal, setHabitsLocal] = useState<Habit[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusRec, setFocusRec] = useState<{ date: string; ids: string[] }>({ date: '', ids: [] });
  const [ready, setReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Habits live with About you (synced with the account) when it exists, else on the device.
  const habits = profile.me?.habits ?? habitsLocal ?? [];
  const habitsRef = useRef(habits); habitsRef.current = habits;
  const today = todayISO();

  const saveLocal = useCallback((next: Saved) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {}); }, 300);
  }, []);

  const push = useCallback((changed: Task[]) => {
    if (!userId || !supabase || !cloudReady || !changed.length) return;
    supabase.from('tasks').upsert(changed.map(t => toRow(userId, t))).then(() => {});
  }, [userId, cloudReady]);

  // Load from the device.
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(text => {
      if (!text) return;
      const s = JSON.parse(text) as Partial<Saved>;
      if (s.tasks) setTasks(s.tasks);
      if (s.focus) setFocusRec(s.focus);
      if (s.habits) setHabitsLocal(s.habits);
    }).catch(() => {}).finally(() => setReady(true));
  }, []);

  // After sign-in: merge with the cloud (quietly stays on the device if the table is not set up yet).
  useEffect(() => {
    if (!ready || !userId || !supabase) { setCloudReady(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase!.from('tasks').select('*').eq('user_id', userId);
      if (cancelled || error) { setCloudReady(false); return; }
      setCloudReady(true);
      const remote = (data ?? []).map(fromRow);
      setTasks(local => {
        const ids = new Set(remote.map(t => t.id));
        const onlyLocal = local.filter(t => !ids.has(t.id));
        if (onlyLocal.length) supabase!.from('tasks').upsert(onlyLocal.map(t => toRow(userId, t))).then(() => {});
        return [...remote, ...onlyLocal];
      });
    })().catch(() => setCloudReady(false));
    return () => { cancelled = true; };
  }, [ready, userId]);

  const change = useCallback((fn: (ts: Task[]) => Task[], focus?: { date: string; ids: string[] }) => {
    setTasks(prev => {
      const next = fn(prev);
      const changed = next.filter(t => prev.find(p => p.id === t.id) !== t);
      push(changed);
      saveLocal({ tasks: next, focus: focus ?? focusRec, habits: habitsRef.current });
      return next;
    });
    if (focus) setFocusRec(focus);
  }, [push, saveLocal, focusRec]);

  const saveHabits = useCallback((next: Habit[]) => {
    habitsRef.current = next;
    setHabitsLocal(next);
    if (profile.me) setProfile({ ...profile, me: { ...profile.me, habits: next } });
    saveLocal({ tasks, focus: focusRec, habits: next });
  }, [profile, setProfile, saveLocal, tasks, focusRec]);

  const setFocus = useCallback((ids: string[]) => {
    const valid = ids.filter(id => tasks.some(t => t.id === id && !t.doneAt)).slice(0, FOCUS_MAX);
    const rec = { date: todayISO(), ids: valid };
    change(ts => reschedule(ts, valid, rec.date), rec);
  }, [tasks, change]);

  // Once a day (or when the first tasks arrive), make the default pick and spread the rest out.
  useEffect(() => {
    if (!ready || focusRec.date === today || !tasks.some(t => !t.doneAt)) return;
    setFocus(defaultFocus(tasks, today));
  }, [ready, focusRec.date, today, tasks, setFocus]);

  const value = useMemo<TasksState>(() => {
    const open = tasks.filter(t => !t.doneAt).sort(sortOpen);
    const focus = focusRec.date === today ? focusRec.ids.map(id => open.find(t => t.id === id)).filter((t): t is Task => !!t) : [];
    return {
      tasks, open, focus, cloudReady,
      doneToday: tasks.filter(t => t.doneAt?.startsWith(today)).length,
      add: (title, area, asked) => {
        // At most three to-dos a day in each group: a full day sends the task to the next day with room.
        const due = asked ? firstFreeDay(tasks, area, asked) : undefined;
        const t: Task = { id: newId(), title: title.trim().slice(0, 200), area, due, moved: 0, createdAt: new Date().toISOString() };
        if (!t.title) return undefined;
        // Something due today (or with no date) joins today's focus if there is room.
        const joins = (!due || due <= today) && focusRec.date === today && focusRec.ids.length < FOCUS_MAX;
        const placed = joins ? t : t.due ? t : { ...t, due: firstFreeDay(tasks, area, shiftISO(today, 1)) };
        change(ts => [...ts, placed], joins ? { date: today, ids: [...focusRec.ids, t.id] } : undefined);
        return placed.due ?? today;
      },
      habits,
      addHabit: h => {
        const next = [...habitsRef.current, { ...h, title: habitTitle(h.title).slice(0, 200), id: newId(), createdAt: new Date().toISOString() }];
        saveHabits(next);
      },
      removeHabit: id => saveHabits(habitsRef.current.filter(h => h.id !== id)),
      tickHabit: id => updateOn(today, d => {
        const done = d.habitsDone ?? [];
        d.habitsDone = done.includes(id) ? done.filter(x => x !== id) : [...done, id];
      }),
      complete: id => {
        // A focus task done today earns Mind points (15 each, up to 30).
        if (focusRec.date === today && focusRec.ids.includes(id)) updateOn(today, d => { d.mind.focusDone = (d.mind.focusDone ?? 0) + 1; });
        change(ts => ts.map(t => t.id === id ? { ...t, doneAt: new Date().toISOString() } : t));
      },
      moveTo: (id, due) => change(ts => ts.map(t => t.id === id ? { ...t, due, moved: t.moved + 1 } : t),
        focusRec.ids.includes(id) ? { date: focusRec.date, ids: focusRec.ids.filter(x => x !== id) } : undefined),
      remove: id => {
        if (userId && supabase && cloudReady) supabase.from('tasks').delete().eq('id', id).then(() => {});
        change(ts => ts.filter(t => t.id !== id), { date: focusRec.date, ids: focusRec.ids.filter(x => x !== id) });
      },
      setFocus,
    };
  }, [tasks, focusRec, today, cloudReady, change, setFocus, userId, updateOn, habits, saveHabits]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTasks(): TasksState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTasks must be used inside TasksProvider');
  return c;
}

