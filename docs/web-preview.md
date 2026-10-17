# Web preview

Until Project Heal has an Apple Developer account, the founder tries each version through a **web preview**
published as a private Claude artifact ("Heal App Preview"). It runs the same code as the phone app (React Native for Web).

```sh
npx expo export --platform web --output-dir /tmp/heal-web
python3 scripts/build-web-preview.py /tmp/heal-web   # writes /tmp/heal-web/page.html
```
Publish `page.html` to the existing preview artifact (same URL).

Why a single file: the first preview loaded the app's JavaScript as separate files and showed a blank screen on the
founder's iPhone. Route splitting is turned off (`asyncRoutes: false` in app.json) so the app is one bundle, which is
inlined into the page. Errors during start-up are printed on screen, so a phone screenshot shows what went wrong.

Limits: data is saved in that browser only; HealthKit and camera features need the real iPhone build (Milestone 3+).
