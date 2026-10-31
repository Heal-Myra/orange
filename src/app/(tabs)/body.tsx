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
import { FoodPlanRow } from '../../components/FoodPlan';
import { MealRow } from '../../components/MealRow';
import { CareNote } from '../../components/CareCard';
import { FaceCard } from '../../components/FaceCard';
import { AirRow } from '../../components/AirLine';
import { PASTEL, RingPanel } from '../../components/Rings';
import { MyraLine } from '../../components/MyraLine';
import { todayISO } from '../../lib/dates';
import { Anchor, Card, Expandable, Heading, Note, Screen, Score, s } from '../../components/ui';
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
      <Anchor id="food"><MealPhoto right={<Score value={score?.nutrition} max={40} />} top={
        <RingPanel score={score?.nutrition} max={40} items={[
          { id: 'kcal', color: PASTEL.peach, label: tr('Calories'), value: totals.kcal / profile.kcal, text: `${Math.round(totals.kcal)} / ${profile.kcal}` },
          { id: 'protein', color: PASTEL.lavender, label: tr('Protein'), value: totals.p / profile.protein, text: `${Math.round(totals.p)} / ${profile.protein} g` },
          { id: 'fibre', color: PASTEL.teal, label: tr('Fibre'), value: (totals.fib ?? 0) / fibreTarget(profile.kcal), text: `${Math.round(totals.fib ?? 0)} / ${fibreTarget(profile.kcal)} g` },
        ]} />}>
        <CareNote part="food" />
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
        {/* Tomorrow's food (founder, 23 Oct 2026): one clock row that opens the planner when asked. Only on today's page. */}
        {date === todayISO() ? <FoodPlanRow /> : null}
        {/* The rings show calories, protein and fibre; the full table, where calories come from and each meal open on
            "See details" (decision 0037). */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Note>{day.meals.length ? tr('{n} meals today', { n: day.meals.length }) : tr('No meals yet today.')}</Note>
            {day.meals.length ? (
              <Pressable onPress={() => setDetails(x => !x)} hitSlop={8} accessibilityRole="button">
                <Text style={{ color: colors.accent, fontWeight: '600' }}>{details ? tr('Hide') : tr('See details')}</Text>
              </Pressable>
            ) : null}
          </View>
          {details && day.meals.length ? (
            <>
              <NutritionTable totals={totals} kcal={profile.kcal} protein={profile.protein} fibre={fibreTarget(profile.kcal)} />
              <MacroMix totals={totals} kcal={profile.kcal} protein={profile.protein} fibre={fibreTarget(profile.kcal)} />
              {day.meals.map((m, i) => <MealRow key={`${i}-${m.name}`} m={m} i={i} />)}
            </>
          ) : null}
        </View>
        <MyraLine card="food" />
      </MealPhoto></Anchor>

      <HealthLine />

      <Anchor id="sleep"><Card>
        <Heading right={<Score value={score?.sleep} max={30} />}>{tr('Sleep')}</Heading>
        <RingPanel score={score?.sleep} max={30} items={[
          { id: 'hours', color: PASTEL.lavender, label: tr('Hours slept'), value: (day.sleep.hours ?? 0) / 8, text: day.sleep.hours != null ? `${Math.round(day.sleep.hours * 10) / 10} / 8 h` : '–' },
          ...(st?.deep != null ? [{ id: 'deep', color: PASTEL.sky, label: tr('Deep sleep'), value: st.deep / 1.5, text: `${Math.round(st.deep * 10) / 10} / 1.5 h` }] : []),
          { id: 'quality', color: PASTEL.sand, label: tr('Sleep quality'), value: (day.sleep.quality ?? 0) / 5, text: day.sleep.quality ? `${day.sleep.quality} / 5` : '–' },
        ]} />
        <CareNote part="rest" />
        {/* Details and typing fold away once there is data (decision 0037); open while something is missing. */}
        <Expandable key={date + 'sleepd'} icon="list-outline" title={tr('Details')} status={tr('Sleep stages, hours and quality')} defaultOpen={day.sleep.hours == null || !day.sleep.quality}>
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
        </Expandable>
        <MyraLine card="sleep" />
      </Card></Anchor>

      <Anchor id="movement"><Card>
        <Heading right={<Score value={score?.movement} max={30} />}>{tr('Movement')}</Heading>
        <RingPanel score={score?.movement} max={30} items={[
          { id: 'steps', color: PASTEL.sage, label: tr('Steps'), value: (day.activity.steps ?? 0) / profile.steps, text: `${(day.activity.steps ?? 0).toLocaleString('en-IN')} / ${profile.steps.toLocaleString('en-IN')}` },
          { id: 'active', color: PASTEL.teal, label: tr('Active minutes'), value: (day.activity.activeMin ?? 0) / profile.active, text: `${day.activity.activeMin ?? 0} / ${profile.active}` },
          ...(h?.activeKcal != null ? [{ id: 'energy', color: PASTEL.peach, label: tr('Active energy'), value: h.activeKcal / 400, text: `${Math.round(h.activeKcal)} kcal` }] : []),
        ]} />
        <CareNote part="move" />
        <Expandable key={date + 'moved'} icon="list-outline" title={tr('Details')} status={tr('Steps, minutes and workouts')} defaultOpen={day.activity.steps == null && day.activity.activeMin == null}>
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
        </Expandable>
        <AirRow />
        <MyraLine card="movement" />
      </Card></Anchor>

      {h || profile.me ? (
        <Anchor id="body"><Card>
          <Heading>{tr('Body')}</Heading>
          <Rows>
            <StatRow first label={tr('Weight')} value={h?.weightKg ?? profile.me?.weightKg} unit="kg" decimal
              onEdit={v => {
                update(d => { d.health = { ...(d.health ?? {}), weightKg: v, weightTyped: v != null, weightTypedAt: v != null ? Date.now() : undefined }; });
                if (v != null && profile.me) { const me = { ...profile.me, weightKg: v }; const pl = planFor(me); setProfile({ ...profile, kcal: pl.kcal, protein: pl.protein, steps: pl.steps, active: pl.active, me }); }
              }} />
            {h?.bodyFatPct != null ? <StatRow label={tr('Body fat')} value={h.bodyFatPct} unit="%" /> : null}
            {profile.me ? <StatRow label="BMI" value={Math.round(bmiOf(h?.weightKg ?? profile.me.weightKg, profile.me.heightCm) * 10) / 10} /> : null}
          </Rows>
        </Card></Anchor>
      ) : null}

      <FaceCard />

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
