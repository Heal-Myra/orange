// Mind: "Clear your mind". One to-do list in three groups (Family, Work, Better me).
// Writing a task down with a "when" quiets the mind even before it is done. Myra puts one at a time in front of the
// person (the Mind line of Myra recommends on Today, 21 Oct 2026); the rest get dates automatically. Each to-do has a
// To do / Done switch; done today stays in the list, crossed out, and a unicorn flies up the screen (founder, 5 Nov 2026).

import { MyraLine } from './MyraLine';
import { PASTEL, RingPanel } from './Rings';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { shiftISO, todayISO } from '../lib/dates';
import { AREAS, areaName, useTasks, type Area, type Task } from '../lib/tasks';
import { FORMING_DAYS, forming, habitDay, habitsToday, readHabit, repeatName, timesDone, type Repeat } from '../lib/habits';
import { DatePicker } from './DatePicker';
import { loadOn, PER_AREA_DAY } from '../lib/taskPlan';
import { colors } from '../theme';
import { Button, Card, Heading, Note, Score, s, useKeepVisible } from './ui';
import { DoneSwitch } from './DoneSwitch';
import { useHeal } from '../lib/store';
import { SECTION_AREAS, mindScore, sectionPoint } from '../lib/scoring';

const SECTION_COLOR = { family: '#D9A7BD', work: '#6FB7BD', self: '#9CC08E' } as const;
import { tr } from '../lib/i18n';
import { readNoteTasks, type NoteTask } from '../lib/ai';
import { useAttach } from './AttachPlus';

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
  const { open, focus, doneToday, tasks } = useTasks();
  const { day, profile } = useHeal();
  const mind = mindScore(day, profile);
  const [area, setArea] = useState<Area>('family');
  const [all, setAll] = useState(false);
  const today = todayISO();
  // Today's list first (founder, 23 Oct 2026); later tasks only after "See all".
  const isToday = (t: Task) => !t.due || t.due <= today;
  const mine = open.filter(t => t.area === area);
  // Done today stays in the list (crossed out) so it can be slid back.
  const doneHere = tasks.filter(t => t.area === area && t.doneAt && new Date(t.doneAt).toDateString() === new Date().toDateString());
  const shown = [...mine.filter(isToday), ...doneHere];
  const later = mine.filter(t => !isToday(t));
  const focusIds = focus.map(t => t.id);

  return (
    <Card>
      {/* One ring each for Family, Work and Better me (founder, 4 Nov 2026; decision 0048). */}
      <Heading right={<Score value={mind?.practices ?? 0} max={40} />}>{tr('Clear your mind')}</Heading>
      <RingPanel trend="tasks" score={mind?.practices ?? 0} max={40} items={SECTION_AREAS.map(a => {
        const [w, dn] = day.mind.sections?.[a] ?? [0, 0];
        return { id: a, color: SECTION_COLOR[a], label: tr(areaName(a)), value: sectionPoint([w, dn]) / (40 / 3),
          sub: tr('{w} written · {d} done', { w: Math.min(2, Math.max(w, dn)), d: Math.min(2, dn) }) };
      })} />
      <Note>{tr('Two to-dos in each part: writing them down earns a little, finishing them earns the most.')}</Note>

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

      <MakingAHabit />

      {doneToday ? <Note>{tr('Done today: {n} ✓', { n: doneToday })}</Note> : null}
      <MyraLine card="tasks" />
    </Card>
  );
}

/** Habits inside Clear your mind (founder, 26 Oct 2026): for its first 21 days a habit shows its day count. Since
 *  10 Nov 2026 the separate Habits card is gone, so every habit due today sits here, monthly reminders included. */
function MakingAHabit() {
  const { habits, tickHabit, removeHabit } = useTasks();
  const { day, days, date } = useHeal();
  const [y, m, d] = date.split('-').map(Number);
  const list = habitsToday(habits, new Date(y, m - 1, d));
  if (!list.length) return null;
  const done = day.habitsDone ?? [];
  return (
    <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }}>
      <Text style={{ fontWeight: '700', color: colors.ink }}>{list.every(h => forming(h, date)) ? tr('Making a habit') : tr('Habits')}</Text>
      {list.map(h => {
        const on = done.includes(h.id);
        return (
          <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => tickHabit(h.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} hitSlop={8}>
              <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={colors.accent} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, textDecorationLine: on ? 'line-through' : 'none' }}>{h.at ? `${h.at} · ` : ''}{h.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{forming(h, date) ? tr('Day {n} of {total} · done {times} times', { n: habitDay(h, date), total: FORMING_DAYS, times: timesDone(h, days) }) : tr(repeatName(h.repeat)) + (h.repeat === "monthly" && h.dayOfMonth ? ` · ${h.dayOfMonth}` : "")}</Text>
            </View>
            <Pressable onPress={() => removeHabit(h.id)} hitSlop={8} accessibilityLabel={tr('Stop this habit')}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const REPEATS: { id: Repeat | 'once'; label: string }[] = [
  { id: 'once', label: 'Once' }, { id: 'daily', label: 'Daily' }, { id: 'weekdays', label: 'Weekdays' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' },
];

function AddTask({ area }: { area: Area }) {
  const keep = useKeepVisible();
  const { add, addHabit } = useTasks();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null); // a date from the calendar
  const [cal, setCal] = useState(false);
  const { tasks } = useTasks();
  const [repeat, setRepeat] = useState<Repeat | 'once' | null>(null); // null: read from the words
  const [note, setNote] = useState<string | null>(null);
  const read = readHabit(title);
  const rep = repeat ?? read.repeat ?? 'once';
  const save = () => {
    if (!title.trim()) return;
    if (rep !== 'once') {
      // A repeating to-do is a habit (founder, 23 Oct 2026): its own bar, and Myra shows it at its time.
      // Monthly (rent, EMI; founder, 7 Nov 2026): on the day picked, the day in the words ("5th"), or today's date.
      const dom = rep === 'monthly' ? (picked ? Number(picked.slice(8, 10)) : read.dayOfMonth ?? new Date().getDate()) : undefined;
      addHabit({ title, area, repeat: rep, at: read.at, weekday: rep === 'weekly' ? read.weekday ?? new Date().getDay() : undefined, dayOfMonth: dom });
      setNote(rep === 'monthly' ? tr('Added: every month on day {d}{at}. Myra reminds you that morning.', { d: dom ?? 1, at: read.at ? ` · ${read.at}` : '' })
        : tr('Added to Making a habit{at}: on Myra recommends every day, 21 days to make it stick.', { at: read.at ? ` · ${read.at}` : '' }));
    } else {
      const asked = picked ?? (days == null ? undefined : shiftISO(todayISO(), days));
      const placed = add(title, area, asked);
      setNote(asked && placed && placed !== asked ? tr('That day already has 3 {area} to-dos, so this is on {day}.', { area: tr(areaName(area)), day: shortDate(placed) }) : null);
    }
    setTitle(''); setDays(null); setPicked(null); setCal(false); setRepeat(null);
  };
  // "+": a photo of a notebook page becomes to-dos to check before adding (founder, 30 Oct 2026).
  const [found, setFound] = useState<(NoteTask & { on: boolean })[] | null>(null);
  const attach = useAttach(async img => {
    const today = todayISO();
    const r = await readNoteTasks(img.data, img.media_type, today, new Date().toLocaleDateString('en-IN', { weekday: 'long' }), area);
    const list = (r.tasks ?? []).filter(t => t.title?.trim()).map(t => ({ ...t, area: (['family', 'work', 'self'] as const).includes(t.area) ? t.area : area, due: t.due && t.due >= today ? t.due : null, on: true }));
    if (!list.length) return r.note || tr('No to-dos found in that photo. Try a clearer one.');
    setFound(list); setNote(null);
    return null;
  });
  const addFound = () => {
    if (!found) return;
    const chosen = found.filter(t => t.on);
    let moved = 0;
    for (const t of chosen) {
      if (t.repeat) addHabit({ title: t.title, area: t.area, repeat: t.repeat, at: t.at ?? undefined, weekday: t.repeat === 'weekly' ? (t.due ? new Date(+t.due.slice(0, 4), +t.due.slice(5, 7) - 1, +t.due.slice(8, 10)).getDay() : new Date().getDay()) : undefined });
      else { const placed = add(t.title, t.area, t.due ?? undefined); if (t.due && placed && placed !== t.due) moved++; }
    }
    setFound(null);
    setNote(tr('Added {n} to-dos from your photo.', { n: chosen.length }) + (moved ? ' ' + tr('{n} went to the next free day (3 a day per group).', { n: moved }) : ''));
  };
  const cycle = (a: Area): Area => (a === 'family' ? 'work' : a === 'work' ? 'self' : 'family');

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {attach.button}
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
          {rep === 'monthly' ? (
            <Pressable onPress={() => setCal(c => !c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accent + '14' }}>
              <Ionicons name="calendar-outline" size={14} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13 }}>{tr('Every month on day {d}', { d: picked ? Number(picked.slice(8, 10)) : read.dayOfMonth ?? new Date().getDate() })}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {title.trim() && rep === 'once' ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {WHEN.map(w => (
            <Pressable key={w.label} onPress={() => { setPicked(null); setCal(false); setDays(d => d === w.days ? null : w.days); }}
              style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
                borderColor: days === w.days ? colors.accent : colors.line, backgroundColor: days === w.days ? colors.accent + '14' : colors.surface }}>
              <Text style={{ color: days === w.days ? colors.accent : colors.ink, fontSize: 13 }}>{tr(w.label)}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setCal(c => !c)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1,
              borderColor: picked ? colors.accent : colors.line, backgroundColor: picked ? colors.accent + '14' : colors.surface }}>
            <Ionicons name="calendar-outline" size={14} color={picked ? colors.accent : colors.ink} />
            <Text style={{ color: picked ? colors.accent : colors.ink, fontSize: 13 }}>{picked ? shortDate(picked) : tr('Pick a date')}</Text>
          </Pressable>
          <Text style={{ alignSelf: 'center', fontSize: 12, color: colors.muted }}>{days == null && !picked ? tr('or let Myra choose') : ''}</Text>
        </View>
      ) : null}
      {title.trim() && rep === 'monthly' && cal ? <DatePicker value={picked ?? undefined} onPick={d => { setPicked(d); setCal(false); }} /> : null}
      {title.trim() && rep === 'once' && cal ? <DatePicker value={picked ?? undefined} full={d => loadOn(tasks, area, d) >= PER_AREA_DAY} onPick={d => { setPicked(d); setDays(null); setCal(false); }} /> : null}
      {attach.status}
      {found ? (
        <View style={{ gap: 6, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.insight + '50', backgroundColor: colors.surface }}>
          <Text style={{ color: colors.insight, fontWeight: '700' }}>{tr('Myra found {n} to-dos. Untick any you don\'t want.', { n: found.length })}</Text>
          {found.map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
              <Pressable onPress={() => setFound(f => f && f.map((x, k) => k === i ? { ...x, on: !x.on } : x))} hitSlop={8} accessibilityLabel={t.title}>
                <Ionicons name={t.on ? 'checkbox' : 'square-outline'} size={22} color={t.on ? colors.accent : colors.muted} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.on ? colors.ink : colors.muted }}>{t.title}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{t.repeat ? `${tr(repeatName(t.repeat))}${t.at ? ` · ${t.at}` : ''}` : t.due ? shortDate(t.due) : tr('Myra picks the day')}</Text>
              </View>
              <Pressable onPress={() => setFound(f => f && f.map((x, k) => k === i ? { ...x, area: cycle(x.area) } : x))}
                style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ fontSize: 12, color: colors.ink }}>{tr(areaName(t.area))}</Text>
              </Pressable>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title={tr('Add {n} to-dos', { n: found.filter(t => t.on).length })} onPress={addFound} disabled={!found.some(t => t.on)} />
            <Button kind="plain" title={tr('Cancel')} onPress={() => setFound(null)} />
          </View>
        </View>
      ) : null}
      {note && !title.trim() ? <Note>{note}</Note> : null}
    </View>
  );
}

function TaskRow({ t, inFocus }: { t: Task; inFocus: boolean }) {
  const { complete, reopen, moveTo, remove, addHabit } = useTasks();
  const [open, setOpen] = useState(false);
  const done = !!t.doneAt;
  const [cal, setCal] = useState(false);
  const { tasks } = useTasks();
  const today = todayISO();
  return (
    <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Tap or long-press the words for the dates menu (the calendar icon made way for the switch). */}
        <Pressable style={{ flex: 1 }} onPress={() => !done && setOpen(o => !o)} onLongPress={() => !done && setOpen(o => !o)}>
          <Text style={{ color: done ? colors.muted : colors.ink, fontSize: 15, textDecorationLine: done ? 'line-through' : 'none' }}>{t.title}</Text>
          {!done ? (
            <Text style={{ fontSize: 12, color: inFocus ? colors.insight : colors.muted }}>
              {inFocus ? tr('In today’s focus') : t.due ? shortDate(t.due) : tr('Myra will choose a day')}
            </Text>
          ) : null}
        </Pressable>
        <DoneSwitch done={done} onDone={() => complete(t.id)} onUndo={() => reopen(t.id)} label={t.title} />
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
          <Pressable onPress={() => setCal(c => !c)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.line }}>
            <Ionicons name="calendar-outline" size={14} color={colors.ink} />
            <Text style={{ fontSize: 13, color: colors.ink }}>{tr('Pick a date')}</Text>
          </Pressable>
          <Pressable onPress={() => remove(t.id)} style={{ paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 13, color: colors.bad }}>{tr('Remove')}</Text>
          </Pressable>
        </View>
      ) : null}
      {open && cal ? <View style={{ paddingLeft: 34 }}><DatePicker value={t.due} full={d => d !== t.due && loadOn(tasks, t.area, d) >= PER_AREA_DAY} onPick={d => { moveTo(t.id, d); setCal(false); setOpen(false); }} /></View> : null}
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
  // Only habits past their first 21 days; newer ones are in Clear your mind › Making a habit (26 Oct 2026).
  const list = habitsToday(habits, new Date(y, m - 1, d)).filter(h => !forming(h, date));
  if (!list.length && !habits.some(h => !forming(h, date))) return null;
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
      {edit ? habits.filter(h => !list.includes(h) && !forming(h, date)).map(h => (
        <Pressable key={h.id} onPress={() => removeHabit(h.id)}><Text style={{ color: colors.muted }}>✕ {h.title} · {tr(repeatName(h.repeat))}{h.repeat === 'monthly' && h.dayOfMonth ? ` · ${tr('day {d}', { d: h.dayOfMonth })}` : ''}</Text></Pressable>
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
          <DoneSwitch done={false} onDone={() => complete(t.id)} label={t.title} />
        </View>
      ))}
    </Card>
  );
}
