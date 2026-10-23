// Tomorrow's food (founder, 23 Oct 2026): Myra plans the next day's meals; the person changes a dish or tells Myra
// what to change, finalises, and sends it on WhatsApp with ingredients and steps. A short video for a dish is
// offered only when the person asks for it (and then also goes into the message).

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { planFood, translateMessage } from '../lib/ai';
import { buildContext } from '../lib/context';
import { shiftISO, todayISO } from '../lib/dates';
import { cleanPlan, ENGLISH_LABELS, MESSAGE_LANGS, planMessage, planTotals, videoLink, whatsappLink, type FoodPlan, type Slot } from '../lib/foodPlan';
import { lang, locale, tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { fibreTarget } from '../lib/targets';
import { emptyDay } from '../lib/types';
import { colors } from '../theme';
import { Button, Card, Heading, Note, TextField } from './ui';

const SLOT_NAME: Record<Slot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };

const englishDay = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }); };
const dayName = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'short' }); };

export function FoodPlanCard() {
  const { days, profile, setProfile, updateOn } = useHeal();
  const today = todayISO();
  const tomorrow = shiftISO(today, 1);
  const plan = days[tomorrow]?.plan;
  const todays = days[today]?.plan;
  const [prefs, setPrefs] = useState(profile.me?.foodPrefs ?? '');
  const [people, setPeople] = useState(plan?.people ?? 1);
  const [tweak, setTweak] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [showToday, setShowToday] = useState(false);
  const [msgLang, setMsgLangState] = useState(profile.me?.planLang ?? (lang() === 'hi' ? 'hi' : 'en'));
  const setMsgLang = (c: string) => { setMsgLangState(c); if (profile.me) setProfile({ ...profile, me: { ...profile.me, planLang: c } }); };

  const save = (p: FoodPlan) => updateOn(tomorrow, d => { d.plan = p; });

  const ask = async (extra: { tweak?: string; swap?: Slot; people?: number } = {}) => {
    setBusy(extra.swap ?? (extra.tweak ? 'tweak' : 'plan')); setMessage(null);
    try {
      const n = extra.people ?? people;
      if (profile.me && prefs.trim() !== (profile.me.foodPrefs ?? '')) setProfile({ ...profile, me: { ...profile.me, foodPrefs: prefs.trim() || undefined } });
      const recent = Array.from({ length: 7 }, (_, i) => shiftISO(today, -i)).map(d => days[d]?.meals.map(m => m.name).join(', ')).filter(Boolean).join('; ');
      const r = await planFood({
        date: tomorrow, weekday: dayName(tomorrow), people: n, fibre: fibreTarget(profile.kcal),
        context: buildContext(days[today] ?? emptyDay(today), days, today, profile),
        prefs: prefs.trim(), recent, current: plan && (extra.tweak || extra.swap) ? plan.meals.map(({ video: _v, ...m }) => m) : undefined,
        tweak: extra.tweak, swap: extra.swap,
      });
      const next = cleanPlan(r, tomorrow, n);
      if (!next.meals.length) throw new Error(tr('Myra could not make a plan just now. Please try again.'));
      // Keep the videos the person already asked for, for dishes that stayed.
      next.meals.forEach(m => { if (plan?.meals.find(o => o.dish === m.dish)?.video) m.video = true; });
      save(next); setTweak(''); setOpen(null);
    } catch (e) { setMessage(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  const send = async () => {
    if (!plan) return;
    // Written in English, then (for any other language) translated by Myra once and kept with the plan.
    const english = planMessage(plan, ENGLISH_LABELS(englishDay(tomorrow), plan.people));
    let text = english;
    if (msgLang !== 'en') {
      text = plan.messages?.[msgLang] ?? '';
      if (!text) {
        setBusy('translate'); setMessage(null);
        try { text = (await translateMessage(english, msgLang)).text; save({ ...plan, messages: { ...(plan.messages ?? {}), [msgLang]: text } }); }
        catch (e) { setMessage(e instanceof Error ? e.message : String(e)); setBusy(null); return; }
        setBusy(null);
      }
    }
    // WhatsApp opens with the message ready; pick the contact there. Without WhatsApp, the phone's share sheet.
    const ok = await Linking.openURL(whatsappLink(text)).then(() => true).catch(() => false);
    if (!ok) Share.share({ message: text }).catch(() => {});
  };

  const t = plan ? planTotals(plan) : null;

  return (
    <Card style={{ gap: 12 }}>
      <Heading>{tr('Tomorrow\'s food')}</Heading>
      <Note>{dayName(tomorrow)}</Note>

      {todays?.meals.length ? (
        <Pressable onPress={() => setShowToday(x => !x)} accessibilityRole="button">
          <Text style={{ color: colors.accent, fontWeight: '600' }}>{showToday ? tr('Hide today\'s plan') : tr('See today\'s plan')}</Text>
        </Pressable>
      ) : null}
      {showToday && todays ? todays.meals.map(m => (
        <Text key={m.slot} style={{ color: colors.ink }}><Text style={{ fontWeight: '700' }}>{tr(SLOT_NAME[m.slot])}: </Text>{m.dish}</Text>
      )) : null}

      {!plan ? (
        <>
          <TextField label={tr('Your food preferences (optional)')} value={prefs} onChangeText={setPrefs} multiline
            placeholder={tr('e.g. vegetarian, eggs are fine, no onion or garlic on Tuesdays')} />
          <PeoplePicker value={people} onChange={setPeople} />
          <Button kind="insight" title={busy ? tr('Myra is planning…') : tr('Plan tomorrow\'s food')} onPress={() => ask()} disabled={!!busy} />
          <Note>{tr('Myra plans four meals around your calorie, protein and fibre targets. You can change anything before sending.')}</Note>
        </>
      ) : (
        <>
          {plan.note ? <Text style={{ color: colors.insight }}>{plan.note}</Text> : null}
          {plan.meals.map((m, i) => (
            <View key={m.slot} style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 6 }}>
              <Pressable onPress={() => setOpen(open === i ? null : i)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.body }}>{tr(SLOT_NAME[m.slot]).toUpperCase()}</Text>
                  <Text style={{ fontSize: 16, color: colors.ink, fontWeight: '600' }}>{m.dish}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{m.portion}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] }}>{m.kcal} kcal · {tr('Protein')} {m.protein} g · {tr('Fibre')} {m.fibre} g</Text>
                </View>
                <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </Pressable>
              {open === i ? (
                <View style={{ gap: 6, paddingLeft: 4 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }}>{plan.people === 1 ? tr('Ingredients (1 person)') : tr('Ingredients ({n} people)', { n: plan.people })}</Text>
                  {m.ingredients.map((x, k) => <Text key={k} style={{ color: colors.ink }}>• {x.item}{x.qty ? ` – ${x.qty}` : ''}</Text>)}
                  <Text style={{ fontWeight: '700', color: colors.ink, marginTop: 4 }}>{tr('How to make')}</Text>
                  {m.steps.map((st, k) => <Text key={k} style={{ color: colors.ink, lineHeight: 20 }}>{k + 1}. {st}</Text>)}
                  {/* The short video only when asked (founder): tapping opens short recipe videos and adds the link to the message. */}
                  <Pressable accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
                    onPress={() => { if (!m.video) save({ ...plan, messages: undefined, meals: plan.meals.map((x, k) => (k === i ? { ...x, video: true } : x)) }); Linking.openURL(videoLink(m.dish)).catch(() => {}); }}>
                    <Ionicons name="play-circle-outline" size={20} color={colors.insight} />
                    <Text style={{ color: colors.insight, fontWeight: '600' }}>{m.video ? tr('Watch the 1-minute video again') : tr('Show me a 1-minute video')}</Text>
                  </Pressable>
                  {m.video ? <Note>{tr('The video link goes into the WhatsApp message too.')}</Note> : null}
                  {!plan.final ? <Button kind="plain" title={busy === m.slot ? tr('Finding another dish…') : tr('Change this dish')} onPress={() => ask({ swap: m.slot })} disabled={!!busy} /> : null}
                </View>
              ) : null}
            </View>
          ))}
          {t ? (
            <Text style={{ color: colors.muted, fontVariant: ['tabular-nums'], borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
              {tr('Day total: {kcal} of {target} kcal · protein {p} of {pt} g · fibre {f} g', { kcal: t.kcal, target: profile.kcal, p: t.protein, pt: profile.protein, f: t.fibre })}
            </Text>
          ) : null}
          {!plan.final ? (
            <>
              <TextField label={tr('Tell Myra what to change (optional)')} value={tweak} onChangeText={setTweak} multiline
                placeholder={tr('e.g. no paneer, lighter dinner, poha for breakfast')} />
              {tweak.trim() ? <Button kind="plain" title={busy === 'tweak' ? tr('Myra is changing the plan…') : tr('Change the plan')} onPress={() => ask({ tweak: tweak.trim() })} disabled={!!busy} /> : null}
              <Button kind="insight" title={tr('Finalise the plan')} onPress={() => save({ ...plan, final: true })} disabled={!!busy} />
              <Pressable onPress={() => ask()} disabled={!!busy} hitSlop={8}><Text style={{ color: colors.accent, textAlign: 'center' }}>{busy === 'plan' ? tr('Myra is planning…') : tr('Start again with a new plan')}</Text></Pressable>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14, color: colors.ink }}>{tr('Message language')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MESSAGE_LANGS.map(l => {
                  const on = l.code === msgLang;
                  return (
                    <Pressable key={l.code} onPress={() => setMsgLang(l.code)} accessibilityRole="button" accessibilityLabel={l.english}
                      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.body : colors.line, backgroundColor: on ? colors.body + '18' : colors.surface }}>
                      <Text style={{ color: colors.ink, fontWeight: on ? '700' : '400' }}>{l.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable accessibilityRole="button" onPress={send} disabled={!!busy}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1F8F4E', borderRadius: 99, paddingVertical: 14, opacity: pressed ? 0.8 : 1 })}>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{busy === 'translate' ? tr('Myra is translating…') : tr('Send on WhatsApp')}</Text>
              </Pressable>
              <Note>{tr('WhatsApp opens with the menu, ingredients and steps ready. Choose who to send it to.')}</Note>
              <Pressable onPress={() => save({ ...plan, final: false })} hitSlop={8}><Text style={{ color: colors.accent, textAlign: 'center' }}>{tr('Make changes')}</Text></Pressable>
            </>
          )}
        </>
      )}
      {message ? <Note>{message}</Note> : null}
    </Card>
  );
}

function PeoplePicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, color: colors.ink }}>{tr('Cooking for how many people?')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <Pressable key={n} onPress={() => onChange(n)} accessibilityRole="button"
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
              borderColor: n === value ? colors.body : colors.line, backgroundColor: n === value ? colors.body + '18' : colors.surface }}>
            <Text style={{ color: colors.ink, fontWeight: n === value ? '700' : '400' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
