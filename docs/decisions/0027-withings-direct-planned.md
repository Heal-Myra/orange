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
