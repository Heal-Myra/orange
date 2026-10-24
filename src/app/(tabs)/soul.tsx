// Soul / inner life (founder, 24 Oct 2026): Gratitude, Tao practice, Love, Daily Wisdom — 25 points each.
// The eight-practices check and the Tao card were taken off Soul by the founder (20 Oct 2026); Tao now lives on Mind.

import { GratitudeCard, VerseStudyCard } from '../../components/SoulCards';
import { TaoCard } from '../../components/TaoCard';
import { LoveCard } from '../../components/LoveCard';
import { Anchor, Card, Heading, Screen, Score } from '../../components/ui';
import { soulScore } from '../../lib/scoring';
import { useHeal } from '../../lib/store';
import { tr } from '../../lib/i18n';

export default function Soul() {
  const { day, profile } = useHeal();
  const score = soulScore(day, profile);
  return (
    <Screen feedback="Soul" trends="soul">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>{tr('Soul today')}</Heading>
      </Card>
      <Anchor id="gratitude"><GratitudeCard /></Anchor>
      <Anchor id="tao"><TaoCard on="soul" /></Anchor>
      <Anchor id="love"><LoveCard /></Anchor>
      <Anchor id="wisdom"><VerseStudyCard /></Anchor>
    </Screen>
  );
}
