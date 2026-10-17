// Free Exercise DB (public domain, Unlicense): 876 exercises with instructions.

import raw from '../../assets/data/exercises.json';

export interface Exercise {
  name: string;
  category: string;
  level: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

type Row = [string, string, string, string | null, string[], string[], string[], string | null, string | null];

export const exercises: Exercise[] = (raw as unknown as Row[]).map(r => ({
  name: r[0], category: r[1] ?? '', level: r[2] ?? '', equipment: r[3] ?? 'none',
  primaryMuscles: r[4], secondaryMuscles: r[5], instructions: r[6],
}));

export function searchExercises(query: string, limit = 40): Exercise[] {
  const q = query.toLowerCase().trim();
  const list = q
    ? exercises.filter(e => e.name.toLowerCase().includes(q) || e.primaryMuscles.join(' ').includes(q) || e.category.includes(q))
    : exercises;
  return list.slice(0, limit);
}
