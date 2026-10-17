# Project Heal

A Happy Orange app that helps people understand the harmony of their body, mind and inner life.
Each day it shows a well-being score: **Body + Mind + Soul**, each out of 100.

Guiding document: *The Orange Book* (kept in the Project Heal project on Claude).

## What is in this folder (in plain words)
| Folder or file | What it is |
| --- | --- |
| `src/app/` | The app's screens. Each file is one screen. |
| `src/lib/` | The app's "brain": scoring, food tables, Gita, exercises, saving data. |
| `src/components/` | Small building blocks (buttons, cards) used on many screens. |
| `assets/data/` | Knowledge bundled inside the app: IFCT 2017, Bhagavad Gita, exercises. |
| `supabase/` | The design of the online database (used from Milestone 2). |
| `docs/` | How things work and why decisions were made. |
| `CHANGELOG.md` | A diary of what changed in each version. |

## Try it
Web version (updated automatically on every change): https://project-heal.expo.app

## Milestones
1. **Foundations** — screens, scoring, bundled knowledge. ✅
2. **Accounts and online saving** (Supabase, Mumbai). ✅ code done
3. Automatic health data from Apple Health and Health Connect.
4. AI: meal photos to macros, daily guidance, Gita explanations.
5. Beta testing on phones, then the app stores.
6. Personal learning: suggestions that adapt to each person.

## For developers (and Claude)
```sh
npm install
npm test           # scoring tests
npm run typecheck  # TypeScript check
npx expo start     # run the app
```
Read `AGENTS.md` before changing code.
