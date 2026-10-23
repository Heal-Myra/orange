import { describe, expect, it } from 'vitest';
import { decodeGuide, encodeGuide, iconFor, scenes, type Guide } from './cookGuide';

const g: Guide = { d: 'मूंग दाल चीला', p: '2 चीले', n: 2, i: [['मूंग दाल', '1 कप'], ['अदरक', '1 इंच']],
  s: ['दाल को अदरक के साथ पीस लें।', 'तवे को गरम करें और घोल फैलाएँ।', 'दोनों तरफ़ से सुनहरा सेंकें।'], l: 'hi', t: ['सामग्री', 'चरण', 'में से', 'तैयार! आनंद लें।'] };

describe('cooking guide', () => {
  it('travels inside a link and comes back the same, in any script', () => {
    const r = encodeGuide(g);
    expect(r).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeGuide(r)).toEqual(g);
    expect(decodeGuide('not-a-guide!')).toBeNull();
  });
  it('lasts about one minute', () => {
    const total = scenes({ ...g, s: ['Soak the dal for four hours.', 'Grind it smooth with ginger and chilli.', 'Heat the tawa and spread a ladle of batter.', 'Cook both sides until golden.', 'Serve hot with chutney.'] })
      .reduce((t, x) => t + x.seconds, 0);
    expect(total).toBeGreaterThanOrEqual(50);
    expect(total).toBeLessThanOrEqual(70);
  });
  it('picks a simple picture for each step', () => {
    expect(iconFor('Heat the tawa')).toBe('flame-outline');
    expect(iconFor('Chop the onion')).toBe('cut-outline');
  });
});
