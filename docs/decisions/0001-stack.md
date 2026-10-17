# 0001 — Technology stack

Date: 17 October 2026 · Decided by: founder, with Claude

## Decision
- **Phone app:** React Native with Expo (SDK 58), TypeScript, Expo Router.
- **Backend:** Supabase (database, sign-in, row-level security, file storage, edge functions), Mumbai region.
- **AI:** Claude API, called only from Supabase edge functions so the key never sits on a phone.
- **Bundled knowledge:** IFCT 2017, Bhagavad Gita (Sanskrit + transliteration), Free Exercise DB.

## Why
- The company is run by one person with AI help, so we pick tools that need almost no servers to look after.
- One codebase gives both iPhone and Android.
- HealthKit and Health Connect both work with Expo development builds.
- Keeping data in India supports the Digital Personal Data Protection Act, 2023.

## Consequences
- Apple Developer and Google Play accounts are needed before testing on real phones with health data.
- Expo Go cannot load HealthKit or Health Connect, so Milestone 3 uses a development build made with EAS.
