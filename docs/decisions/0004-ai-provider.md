# 0004 — AI behind one server function, provider switchable

Date: 17 October 2026 · Decided by: founder, with Claude

## Decision
- All AI features go through one Supabase Edge Function, `heal-ai` (Mumbai). The app never holds an AI key.
- The AI company is a setting, not code: secret `AI_PROVIDER` = `anthropic` (Claude) or `gemini` (Google).
- Meal photos are grounded in IFCT 2017: the AI names dishes, ingredients and grams; the server finds IFCT
  candidates; the AI picks the match; the server does the arithmetic. Unmatched items are marked "estimate".
- Safety: only signed-in people; a daily cap per person (`AI_DAILY_LIMIT`, default 20); an allow-list of tester
  emails (`AI_ALLOWED_EMAILS`). With `AI_PROVIDER=gemini` the allow-list is required, because Gemini's free tier
  may use inputs to improve Google's products — free tier is for the founder's own testing only.

## Secrets (set in Supabase → Edge Functions → Secrets, never in this repository)
`AI_PROVIDER`, `ANTHROPIC_API_KEY` (+ `ANTHROPIC_WORKSPACE_ID` when the key is not workspace-scoped) or `GEMINI_API_KEY`, `AI_ALLOWED_EMAILS`, optional `AI_DAILY_LIMIT`,
`GEMINI_MODEL`, `ANTHROPIC_MODEL_SMART`, `ANTHROPIC_MODEL_QUICK`.

## Deploy
`.eas/workflows/deploy-web.yml` job `deploy_ai` runs `supabase functions deploy heal-ai --use-api` on every push to
main, using `SUPABASE_ACCESS_TOKEN` stored as a secret Expo environment variable. Table `ai_requests`
(`supabase/migrations/0002_ai_requests.sql`) must exist first.
