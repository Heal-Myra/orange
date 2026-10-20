// Food by IFCT 2017 search and grams. Used inside the Food card's "Type" when the AI is not available
// (signed out, AI not approved yet, or no internet): same button, no second card.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { foodByCode, per100g, searchFoods } from '../lib/ifct';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Note, TextField, s } from './ui';

export function IfctPicker({ start = '', why }: { start?: string; why?: string }) {
  const { update } = useHeal();
  const [query, setQuery] = useState(start);
  const [code, setCode] = useState<string | null>(null);
  const [grams, setGrams] = useState('100');
  const results = query.trim() ? searchFoods(query, 6) : [];
  const food = code ? foodByCode(code) : undefined;

  const add = () => {
    if (!food) return;
    const g = parseFloat(grams) || 100, k = g / 100, p = per100g(food);
    update(d => { d.meals.push({ name: `${food.name} (${Math.round(g)} g)`, grams: g, kcal: p.kcal * k, p: p.protein * k, c: p.carbs * k, f: p.fat * k, source: 'ifct' }); });
    setCode(null); setQuery('');
  };

  return (
    <View style={{ gap: 8 }}>
      {why ? <Note>{why}</Note> : null}
      <TextField label="Search a food (IFCT 2017)" value={query} onChangeText={t => { setQuery(t); setCode(null); }} placeholder="e.g. moong dal, ragi, paneer" />
      {!food && results.map(f => {
        const p = per100g(f);
        return (
          <Pressable key={f.code} onPress={() => setCode(f.code)} style={{ paddingVertical: 4 }}>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{f.name}</Text>
            <Text style={s.note}>per 100 g: {Math.round(p.kcal)} kcal, P {p.protein.toFixed(1)} g</Text>
          </Pressable>
        );
      })}
      {query.trim() && !results.length ? <Note>No match. Try another name, e.g. "toor dal" or "rice".</Note> : null}
      {food && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{food.name}</Text>
          <TextField label="How many grams?" value={grams} onChangeText={setGrams} />
          <Button title="Add to my day" onPress={add} />
        </View>
      )}
    </View>
  );
}
