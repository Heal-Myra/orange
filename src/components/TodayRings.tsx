// Today's well-being card in the same design as every other card (founder, 31 Oct 2026; decision 0037):
// concentric rings for the best part of the day and the three biggest concerns, the total out of 100 in the middle,
// the key at the side, and Myra's recommendation at the bottom of the card.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { band, POINTS, type WellBeing } from '../lib/scoring';
import { colors } from '../theme';
import { MyraPick } from './MyraPick';
import { PASTEL, RingStack, RingTap, fmt, type RingItem } from './Rings';
import { Card } from './ui';

interface Part { id: string; label: string; got: number; of: number; color: string; tab: 'body' | 'mind' | 'soul'; card: string }

/** Every scored part of the day, with its points. Parts not logged yet count as 0. */
export function dayParts(w: WellBeing): Part[] {
  const b = w.body, m = w.mind, s = w.soul;
  return [
    { id: 'food', label: 'Food', got: b?.nutrition ?? 0, of: POINTS.food, color: PASTEL.peach, tab: 'body', card: 'food' },
    { id: 'sleep', label: 'Sleep', got: b?.sleep ?? 0, of: POINTS.sleep, color: PASTEL.lavender, tab: 'body', card: 'sleep' },
    { id: 'movement', label: 'Movement', got: b?.movement ?? 0, of: POINTS.movement, color: PASTEL.sage, tab: 'body', card: 'movement' },
    { id: 'tasks', label: 'To-dos', got: m?.practices ?? 0, of: POINTS.focus, color: PASTEL.teal, tab: 'mind', card: 'tasks' },
    { id: 'meditation', label: 'Breathing', got: m?.meditation ?? 0, of: POINTS.meditation, color: PASTEL.sky, tab: 'mind', card: 'meditation' },
    { id: 'phone', label: 'Phone', got: m?.content ?? 0, of: POINTS.phone, color: PASTEL.sand, tab: 'mind', card: 'phone' },
    { id: 'gratitude', label: 'Gratitude', got: (s?.gratitude ?? 0) + (s?.love ?? 0), of: POINTS.gratitude + POINTS.love, color: PASTEL.rose, tab: 'soul', card: 'gratitude' },
    { id: 'wisdom', label: 'Daily Wisdom', got: s?.verse ?? 0, of: POINTS.wisdom, color: PASTEL.sand, tab: 'soul', card: 'wisdom' },
    { id: 'tao', label: 'Tao', got: s?.tao ?? 0, of: POINTS.tao, color: PASTEL.sage, tab: 'soul', card: 'tao' },
  ];
}

/** The best part (highest share) and the three biggest concerns (lowest shares, not full). */
export function bestAndConcerns(parts: Part[]): { best: Part | null; concerns: Part[] } {
  const share = (p: Part) => p.got / p.of;
  const sorted = [...parts].sort((a, b) => share(b) - share(a));
  const best = sorted[0] && share(sorted[0]) > 0 ? sorted[0] : null;
  const concerns = [...parts].filter(p => p !== best && share(p) < 1).sort((a, b) => share(a) - share(b)).slice(0, 3);
  return { best, concerns };
}

/** My day (founder, 31 Oct 2026): the total in the middle of three rings, Body, Mind and Soul; at the side Myra's one
 *  recommendation with the points it can add (decision 0040). The details live in each tab and in the circles below. */
export function TodayRings({ w }: { w: WellBeing }) {
  const P: { id: 'body' | 'mind' | 'soul'; label: string; color: string }[] = [
    { id: 'body', label: 'Body', color: PASTEL.sage }, { id: 'mind', label: 'Mind', color: PASTEL.teal }, { id: 'soul', label: 'Soul', color: PASTEL.peach },
  ];
  const v = (id: 'body' | 'mind' | 'soul') => Math.round((id === 'body' ? w.body?.total : id === 'mind' ? w.mind?.total : w.soul?.total) ?? 0);
  const items: RingItem[] = P.map(p => ({ id: p.id, color: p.color, label: tr(p.label), value: v(p.id) / 100 }));
  return (
    // Compact so all of Today fits on one screen (founder, 1 Nov 2026).
    <Card style={{ gap: 6, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{tr('My day')}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{w.logged ? tr(band(w.total)) : tr('Nothing logged yet')}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <RingTap trend="today"><RingStack items={items} center={fmt(w.total)} sub={tr('of {n}', { n: 100 })} size={124} /></RingTap>
        {/* A thin line between the score and Myra (founder, 31 Oct 2026, like option 2). */}
        <View style={{ width: 1, alignSelf: 'stretch', marginVertical: 12, backgroundColor: colors.line }} />
        <MyraPick w={w} />
      </View>
    </Card>
  );
}

/** Body, Mind and Soul as three small ring circles (founder, 31 Oct 2026: circles with concentric rings instead of
 *  rectangular tiles). Each ring is one part of that pillar; the pillar's score sits in the middle. Tap to open the tab. */
export function PillarRings({ w }: { w: WellBeing }) {
  const parts = dayParts(w);
  const pillars: { tab: 'body' | 'mind' | 'soul'; name: string; score: number | null }[] = [
    { tab: 'body', name: 'Body', score: w.body ? w.body.total : null },
    { tab: 'mind', name: 'Mind', score: w.mind ? w.mind.total : null },
    { tab: 'soul', name: 'Soul', score: w.soul ? w.soul.total : null },
  ];
  return (
    // One white card with a fine line between the three (founder, 1 Nov 2026), like the line between the score and Myra.
    <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 22, paddingVertical: 2 }}>
      {pillars.map((p, i) => {
        const mine = parts.filter(x => x.tab === p.tab);
        const items: RingItem[] = mine.map(x => ({ id: x.id, color: x.color, label: tr(x.label), value: x.got / x.of }));
        return (
          <View key={p.tab} style={{ flex: 1, flexDirection: 'row' }}>
          {i > 0 ? <View style={{ width: 1, marginVertical: 18, backgroundColor: colors.line }} /> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={`${tr(p.name)}: ${p.score == null ? '–' : Math.round(p.score)}/100`}
            onPress={() => router.navigate(`/${p.tab}`)}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 8, opacity: pressed ? 0.85 : 1 })}>
            <RingStack items={items} center={p.score == null ? '–' : fmt(Math.round(p.score))} sub={tr('of {n}', { n: 100 })} size={76} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{tr(p.name)}</Text>
          </Pressable>
          </View>
        );
      })}
    </View>
  );
}
