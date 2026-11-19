// "Your day" (decision 0063, change 8): everything the day has picked up, in time order, each showing where it came from;
// three chips to add more with the least effort. Like Oura's timeline. Nothing is typed here; tapping opens its card.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors, isGlass } from '../theme';
import type { DayLog } from '../lib/types';

interface Item { at?: string; icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; from: string; open: () => void }

const hm = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const go = (tab: string, card: string) => () => router.navigate({ pathname: `/${tab}`, params: { card, at: String(Date.now()) } });

export function dayItems(day: DayLog): Item[] {
  const out: Item[] = [];
  for (const m of day.meals ?? []) out.push({ at: m.at, icon: 'restaurant-outline', title: m.name, detail: `${Math.round(m.kcal)} kcal · ${Math.round(m.p)} g ${tr('protein')}`, from: m.neo ? 'NeoSapien' : m.source === 'photo' ? tr('Photo') : tr('You'), open: go('body', 'food') });
  for (const s of day.mind?.medSessions ?? []) out.push({ at: s.at, icon: 'flower-outline', title: tr(s.name), detail: tr('{n} min', { n: s.min }), from: 'Happy Orange', open: go('mind', 'meditation') });
  for (const w of day.health?.workouts ?? []) out.push({ icon: 'walk-outline', title: tr(w.type), detail: `${tr('{n} min', { n: Math.round(w.min) })}${w.kcal ? ` · ${Math.round(w.kcal)} kcal` : ''}`, from: 'Apple Health', open: go('body', 'movement') });
  if (day.activity?.steps) out.push({ icon: 'footsteps-outline', title: tr('{n} steps', { n: day.activity.steps.toLocaleString('en-IN') }), detail: tr('So far today'), from: day.activity.stepsTyped ? tr('You') : 'Apple Health', open: go('body', 'movement') });
  // Timed things in order, newest first; untimed totals at the end.
  return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '') || (a.at ? -1 : b.at ? 1 : 0));
}

export function YourDay() {
  const { day } = useHeal();
  if (!isGlass) return null;
  const items = dayItems(day);
  const chip = (icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3EEE8', borderRadius: 99, paddingVertical: 9, paddingHorizontal: 13, opacity: pressed ? 0.8 : 1 })}>
      <Ionicons name={icon} size={17} color="#1B1A22" />
      <Text style={{ color: '#1B1A22', fontSize: 14, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 14, marginTop: 8 }}>
      <Text style={{ fontSize: 26, fontWeight: '400', color: colors.ink }}>{tr('Your day')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chip('camera-outline', tr('Snap a meal'), go('body', 'food'))}
        {chip('mic-outline', tr('Tell Myra'), () => router.push({ pathname: '/myra', params: { from: 'today', listen: '1' } }))}
        {chip('add', tr('Add'), () => router.push({ pathname: '/myra', params: { from: 'today', attach: '1' } }))}
      </View>
      {items.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>{tr('Nothing yet today. Meals, walks and sessions appear here by themselves.')}</Text>
      ) : (
        <View>
          {items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 44 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={it.icon} size={20} color={colors.ink} />
                </View>
                {i < items.length - 1 ? <View style={{ width: 1.5, flex: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} /> : null}
              </View>
              <View style={{ flex: 1, gap: 6, paddingBottom: 16 }}>
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>{it.at ? `${hm(it.at)} · ` : ''}{it.from}</Text>
                <Pressable onPress={it.open} accessibilityRole="button" style={({ pressed }) => ({ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.8 : 1 })}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '600' }} numberOfLines={1}>{it.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 14 }}>{it.detail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
