# Changelog

## 0.4.0 — 18 October 2026 (Tao Te Ching week)
- New weekly practice inspired by the Tao Te Ching (written by the founder): a different practice each day, with a private note and a tick.
  Mind days: Mon observation, Tue breathing, Thu listening, Fri emptiness, Sun "Who knows?". Soul days: Wed antidote, Sat letting go of a dry leaf.
  The card appears on the Mind or Soul tab; doing it adds 10 points to that pillar (capped at 100). Sunday shows the end-of-week review with Monday's note.
- Library: new **Tao** section with the core teaching (returning and gentleness), the whole week, the end-of-week review and "when a door will not open".
- AI guidance now knows today's Tao practice and can suggest it.

## 0.3.2 — 18 October 2026
- The app is now called **Happy Orange** everywhere people see it (sign-in, Today, consent, account, camera/photo permissions, AI guide). Web address stays project-heal.expo.app for now.
- Removed the old "paste the sign-in link" box; sign-in is by the 6-digit code only.
- New home: https://app.happyorange.in (Cloudflare Pages). See docs/decisions/0006-web-hosting.md.
- Fix: "Sign in to save online" on the Account screen did nothing for people who had chosen "Use without an account" (the app sent them straight back to Today).
- Clearer message when the hourly limit on sign-in emails is reached.
- Sign-in emails now come from Happy Orange <hello@happyorange.in> (Resend) and contain a 6-digit code; the sign-in screen asks for the code. See docs/decisions/0005-email-sending.md.

## 0.3.1 — 17 October 2026
- Sign-in by pasting the email link, for the iPhone home-screen app (which cannot receive tapped email links).
- Short meal names from photos; meal list shows IFCT vs estimate.

## 0.3.0 — 17 October 2026 (Milestone 4 begins: AI features, not yet switched on)
- Server function `heal-ai` (Supabase, Mumbai) with five AI features: meal photo to macros grounded in IFCT 2017,
  daily guidance, Gita verse explanation in English or Hindi, social-media content classifier, dharma reflection.
- Works with Claude or Google Gemini (one setting); daily cap and tester allow-list built in.
- App: "Snap a meal" on Body (every number editable before adding), guidance on Today, Explain + Reflect on Soul,
  "Pick the category for me" on Mind. All AI needs sign-in.
- Deploy job for the function in the EAS workflow; new table `ai_requests` for the daily cap.
- Switched on 17 Oct 2026: provider Claude (paid API), secrets set in Supabase, `ai_requests` created, deploy token in Expo.
- Consent screen names Anthropic as the AI processor.
- Verified on the founder's iPhone, 17 Oct: Gita explanation and meal photo (roti, dal, sabzi) work.
- Meal names from photos kept short; meal list shows whether numbers came from IFCT or an estimate.

## 0.2.0 — 17 October 2026 (Milestone 2: Accounts and online saving)
- Sign in with an email link (or a 6-digit code where the email shows one); option to use the app without an account.
- Privacy consent screen after first sign-in (DPDP Act, 2023).
- Entries and targets save to the person's own rows in Supabase (Mumbai) and on the device; offline-first.
- Account screen (person icon on Today): sign out, see where data is saved, delete my data.
- EAS Workflow: every push to main runs tests and deploys the web version to EAS Hosting (https://project-heal.expo.app).
- Verified by the founder on iPhone, 17 Oct 2026: email-link sign-in, consent, and saving to Supabase (Mumbai).
- Account page shows the exact error if saving fails, and has a Back button (needed after a page reload).

## 0.1.1 — 17 October 2026
- Linked to the Expo project (owner healmyra, project ID 354c8819-…).
- Added EAS build profiles (`eas.json`) for development, preview and production builds.
- Added web support and a web preview published as a Claude artifact, so the founder can try the app on an iPhone before the Apple Developer account exists.

## 0.1.0 — 17 October 2026 (Milestone 1: Foundations)
- New Expo app (SDK 58) with five tabs: Today, Body, Mind, Soul, Library.
- Scoring engine for Body, Mind and Soul with 14 automated tests.
- Body: steps, active minutes, sleep, sleep quality, meals; add foods from IFCT 2017 by grams.
- Mind: meditation minutes, attention and learning practices, social-media content diet.
- Soul: Gita verse of the day (Sanskrit + transliteration) and eight practices led by truthfulness and fairness.
- Library: IFCT 2017 nutrient lookup, all 18 Gita chapters, 876-exercise library.
- Saves on the phone. Database design for Supabase prepared (`supabase/migrations/0001_init.sql`).
