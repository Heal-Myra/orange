# Changelog

## 0.2.0 — 17 October 2026 (Milestone 2: Accounts and online saving)
- Sign in with a 6-digit email code; option to use the app without an account.
- Privacy consent screen after first sign-in (DPDP Act, 2023).
- Entries and targets save to the person's own rows in Supabase (Mumbai) and on the device; offline-first.
- Account screen (person icon on Today): sign out, see where data is saved, delete my data.
- EAS Workflow: every push to main runs tests and deploys the web version to EAS Hosting.

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
