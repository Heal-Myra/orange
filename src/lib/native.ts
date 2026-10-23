// Which phone features the installed iPhone build actually has (founder, 23 Oct 2026: the app crashed on build 6
// after quick updates that use features from later builds). Quick updates reach every build, so code that needs a
// newer build's feature checks here first and never even loads it when it is missing.
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

const cache: Record<string, boolean> = {};
export function hasNative(...names: string[]): boolean {
  if (Platform.OS === 'web') return false;
  return names.every(n => {
    if (cache[n] == null) { try { cache[n] = requireOptionalNativeModule(n) != null; } catch { cache[n] = false; } }
    return cache[n];
  });
}

/** Load a library only when the build has its phone part; otherwise null. */
export function optional<T>(names: string[], load: () => T): T | null {
  if (!hasNative(...names)) return null;
  try { return load(); } catch { return null; }
}
