// Body: movement, sleep and food. Food can be looked up in IFCT 2017.
// Milestone 3 replaces typing steps and sleep with automatic HealthKit / Health Connect sync.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MealPhoto } from '../../components/MealPhoto';
import { Button, Card, Heading, Meter, Note, NumberField, Screen, Score, Segmented, TextField, s } from '../../components/ui';
import { foodByCode, per100g, searchFoods } from '../../lib/ifct';
import { bodyScore, mealTotals } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Body() {
  const { day, date, profile, update } = useHeal();
  const score = bodyScore(day, profile);
  const totals = mealTotals(day.meals);

  return (
    <Screen>
      <Card>
        <Heading right={<Score value={score ? score.movement + score.sleep : null} max={70} />}>Movement & sleep</Heading>
        <View style={s.row}>
          <NumberField key={date + 'steps'} label="Steps" value={day.activity.steps}
            onChange={v => update(d => { d.activity.steps = v; d.activity.source = 'Typed in'; })} />
          <NumberField key={date + 'active'} label="Active minutes" value={day.activity.activeMin}
            onChange={v => update(d => { d.activity.activeMin = v; d.activity.source = 'Typed in'; })} />
          <NumberField key={date + 'sleep'} label="Sleep (hours)" decimal value={day.sleep.hours}
            onChange={v => update(d => { d.sleep.hours = v; })} />
        </View>
        <Text style={s.fieldLabel}>Sleep quality (1 poor – 5 great)</Text>
        <Segmented options={[1, 2, 3, 4, 5].map(n => ({ label: String(n), value: n as 1 | 2 | 3 | 4 | 5 }))}
          value={day.sleep.quality} onChange={q => update(d => { d.sleep.quality = q; })} />
        <Meter label="Steps" value={day.activity.steps ?? 0} max={profile.steps} color={colors.body} />
        <Meter label="Active minutes" value={day.activity.activeMin ?? 0} max={profile.active} color={colors.body} />
      </Card>

      <Card>
        <Heading right={<Score value={score?.nutrition} max={30} />}>Food</Heading>
        <Meter label="Calories" value={totals.kcal} max={profile.kcal} color={colors.body} right={`${Math.round(totals.kcal)} / ${profile.kcal} kcal`} />
        <Meter label="Protein" value={totals.p} max={profile.protein} color={colors.body} right={`${Math.round(totals.p)} / ${profile.protein} g`} />
        {day.meals.length ? day.meals.map((m, i) => (
          <View key={i} style={[s.headingRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink }}>{m.name}</Text>
              <Text style={s.note}>{Math.round(m.kcal)} kcal · P {Math.round(m.p)} g · C {Math.round(m.c)} g · F {Math.round(m.f)} g{m.source === 'ifct' ? ' · IFCT' : ''}</Text>
            </View>
            <Pressable onPress={() => update(d => { d.meals.splice(i, 1); })} hitSlop={8}><Text style={{ color: colors.bad }}>Remove</Text></Pressable>
          </View>
        )) : <Note>No meals logged.</Note>}
      </Card>

      <MealPhoto />

      <IfctAdd />
    </Screen>
  );
}

function IfctAdd() {
  const { update } = useHeal();
  const [query, setQuery] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [grams, setGrams] = useState('100');
  const results = query.trim() ? searchFoods(query, 8) : [];
  const food = code ? foodByCode(code) : undefined;

  const add = () => {
    if (!food) return;
    const g = parseFloat(grams) || 100, k = g / 100, p = per100g(food);
    update(d => { d.meals.push({ name: `${food.name} (${Math.round(g)} g)`, grams: g, kcal: p.kcal * k, p: p.protein * k, c: p.carbs * k, f: p.fat * k, source: 'ifct' }); });
    setCode(null); setQuery('');
  };

  return (
    <Card>
      <Heading>Add food from IFCT 2017</Heading>
      <Note>542 Indian foods measured by ICMR–National Institute of Nutrition. Search in English or a regional name.</Note>
      <TextField label="Search" value={query} onChangeText={t => { setQuery(t); setCode(null); }} placeholder="e.g. moong dal, ragi, paneer" />
      {!food && results.map(f => {
        const p = per100g(f);
        return (
          <Pressable key={f.code} onPress={() => setCode(f.code)} style={{ paddingVertical: 6 }}>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{f.name}</Text>
            <Text style={s.note}>{f.group} · per 100 g: {Math.round(p.kcal)} kcal, P {p.protein.toFixed(1)} g</Text>
          </Pressable>
        );
      })}
      {food && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{food.name}</Text>
          <TextField label="How many grams did you eat?" value={grams} onChangeText={setGrams} />
          <Button title="Add to my day" onPress={add} />
        </View>
      )}
    </Card>
  );
}
