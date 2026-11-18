import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: null }));
vi.mock('react-native', () => ({ AppState: { addEventListener: () => ({ remove() {} }) }, Linking: { addEventListener: () => ({ remove() {} }), openURL: async () => {} } }));
import { applyJournal, pending, suggestions, type FromDay } from './neosapien';
import { emptyDay } from './types';

const f: FromDay = { date: '2026-11-05', fetchedAt: '', journal: { thankful: ['Vikas, for the vehicle', 'Sapna, honest feedback'], laugh: 'Jitendra at lunch', kind: null, best: 'Team agreed the plan' },
  todos: [{ title: 'Call Jitendra about the vehicle', area: 'work' }], decided: { 'thankful.1': 'no' } };

describe('NeoSapien suggestions (decision 0050)', () => {
  it('lists every suggestion with a key, and only undecided ones as pending', () => {
    expect(suggestions(f).map(s => s.key)).toEqual(['thankful.0', 'thankful.1', 'laugh', 'best', 'todo.0']);
    expect(pending(f).map(s => s.key)).toEqual(['thankful.0', 'laugh', 'best', 'todo.0']);
  });
  it('fills only empty boxes; your own words are never replaced', () => {
    const d = emptyDay('2026-11-05');
    d.soul = { gratitude: ['Mum', '', ''], laugh: 'My own laugh' };
    applyJournal(d, 'thankful', 'Vikas'); applyJournal(d, 'laugh', 'Jitendra'); applyJournal(d, 'kind', 'Mithul');
    expect(d.soul.gratitude).toEqual(['Mum', 'Vikas', '']);
    expect(d.soul.laugh).toBe('My own laugh');
    expect(d.love?.kindTo).toBe('Mithul');
  });
});

import { extras } from './neosapien';
describe('NeoSapien fills the day (decision 0060)', () => {
  it('lists meals, fast, lived lines and numbers not yet added', () => {
    const f = { date: '2026-11-18', fetchedAt: '', meals: [{ when: 'lunch' as const, text: 'dal rice', at: '13:10' }], fasting: true as const,
      lived: { gita: 'Stayed calm in the review', tao: null }, measure: { waist: 88, hips: null }, fitness: null, decided: { fasting: 'yes' as const } };
    expect(extras(f).map(x => x.key)).toEqual(['meal.0', 'lived.gita', 'measure']);
    expect(extras(undefined)).toEqual([]);
  });
});
