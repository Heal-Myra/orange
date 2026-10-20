# 0010 Languages: English and Hindi, chosen first

Date: 20 October 2026. Decided by: the founder.

## Decision
- The very first screen asks the language: **English** or **हिंदी**. It can be changed any time in Profile → Language.
- The whole app follows it: every label, button, message, the Tao practices, the thoughts of the day, the choice lists.
- Myra, Myra recommends, meal tips, explanations and reflections reply in Hindi when the app is in Hindi (the AI server adds a language instruction; JSON keys, ids and categories stay English). Recommendations refresh when the language changes.
- "Open its meaning" explains Daily Wisdom in the app's language first, with a second button for the other language.

## How it works (for developers)
- Every visible text goes through `tr('English text', { vars })` from `src/lib/i18n.tsx`; the Hindi lives in `src/lib/hi.ts`, keyed by the English. Missing Hindi falls back to English.
- `src/lib/hi.test.ts` fails if any `tr('…')` text has no Hindi, so nothing is forgotten.
- Lists defined once when a file loads (e.g. consent points, Myra's suggestion chips) stay English in code and are translated where they are shown.
- Changing the language redraws the whole app.

## Not yet in Hindi
Food names from IFCT 2017, exercise names, scripture passages (shown in their own language), the sign-in code email, and the Admin page's two tab titles.

## Next languages
Add a new dictionary (e.g. `mr.ts` for Marathi) and one option on the language screen; the AI instruction takes the language name.
