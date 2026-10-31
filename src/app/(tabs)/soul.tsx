// Soul / inner life (founder, 24 Oct 2026): Gratitude, Tao practice, Love, Daily Wisdom — 25 points each.
// The eight-practices check and the Tao card were taken off Soul by the founder (20 Oct 2026); Tao now lives on Mind.

import { GratitudeCard, VerseStudyCard } from '../../components/SoulCards';
import { TaoCard } from '../../components/TaoCard';
import { LoveCard } from '../../components/LoveCard';
import { Anchor, Card, Heading, Screen, Score } from '../../components/ui';
import { JOURNAL_FROM, soulScore } from '../../lib/scoring';
import { GratitudeJournal } from '../../components/GratitudeJournal';
import { useHeal } from '../../lib/store';
import { tr } from '../../lib/i18n';

export default function Soul() {
  const { day, date, profile } = useHeal();
  const journal = date >= JOURNAL_FROM;
  const score = soulScore(day, profile);
  return (
    <Screen feedback="Soul">
      <Card style={{ paddingVertical: 12 }}>
        <Heading right={<Score value={score?.total} max={100} />}>{tr('Soul today')}</Heading>
      </Card>
      {/* Gratitude journal (27 Oct 2026) replaces the Gratitude and Love cards; older days keep them. */}
      {journal ? <Anchor id="gratitude"><GratitudeJournal /></Anchor> : <Anchor id="gratitude"><GratitudeCard /></Anchor>}
      <Anchor id="tao"><TaoCard on="soul" /></Anchor>
      {journal ? null : <Anchor id="love"><LoveCard /></Anchor>}
      <Anchor id="wisdom"><VerseStudyCard /></Anchor>
    </Screen>
  );
}
