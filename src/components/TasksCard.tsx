// Mind: "Clear your mind". One to-do list in three groups (Family, Work, Better me).
// Writing a task down with a "when" quiets the mind even before it is done. Myra puts one or two in
// today's Focus (on Today, in Myra recommends); the rest get dates automatically. Done tasks leave the list.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { AREAS, areaName, useTasks, type Area, type Task } from '../lib/tasks';
import { colors } from '../theme';
import { Button, Card, Heading, Note, s } from './ui';

const WHEN = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'This week', days: 3 },
  { label: 'Next week', days: 7 },
];

const shortDate = (iso: string) => {
  const today = todayISO();
  if (iso < today) return 'overdue';
  if (iso === today) return 'today';
  if (iso === shiftISO(today, 1)) return 'tomorrow';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

export function TasksCard() {
  const { open, focus, doneToday } = useTasks();
  const [area, setArea] = useState<Area>('family');
  const shown = open.filter(t => t.area === area);
  const focusIds = focus.map(t => t.id);

  return (
    <Card>
      <Heading>Clear your mind</Heading>
      <Note>Write it down and let Myra pick one or two a day.</Note>

      {/* Three groups */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {AREAS.map(a => {
          const n = open.filter(t => t.area === a.id).length;
          const on = a.id === area;
          return (
            <Pressable key={a.id} onPress={() => setArea(a.id)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1,
                borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent + '14' : colors.surface }}>
              <Text style={{ fontWeight: '700', color: on ? colors.accent : colors.ink }}>{a.name}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{n} open</Text>
            </Pressable>
          );
        })}
      </View>

      <AddTask area={area} />

      {shown.length ? shown.map(t => <TaskRow key={t.id} t={t} inFocus={focusIds.includes(t.id)} />)
        : <Note>Nothing in {areaName(area)}. A clear mind!</Note>}

      {doneToday ? <Note>Done today: {doneToday} ✓</Note> : null}
    </Card>
  );
}

function AddTask({ area }: { area: Area }) {
  const { add } = useTasks();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<number | null>(null);
  const save = () => {
    if (!title.trim()) return;
    add(title, area, days == null ? undefined : shiftISO(todayISO(), days));
    setTitle(''); setDays(null);
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput style={[s.input, { flex: 1, minWidth: 0 }]} value={title} onChangeText={setTitle} onSubmitEditing={save} returnKeyType="done"
          placeholder={area === 'family' ? 'e.g. Call Mum' : area === 'work' ? 'e.g. Send the budget' : 'e.g. Read 10 pages'} placeholderTextColor={colors.muted} />
        <Button title="Add" onPress={save} disabled={!title.trim()} />
      </View>
      {title.trim() ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {WHEN.map(w => (
            <Pressable key={w.label} onPress={() => setDays(d => d === w.days ? null : w.days)}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
                borderColor: days === w.days ? colors.accent : colors.line, backgroundColor: days === w.days ? colors.accent + '14' : colors.surface }}>
              <Text style={{ color: days === w.days ? colors.accent : colors.ink, fontSize: 13 }}>{w.label}</Text>
            </Pressable>
          ))}
          <Text style={{ alignSelf: 'center', fontSize: 12, color: colors.muted }}>{days == null ? 'or let Myra choose' : ''}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TaskRow({ t, inFocus }: { t: Task; inFocus: boolean }) {
  const { complete, moveTo, remove } = useTasks();
  const [open, setOpen] = useState(false);
  const today = todayISO();
  return (
    <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={`Done: ${t.title}`} onPress={() => complete(t.id)} hitSlop={8}>
          <Ionicons name="ellipse-outline" size={24} color={colors.accent} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => setOpen(o => !o)}>
          <Text style={{ color: colors.ink, fontSize: 15 }}>{t.title}</Text>
          <Text style={{ fontSize: 12, color: inFocus ? colors.insight : colors.muted }}>
            {inFocus ? 'In today’s focus' : t.due ? shortDate(t.due) : 'Myra will choose a day'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setOpen(o => !o)} hitSlop={8}>
          <Ionicons name="calendar-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>
      {t.moved >= 3 ? (
        <Text style={{ fontSize: 13, color: colors.insight }}>Moved {t.moved} times. Make it smaller, or let it go?</Text>
      ) : null}
      {open ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingLeft: 34 }}>
          {[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([label, n]) => (
            <Pressable key={label} onPress={() => { moveTo(t.id, shiftISO(today, n as number)); setOpen(false); }}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
              <Text style={{ fontSize: 13, color: colors.ink }}>{label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => remove(t.id)} style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 13, color: colors.bad }}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Today: the Focus block inside Myra recommends. Tick a task and it leaves the list. */
export function FocusBlock() {
  const { focus, complete } = useTasks();
  if (!focus.length) return null;
  return (
    <Card style={{ gap: 10, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: colors.insight }}>
      {focus.map(t => (
        <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 14, width: 44 }}>Focus</Text>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 }}>{t.title} <Text style={{ color: colors.muted, fontSize: 12 }}>· {areaName(t.area)}</Text></Text>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Done: ${t.title}`} onPress={() => complete(t.id)} hitSlop={10}>
            <Ionicons name="ellipse-outline" size={24} color={colors.accent} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
