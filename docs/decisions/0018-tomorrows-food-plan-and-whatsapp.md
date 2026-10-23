# 0018 · Tomorrow's food: plan, tweak, finalise, send on WhatsApp

Date: 23 Oct 2026 · Decided by: founder ("plan the food for next day, ask the user to finalise or tweak, and send it to any WhatsApp contact with recipe, ingredient list and a video tutorial of not more than a minute, only when someone asks for it")

## Decision
- Body tab, under Food: "Tomorrow's food". Myra (AI action `meal_plan`) plans breakfast, lunch, snack and dinner around the
  person's calorie, protein and fibre targets and goal, their food preferences (saved in About you as `foodPrefs`) and what
  they ate in the last week. Ingredient quantities are for the number of people cooked for (1–6); nutrition is per person.
- Tweak: "Change this dish" (swap one meal) or tell Myra what to change in words. Then "Finalise the plan".
- "Send on WhatsApp" opens WhatsApp with the menu, ingredients and steps ready; the person picks the contact
  (wa.me link; the phone's share sheet if WhatsApp is missing). The plan is saved on tomorrow's day (`DayLog.plan`), and
  tomorrow it shows as "See today's plan".
- Videos only on request: "Show me a 1-minute video" under a dish opens short recipe videos (YouTube Shorts search) and adds
  that link to the WhatsApp message. Only for the dishes asked for.

## Limits and later
- The video is a search for short videos, so the person picks one; YouTube decides lengths (Shorts are mostly under a minute).
  Picking one exact video under 60 seconds needs a YouTube Data API key (a Supabase secret) — a later step if wanted.
- The message is in the app's language. A Hindi copy for a cook who reads Hindi is a small follow-up.
