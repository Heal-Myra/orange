import { describe, expect, it } from 'vitest';
import { cleanPlan, planMessage, planTotals, whatsappLink } from './foodPlan';

const raw = { note: 'High protein, light dinner.', meals: [
  { slot: 'dinner', dish: 'Palak paneer with roti', portion: '1 katori, 2 rotis', kcal: 520, protein_g: 26, fibre_g: 9,
    ingredients: [{ item: 'Paneer', qty: '200 g' }, { item: 'Spinach', qty: '1 bunch' }], steps: ['Blanch spinach.', 'Cook with paneer.'] },
  { slot: 'breakfast', dish: 'Moong dal chilla', portion: '2 chillas', kcal: 320, protein_g: 18, fibre_g: 6, ingredients: [], steps: [] },
  { slot: 'brunch', dish: 'Ignored' }, { slot: 'lunch' },
] };

describe('food plan', () => {
  it('keeps only good meals, in the order of the day', () => {
    const p = cleanPlan(raw, '2026-10-24', 2);
    expect(p.meals.map(m => m.slot)).toEqual(['breakfast', 'dinner']);
    expect(planTotals(p)).toEqual({ kcal: 840, protein: 44, fibre: 15 });
  });
  it('writes the WhatsApp message, with a video only when asked', () => {
    const p = cleanPlan(raw, '2026-10-24', 2);
    p.meals[1].video = true;
    const labels = { title: 'Food for Sat 24 Oct', slot: { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' }, ingredients: 'Ingredients', how: 'How to make', video: 'Video (about 1 min)', forPeople: 'For 2 people' };
    const msg = planMessage(p, labels);
    expect(msg).toContain('*Dinner: Palak paneer with roti*');
    expect(msg).toContain('• Paneer – 200 g');
    expect(msg).toContain('2. Cook with paneer.');
    expect(msg.match(/Video/g)?.length).toBe(1);
    expect(whatsappLink('a b')).toBe('https://wa.me/?text=a%20b');
  });
});
