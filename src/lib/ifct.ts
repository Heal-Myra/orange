// Indian Food Composition Tables 2017 (ICMR–National Institute of Nutrition, Hyderabad).
// Bundled with the app. Values are per 100 g edible portion: energy in kJ, every other nutrient in grams.

import raw from '../../assets/data/ifct2017.json';

type Row = (string | number | null)[];
interface IfctFile { source: string; cols: [string, string][]; foods: Row[] }

const data = raw as unknown as IfctFile;
const colIndex: Record<string, number> = {};
data.cols.forEach(([key], i) => { colIndex[key] = 6 + i; });

export interface Food {
  code: string;
  name: string;
  scientificName: string;
  localNames: string;
  group: string;
  row: Row;
}

export const IFCT_SOURCE = data.source;
export const IFCT_COLUMNS = data.cols;

const foods: Food[] = data.foods.map(r => ({
  code: String(r[0]), name: String(r[1]), scientificName: String(r[2] ?? ''),
  localNames: String(r[3] ?? ''), group: String(r[4] ?? ''), row: r,
}));
const hay = foods.map(f => ({ n: f.name.toLowerCase(), l: f.localNames.toLowerCase(), o: (f.scientificName + ' ' + f.group).toLowerCase() }));

export const allFoods = () => foods;
export const foodByCode = (code: string) => foods.find(f => f.code === code);

/** A nutrient value in grams per 100 g (energy in kJ), or null if IFCT has no value. */
export function nutrient(f: Food, key: string): number | null {
  const i = colIndex[key];
  if (i == null) return null;
  const v = f.row[i];
  return typeof v === 'number' ? v : null;
}

export interface Per100g { kcal: number; protein: number; carbs: number; fat: number; fibre: number; energyCalculated: boolean }

export function per100g(f: Food): Per100g {
  const protein = nutrient(f, 'protcnt') ?? 0, carbs = nutrient(f, 'choavldf') ?? 0, fat = nutrient(f, 'fatce') ?? 0;
  const kj = nutrient(f, 'enerc') ?? 0;
  // IFCT leaves energy blank for oils and ghee, so fall back to Atwater factors (4/4/9 kcal per g).
  return {
    kcal: kj ? kj / 4.184 : protein * 4 + carbs * 4 + fat * 9,
    protein, carbs, fat, fibre: nutrient(f, 'fibtg') ?? 0, energyCalculated: !kj,
  };
}

/** Search by English name, regional names, scientific name or food group. */
export function searchFoods(query: string, limit = 20): Food[] {
  const words = query.toLowerCase().split(/[^a-z0-9ऀ-ॿ]+/).filter(w => w.length > 1);
  if (!words.length) return [];
  const scored: [number, Food][] = [];
  foods.forEach((f, i) => {
    const h = hay[i];
    let score = 0, all = true;
    for (const w of words) {
      const m = h.n.includes(w) ? 3 : h.l.includes(w) ? 2 : h.o.includes(w) ? 1 : 0;
      if (!m) all = false;
      score += m;
    }
    if (score) scored.push([score + (all ? 4 : 0) + (h.n.startsWith(words[0]) ? 1 : 0), f]);
  });
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => x[1]);
}

/** Show a gram amount in a readable unit. */
export function formatAmount(grams: number | null): string {
  if (grams == null) return '–';
  if (grams === 0) return '0';
  if (grams >= 1) return `${+grams.toFixed(2)} g`;
  if (grams >= 0.001) return `${+(grams * 1000).toFixed(2)} mg`;
  return `${+(grams * 1e6).toFixed(2)} µg`;
}
