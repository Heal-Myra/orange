// Personal daily targets from "About you" (founder, 20 Oct 2026): weight, height, sex, age and a weight goal.
// Myra uses them to tailor food and movement. Kept deliberately gentle and evidence-aware:
// - Energy need: Mifflin-St Jeor resting energy × 1.4 (lightly active), the most widely used estimate.
// - Weight loss: about 7,700 kcal per kg of body fat; pace capped at 0.75 kg a week (about 0.5–1% of body weight),
//   and food never planned below 1,200 kcal (women) / 1,500 kcal (men), or below resting energy.
// - Weight gain: at most 0.5 kg a week.
// - Protein: 1.2 g per kg (1.4 when losing, to protect muscle), using a healthy reference weight when BMI is over 30.
// Not medical advice: the screen says so, and people under 18 get habits only, no weight goal.

export type Sex = 'male' | 'female' | 'other';
export type Goal = 'lose' | 'keep' | 'gain';

export interface AboutMe {
  name?: string;
  goalText?: string;  // the goal in the person's own words (founder, 21 Oct 2026); Myra reads it into the fields below
  aims?: string;      // the non-weight part of the goal, e.g. "run 5 km", "sleep better"
  goalNote?: string;  // Myra's one-line reply about the goal (e.g. that it is too steep and what she planned instead)
  foodPrefs?: string;
  guideLang?: string; // language of guided sessions (en, hi or a regional code; 24 Oct 2026)
  saved?: { url: string; title: string; note?: string; at: string }[]; // shared to Happy Orange: "Save to my journey" (24 Oct 2026)
  party?: { what?: string; when?: string; who?: string; plan?: string }; // a party being planned (24 Oct 2026)
  meditationGoal?: import('./meditationPlan').MeditationGoal; // grow guided sessions gradually (24 Oct 2026)
  habits?: import('./habits').Habit[]; // repeating to-dos (23 Oct 2026), kept with About you so they sync
  planLang?: string;  // language for the WhatsApp food message (23 Oct 2026) // food preferences in their own words, for meal plans (23 Oct 2026)
  dayText?: string;   // the usual day in the person's own words (22 Oct 2026)
  routine?: import('./routine').RoutineItem[]; // Myra's reading of it (src/lib/routine.ts)
  weightKg: number;
  heightCm: number;
  sex: Sex;
  age: number;
  goal: Goal;
  goalKg?: number;    // how many kg to lose or gain
  goalWeeks?: number; // in how many weeks
  setAt: string;      // ISO date the goal was set
}

export interface Plan {
  kcal: number;
  protein: number;
  steps: number;
  active: number;
  bmi: number;
  weeklyKg: number;    // planned change per week (negative = loss)
  weeks: number;       // weeks the plan will take at the planned pace
  slowedDown: boolean; // the person's pace was faster than safe, so Myra planned a gentler one
  adult: boolean;
}

export const MAX_LOSS_PER_WEEK = 0.75;
export const MAX_GAIN_PER_WEEK = 0.5;
const KCAL_PER_KG = 7700;
const round = (n: number, to: number) => Math.round(n / to) * to;

export const bmiOf = (weightKg: number, heightCm: number) => weightKg / Math.pow(heightCm / 100, 2);

/** Resting energy (Mifflin-St Jeor). "other" uses the midpoint of the male and female formulas. */
export function restingKcal(m: Pick<AboutMe, 'weightKg' | 'heightCm' | 'age' | 'sex'>) {
  const base = 10 * m.weightKg + 6.25 * m.heightCm - 5 * m.age;
  return base + (m.sex === 'male' ? 5 : m.sex === 'female' ? -161 : -78);
}

export function planFor(m: AboutMe): Plan {
  const adult = m.age >= 18;
  const bmi = bmiOf(m.weightKg, m.heightCm);
  const rest = restingKcal(m);
  const need = rest * 1.4;
  const floor = Math.max(rest, m.sex === 'male' ? 1500 : 1200);

  const goal: Goal = adult ? m.goal : 'keep';
  const kg = Math.max(0, m.goalKg ?? 0);
  const asked = Math.max(1, m.goalWeeks ?? 12);
  let weeklyKg = 0, weeks = 0, slowedDown = false;
  if (goal !== 'keep' && kg > 0) {
    const cap = goal === 'lose' ? MAX_LOSS_PER_WEEK : MAX_GAIN_PER_WEEK;
    const wanted = kg / asked;
    const pace = Math.min(wanted, cap);
    slowedDown = wanted > cap + 1e-9;
    weeklyKg = goal === 'lose' ? -pace : pace;
    weeks = Math.ceil(kg / pace);
  }
  let kcal = need + (weeklyKg * KCAL_PER_KG) / 7;
  if (goal === 'lose' && kcal < floor) {
    // The floor wins over speed: recompute the real pace at the floor.
    kcal = floor;
    const pace = ((need - floor) * 7) / KCAL_PER_KG;
    if (pace > 0) { slowedDown = slowedDown || pace < -weeklyKg; weeklyKg = -pace; weeks = Math.ceil(kg / pace); }
    else { weeklyKg = 0; weeks = 0; slowedDown = true; }
  }

  const refWeight = bmi > 30 ? 27 * Math.pow(m.heightCm / 100, 2) : m.weightKg;
  const protein = refWeight * (goal === 'lose' ? 1.4 : 1.2);

  return {
    kcal: round(kcal, 50),
    protein: round(protein, 5),
    steps: goal === 'lose' ? 10000 : 8000,
    active: goal === 'lose' ? 40 : 30,
    bmi: Math.round(bmi * 10) / 10,
    weeklyKg: Math.round(weeklyKg * 100) / 100,
    weeks,
    slowedDown,
    adult,
  };
}

/** One line for Myra's context. */
export function aboutLine(m: AboutMe | undefined): string {
  if (!m) return 'About: not given.';
  const p = planFor(m);
  const goal = !p.adult ? 'no weight goal (under 18: healthy habits only)'
    : m.goal === 'keep' || !m.goalKg ? 'keep current weight'
    : `${m.goal} ${m.goalKg} kg (asked: in ${m.goalWeeks ?? '?'} weeks; planned pace ${Math.abs(p.weeklyKg)} kg/week, about ${p.weeks} weeks${p.slowedDown ? ', slowed down for safety' : ''})`;
  const own = m.goalText ? ` In their words: "${m.goalText}".${m.aims ? ` Other aims: ${m.aims}.` : ''}` : '';
  return `About: ${m.name ? `${m.name}, ` : ''}${m.age} y, ${m.sex}, ${m.heightCm} cm, ${m.weightKg} kg (BMI ${p.bmi}). Goal: ${goal}. Daily targets: ${p.kcal} kcal, protein ${p.protein} g, ${p.steps} steps, ${p.active} active min.${own}`;
}

/** A quick reading of a goal written in plain words, used when Myra (the AI) can't be reached.
 *  "lose 5 kg in 3 months", "gain 4kg by March", "reduce 10 kg" → goal, kg and weeks. */
export function parseGoal(text: string, today = new Date()): Pick<AboutMe, 'goal' | 'goalKg' | 'goalWeeks'> {
  const t = text.toLowerCase();
  const kgMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilo|kilos|kilograms?)/);
  const kg = kgMatch ? parseFloat(kgMatch[1].replace(',', '.')) : undefined;
  const lose = /lose|loss|reduce|cut|drop|less|slim|ghata|kam/.test(t);
  const gain = /gain|put on|increase|build|bulk|badha/.test(t);
  const goal: Goal = kg && (lose || gain) ? (gain && !lose ? 'gain' : 'lose') : 'keep';
  let weeks: number | undefined;
  const span = t.match(/(\d+)\s*(week|weeks|wk|month|months|year|years)/);
  if (span) { const n = parseInt(span[1], 10); weeks = /month/.test(span[2]) ? Math.round(n * 4.35) : /year/.test(span[2]) ? n * 52 : n; }
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const by = t.match(/by\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (!weeks && by) {
    const m = months.indexOf(by[1]);
    let year = today.getFullYear();
    if (m <= today.getMonth()) year++;
    const end = new Date(year, m + 1, 0);
    weeks = Math.max(1, Math.round((end.getTime() - today.getTime()) / (7 * 24 * 3600 * 1000)));
  }
  return goal === 'keep' ? { goal } : { goal, goalKg: kg, goalWeeks: weeks ?? 13 };
}

/** Daily fibre target: about 14 g per 1,000 kcal, at least 25 g (ICMR-NIN suggests 25–40 g a day for adults). */
export const fibreTarget = (kcal: number) => Math.max(25, Math.round((14 * kcal) / 1000));
