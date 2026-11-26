# 0067 — Food and your body

Date: 26 Nov 2026 · Decided by: founder ("Go" on the picture)

## Decision
Like Oura's Daytime Stress (activity on the stress line), Happy Orange pins meal photos on the day's heart-rate line, so people see what a meal did and want to snap the next one. Reached from the Food card ("Food and your body") on Body. The Food master owns it.

## How
- Heart rate and steps in 15-minute slots from Apple Health, from any source: the Oura ring (when its Heart rate sharing to Apple Health is on) or a Watch (`readDaySeries`, `health.hr15/steps15`, today and yesterday on each sync).
- `src/lib/mealEcho.ts`: meals grouped by logged time; after a meal, the next three hours' heart rate (slots with little walking) against the median of the same hours on up to 14 earlier days (at least 5); for an evening meal, that night's deep sleep against the usual. Patterns over four weeks (dinner before or after 8 pm against the night's sleep score; dinners of 700 kcal and more against deep sleep), told only with at least 5 days each side and a gap worth telling.
- Levels on the line are relative to the person's resting heart rate (Calm, Steady, Busy, Working hard), not Oura's stress score, which Oura does not appear to share with Apple Health.
- Meal thumbnails (120 px) stay on the phone only (`mealThumbs.ts`).
- Wording is always "goes together", never "causes" (Orange Book: no medical claims).

## Later
Oura's own stress minutes via the Oura API (OAuth; 10 users before Oura's approval).
