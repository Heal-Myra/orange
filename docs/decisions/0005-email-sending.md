# 0005 — Sign-in emails: Resend via happyorange.in, 6-digit code

Date: 18 October 2026

## Decision
- Company domain **happyorange.in** bought at GoDaddy (paid to Oct 2029; renews ₹899/yr). 2-step verification on; domain lock on; .in KYC done.
- Supabase sends auth emails through **Resend** (free tier: 100/day, 3,000/month) using custom SMTP:
  host smtp.resend.com, port 465, user `resend`, password = Resend API key (sending access, domain happyorange.in), stored only in Supabase.
- Sender: **Happy Orange <hello@happyorange.in>**. Resend region Tokyo (ap-northeast-1).
- DNS at GoDaddy: TXT `resend._domainkey`, CNAME `rsend`, CNAME `send`. GoDaddy's existing `_dmarc` (p=quarantine) kept; Resend's optional DMARC not added.
- Email templates "Magic Link" and "Confirm sign up" show `{{ .Token }}` (6-digit code). The app asks for the code first; pasting a link remains as a fallback.

## Why
Supabase's built-in mailer only emails project members, sends a few emails per hour, and locks templates. Tapped links open in the
wrong browser (Gmail → Google app) and the iPhone home-screen app cannot receive them; link previews can use up the one-time link.
A typed code works in every browser and in the home-screen app.

## Not chosen (for now)
Google Workspace (~₹270/user/month + GST) for a human inbox — can be added later without changing anything for testers.
Replies to hello@ currently go nowhere; add free forwarding or Workspace before inviting testers widely.
