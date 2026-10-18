// Privacy consent, shown once after sign-in (India's Digital Personal Data Protection Act, 2023).
// Draft wording for the founder to review with a lawyer before public launch.

import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Note, Screen } from '../components/ui';
import { CONSENT_VERSION, useAuth } from '../lib/auth';
import { colors } from '../theme';

const POINTS = [
  ['What we keep', 'What you log in Happy Orange: activity, sleep, meals, meditation, social-media time, practices and reflections, plus your daily scores and targets.'],
  ['Why', 'Only to show your well-being scores and give you guidance. We never sell your data or use it for advertising.'],
  ['Where', 'In a secure database in Mumbai, India. Only you can see your entries.'],
  ['AI features', 'When you use a meal photo, guidance, verse explanation or reflection, only what that feature needs is sent to Anthropic (the maker of Claude) to produce the answer. Anthropic does not use it to train its AI.'],
  ['Your choices', 'You can stop at any time, and delete your data from the Account screen.'],
  ['Not medical advice', 'Happy Orange is a working model to help you understand yourself. It does not diagnose or treat any condition.'],
];

export default function Consent() {
  const { giveConsent, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agree = async () => {
    setBusy(true); setError(null);
    const err = await giveConsent();
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <Screen showDay={false}>
      <View style={{ paddingTop: 24, gap: 4 }}>
        <Text style={{ fontSize: 26, fontWeight: '600', color: colors.ink }}>Your data, your choice</Text>
        <Note>Please read this before we save anything to your account.</Note>
      </View>
      <Card>
        {POINTS.map(([title, body]) => (
          <View key={title} style={{ gap: 2 }}>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{title}</Text>
            <Text style={{ color: colors.ink, lineHeight: 21 }}>{body}</Text>
          </View>
        ))}
        <Note>Version {CONSENT_VERSION}</Note>
      </Card>
      {error ? <Text style={{ color: colors.bad }}>{error}</Text> : null}
      <Button title={busy ? 'Saving…' : 'I agree'} onPress={agree} disabled={busy} />
      <Button kind="plain" title="Not now (sign out)" onPress={signOut} />
    </Screen>
  );
}
