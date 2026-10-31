// Body › Face & beauty (founder, 31 Oct 2026; decision 0035): a selfie read for everyday skin-care points, compared with the
// last reading, two or three care tips and two or three kind, playful words for the day. Optional, so it folds away.
// The photo is read once and not kept; only the results are saved with the day.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { earlierReading, LEVELS, SKIN, skinChange } from '../lib/face';
import { tr } from '../lib/i18n';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { useAttach } from './AttachPlus';
import { selfieReading } from './FeelingCard';
import { Card, Expandable, Note } from './ui';

const ARROW = { better: { icon: 'arrow-down' as const, color: colors.good, label: 'better' }, worse: { icon: 'arrow-up' as const, color: colors.bad, label: 'more' }, same: null };

export function FaceCard() {
  const { day, days, date, update } = useHeal();
  const f = day.face;
  const before = earlierReading(days, date);
  const plus = useAttach(async img => {
    const r = await selfieReading(img);
    if (typeof r === 'string') return r;
    update(d => { d.face = r; });
    return null;
  }, { front: true, hint: tr('Take a selfie in daylight, without filters, for a fair skin check.') });

  return (
    <Card style={{ paddingVertical: 4 }}>
      <Expandable icon="sparkles-outline" color={colors.insight} title={tr('Face & beauty')}
        status={f ? f.witty || tr('Skin checked today') : tr('Take a selfie for a skin check')} statusColor={f ? colors.insight : undefined}>
        <View style={{ gap: 10, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              {f?.witty ? <Text style={{ color: colors.insight, fontWeight: '800', fontSize: 20 }}>{f.witty}</Text> : null}
              <Note>{f ? tr('Today\'s selfie. Take another any time.') : tr('Tap + for a selfie. Myra reads your skin; the photo is not kept.')}</Note>
            </View>
            {plus.button}
          </View>
          {plus.status}
          {f ? (
            <>
              <View>
                {SKIN.filter(k => f.skin[k.id]).map((k, i) => {
                  const lv = f.skin[k.id]!;
                  const ch = skinChange(lv, before?.face.skin[k.id]);
                  const a = ch ? ARROW[ch] : null;
                  return (
                    <View key={k.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                      <Text style={{ flex: 1, color: colors.ink }}>{tr(k.label)}</Text>
                      {a ? <Ionicons name={a.icon} size={14} color={a.color} accessibilityLabel={tr(a.label)} style={{ marginRight: 6 }} /> : null}
                      <Text style={{ color: lv === 'none' ? colors.good : lv === 'mild' ? colors.muted : colors.insight, fontWeight: '600' }}>{tr(LEVELS[lv])}</Text>
                    </View>
                  );
                })}
              </View>
              {before ? <Note>{tr('Arrows compare with {day}.', { day: new Date(before.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) })}</Note> : null}
              {f.tips.length ? (
                <View style={{ gap: 6, padding: 12, borderRadius: 14, backgroundColor: colors.insight + '10' }}>
                  {f.tips.map(t => <Text key={t} style={{ color: colors.ink }}>• {t}</Text>)}
                </View>
              ) : null}
              <Note>{tr('Everyday skin care, not medical advice. Light, makeup and filters change how skin looks.')}</Note>
            </>
          ) : null}
        </View>
      </Expandable>
    </Card>
  );
}
