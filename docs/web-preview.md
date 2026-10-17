# Web preview

Until Project Heal has an Apple Developer account, the founder tries each version through a **web preview**
published as a private Claude artifact. It runs the same code as the phone app (React Native for Web).

1. `scripts/build-web-preview.sh <dir>`
2. Turn `index.html` into the artifact page: keep the reset `<style>`, add a small script that inserts a
   `<base>` for the hosting folder and resets the path to `/` (Expo Router reads the path), then the three
   `<script defer>` tags pointing at `./app/static/js/web/…`.
3. Publish the page with the `app/` and `assets/` files (only the Ionicons font is needed).

Limits: data is saved in that browser only; HealthKit and camera features need the real iPhone build (Milestone 3+).
