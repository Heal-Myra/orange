# 0044 — Fasting by choice earns Food points

Date: 1 Nov 2026 · Founder: someone fasting intermittently was scoring below someone eating; the system should know the habit and give points for the hours without food.

## Decision
- The habit (hours, usual last meal) comes from: About you → "Fasting by choice" (set by hand, wins); else the person's own words (usual day, goal, food preferences: "intermittent fasting 18 hours", "16:8", "skip breakfast"); else Myra asks once after three days whose first meal was at 11 am or later. "No, I just forget" turns it off.
- Food (40) for them = Fasting 16 × (hours fasted ÷ target, at most 1) + 0.6 × the usual meal score (24). Hours run from the last meal of the day before (its logged time, else the usual last meal) to the first meal today (or now). Declared full-day fasts still score 40.
- Meals keep the time they were logged (`Meal.at`); the day's last one sets the next day's `fastFrom`.
- Myra: no meal nudges while a fast is under its target; her AI context says how far along the fast is.
- Applies from 1 Nov 2026 (`FAST_FROM`); earlier days keep their scores. Code: `src/lib/fasting.ts`.
