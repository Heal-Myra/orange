// Body: one Food card (photo, speak, type; Type falls back to IFCT 2017 search without AI), then Sleep, then Movement (founder's priority).
// Milestone 3 replaces typing steps and sleep with automatic HealthKit / Health Connect sync.

import { Pressable, Text, View } from 'react-native';
import { MealPhoto } from '../../components/MealPhoto';
import { Card, Heading, Meter, Note, NumberField, Screen, Score, Segmented, s } from '../../components/ui';
import { bodyScore, mealTotals } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Body() {
  const { day, date, profile, update } = useHeal();
  const score = bodyScore(day, profile);
  const totals = mealTotals(day.meals);

  return (
    <Screen feedback="Body">
      <MealPhoto right={<Score value={score?.nutrition} max={30} />}>
        <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
          <Meter label="Calories" value={totals.kcal} max={profile.kcal} color={colors.body} right={`${Math.round(totals.kcal)} / ${profile.kcal} kcal`} />
          <Meter label="Protein" value={totals.p} max={profile.protein} color={colors.body} right={`${Math.round(totals.p)} / ${profile.protein} g`} />
          {day.meals.length ? day.meals.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, color: colors.ink }}>{m.name}</Text>
              <Text style={s.note}>{Math.round(m.kcal)} kcal · P {Math.round(m.p)} g</Text>
              <Pressable accessibilityLabel={`Remove ${m.name}`} onPress={() => update(d => { d.meals.splice(i, 1); })} hitSlop={10}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
          )) : <Note>No meals yet today.</Note>}
        </View>
      </MealPhoto>

      <Card>
        <Heading right={<Score value={score?.sleep} max={30} />}>Sleep</Heading>
        <NumberField key={date + 'sleep'} label="Hours slept" decimal value={day.sleep.hours}
          onChange={v => update(d => { d.sleep.hours = v; })} />
        <Text style={s.fieldLabel}>How well did you sleep? (1 poor – 5 great)</Text>
        <Segmented options={[1, 2, 3, 4, 5].map(n => ({ label: String(n), value: n as 1 | 2 | 3 | 4 | 5 }))}
          value={day.sleep.quality} onChange={q => update(d => { d.sleep.quality = q; })} />
      </Card>

      <Card>
        <Heading right={<Score value={score?.movement} max={40} />}>Movement</Heading>
        <View style={s.row}>
          <NumberField key={date + 'steps'} label="Steps" value={day.activity.steps}
            onChange={v => update(d => { d.activity.steps = v; d.activity.source = 'Typed in'; })} />
          <NumberField key={date + 'active'} label="Active minutes" value={day.activity.activeMin}
            onChange={v => update(d => { d.activity.activeMin = v; d.activity.source = 'Typed in'; })} />
        </View>
        <Meter label="Steps" value={day.activity.steps ?? 0} max={profile.steps} color={colors.body} />
        <Meter label="Active minutes" value={day.activity.activeMin ?? 0} max={profile.active} color={colors.body} />
      </Card>


    </Screen>
  );
}
