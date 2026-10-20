// AI pieces used on the Today, Mind and Soul screens.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { classifyMedia, dailyGuidance, explainVerse, oneLine, reflectOnAction } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { buildContext, daySignature, partOfDay } from '../lib/context';
import { tasksForAI, useTasks } from '../lib/tasks';
import { FocusBlock } from './TasksCard';
import { todayISO } from '../lib/dates';
import type { Verse } from '../lib/gita';
import { CONTENT_CATEGORIES } from '../lib/scoring';
import { useHeal } from '../lib/store';
import type { ContentCategoryId } from '../lib/types';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField } from './ui';

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');

/** Today: "Myra recommends". Refreshes by itself when the part of the day changes (morning, afternoon, evening, night)
 *  or when what is logged today changes (a meal, steps from a fitness app, meditation...), so the person never has to ask. */
export function GuidanceCard() {
  const { session } = useAuth();
  const { day, days, date, profile, update } = useHeal();
  const { open, setFocus } = useTasks();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const tried = useRef<string>('');
  const g = day.guidance;
  const isToday = date === todayISO();
  const part = partOfDay();
  const sig = daySignature(day);

  const run = useCallback(async () => {
    setBusy(true); setMessage(null);
    const context = buildContext(day, days, date, profile, tasksForAI(open, todayISO()));
    try {
      const r = await dailyGuidance(context);
      update(d => { d.guidance = { ...r, at: new Date().toISOString(), part: partOfDay(), sig: daySignature(d) }; });
      if (Array.isArray(r.focus) && r.focus.length && date === todayISO()) setFocus(r.focus.map(String)); // Myra's pick
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  }, [day, days, date, profile, update, open, setFocus]);

  // Look again every 10 minutes, so a new part of the day is noticed even if nothing is tapped.
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 10 * 60 * 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!session || !isToday || busy) return;
    const ageMin = g ? (Date.now() - new Date(g.at).getTime()) / 60000 : Infinity;
    const stale = !g || g.part !== part || (g.sig !== sig && ageMin > 20);
    const key = `${date}|${part}|${sig}`;
    if (!stale || tried.current === key) return; // one attempt per situation, so errors never loop
    const t = setTimeout(() => { tried.current = key; run(); }, 4000); // wait until the person stops typing
    return () => clearTimeout(t);
  }, [session, isToday, busy, g, part, sig, date, run, tick]);

  const time = g ? new Date(g.at).toTimeString().slice(0, 5) : '';

  const blocks = g ? ([['Body', colors.body, g.body], ['Mind', colors.mind, g.mind], ['Soul', colors.soul, g.soul]] as const) : [];

  // Three separate blocks, one each for Body, Mind and Soul, stacked one under another (founder, 20 Oct 2026).
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
        <Heading>Myra recommends</Heading>
        {session && g && !busy && isToday ? <Pressable onPress={run} hitSlop={8}><Text style={{ color: colors.insight, fontWeight: '600' }}>Refresh</Text></Pressable> : null}
      </View>
      {g ? <Text style={{ fontSize: 14, color: colors.insight, paddingHorizontal: 4 }}>{oneLine(g.headline)}</Text> : null}

      {g ? blocks.map(([name, color, list]) => list[0] ? (
        <Card key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: color }}>
          <Text style={{ color, fontWeight: '700', fontSize: 14, width: 44 }}>{name}</Text>
          <Text style={{ color: colors.ink, flex: 1, fontSize: 14, lineHeight: 20 }}>{oneLine(list[0])}</Text>
        </Card>
      ) : null) : null}

      {isToday ? <FocusBlock /> : null}

      {g ? null : (
        <Card>
          {!session ? <Note>Sign in to get Myra's recommendations.</Note>
            : <Note>{busy ? 'Myra is looking at your day…' : 'Myra will suggest your next steps here.'}</Note>}
          {session && !busy && isToday ? <Button kind="insight" title="Get recommendations" onPress={run} /> : null}
        </Card>
      )}

      {message ? <Text style={{ color: colors.bad, paddingHorizontal: 4 }}>{message}</Text> : null}
      <View style={{ paddingHorizontal: 4 }}>
        <Note>{g ? `${busy ? 'Updating…' : `Updated ${time}`} · changes with your day · ` : ''}Not medical advice.</Note>
      </View>
    </View>
  );
}

/** Soul and Library: explain a Gita verse in English or Hindi. */
export function ExplainVerse({ verse }: { verse: Verse }) {
  const { session } = useAuth();
  const [text, setText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!session) return <Note>Sign in to get explanations in English or Hindi.</Note>;

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
        <Button kind="insight" title={busy === 'en' ? 'Explaining…' : 'Explain'} onPress={() => run('en')} disabled={!!busy} />
        <Button kind="insight" title={busy === 'hi' ? 'समझा रहे हैं…' : 'हिंदी में समझाएँ'} onPress={() => run('hi')} disabled={!!busy} />
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
      <Heading>Reflect on an action</Heading>
      <Note>Describe something you did, good or not. The AI reflects on it with the Gita's eyes. It never judges you.</Note>
      {session ? (
        <>
          <TextField label="What did you do?" value={text} onChangeText={setText} multiline
            placeholder="e.g. Lost my temper with my driver, later apologised and paid him for the extra hour" />
          <Button kind="insight" title={busy ? 'Reflecting…' : 'Reflect'} onPress={run} disabled={busy || !text.trim()} />
        </>
      ) : <Note>Sign in to use reflections.</Note>}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      {day.actions.map((a, i) => (
        <View key={i} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{a.text}</Text>
          <Text style={{ color: a.alignment > 0 ? colors.good : a.alignment < 0 ? colors.bad : colors.muted, fontSize: 13 }}>
            {a.principle} · {a.alignment > 0 ? '+' : ''}{a.alignment}
          </Text>
          {a.reflection ? <Text style={{ color: colors.insight }}>{oneLine(a.reflection)}</Text> : null}
          <Pressable onPress={() => update(d => { d.actions.splice(i, 1); })}><Text style={{ color: colors.bad }}>Remove</Text></Pressable>
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
      if (cat) { onPick(cat.id); setMessage(`${cat.name}: ${oneLine(r.reason)}`); } else setMessage('Could not tell. Please pick a category yourself.');
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 8 }}>
      <TextField label="Not sure of the category? Describe what you watched" value={text} onChangeText={setText} multiline
        placeholder="e.g. Cooking reels, then a 20-minute video on stock market basics" />
      <Button kind="insight" title={busy ? 'Thinking…' : 'Pick the category for me'} onPress={run} disabled={busy || !text.trim()} />
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
    </View>
  );
}
