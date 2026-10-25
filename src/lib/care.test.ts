import { describe, expect, it } from 'vitest';
import { careFor, carePlan } from './care';

describe('careFor', () => {
  it('puts each part of a cold plan in its own card', () => {
    const c = carePlan(['cold'])!;
    expect(careFor(c, 'food').lines).toContain('Ginger-tulsi tea with honey');
    expect(careFor(c, 'food').avoid).toContain('Fried, heavy food');
    expect(careFor(c, 'move').lines[0]).toMatch(/walk/);
    expect(careFor(c, 'rest').lines[0]).toMatch(/Sleep early/);
  });
  it('sends breathing warnings to the breathing card', () => {
    const c = carePlan(['cough'])!;
    expect(careFor(c, 'breath').avoid[0]).toMatch(/Kapalbhati/);
    expect(careFor(c, 'food').avoid.join()).not.toMatch(/Kapalbhati/);
  });
});
