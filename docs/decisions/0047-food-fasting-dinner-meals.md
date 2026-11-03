# 0047 — Food: fasting 20 %, early dinner 20 %, meals 60 %, graded penalty up to 10 %

Date: 3 Nov 2026 · Founder: "20 % towards intermittent fasting, 20 % towards time of dinner which shall be 3 hours before you went to bed, 60 % towards quality and quantity … negative scoring if calories from fat or carbs are higher than recommended … at max 10 % … graded."

## Decision (Food is still 40 points)
- Fasting 8: hours from the last meal of the day before (its logged time, else the usual last meal) to today's first meal (or now), divided by the target: the person's own fast (About you, or read from their words), else 14 hours. Everyone, not only people who fast by choice.
- Early dinner 8: the gap between that last meal and falling asleep (Apple Health's first asleep sample; else the usual bedtime from their day; else 22:30). Full at 3 h or more, linear to nothing at 1 h.
- Meals 24: 0.6 × the existing 40-point meal score (calories 16, protein 12, fibre 8, fat 4).
- Penalty up to 4: carbs' and fat's share of the day's calories above the aim (fat 25 %; carbs = the rest after protein, fat and fibre), each graded 0–4 over 0–15 percentage points, summed and capped at 4.
- A declared fasting day still scores 40. Applies from 3 Nov 2026 (`FOOD_V3_FROM`); earlier days keep their scores. Code: `foodV3` in `src/lib/fasting.ts`.
