# 0049 · Meditation card and the 10-day Dhamma path

Date: 5 Nov 2026 · Founder: "Go both" (designs shown 31 Oct and 3 Nov 2026)

## Meditation card
- **What do you want help with?** Focus, Calm, Sleep, Energy, Let go of anger, Steady mind. Myra recommends one practice
  (`src/lib/medAims.ts`): Focus → Anulom Vilom, box, Bhramari; Calm → Bhramari, Ujjayi, Myra's mix; Sleep → Yoga Nidra,
  Bhramari; Energy → Bhastrika, Kapalbhati (Ujjayi otherwise); Anger → Sheetali, Bhramari; Steady mind → box, Udgeeth.
  Buttons "Start · guided" and "On my own"; "Also good for…" switches to another practice.
- Energising breaths (Bhastrika, Kapalbhati) are never recommended after 6 pm or on the gentle Dhamma path.
- **Choose your way:** Dhamma path · Guided · On my own. Length and voice language fold away under "Length and voice".
- Scoring is unchanged: minutes sat count toward Meditation (30 points at the daily target).

## Dhamma path (`src/lib/dhamma.ts`, `src/lib/dhammaScript.ts`, `src/app/sit.tsx`)
- First time: two safety questions (panic, trauma or serious low moods; medicine for the mind). Any yes → gentle path:
  sittings at most 10 minutes and a suggestion to speak with a doctor first.
- One step a day, in order, no skipping; a missed day just continues. Days 1–3 breath at the nostrils (10, 12, 15 min),
  Days 4–9 the body part by part (15 → 30 min), Day 10 kindness (15 min). Today's promise: no harm, lies, stealing,
  misconduct, intoxicants.
- After sitting: Calm (next day), Restless (same step tomorrow), Uneasy (same step, shorter, eyes open, talk to someone
  you trust). A step counts when at least half the time is sat.
- While the path runs, the card shows only today's step; other practices fold under "Other practices" (paused: one method
  at a time), with "Leave the Dhamma path" (two taps).
- After Day 10: a morning and an evening sitting (15 min) and a pointer to free 10-day courses at dhamma.org.
- Our own words for the voice (English and Hindi built in; other languages translated once). Not called Vipassana, and
  no recordings or texts of any teacher.
- Stored in the day logs (`d.mind.dhamma`), so it syncs with the rest of the day.
