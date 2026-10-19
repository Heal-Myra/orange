// AI pieces used on the Today, Mind and Soul screens.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { classifyMedia, dailyGuidance, explainVerse, oneLine, reflectOnAction } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { buildContext } from '../lib/context';
import type { Verse } from '../lib/gita';
import { CONTENT_CATEGORIES } from '../lib/scoring';
import { useHeal } from '../lib/store';
import type { ContentCategoryId } from '../lib/types';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField } from './ui';

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
    const context = buildContext(day, days, date, profile);
    try {
      const r = await dailyGuidance(context);
      update(d => { d.guidance = { ...r, at: new Date().toISOString() }; });
    } catch (e) { setMessage(errText(e)); } finally { setBusy(false); }
  };

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.insight }}>
      <Heading>Myra recommends</Heading>
      {g ? (
        <>
          <Text style={{ fontSize: 17, color: colors.insight, fontWeight: '600' }}>{oneLine(g.headline)}</Text>
          {([['Body', colors.body, g.body], ['Mind', colors.mind, g.mind], ['Soul', colors.soul, g.soul]] as const).map(([name, color, list]) => list[0] ? (
            <View key={name} style={{ flexDirection: 'row', gap: 8, alignItems: 'baseline' }}>
              <Text style={{ color, fontWeight: '700', fontSize: 13, width: 40 }}>{name}</Text>
              <Text numberOfLines={1} style={{ color: colors.ink, flex: 1 }}>{oneLine(list[0])}</Text>
            </View>
          ) : null)}
        </>
      ) : <Note>Log what you can, then ask Myra. Her picks change with your day.</Note>}
      {session
        ? <Button kind="insight" title={busy ? 'Thinking…' : g ? 'Refresh' : 'Get recommendations'} onPress={run} disabled={busy} />
        : <Note>Sign in to get Myra's recommendations.</Note>}
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
