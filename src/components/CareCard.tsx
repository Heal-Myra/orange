// Care plan (founder, 25 Oct 2026): as soon as the person says what is wrong (e.g. "I have a cold"), the plan is woven
// into the cards where each thing is done (founder, 25 Oct 2026: "food in the food card, breathing in the breathing card and
// so on"): CareNote sits inside Food, Sleep, Movement and Breathing & meditation. On Today, a short card below Myra
// recommends links to them and says when to see a doctor. Self-care only; never a diagnosis.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { careFor, carePlan, type CarePart } from '../lib/care';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Note } from './ui';

/** Today's care plan, or null (only on today). */
export function useCare() {
  const { day, date } = useHeal();
  return date === todayISO() ? carePlan(day.feeling?.symptoms ?? []) : null;
}

/** The care lines for one card, in a small tinted box. */
export function CareNote({ part }: { part: CarePart }) {
  const c = useCare();
  if (!c) return null;
  const { lines, avoid } = careFor(c, part);
  const nidra = (c.breath as string[]).includes('nidra');
  if (!lines.length && !avoid.length) return null;
  return (
    <View style={{ gap: 4, padding: 10, borderRadius: 12, backgroundColor: colors.insight + '12' }}>
      <Text style={{ fontWeight: '700', color: colors.insight }}>{tr('For {what}', { what: tr(c.name) })}</Text>
      {lines.map((l, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 20 }}>• {tr(l)}</Text>)}
      {avoid.length ? <Text style={{ color: colors.ink, lineHeight: 20 }}>{tr('Avoid: {list}', { list: avoid.map(a => tr(a)).join(' · ') })}</Text> : null}
      {part === 'breath' ? (
        <Button kind="insight" title={nidra ? tr('Start Yoga Nidra') : tr('Start care breathing (10 min)')}
          onPress={() => (nidra ? router.push('/yoga-nidra') : router.push({ pathname: '/breathe', params: { practice: 'mix', minutes: '10' } }))} />
      ) : null}
    </View>
  );
}

/** Today: a short pointer card, below Myra recommends. */
export function CareCard() {
  const c = useCare();
  if (!c) return null;
  const go = (tab: '/body' | '/mind', card: string) => router.navigate({ pathname: tab, params: { card, at: String(Date.now()) } });
  const Row = ({ icon, title, to }: { icon: keyof typeof Ionicons.glyphMap; title: string; to: () => void }) => (
    <Pressable onPress={to} accessibilityRole="link" style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Ionicons name={icon} size={20} color={colors.insight} />
      <Text style={{ flex: 1, color: colors.ink, fontWeight: '600' }}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
  return (
    <Card style={{ borderLeftWidth: 5, borderLeftColor: colors.insight, gap: 4 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.insight }}>{tr('Care plan for {what}', { what: tr(c.name) })}</Text>
      <Note>{tr('Added to your cards today:')}</Note>
      <Row icon="restaurant-outline" title={tr('Food and drink')} to={() => go('/body', 'food')} />
      <Row icon="leaf-outline" title={tr('Breathing')} to={() => go('/mind', 'meditation')} />
      <Row icon="walk-outline" title={tr('Movement')} to={() => go('/body', 'movement')} />
      <Row icon="moon-outline" title={tr('Rest and sleep')} to={() => go('/body', 'sleep')} />
      {c.doctor ? <Note>{tr(c.doctor)}</Note> : null}
      <Note>{tr('Everyday self-care, not medical advice.')}</Note>
    </Card>
  );
}
