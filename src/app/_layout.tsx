import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HealProvider } from '../lib/store';

export default function RootLayout() {
  return (
    <HealProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </HealProvider>
  );
}
