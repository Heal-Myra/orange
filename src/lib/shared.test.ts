import { describe, expect, it } from 'vitest';
import { firstUrl } from './shared';

describe('shared links', () => {
  it('finds the link inside shared text', () => {
    expect(firstUrl('Watch this: https://youtu.be/abc123.')).toBe('https://youtu.be/abc123');
    expect(firstUrl('no link here')).toBeNull();
  });
});
