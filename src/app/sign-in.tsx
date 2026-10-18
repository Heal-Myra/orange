// Sign in with a 6-digit code sent by email. No passwords.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Note, Screen, s } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';

export default function SignIn() {
  const { sendCode, verifyCode, verifyLink, continueAsGuest } = useAuth();
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  const send = async () => {
    setBusy(true); setMessage(null);
    const err = await sendCode(email);
    setBusy(false);
    if (err) setMessage(err); else { setSentTo(email.trim().toLowerCase()); setCode(''); }
  };

  const verify = async () => {
    if (!sentTo) return;
    setBusy(true); setMessage(null);
    const err = await verifyCode(sentTo, code);
    setBusy(false);
    if (err) setMessage(err);
  };

  const useLink = async () => {
    setBusy(true); setMessage(null);
    const err = await verifyLink(link);
    setBusy(false);
    if (err) setMessage(err);
  };

  return (
    <Screen showDay={false}>
      <View style={{ gap: 6, paddingTop: 32 }}>
        <Text style={{ fontSize: 30, color: colors.ink, fontWeight: '600' }}>Project Heal</Text>
        <Text style={{ fontSize: 15, color: colors.muted }}>Body, mind and inner life in harmony</Text>
      </View>

      <Card>
        {!sentTo ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>Sign in or create your account</Text>
            <Note>We'll email you a 6-digit sign-in code. No password needed.</Note>
            <Text style={s.fieldLabel}>Your email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
            <Button title={busy ? 'Sending…' : 'Email me a sign-in code'} onPress={send} disabled={!emailOk || busy} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>Check your email</Text>
            <Note>We sent a 6-digit code to {sentTo}. It can take a minute; look in Spam too. Type the code here:</Note>
            <Text style={s.fieldLabel}>6-digit code</Text>
            <TextInput style={[s.input, { fontSize: 24, letterSpacing: 6 }]} value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" placeholderTextColor={colors.muted} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" />
            <Button title={busy ? 'Checking…' : 'Sign in'} onPress={verify} disabled={code.length !== 6 || busy} />
            <View style={{ gap: 6, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 }}>
              <Note>No code in the email, only a link? Press and hold the link, choose "Copy Link", then paste it here.</Note>
              <TextInput style={s.input} value={link} onChangeText={setLink} placeholder="Paste the sign-in link" placeholderTextColor={colors.muted}
                autoCapitalize="none" autoCorrect={false} />
              <Button kind="plain" title={busy ? 'Signing in…' : 'Sign in with this link'} onPress={useLink} disabled={!link.trim() || busy} />
            </View>
            <Pressable onPress={() => { setSentTo(null); setMessage(null); }}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Use a different email</Text>
            </Pressable>
          </>
        )}
        {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      </Card>

      <Pressable onPress={continueAsGuest} style={{ alignItems: 'center', padding: 8 }}>
        <Text style={{ color: colors.muted }}>Use without an account (saved on this device only)</Text>
      </Pressable>
    </Screen>
  );
}
