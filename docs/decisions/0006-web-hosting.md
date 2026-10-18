# 0006 — Web app hosted on Cloudflare Pages at app.happyorange.in

Date: 18 October 2026

## Decision
- The web app is built and hosted by **Cloudflare Pages** (free plan), project **happyorange**, connected to GitHub `Heal-Myra/orange`, branch `main`.
  Build command `npm run build:web` (expo export --platform web), output `dist`, env `NODE_VERSION=22`. Every push to main redeploys.
- Address: **https://app.happyorange.in** (CNAME `app` → `happyorange.pages.dev` at GoDaddy DNS). Backup: https://happyorange.pages.dev.
- Supabase Auth: Site URL https://app.happyorange.in; redirect URLs for app.happyorange.in, happyorange.pages.dev and project-heal.expo.app.
- EAS Hosting (project-heal.expo.app) still deploys from the EAS workflow for now; the EAS workflow also deploys the `heal-ai` Supabase function.

## Why
EAS Hosting custom domains need the paid Starter plan (US$19/month). Moving before testers arrive avoids asking them to re-add the
home-screen app later. Cloudflare serves static sites free with very fast delivery in India. Claude artifacts were considered but
cannot use a custom domain or reach Supabase.

## Later
Move DNS from GoDaddy to Cloudflare (one dashboard, free email routing for hello@happyorange.in). Domain registration stays at GoDaddy.
Consider retiring the EAS web deploy once app.happyorange.in is proven.
