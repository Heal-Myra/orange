// Care plan on Today (founder, 25 Oct 2026): as soon as the person says what is wrong (e.g. "I have a cold"), one card
// switches everything on: food and drink, a breathing session made for it, movement, rest, what to avoid, and when to see a
// doctor. Tapping a line opens the card where it is done. Self-care only; never a diagnosis.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { carePlan } from '../lib/care';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Note } from './ui';

export function CareCard() {
  const { day } = useHeal();
  const c = carePlan(day.feeling?.symptoms ?? []);
  if (!c) return null;
  const nidra = (c.breath as string[]).includes('nidra');
  const Row = ({ icon, title, lines, to }: { icon: keyof typeof Ionicons.glyphMap; title: string; lines: string[]; to?: () => void }) => (
    <Pressable disabled={!to} onPress={to} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Ionicons name={icon} size={20} color={colors.insight} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontWeight: '700', color: colors.ink }}>{title}</Text>
        {lines.map((l, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 20 }}>{tr(l)}</Text>)}
      </View>
      {to ? <Ionicons name="chevron-forward" size={16} color={colors.muted} style={{ marginTop: 2 }} /> : null}
    </Pressable>
  );
  return (
    <Card style={{ borderLeftWidth: 5, borderLeftColor: colors.insight, gap: 4 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.insight }}>{tr('Care plan for {what}', { what: tr(c.name) })}</Text>
      <Note>{tr('Everything in the app now leans this way today: food, breathing, movement and rest.')}</Note>
      <Row icon="restaurant-outline" title={tr('Eat and drink')} lines={c.food} to={() => router.navigate({ pathname: '/body', params: { card: 'food', at: String(Date.now()) } })} />
      <Row icon="leaf-outline" title={tr('Breathing')} lines={[nidra ? 'Yoga Nidra, lying down, to rest deeply.' : 'A 10-minute care session, made for this.']} />
      <View style={{ paddingLeft: 30, paddingBottom: 6 }}>
        <Button kind="insight" title={nidra ? tr('Start Yoga Nidra') : tr('Start care breathing (10 min)')}
          onPress={() => (nidra ? router.push('/yoga-nidra') : router.push({ pathname: '/breathe', params: { practice: 'mix', minutes: '10' } }))} />
      </View>
      <Row icon="walk-outline" title={tr('Movement')} lines={[c.move]} />
      <Row icon="moon-outline" title={tr('Rest')} lines={[c.rest]} />
      <Row icon="close-circle-outline" title={tr('Avoid today')} lines={c.avoid} />
      {c.doctor ? <Note>{tr(c.doctor)}</Note> : null}
      <Note>{tr('Everyday self-care, not medical advice.')}</Note>
    </Card>
  );
}
