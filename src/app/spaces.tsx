// Spaces (founder, 10 Nov 2026; decision 0055): a home set up to help you. The list of spaces, and each space: snap it,
// Myra says in one line what she sees and gives three small changes; seven days later, snap it again and see before
// and after side by side. The photos stay on this phone; Myra's words and the ticks are kept with About you.

import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Button, Card, Check, Expandable, Note, Screen } from '../components/ui';
import { readSpace } from '../lib/ai';
import { formatDay, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { shrink } from '../lib/photo';
import {
  SPACES, afterDue, afterPhoto, againOn, doneCount, loadPhotos, nextPhotos, nextSpace, savePhotos, statusOf,
  type SpaceId, type SpacePhotos, type SpacesState,
} from '../lib/spaces';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const nameOf = (id: SpaceId) => tr(SPACES.find(x => x.id === id)!.name);

/** Myra's line: the coral "M" and one sentence (her signature colour). */
function MyraSays({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.onInsight, fontWeight: '800', fontSize: 15 }}>M</Text>
      </View>
      <Text style={{ flex: 1, color: colors.insight, fontSize: 16, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export default function Spaces() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile, setProfile } = useHeal();
  const me = profile.me;
  const all: SpacesState = me?.spaces ?? {};
  const save = (next: SpacesState) => { if (me) setProfile({ ...profile, me: { ...me, spaces: next } }); };

  if (!me) {
    return (
      <Screen>
        <Card>
          <Note>{tr('Fill in About you first, so your spaces are kept.')}</Note>
          <Button title={tr('Open About you')} onPress={() => router.push('/about-you')} />
        </Card>
      </Screen>
    );
  }
  const space = SPACES.find(x => x.id === id)?.id;
  return space ? <OneSpace id={space} all={all} save={save} /> : <List all={all} />;
}

function List({ all }: { all: SpacesState }) {
  const today = todayISO();
  const next = nextSpace(all, today);
  const open = (id: SpaceId) => router.push({ pathname: '/spaces', params: { id } });
  return (
    <Screen>
      <Note>{tr('Your home, set up to help you.')}</Note>
      {next ? (
        <Card>
          <MyraSays text={next.due ? tr('A week has passed. Snap your {space} again.', { space: nameOf(next.id).toLowerCase() })
            : next.id === 'kitchen' ? tr('Start with the kitchen. It shapes every meal.') : tr('Next, your {space}.', { space: nameOf(next.id).toLowerCase() })} />
          <Button title={tr('Snap my {space}', { space: nameOf(next.id).toLowerCase() })} onPress={() => open(next.id)} />
        </Card>
      ) : null}
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        {SPACES.map((x, i) => {
          const st = statusOf(all[x.id], today);
          const due = afterDue(all[x.id], today);
          return (
            <Pressable key={x.id} onPress={() => open(x.id)} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: i === SPACES.length - 1 ? 0 : 1, borderBottomColor: colors.line }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{tr(x.name)}</Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>{tr(x.helps)}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: all[x.id] ? '600' : '400', color: due ? colors.insight : all[x.id] ? colors.accent : colors.muted }}>{tr(st.key, st.vars)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        })}
      </Card>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{tr('Photos of your home stay on this phone.')}</Text>
    </Screen>
  );
}

function Photo({ uri, label, tall }: { uri?: string; label: string; tall?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      {uri ? <Image source={{ uri }} style={{ height: tall ? 220 : 170, borderRadius: 14, backgroundColor: colors.sunk }} resizeMode="cover" accessibilityLabel={label} />
        : <View style={{ height: tall ? 220 : 170, borderRadius: 14, backgroundColor: colors.sunk, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="image-outline" size={28} color={colors.muted} /></View>}
      <Text style={{ fontSize: 12.5, color: colors.muted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function OneSpace({ id, all, save }: { id: SpaceId; all: SpacesState; save: (s: SpacesState) => void }) {
  const today = todayISO();
  const s = all[id];
  const name = nameOf(id).toLowerCase();
  const [photos, setPhotos] = useState<SpacePhotos>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { loadPhotos(id).then(setPhotos); }, [id]);

  const snap = async (camera: boolean) => {
    setMessage(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, base64: true };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setMessage(tr('Camera permission is needed. You can choose a photo instead.')); return; }
    }
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    setBusy(true);
    try {
      const img = await shrink(a.uri, a.base64, a.mimeType);
      const read = await readSpace(img.data, img.type, SPACES.find(x => x.id === id)!.name, s ? s.round.changes.map(c => c.text) : undefined);
      if (!read.isSpace || !read.changes?.length) { setMessage(read.note || tr('That does not look like your {space}. Try another photo.', { space: name })); return; }
      save({ ...all, [id]: afterPhoto(s, read, today) });
      const small = await shrink(a.uri, null, null, 480).catch(() => null);
      if (small) { const p = nextPhotos(photos, `data:${small.type};base64,${small.data}`, today); setPhotos(p); savePhotos(id, p); }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const tick = (i: number) => {
    if (!s) return;
    const changes = s.round.changes.map((c, j) => (j === i ? { ...c, done: c.done ? undefined : today } : c));
    save({ ...all, [id]: { ...s, round: { ...s.round, changes } } });
  };

  const snapButtons = (title: string) => (
    <View style={{ gap: 8 }}>
      <Button title={title} onPress={() => snap(true)} disabled={busy} />
      <Button kind="plain" title={tr('Choose a photo')} onPress={() => snap(false)} disabled={busy} />
    </View>
  );
  const reading = busy ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={colors.insight} />
      <Text style={{ color: colors.insight, fontSize: 15 }}>{tr('Myra is looking at your {space}…', { space: name })}</Text>
    </View>
  ) : null;

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>{nameOf(id)}</Text>
      {!s ? (
        <Card>
          <Photo label={tr('Your {space} photo', { space: name })} tall />
          <MyraSays text={tr('Snap it as it is. No tidying first.')} />
          {reading ?? snapButtons(tr('Snap my {space}', { space: name }))}
          {message ? <Note>{message}</Note> : null}
          <Text style={{ color: colors.muted, fontSize: 12 }}>{tr('Photos of your home stay on this phone.')}</Text>
        </Card>
      ) : (
        <>
          {photos.after ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Photo uri={photos.before?.uri} label={photos.before ? formatDay(photos.before.at) : tr('Before')} />
              <Photo uri={photos.after.uri} label={formatDay(photos.after.at)} />
            </View>
          ) : <Photo uri={photos.before?.uri} label={photos.before ? formatDay(photos.before.at) : tr('Photo on another phone')} tall />}

          <Card>
            <MyraSays text={s.round.seen} />
            {s.last ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.insight }}>{tr('{n} of {m}', { n: s.last.kept, m: s.last.of })}</Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>{tr('changes made since {day}', { day: formatDay(s.last.at) })}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>{s.last ? tr('Next 3 small changes') : tr('3 small changes')} · {tr('{n} done', { n: doneCount(s) })}</Text>
            {s.round.changes.map((c, i) => <Check key={i} checked={!!c.done} onToggle={() => tick(i)} title={c.text} color={colors.accent} />)}
            <Expandable icon="help-circle-outline" title={tr('Why these?')} color={colors.insight}>
              {s.round.changes.map((c, i) => <Text key={i} style={{ fontSize: 14, color: colors.ink }}><Text style={{ fontWeight: '700' }}>{i + 1}. </Text>{c.why}</Text>)}
            </Expandable>
          </Card>

          <Card>
            {reading ?? (afterDue(s, today)
              ? snapButtons(tr('Snap the after photo'))
              : (
                <>
                  <Note>{tr('Snap it again on {day} to see what changed.', { day: formatDay(againOn(s)) })}</Note>
                  <Button kind="plain" title={tr('Snap again now')} onPress={() => snap(true)} />
                </>
              ))}
            {message ? <Note>{message}</Note> : null}
          </Card>
        </>
      )}
    </Screen>
  );
}
