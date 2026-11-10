// Protein top-up at 6 pm in Food (founder, 10 Nov 2026): protein so far against the aim, one line from Myra with the
// food that best closes the gap, and three picks. Tapping a pick adds it to today, once eaten.

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { myDishes } from '../lib/dishes';
import { tr } from '../lib/i18n';
import { useLogMeals } from '../lib/logMeals';
import { picks, proteinGap, showTopUp } from '../lib/proteinTopUp';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { PASTEL } from './Rings';

export function ProteinTopUp() {
  const { day, date, days, profile } = useHeal();
  const logMeals = useLogMeals();
  const [added, setAdded] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 60_000); return () => clearInterval(t); }, []);
  if (date !== todayISO() || !showTopUp(day.meals, profile.protein, day.fasting)) return added ? <Text style={{ color: colors.good, fontSize: 13 }}>{tr('Added {name}.', { name: added })}</Text> : null;
  const g = proteinGap(day.meals, profile.protein);
  const list = picks(g.gap, myDishes(days, date), profile.me?.foodPrefs);
  if (!list.length) return null;
  return (
    <View style={{ gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{tr('Protein')}</Text>
        <Text style={{ color: colors.ink, fontSize: 14.5 }}><Text style={{ fontWeight: '700' }}>{Math.round(g.have)}</Text> / {g.target} g</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: PASTEL.lavender + '33' }}>
        <View style={{ height: 8, borderRadius: 4, width: `${Math.min(100, (g.have / g.target) * 100)}%`, backgroundColor: PASTEL.lavender }} />
      </View>
      <Text style={{ color: colors.insight, fontSize: 14 }}>✦ {tr('Add {food} for about {g} g.', { food: list[0].name.toLowerCase(), g: list[0].p })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map(x => (
          <Pressable key={x.name} accessibilityRole="button" accessibilityLabel={tr('Add {name}', { name: x.name })}
            onPress={() => { logMeals([{ name: x.name, grams: x.grams, kcal: x.kcal, p: x.p, c: x.c, f: x.f, fib: x.fib, source: x.mine ? 'photo+mine' : 'manual' }]); setAdded(x.name); }}
            style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.ink, fontWeight: '600', fontSize: 13.5 }}>{x.name} · {x.p} g</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Tap one once you have eaten it.')}</Text>
    </View>
  );
}
