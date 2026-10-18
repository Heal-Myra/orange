// AI pieces used on the Today, Mind and Soul screens.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { classifyMedia, dailyGuidance, explainVerse, reflectOnAction } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { shiftISO } from '../lib/dates';
import { verseOfDay, type Verse } from '../lib/gita';
import { TAO_FOR_AI, taoForDate } from '../lib/tao';
import { CONTENT_CATEGORIES, PRACTICES, mealTotals, wellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import type { ContentCategoryId } from '../lib/types';
import { colors } from '../theme';
import { Button, Card, Heading, Label, Note, TextField } from './ui';

const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');

/** Today: daily guidance built from today and the last 7 days. */
export function GuidanceCard() {
  const { session } = useAuth();
  const { day, days, date, profile, update } = useHeal();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const g = day.guidance;

  const run = async () => {
    setBusy(true); setMessage(null);
    const w = wellBeing(day, profile), t = mealTotals(day.meals), v = verseOfDay(date);
    const week = Array.from({ length: 7 }, (_, i) => shiftISO(date, -i - 1)).filter(d => days[d]).map(d => {
      const x = wellBeing(days[d], profile);
      return `${d}: body ${x.body ? Math.round(x.body.total) : '-'}, mind ${x.mind ? Math.round(x.mind.total) : '-'}, soul ${x.soul ? Math.round(x.soul.total) : '-'}`;
    }).join('\n') || 'no earlier days logged';
    const context = [
      `Targets: ${profile.kcal} kcal, ${profile.protein} g protein, ${profile.steps} steps, ${profile.active} active min, ${profile.meditation} min meditation, social media ≤ ${profile.mediaLimit} min.`,
      `Today (${date}): steps ${day.activity.steps ?? 'not logged'}, active ${day.activity.activeMin ?? 'not logged'} min, sleep ${day.sleep.hours ?? 'not logged'} h (quality ${day.sleep.quality ?? '-'}/5).`,
      `Food: ${day.meals.map(m => m.name).join(', ') || 'nothing logged'}; totals ${Math.round(t.kcal)} kcal, P ${Math.round(t.p)} g, C ${Math.round(t.c)} g, F ${Math.round(t.f)} g.`,
      `Mind: meditation ${day.mind.meditationMin ?? 'not logged'} min, attention block ${day.mind.attention ? 'yes' : 'no'}, learning ${day.mind.learning ? 'yes' : 'no'}; social media ${day.noMedia ? 'none' : day.media.map(m => `${m.minutes} min ${m.platform} (${m.category})`).join('; ') || 'not logged'}.`,
      `Soul practices kept: ${PRACTICES.filter(p => day.dharma[p.id]).map(p => p.name).join(', ') || 'none logged'}. Reflections: ${day.actions.map(a => a.text).join(' | ') || 'none'}.`,
      `Scores out of 100: body ${w.body ? Math.round(w.body.total) : 'not logged'}, mind ${w.mind ? Math.round(w.mind.total) : 'not logged'}, soul ${w.soul ? Math.round(w.soul.total) : 'not logged'}.`,
      `Verse of the day: Bhagavad Gita ${v.chapter}.${v.verse} (${v.transliteration.replace(/\n/g, ' ')}).`,
      `Today's Tao practice (${taoForDate(date).pillar}): ${taoForDate(date).title}: ${taoForDate(date).practice[0]} Done: ${day.tao?.done ? 'yes' : 'not yet'}.`,
      TAO_FOR_AI,
      `Last 7 days:\n${week}`,
    ].join('\n');
    try {
      const r = await dailyGuidance(context);
      update(d => { d.guidance = { ...r, at: new Date().toISOString() }; });
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <Card>
      <Heading>Today's guidance</Heading>
      {g ? (
        <>
          <Text style={{ fontSize: 17, color: colors.ink, fontWeight: '600' }}>{g.headline}</Text>
          {([['Body', colors.body, g.body], ['Mind', colors.mind, g.mind], ['Soul', colors.soul, g.soul]] as const).map(([name, color, list]) => (
            <View key={name} style={{ gap: 4, borderLeftWidth: 3, borderLeftColor: color, paddingLeft: 10 }}>
              <Label>{name}</Label>
              {list.map((x, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 21 }}>• {x}</Text>)}
            </View>
          ))}
        </>
      ) : <Note>Log what you can, then ask for guidance. It changes as your day changes.</Note>}
      {session
        ? <Button title={busy ? 'Thinking…' : g ? 'Refresh guidance' : 'Get guidance'} onPress={run} disabled={busy} />
        : <Note>Sign in to get guidance.</Note>}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      <Note>A working model to help you understand yourself, not medical advice.</Note>
    </Card>
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
        <Button kind="plain" title={busy === 'en' ? 'Explaining…' : 'Explain'} onPress={() => run('en')} disabled={!!busy} />
        <Button kind="plain" title={busy === 'hi' ? 'समझा रहे हैं…' : 'हिंदी में समझाएँ'} onPress={() => run('hi')} disabled={!!busy} />
      </View>
      {(['en', 'hi'] as const).map(l => text[l] ? (
        <Text key={l} style={{ color: colors.ink, lineHeight: 22, borderLeftWidth: 3, borderLeftColor: colors.soul, paddingLeft: 10 }}>{text[l]}</Text>
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
          <Button title={busy ? 'Reflecting…' : 'Reflect'} onPress={run} disabled={busy || !text.trim()} />
        </>
      ) : <Note>Sign in to use reflections.</Note>}
      {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      {day.actions.map((a, i) => (
        <View key={i} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ color: colors.ink, fontWeight: '600' }}>{a.text}</Text>
          <Text style={{ color: a.alignment > 0 ? colors.good : a.alignment < 0 ? colors.bad : colors.muted, fontSize: 13 }}>
            {a.principle} · {a.alignment > 0 ? '+' : ''}{a.alignment}
          </Text>
          {a.reflection ? <Text style={{ color: colors.muted, lineHeight: 20 }}>{a.reflection}</Text> : null}
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
      if (cat) { onPick(cat.id); setMessage(`${cat.name}: ${r.reason}`); } else setMessage('Could not tell. Please pick a category yourself.');
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 8 }}>
      <TextField label="Not sure of the category? Describe what you watched" value={text} onChangeText={setText} multiline
        placeholder="e.g. Cooking reels, then a 20-minute video on stock market basics" />
      <Button kind="plain" title={busy ? 'Thinking…' : 'Pick the category for me'} onPress={run} disabled={busy || !text.trim()} />
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
    </View>
  );
}
