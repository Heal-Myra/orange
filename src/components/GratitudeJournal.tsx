// Gratitude journal (founder, 26–27 Oct 2026), modelled on the layout of his paper journal, in Happy Orange's own panels
// and colours: I'm thankful for (three), Made me laugh, I was kind to (Love), Best part of my day. It replaces the
// Gratitude and Love cards. Points: thank-yous 5 each, laugh 7.5, best part 7.5 (Gratitude 30); kind to someone 30 (Love).
import { TextInput, Text, View } from 'react-native';
import { tr } from '../lib/i18n';
import { filledText, soulScore } from '../lib/scoring';
import { EntryHead, PASTEL, RingTop, pts } from './Rings';
import { MyraLine } from './MyraLine';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card, Heading, Note, Score, s, useKeepVisible } from './ui';
import { readNoteJournal } from '../lib/ai';
import { useAttach } from './AttachPlus';


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
  // "+": a photo of the paper journal page fills the empty panels; anything already typed stays (founder, 30 Oct 2026).
  const attach = useAttach(async img => {
    const r = await readNoteJournal(img.data, img.media_type);
    // Work out what to fill from what is on screen now, then save it in one change.
    const g = Array.from({ length: Math.max(3, thanks.length) }, (_, k) => thanks[k] ?? '');
    const fresh = (r.thankful ?? []).map(x => x?.trim()).filter(Boolean);
    let filled = 0;
    for (let k = 0; k < 3 && fresh.length; k++) if (!g[k]?.trim()) { g[k] = fresh.shift()!; filled++; }
    const pick = (old: string | undefined, nu: string | undefined) => (!old?.trim() && nu?.trim() ? (filled++, nu.trim()) : old);
    const laugh = pick(so.laugh, r.laugh), best = pick(so.best, r.best), kindTo = pick(day.love?.kindTo, r.kindTo);
    if (!filled) return r.note || tr('Nothing new to fill from that photo.');
    update(d => {
      d.soul = { ...d.soul, gratitude: g, laugh, best };
      d.love = { ...(d.love ?? {}), kindTo };
    });
    return tr('Filled {n} lines from your photo. Check and change anything.', { n: filled });
  });
  // Rings on top, one per prompt; the writing boxes below, each with its ring's dot (founder, 31 Oct 2026; decision 0037).
  const nThanks = Math.min(3, thanks.filter(x => filledText(x ?? '')).length);
  const laughOk = filledText(so.laugh ?? ''), kindOk = filledText(day.love?.kindTo ?? ''), bestOk = filledText(so.best ?? '');
  const RING = { thanks: PASTEL.peach, laugh: PASTEL.sand, kind: PASTEL.rose, best: PASTEL.teal };
  const soft = { borderWidth: 1, borderColor: colors.line, backgroundColor: '#F8FAFB', borderRadius: 12, paddingHorizontal: 10 } as const;
  return (
    <Card style={{ gap: 10 }}>
      <Heading right={<Score value={(score?.gratitude ?? 0) + (score?.love ?? 0)} max={60} />}>{tr('Gratitude journal')}</Heading>
      <RingTop trend="gratitude" score={(score?.gratitude ?? 0) + (score?.love ?? 0)} max={60} items={[
        { id: 'thanks', color: RING.thanks, label: tr('I\'m thankful for'), value: nThanks / 3 },
        { id: 'laugh', color: RING.laugh, label: tr('Made me laugh'), value: laughOk ? 1 : 0 },
        { id: 'kind', color: RING.kind, label: tr('I was kind to'), value: kindOk ? 1 : 0 },
        { id: 'best', color: RING.best, label: tr('Best part of my day'), value: bestOk ? 1 : 0 },
      ]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}><Note>{tr('Fill it in through the day, or at night before sleep. Wrote it on paper? Tap + for a photo.')}</Note></View>
        {attach.button}
      </View>
      {attach.status}

      <EntryHead color={RING.thanks} title={tr('I\'m thankful for')} points={pts(nThanks * 5, 15)} />
      <View style={soft}>
        {[0, 1, 2].map(i => (
          <View key={date + 't' + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.line, borderStyle: 'dashed' }}>
            <Text style={{ color: colors.muted, fontWeight: '700', width: 14 }}>{i + 1}.</Text>
            <TextInput style={[s.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 9 }]}
              value={thanks[i] ?? ''} onChangeText={t => setThanks(i, t)} placeholder={tr('Write here')} placeholderTextColor={colors.muted}
              onFocus={() => setTimeout(keep, 300)} />
          </View>
        ))}
      </View>

      <EntryHead color={RING.laugh} title={tr('Made me laugh')} points={pts(laughOk ? 7.5 : 0, 7.5)} />
      <View style={soft}>{box(so.laugh ?? '', t => update(d => { d.soul = { ...d.soul, laugh: t }; }), tr('Write here'), 'laugh', 2)}</View>

      <EntryHead color={RING.kind} title={tr('I was kind to')} points={pts(kindOk ? 30 : 0, 30)} />
      <View style={soft}>{box(day.love?.kindTo ?? '', t => update(d => { d.love = { ...(d.love ?? {}), kindTo: t }; }), tr('Someone, and how'), 'kind', 2)}</View>

      <EntryHead color={RING.best} title={tr('Best part of my day')} points={pts(bestOk ? 7.5 : 0, 7.5)} />
      <View style={soft}>{box(so.best ?? '', t => update(d => { d.soul = { ...d.soul, best: t }; }), tr('Write here'), 'best', 2)}</View>

      <MyraLine card="gratitude" />
    </Card>
  );
}
