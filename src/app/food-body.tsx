// "Food and your body" (founder, 26 Nov 2026; decision 0067): like Oura's Daytime Stress, with meal photos pinned on
// the day's heart-rate line. Heart rate comes from Apple Health, from the Oura ring or a Watch. Linked, never "caused".
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, Switch, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Card, Screen, Serif } from '../components/ui';
import { shiftISO, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { afterMeal, mealsOf, patterns, SLOTS, type MealMark } from '../lib/mealEcho';
import { useMealThumbs } from '../lib/mealThumbs';
import { useHeal } from '../lib/store';
import { colors, glass } from '../theme';

const H = 220, PAD = 8;
const LEVELS = ['Calm', 'Steady', 'Busy', 'Working hard'];
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayName = (iso: string) => {
  if (iso === todayISO()) return tr('Today');
  if (iso === shiftISO(todayISO(), -1)) return tr('Yesterday');
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

export default function FoodBody() {
  const { days } = useHeal();
  const thumbs = useMealThumbs();
  const { width } = useWindowDimensions();
  const [date, setDate] = useState(todayISO());
  const [showMove, setShowMove] = useState(true);
  const [showMeals, setShowMeals] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const W = Math.min(width, 520) - 24;

  const d = days[date];
  const hr = d?.health?.hr15 ?? [];
  const steps = d?.health?.steps15 ?? [];
  const hasHr = hr.some(v => v != null);
  const meals = useMemo(() => mealsOf(d), [d]);
  const resting = d?.health?.restingHr ?? Math.min(...(hr.filter((v): v is number => v != null)), 70);
  const lo = Math.max(35, resting - 8), hi = resting + 60;
  const y = (v: number) => H - 14 - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 28);
  const firstSlot = Math.max(0, hr.findIndex(v => v != null) - 2), lastSlot = Math.min(SLOTS - 1, (() => { for (let i = hr.length - 1; i >= 0; i--) if (hr[i] != null) return i + 2; return SLOTS - 1; })());
  const sx = (slot: number) => PAD + ((slot - firstSlot) / Math.max(1, lastSlot - firstSlot)) * (W - 2 * PAD); // the measured part fills the width

  // The line breaks where nothing was measured, like Oura's dotted gaps.
  const runs: string[] = [];
  let cur: string[] = [];
  hr.forEach((v, i) => { if (v == null || i < firstSlot || i > lastSlot) { if (cur.length > 1) runs.push(cur.join(' ')); cur = []; } else cur.push(`${sx(i).toFixed(1)},${y(v).toFixed(1)}`); });
  if (cur.length > 1) runs.push(cur.join(' '));
  const maxSteps = Math.max(400, ...steps);

  const sel: MealMark | undefined = meals.find(m => m.at === picked) ?? [...meals].reverse().find(m => afterMeal(days, date, m).hrDelta != null) ?? meals[meals.length - 1];
  const echo = sel ? afterMeal(days, date, sel) : null;
  const pats = useMemo(() => patterns(days, todayISO()), [days]);
  const levelY = [resting + 5, resting + 17, resting + 35, resting + 52];

  return (
    <Screen feedback="Food and your body">
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
        <Pressable onPress={() => { setDate(shiftISO(date, -1)); setPicked(null); }} hitSlop={10} accessibilityLabel={tr('Previous day')}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '500' }}>{dayName(date)}</Text>
        <Pressable disabled={date >= todayISO()} onPress={() => { setDate(shiftISO(date, 1)); setPicked(null); }} hitSlop={10} accessibilityLabel={tr('Next day')}>
          <Ionicons name="chevron-forward" size={22} color={date >= todayISO() ? colors.line : colors.ink} />
        </Pressable>
      </View>

      {hasHr ? (
        <View>
          <Svg width={W} height={H}>
            {levelY.map((v, i) => <Line key={i} x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke={glass.line} strokeWidth={0.6} />)}
            {showMove ? steps.map((s, i) => (i < firstSlot || i > lastSlot || !s ? null :
              <Rect key={i} x={sx(i) - 1.6} y={H - 14 - (s / maxSteps) * (H * 0.5)} width={3.2} height={(s / maxSteps) * (H * 0.5)} fill={glass.track} />)) : null}
            {runs.map((p, i) => <Polyline key={i} points={p} fill="none" stroke={colors.ink} strokeOpacity={0.75} strokeWidth={1.4} />)}
            {hr.map((v, i) => (v == null || i % 2 || i < firstSlot || i > lastSlot ? null : <Circle key={i} cx={sx(i)} cy={y(v)} r={2.2} fill={colors.ink} />))}
            {LEVELS.map((l, i) => <SvgText key={l} x={W - PAD - 2} y={y(levelY[i]) - 4} fill={colors.muted} fontSize={10.5} textAnchor="end">{tr(l)}</SvgText>)}
          </Svg>
          {showMeals ? (
            <View style={{ height: 40 }}>
              {meals.filter(m => m.slot >= firstSlot && m.slot <= lastSlot).map(m => (
                <Pressable key={m.at} onPress={() => setPicked(m.at)} accessibilityLabel={`${m.name} ${clock(m.at)}`}
                  style={{ position: 'absolute', left: sx(m.slot) - 16, top: 4, width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 2,
                    borderColor: sel?.at === m.at ? colors.ink : glass.line, backgroundColor: glass.fill, alignItems: 'center', justifyContent: 'center' }}>
                  {thumbs[m.at] ? <Image source={{ uri: thumbs[m.at] }} style={{ width: 32, height: 32 }} /> : <Ionicons name="restaurant-outline" size={15} color={colors.ink} />}
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PAD }}>
            {[firstSlot, Math.round((firstSlot + lastSlot) / 2), lastSlot].map(s => (
              <Text key={s} style={{ color: colors.muted, fontSize: 12 }}>{new Date(2000, 0, 1, 0, s * 15).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
            ))}
          </View>
        </View>
      ) : (
        <Card>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{tr('No heart rate for this day yet')}</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 }}>
            {tr('With an Oura ring: in the Oura app open Settings, Data Sharing, Apple Health and switch on Heart rate. A Watch works too.')}
          </Text>
        </Card>
      )}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: 16 }}>{tr('Movement')}</Text>
          <Switch value={showMove} onValueChange={setShowMove} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: colors.ink, fontSize: 16 }}>{tr('Meals')}</Text>
          <Switch value={showMeals} onValueChange={setShowMeals} />
        </View>
        {meals.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {meals.map(m => (
              <Pressable key={m.at} onPress={() => setPicked(m.at)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: sel?.at === m.at ? glass.trackFill : glass.track }}>
                <Text style={{ color: sel?.at === m.at ? colors.bg : colors.ink, fontSize: 14 }}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => router.navigate({ pathname: '/body', params: { card: 'food', at: String(Date.now()) } })} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>{tr('No meal photos this day. Snap your next meal to see what it does.')}</Text>
          </Pressable>
        )}
      </Card>

      {sel && echo ? (
        <Card>
          <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>{tr('AFTER THIS MEAL')}</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', backgroundColor: glass.fill, alignItems: 'center', justifyContent: 'center' }}>
              {thumbs[sel.at] ? <Image source={{ uri: thumbs[sel.at] }} style={{ width: 44, height: 44 }} /> : <Ionicons name="restaurant-outline" size={20} color={colors.ink} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 16 }}>{sel.name} · {clock(sel.at)}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                {echo.hrDelta == null ? tr('Too early to tell: I need a few more days of heart rate.')
                  : Math.abs(echo.hrDelta) < 3 ? tr('Heart stayed close to your usual for the next 3 h.')
                  : echo.hrDelta > 0 ? tr('Heart stayed {n} beats above your usual for the next 3 h.', { n: echo.hrDelta })
                  : tr('Heart stayed {n} beats below your usual for the next 3 h.', { n: -echo.hrDelta })}
              </Text>
            </View>
          </View>
          {echo.dinner && echo.deepMin != null && echo.deepUsualMin != null ? (
            <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 12 }}>
              {Math.abs(echo.deepMin - echo.deepUsualMin) < 8 ? tr('Deep sleep that night: {n} min, about your usual.', { n: echo.deepMin })
                : echo.deepMin < echo.deepUsualMin ? tr('Deep sleep that night: {n} min, {d} min less than your usual.', { n: echo.deepMin, d: echo.deepUsualMin - echo.deepMin })
                : tr('Deep sleep that night: {n} min, {d} min more than your usual.', { n: echo.deepMin, d: echo.deepMin - echo.deepUsualMin })}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={{ color: colors.muted, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>{tr('YOUR PATTERN · 4 WEEKS')}</Text>
        {pats.length ? pats.map(p => (
          <View key={p.id} style={{ marginTop: 8 }}>
            <Serif size={28}>{p.id === 'dinnerTime' ? (p.better === 'early' ? tr('Early dinners, deeper sleep') : tr('Later dinners suit your sleep'))
              : p.better === 'light' ? tr('Lighter dinners, more deep sleep') : tr('Fuller dinners, more deep sleep')}</Serif>
            <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 4 }}>
              {p.id === 'dinnerTime'
                ? tr('On days you ate dinner {when} 8 pm, your sleep score was {n} points higher.', { when: p.better === 'early' ? tr('before') : tr('after'), n: p.diff })
                : tr('After {kind} dinners you had {n} more minutes of deep sleep.', { kind: p.better === 'light' ? tr('lighter') : tr('fuller'), n: p.diff })}
            </Text>
          </View>
        )) : (
          <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22, marginTop: 8 }}>{tr('Too early to tell. Snap your dinners for two to three weeks and your patterns appear here.')}</Text>
        )}
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 }}>{tr('These show what goes together on your days, not what causes what.')}</Text>
      </Card>
    </Screen>
  );
}
