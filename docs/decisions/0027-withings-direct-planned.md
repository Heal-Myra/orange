# 0027 · Withings scale connected directly (planned)

Date: 25 Oct 2026 · Decided by: founder

## Why
The Withings scale uploads each weighing to Withings over Wi-Fi at once, but Apple Health only receives it when the Withings
app runs on the phone. Even with Background App Refresh on, iPhone runs it rarely (and never in Low Power Mode), so Happy
Orange showed the same weight (72.9 kg from 18 Oct) for a week until the Withings app was opened. Weight is a main input for
Myra's food suggestions, so it must arrive by itself.

## Plan
- Founder (once): free Withings developer account; register Happy Orange (callback URL on our Supabase function); client ID and
  secret into Supabase secrets.
- App: "Connect Withings" in Profile (OAuth sign-in on Withings' own page).
- Server: store the person's Withings tokens (new table, own rows only), subscribe to Withings notifications for weight; on each
  notification fetch the new measures (weight, body fat) and save them to that day's log; refresh tokens as needed.
- Apple Health stays for steps, sleep and heart; a reading from Withings wins over an older one from Apple Health.

## Update, 25 Oct 2026: not doing the direct connection
When registering the app, the Withings API terms (version of 13 Oct 2026) showed three blockers: Withings data may not be
used to "prompt or otherwise provide input or data to an AI Model" without Withings' written agreement (section 11.2;
Myra is an AI); each user needs a paid Withings+ subscription (5.2); and only 10 users until Withings reviews the app (5.5).
The founder agreed to drop it. The terms were not accepted; only an empty organization "Happy Orange" was created on the
Withings developer dashboard.

Instead: weight keeps coming Withings app → Apple Health → Happy Orange (the person's own data on their phone), and a
local reminder at 3 pm says "No weight today yet. Open the Withings app once to sync it." when today has no weight
(only for people whose scale weighings reached the app in the last two weeks; `src/lib/weightNudge.ts`). Tapping it opens
Body › Body. HealthKit background delivery was considered and left out: the delay is in the Withings app, not ours.
