// Today's well-being card in the same design as every other card (founder, 31 Oct 2026; decision 0037):
// concentric rings for the best part of the day and the three biggest concerns, the total out of 300 in the middle,
// the key at the side, and Myra's recommendation at the bottom of the card.

import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { band, POINTS, type WellBeing } from '../lib/scoring';
import { colors } from '../theme';
import { GuidanceCard } from './AiBits';
import { Dot, PASTEL, RingStack, fmt, type RingItem } from './Rings';
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

export function TodayRings({ w }: { w: WellBeing }) {
  const { best, concerns } = bestAndConcerns(dayParts(w));
  // The ring colours of the shown parts must differ from each other: give each shown ring its own pastel.
  const shown = [...(best ? [best] : []), ...concerns];
  const palette = [PASTEL.peach, PASTEL.lavender, PASTEL.teal, PASTEL.sky];
  const colorOf = (p: Part) => palette[shown.indexOf(p)] ?? p.color;
  const items: RingItem[] = shown.map(p => ({ id: p.id, color: colorOf(p), label: tr(p.label), value: p.got / p.of }));
  const open = (p: Part) => router.navigate({ pathname: `/${p.tab}`, params: { card: p.card, at: String(Date.now()) } });
  const row = (p: Part) => (
    <Pressable key={p.id} onPress={() => open(p)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Dot color={colorOf(p)} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }} numberOfLines={1}>{tr(p.label)}</Text>
      <Text style={{ color: p === best ? colors.good : colors.muted, fontWeight: '700', fontSize: 12.5 }}>{`${fmt(p.got)}/${p.of}`}</Text>
    </Pressable>
  );
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>{tr('My day')}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{w.logged ? tr(band(w.total)) : tr('Nothing logged yet')}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <RingStack items={items} center={fmt(w.total)} sub={tr('of {n}', { n: 300 })} size={140} />
        <View style={{ flex: 1, gap: 7 }}>
          {best ? <Text style={{ color: colors.good, fontWeight: '700', fontSize: 11, letterSpacing: 0.4 }}>{tr('YOUR BEST')}</Text> : null}
          {best ? row(best) : null}
          {concerns.length ? <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 11, letterSpacing: 0.4, marginTop: 4 }}>{tr('TOP CONCERNS')}</Text> : null}
          {concerns.map(row)}
        </View>
      </View>
      {/* Myra recommends, at the bottom of the card (founder, 31 Oct 2026). */}
      <GuidanceCard embedded />
    </Card>
  );
}
