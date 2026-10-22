// Body: one Food card (photo, speak, type; Type falls back to IFCT 2017 search without AI), then Sleep, then Movement (founder's priority).
// Milestone 3 replaces typing steps and sleep with automatic HealthKit / Health Connect sync.

import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { HealthLine, useHealth } from '../../components/HealthSync';
import { Dots, Rows, StatRow } from '../../components/StatRows';
import { MacroMix, NutritionTable } from '../../components/MacroMix';
import { bmiOf, fibreTarget, planFor } from '../../lib/targets';
import { MealPhoto } from '../../components/MealPhoto';
import { Anchor, Card, Heading, Note, Screen, Score, s } from '../../components/ui';
import { FAST_KCAL, bodyScore, mealTotals } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';

export default function Body() {
  const { day, date, profile, update, setProfile } = useHeal();
  const score = bodyScore(day, profile);
  const totals = mealTotals(day.meals);
  const { connected } = useHealth();
  const [details, setDetails] = useState(false);
  const auto = connected; // Apple Health fills sleep and movement; typing is only for phones without it
  const h = day.health;
  const st = h?.sleepStages;

  return (
    <Screen feedback="Body" trends="body">
      <Anchor id="food"><MealPhoto right={<Score value={score?.nutrition} max={30} />}>
        {/* "I'm fasting today" (founder, 22 Oct 2026): a declared fast scores Food in full while only water, black tea
            or black coffee go in, and Myra changes her advice. */}
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: !!day.fasting }} onPress={() => update(d => { d.fasting = !d.fasting; })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Ionicons name={day.fasting ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={day.fasting ? colors.body : colors.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, color: colors.ink, fontWeight: day.fasting ? '600' : '400' }}>{tr('I\'m fasting today')}</Text>
            {day.fasting ? <Text style={{ fontSize: 13, color: colors.muted }}>
              {totals.kcal <= FAST_KCAL ? tr('Water, black tea and black coffee are fine. Food scores in full.') : tr('Food was logged, so today is scored as a normal day.')}
            </Text> : null}
          </View>
        </Pressable>
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
          <NutritionTable totals={totals} kcal={profile.kcal} protein={profile.protein} fibre={fibreTarget(profile.kcal)} />
          {/* Food items only when asked (founder, 22 Oct 2026): "See details" next to the pies' title opens them below. */}
          <MacroMix totals={totals} kcal={profile.kcal} protein={profile.protein} fibre={fibreTarget(profile.kcal)}
            right={day.meals.length ? (
              <Pressable onPress={() => setDetails(x => !x)} hitSlop={8} accessibilityRole="button">
                <Text style={{ color: colors.accent, fontWeight: '600' }}>{details ? tr('Hide') : tr('See details')}</Text>
              </Pressable>
            ) : undefined} />
          {day.meals.length ? (details ? day.meals.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
              {/* Two lines (founder, 21 Oct 2026): the dish, then its calories, protein, fat and fibre, so the source of fat is clear. */}
              <View style={{ flex: 1, paddingVertical: 8, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 16, color: colors.ink }}>{m.name}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] }}>
                  {Math.round(m.kcal)} kcal · {tr('Protein')} {Math.round(m.p)} g · {tr('Fat')} {Math.round(m.f)} g{m.fib ? ` · ${tr('Fibre')} ${Math.round(m.fib)} g` : ''}
                </Text>
              </View>
              <Pressable accessibilityLabel={`Remove ${m.name}`} onPress={() => update(d => { d.meals.splice(i, 1); })} hitSlop={10}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
          )) : null) : <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}><Note>{tr('No meals yet today.')}</Note></View>}
        </View>
      </MealPhoto></Anchor>

      <HealthLine />

      <Anchor id="sleep"><Card>
        <Heading right={<Score value={score?.sleep} max={30} />}>{tr('Sleep')}</Heading>
        <Rows>
          <StatRow first label={tr('Hours slept')} value={day.sleep.hours} unit="h" decimal key={date + 'sleep'}
            onEdit={v => update(d => { d.sleep.hours = v; d.sleep.source = v == null ? undefined : 'Typed in'; })} />
          {st ? <StatRow label={tr('Deep sleep')} value={st.deep} unit="h" /> : null}
          {st ? <StatRow label={tr('Core sleep')} value={st.core} unit="h" /> : null}
          {st ? <StatRow label={tr('REM sleep')} value={st.rem} unit="h" /> : null}
          {st ? <StatRow label={tr('Awake')} value={st.awake} unit="h" /> : null}
          <StatRow label={tr('Sleep quality')} value={undefined}
            right={<Dots value={day.sleep.quality} onChange={q => update(d => { d.sleep.quality = q; })} />} />
        </Rows>
      </Card></Anchor>

      <Anchor id="movement"><Card>
        <Heading right={<Score value={score?.movement} max={40} />}>{tr('Movement')}</Heading>
        <Rows>
          <StatRow first label={tr('Steps')} value={day.activity.steps} target={profile.steps} key={date + 'steps'}
            onEdit={v => update(d => { d.activity.steps = v; d.activity.stepsTyped = v != null; })} />
          <StatRow label={tr('Active minutes')} value={day.activity.activeMin} target={profile.active} key={date + 'active'}
            onEdit={v => update(d => { d.activity.activeMin = v; d.activity.activeTyped = v != null; })} />
          {h?.activeKcal != null ? <StatRow label={tr('Active energy')} value={h.activeKcal} unit="kcal" /> : null}
          {(h?.workouts ?? []).map((w, i) => (
            <StatRow key={'w' + i} label={tr(w.type)} value={w.kcal ? `${w.min} min · ${w.kcal} kcal` : `${w.min} min`} />
          ))}
        </Rows>
      </Card></Anchor>

      {h || profile.me ? (
        <Card>
          <Heading>{tr('Body')}</Heading>
          <Rows>
            <StatRow first label={tr('Weight')} value={h?.weightKg ?? profile.me?.weightKg} unit="kg" decimal
              onEdit={v => {
                update(d => { d.health = { ...(d.health ?? {}), weightKg: v, weightTyped: v != null }; });
                if (v != null && profile.me) { const me = { ...profile.me, weightKg: v }; const pl = planFor(me); setProfile({ ...profile, kcal: pl.kcal, protein: pl.protein, steps: pl.steps, active: pl.active, me }); }
              }} />
            {h?.bodyFatPct != null ? <StatRow label={tr('Body fat')} value={h.bodyFatPct} unit="%" /> : null}
            {profile.me ? <StatRow label="BMI" value={Math.round(bmiOf(h?.weightKg ?? profile.me.weightKg, profile.me.heightCm) * 10) / 10} /> : null}
          </Rows>
        </Card>
      ) : null}

      {h && (h.restingHr != null || h.hrv != null || h.vo2max != null) ? (
        <Card>
          <Heading>{tr('Heart & fitness')}</Heading>
          <Rows>
            <StatRow first label={tr('Resting heart rate')} value={h.restingHr} unit="bpm" />
            <StatRow label={tr('Heart rate variability')} value={h.hrv} unit="ms" />
            <StatRow label={tr('Cardio fitness (VO₂ max)')} value={h.vo2max} />
          </Rows>
        </Card>
      ) : null}
    </Screen>
  );
}
