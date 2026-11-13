// Measure day in the Body card (founder, 13 Nov 2026): waist and hips with a soft tape on the 1st, then "since last
// month" with weight, and Myra's line. Between measures, the latest waist and hips show as two small rows.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { lastMeasure, measureDue, measureLine } from '../lib/measure';
import { useHeal } from '../lib/store';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return Number.isFinite(v) && v > 30 && v < 250 ? Math.round(v * 10) / 10 : undefined; };

export function MeasureDay() {
  const { days, date, update } = useHeal();
  const today = todayISO();
  const [waist, setWaist] = useState(''), [hips, setHips] = useState('');
  const [open, setOpen] = useState(false);
  const due = date === today && measureDue(days, date);
  const now = lastMeasure(days, date);
  const was = now ? lastMeasure(days, now.date, true) : null;
  const justNow = now?.date === date;

  const save = () => {
    const w = num(waist), h = num(hips);
    if (w == null) return;
    update(d => { d.health = { ...(d.health ?? {}), waistCm: w, ...(h != null ? { hipsCm: h } : {}) }; });
    setOpen(false); setWaist(''); setHips('');
    // Into the health vault too (decision 0055), next to what Apple Health shares.
    if (supabase) {
      const rows = [{ date, metric: 'WaistCircumference', unit: 'cm', avg: w, min: w, max: w }, ...(h != null ? [{ date, metric: 'HipCircumference', unit: 'cm', avg: h, min: h, max: h }] : [])];
      supabase.auth.getUser().then(({ data }) => data.user && supabase!.from('health_daily').upsert(rows.map(r => ({ ...r, user_id: data.user!.id, sum: null })), { onConflict: 'user_id,date,metric' })).then(() => {}, () => {});
    }
  };
  const input = (label: string, v: string, set: (s: string) => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>{label}</Text>
      <TextInput value={v} onChangeText={set} keyboardType="decimal-pad" placeholder="–" placeholderTextColor={colors.muted}
        style={{ width: 70, textAlign: 'right', borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, color: colors.ink }} />
      <Text style={{ color: colors.muted }}>cm</Text>
    </View>
  );
  const change = (label: string, a?: number, b?: number, unit = 'cm') => a == null || b == null ? null : (
    <View key={label} style={{ flexDirection: 'row', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={{ flex: 1, color: colors.ink, fontSize: 14.5 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 14.5 }}>{a} → <Text style={{ fontWeight: '700', color: b < a ? colors.good : colors.ink }}>{b} {unit}</Text></Text>
    </View>
  );

  if (due || open) return (
    <View style={{ gap: 2, marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 16 }}>{tr('Measure day')} 📏</Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 6 }}>{tr('1 minute with a soft tape, before breakfast.')}</Text>
      {input(tr('Waist (at the navel)'), waist, setWaist)}
      {input(tr('Hips (widest part)'), hips, setHips)}
      <Pressable onPress={save} disabled={num(waist) == null} accessibilityRole="button"
        style={{ marginTop: 8, borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: num(waist) == null ? colors.line : colors.accent }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>{tr('Save')}</Text>
      </Pressable>
    </View>
  );
  if (!now) return null;
  return (
    <View style={{ gap: 2, marginTop: 6 }}>
      {justNow && was ? (
        <>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, marginTop: 4 }}>{tr('SINCE LAST MONTH')}</Text>
          {change(tr('Waist'), was.waist, now.waist)}
          {change(tr('Hips'), was.hips, now.hips)}
          {change(tr('Weight'), was.weight, now.weight, 'kg')}
        </>
      ) : (
        <View style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 15 }}>{tr('Waist · hips')}</Text>
          <Text style={{ color: colors.ink, fontSize: 15 }}>{now.waist}{now.hips != null ? ` · ${now.hips}` : ''} cm</Text>
        </View>
      )}
      {justNow ? <Text style={{ color: colors.insight, fontSize: 14, marginTop: 4 }}>✦ {tr(...measureLine(now, was))}</Text> : null}
      <Pressable onPress={() => setOpen(true)} hitSlop={6}><Text style={{ color: colors.muted, fontSize: 12.5 }}>{tr('Measure again')}</Text></Pressable>
    </View>
  );
}
