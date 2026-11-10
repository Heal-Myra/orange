// Spaces nudge on Today (founder, 10 Nov 2026): on Saturday and Sunday one home space worth improving, on Friday the work
// desk (office). One card with Myra's line, "Open Spaces" and "Not now" (which hides it for the rest of the day).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { SPACES, weekNudge } from '../lib/spaces';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Card } from './ui';

const KEY = 'spaces.nudge.hidden';

export function SpacesNudge() {
  const { profile } = useHeal();
  const today = todayISO();
  const [hidden, setHidden] = useState<string | null>(today); // hidden until we know
  useEffect(() => { AsyncStorage.getItem(KEY).then(v => setHidden(v)).catch(() => setHidden(null)); }, []);
  if (!profile.me) return null;
  const n = weekNudge(profile.me.spaces ?? {}, new Date().getDay());
  if (!n || hidden === today) return null;
  const name = tr(SPACES.find(x => x.id === n.id)!.name).toLowerCase();
  const line = n.kind === 'office' ? tr('Friday desk check: snap it before you leave.')
    : n.score == null ? tr('Weekend fix: snap your {space}.', { space: name })
    : tr('Weekend fix: your {space} scores {n}.', { space: name, n: n.score });
  const sub = n.tip ?? (n.kind === 'office' && n.score == null ? tr('Your work desk is not snapped yet') : n.score != null ? tr('{space} score {n}', { space: tr(SPACES.find(x => x.id === n.id)!.name), n: n.score }) : null);
  const notNow = () => { setHidden(today); AsyncStorage.setItem(KEY, today).catch(() => {}); };
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.insight, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onInsight, fontWeight: '800', fontSize: 15 }}>M</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.insight, fontSize: 16, fontWeight: '600' }}>{line}</Text>
          {sub ? <Text style={{ color: colors.muted, fontSize: 13 }}>{sub}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => router.push({ pathname: '/spaces', params: { id: n.id } })} accessibilityRole="button"
          style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.onAccent, fontWeight: '600', fontSize: 15 }}>{n.kind === 'office' ? tr('Snap my desk') : tr('Open Spaces')}</Text>
        </Pressable>
        <Pressable onPress={notNow} accessibilityRole="button"
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.ink, fontSize: 15 }}>{tr('Not now')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}
