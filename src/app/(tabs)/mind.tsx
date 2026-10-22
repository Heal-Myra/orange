// Mind: the Tao practice, guided meditation (minutes recorded by the app), phone activity from a Screen Time
// screenshot (with any sessions added by hand). Attention and Learning were removed (founder, 21 Oct 2026).
// Scoring: Myra's focus tasks done 15 each (up to 30) + content diet 70, plus the Tao practice on Mind days.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { ClassifyHelper } from '../../components/AiBits';
import { ScreenTimeCard } from '../../components/ScreenTimeCard';
import { TaoCard } from '../../components/TaoCard';
import { TasksCard } from '../../components/TasksCard';
import { Anchor, Button, Card, Heading, Note, NumberField, Screen, Score, s, useKeepVisible } from '../../components/ui';
import { CONTENT_CATEGORIES, LEARNING_POINTS, mindScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import type { ContentCategoryId } from '../../lib/types';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';
import { learnFromLink } from '../../lib/ai';
import { sharedTitleFor } from '../../lib/shared';

const PLATFORMS = ['Instagram', 'YouTube', 'WhatsApp', 'Facebook', 'X', 'LinkedIn', 'Other'];

export default function Mind() {
  const { day, profile, update } = useHeal();
  const score = mindScore(day, profile);
  const [platform, setPlatform] = useState('Instagram');
  const [category, setCategory] = useState<ContentCategoryId>('learning');
  const [minutes, setMinutes] = useState<number | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!minutes || minutes <= 0) return;
    update(d => { d.noMedia = false; d.media.push({ platform, minutes: Math.round(minutes), category, source: 'manual' }); });
    setMinutes(undefined); setFormKey(k => k + 1); setAdding(false);
  };

  return (
    <Screen feedback="Mind" trends="mind">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>{tr('Mind today')}</Heading>
      </Card>

      <Anchor id="tasks"><TasksCard /></Anchor>

      <Anchor id="tao"><TaoCard on="mind" /></Anchor>

      <Anchor id="phone"><ScreenTimeCard>
        {day.media.map((m, i) => (
          <View key={i} style={[s.headingRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
            <Text style={{ flex: 1, color: colors.ink }}>{m.platform} · {tr(CONTENT_CATEGORIES.find(c => c.id === m.category)?.name ?? '')} · {m.minutes} {tr('min')}{m.source === 'screen' ? ' · from screenshot' : ''}</Text>
            <Pressable onPress={() => update(d => { d.media.splice(i, 1); })} hitSlop={8}><Text style={{ color: colors.bad }}>{tr('Remove')}</Text></Pressable>
          </View>
        ))}

        {!day.noMedia && (adding ? (
          <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }} key={formKey}>
            <Text style={s.fieldLabel}>{tr('Platform')}</Text>
            <Chips options={PLATFORMS} value={platform} onChange={setPlatform} />
            <Text style={s.fieldLabel}>{tr('What kind of content was it?')}</Text>
            <Chips options={CONTENT_CATEGORIES.map(c => c.id)} labels={Object.fromEntries(CONTENT_CATEGORIES.map(c => [c.id, tr(c.name)]))}
              value={category} onChange={v => setCategory(v as ContentCategoryId)} />
            <ClassifyHelper onPick={setCategory} />
            <NumberField label={tr('Minutes')} value={minutes} onChange={setMinutes} placeholder="30" />
            <View style={s.row}>
              <Button title={tr('Add session')} onPress={add} />
              <Button kind="plain" title={tr('Cancel')} onPress={() => setAdding(false)} />
            </View>
          </View>
        ) : <Button kind="plain" title={tr('+ Add a social-media session by hand')} onPress={() => setAdding(true)} />)}
        <Note>{tr('Content quality earns up to 40 points and staying within your {limit}-minute limit earns up to 30.', { limit: profile.mediaLimit })}</Note>
        <LearningBox />
      </ScreenTimeCard></Anchor>
    </Screen>
  );
}

function Chips({ options, value, onChange, labels }: { options: string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: o === value ? colors.mind : colors.line, backgroundColor: o === value ? colors.mind + '18' : colors.surface }}>
          <Text style={{ color: colors.ink, fontSize: 14 }}>{labels?.[o] ?? tr(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Phone activity: what I learned today, in up to 10 words, with an optional link (founder, 21–22 Oct 2026). Adds 15.
 *  Paste a link, or share one to Happy Orange from another app, and Myra writes the words from the page's title. */
function LearningBox() {
  const { day, date, update } = useHeal();
  const keep = useKeepVisible();
  const l = day.mind.learned ?? {};
  const words = (l.text ?? '').trim().split(/\s+/).filter(Boolean).length;
  const link = (l.link ?? '').trim();
  const url = /^https?:\/\//i.test(link) ? link : link && /\.[a-z]{2,}/i.test(link) ? `https://${link}` : '';
  const [busy, setBusy] = useState(false);
  const [miss, setMiss] = useState('');
  const tried = useRef('');
  const set = (k: 'text' | 'link', v: string) => update(d => {
    const cur = d.mind.learned ?? {};
    d.mind = { ...d.mind, learned: { ...cur, [k]: v, by: k === 'text' ? undefined : cur.by } };
  });
  const ask = useCallback(async (u: string) => {
    tried.current = u; setBusy(true); setMiss('');
    try {
      const r = await learnFromLink(u, sharedTitleFor(u) ?? sharedTitleFor(link));
      if (r.text) update(d => { if ((d.mind.learned?.link ?? '').trim() === link) d.mind = { ...d.mind, learned: { ...(d.mind.learned ?? {}), text: r.text, by: 'myra' } }; });
      else setMiss(tr('Myra could not read this page. Write it in your own words.'));
    } catch (e) { setMiss(e instanceof Error ? e.message : tr('Myra could not read this page. Write it in your own words.')); }
    setBusy(false);
  }, [link, update]);
  // A new link with no words yet: Myra writes them (once per link).
  useEffect(() => {
    if (!url || (l.text ?? '').trim() || tried.current === url) return;
    const t = setTimeout(() => ask(url), 700);
    return () => clearTimeout(t);
  }, [url, l.text, ask]);
  return (
    <View key={date} style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
      <View style={s.headingRow}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink }}>{tr('Learning')}</Text>
        <Text style={{ color: colors.mind, fontWeight: '700' }}>{(l.text ?? '').trim().length >= 3 ? `+${LEARNING_POINTS}` : `${LEARNING_POINTS}`}</Text>
      </View>
      <TextInput style={s.input} value={l.link ?? ''} onChangeText={t => { setMiss(''); set('link', t.trim()); }} autoCapitalize="none" autoCorrect={false}
        keyboardType="url" placeholder={tr('Paste a link: video, article, course')} placeholderTextColor={colors.muted} onFocus={() => setTimeout(keep, 300)} />
      <TextInput style={s.input} value={busy ? '' : l.text ?? ''} editable={!busy} multiline onChangeText={t => set('text', t.replace(/\n/g, ' ').split(/ +/).slice(0, 11).join(' '))}
        placeholder={busy ? tr('Myra is reading the link…') : tr('What I learned today, in up to 10 words')} placeholderTextColor={colors.muted} onFocus={() => setTimeout(keep, 300)} />
      {words > 10 ? <Note>{tr('Keep it to 10 words.')}</Note> : null}
      {l.by === 'myra' && !busy ? <Note>{tr('Myra wrote this from the link. Change it if you like.')}</Note> : null}
      {miss ? <Note>{miss}</Note> : null}
      {url ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable style={{ flex: 1 }} onPress={() => Linking.openURL(url).catch(() => {})}>
            <Text numberOfLines={1} style={{ color: colors.accent, textDecorationLine: 'underline' }}>{url}</Text>
          </Pressable>
          {!busy ? <Pressable onPress={() => ask(url)} accessibilityRole="button">
            <Text style={{ color: colors.insight, fontWeight: '600' }}>{tr('Myra, write it')}</Text>
          </Pressable> : null}
        </View>
      ) : null}
      {Platform.OS !== 'web' ? <Note>{tr('Tip: in YouTube, Instagram or LinkedIn tap Share, then Happy Orange.')}</Note> : null}
      <Note>{tr('Learning something today adds {n} to Mind.', { n: LEARNING_POINTS })}</Note>
    </View>
  );
}
