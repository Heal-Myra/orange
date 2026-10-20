This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project Heal — rules for every session (read first)

- **The founder is new to technology.** Any instruction for them: plain words a 10-year-old would follow, ONE small step at a time, say where to click and what they will see, then WAIT for "done". Never ask for passwords or secret keys in chat.
- **Memory between sessions:** this repository (README, CHANGELOG, `docs/decisions/`) plus the "Project Heal" project on Claude (build plan, Orange Book). End every session by updating CHANGELOG and, for any real decision, adding a `docs/decisions/NNNN-*.md`.
- **Guiding document:** The Orange Book (Edition 1.5 · 19 Oct 2026). Every update to it is a new edition: number +0.1 and the date in the title and the PDF name (e.g. `The_Orange_Book_Edition_1.4_2026-10-19.pdf`); add a row to its Version Control table. Key rules: understanding over tracking; understand before recommending; nature first, evidence-aware; no medical claims; AI explains its reasons; truthfulness and fairness.
- **Design (Orange Book Chapter 6):** first rule: always less effort for the person. Limited intervention, maximum automation: pick data up automatically (watch, phone, photo, voice) or capture it by doing the activity together in the app; manual entry is the last resort, to be phased out. Also: minimalist (one job per screen, one clear action per card), subtle and natural colours (final palette "Calm Teal": white-grey page, white cards, teal buttons; signature coral `colors.insight` for everything Happy Orange produces; see docs/decisions/0007), every suggestion one line of at most 10 words as a direct instruction, calm not busy, flowing shapes, readable contrast for everyone. Theme tokens live in `src/theme.ts`.
- **Languages (English, Hindi):** every visible text goes through `tr('English text')` (`src/lib/i18n.tsx`) and needs its Hindi in `src/lib/hi.ts`; `npm test` fails if one is missing. AI replies follow the app language (see docs/decisions/0010).
- **Scoring** lives in `src/lib/scoring.ts` and is documented in `docs/scoring.md`. Change both together and keep `npm test` passing.
- **Secrets** (Claude API key, Supabase service key) live only in Supabase / EAS secrets, never in this repository or the app.
- **Bundled data** in `assets/data/` is licensed (see `docs/decisions/0002-data-architecture.md`). Do not add modern Gita translations — they are under copyright.
- Before declaring work done: `npm test`, `npm run typecheck`.
