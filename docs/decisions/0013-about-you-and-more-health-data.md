# 0013 — "About you" targets and more Apple Health data

Date: 21 October 2026 · Decided by: founder

## Decision
1. **About you** is asked once after sign-up (after Daily Wisdom; skippable) and can be changed in Profile:
   weight, height, sex (male, female, prefer not to say), age, and a goal (lose, keep or gain; how many kg; by when).
   It sets the daily targets (food kcal, protein, steps, active minutes) and Myra steers her suggestions toward the goal.
2. **More Apple Health data**: weight and body fat (e.g. a Withings scale sharing into Apple Health), resting heart rate,
   heart rate variability, VO2 max, active energy, mindful minutes, workouts and sleep stages, besides steps, exercise
   minutes and sleep. Read-only. A new weight from the scale updates "About you" and the targets automatically.

## How targets are set (src/lib/targets.ts, tested in targets.test.ts)
- Energy need: Mifflin-St Jeor resting energy × 1.4 (lightly active). "Prefer not to say" uses the midpoint formula.
- Loss: 7,700 kcal per kg; pace capped at 0.75 kg a week; food never below 1,200 kcal (women) / 1,500 kcal (men)
  or below resting energy. If the person's pace is faster, Myra plans a gentler one and says so. Gain: at most 0.5 kg a week.
- Protein: 1.2 g/kg (1.4 when losing), using a healthy reference weight when BMI is over 30.
- Under 18: healthy habits only, no weight goal. The screen says it is not medical advice and to check with a doctor
  for health conditions, pregnancy or regular medicines.

## Privacy
Stored in the person's own `profiles.about` (migration 0007) under the existing "own profile" policy; never in the
sign-in token. Mindful minutes from Apple Health count as meditation (the larger of app and Health, never both).

## Also
Myra's auto-refresh fingerprint now ignores small changes (steps in 3,000s, active minutes in 20s, no heart readings),
because constant step updates were refreshing her every 20 minutes and using up the day's AI requests.
