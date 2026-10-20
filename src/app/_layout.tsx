import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AmiriQuran_400Regular, useFonts } from '@expo-google-fonts/amiri-quran';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/auth';
import { HealProvider, useHeal } from '../lib/store';
import { TasksProvider } from '../lib/tasks';
import { HealthProvider } from '../components/HealthSync';
import { LangProvider, tr, useLang } from '../lib/i18n';
import { colors } from '../theme';

/** Sends people to sign-in or the privacy screen when they need it. */
function Gate() {
  const { ready, online, session, guest, consented, tradition, traditionReady } = useAuth();
  const langState = useLang();
  const { meAsked, sync } = useHeal();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !langState.ready) return;
    const here = segments[0] as string | undefined;
    // First of all: the language (founder, 20 Oct 2026).
    if (!langState.chosen) { if (here !== 'language') router.replace('/language'); return; }
    const needsSignIn = online && !session && !guest;
    const needsConsent = !!session && !consented;
    // Asked once after sign-up (optional: "Prefer not to say"); changeable later in Profile.
    const needsTradition = !needsSignIn && !needsConsent && traditionReady && tradition === null;
    if (needsSignIn && here !== 'sign-in') router.replace('/sign-in');
    else if (!needsSignIn && needsConsent && here !== 'consent') router.replace('/consent');
    else if (needsTradition && here !== 'tradition') router.replace('/tradition');
    // Then "About you" once (skippable), after the account has loaded so a new phone doesn't ask again.
    else if (!needsSignIn && !needsConsent && !needsTradition && session && meAsked === false && sync !== 'syncing' && here !== 'about-you' && here !== 'tradition') router.replace('/about-you');
    else if (!needsSignIn && !needsConsent && !needsTradition && (here === 'sign-in' || here === 'consent')) router.replace('/');
  }, [ready, online, session, guest, consented, tradition, traditionReady, segments, router, langState.ready, langState.chosen, meAsked, sync]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="language" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="tradition" options={{ headerShown: true, title: tr('Daily Wisdom'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="about-you" options={{ headerShown: true, title: tr('About you'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="account" options={{ headerShown: true, title: tr('Profile'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: tr('Admin'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="feedback" options={{ headerShown: true, title: tr('Send feedback'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="library" options={{ headerShown: true, title: tr('Library'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="myra" options={{ headerShown: true, title: tr('Myra'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Amiri Quran (OFL) draws the Qur'anic marks that phones' built-in Arabic fonts cannot. Loads in the background.
  useFonts({ AmiriQuran_400Regular });
  return (
    <LangProvider>
    <AuthProvider>
      <HealProvider>
        <HealthProvider>
        <TasksProvider>
          <StatusBar style="dark" />
          <Gate />
        </TasksProvider>
        </HealthProvider>
      </HealProvider>
    </AuthProvider>
    </LangProvider>
  );
}
