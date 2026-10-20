# 0012 — Quick updates (EAS Update) on the free Expo plan

Date: 20 October 2026 · Decided by: founder

## Decision
Stay on the Expo **free plan** for now (Starter, US$19/month, considered and set aside until there are many testers and
several updates a day). To keep the iPhone app current without frequent full builds, the app uses **EAS Update**
("quick updates"): JavaScript changes (screens, cards, text, colours, scoring) are sent straight into the installed app.

## How it works
- `expo-updates` is installed; `app.json` has `updates.url` (u.expo.dev/<projectId>) and `runtimeVersion: {policy: appVersion}`.
  Production builds use the `production` channel (`eas.json`).
- The app checks for an update when it opens and uses it on the next open.
- Publishing: push `main` to the **`update`** branch, which runs `.eas/workflows/ios-update.yml` (about 2–3 CI minutes).
  When the free CI minutes are used up, the founder can publish from his PC:
  `npx eas-cli@latest update --channel production --environment production --platform ios --message "…" --non-interactive`
- **Needs a full build instead** (the `testflight` branch, or a PC build): new native libraries, permissions,
  the app icon or splash, and anything in `app.json` outside JavaScript. Before such a build, raise `expo.version`
  in `app.json` (1.0.0 → 1.0.1 …) so old installs never receive JavaScript they can't run.

## Notes
- The first build that contains expo-updates is the first one that can receive quick updates (build 4, 20 Oct, does not).
- Free plan: 1,000 monthly users for updates; 60 CI minutes a month; 15 iOS builds a month.
