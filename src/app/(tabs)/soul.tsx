// Soul / inner life, in the founder's order (20 Oct 2026): Gratitude, Breathing & meditation, Daily Wisdom (the Gita
// verse of the day), then the thought of the day.
// The eight-practices check and the Tao card were taken off Soul by the founder (20 Oct 2026); Tao now lives on Mind.

import { GratitudeCard, VerseStudyCard } from '../../components/SoulCards';
import { MeditationTimer } from '../../components/MeditationTimer';
import { Anchor, Card, Heading, Screen, Score } from '../../components/ui';
import { soulScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { tr } from '../../lib/i18n';

export default function Soul() {
  const { day, profile } = useHeal();
  const score = soulScore(day, profile);
  return (
    <Screen feedback="Soul">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>{tr('Soul today')}</Heading>
      </Card>
      <Anchor id="gratitude"><GratitudeCard /></Anchor>
      <Anchor id="meditation"><MeditationTimer /></Anchor>
      <Anchor id="wisdom"><VerseStudyCard /></Anchor>
    </Screen>
  );
}
