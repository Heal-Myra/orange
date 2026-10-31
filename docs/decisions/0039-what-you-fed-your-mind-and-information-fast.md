# 0039 — What you fed your mind, and the information fast
Date: 31 October 2026 · Status: built, waiting for the founder's go on the picture

Founder: like a meal photo shows fat and calories, Myra should show the feelings in what a person watched (love, hate,
fear, hope…; Harari's "information diet"), automatically; and an information-fasting button that blocks everything for a time.

**What iPhone allows.** No app can read another app's feed or watch history (Instagram, Facebook, YouTube). So:
- **Feelings mix (estimate, automatic):** each app's minutes from the Screen Time reading, by the usual feelings of its kind
  of content (`CATEGORY_MIX` in `src/lib/feelings.ts`, tested), plus every post or video **shared to Happy Orange**, which Myra
  reads for its own feelings (heal-ai `learn_link` now returns `feelings`; counted as 10 minutes each). Shown in Phone activity
  as rings of the five biggest feelings, with the share that is nourishing (100 − fear − anger) in the middle. Not scored.
- **Information fast:** 1 h, 2 h, 4 h or until tomorrow 6 am; Myra stops suggesting the phone, a reminder marks the end, and the
  card points to iPhone Focus for blocking. Real blocking and automatic minutes (no screenshot) need Apple's Family Controls
  permission: application started 31 Oct (founder fills the form 1 Nov).
- **Later:** YouTube history from a scheduled Google Takeout export to Drive (needs Google's Drive access review).
