// Phone activity: read social-media minutes from a Screen Time (iPhone) or Digital Wellbeing (Android) screenshot.
// Websites cannot read Screen Time directly, so a screenshot is the practical way. Every number can be checked and changed.

import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { readScreenTime } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { CONTENT_CATEGORIES, mindScore } from '../lib/scoring';
import { useHeal } from '../lib/store';
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
  const { day, profile, update } = useHeal();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rows, setRows] = useState<(MediaSession & { app: string })[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const score = mindScore(day, profile);
  const total = day.media.reduce((t, m) => t + m.minutes, 0);

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
      const r = await readScreenTime(img.data, img.type);
      setRows(r.sessions.map(x => ({ platform: x.platform, app: x.app, minutes: Math.round(x.minutes), category: x.category, source: 'screen' as const })));
      setMessage(r.sessions.length ? `${r.period === 'daily average' ? tr('Using the daily average. ') : ''}${tr('Check the minutes and the kind of content, then add.')}` : r.note);
    } catch (e) { setMessage(e instanceof Error ? e.message : tr('Something went wrong. Try again.')); }
    finally { setBusy(false); }
  };

  const add = () => {
    if (!rows?.length) return;
    update(d => {
      d.noMedia = false;
      d.media = [...d.media.filter(m => m.source !== 'screen'), ...rows.filter(r => r.minutes > 0).map(({ app: _app, ...m }) => m)];
    });
    setRows(null); setMessage(tr('Added. Your content diet score is updated.'));
  };

  return (
    <Card>
      <Heading right={<Score value={score?.content ?? undefined} max={30} />}>{tr('Phone activity')}</Heading>
      <Note>{tr('Take a screenshot of Screen Time (iPhone: Settings → Screen Time → See All App & Website Activity), then choose it or paste it here. The app reads your social-media minutes for you.')}</Note>
      {/* "I used no social media today" removed (founder, 23 Oct 2026). Older days that have it still count. */}
      {session ? (
        <View style={s.row}>
          <View style={{ flex: 1 }}><Button kind="insight" title={busy ? tr('Reading…') : tr('Choose screenshot')} onPress={pick} disabled={busy} /></View>
          <View style={{ flex: 1 }}><Button kind="plain" title={tr('Paste screenshot')} onPress={paste} disabled={busy} /></View>
        </View>
      ) : <Note>{tr('Sign in to read a screenshot. You can still add sessions by hand below.')}</Note>}
      {message ? <Text style={{ color: colors.muted }}>{message}</Text> : null}
      {rows?.map((r, i) => (
        <View key={i} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <View style={s.headingRow}>
            <Text style={{ flex: 1, color: colors.ink, fontWeight: '600' }}>{r.app || r.platform}</Text>
            <TextInput style={[s.input, { width: 70, textAlign: 'right' }]} keyboardType="number-pad" defaultValue={String(r.minutes)}
              onEndEditing={e => setRows(list => list && list.map((x, n) => n === i ? { ...x, minutes: parseInt(e.nativeEvent.text, 10) || 0 } : x))} />
            <Text style={{ color: colors.muted }}>{tr('min')}</Text>
          </View>
          <Pressable onPress={() => setOpen(open === i ? null : i)}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>{nameOf(r.category)} ▾</Text>
          </Pressable>
          {open === i && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {CONTENT_CATEGORIES.map(c => (
                <Pressable key={c.id} onPress={() => { setRows(list => list && list.map((x, n) => n === i ? { ...x, category: c.id } : x)); setOpen(null); }}
                  style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: c.id === r.category ? colors.mind : colors.line, backgroundColor: colors.surface }}>
                  <Text style={{ color: colors.ink, fontSize: 13 }}>{tr(c.name)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
      {rows?.length ? (
        <View style={s.row}>
          <Button title={tr('Add to my day')} onPress={add} />
          <Button kind="plain" title={tr('Discard')} onPress={() => { setRows(null); setMessage(null); }} />
        </View>
      ) : null}
      {day.media.length > 0 && !rows ? <Note>{tr('Today: {total} minutes of social media logged ({limit}-minute limit).', { total, limit: profile.mediaLimit })}</Note> : null}
      {children}
    </Card>
  );
}
