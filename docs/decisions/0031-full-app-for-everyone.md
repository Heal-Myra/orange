# 0031 — Everyone signs in and gets the full app

Date: 25 October 2026 · Status: decided (founder)

Founder: "Why do we give options for the user to not have the full experience? Without the food snap this app wouldn't be
that interesting."

- **No guest mode.** "Use without an account" is gone; everyone signs in with the emailed code (`src/app/sign-in.tsx`,
  Gate in `src/app/_layout.tsx`).
- **AI for everyone from the first minute.** `heal-ai` lets every signed-in person use the AI unless an admin turned it off
  for them ("declined"). Daily cap per person unchanged (40). Secret `AI_AUTO_APPROVE=false` restores approval-first.
- **Apple Health asked clearly once,** right after About you (`src/app/connect-health.tsx`), with the reasons and
  "Not now". It cannot be compulsory: Apple requires the app to work if people say no, and iOS never tells an app whether
  reading was refused.
- **Apple's reviewer** cannot receive our emailed code, so `review@happyorange.in` signs in with a fixed 10-digit code
  (server function `review-login`; secrets `REVIEW_CODE`, optional `REVIEW_EMAIL`). The founder chooses the code and
  types it only into Supabase and App Store Connect's "Sign-in information".
