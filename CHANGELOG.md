# Changelog

## 0.9.0 — 21 October 2026 (About you, more Apple Health)
- Soul: Thought of the day card removed (founder). Soul = breathing & meditation 35 + Daily Wisdom 35 + gratitude 30. Myra's description of the app (Body cards, Mind, Soul, About you, scoring) brought up to date. docs/scoring.md updated.
- Body tab redesigned (founder: "equal space for sub elements, stacked vertically neatly"): Food, Sleep, Movement, Body and Heart & fitness cards all use one row style (`src/components/StatRows.tsx`): label left, value right, equal height, hairlines; thin bars for targets; 1–5 dots for sleep quality. With Apple Health connected the rows are read-only; without it, the value box can be typed in.
- Sign-up is one "About you" screen after the privacy step (founder): name, age, sex, height, weight, religion (sets the Daily Wisdom) and the goal in the person's own words. Myra reads the goal (AI action `goal_plan`; `parseGoal` when offline), plans safe targets and says when a goal is too steep. The separate Daily Wisdom step is no longer forced. Today greets by name.
- Sign-in code: the app signs in as soon as 6 digits are in the box; the box already offers iPhone's code autofill (from Messages, and from Apple Mail on iOS 17+). Phone-number sign-in set aside for now: Indian SMS needs TRAI DLT registration and a paid SMS provider (founder: email is fine for now).
- Mind: the "Other activities" card is removed (founder). Attention and Learning ticks are gone; their 30 points now come from the to-do list: 15 for each of Myra's 1–2 focus tasks ticked off (`mind.focusDone`). Hand-added social-media sessions moved into the Phone activity card. docs/scoring.md updated.
- "About you" after sign-up (skippable) and in Profile: weight, height, sex, age, goal (lose/keep/gain, kg, by when). Sets food, protein, steps and active-minute targets with safe limits; Myra steers toward the goal. See docs/decisions/0013-about-you-and-more-health-data.md. Migration 0007 (`profiles.about`) run by the founder, 21 Oct 00:21: Success.
- Apple Health: weight, body fat, resting heart rate, HRV, VO2 max, active energy, mindful minutes, workouts and sleep stages. Shown on Body ("Your body", sleep stages, workouts); a new scale weight updates the targets; mindful minutes count as meditation. People already connected see Apple's sheet once more for the new items.
- Myra's refresh fingerprint ignores small changes, so she no longer refreshes every 20 minutes.
- Number fields can update live (`NumberField live`), used on About you.

## 0.8.1 — 20 October 2026 (app icon, quick updates)
- AI daily cap: admins (app_admins, `is_admin()`) get 200 a day (`AI_ADMIN_DAILY_LIMIT`), others stay at 20; a failed answer no longer uses up a request (row deleted; migration 0006 run by the founder, 20 Oct 23:46: Success).
- Root cause of the typed-meal failure: Claude Sonnet 5.5 thinks by default and thinking counts toward `max_tokens`; the old 2000-token limit cut the meal JSON off. Now `max_tokens` 16000, `output_config.effort: low` on the smart tier, and a cut-off reply (`stop_reason: max_tokens`) is treated as unreadable and retried.
- Type a meal: a typed dinner failed with "Expected ',' or ']' … in JSON" because one AI reply could not be read, and the app then fell back to the IFCT search with the whole sentence in the box. Now: the AI server forgives common JSON slips (code fences, comments, trailing commas, curly quotes) and asks once more if needed (`askJson`, max_tokens 4000); the app retries once quietly; the IFCT fallback is used only when the AI is truly unavailable (key, credit, limit, offline) and starts with the first food typed ("aloo paratha"), otherwise it says "Tap Calculate to try again".
- Speak on iPhone: clearer reasons when it can't listen (microphone permission, Dictation off, nothing heard), words heard before a pause are kept, and Done/15-second limit stop gracefully instead of throwing the words away.
- Quick updates (EAS Update): `expo-updates`, `production` channel, workflow `.eas/workflows/ios-update.yml` on the `update` branch. Founder chose to stay on the Expo free plan for now. See docs/decisions/0012-quick-updates.md. Active from the next full build.
- iPhone build 4 (smiling-orange icon) built and submitted from the founder's PC, using `--non-interactive` so the build never asks for an Apple login (the Apple key on Expo is used instead).
- New app icon, final (founder, 20 Oct 2026, design "4G"): a minimalist coral orange with a green leaf and a small white side smile toward the lower right, on the soft white-grey page colour. Same picture for the iPhone icon, Android adaptive icon (foreground, background, monochrome), splash and website favicon. Source drawing: `assets/icon-source.svg`. (Explored and set aside: a realistic textured orange, a face with eyes and cheeks, and an orange character eating a slice.)
- Website: Safari "Add to Home Screen" showed a grey "H" because the site had no home-screen icon. Added `public/apple-touch-icon.png`, a web manifest (`public/manifest.json`, icons 192/512) and a page template `public/index.html` that links them.

## 0.8.0 — 20 October 2026 (iPhone app, getting ready)
- Expo free plan's 60 CI minutes for October were used up (reset 1 Nov). The EAS web deploy and test job are removed (Cloudflare publishes the website; tests run before each push); the AI server deploy now runs only when `supabase/functions/**` changes.
- Build 2: Apple requires NSHealthUpdateUsageDescription whenever the HealthKit entitlement is present (ITMS-90683), even for read-only apps; added an honest sentence.
- iPhone app settings: Apple Health permission (read steps, exercise minutes, sleep), microphone and speech permission for Speak, encryption declaration, iPhone only (no iPad layout yet).
- Apple Health: "Connect Apple Health" card on Body; once connected, Sleep and Movement fill in by themselves (on open, on return to the app, every 15 minutes).
- Speak works in the iPhone app (English or Hindi, following the app language).
- Workflow `.eas/workflows/ios-testflight.yml`: build and send to TestFlight on pushes to the `testflight` branch. See docs/decisions/0011-native-app-and-apple-health.md.

## 0.7.0 — 20 October 2026 (Hindi)
- Today circle: only three coloured arcs (Body, Mind, Soul) on one quiet grey ring; the pale "unfilled" parts that looked like a fourth ring are gone.
- First screen: choose **English** or **हिंदी**; change any time in Profile → Language. The whole app, the Tao week and the thoughts of the day are in Hindi, and Myra, her recommendations, meal tips and explanations answer in Hindi. See docs/decisions/0010-languages.md.

## 0.6.0 — 20 October 2026 ("Clear your mind")
- **Daily Wisdom from your own tradition**: asked once after sign-up (optional) and changeable in Profile: Hindu (Bhagavad Gita), Sikh (Japji Sahib), Buddhist (Dhammapada), Christian (Bible, KJV), Muslim (Qur'an, Arabic with transliteration), Universal wisdom; Jain coming soon. "Open its meaning" explains any passage in English or Hindi. Sources and licences: docs/decisions/0009-daily-wisdom.md.
- Soul tab order (founder): Gratitude, Breathing & meditation, **Daily Wisdom** (the Gita verse card, renamed), Thought of the day. The eight-practices check and the Tao card were removed from Soul; the eight practices are kept in the Library (Profile → Library → Practices) for the future. The Tao practice is on Mind every day.
- Soul rebalanced to 100: meditation 30, verse 25, gratitude 10 each up to 30, thought 15 (plus or minus 10 from older reflections).
- Body tab is now three cards in the founder's priority: **Food**, **Sleep**, **Movement**. The separate "Add food from IFCT 2017" card is gone: when the AI cannot be used (signed out, not yet approved, offline), Type searches IFCT 2017 in the same box. The IFCT lookup stays in the Library.
- Better food search: spelling variants (daal, dhal → dal; moong, toor, chana, urad…) and matching at the start of words, so "daal" no longer finds apricot (jardaalu).
- New to-do list on the Mind tab, in three groups: Family, Work, Better me. Add a task (with Today / Tomorrow / This week / Next week, or let Myra choose), tick to finish, tap the calendar to move it, or remove it.
- Each day Myra picks one or two tasks as today's **Focus**, shown inside Myra recommends on Today; the rest are spread out automatically, two a day. A task moved three times gets a gentle "make it smaller, or let it go?".
- The breathing and meditation card moved from Mind to Soul, and its 20 points moved with it. Mind is now attention 15 + learning 15 + content 70 (quality 40, quantity 30). Soul is now practices 40 + meditation 20 + verse 15 + gratitude 15 + thought 10. See docs/scoring.md.
- The Library moved into Profile; the app now has four tabs: Today, Body, Mind, Soul.
- New table `tasks` (migration 0005); see docs/decisions/0008-clear-your-mind.md.

## 0.5.2 — 20 October 2026
- Myra recommends: the header, one small coral headline, then three separate blocks stacked one under another (Body, Mind, Soul), each with its colour on the left. All lines are small text of at most 10 words and no longer cut off with "…".
- AI server: if any recommendation comes back longer than 10 words, it is shortened once more before it reaches the phone.

## 0.5.1 — 19 October 2026 (new look: "Calm Teal" with a Happy Orange coral signature)
- New theme chosen by the founder from three reference apps: white-grey page, white cards with a soft shadow, rounded buttons, calm teal for buttons and ticks; Body leaf green, Mind teal, Soul amber. The marigold background and glass cards are retired.
- Happy Orange's signature coral (#C0513A) marks everything the app itself produces: the Happy Orange name, scores, Today's guidance, AI reads (meal Calculate, Screen Time), verse explanations, reflections, category picks, and Myra. See docs/decisions/0007-colour-system.md.
- Founder's rule: every suggestion is **one line of at most 10 words**. Today's guidance is now a headline plus one line each for Body, Mind and Soul; meal tips, reflections, category reasons, the "live it today" line of verse explanations and Myra's recommendations follow the same rule (AI prompt plus an app-side trim, `oneLine` in src/lib/ai.ts).
- Final look A adopted (founder, 09:43): exact A colours (Body #6A9A3B, Mind #3C9AA2, Soul #E0794F) and the A layout on Today: greeting with first name, a thin three-arc circle on a soft teal disc, three coloured Body/Mind/Soul tiles, and Myra recommends with the coral button. The wavy circle is retired.
- Bigger tab bar: icons 28 pt and labels 13 pt bold; Profile label bigger.
- Updates reach phones sooner: the web page is never kept stale (Cloudflare `_headers`: app page `no-cache`, code files cached long).
- Body tab: one concise **Food** card (log a meal by photo, speech or typing, then today's calories, protein and meals, each removable with ✕), then Movement & sleep, then the IFCT search.
- Today's guidance card is now **Myra recommends**. It refreshes by itself (no button needed): when the part of the day changes (morning, afternoon, evening, night) and when today's data changes (meals, steps or workouts from a fitness app, meditation…), at most once every 20 minutes for data changes. A small Refresh link remains.
- Every suggestion is a direct instruction starting with a verb, with a number where it helps ("Walk 10 minutes after lunch."), never "try" or "consider". The AI is told the local time and only recommends what is still possible today and not already done.

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
