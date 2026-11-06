// NeoSapien (Neo 1) → Happy Orange (founder, 6 Nov 2026; decision 0050).
// The person signs in to NeoSapien once (standard MCP sign-in: OAuth 2.1 with PKCE). Their sign-in is kept here, on the
// server, never in the app. When they open Today, the app asks for "From your day": this reads that day's conversations
// from NeoSapien's own server (api.neosapien.xyz/mcp) and returns only short suggestions: journal lines, to-dos that are
// theirs, and the tone of the day. Transcripts and business details are never stored; nothing is added without a yes.
//
// Routes (this function does its own sign-in check, so the browser can reach the callback):
//   POST {action:'start'}      → { url } to open in the browser
//   GET  /neosapien/callback   → NeoSapien sends the person back here; we keep the sign-in and reopen the app
//   POST {action:'status'}     → { connected }
//   POST {action:'disconnect'}
//   POST {action:'day', date}  → { date, tone, journal, todos } (cached for 30 minutes)

import { createClient } from 'npm:@supabase/supabase-js@2';

const MCP = 'https://api.neosapien.xyz/mcp';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const CALLBACK = `${SB_URL}/functions/v1/neosapien/callback`;
const APP_RETURN = 'projectheal://neosapien';
const clean = (v: string | undefined) => v?.trim().replace(/^["'`]+|["'`]+$/g, '').trim() || undefined;
const ANTHROPIC_KEY = clean(Deno.env.get('ANTHROPIC_API_KEY'));
const ANTHROPIC_WORKSPACE = clean(Deno.env.get('ANTHROPIC_WORKSPACE_ID'));
const MODEL = Deno.env.get('ANTHROPIC_MODEL_QUICK') ?? 'claude-haiku-5-5';
const admin = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const json = (b: unknown, status = 200) => Response.json(b, { status, headers: cors });

// ---------- Sign-in discovery (MCP authorization spec), done once and kept ----------
interface AuthMeta { authorization_endpoint: string; token_endpoint: string; registration_endpoint?: string; scopes?: string }

async function getJson(url: string) {
  try { const r = await fetch(url, { headers: { accept: 'application/json' } }); return r.ok ? await r.json() : null; } catch { return null; }
}
async function discover(): Promise<AuthMeta> {
  const u = new URL(MCP);
  // 1. Which sign-in server protects the MCP server: from the 401 header, or the well-known address.
  let prm: { authorization_servers?: string[]; scopes_supported?: string[] } | null = null;
  try {
    const r = await fetch(MCP, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: '{"jsonrpc":"2.0","id":0,"method":"ping"}' });
    const m = r.headers.get('www-authenticate')?.match(/resource_metadata="([^"]+)"/);
    if (m) prm = await getJson(m[1]);
  } catch { /* try the usual addresses */ }
  prm ??= await getJson(`${u.origin}/.well-known/oauth-protected-resource${u.pathname}`) ?? await getJson(`${u.origin}/.well-known/oauth-protected-resource`);
  const as = new URL(prm?.authorization_servers?.[0] ?? u.origin);
  const path = as.pathname === '/' ? '' : as.pathname;
  const meta = await getJson(`${as.origin}/.well-known/oauth-authorization-server${path}`) ?? await getJson(`${as.origin}/.well-known/openid-configuration${path}`)
    ?? { authorization_endpoint: `${as.origin}/authorize`, token_endpoint: `${as.origin}/token`, registration_endpoint: `${as.origin}/register` };
  return { authorization_endpoint: meta.authorization_endpoint, token_endpoint: meta.token_endpoint, registration_endpoint: meta.registration_endpoint,
    scopes: (prm?.scopes_supported ?? meta.scopes_supported ?? []).join(' ') || undefined };
}

/** Happy Orange as a NeoSapien client: registered once (dynamic client registration) and kept. */
async function client(): Promise<{ meta: AuthMeta; client_id: string; client_secret?: string }> {
  const { data } = await admin.from('neosapien_kv').select('value').eq('key', 'client').maybeSingle();
  if (data?.value?.client_id && data.value.redirect === CALLBACK) return data.value;
  const meta = await discover();
  if (!meta.registration_endpoint) throw new Error('NeoSapien did not offer a way to register Happy Orange.');
  const r = await fetch(meta.registration_endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    client_name: 'Happy Orange', redirect_uris: [CALLBACK], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'],
    token_endpoint_auth_method: 'none', ...(meta.scopes ? { scope: meta.scopes } : {}),
  }) });
  const reg = await r.json().catch(() => ({}));
  if (!r.ok || !reg.client_id) throw new Error(`NeoSapien registration failed (${r.status}).`);
  const value = { meta, client_id: reg.client_id, client_secret: reg.client_secret, redirect: CALLBACK };
  await admin.from('neosapien_kv').upsert({ key: 'client', value });
  return value;
}

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s: string) => b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));

async function tokenRequest(c: Awaited<ReturnType<typeof client>>, form: Record<string, string>) {
  const body = new URLSearchParams({ ...form, client_id: c.client_id, ...(c.client_secret ? { client_secret: c.client_secret } : {}) });
  const r = await fetch(c.meta.token_endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error(`NeoSapien sign-in failed (${r.status}).`);
  return { access_token: t.access_token as string, refresh_token: (t.refresh_token as string) ?? form.refresh_token ?? null,
    expires_at: new Date(Date.now() + (Number(t.expires_in) || 3600) * 1000 - 60_000).toISOString() };
}

/** A working access token for this person, refreshed when old. */
async function accessToken(userId: string): Promise<string | null> {
  const { data } = await admin.from('neosapien_links').select('*').eq('user_id', userId).maybeSingle();
  if (!data?.access_token) return null;
  if (new Date(data.expires_at).getTime() > Date.now()) return data.access_token;
  if (!data.refresh_token) return null;
  try {
    const t = await tokenRequest(await client(), { grant_type: 'refresh_token', refresh_token: data.refresh_token, resource: MCP });
    await admin.from('neosapien_links').update(t).eq('user_id', userId);
    return t.access_token;
  } catch { return null; }
}

// ---------- Talking to NeoSapien's MCP server (streamable HTTP) ----------
async function mcp(token: string) {
  let session: string | null = null, id = 0;
  const post = async (method: string, params?: unknown, note = false) => {
    const r = await fetch(MCP, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18', ...(session ? { 'mcp-session-id': session } : {}) },
      body: JSON.stringify(note ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++id, method, params }) });
    session = r.headers.get('mcp-session-id') ?? session;
    if (r.status === 401) throw new Error('signed-out');
    if (note) return null;
    const text = await r.text();
    const msg = (r.headers.get('content-type') ?? '').includes('text/event-stream')
      ? text.split('\n').filter(l => l.startsWith('data:')).map(l => { try { return JSON.parse(l.slice(5)); } catch { return null; } }).find(m => m && m.id === id)
      : JSON.parse(text);
    if (msg?.error) throw new Error(msg.error.message ?? 'NeoSapien error');
    return msg?.result;
  };
  await post('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'Happy Orange', version: '1.0' } });
  await post('notifications/initialized', {}, true);
  return async (name: string, args: Record<string, unknown>) => {
    const res = await post('tools/call', { name, arguments: args });
    const t = (res?.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
    try { return JSON.parse(t); } catch { return res?.structuredContent ?? null; }
  };
}

// ---------- The day: tone (worked out here) and suggestions (Myra) ----------
interface Mem { title?: string; summary?: string; emotions?: string[]; domains?: string[]; mentioned_entities?: string[]; participants?: string[]; started_at?: string; finished_at?: string }
const TENSE = /frustrat|aggress|anger|angry|resent|tense|stress|anxious|irritat|heated|annoy|upset|hostile|impatien|defensive/i;
const SOCIAL = /casual|social|family|personal|friend|health|leisure/i;

function toneOf(mems: Mem[]) {
  let talk = 0, work = 0, tense = 0, tenseLate = 0, calm = 0;
  for (const m of mems) {
    const a = m.started_at ? Date.parse(m.started_at) : NaN, b = m.finished_at ? Date.parse(m.finished_at) : NaN;
    const min = Number.isFinite(a) && Number.isFinite(b) && b > a ? (b - a) / 60000 : 0;
    talk += min;
    if (!(m.domains ?? []).some(d => SOCIAL.test(d))) work += min;
    const t = (m.emotions ?? []).some(e => TENSE.test(e));
    if (t) { tense++; const h = Number(m.started_at?.slice(11, 13)); if (h >= 16) tenseLate++; } else calm++;
  }
  return { talkMin: Math.round(talk), workMin: Math.round(work), tense, tenseLate, calm, count: mems.length };
}

async function suggest(mems: Mem[], reminders: { task_name?: string; owner?: string }[], summary: unknown, name: string, hindi: boolean) {
  if (!ANTHROPIC_KEY) return null;
  const brief = mems.slice(0, 40).map(m => ({ at: m.started_at?.slice(11, 16), title: m.title, summary: (m.summary ?? '').slice(0, 400), emotions: m.emotions, people: m.mentioned_entities?.slice(0, 12) }));
  const system = `You are Myra in the Happy Orange well-being app. From a person's own recorded conversations of one day, suggest short, warm lines for their evening gratitude journal and the to-dos that are theirs. Never invent: use only what the data shows; leave a field null when nothing fits. Keep each line at most 8 words. Never include money figures, deal terms, company secrets or anything embarrassing; name people only by first name. Write about the person in the first person ("Vikas, for sorting the vehicle").${hindi ? ' Write every line in simple Hindi (Devanagari); keep JSON keys in English.' : ''}`;
  const text = `The person's name: ${name || 'unknown'} (in older data they may appear as "NeoSapien").
Conversations today (newest first): ${JSON.stringify(brief)}
NeoSapien's end-of-day summary (may be empty): ${JSON.stringify(summary ?? null).slice(0, 3000)}
Open reminders from today's conversations (owner = who should do it): ${JSON.stringify(reminders.slice(0, 30).map(r => ({ task: r.task_name, owner: r.owner })))}
Reply with JSON only:
{"thankful":[{"text":"who, and for what"}],  // up to 3 people who helped, supported, were honest or kind to the person
 "laugh":{"text":"..."}|null,               // a light or funny moment, only if the data shows one
 "kind":{"text":"..."}|null,                // a moment the person was kind, patient or helpful to someone
 "best":{"text":"..."}|null,                // the best part of the day, positive only
 "todos":[{"title":"verb first, at most 8 words","area":"work"|"family"|"self"}], // up to 5, only tasks the person must do themselves (owner is them, "NeoSapien", or unassigned and clearly theirs)
 "toneLine":"one calm sentence on how the day felt, at most 14 words, no judgement"}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
    ...(ANTHROPIC_WORKSPACE ? { 'anthropic-workspace-id': ANTHROPIC_WORKSPACE } : {}) }, body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages: [{ role: 'user', content: text }] }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message ?? `Claude error ${r.status}`);
  const out = (d.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
  const m = out.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}

async function day(userId: string, name: string, date: string, hindi: boolean) {
  const { data: cached } = await admin.from('neosapien_days').select('result, fetched_at').eq('user_id', userId).eq('day', date).maybeSingle();
  if (cached && Date.now() - Date.parse(cached.fetched_at) < 30 * 60_000) return cached.result;
  const token = await accessToken(userId);
  if (!token) return { connected: false };
  const call = await mcp(token);
  const mems: Mem[] = [];
  for (let page = 1; page <= 3; page++) {
    const r = await call('search_memories', { start_date: date, end_date: `${date}T23:59:59`, limit: 100, page, sort_order: 'asc' });
    for (const it of r?.items ?? []) mems.push(it.memory ?? it);
    if (!r || page >= (r.total_pages ?? 1)) break;
  }
  if (!mems.length) {
    const result = { connected: true, date, empty: true };
    await admin.from('neosapien_days').upsert({ user_id: userId, day: date, result, fetched_at: new Date().toISOString() });
    return result;
  }
  const summary = await call('get_daily_summary', { date }).catch(() => null);
  const ids = mems.map(m => (m as { _id?: string })._id).filter(Boolean);
  const rem = await call('get_reminders', { memory_ids: ids.slice(0, 100), limit: 50 }).catch(() => null);
  const s = await suggest(mems, rem?.items ?? [], (summary as { summary?: unknown } | null)?.summary, name, hindi);
  // Only these short lines leave NeoSapien; no summaries, transcripts or business details are kept.
  const result = { connected: true, date, tone: { ...toneOf(mems), line: s?.toneLine ?? '' },
    journal: { thankful: (s?.thankful ?? []).slice(0, 3).map((x: { text: string }) => x.text).filter(Boolean), laugh: s?.laugh?.text ?? null, kind: s?.kind?.text ?? null, best: s?.best?.text ?? null },
    todos: (s?.todos ?? []).slice(0, 5).filter((x: { title?: string }) => x.title).map((x: { title: string; area?: string }) => ({ title: x.title.slice(0, 120), area: ['work', 'family', 'self'].includes(String(x.area)) ? x.area : 'work' })) };
  await admin.from('neosapien_days').upsert({ user_id: userId, day: date, result, fetched_at: new Date().toISOString() });
  return result;
}

// Supabase shows web pages from functions as plain text, so the sign-in ends by sending the browser straight back into
// the app (Connectors), which then shows whether it worked.
const page = (title: string, line: string) => {
  const ok = title === 'NeoSapien connected';
  return new Response(null, { status: 302, headers: { location: `${APP_RETURN}?${ok ? 'connected=1' : `error=${encodeURIComponent(line)}`}` } });
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);

  // NeoSapien sends the person back here after they sign in.
  if (req.method === 'GET' && url.pathname.endsWith('/callback')) {
    const state = url.searchParams.get('state') ?? '', code = url.searchParams.get('code') ?? '';
    const { data: row } = await admin.from('neosapien_links').select('user_id, pending').eq('pending->>state', state).maybeSingle();
    if (!state || !code || !row?.pending) return page('Not connected', 'That sign-in link was old or already used. Please tap Connect NeoSapien again in Happy Orange.');
    try {
      const t = await tokenRequest(await client(), { grant_type: 'authorization_code', code, redirect_uri: CALLBACK, code_verifier: row.pending.verifier, resource: MCP });
      await admin.from('neosapien_links').update({ ...t, pending: null, connected_at: new Date().toISOString() }).eq('user_id', row.user_id);
      return page('NeoSapien connected', 'Myra can now read your day from Neo 1 and suggest your journal and to-dos. Nothing is added without your yes.');
    } catch (e) {
      return page('Not connected', `Something went wrong: ${e instanceof Error ? e.message : 'unknown'}. Please try again.`);
    }
  }

  // Everything else: a signed-in Happy Orange person.
  const jwt = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: u } = await admin.auth.getUser(jwt);
  const user = u?.user;
  if (!user) return json({ error: 'Please sign in.' }, 401);
  let body: { action?: string; date?: string; uiLang?: string; name?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  try {
    switch (body.action) {
      case 'start': {
        const c = await client();
        const verifier = randomString(48), state = randomString(24);
        await admin.from('neosapien_links').upsert({ user_id: user.id, pending: { state, verifier, at: new Date().toISOString() } });
        const q = new URLSearchParams({ response_type: 'code', client_id: c.client_id, redirect_uri: CALLBACK, state, code_challenge: await sha256(verifier),
          code_challenge_method: 'S256', resource: MCP, ...(c.meta.scopes ? { scope: c.meta.scopes } : {}) });
        return json({ url: `${c.meta.authorization_endpoint}?${q}` });
      }
      case 'status': {
        const { data } = await admin.from('neosapien_links').select('access_token, connected_at').eq('user_id', user.id).maybeSingle();
        return json({ connected: !!data?.access_token, since: data?.connected_at ?? null });
      }
      case 'disconnect':
        await admin.from('neosapien_links').delete().eq('user_id', user.id);
        await admin.from('neosapien_days').delete().eq('user_id', user.id);
        return json({ connected: false });
      case 'day': {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : new Date().toISOString().slice(0, 10);
        return json(await day(user.id, String(body.name ?? ''), date, body.uiLang === 'hi'));
      }
      default:
        return json({ error: 'Unknown request.' }, 400);
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'signed-out') {
      await admin.from('neosapien_links').update({ access_token: null }).eq('user_id', user.id);
      return json({ connected: false });
    }
    return json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, 500);
  }
});
