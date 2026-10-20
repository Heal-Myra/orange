import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { HealProvider } from '../lib/store';
import { TasksProvider } from '../lib/tasks';
import { colors } from '../theme';

/** Sends people to sign-in or the privacy screen when they need it. */
function Gate() {
  const { ready, online, session, guest, consented } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const here = segments[0] as string | undefined;
    const needsSignIn = online && !session && !guest;
    const needsConsent = !!session && !consented;
    if (needsSignIn && here !== 'sign-in') router.replace('/sign-in');
    else if (!needsSignIn && needsConsent && here !== 'consent') router.replace('/consent');
    else if (!needsSignIn && !needsConsent && (here === 'sign-in' || here === 'consent')) router.replace('/');
  }, [ready, online, session, guest, consented, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="account" options={{ headerShown: true, title: 'Profile', presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: 'Admin', presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="feedback" options={{ headerShown: true, title: 'Send feedback', presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="library" options={{ headerShown: true, title: 'Library', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="myra" options={{ headerShown: true, title: 'Myra', presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <HealProvider>
        <TasksProvider>
          <StatusBar style="dark" />
          <Gate />
        </TasksProvider>
      </HealProvider>
    </AuthProvider>
  );
}
