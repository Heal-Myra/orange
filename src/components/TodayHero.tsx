// The top of Today in the Oura-like redesign (decision 0063, changes 1–3): the living Ganga scene, Body · Mind · Soul as
// three thin score circles, then one hero (My day on an arc), Myra's band word in serif, her one line and one button.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/dates';
import { habitsDue } from '../lib/habits';
import { tr } from '../lib/i18n';
import { nextStep } from '../lib/nextStep';
import { band, type WellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { useTasks } from '../lib/tasks';
import { colors, font, space, statusColor } from '../theme';
import { DuskScene } from './DuskScene';
import { emailName, start, what } from './MyraPick';
import { Serif } from './ui';
import { PillarIcon } from './PillarIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCENE = 620;
const PILLARS = [
  { tab: 'body', name: 'Body', color: colors.body },
  { tab: 'mind', name: 'Mind', color: colors.mind },
  { tab: 'soul', name: 'Soul', color: colors.soul },
] as const;

/** A score circle like Oura's top row: soft glass, the pillar's mark above a thin number, the name below. No coloured ring:
 *  it blends into the scene (founder, 19 Nov 2026). */
function Chip({ pillar, value, label, onPress }: { pillar: 'body' | 'mind' | 'soul'; value: number | null; label: string; onPress: () => void }) {
  const D = 74;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value == null ? '–' : Math.round(value)}/100`}
      style={({ pressed }) => ({ alignItems: 'center', gap: 10, flex: 1, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ width: D, height: D, borderRadius: D / 2, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <PillarIcon pillar={pillar} size={19} />
        <Text style={{ fontSize: 25, fontWeight: font.light, color: colors.ink, fontVariant: ['tabular-nums'], lineHeight: 29 }}>{value == null ? '–' : Math.round(value)}</Text>
      </View>
      <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', letterSpacing: 0.3 }}>{label}</Text>
    </Pressable>
  );
}

/** The arc gauge above the hero number, 0 to 100 (an upper arc, like Oura's calorie gauge). */
function Arc({ value }: { value: number }) {
  const W = 320, R = 140, cx = W / 2, cy = 152;
  const a0 = (165 * Math.PI) / 180, a1 = (15 * Math.PI) / 180;
  const pt = (a: number) => [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  const at = (f: number) => a0 + (a1 - a0) * f;
  const arc = (f: number) => { const [x0, y0] = pt(a0); const [x1, y1] = pt(at(f)); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  const v = Math.max(0, Math.min(1, value / 100));
  return (
    <Svg width={W} height={124} viewBox={`0 0 ${W} 124`} style={{ marginBottom: -70 }}>
      <Path d={arc(1)} stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} fill="none" />
      {[0.25, 0.5, 0.75].map(f => { const [x, y] = pt(at(f)); return <Circle key={f} cx={x} cy={y - 14} r={2.5} fill="rgba(255,255,255,0.75)" />; })}
      {v > 0.005 ? <Path d={arc(v)} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}

export function TodayHero({ w }: { w: WellBeing }) {
  const { session } = useAuth();
  const { day, date, profile } = useHeal();
  const { habits, tickHabit } = useTasks();
  const { width } = useWindowDimensions();
  // The header is see-through on Today (its standard height: 44 on iPhone, 56 on Android, 64 on the web).
  const headerH = useSafeAreaInsets().top + (Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 56 : 64);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 60_000); return () => clearInterval(t); }, []);
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const isToday = date === todayISO();
  const who = profile.me?.name?.trim().split(/\s+/)[0] || emailName(session?.user.email);
  const score = (t: 'body' | 'mind' | 'soul') => (w[t] ? w[t]!.total : null);

  // Myra's one thing: a habit due now first, else the step with the most to win at this hour (decision 0040).
  const habit = isToday ? habitsDue(habits, day.habitsDone ?? [])[0] : undefined;
  const step = isToday && !habit ? nextStep(day, profile, w, hour) : null;
  const sentence = habit ? habit.title : step ? what(step.id) : isToday ? tr('a full day. Rest well.') : tr('A look back at this day. Tap the circles below to see each part.');
  const line = who && isToday ? `${who}, ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}` : sentence;
  const word = w.logged ? tr(band(w.total)) : tr('Fresh start');

  return (
    <View style={{ marginHorizontal: -space.lg, marginTop: -space.md, minHeight: headerH + SCENE - 70 }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><DuskScene height={headerH + SCENE} hour={hour} width={width} /></View>
      <View style={{ flexDirection: 'row', paddingHorizontal: space.md, paddingTop: headerH + 6 }}>
        {PILLARS.map(p => <Chip key={p.tab} pillar={p.tab} value={score(p.tab)} label={tr(p.name)} onPress={() => router.navigate(`/${p.tab}`)} />)}
      </View>
      <View style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: space.xl, gap: 6 }}>
        <Pressable onPress={() => router.push({ pathname: '/trend', params: { card: 'today' } })} accessibilityRole="button" style={{ alignItems: 'center' }}>
          <Arc value={w.total} />
          <Text style={{ fontSize: 12, letterSpacing: 2.4, fontWeight: '700', color: colors.ink, textTransform: 'uppercase' }}>{tr('My day')}</Text>
          <Text style={{ fontSize: 76, fontWeight: font.thin, color: colors.ink, lineHeight: 84, fontVariant: ['tabular-nums'] }}>{Math.round(w.total)}</Text>
        </Pressable>
        <Serif size={52} color={w.logged ? statusColor(band(w.total)) : colors.ink} style={{ textAlign: 'center' }}>{word}</Serif>
        <Text style={{ fontSize: 17, lineHeight: 25, color: 'rgba(255,255,255,0.9)', textAlign: 'center', maxWidth: 320 }}>
          {line}{step ? <Text style={{ color: colors.muted }}>{'  '}{tr('+{n} points', { n: Math.max(1, Math.round(step.gain / 3)) })}</Text> : null}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {habit || step ? (
            <Pressable onPress={() => (habit ? tickHabit(habit.id) : start(step!))} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: 'rgba(18,16,22,0.38)', borderRadius: 99, paddingVertical: 15, paddingHorizontal: 30, opacity: pressed ? 0.8 : 1 })}>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{habit ? tr('Done') : tr('Start now')}</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', q: tr('Why this next step?') } })} accessibilityRole="button"
            style={({ pressed }) => ({ backgroundColor: 'rgba(18,16,22,0.38)', borderRadius: 99, paddingVertical: 15, paddingHorizontal: 26, opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{tr('Why, Myra?')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
