// Sign-in for Apple's app reviewer (founder, 25 Oct 2026: the guest option was removed so everyone gets the full app).
// Apple's reviewer cannot receive our emailed 6-digit code, so one review email signs in with a fixed code instead.
// Both live only in Supabase secrets: REVIEW_EMAIL (default review@happyorange.in) and REVIEW_CODE (10 digits, chosen by
// the founder). With the right code, this returns a one-time sign-in token for that account; nothing else is possible.

import { createClient } from 'npm:@supabase/supabase-js@2';

const clean = (v: string | undefined) => v?.trim().replace(/^["'`]+|["'`]+$/g, '').trim() || undefined;
const EMAIL = (clean(Deno.env.get('REVIEW_EMAIL')) ?? 'review@happyorange.in').toLowerCase();
const CODE = clean(Deno.env.get('REVIEW_CODE'));
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' };

function same(a: string, b: string) { // compare without leaking how much matched
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const no = async () => { await new Promise(r => setTimeout(r, 2000)); return Response.json({ error: 'That code is wrong.' }, { status: 401, headers: cors }); };
  if (!CODE || CODE.length < 8) return no();
  let body: { email?: string; code?: string };
  try { body = await req.json(); } catch { return no(); }
  if (String(body.email ?? '').trim().toLowerCase() !== EMAIL || !same(String(body.code ?? '').trim(), CODE)) return no();
  await admin.auth.admin.createUser({ email: EMAIL, email_confirm: true }).catch(() => null); // first time only
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL });
  if (error || !data?.properties?.hashed_token) return Response.json({ error: 'Could not sign in just now.' }, { status: 500, headers: cors });
  return Response.json({ token_hash: data.properties.hashed_token }, { headers: cors });
});
