// One meal on the Food card, with a way to correct it (founder, 23 Oct 2026: "the food snap couldn't get the reading
// right"). Tap the dish, say what it really was and how much ("1 katori soya chunk sabzi, 2 rotis"), and Myra works it
// out again from the words (IFCT 2017 where the ingredients match). The photo's guess is replaced.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { analyseMealText } from '../lib/ai';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import type { Meal } from '../lib/types';
import { colors } from '../theme';
import { Button, Note, TextField } from './ui';

export function MealRow({ m, i }: { m: Meal; i: number }) {
  const { update } = useHeal();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(`${m.name}${m.grams ? `, ${m.grams} g` : ''}`);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fix = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await analyseMealText(text.trim());
      if (!r.items?.length) throw new Error(tr('Myra could not work that out. Add a little more detail.'));
      update(d => {
        const k = d.meals.findIndex((x, n) => n === i && x.name === m.name);
        const at = k >= 0 ? k : i;
        d.meals.splice(at, 1, ...r.items.map(it => ({
          name: it.name, grams: it.grams, kcal: it.kcal, p: it.protein_g, c: it.carbs_g, f: it.fat_g, fib: it.fibre_g ?? 0,
          source: (it.basis === 'IFCT' ? 'words+ifct' : 'words') as Meal['source'],
        })));
      });
      setOpen(false);
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); }
    setBusy(false);
  };

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 }}>
        {/* Two lines (founder, 21 Oct 2026): the dish, then its calories, protein, fat and fibre. Tap to correct it. */}
        <Pressable style={{ flex: 1, paddingVertical: 8, gap: 2 }} onPress={() => setOpen(o => !o)} accessibilityRole="button" accessibilityHint={tr('Correct this dish')}>
          <Text numberOfLines={1} style={{ fontSize: 16, color: colors.ink }}>{m.name}{m.grams ? <Text style={{ color: colors.muted, fontSize: 14 }}> · {m.grams} g</Text> : null}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] }}>
            {Math.round(m.kcal)} kcal · {tr('Protein')} {Math.round(m.p)} g · {tr('Fat')} {Math.round(m.f)} g{m.fib ? ` · ${tr('Fibre')} ${Math.round(m.fib)} g` : ''}
          </Text>
        </Pressable>
        <Pressable onPress={() => setOpen(o => !o)} hitSlop={8} accessibilityRole="button">
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>{open ? tr('Close') : tr('Fix')}</Text>
        </Pressable>
        <Pressable accessibilityLabel={`Remove ${m.name}`} onPress={() => update(d => { d.meals.splice(i, 1); })} hitSlop={10}>
          <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
        </Pressable>
      </View>
      {open ? (
        <View style={{ gap: 8, paddingBottom: 12 }}>
          <TextField label={tr('What was it really? Dish and how much')} value={text} onChangeText={setText} multiline
            placeholder={tr('e.g. 1 katori soya chunk sabzi with 1 tsp oil')} />
          <Button kind="insight" title={busy ? tr('Calculating…') : tr('Recalculate')} onPress={fix} disabled={busy || !text.trim()} />
          {msg ? <Note>{msg}</Note> : null}
        </View>
      ) : null}
    </View>
  );
}
