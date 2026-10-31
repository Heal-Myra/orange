// Inside Phone activity (founder, 31 Oct 2026; decision 0039):
// 1. "What you fed your mind": the feelings in what was watched, as rings like every other card (an estimate).
// 2. "Information fast": the person chooses a time; Happy Orange keeps it with them, Myra stops suggesting the phone, and a
//    reminder says when it is over. Blocking apps for real needs Apple's Screen Time permission (applied for); until then
//    the card points to iPhone's own Focus to block them.

import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { feelingMix, FEELINGS, heavyShare, type FeelingId } from '../lib/feelings';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { todayISO } from '../lib/dates';
import { colors } from '../theme';
import { PASTEL, RingPanel, type RingItem } from './Rings';
import { Button, Note } from './ui';
import type { DayLog } from '../lib/types';

const COLOR: Record<FeelingId, string> = {
  love: PASTEL.rose, hope: PASTEL.sand, joy: PASTEL.peach, calm: PASTEL.sky, learning: PASTEL.teal, fear: PASTEL.lavender, anger: '#B8A9A0',
};

export function MindFood({ day }: { day: DayLog }) {
  const r = feelingMix(day.media ?? [], day.watched ?? []);
  if (!r) return null;
  // The five biggest feelings, so the rings stay readable.
  const top = [...FEELINGS].sort((a, b) => r.mix[b.id] - r.mix[a.id]).filter(f => r.mix[f.id] > 0.005).slice(0, 5);
  const items: RingItem[] = top.map(f => ({ id: f.id, color: COLOR[f.id], label: tr(f.label), value: r.mix[f.id], text: `${Math.round(r.mix[f.id] * 100)}%` }));
  const heavy = Math.round(heavyShare(r.mix) * 100);
  return (
    <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{tr('What you fed your mind')}</Text>
      <RingPanel items={items} score={100 - heavy} max={100} />
      <Note>{tr('{n}% nourishing, {h}% heavy (fear and anger). An estimate from your apps and anything you shared to Happy Orange.', { n: 100 - heavy, h: heavy })}</Note>
    </View>
  );
}

const CHOICES = [{ label: '1 hour', h: 1 }, { label: '2 hours', h: 2 }, { label: '4 hours', h: 4 }, { label: 'Until tomorrow', h: 0 }];

export function InfoFast() {
  const { days, updateOn } = useHeal();
  const today = todayISO();
  const f = days[today]?.infoFast;
  const [, tick] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const live = f && !f.ended && Date.parse(f.until) > Date.now();
  useEffect(() => { if (!live) return; const t = setInterval(() => tick(x => x + 1), 30_000); return () => clearInterval(t); }, [live]);

  const start = (h: number) => {
    const now = new Date();
    const until = h ? new Date(now.getTime() + h * 3600_000) : (() => { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(6, 0, 0, 0); return d; })();
    updateOn(today, d => { d.infoFast = { start: now.toISOString(), until: until.toISOString() }; });
    setChoosing(false);
  };
  const end = () => updateOn(today, d => { if (d.infoFast) d.infoFast = { ...d.infoFast, ended: new Date().toISOString() }; });

  if (live) {
    const left = Math.max(0, Date.parse(f!.until) - Date.now());
    const hh = Math.floor(left / 3600_000), mm = Math.round((left % 3600_000) / 60_000);
    return (
      <View style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: PASTEL.sky + '22' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{tr('Information fast')} · {hh ? `${hh} h ` : ''}{mm} min {tr('left')}</Text>
        <Note>{tr('Myra will not suggest your phone until then. To block apps now: Settings › Focus › choose a Focus › Apps.')}</Note>
        <Pressable onPress={end} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '600' }}>{tr('End the fast')}</Text></Pressable>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {!choosing ? <Button kind="plain" title={tr('Start an information fast')} onPress={() => setChoosing(true)} /> : (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {CHOICES.map(c => (
            <Pressable key={c.label} onPress={() => start(c.h)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.accent }}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>{tr(c.label)}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {f?.ended || (f && Date.parse(f.until) <= Date.now()) ? <Note>{tr('Information fast done today. Lovely.')}</Note> : null}
    </View>
  );
}
