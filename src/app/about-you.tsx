// About you: asked once after sign-up (skippable) and changeable from Profile (founder, 20 Oct 2026).
// Weight, height, sex, age and a weight goal set the daily food, protein and movement targets (src/lib/targets.ts),
// and Myra uses them to tailor food and exercise. Private: stored only in the person's own profile.

import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Heading, Note, NumberField, Screen, Segmented, s } from '../components/ui';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { planFor, type AboutMe, type Goal, type Sex } from '../lib/targets';
import { todayISO } from '../lib/dates';
import { colors } from '../theme';

const WHEN = [
  { label: '1 month', weeks: 4 },
  { label: '3 months', weeks: 13 },
  { label: '6 months', weeks: 26 },
  { label: '1 year', weeks: 52 },
];

export default function AboutYou() {
  const { profile, setProfile, markMeAsked, day } = useHeal();
  const me = profile.me;
  const [weight, setWeight] = useState<number | undefined>(me?.weightKg ?? day.health?.weightKg);
  const [height, setHeight] = useState<number | undefined>(me?.heightCm);
  const [sex, setSex] = useState<Sex | undefined>(me?.sex);
  const [age, setAge] = useState<number | undefined>(me?.age);
  const [goal, setGoal] = useState<Goal>(me?.goal ?? 'keep');
  const [goalKg, setGoalKg] = useState<number | undefined>(me?.goalKg);
  const [weeks, setWeeks] = useState<number>(me?.goalWeeks ?? 13);

  const complete = !!(weight && weight >= 25 && weight <= 300 && height && height >= 100 && height <= 250 && sex && age && age >= 10 && age <= 110);
  const draft: AboutMe | null = complete
    ? { weightKg: weight!, heightCm: height!, sex: sex!, age: age!, goal, goalKg: goal === 'keep' ? undefined : goalKg, goalWeeks: goal === 'keep' ? undefined : weeks, setAt: me?.setAt && me.goal === goal ? me.setAt : todayISO() }
    : null;
  const plan = draft ? planFor(draft) : null;

  const done = () => { markMeAsked(); if (router.canGoBack()) router.back(); else router.replace('/'); };
  const save = () => {
    if (!draft || !plan) return;
    setProfile({ ...profile, kcal: plan.kcal, protein: plan.protein, steps: plan.steps, active: plan.active, me: draft });
    done();
  };

  return (
    <Screen showDay={false}>
      <Card>
        <Heading>{tr('Your details')}</Heading>
        <Note>{tr('A few numbers so Myra can set your daily food and movement targets. Only you can see them.')}</Note>
        <View style={s.row}>
          <NumberField live label={tr('Weight (kg)')} decimal value={weight} onChange={setWeight} />
          <NumberField live label={tr('Height (cm)')} value={height} onChange={setHeight} />
          <NumberField live label={tr('Age (years)')} value={age} onChange={setAge} />
        </View>
        <Text style={s.fieldLabel}>{tr('Sex')}</Text>
        <Segmented options={[{ label: tr('Male'), value: 'male' as Sex }, { label: tr('Female'), value: 'female' as Sex }, { label: tr('Prefer not to say'), value: 'other' as Sex }]}
          value={sex} onChange={setSex} />
      </Card>

      <Card>
        <Heading>{tr('Your goal')}</Heading>
        <Segmented options={[{ label: tr('Lose weight'), value: 'lose' as Goal }, { label: tr('Keep'), value: 'keep' as Goal }, { label: tr('Gain weight'), value: 'gain' as Goal }]}
          value={goal} onChange={setGoal} />
        {goal !== 'keep' ? (
          <>
            <NumberField live label={goal === 'lose' ? tr('How many kg to lose?') : tr('How many kg to gain?')} decimal value={goalKg} onChange={setGoalKg} />
            <Text style={s.fieldLabel}>{tr('By when?')}</Text>
            <Segmented options={WHEN.map(w => ({ label: tr(w.label), value: w.weeks }))} value={weeks} onChange={setWeeks} />
          </>
        ) : null}
      </Card>

      {plan ? (
        <Card style={{ borderLeftWidth: 5, borderLeftColor: colors.insight, gap: 6 }}>
          <Text style={{ color: colors.insight, fontWeight: '700' }}>{tr('Myra’s daily plan for you')}</Text>
          <Text style={{ color: colors.ink, fontSize: 16 }}>
            {tr('Food {kcal} kcal · Protein {protein} g', { kcal: plan.kcal.toLocaleString(), protein: plan.protein })}
          </Text>
          <Text style={{ color: colors.ink, fontSize: 16 }}>
            {tr('{steps} steps · {active} active minutes', { steps: plan.steps.toLocaleString(), active: plan.active })}
          </Text>
          {!plan.adult ? <Note>{tr('Under 18: Myra helps with healthy habits, not weight goals.')}</Note>
            : plan.weeks ? <Note>{tr('About {kg} kg a week, so about {weeks} weeks.', { kg: Math.abs(plan.weeklyKg), weeks: plan.weeks })}</Note> : null}
          {plan.adult && plan.slowedDown ? <Text style={{ color: colors.insight }}>{tr('That pace is faster than is safe, so Myra planned a gentler one.')}</Text> : null}
          <Note>{tr('BMI {bmi}', { bmi: plan.bmi })}</Note>
        </Card>
      ) : null}

      <Button kind="insight" title={tr('Save')} onPress={save} disabled={!plan} />
      <Button kind="plain" title={tr('Skip for now')} onPress={done} />
      <Note>{tr('Not medical advice. If you have a health condition, are pregnant or take regular medicines, check with your doctor before a weight goal.')}</Note>
    </Screen>
  );
}
