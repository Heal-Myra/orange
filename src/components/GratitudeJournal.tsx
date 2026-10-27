// Gratitude journal (founder, 26–27 Oct 2026), modelled on the layout of his paper journal, in Happy Orange's own panels
// and colours: I'm thankful for (three), Made me laugh, I was kind to (Love), Best part of my day. It replaces the
// Gratitude and Love cards. Points: thank-yous 5 each, laugh 7.5, best part 7.5 (Gratitude 30); kind to someone 30 (Love).
import { TextInput, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { soulScore } from '../lib/scoring';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card, Heading, Note, Score, s, useKeepVisible } from './ui';

const HEAD = colors.soul, LOVE = colors.insight;

function Panel({ title, points, tone = HEAD, children }: { title: string; points: number; tone?: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: tone + '40', overflow: 'hidden', backgroundColor: colors.surface }}>
      <View style={{ backgroundColor: tone, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.6, flexShrink: 1 }}>{title.toUpperCase()}</Text>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{points}</Text>
      </View>
      <View style={{ padding: 8 }}>{children}</View>
    </View>
  );
}

export function GratitudeJournal() {
  const { day, date, update, profile } = useHeal();
  const keep = useKeepVisible();
  const so = day.soul ?? {};
  const thanks = so.gratitude ?? [];
  const score = soulScore(day, profile);
  const setThanks = (i: number, t: string) => update(d => {
    const g = Array.from({ length: Math.max(3, d.soul?.gratitude?.length ?? 0) }, (_, k) => d.soul?.gratitude?.[k] ?? '');
    g[i] = t;
    d.soul = { ...d.soul, gratitude: g };
  });
  const box = (value: string, onChange: (t: string) => void, placeholder: string, key: string, lines = 3) => (
    <TextInput key={date + key} style={[s.input, { minHeight: lines * 20, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 4, paddingVertical: 4, textAlignVertical: 'top' }]}
      value={value} onChangeText={onChange} multiline placeholder={placeholder} placeholderTextColor={colors.muted}
      onFocus={() => setTimeout(keep, 300)} onContentSizeChange={() => keep()} />
  );
  return (
    <Card style={{ gap: 10 }}>
      <Heading right={<Score value={(score?.gratitude ?? 0) + (score?.love ?? 0)} max={60} />}>{tr('Gratitude journal')}</Heading>
      <Note>{tr('Fill it in through the day, or at night before sleep.')}</Note>

      <Panel title={tr('I\'m thankful for')} points={15}>
        {[0, 1, 2].map(i => (
          <View key={date + 't' + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: HEAD + '30', borderStyle: 'dashed' }}>
            <Text style={{ color: HEAD, fontWeight: '800', width: 12 }}>{i + 1}</Text>
            <TextInput style={[s.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 8 }]}
              value={thanks[i] ?? ''} onChangeText={t => setThanks(i, t)} placeholder={tr('Write here')} placeholderTextColor={colors.muted}
              onFocus={() => setTimeout(keep, 300)} />
          </View>
        ))}
      </Panel>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Panel title={tr('Made me laugh')} points={7.5}>
          {box(so.laugh ?? '', t => update(d => { d.soul = { ...d.soul, laugh: t }; }), tr('Write here'), 'laugh')}
        </Panel>
        <Panel title={tr('I was kind to')} points={30} tone={LOVE}>
          {box(day.love?.kindTo ?? '', t => update(d => { d.love = { ...(d.love ?? {}), kindTo: t }; }), tr('Someone, and how'), 'kind')}
        </Panel>
      </View>

      <Panel title={tr('Best part of my day')} points={7.5}>
        {box(so.best ?? '', t => update(d => { d.soul = { ...d.soul, best: t }; }), tr('Write here'), 'best', 2)}
      </Panel>
    </Card>
  );
}
