// Sign in with a 6-digit code sent by email. No passwords.

import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Card, Note, Screen, s } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors } from '../theme';
import { tr } from '../lib/i18n';

export default function SignIn() {
  const { sendCode, verifyCode, continueAsGuest } = useAuth();
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

  const verify = async (c = code) => {
    if (!sentTo || busy) return;
    setBusy(true); setMessage(null);
    const err = await verifyCode(sentTo, c);
    setBusy(false);
    if (err) setMessage(err);
  };

  return (
    <Screen showDay={false}>
      <View style={{ gap: 6, paddingTop: 32 }}>
        <Text style={{ fontSize: 30, color: colors.brand, fontWeight: '700' }}>{tr('Happy Orange')}</Text>
        <Text style={{ fontSize: 15, color: colors.muted }}>{tr('Body, mind and inner life in harmony')}</Text>
      </View>

      <Card>
        {!sentTo ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>{tr('Sign in or create your account')}</Text>
            <Note>{tr('We\'ll email you a 6-digit sign-in code. No password needed.')}</Note>
            <Text style={s.fieldLabel}>{tr('Your email')}</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder={tr('you@example.com')} placeholderTextColor={colors.muted}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
            <Button title={busy ? tr('Sending…') : tr('Email me a sign-in code')} onPress={send} disabled={!emailOk || busy} />
          </>
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>{tr('Check your email')}</Text>
            <Note>{tr('We sent a 6-digit code to {email}. It can take a minute; look in Spam too. Type the code here:', { email: sentTo })}</Note>
            <Text style={s.fieldLabel}>{tr('6-digit code')}</Text>
            <TextInput style={[s.input, { fontSize: 24, letterSpacing: 6 }]} value={code} onChangeText={t => { const c = t.replace(/\D/g, '').slice(0, 6); setCode(c); if (c.length === 6) verify(c); }}
              autoFocus placeholder="123456" placeholderTextColor={colors.muted} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" />
            <Button title={busy ? tr('Checking…') : tr('Sign in')} onPress={() => verify()} disabled={code.length !== 6 || busy} />
            <Pressable onPress={() => { setSentTo(null); setMessage(null); }}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>{tr('Use a different email')}</Text>
            </Pressable>
          </>
        )}
        {message ? <Text style={{ color: colors.bad }}>{message}</Text> : null}
      </Card>

      <Pressable onPress={continueAsGuest} style={{ alignItems: 'center', padding: 8 }}>
        <Text style={{ color: colors.muted }}>{tr('Use without an account (saved on this device only)')}</Text>
      </Pressable>
    </Screen>
  );
}
