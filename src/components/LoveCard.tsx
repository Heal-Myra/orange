// Love (founder, 24 Oct 2026): Soul is not only spiritual. Whom will you love today, what will you do to make yourself
// happy, which friend are you meeting this week — and, optionally, the party you are planning. A bonus of up to +15.

import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { shiftISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card, Expandable, Heading, Note, Score, TextField } from './ui';

/** Monday of the week the date is in. */
const mondayOf = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); const w = new Date(y, m - 1, d).getDay(); return shiftISO(iso, -((w + 6) % 7)); };

export function LoveCard() {
  const { day, days, date, update, profile, setProfile } = useHeal();
  const love = day.love ?? {};
  const set = (k: 'whom' | 'act' | 'happy' | 'friend', v: string) => update(d => { d.love = { ...(d.love ?? {}), [k]: v }; });
  // The friend for this week carries to every day of the week.
  const monday = mondayOf(date);
  const weekFriend = Array.from({ length: 7 }, (_, i) => days[shiftISO(monday, i)]?.love?.friend?.trim()).find(Boolean);
  useEffect(() => { if (weekFriend && !love.friend?.trim()) set('friend', weekFriend); }, [weekFriend, date]); // eslint-disable-line react-hooks/exhaustive-deps
  const filled = (t?: string) => (t ?? '').trim().length >= 2;
  const pts = (filled(love.whom) ? 5 : 0) + (filled(love.happy) ? 5 : 0) + (filled(love.friend) ? 5 : 0);
  const party = profile.me?.party ?? {};
  const setParty = (k: keyof typeof party, v: string) => profile.me && setProfile({ ...profile, me: { ...profile.me, party: { ...party, [k]: v } } });

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.soul }}>
      <Heading right={<Score value={pts} max={15} />}>{tr('Love')}</Heading>
      <Note>{tr('People, joy and friends feed the soul too. Up to +15 on top of Soul.')}</Note>
      <View style={{ gap: 4 }}>
        <TextField key={date + 'whom'} label={tr('Whom will I love today, and how?')} value={love.whom ?? ''} onChangeText={v => set('whom', v)}
          placeholder={tr('e.g. Mum: call her and listen')} />
        <TextField key={date + 'happy'} label={tr('What will I do to make myself happy today?')} value={love.happy ?? ''} onChangeText={v => set('happy', v)}
          placeholder={tr('e.g. old songs on the evening walk')} />
        <TextField key={monday + 'friend'} label={tr('Which friend am I meeting this week?')} value={love.friend ?? ''} onChangeText={v => set('friend', v)}
          placeholder={tr('e.g. Ravi, Sunday breakfast')} />
      </View>
      {profile.me ? (
        <Expandable icon="sparkles-outline" color={colors.soul} title={tr('Planning a party')}
          status={party.what?.trim() ? [party.what, party.when].filter(Boolean).join(' · ') : tr('Optional')}>
          <TextField label={tr('What and for whom')} value={party.what ?? ''} onChangeText={v => setParty('what', v)} placeholder={tr('e.g. Nitu\'s birthday dinner')} />
          <TextField label={tr('When and where')} value={party.when ?? ''} onChangeText={v => setParty('when', v)} placeholder={tr('e.g. Sat 7 Nov, at home')} />
          <TextField label={tr('Who to invite')} value={party.who ?? ''} onChangeText={v => setParty('who', v)} multiline placeholder={tr('e.g. family, 3 school friends')} />
          <TextField label={tr('The plan: food, music, what to do')} value={party.plan ?? ''} onChangeText={v => setParty('plan', v)} multiline placeholder={tr('Ask Myra for ideas any time.')} />
          <Text style={{ color: colors.muted, fontSize: 13 }}>{tr('Myra keeps it in mind and can help plan the menu and to-dos.')}</Text>
        </Expandable>
      ) : null}
    </Card>
  );
}
