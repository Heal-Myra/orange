// Body: one Food card (photo, speak, type; Type falls back to IFCT 2017 search without AI), then Sleep, then Movement (founder's priority).
// Milestone 3 replaces typing steps and sleep with automatic HealthKit / Health Connect sync.

import { Pressable, Text, View } from 'react-native';
import { HealthLine, useHealth } from '../../components/HealthSync';
import { Dots, Rows, StatRow } from '../../components/StatRows';
import { MacroMix } from '../../components/MacroMix';
import { bmiOf, fibreTarget } from '../../lib/targets';
import { MealPhoto } from '../../components/MealPhoto';
import { Anchor, Card, Heading, Note, Screen, Score, s } from '../../components/ui';
import { bodyScore, mealTotals } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';

export default function Body() {
  const { day, date, profile, update } = useHeal();
  const score = bodyScore(day, profile);
  const totals = mealTotals(day.meals);
  const { connected } = useHealth();
  const auto = connected; // Apple Health fills sleep and movement; typing is only for phones without it
  const h = day.health;
  const st = h?.sleepStages;

  return (
    <Screen feedback="Body">
      <Anchor id="food"><MealPhoto right={<Score value={score?.nutrition} max={30} />}>
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
          <StatRow first label={tr('Calories')} value={Math.round(totals.kcal)} target={profile.kcal} />
          <StatRow label={tr('Protein (g)')} value={Math.round(totals.p)} target={profile.protein} />
          <StatRow label={tr('Fibre (g)')} value={Math.round(totals.fib)} target={fibreTarget(profile.kcal)} />
          <MacroMix totals={totals} kcal={profile.kcal} protein={profile.protein} />
          {day.meals.length ? day.meals.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line }}>
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, color: colors.ink }}>{m.name}</Text>
              <Text style={{ fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] }}>{Math.round(m.kcal)} kcal · P {Math.round(m.p)} g{m.fib ? ` · ${tr('Fibre')} ${Math.round(m.fib)} g` : ''}</Text>
              <Pressable accessibilityLabel={`Remove ${m.name}`} onPress={() => update(d => { d.meals.splice(i, 1); })} hitSlop={10}>
                <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
          )) : <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}><Note>{tr('No meals yet today.')}</Note></View>}
        </View>
      </MealPhoto></Anchor>

      <HealthLine />

      <Anchor id="sleep"><Card>
        <Heading right={<Score value={score?.sleep} max={30} />}>{tr('Sleep')}</Heading>
        <Rows>
          <StatRow first label={tr('Hours slept')} value={day.sleep.hours} unit="h" decimal key={date + 'sleep'}
            onEdit={auto ? undefined : v => update(d => { d.sleep.hours = v; })} />
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
            onEdit={auto ? undefined : v => update(d => { d.activity.steps = v; d.activity.source = 'Typed in'; })} />
          <StatRow label={tr('Active minutes')} value={day.activity.activeMin} target={profile.active} key={date + 'active'}
            onEdit={auto ? undefined : v => update(d => { d.activity.activeMin = v; d.activity.source = 'Typed in'; })} />
          {h?.activeKcal != null ? <StatRow label={tr('Active energy')} value={h.activeKcal} unit="kcal" /> : null}
          {(h?.workouts ?? []).map((w, i) => (
            <StatRow key={'w' + i} label={tr(w.type)} value={w.kcal ? `${w.min} min · ${w.kcal} kcal` : `${w.min} min`} />
          ))}
        </Rows>
      </Card></Anchor>

      {h && (h.weightKg != null || h.bodyFatPct != null || profile.me) ? (
        <Card>
          <Heading>{tr('Body')}</Heading>
          <Rows>
            <StatRow first label={tr('Weight')} value={h.weightKg ?? profile.me?.weightKg} unit="kg" />
            {h.bodyFatPct != null ? <StatRow label={tr('Body fat')} value={h.bodyFatPct} unit="%" /> : null}
            {profile.me ? <StatRow label="BMI" value={Math.round(bmiOf(h.weightKg ?? profile.me.weightKg, profile.me.heightCm) * 10) / 10} /> : null}
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
