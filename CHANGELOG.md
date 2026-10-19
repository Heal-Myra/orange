# Changelog

## 0.5.1 — 19 October 2026 (new look: "Calm Teal" with a Happy Orange coral signature)
- New theme chosen by the founder from three reference apps: white-grey page, white cards with a soft shadow, rounded buttons, calm teal for buttons and ticks; Body leaf green, Mind teal, Soul amber. The marigold background and glass cards are retired.
- Happy Orange's signature coral (#C0513A) marks everything the app itself produces: the Happy Orange name, scores, Today's guidance, AI reads (meal Calculate, Screen Time), verse explanations, reflections, category picks, and Myra. See docs/decisions/0007-colour-system.md.
- Founder's rule: every suggestion is **one line of at most 10 words**. Today's guidance is now a headline plus one line each for Body, Mind and Soul; meal tips, reflections, category reasons, the "live it today" line of verse explanations and Myra's recommendations follow the same rule (AI prompt plus an app-side trim, `oneLine` in src/lib/ai.ts).
- Today's guidance card is now **Myra recommends** (button "Get recommendations").

## 0.5.0 — 19 October 2026 (founder's new layout for Body, Mind and Soul)
- Testing: a feedback box at the top of every tab (Today, Body, Mind, Soul, Library) sends straight to the team with the page name; the feedback card was removed from Profile. "Person icon" is now labelled **Profile** everywhere.
- "Invite a friend to test" (Account → Admin card): opens the phone's share menu with the invitation written, so people are picked from contacts in WhatsApp or Messages.
- Admin panel (Account → Admin, founder only): approve or decline AI access requests and read all feedback. People request AI access automatically on first sign-in; the AI server accepts anyone on AI_ALLOWED_EMAILS or approved in the app (migration 0004: app_admins, ai_access, is_admin()).
- Send feedback: a feedback screen (mood 1–5, which part, message) from the Account screen and from Myra; saved to the new `feedback` table (migration 0003). Deleting my data also deletes my feedback.
- Log a meal: three big buttons, Photo, Speak and Type. Photo opens the camera/photos straight away; Speak listens and works out the meal by itself (Android/Chrome now; on iPhone it comes with the native app, by founder's choice); Type shows the box.
- Fix: on iPhone the in-app Speak button could hang (Safari speech recognition); iPhone now uses the keyboard microphone, and listening always stops after 15 seconds elsewhere.
- Body: "Log a meal" — type or speak what you ate (e.g. "2 rotis, dal, bhindi"), or use a photo; the AI splits it into items and the numbers come from IFCT 2017. Speaking uses the browser's speech recognition where available, otherwise the keyboard microphone.
- Mind: Tao card first; a guided meditation timer (5/10/20 min, breathing cue) that records the minutes actually sat; "Phone activity" reads social-media minutes from a Screen Time screenshot (editable before adding); one "Other activities" card for attention, learning and sessions typed by hand.
- Soul: study the Gita verse of the day (read, open the meaning, write a line, tick studied); thought of the day with your own thought; gratitude (three things); the eight practices as one check ("tap only where you slipped" or "I kept all eight"). The separate reflection card was retired from the tab.
- Soul scoring: practices 50 (half weights), verse 20, gratitude 15, thought 15, plus Tao Soul days; see docs/scoring.md. Myra and daily guidance know the new layout.

## 0.4.1 — 19 October 2026
- Today: the well-being score is now one circle of three flowing sections (Body, Mind, Soul) that meet along water-like S-curves with no gaps; each section fills from the inside like liquid in proportion to its score, and tapping a section opens that tab. The separate Body/Mind/Soul cards were removed from Today (the detail lives on each tab). Uses react-native-svg.
- **Myra**, the in-app assistant: a floating "Myra" button on every tab opens a chat. She knows the app's tabs and scoring, sees a summary of your own targets, today and the last 7 days, and suggests questions for the tab you came from. Needs sign-in; each message counts towards the daily AI limit. Chat is kept on the device (last 40 messages).
- Theme "Marigold & leaf" (founder's choice): marigold-yellow background for happiness, leaf-green buttons, progress and ticks for health, deep-orange Happy Orange name, frosted-glass cards. Orange variants were tried first.

## 0.4.0 — 18 October 2026 (Tao Te Ching week)
- New weekly practice inspired by the Tao Te Ching (written by the founder): a different practice each day, with a private note and a tick.
  Mind days: Mon observation, Tue breathing, Thu listening, Fri emptiness, Sun "Who knows?". Soul days: Wed antidote, Sat letting go of a dry leaf.
  The card appears on the Mind or Soul tab; doing it adds 10 points to that pillar (capped at 100). Sunday shows the end-of-week review with Monday's note.
- Library: new **Tao** section with the core teaching (returning and gentleness), the whole week, the end-of-week review and "when a door will not open".
- AI guidance now knows today's Tao practice and can suggest it.
- Fix: icons showed as empty boxes on app.happyorange.in (Cloudflare skips folders named node_modules); the web build now renames that folder.

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
