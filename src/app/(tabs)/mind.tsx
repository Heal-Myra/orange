// Mind: meditation, attention and learning (40) + social-media content diet (60).

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClassifyHelper } from '../../components/AiBits';
import { Button, Card, Check, Heading, Meter, Note, NumberField, Screen, Score, s } from '../../components/ui';
import { CONTENT_CATEGORIES, mindScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import type { ContentCategoryId } from '../../lib/types';
import { colors } from '../../theme';

const PLATFORMS = ['Instagram', 'YouTube', 'WhatsApp', 'Facebook', 'X', 'LinkedIn', 'Other'];

export default function Mind() {
  const { day, date, profile, update } = useHeal();
  const score = mindScore(day, profile);
  const [platform, setPlatform] = useState('Instagram');
  const [category, setCategory] = useState<ContentCategoryId>('learning');
  const [minutes, setMinutes] = useState<number | undefined>();
  const [formKey, setFormKey] = useState(0);

  const add = () => {
    if (!minutes || minutes <= 0) return;
    update(d => { d.noMedia = false; d.media.push({ platform, minutes: Math.round(minutes), category }); });
    setMinutes(undefined); setFormKey(k => k + 1);
  };

  return (
    <Screen>
      <Card>
        <Heading right={<Score value={score?.total} max={100} />}>Meditation, attention & learning</Heading>
        <NumberField key={date + 'med'} label={`Meditation today (minutes, target ${profile.meditation})`} value={day.mind.meditationMin}
          onChange={v => update(d => { d.mind.meditationMin = v; })} />
        <Meter label="Dhyana" value={day.mind.meditationMin ?? 0} max={profile.meditation} color={colors.mind} />
        <Check color={colors.mind} checked={!!day.mind.attention} onToggle={() => update(d => { d.mind.attention = !d.mind.attention; })}
          title="Attention" detail="Did a focused, phone-free block of single-tasking" points={10} />
        <Check color={colors.mind} checked={!!day.mind.learning} onToggle={() => update(d => { d.mind.learning = !d.mind.learning; })}
          title="Learning" detail="Learned something: a book, course, skill or wisdom text" points={10} />
      </Card>

      <Card>
        <Heading right={<Score value={score?.content} max={60} />}>Social-media content diet</Heading>
        <Check color={colors.mind} checked={day.noMedia} onToggle={() => update(d => { d.noMedia = !d.noMedia; if (d.noMedia) d.media = []; })}
          title="I used no social media today" />
        {!day.noMedia && (
          <View style={{ gap: 10 }} key={formKey}>
            <Text style={s.fieldLabel}>Platform</Text>
            <Chips options={PLATFORMS} value={platform} onChange={setPlatform} />
            <Text style={s.fieldLabel}>What kind of content was it?</Text>
            <Chips options={CONTENT_CATEGORIES.map(c => c.id)} labels={Object.fromEntries(CONTENT_CATEGORIES.map(c => [c.id, c.name]))}
              value={category} onChange={v => setCategory(v as ContentCategoryId)} />
            <ClassifyHelper onPick={setCategory} />
            <NumberField label="Minutes" value={minutes} onChange={setMinutes} placeholder="30" />
            <Button title="Add session" onPress={add} />
          </View>
        )}
        {day.media.map((m, i) => (
          <View key={i} style={[s.headingRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
            <Text style={{ flex: 1, color: colors.ink }}>{m.platform} · {CONTENT_CATEGORIES.find(c => c.id === m.category)?.name} · {m.minutes} min</Text>
            <Pressable onPress={() => update(d => { d.media.splice(i, 1); })} hitSlop={8}><Text style={{ color: colors.bad }}>Remove</Text></Pressable>
          </View>
        ))}
        <Note>Quality earns up to 35 points and staying within your {profile.mediaLimit}-minute limit earns up to 25.</Note>
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
