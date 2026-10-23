# 0019 · Recipe videos as our own IP: Myra's 1-minute cooking guide

Date: 23 Oct 2026 · Decided by: founder (chose "Myra's animated guide" over AI-generated video or filming)

## Decision
- "Show me a 1-minute video" under a planned dish opens Myra's own guide (src/app/cook.tsx), made from the recipe:
  the dish, the ingredients, each step with a simple picture, and "ready", about one minute, read aloud by the phone's or
  browser's voice in the chosen language (words on screen when there is no voice for that language).
- Everything in it is ours: our recipe text, our layout, our icons set; no third-party footage. It replaces the YouTube link.
- The WhatsApp message carries a link app.happyorange.in/cook?r=… for each dish asked for, so the cook plays it in any browser
  without the app or signing in. The recipe travels inside the link (src/lib/cookGuide.ts); nothing is stored on a server.
- In another language, Myra translates the chosen recipes and the guide's labels (`translate_recipe`); links never pass
  through translation (placeholders).

## Later
Real footage can replace guides for the most-cooked dishes (filmed by us, or AI video under a commercial licence).
