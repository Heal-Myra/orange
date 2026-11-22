// Today, the Oura way (founder, 22 Nov 2026): after the score, the habit you are building (seven day circles), then the
// three parts that need the most attention, each with its master's one line and one thing to do right below it.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { FORMING_DAYS, forming, habitDay, habitOn } from '../lib/habits';
import { tr } from '../lib/i18n';
import { band, type WellBeing } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { useTasks } from '../lib/tasks';
import { colors, font, glass } from '../theme';
import { MyraLine, type CardId } from './MyraLine';
import { bestAndConcerns, dayParts } from './TodayRings';
import { CARD_ICON, Card, CardHead, Serif } from './ui';

const go = (tab: string, card: string) => () => router.navigate({ pathname: `/${tab}`, params: { card, at: String(Date.now()) } });

const ask = (q: string) => () => router.push({ pathname: '/myra', params: { from: 'today', q: tr(q) } });

type Kind = 'do' | 'plan' | 'learn';
interface Action { kind: Kind; what: string; icon: keyof typeof Ionicons.glyphMap; min?: number; open: () => void }
const KIND: Record<Kind, string> = { do: 'Do it now', plan: 'Plan for later', learn: 'Learn about it' };

/** What helps each part, by the hour (founder, 22 Nov 2026: not always something to do now; it can be planning, or
 *  learning so the person can improve it later). */
export function actionFor(id: string, hour: number): Action | null {
  const late = hour >= 20 || hour < 4;
  switch (id) {
    case 'food': return late
      ? { kind: 'plan', what: "Plan tomorrow's food", icon: 'calendar-outline', open: go('body', 'food') }
      : { kind: 'do', what: 'Snap your next meal', icon: 'camera-outline', min: 1, open: go('body', 'food') };
    case 'sleep': return late
      ? { kind: 'do', what: 'Wind-down breathing', icon: 'moon-outline', min: 5, open: () => router.push('/breathe') }
      : { kind: 'plan', what: "Set tonight's lights-out time", icon: 'alarm-outline', open: ask('Help me set a lights-out time for tonight.') };
    case 'movement': return hour >= 19 || hour < 4
      ? { kind: 'plan', what: "Plan tomorrow's walk", icon: 'calendar-outline', open: ask('Plan a walk for me tomorrow.') }
      : { kind: 'do', what: 'A brisk walk', icon: 'walk-outline', min: 10, open: go('body', 'movement') };
    case 'tasks': return { kind: 'do', what: 'Finish one to-do', icon: 'checkmark-done-outline', open: go('mind', 'tasks') };
    case 'meditation': return { kind: 'do', what: "Myra's mix", icon: 'flower-outline', min: 10, open: () => router.push('/breathe') };
    case 'phone': return { kind: 'learn', what: 'How phone time affects your day', icon: 'book-outline', min: 1, open: ask('Explain simply how phone time affects my sleep and focus.') };
    case 'gratitude': return { kind: 'do', what: 'Write three good things', icon: 'heart-outline', min: 2, open: go('soul', 'gratitude') };
    case 'wisdom': return { kind: 'do', what: "Read today's verse", icon: 'book-outline', min: 3, open: go('soul', 'wisdom') };
    case 'tao': return { kind: 'do', what: "Today's Tao verse", icon: 'leaf-outline', min: 3, open: go('soul', 'tao') };
    default: return null;
  }
}

function HabitCard() {
  const { days } = useHeal();
  const { habits, tickHabit } = useTasks();
  const today = todayISO();
  const h = [...habits].filter(x => forming(x, today)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!h) {
    return (
      <Card>
        <CardHead icon="repeat-outline" title={tr('A habit to build')} status={tr('None yet')} onPress={() => router.push({ pathname: '/myra', params: { from: 'today', q: tr('Suggest one small habit for me to build.') } })} />
        <Serif size={24}>{tr('Ask Myra for one small habit.')}</Serif>
      </Card>
    );
  }
  const n = Math.min(habitDay(h, today), FORMING_DAYS);
  const week = Array.from({ length: 7 }, (_, i) => shiftISO(today, i - 6));
  const doneToday = (days[today]?.habitsDone ?? []).includes(h.id);
  return (
    <Card>
      <CardHead icon="repeat-outline" title={h.title} status={tr('Day {n} of {m}', { n, m: FORMING_DAYS })} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {week.map(d => {
          const due = habitOn(h, new Date(d + 'T12:00:00')) && d >= h.createdAt.slice(0, 10);
          const done = (days[d]?.habitsDone ?? []).includes(h.id);
          const isToday = d === today;
          const S = 40;
          const base = { width: S, height: S, borderRadius: S / 2, alignItems: 'center' as const, justifyContent: 'center' as const };
          if (done) return <View key={d} style={[base, { backgroundColor: '#F3EEE8' }]}><Ionicons name="checkmark" size={22} color="#1B1A22" /></View>;
          if (isToday) return <Pressable key={d} onPress={() => tickHabit(h.id)} accessibilityLabel={tr('Done')} style={[base, { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.ink }]}><Text style={{ color: colors.ink, fontWeight: '700' }}>{new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</Text></Pressable>;
          if (!due) return <View key={d} style={[base, { borderWidth: 1, borderStyle: 'dashed', borderColor: glass.line }]}><Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</Text></View>;
          return <View key={d} style={[base, { backgroundColor: glass.track }]}><Ionicons name="close" size={20} color={colors.ink} /></View>;
        })}
      </View>
      <Serif size={24} style={{ marginTop: 6 }}>{doneToday ? tr('Done for today. See you tomorrow.') : tr('Tap today\'s circle once it is done.')}</Serif>
    </Card>
  );
}

function AttentionCard({ id, got, of, label }: { id: string; got: number; of: number; label: string }) {
  const a = actionFor(id, new Date().getHours());
  const share = of ? (got / of) * 100 : 0;
  const b = band(share);
  return (
    <Card>
      <CardHead icon={CARD_ICON[id] ?? 'ellipse-outline'} title={tr(label)} status={tr(b)} band={b} onPress={a ? () => go(id === 'food' || id === 'sleep' || id === 'movement' ? 'body' : id === 'tasks' || id === 'meditation' || id === 'phone' ? 'mind' : 'soul', id)() : undefined} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text style={{ fontSize: 48, fontWeight: font.thin, color: colors.ink, lineHeight: 54, fontVariant: ['tabular-nums'] }}>{Math.round(got * 2) / 2}</Text>
        <Text style={{ fontSize: 16, color: colors.muted }}>{tr('of {n}', { n: of })}</Text>
      </View>
      <MyraLine card={id as CardId} />
      {a ? (
        <>
          <View style={{ height: 1, backgroundColor: colors.line, marginTop: 6 }} />
          <Pressable onPress={a.open} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.8 : 1, paddingTop: 4 })}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: glass.fill, borderWidth: 1, borderColor: glass.line, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={a.icon} size={26} color={colors.ink} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>{tr(KIND[a.kind])}</Text>
              <Text style={{ color: colors.ink, fontSize: 18 }} numberOfLines={1}>{tr(a.what)}</Text>
              {a.min ? <Text style={{ color: colors.muted, fontSize: 14 }}>{tr('{n} min', { n: a.min })}</Text> : null}
            </View>
            <Ionicons name={a.kind === 'do' ? 'play-outline' : 'chevron-forward'} size={28} color={colors.ink} />
          </Pressable>
        </>
      ) : null}
    </Card>
  );
}

export function TodayFocus({ w }: { w: WellBeing }) {
  const { concerns } = bestAndConcerns(dayParts(w));
  return (
    <>
      <HabitCard />
      {concerns.length ? <Text style={{ fontSize: 22, color: colors.ink, marginTop: 6 }}>{tr('Needs your attention')}</Text> : null}
      {concerns.map(p => <AttentionCard key={p.id} id={p.id} got={p.got} of={p.of} label={p.label} />)}
    </>
  );
}
