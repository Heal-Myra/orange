// About you: the one sign-up screen after the privacy step (founder, 21 Oct 2026), skippable and changeable from Profile.
// Order: name, age, sex, height, weight, religion (picks the Daily Wisdom), and the goal in the person's own words.
// Myra reads the goal (AI action goal_plan; a simple reader when offline), sets the daily targets
// (src/lib/targets.ts, with safe limits) and says plainly when a goal is too steep.

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Note, NumberField, Screen, Segmented, TextField, s } from '../components/ui';
import { understandGoal } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { parseGoal, planFor, type AboutMe, type Plan, type Sex } from '../lib/targets';
import { TRADITIONS, type Tradition } from '../lib/wisdom';
import { colors } from '../theme';

export default function AboutYou() {
  const { profile, setProfile, markMeAsked, day } = useHeal();
  const { session, tradition, setTradition } = useAuth();
  const me = profile.me;
  const [name, setName] = useState(me?.name ?? '');
  const [age, setAge] = useState<number | undefined>(me?.age);
  const [sex, setSex] = useState<Sex | undefined>(me?.sex);
  const [height, setHeight] = useState<number | undefined>(me?.heightCm);
  const [weight, setWeight] = useState<number | undefined>(me?.weightKg ?? day.health?.weightKg);
  const [faith, setFaith] = useState<Tradition | null>(tradition);
  const [goalText, setGoalText] = useState(me?.goalText ?? '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ me: AboutMe; plan: Plan } | null>(null);

  const complete = !!(weight && weight >= 25 && weight <= 300 && height && height >= 100 && height <= 250 && sex && age && age >= 10 && age <= 110);

  const save = async () => {
    if (!complete) return;
    setBusy(true);
    const base = { name: name.trim() || undefined, weightKg: weight!, heightCm: height!, sex: sex!, age: age!, setAt: todayISO() };
    const text = goalText.trim();
    let next: AboutMe = { ...base, goal: 'keep', goalText: text || undefined };
    if (text) {
      try {
        if (!session) throw new Error('offline');
        const r = await understandGoal(text, { age: age!, sex: sex!, heightCm: height!, weightKg: weight! }, todayISO());
        next = { ...next, goal: r.goal, goalKg: r.kg ?? undefined, goalWeeks: r.weeks ?? undefined, aims: r.aims || undefined, goalNote: r.message || undefined };
      } catch {
        next = { ...next, ...parseGoal(text) };
      }
    }
    const plan = planFor(next);
    if (!next.goalNote && plan.adult && plan.slowedDown) next.goalNote = tr('Too fast to be safe: Myra planned about {weeks} weeks.', { weeks: plan.weeks });
    setProfile({ ...profile, kcal: plan.kcal, protein: plan.protein, steps: plan.steps, active: plan.active, me: next });
    if (faith && faith !== tradition) await setTradition(faith);
    setResult({ me: next, plan });
    setBusy(false);
  };

  const done = () => { markMeAsked(); if (router.canGoBack()) router.back(); else router.replace('/'); };

  if (result) {
    const { plan, me: m } = result;
    return (
      <Screen showDay={false}>
        <Card style={{ borderLeftWidth: 5, borderLeftColor: colors.insight, gap: 8 }}>
          <Text style={{ color: colors.insight, fontWeight: '700' }}>{tr('Myra’s daily plan for you')}</Text>
          {m.goalNote ? <Text style={{ color: colors.insight, fontSize: 16 }}>{m.goalNote}</Text> : null}
          <Text style={{ color: colors.ink, fontSize: 16 }}>{tr('Food {kcal} kcal · Protein {protein} g', { kcal: plan.kcal.toLocaleString(), protein: plan.protein })}</Text>
          <Text style={{ color: colors.ink, fontSize: 16 }}>{tr('{steps} steps · {active} active minutes', { steps: plan.steps.toLocaleString(), active: plan.active })}</Text>
          {!plan.adult ? <Note>{tr('Under 18: Myra helps with healthy habits, not weight goals.')}</Note>
            : plan.weeks ? <Note>{tr('About {kg} kg a week, so about {weeks} weeks.', { kg: Math.abs(plan.weeklyKg), weeks: plan.weeks })}</Note> : null}
          {m.aims ? <Note>{tr('Also working toward: {aims}', { aims: m.aims })}</Note> : null}
          <Note>{tr('BMI {bmi}', { bmi: plan.bmi })}</Note>
        </Card>
        <Button kind="insight" title={tr('Done')} onPress={done} />
        <Button kind="plain" title={tr('Change my goal')} onPress={() => setResult(null)} />
        <Note>{tr('Not medical advice. If you have a health condition, are pregnant or take regular medicines, check with your doctor before a weight goal.')}</Note>
      </Screen>
    );
  }

  return (
    <Screen showDay={false}>
      <Card>
        <Heading>{tr('Your details')}</Heading>
        <Note>{tr('So Myra can set your daily food and movement targets. Only you can see them.')}</Note>
        <TextField label={tr('Name')} value={name} onChangeText={setName} placeholder={tr('What should Myra call you?')} />
        <View style={s.row}>
          <NumberField live label={tr('Age (years)')} value={age} onChange={setAge} />
          <NumberField live label={tr('Height (cm)')} value={height} onChange={setHeight} />
          <NumberField live label={tr('Weight (kg)')} decimal value={weight} onChange={setWeight} />
        </View>
        <Text style={s.fieldLabel}>{tr('Sex')}</Text>
        <Segmented options={[{ label: tr('Male'), value: 'male' as Sex }, { label: tr('Female'), value: 'female' as Sex }, { label: tr('Prefer not to say'), value: 'other' as Sex }]}
          value={sex} onChange={setSex} />
      </Card>

      <Card>
        <Heading>{tr('Religion')}</Heading>
        <Note>{tr('Your Daily Wisdom on the Soul tab comes from this. Optional and private.')}</Note>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRADITIONS.map(t => {
            const on = faith === t.id;
            return (
              <Pressable key={t.id} onPress={() => setFaith(t.id)} accessibilityRole="button"
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1,
                  borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent + '14' : colors.surface }}>
                <Text style={{ color: on ? colors.accent : colors.ink, fontWeight: on ? '700' : '400' }}>{tr(t.name)}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Heading>{tr('Your goal')}</Heading>
        <TextField label={tr('In your own words')} value={goalText} onChangeText={setGoalText} multiline
          placeholder={tr('e.g. Lose 6 kg by March, walk 10,000 steps a day, sleep better')} />
        <Note>{tr('Myra will shape your food and exercise around it, and tell you if it is too steep.')}</Note>
      </Card>

      <Button kind="insight" title={busy ? tr('Myra is reading your goal…') : tr('Save')} onPress={save} disabled={!complete || busy} />
      {!complete ? <Note>{tr('Fill in age, sex, height and weight to continue.')}</Note> : null}
      <Button kind="plain" title={tr('Skip for now')} onPress={done} />
    </Screen>
  );
}
