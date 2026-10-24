// Mind: "Clear your mind". One to-do list in three groups (Family, Work, Better me).
// Writing a task down with a "when" quiets the mind even before it is done. Myra puts one at a time in front of the
// person (the Mind line of Myra recommends on Today, 21 Oct 2026); the rest get dates automatically. Done tasks leave the list.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { AREAS, areaName, useTasks, type Area, type Task } from '../lib/tasks';
import { habitsToday, readHabit, repeatName, type Repeat } from '../lib/habits';
import { colors } from '../theme';
import { Button, Card, Heading, Note, Score, s, useKeepVisible } from './ui';
import { useHeal } from '../lib/store';
import { FOCUS_EACH } from '../lib/scoring';
import { tr } from '../lib/i18n';

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
  const { day } = useHeal();
  const [area, setArea] = useState<Area>('family');
  const [all, setAll] = useState(false);
  const today = todayISO();
  // Today's list first (founder, 23 Oct 2026); later tasks only after "See all".
  const isToday = (t: Task) => !t.due || t.due <= today;
  const mine = open.filter(t => t.area === area);
  const shown = mine.filter(isToday);
  const later = mine.filter(t => !isToday(t));
  const focusIds = focus.map(t => t.id);

  return (
    <Card>
      <Heading right={<Score value={Math.min(2, day.mind.focusDone ?? 0) * FOCUS_EACH} max={40} />}>{tr('Clear your mind')}</Heading>
      <Note>{tr('Write it down. Myra puts one in front of you at a time, on Today. Finishing two of them earns the full 40.')}</Note>

      {/* Three groups */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {AREAS.map(a => {
          const n = open.filter(t => t.area === a.id && isToday(t)).length;
          const on = a.id === area;
          return (
            <Pressable key={a.id} onPress={() => setArea(a.id)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1,
                borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent + '14' : colors.surface }}>
              <Text style={{ fontWeight: '700', color: on ? colors.accent : colors.ink }}>{tr(a.name)}</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>{tr('{n} today', { n })}</Text>
            </Pressable>
          );
        })}
      </View>

      <AddTask area={area} />

      {shown.length ? shown.map(t => <TaskRow key={t.id} t={t} inFocus={focusIds.includes(t.id)} />)
        : <Note>{tr('Nothing in {area} today. A clear mind!', { area: tr(areaName(area)) })}</Note>}

      {later.length ? (
        <Pressable onPress={() => setAll(x => !x)} accessibilityRole="button" hitSlop={8} style={{ paddingTop: 4 }}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>{all ? tr('Hide later tasks') : tr('See all ({n} later)', { n: later.length })}</Text>
        </Pressable>
      ) : null}
      {all ? later.map(t => <TaskRow key={t.id} t={t} inFocus={false} />) : null}

      {doneToday ? <Note>{tr('Done today: {n} ✓', { n: doneToday })}</Note> : null}
    </Card>
  );
}

const REPEATS: { id: Repeat | 'once'; label: string }[] = [
  { id: 'once', label: 'Once' }, { id: 'daily', label: 'Daily' }, { id: 'weekdays', label: 'Weekdays' }, { id: 'weekly', label: 'Weekly' },
];

function AddTask({ area }: { area: Area }) {
  const keep = useKeepVisible();
  const { add, addHabit } = useTasks();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<number | null>(null);
  const [repeat, setRepeat] = useState<Repeat | 'once' | null>(null); // null: read from the words
  const [note, setNote] = useState<string | null>(null);
  const read = readHabit(title);
  const rep = repeat ?? read.repeat ?? 'once';
  const save = () => {
    if (!title.trim()) return;
    if (rep !== 'once') {
      // A repeating to-do is a habit (founder, 23 Oct 2026): its own bar, and Myra shows it at its time.
      addHabit({ title, area, repeat: rep, at: read.at, weekday: rep === 'weekly' ? read.weekday ?? new Date().getDay() : undefined });
      setNote(tr('Added to Habits{at}.', { at: read.at ? ` · ${read.at}` : '' }));
    } else {
      const asked = days == null ? undefined : shiftISO(todayISO(), days);
      const placed = add(title, area, asked);
      setNote(asked && placed && placed !== asked ? tr('That day already has 3 {area} to-dos, so this is on {day}.', { area: tr(areaName(area)), day: shortDate(placed) }) : null);
    }
    setTitle(''); setDays(null); setRepeat(null);
  };
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput style={[s.input, { flex: 1, minWidth: 0 }]} value={title} onChangeText={setTitle} onSubmitEditing={save} returnKeyType="done" onFocus={() => setTimeout(keep, 300)}
          placeholder={area === 'family' ? 'e.g. Call Mum' : area === 'work' ? 'e.g. Send the budget' : 'e.g. Read 10 pages'} placeholderTextColor={colors.muted} />
        <Button title={tr('Add')} onPress={save} disabled={!title.trim()} />
      </View>
      {title.trim() ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Ionicons name="repeat" size={16} color={colors.muted} />
          {REPEATS.map(r => (
            <Pressable key={r.id} onPress={() => setRepeat(r.id)}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
                borderColor: rep === r.id ? colors.accent : colors.line, backgroundColor: rep === r.id ? colors.accent + '14' : colors.surface }}>
              <Text style={{ color: rep === r.id ? colors.accent : colors.ink, fontSize: 13 }}>{tr(r.label)}</Text>
            </Pressable>
          ))}
          {rep !== 'once' ? <Text style={{ fontSize: 12, color: colors.muted }}>{read.at ? tr('at {t}', { t: read.at }) : tr('add a time, e.g. "at 9 am"')}</Text> : null}
        </View>
      ) : null}
      {title.trim() && rep === 'once' ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {WHEN.map(w => (
            <Pressable key={w.label} onPress={() => setDays(d => d === w.days ? null : w.days)}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
                borderColor: days === w.days ? colors.accent : colors.line, backgroundColor: days === w.days ? colors.accent + '14' : colors.surface }}>
              <Text style={{ color: days === w.days ? colors.accent : colors.ink, fontSize: 13 }}>{tr(w.label)}</Text>
            </Pressable>
          ))}
          <Text style={{ alignSelf: 'center', fontSize: 12, color: colors.muted }}>{days == null ? tr('or let Myra choose') : ''}</Text>
        </View>
      ) : null}
      {note && !title.trim() ? <Note>{note}</Note> : null}
    </View>
  );
}

function TaskRow({ t, inFocus }: { t: Task; inFocus: boolean }) {
  const { complete, moveTo, remove, addHabit } = useTasks();
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
            {inFocus ? tr('In today’s focus') : t.due ? shortDate(t.due) : tr('Myra will choose a day')}
          </Text>
        </Pressable>
        <Pressable onPress={() => setOpen(o => !o)} hitSlop={8}>
          <Ionicons name="calendar-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>
      {readHabit(t.title).repeat ? (
        <Pressable onPress={() => { const r = readHabit(t.title); addHabit({ title: t.title, area: t.area, repeat: r.repeat!, at: r.at, weekday: r.weekday }); remove(t.id); }} hitSlop={6} style={{ paddingLeft: 34 }}>
          <Text style={{ fontSize: 13, color: colors.insight }}>{tr('This repeats. Make it a habit')} →</Text>
        </Pressable>
      ) : null}
      {t.moved >= 3 ? (
        <Text style={{ fontSize: 13, color: colors.insight }}>Moved {t.moved} times. Make it smaller, or let it go?</Text>
      ) : null}
      {open ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingLeft: 34 }}>
          {[[tr('Tomorrow'), 1], [tr('In 3 days'), 3], [tr('Next week'), 7]].map(([label, n]) => (
            <Pressable key={label} onPress={() => { moveTo(t.id, shiftISO(today, n as number)); setOpen(false); }}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
              <Text style={{ fontSize: 13, color: colors.ink }}>{label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => remove(t.id)} style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 13, color: colors.bad }}>{tr('Remove')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Habits (founder, 23 Oct 2026): today's repeating to-dos, ticked off each day. Myra shows each one on Today at its time. */
export function HabitsBar() {
  const { habits, tickHabit, removeHabit } = useTasks();
  const { day, date } = useHeal();
  const [edit, setEdit] = useState(false);
  if (!habits.length) return null;
  const [y, m, d] = date.split('-').map(Number);
  const list = habitsToday(habits, new Date(y, m - 1, d));
  const done = day.habitsDone ?? [];
  return (
    <Card style={{ gap: 10 }}>
      <Heading right={<Pressable onPress={() => setEdit(x => !x)} hitSlop={8}><Text style={{ color: colors.accent, fontWeight: '600' }}>{edit ? tr('Done') : tr('Edit')}</Text></Pressable>}>{tr('Habits')}</Heading>
      {list.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {list.map(h => {
            const on = done.includes(h.id);
            return (
              <Pressable key={h.id} onPress={() => (edit ? removeHabit(h.id) : tickHabit(h.id))} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
                  borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent + '14' : colors.surface }}>
                <Ionicons name={edit ? 'close-circle-outline' : on ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={edit ? colors.bad : colors.accent} />
                <Text style={{ color: colors.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{h.at ? `${h.at} · ` : ''}{h.title}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : <Note>{tr('No habits today.')}</Note>}
      {edit ? <Note>{tr('Tap a habit to remove it.')}</Note> : <Note>{tr('{done} of {n} done today', { done: list.filter(h => done.includes(h.id)).length, n: list.length })}</Note>}
      {edit ? habits.filter(h => !list.includes(h)).map(h => (
        <Pressable key={h.id} onPress={() => removeHabit(h.id)}><Text style={{ color: colors.muted }}>✕ {h.title} · {tr(repeatName(h.repeat))}</Text></Pressable>
      )) : null}
    </Card>
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
          <Text style={{ color: colors.insight, fontWeight: '700', fontSize: 14, width: 44 }}>{tr('Focus')}</Text>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 }}>{t.title} <Text style={{ color: colors.muted, fontSize: 12 }}>· {tr(areaName(t.area))}</Text></Text>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Done: ${t.title}`} onPress={() => complete(t.id)} hitSlop={10}>
            <Ionicons name="ellipse-outline" size={24} color={colors.accent} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
