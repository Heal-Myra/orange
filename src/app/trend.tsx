// A card's details and trends (founder, 31 Oct 2026): tap a card's rings to come here. The D · W · M · Q · Y switch
// lives only on this page, so people not interested in trends never see it. D shows today's numbers for this card;
// W, M, Q and Y show the trend of each of this card's measures.

import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { PASTEL, RingKey, RingStack, type RingItem } from '../components/Rings';
import { RangeBar, Trends } from '../components/Trends';
import { Card, Heading, Note, Screen } from '../components/ui';
import { tr } from '../lib/i18n';
import { useRange } from '../lib/range';
import { useHeal } from '../lib/store';
import { METRICS, type Pillar } from '../lib/trends';

/** Which measures belong to which card. */
export const CARD_TRENDS: Record<string, { title: string; pillar: Pillar; ids: string[] }> = {
  today: { title: 'My day', pillar: 'today', ids: ['wellbeing', 'bodyScore', 'mindScore', 'soulScore'] },
  food: { title: 'Food', pillar: 'body', ids: ['kcal', 'protein', 'fibre'] },
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
  const { day, profile } = useHeal();
  // Opens on the week; going back leaves the switch on Day for next time.
  useEffect(() => { setRange('W'); return () => setRange('D'); }, [setRange]);

  const metrics = c.ids.map(id => METRICS.find(m => m.id === id)).filter(Boolean) as typeof METRICS;
  const items: RingItem[] = metrics.map((m, i) => {
    const v = m.value(day, profile), t = m.target?.(profile);
    const max = t ?? (m.unit === 'of 300' ? 300 : m.unit === 'of 100' ? 100 : undefined);
    const show = v == null ? '–' : `${m.decimals ? v.toFixed(m.decimals) : Math.round(v).toLocaleString('en-IN')}${max ? ` / ${max.toLocaleString('en-IN')}` : ''} ${m.unit.startsWith('of ') ? '' : tr(m.unit)}`.trim();
    return { id: m.id, color: COLORS[i % COLORS.length], label: tr(m.name), value: v != null && max ? v / max : v ? 1 : 0, text: show };
  });

  return (
    <Screen showDay={false}>
      <Stack.Screen options={{ title: tr(c.title) }} />
      <RangeBar />
      {range === 'D' ? (
        <Card>
          <Heading>{tr('Today')}</Heading>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <RingStack items={items} center="" size={112} />
            <RingKey items={items} />
          </View>
          <Note>{tr('Choose W, M, Q or Y above to see how this has changed over time.')}</Note>
        </Card>
      ) : <Trends pillar={c.pillar} ids={c.ids} />}
    </Screen>
  );
}
