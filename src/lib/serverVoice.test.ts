import { describe, expect, it, vi } from 'vitest';
vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: async () => null, setItem: async () => {} } }));
vi.mock('./supabase', () => ({ supabase: null }));
vi.mock('./native', () => ({ optional: () => null }));

describe('server voice', () => {
  it('splits lines into the sentences that are spoken one by one', async () => {
    const { sentences } = await import('./serverVoice');
    expect(sentences('Breathe in slowly. Hold… And out!')).toEqual(['Breathe in slowly.', 'Hold…', 'And out!']);
    expect(sentences('धीरे से साँस लीजिए। छोड़िए।')).toEqual(['धीरे से साँस लीजिए।', 'छोड़िए।']);
  });
  it('falls back to the phone voice on builds without the audio player', async () => {
    const { serverVoiceFor } = await import('./serverVoice');
    expect(serverVoiceFor('gu')).toBe(false);
  });
});
