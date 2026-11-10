// About you: the one sign-up screen after the privacy step (founder, 21 Oct 2026), skippable and changeable from Profile.
// Order: name, age, sex, height, weight, religion (picks the Daily Wisdom), and the goal in the person's own words.
// Myra reads the goal (AI action goal_plan; a simple reader when offline), sets the daily targets
// (src/lib/targets.ts, with safe limits) and says plainly when a goal is too steep.

import { fastHabit } from '../lib/fasting';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Note, NumberField, Screen, Segmented, TextField, s } from '../components/ui';
import { readRoutine, understandGoal } from '../lib/ai';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/dates';
import { tr, useLang } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { parseGoal, planFor, type AboutMe, type Plan, type Sex } from '../lib/targets';
import { TRADITIONS, type Tradition } from '../lib/wisdom';
import { colors } from '../theme';

// From Profile it opens in two parts (founder, 10 Nov 2026): "My profile" (who you are now: details, language, Daily
// Wisdom, your usual day, fasting) and "My goals" (where you are against your goal, and the goal itself). At sign-up,
// with no part, everything shows on one screen.
export default function AboutYou() {
  const { part } = useLocalSearchParams<{ part?: 'profile' | 'goals' }>();
  const showProfile = part !== 'goals', showGoals = part !== 'profile';
  const { profile, setProfile, markMeAsked, day, days } = useHeal();
  const { session, tradition, setTradition } = useAuth();
  const me = profile.me;
  const { lang: appLang, setLang } = useLang(); // Language lives here now (founder, 10 Nov 2026)
  const [name, setName] = useState(me?.name ?? '');
  const [age, setAge] = useState<number | undefined>(me?.age);
  const [sex, setSex] = useState<Sex | undefined>(me?.sex);
  const [height, setHeight] = useState<number | undefined>(me?.heightCm);
  const [weight, setWeight] = useState<number | undefined>(me?.weightKg ?? day.health?.weightKg);
  const [faith, setFaith] = useState<Tradition | null>(tradition);
  const [goalText, setGoalText] = useState(me?.goalText ?? '');
  const [dayText, setDayText] = useState(me?.dayText ?? '');
  // Fasting by choice (decision 0044): hours (0 = I don't), and when the last meal usually is.
  const auto = fastHabit(me);
  const [fastH, setFastH] = useState<number>(me?.fast ? (me.fast.off ? 0 : me.fast.hours) : auto?.hours ?? 0);
  const [lastMeal, setLastMeal] = useState(me?.fast?.lastMeal ?? auto?.lastMeal ?? '21:00');
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
    // The usual day → a timetable (Myra reads it; kept as it was if the words did not change).
    const day = dayText.trim();
    next.dayText = day || undefined;
    next.fast = { hours: fastH, lastMeal: /^\d{1,2}:\d{2}$/.test(lastMeal.trim()) ? lastMeal.trim().padStart(5, '0') : '21:00', ...(fastH ? {} : { off: true }) };
    if (day && day === me?.dayText && me?.routine?.length) next.routine = me.routine;
    else if (day && session) { try { next.routine = (await readRoutine(day)).routine; } catch { next.routine = me?.routine; } }
    else if (!day) next.routine = undefined;
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
          {m.routine?.length ? (
            <View style={{ gap: 2, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
              <Text style={{ color: colors.ink, fontWeight: '600' }}>{tr('Your day, as Myra understood it')}</Text>
              {m.routine.map((it, i) => (
                <Text key={i} style={{ color: colors.muted, fontVariant: ['tabular-nums'] }}>
                  {it.at}  {it.what}{it.days === 'weekdays' ? ` · ${tr('Mon–Fri')}` : it.days === 'weekend' ? ` · ${tr('weekend')}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
          <Note>{tr('BMI {bmi}', { bmi: plan.bmi })}</Note>
        </Card>
        <Button kind="insight" title={tr('Done')} onPress={done} />
        <Button kind="plain" title={tr('Change my goal')} onPress={() => setResult(null)} />
        <Note>{tr('Not medical advice. If you have a health condition, are pregnant or take regular medicines, check with your doctor before a weight goal.')}</Note>
      </Screen>
    );
  }

  // Where you are now: the latest weight from any day, against the start and the aim.
  const latest = Object.keys(days).sort().reverse().map(k => days[k]?.health?.weightKg).find((w): w is number => typeof w === 'number');
  const aimKg = me?.goalKg && me.goal !== 'keep' ? Math.round((me.weightKg + (me.goal === 'lose' ? -1 : 1) * me.goalKg) * 10) / 10 : null;
  const progress = me && aimKg != null && latest != null
    ? Math.max(0, Math.min(1, (me.weightKg - latest) / (me.weightKg - aimKg))) : null;

  return (
    <Screen showDay={false}>
      {showGoals && part === 'goals' && me ? (
        <Card style={{ gap: 8 }}>
          <Heading>{tr('Where you are')}</Heading>
          <View style={{ flexDirection: 'row' }}>
            {[[tr('Start'), `${me.weightKg} kg`], [tr('Now'), latest != null ? `${latest} kg` : '–'], [tr('Aim'), aimKg != null ? `${aimKg} kg` : tr('Keep weight')]].map(([l, v]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{l}</Text>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>{v}</Text>
              </View>
            ))}
          </View>
          {progress != null ? (
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.line }}>
              <View style={{ height: 8, borderRadius: 4, width: `${Math.round(progress * 100)}%`, backgroundColor: colors.accent }} />
            </View>
          ) : null}
          <Note>{tr('Daily plan: {kcal} kcal · protein {p} g · {steps} steps', { kcal: profile.kcal, p: profile.protein, steps: profile.steps.toLocaleString() })}</Note>
          {me.goalNote ? <Text style={{ color: colors.insight }}>{me.goalNote}</Text> : null}
        </Card>
      ) : null}
      {part === 'goals' && !me ? <Note>{tr('Fill in My profile first, so Myra can plan your goal.')}</Note> : null}
      {showProfile ? <>
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
        <Heading>{tr('Language')}</Heading>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([['en', 'English'], ['hi', 'हिंदी']] as const).map(([id, name]) => {
            const on = appLang === id;
            return (
              <Pressable key={id} onPress={() => setLang(id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1,
                  borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent + '14' : colors.surface }}>
                <Text style={{ color: on ? colors.accent : colors.ink, fontWeight: on ? '700' : '400' }}>{name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Note>{tr('The whole app and Myra follow it.')}</Note>
      </Card>

      <Card>
        <Heading>{tr('Daily Wisdom')}</Heading>
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

      </> : null}

      {showGoals ? <Card>
        <Heading>{tr('Your goal')}</Heading>
        <TextField label={tr('In your own words')} value={goalText} onChangeText={setGoalText} multiline
          placeholder={tr('e.g. Lose 6 kg by March, walk 10,000 steps a day, sleep better')} />
        <Note>{tr('Myra will shape your food and exercise around it, and tell you if it is too steep.')}</Note>
      </Card> : null}

      {showProfile ? <>

      <Card>
        <Heading>{tr('Your usual day')}</Heading>
        <TextField label={tr('In your own words (optional)')} value={dayText} onChangeText={setDayText} multiline
          placeholder={tr('e.g. Wake 5:30, tea and plan. Walk 6–8. Office Mon–Fri 9 to 6, tea at 11 and 3, lunch 1. Dinner 7. Sleep 9:30.')} />
        <Note>{tr('Five minutes before each change in your day, Myra puts one fitting thing in front of you: a work task on reaching office, a family task at family time.')}</Note>
      </Card>

      <Card style={{ gap: 10 }}>
        <Heading>{tr('Fasting by choice')}</Heading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[0, 14, 16, 18].map(h => (
            <Pressable key={h} onPress={() => setFastH(h)} accessibilityRole="radio" accessibilityState={{ selected: fastH === h }}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: fastH === h ? colors.accent : colors.line, backgroundColor: fastH === h ? colors.tint : colors.surface }}>
              <Text style={{ color: colors.ink, fontWeight: '600' }}>{h ? `${h} h` : tr("I don't fast")}</Text>
            </Pressable>
          ))}
        </View>
        {fastH ? <TextField label={tr('My last meal is usually at (24-hour, e.g. 21:00)')} value={lastMeal} onChangeText={setLastMeal} /> : null}
        <Note>{tr('The hours without food earn Food points, so a morning without breakfast counts as a good morning.')}</Note>
      </Card>
      </> : null}

      <Button kind="insight" title={busy ? tr('Myra is reading your goal…') : tr('Save')} onPress={save} disabled={!complete || busy} />
      {!complete && part !== 'goals' ? <Note>{tr('Fill in age, sex, height and weight to continue.')}</Note> : null}
      {!part ? <Button kind="plain" title={tr('Skip for now')} onPress={done} /> : null}
    </Screen>
  );
}
