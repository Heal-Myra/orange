import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AmiriQuran_400Regular, useFonts } from '@expo-google-fonts/amiri-quran';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { HealProvider, useHeal } from '../lib/store';
import { TasksProvider } from '../lib/tasks';
import { HealthProvider, useHealth } from '../components/HealthSync';
import { ReminderScheduler } from '../components/Reminders';
import { ShareProvider, ShareReceiver } from '../components/ShareReceiver';
import { RangeProvider } from '../lib/range';
import { UpdateWatcher } from '../components/UpdateWatcher';
import { LangProvider, tr, useLang } from '../lib/i18n';
import { colors } from '../theme';

/** Sends people to sign-in or the privacy screen when they need it. */
function Gate() {
  const { ready, online, session, consented, tradition, traditionReady } = useAuth();
  const langState = useLang();
  const { meAsked, sync } = useHeal();
  const health = useHealth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !langState.ready) return;
    const here = segments[0] as string | undefined;
    // The cooking guide opens from WhatsApp for anyone, without language choice or sign-in (23 Oct 2026).
    if (here === 'cook') return;
    // First of all: the language (founder, 20 Oct 2026).
    if (!langState.chosen) { if (here !== 'language') router.replace('/language'); return; }
    // Everyone signs in (founder, 25 Oct 2026: no guest mode, so every person gets the full app: food photos, Myra).
    const needsSignIn = online && !session;
    const needsConsent = !!session && !consented;
    // Asked once after sign-up (optional: "Prefer not to say"); changeable later in Profile.
    // Religion (Daily Wisdom) is chosen on About you since 21 Oct 2026; the separate step is no longer forced.
    const needsTradition = false && traditionReady && tradition === null;
    if (needsSignIn && here !== 'sign-in') router.replace('/sign-in');
    else if (!needsSignIn && needsConsent && here !== 'consent') router.replace('/consent');
    else if (needsTradition && here !== 'tradition') router.replace('/tradition');
    // Then "About you" once (name, age, sex, height, weight, religion, goal; skippable), after the account has loaded.
    else if (!needsSignIn && !needsConsent && !needsTradition && session && meAsked === false && sync !== 'syncing' && here !== 'about-you' && here !== 'tradition') router.replace('/about-you');
    // Then Apple Health, once, explained clearly (founder, 25 Oct 2026). Apple requires that saying no is allowed.
    else if (session && meAsked === true && health.available && !health.connected && health.asked === false && here !== 'connect-health' && here !== 'about-you') router.replace('/connect-health');
    else if (!needsSignIn && !needsConsent && !needsTradition && (here === 'sign-in' || here === 'consent')) router.replace('/');
  }, [ready, online, session, consented, tradition, traditionReady, segments, router, langState.ready, langState.chosen, meAsked, sync, health.available, health.connected, health.asked]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="language" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="connect-health" />
      <Stack.Screen name="tradition" options={{ headerShown: true, title: tr('Daily Wisdom'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="about-you" options={{ headerShown: true, title: tr('About you'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="account" options={{ headerShown: true, title: tr('Profile'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: tr('Admin'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="feedback" options={{ headerShown: true, title: tr('Send feedback'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="library" options={{ headerShown: true, title: tr('Library'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="yoga-nidra" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#0F1E22' } }} />
      <Stack.Screen name="cook" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="explain" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#EAF4FA' } }} />
      <Stack.Screen name="breathe" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#EAF4FA' } }} />
      <Stack.Screen name="shared" options={{ headerShown: true, title: tr('Shared'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
      <Stack.Screen name="myra" options={{ headerShown: true, title: tr('Myra'), presentation: 'modal', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.ink }} />
    </Stack>
  );
}

/**
 * Website / home-screen app: the tab and button icons are drawn with the Ionicons font. If that download fails once
 * (a weak connection when the app wakes up), the browser marks the font as failed and never tries again, so the icons
 * stay blank (founder, 21 Oct 2026). Watch for that and load the font again under a fresh address; the icons then
 * repaint by themselves.
 */
function useIconFontGuard(): number {
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !document.fonts) return;
    let stopped = false, tries = 0, healed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The font's address, read from the @font-face rule the icon library added to the page.
    const fontUri = (): string | null => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const r of Array.from(rules)) {
          if (r instanceof CSSFontFaceRule && r.style.getPropertyValue('font-family').replace(/["']/g, '') === 'ionicons') {
            const m = r.style.getPropertyValue('src').match(/url\(["']?([^"')]+)["']?\)/);
            if (m) return m[1];
          }
        }
      }
      return null;
    };
    const broken = () => {
      if (healed) return false;
      const faces = [...(document.fonts as unknown as Iterable<FontFace>)].filter(f => f.family.replace(/["']/g, '') === 'ionicons');
      // After a failed download the face reads 'error' (Safari) or falls back to 'unloaded' (Chrome).
      return faces.length > 0 && !faces.some(f => f.status === 'loaded' || f.status === 'loading');
    };
    const heal = async () => {
      const uri = fontUri();
      if (stopped || !uri || !broken()) return;
      tries++;
      try {
        const face = new FontFace('ionicons', `url("${uri}${uri.includes('?') ? '&' : '?'}retry=${Date.now()}")`);
        await face.load();
        document.fonts.add(face);
        healed = true;
        setGeneration(g => g + 1); // the icon library gave up on the first try: draw the icons again
      } catch {
        if (tries < 30) timer = setTimeout(heal, 4000);
      }
    };
    // Check soon after start, and whenever the app comes back to the front or the connection returns.
    timer = setTimeout(function check() { if (broken()) heal(); else if (!healed && !stopped) timer = setTimeout(check, 3000); }, 3000);
    const again = () => { if (document.visibilityState === 'visible') heal(); };
    document.addEventListener('visibilitychange', again);
    window.addEventListener('online', again);
    return () => { stopped = true; if (timer) clearTimeout(timer); document.removeEventListener('visibilitychange', again); window.removeEventListener('online', again); };
  }, []);
  return generation;
}

/** If a screen hits an error, show a calm page with "Try again" instead of the app closing (founder, 23 Oct 2026). */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 28, gap: 14 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.ink }}>{tr('Something went wrong.')}</Text>
      <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22 }}>{tr('Your data is safe. Tap Try again; if it happens again, send Myra\'s team a screenshot of this page.')}</Text>
      <Text style={{ fontSize: 12, color: colors.muted }} selectable>{String(error?.message ?? error).slice(0, 300)}</Text>
      <Pressable onPress={() => { retry().catch(() => {}); }} accessibilityRole="button"
        style={{ backgroundColor: colors.accent, borderRadius: 99, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: colors.onAccent, fontSize: 16, fontWeight: '700' }}>{tr('Try again')}</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  // Amiri Quran (OFL) draws the Qur'anic marks that phones' built-in Arabic fonts cannot. Loads in the background.
  useFonts({ AmiriQuran_400Regular });
  const iconGeneration = useIconFontGuard();
  return (
    <ShareProvider>
    <LangProvider>
    <RangeProvider>
    <AuthProvider>
      <HealProvider>
        <HealthProvider>
        <TasksProvider>
          <StatusBar style="dark" />
          <Gate key={iconGeneration} />
          <ReminderScheduler />
          <ShareReceiver />
          <UpdateWatcher />
        </TasksProvider>
        </HealthProvider>
      </HealProvider>
    </AuthProvider>
    </RangeProvider>
    </LangProvider>
    </ShareProvider>
  );
}
