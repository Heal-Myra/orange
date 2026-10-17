// Soul / inner life: verse of the day and the eight practices, led by truthfulness and fairness (The Orange Book).

import { Text } from 'react-native';
import { ExplainVerse, ReflectCard } from '../../components/AiBits';
import { Card, Check, Heading, Label, Screen, Score } from '../../components/ui';
import { verseOfDay } from '../../lib/gita';
import { PRACTICES, soulScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { colors } from '../../theme';

export default function Soul() {
  const { day, date, update } = useHeal();
  const score = soulScore(day);
  const v = verseOfDay(date);

  return (
    <Screen>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.soul }}>
        <Label>Verse of the day · Bhagavad Gita {v.chapter}.{v.verse}</Label>
        <Text style={{ fontSize: 19, lineHeight: 30, color: colors.ink }}>{v.sanskrit}</Text>
        <Text style={{ fontStyle: 'italic', color: colors.muted }}>{v.transliteration}</Text>
        <ExplainVerse verse={v} />
      </Card>

      <Card>
        <Heading right={<Score value={score?.total} max={100} />}>Practices kept today</Heading>
        {PRACTICES.map(p => (
          <Check key={p.id} checked={!!day.dharma[p.id]} onToggle={() => update(d => { d.dharma[p.id] = !d.dharma[p.id]; })}
            title={p.name} detail={p.meaning} points={p.points} tag={p.orangeBook ? 'ORANGE BOOK' : undefined} />
        ))}
      </Card>

      <ReflectCard />
    </Screen>
  );
}
