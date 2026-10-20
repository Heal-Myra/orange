// Mind: the Tao practice, guided meditation (minutes recorded by the app), phone activity from a Screen Time
// screenshot, and one card for everything typed by hand (attention, learning, extra social-media sessions).
// Scoring: attention 15 + learning 15 + content diet 70, plus the Tao practice on Mind days (meditation is on Soul).

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClassifyHelper } from '../../components/AiBits';
import { ScreenTimeCard } from '../../components/ScreenTimeCard';
import { TaoCard } from '../../components/TaoCard';
import { TasksCard } from '../../components/TasksCard';
import { Button, Card, Check, Heading, Note, NumberField, Screen, Score, s } from '../../components/ui';
import { CONTENT_CATEGORIES, mindScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import type { ContentCategoryId } from '../../lib/types';
import { colors } from '../../theme';

const PLATFORMS = ['Instagram', 'YouTube', 'WhatsApp', 'Facebook', 'X', 'LinkedIn', 'Other'];

export default function Mind() {
  const { day, profile, update } = useHeal();
  const score = mindScore(day, profile);
  const [platform, setPlatform] = useState('Instagram');
  const [category, setCategory] = useState<ContentCategoryId>('learning');
  const [minutes, setMinutes] = useState<number | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!minutes || minutes <= 0) return;
    update(d => { d.noMedia = false; d.media.push({ platform, minutes: Math.round(minutes), category, source: 'manual' }); });
    setMinutes(undefined); setFormKey(k => k + 1); setAdding(false);
  };

  return (
    <Screen feedback="Mind">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>Mind today</Heading>
      </Card>

      <TasksCard />

      <TaoCard on="mind" />

      <ScreenTimeCard />

      <Card>
        <Heading>Other activities</Heading>
        <Check color={colors.mind} checked={!!day.mind.attention} onToggle={() => update(d => { d.mind.attention = !d.mind.attention; })}
          title="Attention" detail="Did a focused, phone-free block of single-tasking" points={15} />
        <Check color={colors.mind} checked={!!day.mind.learning} onToggle={() => update(d => { d.mind.learning = !d.mind.learning; })}
          title="Learning" detail="Learned something: a book, course, skill or wisdom text" points={15} />

        {day.media.map((m, i) => (
          <View key={i} style={[s.headingRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
            <Text style={{ flex: 1, color: colors.ink }}>{m.platform} · {CONTENT_CATEGORIES.find(c => c.id === m.category)?.name} · {m.minutes} min{m.source === 'screen' ? ' · from screenshot' : ''}</Text>
            <Pressable onPress={() => update(d => { d.media.splice(i, 1); })} hitSlop={8}><Text style={{ color: colors.bad }}>Remove</Text></Pressable>
          </View>
        ))}

        {!day.noMedia && (adding ? (
          <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }} key={formKey}>
            <Text style={s.fieldLabel}>Platform</Text>
            <Chips options={PLATFORMS} value={platform} onChange={setPlatform} />
            <Text style={s.fieldLabel}>What kind of content was it?</Text>
            <Chips options={CONTENT_CATEGORIES.map(c => c.id)} labels={Object.fromEntries(CONTENT_CATEGORIES.map(c => [c.id, c.name]))}
              value={category} onChange={v => setCategory(v as ContentCategoryId)} />
            <ClassifyHelper onPick={setCategory} />
            <NumberField label="Minutes" value={minutes} onChange={setMinutes} placeholder="30" />
            <View style={s.row}>
              <Button title="Add session" onPress={add} />
              <Button kind="plain" title="Cancel" onPress={() => setAdding(false)} />
            </View>
          </View>
        ) : <Button kind="plain" title="+ Add a social-media session by hand" onPress={() => setAdding(true)} />)}
        <Note>Content quality earns up to 40 points and staying within your {profile.mediaLimit}-minute limit earns up to 30.</Note>
      </Card>
    </Screen>
  );
}

function Chips({ options, value, onChange, labels }: { options: string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: o === value ? colors.mind : colors.line, backgroundColor: o === value ? colors.mind + '18' : colors.surface }}>
          <Text style={{ color: colors.ink, fontSize: 14 }}>{labels?.[o] ?? o}</Text>
        </Pressable>
      ))}
    </View>
  );
}
