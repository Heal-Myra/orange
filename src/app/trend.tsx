// A card's details and trends (founder, 31 Oct 2026): tap a card's rings to come here. The D · W · M · Q · Y switch
// lives only on this page, so people not interested in trends never see it. D shows today's numbers for this card;
// W, M, Q and Y show the trend of each of this card's measures.

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Contributors } from '../components/Rings';
import { MyraLine, type CardId } from '../components/MyraLine';
import { dayParts } from '../components/TodayRings';
import { Serif, Tile } from '../components/ui';
import { band, wellBeing } from '../lib/scoring';
import { colors, font, isGlass, statusColor } from '../theme';
import { shiftISO } from '../lib/dates';
import { PASTEL, RingKey, RingStack, type RingItem } from '../components/Rings';
import { RangeBar, Trends } from '../components/Trends';
import { Button, Card, DayBar, Heading, Note, Screen } from '../components/ui';
import { formatDay, todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { useRange } from '../lib/range';
import { useHeal } from '../lib/store';
import { METRICS, type Pillar } from '../lib/trends';

/** Which measures belong to which card. */
export const CARD_TRENDS: Record<string, { title: string; pillar: Pillar; ids: string[] }> = {
  today: { title: 'My day', pillar: 'today', ids: ['wellbeing', 'bodyScore', 'mindScore', 'soulScore'] },
  food: { title: 'Food', pillar: 'body', ids: ['kcal', 'carbs', 'protein', 'fibre', 'fat'] },
  sleep: { title: 'Sleep', pillar: 'body', ids: ['sleep'] },
  movement: { title: 'Movement', pillar: 'body', ids: ['steps', 'active'] },
  body: { title: 'Body', pillar: 'body', ids: ['weight', 'restingHr'] },
  tasks: { title: 'Clear your mind', pillar: 'mind', ids: ['focus'] },
  meditation: { title: 'Breathing & meditation', pillar: 'mind', ids: ['meditation'] },
  phone: { title: 'Phone activity', pillar: 'mind', ids: ['social'] },
  gratitude: { title: 'Gratitude journal', pillar: 'soul', ids: ['gratitude'] },
  wisdom: { title: 'Daily Wisdom', pillar: 'soul', ids: ['wisdom'] },
  tao: { title: 'Tao practice', pillar: 'soul', ids: ['tao'] },
};

const COLORS = [PASTEL.peach, PASTEL.lavender, PASTEL.teal, PASTEL.sky];

export default function TrendPage() {
  const { card } = useLocalSearchParams<{ card?: string }>();
  const c = CARD_TRENDS[String(card ?? '')] ?? CARD_TRENDS.today;
  const { range, setRange } = useRange();
  const { day, date, profile } = useHeal();
  // Opens on the week; going back leaves the switch on Day for next time.
  // Only once when the page opens (setRange changes on every switch, so it must not be a dependency).
  const setRef = useRef(setRange); setRef.current = setRange;
  useEffect(() => { setRef.current('W'); return () => setRef.current('D'); }, []);

  const metrics = c.ids.map(id => METRICS.find(m => m.id === id)).filter(Boolean) as typeof METRICS;
  const items: RingItem[] = metrics.map((m, i) => {
    const v = m.value(day, profile), t = m.target?.(profile);
    const max = t ?? (m.unit === 'of 300' ? 300 : m.unit === 'of 100' ? 100 : undefined);
    const show = v == null ? '–' : `${m.decimals ? v.toFixed(m.decimals) : Math.round(v).toLocaleString('en-IN')}${max ? ` / ${max.toLocaleString('en-IN')}` : ''} ${m.unit.startsWith('of ') ? '' : tr(m.unit)}`.trim();
    return { id: m.id, color: COLORS[i % COLORS.length], label: tr(m.name), value: v != null && max ? v / max : v ? 1 : 0, text: show };
  });

  if (isGlass) return <DetailPage cardId={String(card ?? 'today')} items={items} />;

  return (
    <Screen noBanner>
      <Stack.Screen options={{ title: tr(c.title) }} />
      <RangeBar />
      {range === 'D' ? (
        <>
        <DayBar />
        <Card>
          <Heading>{date === todayISO() ? tr('Today') : formatDay(date)}</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <RingStack items={items} center="" size={112} />
            <RingKey items={items} />
          </View>
          {date !== todayISO() ? <Button title={tr('Open this day to see or change it')} onPress={() => router.navigate(c.pillar === 'today' ? '/' : `/${c.pillar}`)} /> : null}
          <Note>{tr('Use ‹ › to look at an earlier day. Choose W, M, Q or Y above to see how this has changed over time.')}</Note>
        </Card>
        </>
      ) : <Trends pillar={c.pillar} ids={c.ids} />}
    </Screen>
  );
}

/** The Oura-like detail page (decision 0063, change 6): the week's chart first with ‹ Yesterday · Today ›, then the score
 *  and its band word, the master's one line in serif, what made the score as bars, key numbers as tiles, then trends. */
function DetailPage({ cardId, items }: { cardId: string; items: RingItem[] }) {
  const c = CARD_TRENDS[cardId] ?? CARD_TRENDS.today;
  const { day, days, date, profile, goDay } = useHeal();
  const { range } = useRange();
  const w = wellBeing(day, profile);
  const part = dayParts(w).find(p => p.id === cardId);
  const score = cardId === 'today' ? Math.round(w.total) : part ? part.got : null;
  const max = cardId === 'today' ? 100 : part?.of ?? null;
  const share = score != null && max ? (score / max) * 100 : null;
  const b = share == null || (cardId === 'today' ? !w.logged : !part?.got) ? null : band(share);

  // The week ending on the open day, for this card's first measure.
  const m = METRICS.find(x => x.id === c.ids[0]);
  const week = Array.from({ length: 7 }, (_, i) => shiftISO(date, i - 6));
  const vals = week.map(d => (m && days[d] ? m.value(days[d], profile) : null));
  const target = m?.target?.(profile);
  const top = Math.max(1, target ?? 0, ...vals.map(v => v ?? 0)) * 1.15;
  const got = vals.filter((v): v is number => v != null);
  const show = (v: number) => (m?.decimals ? v.toFixed(m.decimals) : Math.round(v).toLocaleString('en-IN'));
  const unit = m && !m.unit.startsWith('of ') ? ` ${tr(m.unit)}` : '';
  const isToday = date === todayISO();
  const W = 340, H = 150, bw = 30, gap = (W - bw * 7) / 6;

  return (
    <Screen noBanner>
      <Stack.Screen options={{ title: tr(c.title) }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
        <Pressable onPress={() => goDay(-1)} hitSlop={10}><Text style={{ color: colors.muted, fontSize: 17 }}>‹ {isToday ? tr('Yesterday') : formatDay(shiftISO(date, -1))}</Text></Pressable>
        <View style={{ borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingBottom: 4 }}><Text style={{ color: colors.ink, fontSize: 18 }}>{isToday ? tr('Today') : formatDay(date)}</Text></View>
        {isToday ? <View style={{ width: 60 }} /> : <Pressable onPress={() => goDay(1)} hitSlop={10}><Text style={{ color: colors.muted, fontSize: 17 }}>{tr('Next')} ›</Text></Pressable>}
      </View>
      {m ? (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {target ? <Line x1="0" x2={W} y1={H - (target / top) * H} y2={H - (target / top) * H} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 5" /> : null}
            {vals.map((v, i) => {
              const h = v ? Math.max(4, (v / top) * H) : 6;
              return <Rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={6} fill={v ? (i === 6 ? '#9CC7EE' : 'rgba(156,199,238,0.55)') : 'rgba(255,255,255,0.12)'} />;
            })}
          </Svg>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
            {week.map(d => <Text key={d} style={{ color: colors.muted, fontSize: 12, width: 36, textAlign: 'center' }}>{new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</Text>)}
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{tr(m.name)}{target ? ` · ${tr('dotted line: your goal')}` : ''}</Text>
        </View>
      ) : null}
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
        <Text style={{ fontSize: 76, fontWeight: font.thin, color: colors.ink, lineHeight: 84, fontVariant: ['tabular-nums'] }}>{score == null ? '–' : Math.round(score * 2) / 2}</Text>
        <Text style={{ fontSize: 15, letterSpacing: 2, fontWeight: '700', color: b ? statusColor(b) : colors.muted, textTransform: 'uppercase' }}>{b ? tr(b) : max ? tr('of {n}', { n: max }) : ''}</Text>
      </View>
      {(['food', 'sleep', 'movement', 'tasks', 'meditation', 'phone', 'gratitude', 'wisdom', 'tao'] as string[]).includes(cardId)
        ? <MyraLine card={cardId as CardId} />
        : <Serif size={28}>{b ? tr(b) : tr('Fresh start')}</Serif>}
      <Text style={{ fontSize: 24, color: colors.ink, marginTop: 8 }}>{tr('What made this score')}</Text>
      <Contributors items={items} />
      {m && got.length ? (
        <>
          <Text style={{ fontSize: 24, color: colors.ink, marginTop: 8 }}>{tr('This week')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Tile label={tr('Average')} value={`${show(got.reduce((a, x) => a + x, 0) / got.length)}${unit}`} />
            <Tile label={tr('Best day')} value={`${show(Math.max(...got))}${unit}`} />
            <Tile label={tr('Days logged')} value={`${got.length} / 7`} />
            {target ? <Tile label={tr('Days on goal')} value={`${got.filter(v => (m.better === 'down' ? v <= target : v >= target)).length} / 7`} /> : null}
          </View>
        </>
      ) : null}
      <Text style={{ fontSize: 24, color: colors.ink, marginTop: 8 }}>{tr('Over time')}</Text>
      <RangeBar />
      {range === 'D' ? <Note>{tr('Choose W, M, Q or Y above to see how this has changed over time.')}</Note> : <Trends pillar={c.pillar} ids={c.ids} />}
    </Screen>
  );
}
