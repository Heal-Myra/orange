// The top of Today in the Oura-like redesign (decision 0063, changes 1–3): the living Ganga scene, Body · Mind · Soul as
// three thin score circles, then one hero (My day on an arc), Myra's band word in serif, her one line and one button.

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/dates';
import { habitsDue } from '../lib/habits';
import { tr } from '../lib/i18n';
import { nextStep } from '../lib/nextStep';
import { band, type WellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { useSkyHour } from '../lib/sun';
import { useTasks } from '../lib/tasks';
import { colors, font, glass, isLight, space, statusColor } from '../theme';
import { DuskScene } from './DuskScene';
import { emailName, start, what, whyLine } from './MyraPick';
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
      {/* No outline: a faint glass disc whose edge melts into the sky, like Oura's (founder, 19 Nov 2026). */}
      <View style={{ width: D, height: D, alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Svg width={D} height={D} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={`chip-${pillar}`} cx="0.45" cy="0.4" r="0.55">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isLight ? 0.32 : 0.035} />
              <Stop offset="0.8" stopColor="#FFFFFF" stopOpacity={isLight ? 0.42 : 0.06} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={isLight ? 0.55 : 0.075} />
            </RadialGradient>
          </Defs>
          <Circle cx={D / 2} cy={D / 2} r={D / 2} fill={`url(#chip-${pillar})`} />
        </Svg>
        <PillarIcon pillar={pillar} size={19} />
        <Text style={{ fontSize: 25, fontWeight: font.light, color: colors.ink, fontVariant: ['tabular-nums'], lineHeight: 29 }}>{value == null ? '–' : Math.round(value)}</Text>
      </View>
      <Text style={{ fontSize: 15, color: isLight ? colors.ink : 'rgba(255,255,255,0.88)', letterSpacing: 0.3 }}>{label}</Text>
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
      <Path d={arc(1)} stroke={isLight ? colors.muted : "rgba(255,255,255,0.4)"} strokeWidth={1.2} fill="none" />
      {[0.25, 0.5, 0.75].map(f => { const [x, y] = pt(at(f)); return <Circle key={f} cx={x} cy={y - 14} r={2.5} fill={isLight ? colors.muted : "rgba(255,255,255,0.75)"} />; })}
      {v > 0.005 ? <Path d={arc(v)} stroke={colors.ink} strokeWidth={5} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}

const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export function TodayHero({ w }: { w: WellBeing }) {
  const { session } = useAuth();
  const { day, date, profile } = useHeal();
  const { habits, tickHabit } = useTasks();
  const { width } = useWindowDimensions();
  const skyH = useSkyHour(); // the sky follows local sunrise and sunset (founder, 23 Nov 2026)
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
  const word = w.logged ? tr(band(w.total)) : tr('Fresh start');
  // Oura-like presentation (founder, 23 Nov 2026): the one thing to do is the big serif headline, Myra's reason below it.
  const head = habit ? habit.title : step ? what(step.id).replace(/\.$/, '') : isToday ? tr('Rest well') : tr('A look back');
  const named = (t: string) => (who && isToday ? `${who}, ${lc(t)}` : t);
  const reason = habit ? named(tr('One more circle keeps your habit growing.'))
    : step ? named(whyLine(step.id)) : isToday ? tr('A full day. Let the evening be slow.') : sentence;
  const pts = step ? Math.max(1, Math.round(step.gain / 3)) : 0;

  return (
    <View style={{ marginHorizontal: -space.lg, marginTop: -space.md, minHeight: headerH + SCENE - 70 }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><DuskScene height={headerH + SCENE} hour={skyH} width={width} pastel={isLight} /></View>
      <View style={{ flexDirection: 'row', paddingHorizontal: space.md, paddingTop: headerH + 6 }}>
        {PILLARS.map(p => <Chip key={p.tab} pillar={p.tab} value={score(p.tab)} label={tr(p.name)} onPress={() => router.navigate(`/${p.tab}`)} />)}
      </View>
      <View style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: space.xl, gap: 6 }}>
        <Pressable onPress={() => router.push({ pathname: '/trend', params: { card: 'today' } })} accessibilityRole="button" style={{ alignItems: 'center' }}>
          <Arc value={w.total} />
          <Text style={{ fontSize: 88, fontWeight: font.thin, color: colors.ink, lineHeight: 96, fontVariant: ['tabular-nums'], marginTop: 8 }}>{Math.round(w.total)}</Text>
          <Text style={{ fontSize: 13, letterSpacing: 2.6, fontWeight: '700', color: colors.ink, textTransform: 'uppercase' }}>
            {tr('My day')}<Text style={{ color: w.logged ? statusColor(band(w.total)) : colors.ink }}>{'  ·  '}{word}</Text>
          </Text>
        </Pressable>
        <Serif size={head.length > 20 ? 38 : 46} color={colors.ink} style={{ textAlign: 'center', marginTop: 14 }}>{head}</Serif>
        <Text style={{ fontSize: 17, lineHeight: 26, color: colors.ink, textAlign: 'center', maxWidth: 330 }}>
          {reason}{pts ? <Text style={{ color: colors.muted }}>{'  '}{tr('+{n} points', { n: pts })}</Text> : null}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {habit || step ? (
            <Pressable onPress={() => (habit ? tickHabit(habit.id) : start(step!))} accessibilityRole="button"
              style={({ pressed }) => ({ backgroundColor: glass.fillSoft, borderRadius: 99, paddingVertical: 15, paddingHorizontal: 30, opacity: pressed ? 0.8 : 1 })}>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{habit ? tr('Done') : tr('Start now')}</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push({ pathname: '/myra', params: { from: 'today', q: tr('Why this next step?') } })} accessibilityRole="button"
            style={({ pressed }) => ({ backgroundColor: glass.fillSoft, borderRadius: 99, paddingVertical: 15, paddingHorizontal: 26, opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{tr('Ask Myra')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
