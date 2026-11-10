// Spaces (founder, 10 Nov 2026; decision 0055): a home set up to help you. The list of spaces, and each space: snap it,
// Myra says in one line what she sees and gives three small changes; seven days later, snap it again and see before
// and after side by side. The photos stay on this phone; Myra's words and the ticks are kept with About you.
// Build 14: a walk-round video (a few still frames go to Myra), faces blurred on the phone, and Myra's numbered pins
// on the photo with the details of each change below it.

import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Button, Card, Check, Expandable, Note, Screen, Segmented } from '../components/ui';
import { PASTEL, RingPanel, RingStack, fmt, type RingItem } from '../components/Rings';
import { readSpace } from '../lib/ai';
import { formatDay, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { captureSpace, hasSpaceCamera, keepCopy } from '../lib/spaceCapture';
import {
  CHECKS, CHECK_MAX, SPACES, afterDue, bestMove, scoreOf, spacesScore, afterPhoto, againOn, doneCount, latestPhoto, loadPhotos, nextPhotos, savePhotos,
  type SpaceChange, type SpaceId, type SpacePhoto, type SpacePhotos, type SpacesState,
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
  const open = (id: SpaceId) => router.push({ pathname: '/spaces', params: { id } });
  const total = spacesScore(all);
  const items: RingItem[] = SPACES.map((x, i) => ({ id: x.id, color: SPACE_RING[i], label: tr(x.name), value: (scoreOf(all[x.id]) ?? 0) / 100 }));
  const move = bestMove(all, today);
  const moveName = move ? nameOf(move.id).toLowerCase() : '';
  const line = !move ? tr('Every space is at its best. Lovely.')
    : move.kind === 'after' ? tr('A week has passed. Snap your {space} again.', { space: moveName })
    : move.kind === 'change' ? move.text!
    : move.id === 'kitchen' ? tr('Start with the kitchen. It shapes every meal.') : tr('Next, your {space}.', { space: moveName });
  const sub = !move ? null : move.kind === 'change' ? tr('{space} · up to +{n}', { space: nameOf(move.id), n: move.gain ?? 10 })
    : move.kind === 'after' ? tr('Your score can rise') : tr('Snap it to get its score');
  return (
    <Screen>
      {/* Like Today (founder, 10 Nov 2026): the Spaces score in rings, one per space, and Myra's one move with the most
          impact beside it; below, each space as its own small ring circle, tap to go inside. */}
      <Card style={{ gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{tr('Spaces score')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <RingStack items={items} center={total == null ? '–' : fmt(total)} sub={tr('of {n}', { n: 100 })} size={156} />
          <View style={{ width: 1, alignSelf: 'stretch', marginVertical: 12, backgroundColor: colors.line }} />
          <Pressable disabled={!move} onPress={() => move && open(move.id)} accessibilityRole="button"
            style={({ pressed }) => ({ flex: 1, gap: 8, opacity: pressed ? 0.8 : 1 })}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.onInsight, fontWeight: '800', fontSize: 15 }}>M</Text>
            </View>
            <Text style={{ color: colors.insight, fontSize: 16, fontWeight: '600' }}>{line}</Text>
            {sub ? <Text style={{ color: colors.muted, fontSize: 13 }}>{sub}</Text> : null}
            {move ? <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700' }}>{move.kind === 'change' ? tr('Open {space}', { space: nameOf(move.id) }) : tr('Snap my {space}', { space: moveName })} ›</Text> : null}
          </Pressable>
        </View>
      </Card>

      <View style={{ backgroundColor: colors.surface, borderRadius: 22, paddingVertical: 4, flexDirection: 'row', flexWrap: 'wrap' }}>
        {SPACES.map((x, i) => {
          const st = all[x.id], sc = scoreOf(st);
          const due = afterDue(st, today);
          const rings: RingItem[] = CHECKS[x.id].map((c, j) => ({ id: String(j), color: RING[j], label: tr(c), value: (st?.round.checks?.[j] ?? 0) / CHECK_MAX }));
          return (
            <Pressable key={x.id} onPress={() => open(x.id)} accessibilityRole="button" accessibilityLabel={`${tr(x.name)}: ${sc == null ? '–' : sc}/100`}
              style={({ pressed }) => ({ width: '50%', alignItems: 'center', gap: 4, paddingVertical: 14, borderLeftWidth: i % 2 ? 1 : 0, borderTopWidth: i >= 2 ? 1 : 0, borderColor: colors.line, opacity: pressed ? 0.85 : 1 })}>
              <RingStack items={rings} center={sc == null ? '–' : fmt(sc)} sub={tr('of {n}', { n: 100 })} size={120} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, textAlign: 'center' }} numberOfLines={1}>{tr(x.name)}</Text>
              <Text style={{ fontSize: 11.5, color: due ? colors.insight : colors.muted, textAlign: 'center' }} numberOfLines={1}>
                {due ? tr('After photo due') : sc == null ? tr('Add a photo') : tr(x.helps.replace('Helps ', '').split(' · ')[1] ?? '')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{tr('Photos of your home stay on this phone.')}</Text>
    </Screen>
  );
}

/** A photo at its own shape (so pins land where Myra put them), with her numbered pins when given. */
function Photo({ photo, label, pins, small }: { photo?: SpacePhoto; label: string; pins?: SpaceChange[]; small?: boolean }) {
  const size = small ? 24 : 30;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      {photo ? (
        <View style={{ width: '100%', aspectRatio: photo.ratio ?? 4 / 3, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.sunk }}>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel={label} />
          {(pins ?? []).map((c, i) => (c.spot ? (
            <View key={i} accessibilityLabel={tr('Change {n}', { n: i + 1 })}
              style={{ position: 'absolute', left: `${c.spot.x * 100}%`, top: `${c.spot.y * 100}%`, marginLeft: -size / 2, marginTop: -size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: colors.insight, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: small ? 12 : 15 }}>{i + 1}</Text>
            </View>
          ) : null))}
        </View>
      ) : (
        <View style={{ height: small ? 170 : 220, borderRadius: 14, backgroundColor: colors.sunk, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="image-outline" size={28} color={colors.muted} /></View>
      )}
      <Text style={{ fontSize: 12.5, color: colors.muted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function OneSpace({ id, all, save }: { id: SpaceId; all: SpacesState; save: (s: SpacesState) => void }) {
  const today = todayISO();
  const s = all[id];
  const name = nameOf(id).toLowerCase();
  const video = hasSpaceCamera();
  const [photos, setPhotos] = useState<SpacePhotos>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pinsOn, setPinsOn] = useState<'pins' | 'now'>('pins');
  useEffect(() => { loadPhotos(id).then(setPhotos); }, [id]);

  const snap = async (from: 'photo' | 'video' | 'library') => {
    setMessage(null);
    try {
      const got = await captureSpace(from);
      if (!got) return;
      if ('error' in got) { setMessage(got.error); return; }
      setBusy(true);
      const read = await readSpace(got.images.map(i => ({ data: i.data, media_type: i.type })), SPACES.find(x => x.id === id)!.name, s ? s.round.changes.map(c => c.text) : undefined, CHECKS[id]);
      if (!read.isSpace || !read.changes?.length) { setMessage(read.note || tr('That does not look like your {space}. Try another photo.', { space: name })); return; }
      save({ ...all, [id]: afterPhoto(s, read, today) });
      setPinsOn('pins');
      // Keep the picture Myra put her pins on (for a video, the frame she chose), small, on this phone only.
      const chosen = got.images[Math.min(Math.max(0, Math.round(Number(read.frame ?? 0)) || 0), got.images.length - 1)];
      const uri = await keepCopy(chosen);
      if (uri) { const p = nextPhotos(photos, uri, today, chosen.ratio); setPhotos(p); savePhotos(id, p); }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  const tick = (i: number) => {
    if (!s) return;
    const changes = s.round.changes.map((c, j) => (j === i ? { ...c, done: c.done ? undefined : today } : c));
    save({ ...all, [id]: { ...s, round: { ...s.round, changes } } });
  };

  const snapButtons = (first: boolean) => (
    <View style={{ gap: 8 }}>
      {video ? <Button title={tr('Record a walk-round video')} onPress={() => snap('video')} disabled={busy} /> : null}
      <Button kind={video ? 'plain' : 'primary'} title={first ? tr('Snap my {space}', { space: name }) : tr('Snap the after photo')} onPress={() => snap('photo')} disabled={busy} />
      <Button kind="plain" title={video ? tr('Choose a video or photo') : tr('Choose a photo')} onPress={() => snap('library')} disabled={busy} />
    </View>
  );
  const reading = busy ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <ActivityIndicator color={colors.insight} />
      <Text style={{ color: colors.insight, fontSize: 15 }}>{tr('Myra is looking at your {space}…', { space: name })}</Text>
    </View>
  ) : null;
  const privacy = video ? tr('Videos stay on this phone. Faces are blurred before Myra looks.') : tr('Photos of your home stay on this phone.');

  const latest = latestPhoto(photos);
  const hasPins = !!s?.round.changes.some(c => c.spot);
  const pins = hasPins && pinsOn === 'pins' ? s?.round.changes : undefined;

  return (
    <Screen>
      <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>{nameOf(id)}</Text>
      {!s ? (
        <Card>
          <Photo label={tr('Your {space} photo', { space: name })} />
          <MyraSays text={video ? tr('Walk me round, slowly. One full turn.') : tr('Snap it as it is. No tidying first.')} />
          {reading ?? snapButtons(true)}
          {message ? <Note>{message}</Note> : null}
          <Text style={{ color: colors.muted, fontSize: 12 }}>{privacy}</Text>
        </Card>
      ) : (
        <>
          {hasPins && latest ? <Segmented options={[{ label: tr('Changes marked'), value: 'pins' }, { label: tr('Now'), value: 'now' }]} value={pinsOn} onChange={setPinsOn} /> : null}
          {photos.after ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Photo photo={photos.before} label={photos.before ? formatDay(photos.before.at) : tr('Before')} small />
              <Photo photo={photos.after} label={formatDay(photos.after.at)} pins={pins} small />
            </View>
          ) : <Photo photo={latest} label={latest ? formatDay(latest.at) : tr('Photo on another phone')} pins={pins} />}

          {s.round.checks ? <ScoreCard id={id} checks={s.round.checks} potential={s.round.potential} /> : null}

          <Card>
            <MyraSays text={s.round.seen} />
            {s.last ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: colors.insight }}>{tr('{n} of {m}', { n: s.last.kept, m: s.last.of })}</Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>{s.last.at === today ? tr('changes made since your last photo') : tr('changes made since {day}', { day: formatDay(s.last.at) })}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>{s.last ? tr('Next 3 small changes') : tr('3 small changes')} · {tr('{n} done', { n: doneCount(s) })}</Text>
            {s.round.changes.map((c, i) => <Check key={i} checked={!!c.done} onToggle={() => tick(i)} title={`${i + 1}. ${c.text}`} detail={c.where} color={colors.accent} />)}
            <Expandable icon="help-circle-outline" title={tr('Why these?')} color={colors.insight}>
              {s.round.changes.map((c, i) => <Text key={i} style={{ fontSize: 14, color: colors.ink }}><Text style={{ fontWeight: '700' }}>{i + 1}. </Text>{c.why}</Text>)}
            </Expandable>
          </Card>

          <Card>
            {reading ?? (afterDue(s, today)
              ? snapButtons(false)
              : (
                <>
                  <Note>{tr('Snap it again on {day} to see what changed.', { day: formatDay(againOn(s)) })}</Note>
                  <Button kind="plain" title={tr('Snap again now')} onPress={() => snap(video ? 'video' : 'photo')} />
                </>
              ))}
            {message ? <Note>{message}</Note> : null}
          </Card>
        </>
      )}
    </Screen>
  );
}

const RING = [PASTEL.peach, PASTEL.teal, PASTEL.sky, PASTEL.sage, PASTEL.lavender];
const SPACE_RING = [PASTEL.peach, PASTEL.lavender, PASTEL.sand, PASTEL.sky, PASTEL.teal, PASTEL.sage];

/** The Space score (founder, 10 Nov 2026): five checks as rings (decision 0037), the score in the middle, and what the
 *  three changes would bring it to. Kept on its own; not part of My day. */
function ScoreCard({ id, checks, potential }: { id: SpaceId; checks: number[]; potential?: number }) {
  const items: RingItem[] = CHECKS[id].map((label, i) => ({ id: String(i), color: RING[i], label: tr(label), value: (checks[i] ?? 0) / CHECK_MAX }));
  const score = checks.reduce((a, b) => a + b, 0);
  return (
    <Card>
      <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>{tr('{space} score', { space: nameOf(id) })}</Text>
      <RingPanel items={items} score={score} max={100} sub={tr('of 100')} />
      {potential != null && potential > score ? (
        <Text style={{ fontSize: 14, color: colors.insight, fontWeight: '600' }}>{tr('With the 3 changes: {n}', { n: potential })}</Text>
      ) : null}
    </Card>
  );
}
