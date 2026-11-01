# 0045 — Your records on Today

Date: 1 Nov 2026 · Founder: a section under Body, Mind and Soul with achievements, records and peaks, found by looking at all activity.

## Decision
- Personal bests from the person's own days (`src/lib/records.ts`): best day (needs 7 earlier days), best finished week (needs 2 earlier weeks; a week counts with 4+ days of data), best finished month (2 earlier months; 10+ days), longest streak (3+ days). Metrics: well-being, steps, active minutes, food score, sleep score, breathing minutes, to-dos, gratitude.
- NEW for 7 days after the period ends; new records first, then the most recent. "Close to a record" when today is within 25 % of the best day (steps, breathing).
- The card fills the free height above Ask Myra and shows as many rows as fit (founder: together with Ask Myra it completes the screen).
- Runs on the phone, offline. Only on today's Today.
