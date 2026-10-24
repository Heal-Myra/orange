// Love (founder, 24 Oct 2026, simplified the same day): two questions, answered with one tap.
// Whom will I love today? · How will I love myself today? Pick a ready answer or write your own; tick when done.
// 30 of Soul (founder, 24 Oct 2026): whom 12, myself 12, one of them done 6.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { lovePoints } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card, Heading, Note, Score, TextField } from './ui';

const OTHERS = ['Talk to a friend', 'Call a family member', 'Be kind to a stranger', 'Help a colleague', 'Hug someone at home', 'Write to someone I miss'];
const SELF_WEEKDAY = ['A thank-you note to myself', 'A walk I enjoy', 'Music I love', 'Time for a hobby', 'An early night', 'Ten quiet minutes'];
const SELF_WEEKEND = ['A coffee or a treat', 'A thank-you note to myself', 'A long walk outside', 'Music I love', 'Time for a hobby', 'A nap'];

export function LoveCard() {
  const { day, date, update } = useHeal();
  const love = day.love ?? {};
  const [y, m, d] = date.split('-').map(Number);
  const weekend = [0, 6].includes(new Date(y, m - 1, d).getDay());
  const self = love.self ?? love.happy; // older days wrote "happy"
  const set = (k: 'whom' | 'self', v: string | undefined) => update(x => { x.love = { ...(x.love ?? {}), [k]: v }; });
  const pts = lovePoints(day);

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.soul }}>
      <Heading right={<Score value={pts} max={30} />}>{tr('Love')}</Heading>
      <Question key={date + 'whom'} title={tr('Whom will I love today?')} options={OTHERS} value={love.whom} onChange={v => set('whom', v)} placeholder={tr('Or write your own, e.g. call Babuji')} />
      <Question key={date + 'self'} title={tr('How will I love myself today?')} options={weekend ? SELF_WEEKEND : SELF_WEEKDAY} value={self} onChange={v => set('self', v)} placeholder={tr('Or write your own')} />
      {love.whom?.trim() || self?.trim() ? (
        <Pressable onPress={() => update(x => { x.love = { ...(x.love ?? {}), done: !x.love?.done }; })} accessibilityRole="checkbox" accessibilityState={{ checked: !!love.done }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <Ionicons name={love.done ? 'heart' : 'heart-outline'} size={22} color={colors.soul} />
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: love.done ? '600' : '400' }}>{tr('Done today')}</Text>
        </Pressable>
      ) : <Note>{tr('12 for each, and 6 more when you have done one.')}</Note>}
    </Card>
  );
}

function Question({ title, options, value, onChange, placeholder }: { title: string; options: string[]; value?: string; onChange: (v: string | undefined) => void; placeholder: string }) {
  const custom = !!value && !options.includes(value);
  const [writing, setWriting] = useState(custom);
  return (
    <View style={{ gap: 8, paddingTop: 6 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => {
          const on = value === o;
          return (
            <Pressable key={o} onPress={() => { setWriting(false); onChange(on ? undefined : o); }} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: on ? colors.soul : colors.line, backgroundColor: on ? colors.soul + '16' : colors.surface }}>
              <Text style={{ color: colors.ink, fontSize: 14, fontWeight: on ? '600' : '400' }}>{tr(o)}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setWriting(w => !w)} accessibilityRole="button"
          style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: custom ? colors.soul : colors.line, backgroundColor: custom ? colors.soul + '16' : colors.surface }}>
          <Text style={{ color: colors.ink, fontSize: 14 }}>✎ {tr('My own')}</Text>
        </Pressable>
      </View>
      {writing ? <TextField label={title} value={custom ? value! : ''} onChangeText={v => onChange(v || undefined)} placeholder={placeholder} /> : null}
    </View>
  );
}
