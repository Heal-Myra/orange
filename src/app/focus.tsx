// Focus check (founder, 16 Nov 2026 idea 6): 2 minutes, once a week. Tap anywhere when an orange light shows; let the
// grey ones pass. Score 0-100, saved in me.focus; the monk follows it month by month.

import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FullScreen } from '../components/FullScreen';
import { todayISO } from '../lib/dates';
import { FOCUS_SECS, SHOW_MS, focusLine, focusScore, makeRound } from '../lib/focusGame';
import { useHeal } from '../lib/store';
import { tr } from '../lib/i18n';
import { colors } from '../theme';

export default function Focus() {
  const { profile, setProfile } = useHeal();
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [ms, setMs] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const round = useMemo(() => makeRound(), []);
  const t0 = useRef(0);
  const taps = useRef<{ hit: Set<number>; falseTaps: number; rts: number[] }>({ hit: new Set(), falseTaps: 0, rts: [] });
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);

  useEffect(() => {
    if (phase !== 'play') return;
    t0.current = Date.now();
    const id = setInterval(() => {
      const e = Date.now() - t0.current;
      setMs(e);
      if (e >= FOCUS_SECS * 1000) { clearInterval(id); finish(); }
    }, 50);
    return () => clearInterval(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const showing = phase === 'play' ? round.findIndex(l => ms >= l.at && ms < l.at + SHOW_MS) : -1;
  const light = showing >= 0 ? round[showing] : null;

  const tap = () => {
    if (phase !== 'play') return;
    const e = Date.now() - t0.current;
    const i = round.findIndex(l => e >= l.at && e < l.at + SHOW_MS);
    if (i >= 0 && round[i].orange && !taps.current.hit.has(i)) { taps.current.hit.add(i); taps.current.rts.push(e - round[i].at); setFlash('hit'); }
    else { taps.current.falseTaps++; setFlash('miss'); }
    setTimeout(() => setFlash(null), 150);
  };

  const finish = () => {
    const shown = round.filter(l => l.at + SHOW_MS <= FOCUS_SECS * 1000);
    const oranges = shown.filter(l => l.orange).length, greys = shown.length - oranges;
    const { hit, falseTaps, rts } = taps.current;
    const s = focusScore(oranges, hit.size, greys, Math.min(falseTaps, greys), rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null);
    setScore(s); setPhase('done');
    if (profile.me) {
      const today = todayISO();
      const others = (profile.me.focus ?? []).filter(r => r.date !== today);
      setProfile({ ...profile, me: { ...profile.me, focus: [...others, { date: today, score: s }] } });
    }
  };

  const left = Math.max(0, FOCUS_SECS - Math.floor(ms / 1000));
  const all = profile.me?.focus ?? [];
  return (
    <FullScreen style={{ backgroundColor: '#1F2A30' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button"><Text style={{ color: '#D6DBDD', fontSize: 16 }}>{tr('Close')}</Text></Pressable>
      </View>
      {phase === 'ready' ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 16 }}>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700' }}>{tr('Focus check')} 🎯</Text>
          <Text style={{ color: '#D6DBDD', fontSize: 17, lineHeight: 24 }}>{tr('Tap anywhere when the orange light appears. Let the grey ones pass. 2 minutes.')}</Text>
          <Pressable onPress={() => setPhase('play')} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 17 }}>{tr('Begin')}</Text>
          </Pressable>
        </View>
      ) : phase === 'play' ? (
        <Pressable onPressIn={tap} style={{ flex: 1 }} accessibilityLabel={tr('Tap when orange')}>
          <View style={{ flex: 1, backgroundColor: flash === 'miss' ? '#2B3439' : 'transparent' }}>
            {light ? <View style={{ position: 'absolute', left: `${light.left * 100}%`, top: `${light.top * 100}%`, width: 56, height: 56, borderRadius: 28,
              backgroundColor: light.orange ? '#E8833F' : '#5D6A70', shadowColor: '#F0A060', shadowOpacity: light.orange ? 0.9 : 0, shadowRadius: 18 }} /> : null}
          </View>
          <Text style={{ color: '#9aa4a8', textAlign: 'center', paddingBottom: 20 }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} {tr('left')}</Text>
        </Pressable>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 }}>
          <Text style={{ color: '#9aa4a8', fontSize: 15 }}>{tr('Your focus this week')}</Text>
          <Text style={{ color: '#fff', fontSize: 72, fontWeight: '800' }}>{score}</Text>
          <Text style={{ color: '#F0A060', fontSize: 17, fontWeight: '600', textAlign: 'center' }}>✦ {tr(...focusLine(all))}</Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 40, marginTop: 16 }}>
            <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 16 }}>{tr('Done')}</Text>
          </Pressable>
        </View>
      )}
    </FullScreen>
  );
}
