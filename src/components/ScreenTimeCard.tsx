// Phone activity: read every app's minutes from a Screen Time (iPhone) or Digital Wellbeing (Android) screenshot, in
// three groups (founder, 26 Oct 2026): social and video (count toward the limit), learning and AI tools (raise quality,
// never use up the limit), everyday tools (shown, not scored). Minutes go to the day the screenshot shows.
// Websites cannot read Screen Time directly, so a screenshot is the practical way. Every number can be checked and changed.

import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { readScreenTime } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { CONTENT_CATEGORIES, mindScore } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { todayISO } from '../lib/dates';
import type { ContentCategoryId, MediaSession } from '../lib/types';
import { colors } from '../theme';
import { shrink } from './MealPhoto';
import { Button, Card, Heading, Note, Score, s } from './ui';
import { optional } from '../lib/native';
import { tr } from '../lib/i18n';

const Clip = optional(['ExpoClipboard'], () => require('expo-clipboard') as typeof import('expo-clipboard'));

/** The picture on the clipboard, if any: the phone's clipboard in the app, the browser's on the website. */
async function pastedImage(): Promise<{ uri: string; data: string; type: string } | null> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard && 'read' in navigator.clipboard) {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      const kind = it.types.find(t => t.startsWith('image/'));
      if (!kind) continue;
      const blob = await it.getType(kind);
      const url: string = await new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = bad; r.readAsDataURL(blob); });
      return { uri: url, data: url.split(',')[1] ?? '', type: kind };
    }
    return null;
  }
  if (!Clip || !(await Clip.hasImageAsync())) return null;
  const img = await Clip.getImageAsync({ format: 'jpeg', jpegQuality: 0.8 });
  if (!img?.data) return null;
  return { uri: img.data, data: img.data.split(',')[1] ?? img.data, type: 'image/jpeg' };
}

const nameOf = (id: ContentCategoryId) => CONTENT_CATEGORIES.find(c => c.id === id)?.name ?? id;

export function ScreenTimeCard({ children }: { children?: ReactNode }) {
  const { session } = useAuth();
  const { day, profile, updateOn, date } = useHeal();
  const [busy, setBusy] = useState(false);
  const [shotDate, setShotDate] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<MediaSession[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const score = mindScore(day, profile);
  const mine = day.media.filter(m => !m.notMe);
  const total = mine.filter(m => (m.group ?? 'social') === 'social').reduce((t, m) => t + m.minutes, 0);
  const learning = mine.filter(m => m.group === 'learning').reduce((t, m) => t + m.minutes, 0);

  const pick = async () => {
    setMessage(null); setRows(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (res.canceled) return;
    const a = res.assets[0];
    await read(() => shrink(a.uri, a.base64, a.mimeType));
  };

  // Paste the screenshot straight from the clipboard (founder, 23 Oct 2026): take the screenshot, tap Copy, tap Paste here.
  const paste = async () => {
    setMessage(null); setRows(null);
    const img = await pastedImage().catch(() => null);
    if (!img) { setMessage(Platform.OS !== 'web' && !Clip ? tr('Paste works from the next app version. For now, choose the screenshot.') : tr('No picture to paste. Take the screenshot, tap Copy, then Paste here.')); return; }
    await read(async () => img.uri.startsWith('data:') && Platform.OS !== 'web' ? shrink(img.uri, img.data, img.type) : { data: img.data, type: img.type });
  };

  const read = async (get: () => Promise<{ data: string; type: string }>) => {
    setBusy(true); setMessage(tr('Reading your Screen Time…'));
    try {
      const img = await get();
      const r = await readScreenTime(img.data, img.type, todayISO());
      setRows(r.sessions.map(x => ({ platform: x.platform, app: x.app, minutes: Math.round(x.minutes), category: x.category, group: x.group ?? 'social', source: 'screen' as const })));
      setShotDate(r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date <= todayISO() ? r.date : null);
      setMessage(r.sessions.length ? `${r.period === 'daily average' ? tr('Using the daily average. ') : ''}${tr('Check the minutes and the kind of content, then add.')}` : r.note);
    } catch (e) { setMessage(e instanceof Error ? e.message : tr('Something went wrong. Try again.')); }
    finally { setBusy(false); }
  };

  const add = () => {
    if (!rows?.length) return;
    // The day the screenshot shows (e.g. Saturday), else the day on screen.
    const target = shotDate ?? date;
    updateOn(target, d => {
      d.noMedia = false;
      d.media = [...d.media.filter(m => m.source !== 'screen'), ...rows.filter(r => r.minutes > 0)];
    });
    setRows(null);
    setMessage(target === date ? tr('Added. Your content diet score is updated.') : tr('Added to {day}, the day the screenshot shows.', { day: new Date(target + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) }));
  };
  const setRow = (i: number, change: Partial<MediaSession>) => setRows(list => list && list.map((x, n) => (n === i ? { ...x, ...change } : x)));
  const toolRows = rows?.filter(r => r.group === 'tool') ?? [];

  return (
    <Card>
      <Heading right={<Score value={score?.content ?? undefined} max={30} />}>{tr('Phone activity')}</Heading>
      <Note>{tr('Take a screenshot of Screen Time (iPhone: Settings → Screen Time → See All App & Website Activity), then choose it or paste it here. The app reads every app for you.')}</Note>
      {/* "I used no social media today" removed (founder, 23 Oct 2026). Older days that have it still count. */}
      {session ? (
        <View style={s.row}>
          <View style={{ flex: 1 }}><Button kind="insight" title={busy ? tr('Reading…') : tr('Choose screenshot')} onPress={pick} disabled={busy} /></View>
          <View style={{ flex: 1 }}><Button kind="plain" title={tr('Paste screenshot')} onPress={paste} disabled={busy} /></View>
        </View>
      ) : <Note>{tr('Sign in to read a screenshot. You can still add sessions by hand below.')}</Note>}
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
      {rows?.map((r, i) => r.group === 'tool' ? null : (
        <View key={i} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, opacity: r.notMe ? 0.55 : 1 }}>
          <View style={s.headingRow}>
            <Text style={{ flex: 1, color: colors.ink, fontWeight: '600' }}>{r.app || r.platform}{r.group === 'learning' ? ` · ${tr('learning & AI')}` : ''}</Text>
            <TextInput style={[s.input, { width: 70, textAlign: 'right' }]} keyboardType="number-pad" defaultValue={String(r.minutes)}
              onEndEditing={e => setRow(i, { minutes: parseInt(e.nativeEvent.text, 10) || 0 })} />
            <Text style={{ color: colors.muted }}>{tr('min')}</Text>
          </View>
          <Pressable onPress={() => setOpen(open === i ? null : i)}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>{nameOf(r.category)} ▾</Text>
          </Pressable>
          {r.minutes > 240 && !r.notMe ? <Text style={{ color: colors.warn, fontSize: 13 }}>{tr('Over 4 hours. Was it all you? Lower the minutes, or tap Not me if it was the TV or family.')}</Text> : null}
          <Pressable onPress={() => setRow(i, { notMe: !r.notMe })} accessibilityRole="checkbox" accessibilityState={{ checked: !!r.notMe }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{r.notMe ? '☑' : '☐'} {tr('Not me (TV / family)')}</Text>
          </Pressable>
          {open === i && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {CONTENT_CATEGORIES.map(c => (
                <Pressable key={c.id} onPress={() => { setRow(i, { category: c.id }); setOpen(null); }}
                  style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: c.id === r.category ? colors.mind : colors.line, backgroundColor: colors.surface }}>
                  <Text style={{ color: colors.ink, fontSize: 13 }}>{tr(c.name)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
      {toolRows.length ? <Note>{tr('Everyday tools, not scored: {list}', { list: toolRows.map(t => `${t.app || t.platform} ${t.minutes}`).join(' · ') + ' ' + tr('min') })}</Note> : null}
      {rows?.length && shotDate && shotDate !== date ? <Note>{tr('This screenshot is from {day}; it will be added to that day.', { day: new Date(shotDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) })}</Note> : null}
      {rows?.length ? (
        <View style={s.row}>
          <Button title={tr('Add to my day')} onPress={add} />
          <Button kind="plain" title={tr('Discard')} onPress={() => { setRows(null); setMessage(null); }} />
        </View>
      ) : null}
      {day.media.length > 0 && !rows ? <Note>{tr('Social and video: {total} of your {limit}-minute limit.', { total, limit: profile.mediaLimit })}{learning ? ` ${tr('Learning and AI tools: {n} min (never counts against the limit).', { n: learning })}` : ''}</Note> : null}
      {children}
    </Card>
  );
}
