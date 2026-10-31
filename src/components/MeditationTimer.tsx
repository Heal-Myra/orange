// Guided meditation inside the app: the app suggests a length, guides the breath, and records the minutes actually sat.

import { MyraLine } from './MyraLine';
import { PASTEL, RingPanel } from './Rings';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Expandable, Heading, Meter, Note, Score, Segmented } from './ui';
import { newGoal, todaysLength } from '../lib/meditationPlan';
import { lang, locale } from '../lib/i18n';
import { MESSAGE_LANGS } from '../lib/foodPlan';
import { carePlan } from '../lib/care';
import { hasGuide } from '../lib/practiceGuide';
import { hasVoice, voiceLang } from '../lib/voice';
import { Ionicons } from '@expo/vector-icons';
import { PRACTICES, type PracticeId } from '../lib/pranayama';
import { tr } from '../lib/i18n';

const CHOICES = [5, 10, 15]; // founder, 24 Oct 2026
// A calm breathing rhythm: breathe in 4 s, breathe out 6 s (a longer out-breath settles the body).
const breath = (sec: number) => (sec % 10 < 4 ? tr('Breathe in…') : tr('Breathe out, slowly…'));

export function MeditationTimer() {
  const { day, days, date, profile, setProfile, update } = useHeal();
  const target = profile.meditation;
  const done = day.mind.meditationMin ?? 0;
  // A goal grows the guided length gradually (founder, 24 Oct 2026); without one, the old suggestion.
  const goal = profile.me?.meditationGoal;
  const plan = goal ? todaysLength(goal, days, date) : null;
  const suggested = plan ? plan.minutes : Math.max(5, Math.min(15, Math.round((target - done || 5) / 5) * 5));
  const choices = plan && !CHOICES.includes(plan.minutes) ? [plan.minutes, ...CHOICES].sort((a, b) => a - b) : CHOICES;
  const [length, setLength] = useState(choices.includes(suggested) ? suggested : 10);
  const [mode, setMode] = useState<'guided' | 'self'>('guided');
  const [pick, setPick] = useState<PracticeId>('mix');
  const [choosing, setChoosing] = useState(false);
  const careName = carePlan(day.feeling?.symptoms ?? [])?.name; // care plan (25 Oct 2026)
  const [gLangLocal, setGLangLocal] = useState<string | null>(null);
  const gLang = gLangLocal ?? profile.me?.guideLang ?? lang();
  // Which languages this phone can speak (founder, 24 Oct 2026: Gujarati was silent). Checked once.
  const [voices, setVoices] = useState<Record<string, boolean>>({});
  useEffect(() => { Promise.all(MESSAGE_LANGS.map(async l => [l.code, await hasVoice(voiceLang(l.code))] as const)).then(r => setVoices(Object.fromEntries(r))).catch(() => {}); }, []);
  const setGLang = (c: string) => { setGLangLocal(c); if (profile.me) setProfile({ ...profile, me: { ...profile.me, guideLang: c } }); };
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0); // time already sat before a pause
  const [now, setNow] = useState(Date.now());
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = startedAt != null;
  const elapsedMs = pausedMs + (running ? now - startedAt : 0);
  const left = Math.max(0, length * 60_000 - elapsedMs);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setNow(Date.now()), 500);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);

  const finish = (ms: number) => {
    const minutes = Math.round(ms / 60_000);
    if (minutes > 0) update(d => { d.mind.meditationMin = (d.mind.meditationMin ?? 0) + minutes; });
    setStartedAt(null); setPausedMs(0);
  };

  useEffect(() => { if (running && left === 0) finish(length * 60_000); }, [left, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { setNow(Date.now()); setStartedAt(Date.now()); };
  const pause = () => { setPausedMs(elapsedMs); setStartedAt(null); };
  const mm = Math.floor(left / 60_000), ss = Math.floor((left % 60_000) / 1000);
  const sitting = running || pausedMs > 0;

  return (
    <Card>
      <Heading right={<Score value={Math.min(30, (30 * done) / target)} max={30} />}>{tr('Breathing & meditation')}</Heading>
      <RingPanel score={Math.min(30, (30 * done) / target)} max={30} items={[
        { id: 'min', color: PASTEL.lavender, label: tr('Minutes today'), value: done / target, text: `${done} / ${target} min` },
      ]} />
      {!sitting ? (
        <>
          <Note>{plan ? tr('Today\'s plan: {m} minutes, on the way to {goal} minutes a day.', { m: plan.minutes, goal: goal!.minutes })
            : done >= target ? tr('You have sat {done} minutes today. Lovely. Another short sit is always welcome.', { done }) : tr('Suggested now: {suggested} minutes (today {done} of {target}).', { suggested, done, target })}</Note>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {choices.map(m => (
              <Pressable key={m} onPress={() => setLength(m)}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: m === length ? colors.soul : colors.line, backgroundColor: m === length ? colors.soul + '18' : colors.surface }}>
                <Text style={{ color: colors.ink, fontWeight: m === length ? '700' : '400' }}>{m} {tr('min')}{plan && m === plan.minutes ? ` · ${tr('plan')}` : ''}</Text>
              </Pressable>
            ))}
          </View>
          {/* Guided or on my own (founder, 24 Oct 2026). Guided: choose a pranayama or Myra's mix; Happy Orange's own
              guided session plays (src/app/breathe.tsx). */}
          <Segmented options={[{ label: tr('Guided'), value: 'guided' }, { label: tr('On my own'), value: 'self' }]} value={mode} onChange={setMode} />
          {mode === 'guided' ? (
            <>
              {/* Minimal (founder's rule): the chosen practice shows; the full list opens only when changing it. */}
              <View style={{ gap: 6 }}>
                {PRACTICES.filter(pr => choosing || pr.id === pick).map(pr => {
                  const on = pr.id === pick;
                  const night = new Date().getHours() >= 20 || new Date().getHours() < 5;
                  return (
                    <Pressable key={pr.id} onPress={() => { if (choosing) { setPick(pr.id); setChoosing(false); } else setChoosing(true); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 14, borderWidth: 1,
                        borderColor: on ? colors.soul : colors.line, backgroundColor: on ? colors.soul + '12' : colors.surface }}>
                      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.soul : colors.muted} style={{ marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.ink, fontWeight: on ? '700' : '600' }}>
                          {pr.id === 'mix' && careName ? tr('Care breathing for {what}', { what: tr(careName) }) : tr(pr.name)}{pr.id === 'mix' ? ` · ${tr('Recommended')}` : ''}{pr.energising && night ? ` · ${tr('better in the morning')}` : ''}
                        </Text>
                        {on ? <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{tr(pr.line)}</Text> : null}
                        {on && !choosing && hasGuide(pr.id) ? (
                          <Pressable onPress={() => router.push({ pathname: '/explain', params: { practice: pr.id, lang: gLang } })} hitSlop={6} accessibilityRole="button">
                            <Text style={{ color: colors.insight, fontSize: 13, fontWeight: '700', marginTop: 4 }}>▶ {tr('How to do it')}</Text>
                          </Pressable>
                        ) : null}
                        {on && !choosing ? <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 2 }}>{tr('Choose another practice')} ›</Text> : null}
                        {on && pr.caution ? <Text style={{ color: colors.warn, fontSize: 13, lineHeight: 18 }}>{tr(pr.caution)}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {/* The voice's language (founder, 24 Oct 2026): English, Hindi or a regional language; folds away. */}
              <Expandable icon="language-outline" color={colors.soul} title={tr('Voice language')} status={MESSAGE_LANGS.find(l => l.code === gLang)?.name ?? 'English'}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {MESSAGE_LANGS.map(l => (
                    <Pressable key={l.code} onPress={() => setGLang(l.code)} accessibilityLabel={l.english}
                      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: l.code === gLang ? colors.soul : colors.line, backgroundColor: l.code === gLang ? colors.soul + '18' : colors.surface }}>
                      <Text style={{ color: voices[l.code] === false ? colors.muted : colors.ink, fontWeight: l.code === gLang ? '700' : '400' }}>{l.name}{voices[l.code] === false ? ' · ' + tr('words only') : ''}</Text>
                    </Pressable>
                  ))}
                </View>
                {voices[gLang] === false ? <Note>{tr('This phone has no voice for this language yet, so the words will show on screen. In iPhone Settings › Accessibility › Spoken Content › Voices you can add one.')}</Note> : null}
              </Expandable>
              <Button title={pick === 'nidra' ? tr('Start Yoga Nidra (15 min)') : tr('Start {n}-minute session', { n: length })}
                onPress={() => (pick === 'nidra' ? router.push({ pathname: '/yoga-nidra', params: { lang: gLang } }) : router.push({ pathname: '/breathe', params: { practice: pick, minutes: String(length), lang: gLang } }))} />
            </>
          ) : (
            <>
              <Note>{tr('Sit comfortably, let your eyes close, and follow the breath. The app counts only the minutes you actually sit.')}</Note>
              <Button title={tr('Start {n}-minute session', { n: length })} onPress={start} />
            </>
          )}
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Text style={{ fontSize: 44, color: colors.ink, fontVariant: ['tabular-nums'] }}>{mm}:{String(ss).padStart(2, '0')}</Text>
          <Text style={{ fontSize: 18, color: colors.soul, fontWeight: '600' }}>{running ? breath(Math.floor(elapsedMs / 1000)) : tr('Paused')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {running ? <Button kind="plain" title={tr('Pause')} onPress={pause} /> : <Button title={tr('Continue')} onPress={start} />}
            <Button kind="plain" title={tr('End and save')} onPress={() => finish(elapsedMs)} />
          </View>
          <Note>{tr('Keep this screen open while you sit.')}</Note>
        </View>
      )}
      <Meter label={tr('Today')} value={done} max={target} color={colors.soul} right={`${done} / ${target} ${tr('min')}`} />
      {profile.me ? <GoalRow /> : null}
      <MyraLine card="meditation" />
    </Card>
  );
}

const GOAL_MIN = [10, 15, 20, 30, 45, 60];
const GOAL_WEEKS: { weeks: number; label: string }[] = [{ weeks: 4, label: '1 month' }, { weeks: 8, label: '2 months' }, { weeks: 13, label: '3 months' }, { weeks: 26, label: '6 months' }];

/** Meditation goal (optional, folds away): minutes a day, and by when. Happy Orange grows the guided length gradually. */
function GoalRow() {
  const { days, date, profile, setProfile } = useHeal();
  const goal = profile.me?.meditationGoal;
  const plan = goal ? todaysLength(goal, days, date) : null;
  const [mins, setMins] = useState(goal?.minutes ?? 20);
  const [weeks, setWeeks] = useState(8);
  const by = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(locale(), { day: 'numeric', month: 'short' }); };
  const status = !goal ? tr('Optional · grow your sessions step by step')
    : plan!.pace === 'reached' ? tr('{m} minutes a day reached', { m: goal.minutes })
    : `${tr('{m} min a day by {date}', { m: goal.minutes, date: by(goal.by) })} · ${plan!.pace === 'gentler' ? tr('at your pace') : tr('on track')}`;
  const chip = (on: boolean) => ({ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.soul : colors.line, backgroundColor: on ? colors.soul + '18' : colors.surface });
  return (
    <Expandable icon="trending-up-outline" color={colors.soul} title={tr('Meditation goal')} status={status}>
      <Text style={{ color: colors.ink }}>{tr('Minutes a day I want to reach')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {GOAL_MIN.map(m => <Pressable key={m} onPress={() => setMins(m)} style={chip(m === mins)}><Text style={{ color: colors.ink }}>{m} {tr('min')}</Text></Pressable>)}
      </View>
      <Text style={{ color: colors.ink }}>{tr('By when')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {GOAL_WEEKS.map(w => <Pressable key={w.weeks} onPress={() => setWeeks(w.weeks)} style={chip(w.weeks === weeks)}><Text style={{ color: colors.ink }}>{tr(w.label)}</Text></Pressable>)}
      </View>
      <Button title={goal ? tr('Update my goal') : tr('Set my goal')} onPress={() => {
        if (!profile.me) return;
        setProfile({ ...profile, me: { ...profile.me, meditationGoal: newGoal(mins, weeks, days, date) } });
      }} />
      <Note>{tr('Guided sessions start from what you do now and grow a little each week. If sessions get hard, Myra slows down to your pace.')}</Note>
      {goal ? <Pressable onPress={() => profile.me && setProfile({ ...profile, me: { ...profile.me, meditationGoal: undefined } })}><Text style={{ color: colors.bad }}>{tr('Remove goal')}</Text></Pressable> : null}
    </Expandable>
  );
}
