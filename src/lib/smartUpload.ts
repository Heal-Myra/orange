// Myra as the one place to drop anything (founder, 1 Nov 2026; decision 0046). A picture added in Myra's chat is
// recognised (meal, Screen Time, to-do list, gratitude journal page, selfie), read with the same reader its card uses,
// and offered back as a short summary with "Add to my day". Nothing is added without the person's yes.

import { analyseMeal, readNoteJournal, readNoteTasks, readScreenTime, readSelfie, whatIsThis, type MealItem, type NoteTask, type Offer, type ScreenTimeResult } from './ai';
import { phoneDayFor, usePhoneUpdate } from '../components/ScreenTimeCard';
import { cleanReading, type FaceReading } from './face';
import { todayISO } from './dates';
import { tr } from './i18n';
import { useLogMeals } from './logMeals';
import { CONTENT_CATEGORIES } from './scoring';
import { useHeal } from './store';
import { useTasks } from './tasks';
import type { MediaSession } from './types';

const catName = (id: string) => tr(CONTENT_CATEGORIES.find(c => c.id === id)?.name ?? id);

export function useSmartUpload() {
  const logMeals = useLogMeals();
  const updatePhoneOn = usePhoneUpdate();
  const { updateOn } = useHeal();
  const { add, addHabit } = useTasks();

  /** Look at a picture; an offer to add it, or null when it is not something a card takes (Myra then just talks). */
  async function read(img: { data: string; media_type: string }, hint = ''): Promise<Offer | null> {
    const today = todayISO();
    const w = await whatIsThis(img.data, img.media_type);
    if (!w || w.kind === 'other' || (w.sure ?? 0) < 0.5) return null;
    if (w.kind === 'meal') {
      const r = await analyseMeal(img.data, img.media_type, hint);
      if (!r.items?.length) return null;
      const t = r.items.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.protein_g, fib: a.fib + (x.fibre_g ?? 0) }), { kcal: 0, p: 0, fib: 0 });
      return { kind: 'meal', title: r.items.map(x => x.name).join(', '), where: tr('Food'), data: r.items,
        lines: [...r.items.map(x => `${x.name} · ${Math.round(x.grams)} g · ${Math.round(x.kcal)} kcal`), tr('{k} kcal · {p} g protein · {f} g fibre', { k: Math.round(t.kcal), p: Math.round(t.p), f: Math.round(t.fib) })] };
    }
    if (w.kind === 'screen_time') {
      const r: ScreenTimeResult = await readScreenTime(img.data, img.media_type, today);
      if (!r.sessions?.length) return null;
      const date = r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date <= today ? r.date : phoneDayFor(today);
      return { kind: 'screen_time', title: tr('Phone activity'), where: date === phoneDayFor(today) ? tr('Phone activity, yesterday') : tr('Phone activity, {d}', { d: date }), data: { date, sessions: r.sessions },
        lines: r.sessions.filter(s => s.group !== 'tool').map(s => `${s.app || s.platform} · ${Math.round(s.minutes)} ${tr('min')} · ${catName(s.category)}`) };
    }
    if (w.kind === 'todo') {
      const r = await readNoteTasks(img.data, img.media_type, today, new Date().toLocaleDateString('en-IN', { weekday: 'long' }));
      const list = (r.tasks ?? []).filter(t => t.title?.trim());
      if (!list.length) return null;
      const area = (a: string) => tr(a === 'family' ? 'Family' : a === 'work' ? 'Work' : 'Better me');
      return { kind: 'todo', title: tr('{n} to-dos', { n: list.length }), where: tr('Clear your mind'), data: list, lines: list.map(t => `${t.title} · ${area(t.area)}`) };
    }
    if (w.kind === 'journal') {
      const r = await readNoteJournal(img.data, img.media_type);
      const lines = [...(r.thankful ?? []).filter(Boolean).map(x => `${tr('Thankful for')}: ${x}`), r.laugh && `${tr('Laughed at')}: ${r.laugh}`, r.kindTo && `${tr('Kind to')}: ${r.kindTo}`, r.best && `${tr('Best part')}: ${r.best}`].filter(Boolean) as string[];
      if (!lines.length) return null;
      return { kind: 'journal', title: tr('Gratitude journal'), where: tr('Gratitude journal, today'), data: r, lines };
    }
    if (w.kind === 'selfie') {
      const r = await readSelfie(img.data, img.media_type);
      if (r.isFace === false) return null;
      const f = cleanReading(r);
      return { kind: 'selfie', title: f.witty || tr('Face & beauty'), where: tr('Face & beauty, today'), data: f, lines: (f.tips ?? []).slice(0, 3) };
    }
    return null;
  }

  /** Put it in its card; returns what to say. */
  function apply(o: Offer): string {
    const today = todayISO();
    if (o.kind === 'meal') {
      const items = o.data as MealItem[];
      logMeals(items.map(it => ({ name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fib: it.fibre_g ?? 0, source: it.basis === 'IFCT' ? 'photo+ifct' : 'photo' })));
      return tr('Added to Food. You can change any item on the Food card.');
    }
    if (o.kind === 'screen_time') {
      const { date, sessions } = o.data as { date: string; sessions: ScreenTimeResult['sessions'] };
      const rows: MediaSession[] = sessions.filter(s => s.minutes > 0).map(s => ({ platform: s.platform as MediaSession['platform'], app: s.app, minutes: Math.round(s.minutes), category: s.category, group: s.group ?? 'social', source: 'screen' }));
      updatePhoneOn(date, d => { d.noMedia = false; d.media = [...d.media.filter(m => m.source !== 'screen'), ...rows]; });
      return tr('Added to Phone activity. You can change the minutes under Show details.');
    }
    if (o.kind === 'todo') {
      for (const t of o.data as NoteTask[]) {
        const due = t.due && t.due >= today ? t.due : undefined;
        if (t.repeat) addHabit({ title: t.title, area: t.area, repeat: t.repeat, at: t.at ?? undefined, weekday: t.repeat === 'weekly' ? new Date().getDay() : undefined });
        else add(t.title, t.area, due);
      }
      return tr('Added to Clear your mind.');
    }
    if (o.kind === 'journal') {
      const r = o.data as { thankful?: string[]; laugh?: string; kindTo?: string; best?: string };
      updateOn(today, d => {
        const g = Array.from({ length: Math.max(3, d.soul?.gratitude?.length ?? 0) }, (_, k) => d.soul?.gratitude?.[k] ?? '');
        const fresh = (r.thankful ?? []).map(x => x?.trim()).filter(Boolean);
        for (let k = 0; k < g.length && fresh.length; k++) if (!g[k]?.trim()) g[k] = fresh.shift()!;
        d.soul = { ...d.soul, gratitude: g, laugh: d.soul?.laugh?.trim() ? d.soul.laugh : r.laugh || d.soul?.laugh, best: d.soul?.best?.trim() ? d.soul.best : r.best || d.soul?.best };
        d.love = { ...(d.love ?? {}), kindTo: d.love?.kindTo?.trim() ? d.love.kindTo : r.kindTo || d.love?.kindTo };
      });
      return tr('Added to your Gratitude journal. Empty boxes only; nothing you wrote was changed.');
    }
    updateOn(today, d => { d.face = o.data as FaceReading; });
    return tr('Added to Face & beauty.');
  }

  return { read, apply };
}
