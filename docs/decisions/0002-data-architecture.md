# 0002 — Bundle stable knowledge, fetch live data

Date: 17 October 2026 · Decided by: founder, with Claude

## Decision
Small reference data that rarely changes lives inside the app: IFCT 2017 (≈0.7 MB), the Bhagavad Gita text (≈0.3 MB) and the exercise library (≈0.7 MB).
Large or changing data is fetched when needed through the Project Heal backend: classical Gita commentaries (≈16 MB), USDA FoodData Central, Open Food Facts barcodes, and personal health data.

## Why
Bundled data works offline and instantly. Fetched data stays current, keeps API keys off the phone, and keeps the app small.

## Licences
- IFCT 2017: ICMR–National Institute of Nutrition data, packaged by the @ifct2017 project (MIT).
- Bhagavad Gita: Sanskrit text and classical commentaries are public domain; compiled by gita/gita (Unlicense). Modern translations are under copyright and are not included.
- Free Exercise DB: public domain (Unlicense).
