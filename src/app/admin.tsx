// Admin (founder only): approve or decline AI access requests, and read testers' feedback.
// Uses tables ai_access, app_admins and feedback (migrations 0003, 0004); row-level security lets only admins see others' rows.

import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Heading, Note, Screen, Segmented } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { tr } from '../lib/i18n';

type Access = { user_id: string; email: string; status: 'pending' | 'approved' | 'declined'; requested_at: string; decided_at: string | null };
type Fb = { id: number; email: string | null; area: string | null; rating: number | null; message: string; created_at: string };
const FACES = ['', '😞', '😕', '😐', '🙂', '😍'];
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Admin() {
  const { admin, session } = useAuth();
  const [tab, setTab] = useState<'access' | 'feedback'>('access');
  const [access, setAccess] = useState<Access[]>([]);
  const [feedback, setFeedback] = useState<Fb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setBusy(true); setError(null);
    const a = await supabase.from('ai_access').select('*').order('requested_at', { ascending: false });
    const f = await supabase.from('feedback').select('id,email,area,rating,message,created_at').order('created_at', { ascending: false }).limit(100);
    setBusy(false);
    if (a.error) setError(a.error.message); else setAccess(a.data as Access[]);
    if (!f.error) setFeedback(f.data as Fb[]);
  }, []);
  useEffect(() => { if (admin) load(); }, [admin, load]);

  const decide = async (row: Access, status: Access['status']) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('ai_access')
      .update({ status, decided_at: new Date().toISOString(), decided_by: session?.user.email ?? null }).eq('user_id', row.user_id);
    if (e) setError(e.message); else setAccess(list => list.map(x => x.user_id === row.user_id ? { ...x, status, decided_at: new Date().toISOString() } : x));
  };

  if (!admin) return <Screen showDay={false}><Card><Note>{tr('This page is only for the Happy Orange team.')}</Note></Card></Screen>;

  const pending = access.filter(a => a.status === 'pending');
  const others = access.filter(a => a.status !== 'pending');

  return (
    <Screen showDay={false}>
      <Segmented<'access' | 'feedback'> value={tab} onChange={setTab}
        options={[{ label: `AI requests${pending.length ? ` (${pending.length})` : ''}`, value: 'access' }, { label: `Feedback (${feedback.length})`, value: 'feedback' }]} />
      {error ? <Text style={{ color: colors.bad }}>{error}</Text> : null}

      {tab === 'access' ? (
        <>
          <Card>
            <Heading>{tr('Waiting for you')}</Heading>
            {!pending.length ? <Note>{tr('No new requests. People ask automatically when they first sign in.')}</Note> : pending.map(r => (
              <View key={r.user_id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
                <Text style={{ fontWeight: '600', color: colors.ink }}>{r.email}</Text>
                <Note>{tr('Asked {when}', { when: when(r.requested_at) })}</Note>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title={tr('Approve')} onPress={() => decide(r, 'approved')} />
                  <Button kind="plain" title={tr('Decline')} onPress={() => decide(r, 'declined')} />
                </View>
              </View>
            ))}
          </Card>
          <Card>
            <Heading>{tr('Decided')}</Heading>
            {!others.length ? <Note>{tr('Nothing yet.')}</Note> : others.map(r => (
              <View key={r.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink }}>{r.email}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: r.status === 'approved' ? colors.good : colors.bad }}>{r.status === 'approved' ? 'APPROVED' : 'DECLINED'}</Text>
                </View>
                <Pressable onPress={() => decide(r, r.status === 'approved' ? 'declined' : 'approved')} hitSlop={8}>
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>{r.status === 'approved' ? tr('Turn off') : tr('Approve')}</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <Heading>{tr('What testers say')}</Heading>
          {!feedback.length ? <Note>{tr('No feedback yet.')}</Note> : feedback.map(f => (
            <View key={f.id} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{when(f.created_at)} · {f.email ?? 'unknown'} · {f.area ?? tr('Other')} {f.rating ? FACES[f.rating] : ''}</Text>
              <Text selectable style={{ color: colors.ink, lineHeight: 21 }}>{f.message}</Text>
            </View>
          ))}
        </Card>
      )}
      <Button kind="plain" title={busy ? tr('Refreshing…') : tr('Refresh')} onPress={load} disabled={busy} />
    </Screen>
  );
}
