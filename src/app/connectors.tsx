// Connectors (founder, 6 Nov 2026): every outside connection in one place. Each says in one line what it brings to Happy
// Orange; connected ones show a green tick, the rest a Connect button or "Soon".

import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Note } from '../components/ui';
import { useHealth } from '../components/HealthSync';
import { tr } from '../lib/i18n';
import { useNeoSapien } from '../lib/neosapien';
import { colors } from '../theme';

const GREEN = '#3C8C5A';

function Row({ icon, bg, title, line, right, onPress, children }: { icon: ReactNode; bg: string; title: string; line: string; right: ReactNode; onPress?: () => void; children?: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole={onPress ? 'button' : undefined}>
        <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>{typeof icon === 'string' ? <Text style={{ fontSize: 19 }}>{icon}</Text> : icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{title}</Text>
          <Text style={{ fontSize: 12.5, color: colors.muted, marginTop: 2 }}>{line}</Text>
        </View>
        {right}
      </Pressable>
      {children}
    </View>
  );
}
const On = () => <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>✓ {tr('On')}</Text>;
const Soon = () => <Text style={{ fontSize: 12, color: colors.muted, borderWidth: 1, borderColor: colors.line, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>{tr('Soon')}</Text>;
const Connect = ({ onPress }: { onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ backgroundColor: colors.accent, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7 }} accessibilityRole="button">
    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{tr('Connect')}</Text>
  </Pressable>
);

export default function Connectors() {
  const health = useHealth();
  const ns = useNeoSapien();
  const [open, setOpen] = useState<string | null>(null);
  const back = useLocalSearchParams<{ error?: string }>();
  const [msg, setMsg] = useState<string | null>(back.error ? String(back.error) : null);
  const label = { fontSize: 11, fontWeight: '800' as const, letterSpacing: 0.6, color: colors.muted, marginTop: 6, marginLeft: 4 };
  const healthRow = health.available ? (
    <Row key="health" icon="❤️" bg="#F6E3E3" title="Apple Health" line={tr('Steps, sleep, weight, heart, mindful minutes')}
      right={health.connected ? <On /> : <Connect onPress={() => router.push('/connect-health')} />} />
  ) : null;
  const nsRow = (
    <Row key="ns" icon={<Text style={{ color: GREEN, fontWeight: '800', fontSize: 18 }}>n</Text>} bg={GREEN + '18'} title="NeoSapien (Neo 1)" line={tr('Journal, to-dos and tone of your day')}
      right={ns.connected ? <On /> : <Connect onPress={() => { setMsg(tr('Sign in on the NeoSapien page, then come back here.')); ns.connect().catch(e => setMsg(String(e.message ?? e))); }} />}
      onPress={ns.connected ? () => setOpen(o => (o === 'ns' ? null : 'ns')) : undefined}>
      {open === 'ns' && ns.connected ? (
        <>
          <Note>{tr('Myra reads the day Neo 1 heard and suggests your gratitude journal, your to-dos and the tone of your day. Nothing is added without your yes. Only short lines come in; transcripts and business details stay with NeoSapien.')}</Note>
          <Button kind="plain" title={tr('Disconnect NeoSapien')} onPress={() => ns.disconnect().catch(e => setMsg(String(e.message ?? e)))} />
        </>
      ) : null}
      {msg && !ns.connected ? <Note>{msg}</Note> : null}
    </Row>
  );
  const isOn = { health: !!health.connected, ns: !!ns.connected };
  const mine = [isOn.health ? healthRow : null, isOn.ns ? nsRow : null].filter(Boolean);
  const more = [!isOn.health ? healthRow : null, !isOn.ns ? nsRow : null].filter(Boolean);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
      {mine.length ? <Text style={label}>{tr('CONNECTED')}</Text> : null}
      {mine}
      <Text style={label}>{tr('ADD MORE')}</Text>
      {more}
      <Row icon="📅" bg="#E6EEF8" title="Google Calendar" line={tr('Myra plans around your meetings')} right={<Soon />} />
      <Row icon="✉️" bg="#F8ECE6" title="Gmail" line={tr('To-dos from emails you mark')} right={<Soon />} />
      <Row icon="✳️" bg="#F6E7E0" title="Claude · ChatGPT" line={tr('Ask your own AI about your Happy Orange days')} right={<Soon />} />
      <Note>{tr('Nothing is added without your yes. Disconnect any time; its data leaves Happy Orange.')}</Note>
    </ScrollView>
  );
}
