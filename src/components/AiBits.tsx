// AI pieces used on the Today, Mind and Soul screens.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { classifyMedia, dailyGuidance, explainPassage, explainVerse, oneLine, reflectOnAction } from '../lib/ai';
import { traditionName, type Passage, type Tradition } from '../lib/wisdom';
import { useAuth } from '../lib/auth';
import { buildContext, daySignature, partOfDay, type Slot } from '../lib/context';
import { momentOf, type RoutineKind } from '../lib/routine';
import { habitNow } from '../lib/habits';
import { tasksForAI, useTasks } from '../lib/tasks';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { todayISO } from '../lib/dates';
import type { Verse } from '../lib/gita';
import { CONTENT_CATEGORIES } from '../lib/scoring';
import { useHeal } from '../lib/store';
import type { ContentCategoryId } from '../lib/types';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField } from './ui';
import { lang, tr } from '../lib/i18n';

const errText = (e: unknown) => (e instanceof Error ? e.message : tr('Something went wrong. Try again.'));

/** Which card on the tab a recommendation belongs to: Myra's own answer when she gave one, otherwise read from the words
 *  (English or Hindi). Used to open the tab right at that card (founder, 21 Oct 2026). */
export function cardFor(pillar: 'body' | 'mind' | 'soul', text: string, isTask: boolean, given?: string): string {
  const ok: Record<string, string[]> = { body: ['food', 'sleep', 'movement'], mind: ['tasks', 'tao', 'phone'], soul: ['gratitude', 'meditation', 'wisdom', 'love'] };
  if (given && ok[pillar].includes(given)) return given;
  const t = text.toLowerCase();
  if (pillar === 'body') return /sleep|bed|nap|नींद|सो/.test(t) ? 'sleep' : /walk|step|run|yoga|exercise|stretch|move|stairs|workout|चल|कदम|टहल|व्यायाम|योग/.test(t) ? 'movement' : 'food';
  if (pillar === 'mind') return isTask ? 'tasks' : /tao|antidote|ताओ/.test(t) ? 'tao' : /screen|phone|social|scroll|instagram|youtube|learn|स्क्रीन|फ़ोन|फोन|सीख/.test(t) ? 'phone' : 'tasks';
  return /call|meet|friend|love|hug|party|family|mum|dad|wife|husband|joy|happy|मिल|दोस्त|प्यार|परिवार|माँ|पापा|खुश|पार्टी/.test(t) ? 'love'
    : /breath|meditat|sit |still|साँस|सांस|ध्यान/.test(t) ? 'meditation' : /wisdom|verse|gita|read|passage|shloka|ज्ञान|श्लोक|गीता|पढ़/.test(t) ? 'wisdom' : 'gratitude';
}

const feelKey = (f?: { mood: string; symptoms: string[] }) => (f ? `${f.mood}:${f.symptoms.join(',')}` : '');

/** Which of Body, Mind and Soul fits this moment of the day. */
export function pickForMoment(kind: RoutineKind | undefined, slot: Slot, myra?: 'body' | 'mind' | 'soul'): 'body' | 'mind' | 'soul' {
  if (kind) {
    if (kind === 'sleep' || kind === 'wake' || kind === 'reading') return 'soul';
    if (kind === 'meal' || kind === 'exercise' || kind === 'walk' || kind === 'sport') return 'body';
    if (kind === 'work' || kind === 'break' || kind === 'family' || kind === 'learning' || kind === 'commute') return 'mind';
  }
  if (slot === 'night' || slot === 'early morning') return 'soul';
  if (slot === 'lunch' || slot === 'dinner') return 'body';
  return myra ?? 'mind';
}

/** Today: "Myra recommends". Refreshes by itself when the part of the day changes (morning, afternoon, evening, night)
 *  or when what is logged today changes (a meal, steps from a fitness app, meditation...), so the person never has to ask. */
export function GuidanceCard() {
  const { session, tradition } = useAuth();
  const { day, days, date, profile, update } = useHeal();
  const { open, focus, setFocus, complete, habits, tickHabit } = useTasks();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [kick, setKick] = useState(0); // a to-do was ticked: ask Myra for the next thing
  const tried = useRef<string>('');
  const g = day.guidance;
  const isToday = date === todayISO();
  // The moment of the person's usual day if they described it (switches 5 minutes early), else the part of the day.
  const momentKey = () => momentOf(profile.me?.routine)?.key ?? partOfDay();
  const part = momentKey();
  const sig = daySignature(day);

  const run = useCallback(async () => {
    setBusy(true); setMessage(null);
    const context = buildContext(day, days, date, profile, tasksForAI(open, todayISO()), tradition);
    try {
      const r = await dailyGuidance(context);
      update(d => { d.guidance = { ...r, at: new Date().toISOString(), part: momentKey(), sig: daySignature(d), lang: lang(), fasting: !!d.fasting, feel: feelKey(d.feeling) }; });
      if (Array.isArray(r.focus) && r.focus.length && date === todayISO()) setFocus(r.focus.map(String)); // Myra's pick
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  }, [day, days, date, profile, update, open, setFocus, tradition]);

  useEffect(() => {
    if (!kick) return;
    const t = setTimeout(() => run(), 1500); // after the tick has been saved, so Myra sees the updated list
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kick]);

  // Look again every minute, so a switch-over in the day (5 minutes early) is noticed even if nothing is tapped.
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 60 * 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!session || !isToday || busy) return;
    const ageMin = g ? (Date.now() - new Date(g.at).getTime()) / 60000 : Infinity;
    // Switching "I'm fasting today" on or off changes the advice at once (founder, 22 Oct 2026).
    const stale = !g || g.part !== part || (g.lang ?? 'en') !== lang() || !!g.fasting !== !!day.fasting || (g.feel ?? '') !== feelKey(day.feeling) || (g.sig !== sig && ageMin > 20);
    const key = `${date}|${part}|${sig}|${day.fasting ? 'fast' : ''}|${feelKey(day.feeling)}`;
    if (!stale || tried.current === key) return; // one attempt per situation, so errors never loop
    const t = setTimeout(() => { tried.current = key; run(); }, 4000); // wait until the person stops typing
    return () => clearTimeout(t);
  }, [session, isToday, busy, g, part, sig, date, run, tick]);

  const time = g ? new Date(g.at).toTimeString().slice(0, 5) : '';

  // Which one to show now. The moment decides first, so bedtime is always about winding down (founder, 22 Oct 2026:
  // at 10 pm Myra showed a dinner tip); Myra's own pick only when the moment does not say.
  const hNow = isToday ? habitNow(habits, day.habitsDone ?? []) : null; // re-checked every minute (tick)
  const nowKind = momentOf(profile.me?.routine)?.now.kind;
  const pick = pickForMoment(nowKind, partOfDay(), g?.pick);
  // After the usual sleep time (or 9:30 pm), only winding down: never a target to chase (founder, 22 Oct 2026:
  // "Meditate 15 more minutes to reach your target" at 10:20 pm).
  const bedtime = nowKind === 'sleep' || (!nowKind && partOfDay() === 'night');
  const soulLine = bedtime ? [tr('Lie down for Yoga Nidra, then drift into sleep.')] : g?.soul ?? [];
  const blocks = g ? ([[tr('Body'), colors.body, g.body], [tr('Mind'), colors.mind, g.mind], [tr('Soul'), colors.soul, soulLine]] as const) : [];

  // Three separate blocks, one each for Body, Mind and Soul, stacked one under another (founder, 20 Oct 2026).
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
        <Heading>{tr('Clear your mind')}</Heading>
        {session && g && !busy && isToday ? <Pressable onPress={run} hitSlop={8}><Text style={{ color: colors.insight, fontWeight: '600' }}>{tr('Refresh')}</Text></Pressable> : null}
      </View>

      {/* Three very simple tasks, one each (founder, 21 Oct 2026). When the Mind task is a to-do, it can be ticked here;
          Myra then rotates to the next thing. */}
      {/* A habit at its time comes first (founder, 23 Oct 2026: "Call Dad daily at 9 AM" pops up at 9). */}
      {hNow ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: colors.mind }}>
          <Text style={{ color: colors.mind, fontWeight: '700', fontSize: 14, width: 44 }}>{hNow.at}</Text>
          <Text style={{ color: colors.ink, flex: 1, fontSize: 14, lineHeight: 20 }}>{hNow.title} <Text style={{ color: colors.muted, fontSize: 12 }}>· {tr('Habit')}</Text></Text>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Done: ${hNow.title}`} hitSlop={10} onPress={() => tickHabit(hNow.id)}>
            <Ionicons name="ellipse-outline" size={24} color={colors.accent} />
          </Pressable>
        </Card>
      ) : null}
      {g && !hNow ? blocks.map(([name, color, list], i) => {
        if ((['body', 'mind', 'soul'] as const)[i] !== pick) return null; // one thing at a time (founder, 22 Oct 2026)
        const task = i === 1 && isToday ? focus.find(t => (g.focus ?? []).includes(t.id)) : undefined;
        const pillar = (['body', 'mind', 'soul'] as const)[i];
        const card = bedtime && pillar === 'soul' ? 'meditation' : cardFor(pillar, list[0] ?? '', !!task, g.cards?.[pillar]);
        return list[0] ? (
          <Pressable key={name} accessibilityRole="button" accessibilityHint={tr('Opens the card where you do this')}
            onPress={() => bedtime && pillar === 'soul' ? router.push('/yoga-nidra') : router.navigate({ pathname: `/${pillar}`, params: { card, at: String(Date.now()) } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: color }}>
            <Text style={{ color, fontWeight: '700', fontSize: 14, width: 44 }}>{name}</Text>
            <Text style={{ color: colors.ink, flex: 1, fontSize: 14, lineHeight: 20 }}>{oneLine(list[0])}</Text>
            {task ? (
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Done: ${task.title}`} hitSlop={10}
                onPress={() => { complete(task.id); setKick(k => k + 1); }}>
                <Ionicons name="ellipse-outline" size={24} color={colors.accent} />
              </Pressable>
            ) : <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
          </Card>
          </Pressable>
        ) : null;
      }) : null}

      {g ? null : (
        <Card>
          {!session ? <Note>{tr('Sign in to get Myra\'s recommendations.')}</Note>
            : <Note>{busy ? tr('Myra is looking at your day…') : tr('Myra will suggest your next steps here.')}</Note>}
          {session && !busy && isToday ? <Button kind="insight" title={tr('Get recommendations')} onPress={run} /> : null}
        </Card>
      )}

      {message ? <Text style={{ color: colors.bad, paddingHorizontal: 4 }}>{message}</Text> : null}
      <View style={{ paddingHorizontal: 4 }}>
        <Note>{g ? `${busy ? tr('Updating…') : tr('Updated {time}', { time })} · ${tr('changes with your day')} · ` : ''}{tr('Not medical advice.')}</Note>
      </View>
    </View>
  );
}

/** Soul: explain the Daily Wisdom passage of any tradition, in English or Hindi. */
export function ExplainPassage({ passage, tradition }: { passage: Passage; tradition: Tradition }) {
  const { session } = useAuth();
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return <Note>{tr('Sign in to get explanations in English or Hindi.')}</Note>;

  const run = async (lang: 'en' | 'hi') => {
    setBusy(lang); setMessage(null);
    try {
      const r = await explainPassage(passage, traditionName(tradition), lang);
      setText(t => ({ ...t, [lang]: r.text }));
    } catch (e) { setMessage(errText(e)); } finally { setBusy(null); }
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button kind="insight" title={busy === lang() ? tr('Explaining…') : tr('Open its meaning')} onPress={() => run(lang())} disabled={!!busy} />
        {lang() === 'hi'
          ? <Button kind="plain" title={busy === 'en' ? 'Explaining…' : 'Explain in English'} onPress={() => run('en')} disabled={!!busy} />
          : <Button kind="plain" title={busy === 'hi' ? 'समझा रहे हैं…' : 'हिंदी में समझाएँ'} onPress={() => run('hi')} disabled={!!busy} />}
      </View>
      {(['en', 'hi'] as const).map(l => text[l] ? (
        <Text key={l} style={{ color: colors.ink, lineHeight: 22, borderLeftWidth: 3, borderLeftColor: colors.insight, paddingLeft: 10 }}>{text[l]}</Text>
      ) : null)}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
    </View>
  );
}

/** Soul and Library: explain a Gita verse in English or Hindi. */
export function ExplainVerse({ verse }: { verse: Verse }) {
  const { session } = useAuth();
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return <Note>{tr('Sign in to get explanations in English or Hindi.')}</Note>;

  const run = async (lang: 'en' | 'hi') => {
    setBusy(lang); setMessage(null);
    try {
      const r = await explainVerse(verse, lang);
      setText(t => ({ ...t, [lang]: r.text }));
    } catch (e) { setMessage(errText(e)); } finally { setBusy(null); }
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Button kind="insight" title={busy === lang() ? tr('Explaining…') : tr('Open its meaning')} onPress={() => run(lang())} disabled={!!busy} />
        {lang() === 'hi'
          ? <Button kind="plain" title={busy === 'en' ? 'Explaining…' : 'Explain in English'} onPress={() => run('en')} disabled={!!busy} />
          : <Button kind="plain" title={busy === 'hi' ? 'समझा रहे हैं…' : 'हिंदी में समझाएँ'} onPress={() => run('hi')} disabled={!!busy} />}
      </View>
      {(['en', 'hi'] as const).map(l => text[l] ? (
        <Text key={l} style={{ color: colors.ink, lineHeight: 22, borderLeftWidth: 3, borderLeftColor: colors.insight, paddingLeft: 10 }}>{text[l]}</Text>
      ) : null)}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
    </View>
  );
}

/** Soul: reflect on an action against dharma. Adds or removes up to 5 points (capped at ±10 a day). */
export function ReflectCard() {
  const { session } = useAuth();
  const { day, update } = useHeal();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    const t = text.trim(); if (!t) return;
    setBusy(true); setMessage(null);
    try {
      const r = await reflectOnAction(t);
      const alignment = Math.max(-2, Math.min(2, Math.round(Number(r.alignment) || 0)));
      update(d => { d.actions.push({ text: t, principle: String(r.principle || 'Dharma'), alignment, reflection: String(r.reflection || '') }); });
      setText('');
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <Card>
      <Heading>{tr('Reflect on an action')}</Heading>
      <Note>{tr('Describe something you did, good or not. The AI reflects on it with the Gita\'s eyes. It never judges you.')}</Note>
      {session ? (
        <>
          <TextField label={tr('What did you do?')} value={text} onChangeText={setText} multiline
            placeholder={tr('e.g. Lost my temper with my driver, later apologised and paid him for the extra hour')} />
          <Button kind="insight" title={busy ? tr('Reflecting…') : tr('Reflect')} onPress={run} disabled={busy || !text.trim()} />
        </>
      ) : <Note>{tr('Sign in to use reflections.')}</Note>}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      {day.actions.map((a, i) => (
        <View key={i} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{a.text}</Text>
          <Text style={{ color: a.alignment > 0 ? colors.good : a.alignment < 0 ? colors.bad : colors.muted, fontSize: 13 }}>
            {a.principle} · {a.alignment > 0 ? '+' : ''}{a.alignment}
          </Text>
          {a.reflection ? <Text style={{ color: colors.insight }}>{oneLine(a.reflection)}</Text> : null}
          <Pressable onPress={() => update(d => { d.actions.splice(i, 1); })}><Text style={{ color: colors.bad }}>{tr('Remove')}</Text></Pressable>
        </View>
      ))}
    </Card>
  );
}

/** Mind: describe a social-media session and let the AI pick its category. */
export function ClassifyHelper({ onPick }: { onPick: (c: ContentCategoryId) => void }) {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return null;

  const run = async () => {
    setBusy(true); setMessage(null);
    try {
      const r = await classifyMedia(text);
      const cat = CONTENT_CATEGORIES.find(c => c.id === r.category);
      if (cat) { onPick(cat.id); setMessage(`${tr(cat.name)}: ${oneLine(r.reason)}`); } else setMessage(tr('Could not tell. Please pick a category yourself.'));
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 8 }}>
      <TextField label={tr('Not sure of the category? Describe what you watched')} value={text} onChangeText={setText} multiline
        placeholder={tr('e.g. Cooking reels, then a 20-minute video on stock market basics')} />
      <Button kind="insight" title={busy ? tr('Thinking…') : tr('Pick the category for me')} onPress={run} disabled={busy || !text.trim()} />
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
    </View>
  );
}
