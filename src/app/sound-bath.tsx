// Sound bath (founder, 13 Nov 2026): choose up to two sounds and a length, then a dark, quiet screen with a glowing
// bowl. The minutes count as meditation. Opened from Mind › Meditation and from the Sleep card at night
// (?sleep=1: rain and "until I sleep" chosen for you).

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, Note } from '../components/ui';
import { tr } from '../lib/i18n';
import { addSession } from '../lib/medSessions';
import { Bath, LENGTHS, SLEEP_MAX, SOUNDS, type SoundId } from '../lib/soundBath';
import { useHeal } from '../lib/store';
import { colors } from '../theme';

const chip = (on: boolean) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
  borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent : colors.surface });

export default function SoundBathScreen() {
  const { sleep } = useLocalSearchParams<{ sleep?: string }>();
  const [picked, setPicked] = useState<SoundId[]>(sleep ? ['rain'] : ['bowls']);
  const [len, setLen] = useState<number>(sleep ? 0 : 20);
  const [playing, setPlaying] = useState(false);
  const toggle = (id: SoundId) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id].slice(-2)));
  if (playing) return <Playing ids={picked} minutes={len || SLEEP_MAX} onIds={setPicked} />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: tr('Sound bath') }} />
      <Card style={{ gap: 12 }}>
        <Note>{tr('Lie down, close your eyes, let the sound wash over you.')}</Note>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SOUNDS.map(s => (
            <Pressable key={s.id} onPress={() => toggle(s.id)} style={chip(picked.includes(s.id))} accessibilityRole="checkbox" accessibilityState={{ checked: picked.includes(s.id) }}>
              <Text style={{ color: picked.includes(s.id) ? '#fff' : colors.ink, fontWeight: '600' }}>{s.icon} {tr(s.name)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Pick one, or mix two.')}</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('How long')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LENGTHS.map(n => (
            <Pressable key={n} onPress={() => setLen(n)} style={chip(len === n)}>
              <Text style={{ color: len === n ? '#fff' : colors.ink, fontWeight: '600' }}>{n ? tr('{n} min', { n }) : tr('Until I sleep')}</Text>
            </Pressable>
          ))}
        </View>
        <Button title={tr('Begin')} disabled={!picked.length} onPress={() => setPlaying(true)} />
        <Note>{tr('Counts as meditation minutes. It fades out slowly at the end so it does not wake you.')}</Note>
      </Card>
    </ScrollView>
  );
}

function Playing({ ids, minutes, onIds }: { ids: SoundId[]; minutes: number; onIds: (ids: SoundId[]) => void }) {
  useKeepAwake();
  const { update } = useHeal();
  const [left, setLeft] = useState(minutes * 60);
  const [paused, setPaused] = useState(false);
  const bath = useRef<Bath | null>(null);
  const name = ids.map(id => tr(SOUNDS.find(s => s.id === id)!.name)).join(' + ');
  useEffect(() => {
    let leaving = false; // the screen was closed: save the minutes, do not navigate again
    const b = new Bath(minutes, l => setLeft(l), played => {
      if (played > 0) update(d => addSession(d, 'sound', 'Sound bath', played));
      if (!leaving) router.back();
    });
    bath.current = b;
    b.start(ids);
    return () => { leaving = true; b.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bath.current?.setSounds(ids); }, [ids]);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const pill = (label: string, on: boolean, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: on ? '#E0773A' : '#34424A' }}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#1F2A30', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: '#E9A15A', opacity: paused ? 0.35 : 0.8, shadowColor: '#F0A060', shadowOpacity: 0.9, shadowRadius: 50 }} />
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', marginTop: 18 }}>{name}</Text>
      <Text style={{ color: '#9aa4a8' }}>{tr('{t} left · fades out at the end', { t: mm })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22 }}>
        {SOUNDS.map(s => pill(`${s.icon} ${tr(s.name)}`, ids.includes(s.id), () => onIds(ids.includes(s.id) ? (ids.length > 1 ? ids.filter(x => x !== s.id) : ids) : [...ids, s.id].slice(-2))))}
      </View>
      <Text style={{ color: '#9aa4a8', fontSize: 12.5 }}>{tr('Mix up to two sounds')}</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 26 }}>
        {pill(paused ? `▶ ${tr('Resume')}` : `⏸ ${tr('Pause')}`, false, () => { if (paused) bath.current?.resume(); else bath.current?.pause(); setPaused(p => !p); })}
        {pill(`✕ ${tr('End')}`, false, () => bath.current?.stop())}
      </View>
    </View>
  );
}
