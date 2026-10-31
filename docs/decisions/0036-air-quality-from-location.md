# 0036 — Air quality (AQI), picked up from the phone's location
Date: 31 October 2026 · Status: decided (founder chose option A: the phone's location, over typing a city once)

**Why.** Air changes what is good for the body that day: outdoor exercise, strong breathing practices, food, skin.
**Where it shows.** Today: one quiet line under the greeting ("AQI 182 · Moderate · Bengaluru"). Body › Movement: a folded
row with PM2.5, PM10 and a one-line meaning. Not scored. Soft colours, never red (sage, sand, warm peach).
**Myra.** Her context gets an "Air quality" line with advice for that level (`airLine`); above AQI 100 she fits suggestions
to it: indoor movement instead of outdoor running, gentle breathing indoors, warm fluids and vitamin C foods.
**How.** `expo-location` (new in build 13; permission asked once, "when in use"; older builds show nothing). Rough
location (about 1 km) goes only to Open-Meteo's free air-quality service (no account, no key) and is not saved; the city
name is read on the phone. The app works out the **Indian AQI (CPCB)** from the 24-hour average of PM2.5 and PM10
(`src/lib/air.ts`, tested). Refreshed when the app opens or comes back, at most once an hour. The web version uses the browser's location.
