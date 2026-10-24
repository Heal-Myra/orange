// Mind: the Tao practice, guided meditation (minutes recorded by the app), phone activity from a Screen Time
// screenshot (with any sessions added by hand). Attention and Learning were removed (founder, 21 Oct 2026).
// Scoring: Myra's focus tasks done 15 each (up to 30) + content diet 70, plus the Tao practice on Mind days.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { ClassifyHelper } from '../../components/AiBits';
import { ScreenTimeCard } from '../../components/ScreenTimeCard';
import { MeditationTimer } from '../../components/MeditationTimer';
import { HabitsBar, TasksCard } from '../../components/TasksCard';
import { Anchor, Button, Card, Expandable, Heading, Note, NumberField, Screen, Score, s, useKeepVisible } from '../../components/ui';
import { CONTENT_CATEGORIES, mindScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import type { ContentCategoryId } from '../../lib/types';
import { colors } from '../../theme';
import { tr } from '../../lib/i18n';

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
    <Screen feedback="Mind" trends="mind">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>{tr('Mind today')}</Heading>
      </Card>

      <Anchor id="habits"><HabitsBar /></Anchor>
      <Anchor id="tasks"><TasksCard /></Anchor>

      {/* Breathing & meditation moved here from Soul; Tao moved to Soul (founder, 24 Oct 2026). */}
      <Anchor id="meditation"><MeditationTimer /></Anchor>

      <Anchor id="phone"><ScreenTimeCard>
        {day.media.map((m, i) => (
          <View key={i} style={[s.headingRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }]}>
            <Text style={{ flex: 1, color: colors.ink }}>{m.platform} · {tr(CONTENT_CATEGORIES.find(c => c.id === m.category)?.name ?? '')} · {m.minutes} {tr('min')}{m.source === 'screen' ? ' · from screenshot' : ''}</Text>
            <Pressable onPress={() => update(d => { d.media.splice(i, 1); })} hitSlop={8}><Text style={{ color: colors.bad }}>{tr('Remove')}</Text></Pressable>
          </View>
        ))}

        {!day.noMedia && (adding ? (
          <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 }} key={formKey}>
            <Text style={s.fieldLabel}>{tr('Platform')}</Text>
            <Chips options={PLATFORMS} value={platform} onChange={setPlatform} />
            <Text style={s.fieldLabel}>{tr('What kind of content was it?')}</Text>
            <Chips options={CONTENT_CATEGORIES.map(c => c.id)} labels={Object.fromEntries(CONTENT_CATEGORIES.map(c => [c.id, tr(c.name)]))}
              value={category} onChange={v => setCategory(v as ContentCategoryId)} />
            <ClassifyHelper onPick={setCategory} />
            <NumberField label={tr('Minutes')} value={minutes} onChange={setMinutes} placeholder="30" />
            <View style={s.row}>
              <Button title={tr('Add session')} onPress={add} />
              <Button kind="plain" title={tr('Cancel')} onPress={() => setAdding(false)} />
            </View>
          </View>
        ) : <Button kind="plain" title={tr('+ Add a social-media session by hand')} onPress={() => setAdding(true)} />)}
        <Note>{tr('Content quality earns up to 40 points and staying within your {limit}-minute limit earns up to 30.', { limit: profile.mediaLimit })}</Note>
      </ScreenTimeCard></Anchor>
    </Screen>
  );
}

function Chips({ options, value, onChange, labels }: { options: string[]; value: string; onChange: (v: string) => void; labels?: Record<string, string> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: o === value ? colors.mind : colors.line, backgroundColor: o === value ? colors.mind + '18' : colors.surface }}>
          <Text style={{ color: colors.ink, fontSize: 14 }}>{labels?.[o] ?? tr(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

