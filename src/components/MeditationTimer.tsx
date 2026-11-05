// Meditation (founder, 3 and 5 Nov 2026; decision 0049): what do you want help with? → Myra recommends one practice;
// then choose your way: the 10-day Dhamma path, guided (Myra's voice) or on my own (a quiet timer). While the Dhamma
// path runs, the card shows only today's step; the other practices fold away (one method at a time).

import { MyraLine } from './MyraLine';
import { PASTEL, RingStack } from './Rings';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Button, Card, Expandable, Heading, Note, Score } from './ui';
import { newGoal, todaysLength } from '../lib/meditationPlan';
import { lang, locale } from '../lib/i18n';
import { MESSAGE_LANGS } from '../lib/foodPlan';
import { carePlan } from '../lib/care';
import { hasGuide } from '../lib/practiceGuide';
import { hasVoice, voiceLang } from '../lib/voice';
import { practice, type PracticeId } from '../lib/pranayama';
import { AIMS, practicesFor, WHY, type AimId } from '../lib/medAims';
import { minutesFor, pathState, satToday, stageOf, STEPS, type Feel, type PathState } from '../lib/dhamma';
import { CARD_LINE, feelLine, STAGE_NAME } from '../lib/dhammaScript';
import { tr } from '../lib/i18n';

const CHOICES = [5, 10, 15]; // founder, 24 Oct 2026
// A calm breathing rhythm: breathe in 4 s, breathe out 6 s (a longer out-breath settles the body).
const breath = (sec: number) => (sec % 10 < 4 ? tr('Breathe in…') : tr('Breathe out, slowly…'));
const STAGE_COLOR = { breath: PASTEL.sky, body: PASTEL.lavender, kind: PASTEL.rose } as const;
const STAGE_INK = { breath: '#4D7FB5', body: '#6A62A8', kind: '#A86A85' } as const; // readable text in each stage colour
type Way = 'dhamma' | 'guided' | 'self';
let lastAim: AimId | null = null; // remembered while the app is open

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
  const path = useMemo(() => pathState(days, date), [days, date]);
  const onPath = path.active && !path.finished;
  const [way, setWay] = useState<Way>(path.active ? 'dhamma' : 'guided');
  const [aim, setAimState] = useState<AimId | null>(lastAim);
  const setAim = (a: AimId | null) => { lastAim = a; setAimState(a); setPick(null); };
  const [pick, setPick] = useState<PracticeId | null>(null);
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
  const guided = (id: PracticeId) => (id === 'nidra' ? router.push({ pathname: '/yoga-nidra', params: { lang: gLang } }) : router.push({ pathname: '/breathe', params: { practice: id, minutes: String(length), lang: gLang } }));
  const score = Math.min(30, (30 * done) / target);
  const dayNo = path.today?.step ?? path.next;
  const title = onPath ? tr('Meditation · Day {n} of 10', { n: Math.min(STEPS, dayNo) }) : tr('Meditation');

  // What do you want help with? → Myra's practice (shared by the card and, during the path, its folded "Other practices").
  const practices = (
    <>
      <HelpWith aim={aim} onAim={setAim} />
      {aim ? <Recommend aim={aim} pick={pick} onPick={setPick} gentle={path.gentle} length={length} gLang={gLang} onGuided={guided} onSelf={start} />
        : <MyraBox>{tr("Pick what you want help with, and I'll choose the practice.")}</MyraBox>}
    </>
  );
  const lengthAndVoice = (
    <Expandable icon="options-outline" color={colors.soul} title={tr('Length and voice')} status={`${length} ${tr('min')} · ${MESSAGE_LANGS.find(l => l.code === gLang)?.name ?? 'English'}`}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {choices.map(m => (
          <Pressable key={m} onPress={() => setLength(m)} style={chip(m === length)}>
            <Text style={{ color: colors.ink, fontWeight: m === length ? '700' : '400' }}>{m} {tr('min')}{plan && m === plan.minutes ? ` · ${tr('plan')}` : ''}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {MESSAGE_LANGS.map(l => (
          <Pressable key={l.code} onPress={() => setGLang(l.code)} accessibilityLabel={l.english} style={chip(l.code === gLang)}>
            <Text style={{ color: voices[l.code] === false ? colors.muted : colors.ink, fontWeight: l.code === gLang ? '700' : '400' }}>{l.name}{voices[l.code] === false ? ' · ' + tr('words only') : ''}</Text>
          </Pressable>
        ))}
      </View>
      {voices[gLang] === false ? <Note>{tr('This phone has no voice for this language yet, so the words will show on screen. In iPhone Settings › Accessibility › Spoken Content › Voices you can add one.')}</Note> : null}
    </Expandable>
  );

  return (
    <Card>
      <Heading right={<Score value={score} max={30} />}>{title}</Heading>
      {sitting ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <Text style={{ fontSize: 44, color: colors.ink, fontVariant: ['tabular-nums'] }}>{mm}:{String(ss).padStart(2, '0')}</Text>
          <Text style={{ fontSize: 18, color: colors.soul, fontWeight: '600' }}>{running ? breath(Math.floor(elapsedMs / 1000)) : tr('Paused')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {running ? <Button kind="plain" title={tr('Pause')} onPress={pause} /> : <Button title={tr('Continue')} onPress={start} />}
            <Button kind="plain" title={tr('End and save')} onPress={() => finish(elapsedMs)} />
          </View>
          <Note>{tr('Keep this screen open while you sit.')}</Note>
        </View>
      ) : onPath ? (
        <>
          <DhammaToday path={path} gLang={gLang} />
          <Expandable icon="leaf-outline" color={colors.soul} title={tr('Other practices')} status={tr('Paused during the 10 days: one method at a time')}>
            {practices}
            {lengthAndVoice}
            <LeavePath />
          </Expandable>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <RingStack size={112} items={[{ id: 'min', color: PASTEL.lavender, label: tr('Minutes today'), value: done / target }]} center={String(done)} sub={tr('of {t} min', { t: target })} />
            <View style={{ flex: 1 }}><HelpWith aim={aim} onAim={setAim} /></View>
          </View>
          {way !== 'dhamma' && aim ? <Recommend aim={aim} pick={pick} onPick={setPick} gentle={path.gentle} length={length} gLang={gLang} onGuided={guided} onSelf={start} /> : null}
          <Text style={lab}>{tr('CHOOSE YOUR WAY')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['dhamma', '🪷', 'Dhamma path', '10 days, one step a day'], ['guided', '🎧', 'Guided', "Myra's voice leads you"], ['self', '⏱', 'On my own', 'A quiet timer and bell']] as const).map(([id, icon, name, line]) => (
              <Pressable key={id} onPress={() => setWay(id)} accessibilityRole="radio" accessibilityState={{ selected: way === id }}
                style={{ flex: 1, borderWidth: way === id ? 1.5 : 1, borderColor: way === id ? colors.accent : colors.line, backgroundColor: way === id ? colors.accent + '0D' : colors.surface, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 22 }}>{icon}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>{tr(name)}</Text>
                <Text style={{ fontSize: 11.5, color: colors.muted, textAlign: 'center', lineHeight: 15 }}>{tr(line)}</Text>
              </Pressable>
            ))}
          </View>
          {way === 'dhamma' ? (path.finished ? <AfterTen gLang={gLang} /> : <DhammaStart gLang={gLang} />)
            : !aim && way === 'guided' ? <Button title={careName ? tr('Care breathing for {what}', { what: tr(careName) }) + ` · ${length} ${tr('min')}` : tr('Start {n}-minute session', { n: length })} onPress={() => guided('mix')} />
            : !aim ? (
              <>
                <Note>{tr('Sit comfortably, let your eyes close, and follow the breath. The app counts only the minutes you actually sit.')}</Note>
                <Button title={tr('Start {n}-minute session', { n: length })} onPress={start} />
              </>
            ) : null}
          {way !== 'dhamma' ? lengthAndVoice : null}
        </>
      )}
      {profile.me && !onPath ? <GoalRow /> : null}
      <MyraLine card="meditation" />
    </Card>
  );
}

const lab = { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.5, color: colors.muted, marginTop: 4 };
const chip = (on: boolean) => ({ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.soul : colors.line, backgroundColor: on ? colors.soul + '18' : colors.surface });

function MyraBox({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: colors.insight + '0F', borderRadius: 14, padding: 11 }}>
      <Text style={{ color: colors.insight, fontSize: 14 }}>✦</Text>
      <Text style={{ flex: 1, color: colors.insight, fontWeight: '600', fontSize: 14, lineHeight: 19 }}>{children}</Text>
    </View>
  );
}

/** "What do you want help with?": six aims as small chips. */
function HelpWith({ aim, onAim }: { aim: AimId | null; onAim: (a: AimId | null) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={lab}>{tr('WHAT DO YOU WANT HELP WITH?')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {AIMS.map(a => {
          const on = a.id === aim;
          return (
            <Pressable key={a.id} onPress={() => onAim(on ? null : a.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              style={{ borderWidth: 1, borderRadius: 99, paddingVertical: 5, paddingHorizontal: 9, borderColor: on ? PASTEL.lavender : colors.line, backgroundColor: on ? PASTEL.lavender + '2A' : colors.surface }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: on ? '#4F4895' : colors.ink }}>{a.icon} {tr(a.name)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Myra's one practice for the aim, with the others that also help. */
function Recommend({ aim, pick, onPick, gentle, length, gLang, onGuided, onSelf }: {
  aim: AimId; pick: PracticeId | null; onPick: (p: PracticeId) => void; gentle: boolean; length: number; gLang: string;
  onGuided: (p: PracticeId) => void; onSelf: () => void;
}) {
  const { list, noEnergy } = practicesFor(aim, new Date().getHours(), gentle);
  const id = pick && list.includes(pick) ? pick : list[0];
  const pr = practice(id);
  const aimName = tr(AIMS.find(a => a.id === aim)!.name);
  const others = list.filter(x => x !== id);
  return (
    <View style={{ backgroundColor: colors.insight + '0B', borderRadius: 16, padding: 12, gap: 4 }}>
      <Text style={{ ...lab, color: colors.insight, marginTop: 0 }}>✦ {tr('MYRA RECOMMENDS FOR {what}', { what: aimName.toUpperCase() })}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>{tr(pr.name)} · {id === 'nidra' ? 15 : length} {tr('min')}</Text>
      <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{tr(WHY[id] ?? pr.line)}</Text>
      {noEnergy ? <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>{tr('Strong energising breaths are for the morning, so Myra chose a calmer one.')}</Text> : null}
      {pr.caution ? <Text style={{ color: colors.warn, fontSize: 13, lineHeight: 18 }}>{tr(pr.caution)}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        <Pressable onPress={() => onGuided(id)} accessibilityRole="button" style={{ backgroundColor: colors.accent, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{tr('Start · guided')}</Text>
        </Pressable>
        {id !== 'nidra' ? (
          <Pressable onPress={onSelf} accessibilityRole="button" style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 16 }}>
            <Text style={{ color: colors.ink, fontWeight: '600', fontSize: 14 }}>{tr('On my own')}</Text>
          </Pressable>
        ) : null}
      </View>
      {hasGuide(id) ? (
        <Pressable onPress={() => router.push({ pathname: '/explain', params: { practice: id, lang: gLang } })} hitSlop={6} accessibilityRole="button">
          <Text style={{ color: colors.insight, fontSize: 13, fontWeight: '700', marginTop: 6 }}>▶ {tr('How to do it')}</Text>
        </Pressable>
      ) : null}
      {others.length ? (
        <Text style={{ fontSize: 13, color: colors.accent, fontWeight: '600', marginTop: 6 }}>
          {tr('Also good for {what}:', { what: aimName.toLowerCase() })}{' '}
          {others.map((o, k) => <Text key={o} onPress={() => onPick(o)} suppressHighlighting>{k ? ' · ' : ''}{tr(practice(o).name)}</Text>)} ›
        </Text>
      ) : null}
    </View>
  );
}

/** The 10 days as dots: done, today, still to come. */
function Dots({ path }: { path: PathState }) {
  const current = path.today ? path.today.step : path.next;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {Array.from({ length: STEPS }, (_, k) => {
          const n = k + 1, c = STAGE_COLOR[stageOf(n)], done = path.done.includes(n), now = n === current && !done;
          return (
            <View key={n} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: now ? 2 : 1, borderColor: c, backgroundColor: done ? c : now ? c + '22' : colors.surface }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: done ? '#fff' : colors.ink }}>{done ? '✓' : n}</Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: STAGE_INK.breath }}>{tr('Days 1–3 Breath')}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: STAGE_INK.body }}>{tr('Days 4–9 Body')}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: STAGE_INK.kind }}>{tr('Day 10 Kindness')}</Text>
      </View>
    </View>
  );
}

const sit = (gLang: string) => router.push({ pathname: '/sit', params: { lang: gLang } });

/** First time: what the path is, two gentle safety questions, then Day 1. */
function DhammaStart({ gLang }: { gLang: string }) {
  const { update } = useHeal();
  const [panic, setPanic] = useState<boolean | null>(null);
  const [meds, setMeds] = useState<boolean | null>(null);
  const yesNo = (v: boolean | null, set: (b: boolean) => void) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[false, true].map(b => (
        <Pressable key={String(b)} onPress={() => set(b)} accessibilityRole="radio" accessibilityState={{ selected: v === b }}
          style={{ ...chip(v === b), paddingHorizontal: 18, paddingVertical: 8 }}>
          <Text style={{ color: colors.ink, fontWeight: v === b ? '700' : '500' }}>{b ? tr('Yes') : tr('No')}</Text>
        </Pressable>
      ))}
    </View>
  );
  const gentle = !!panic || !!meds;
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{tr('The 10-day Dhamma path')}</Text>
      <Text style={{ fontSize: 14.5, color: colors.ink, lineHeight: 21 }}>{tr('Built like a Dhamma course: one simple step a day, always in order, one method only. Breath first, then the body, then kindness.')}</Text>
      <Dots path={{ active: false, gentle: false, next: 1, soft: false, done: [], finished: false }} />
      <View style={{ backgroundColor: '#F3F6F7', borderRadius: 16, padding: 12, gap: 8 }}>
        <Text style={{ fontWeight: '700', color: colors.ink }}>{tr('Before we start, a few gentle questions')}</Text>
        <Text style={{ color: colors.ink }}>{tr('Have you ever had panic attacks, trauma or serious low moods?')}</Text>
        {yesNo(panic, setPanic)}
        <Text style={{ color: colors.ink }}>{tr('Are you taking medicine for your mind?')}</Text>
        {yesNo(meds, setMeds)}
      </View>
      <Note>{gentle ? tr('Thank you. The path will stay short and gentle, and a word with your doctor first is a good idea.') : tr('If yes, the path stays short and gentle, and we suggest a word with your doctor first.')}</Note>
      <Button title={tr('Begin Day 1')} disabled={panic == null || meds == null} onPress={() => {
        update(d => { d.mind.dhamma = { ...d.mind.dhamma, begun: { gentle, at: new Date().toISOString() }, left: false }; });
        sit(gLang);
      }} />
    </View>
  );
}

/** While the path runs: today's step, or "Day N done" with tomorrow. */
function DhammaToday({ path, gLang }: { path: PathState; gLang: string }) {
  const { update } = useHeal();
  const t = path.today;
  const answer = (f: Feel) => update(d => {
    const sits = [...(d.mind.dhamma?.sits ?? [])];
    if (sits.length) sits[sits.length - 1] = { ...sits[sits.length - 1], feel: f };
    d.mind.dhamma = { ...d.mind.dhamma, sits };
  });
  if (t && satToday(path)) {
    const tomorrow = path.next, st = tomorrow > STEPS ? 'body' : stageOf(tomorrow);
    return (
      <View style={{ gap: 10 }}>
        <Dots path={path} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink }}>{t.feel === 'restless' || t.feel === 'uneasy' ? tr('Day {n} again tomorrow', { n: t.step }) : tr('Day {n} done', { n: t.step })}</Text>
        {!t.feel ? (
          <>
            <Text style={{ color: colors.ink, fontWeight: '600' }}>{tr('How did it feel?')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['calm', '😌', 'Calm'], ['restless', '🌀', 'Restless'], ['uneasy', '😟', 'Uneasy']] as const).map(([id, icon, name]) => (
                <Pressable key={id} onPress={() => answer(id)} accessibilityRole="button" style={{ flex: 1, backgroundColor: '#F3F6F7', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ color: colors.ink, fontWeight: '600' }}>{icon} {tr(name)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : <Note>{feelLine(t.feel, t.step)}</Note>}
        {tomorrow <= STEPS ? <MyraBox>{tr('Tomorrow: {m} minutes, {what}.', { m: minutesFor(tomorrow, path.gentle, path.soft), what: tr(STAGE_NAME[st]).toLowerCase() })}</MyraBox> : null}
      </View>
    );
  }
  const step = path.next, st = stageOf(step), m = minutesFor(step, path.gentle, path.soft);
  return (
    <View style={{ gap: 12 }}>
      <Dots path={path} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <RingStack size={104} items={[{ id: 'sit', color: STAGE_COLOR[st], label: tr(STAGE_NAME[st]), value: 0 }]} center="0" sub={tr('of {t} min', { t: m })} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ ...lab, color: STAGE_INK[st], marginTop: 0 }}>{tr(STAGE_NAME[st]).toUpperCase()}</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 22 }}>{tr(CARD_LINE[st])}</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{tr('{n} minutes', { n: m })} · {tr('guided')}{path.soft ? ` · ${tr('eyes open')}` : ''}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, backgroundColor: PASTEL.sage + '1F', borderRadius: 14, padding: 11 }}>
        <Text style={{ color: '#5E8A50', fontSize: 16 }}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>{tr("Today's promise")}</Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>{tr('No harm, no lies, no stealing, no misconduct, no intoxicants.')}</Text>
        </View>
      </View>
      {path.gentle ? <Note>{tr('Gentle path: shorter sittings. A word with your doctor is a good idea.')}</Note> : null}
      <Button title={tr('Start Day {n} · {m} min', { n: step, m })} onPress={() => sit(gLang)} />
    </View>
  );
}

/** After Day 10: keep sitting morning and evening; a real course is free at dhamma.org. */
function AfterTen({ gLang }: { gLang: string }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.ink }}>{tr('After Day 10')}</Text>
      <Text style={{ fontSize: 14.5, color: colors.ink, lineHeight: 21 }}>{tr('Keep going every day: a morning and an evening sitting. When you are ready, a real 10-day course is free at dhamma.org.')}</Text>
      <Button title={tr('Sit now · {m} min', { m: minutesFor(STEPS + 1, false, false) })} onPress={() => sit(gLang)} />
    </View>
  );
}

/** Leave the path (two taps, so it is never by accident). */
function LeavePath() {
  const { update } = useHeal();
  const [sure, setSure] = useState(false);
  return (
    <Pressable onPress={() => (sure ? update(d => { d.mind.dhamma = { ...d.mind.dhamma, left: true }; }) : setSure(true))} accessibilityRole="button">
      <Text style={{ color: colors.muted, fontSize: 13 }}>{sure ? tr('Tap again to leave the Dhamma path') : tr('Leave the Dhamma path')}</Text>
    </Pressable>
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
