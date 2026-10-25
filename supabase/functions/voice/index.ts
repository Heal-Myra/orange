// Myra's natural voice (founder, 24–25 Oct 2026: "female voice, slower", "regional language", and few outside vendors).
// Each spoken sentence is made ONCE with Google Cloud Text-to-Speech (Chirp 3 HD, a calm woman's voice) and kept in our own
// Supabase Storage (public bucket "voice"). After that the app plays the saved file; Google is not called again for that
// sentence. The Google key lives only in the GOOGLE_TTS_KEY secret, never in the app.
//
// POST { lang: "gu", lines: ["Breathe in slowly.", ...] }  →  { urls: [string | null, ...] }  (null = could not make it)

import { withSupabase } from 'npm:@supabase/server@1';
import { createClient } from 'npm:@supabase/supabase-js@2';

const clean = (v: string | undefined) => v?.trim().replace(/^["'`]+|["'`]+$/g, '').trim() || undefined;
const KEY = clean(Deno.env.get('GOOGLE_TTS_KEY'));
const URL_ = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const BUCKET = 'voice';
// The voice and speed can be changed with secrets, no app update needed (new files are then made on first use).
const VOICE = clean(Deno.env.get('VOICE_NAME')) ?? 'Aoede';
const RATE = Number(Deno.env.get('VOICE_RATE') ?? 0.85);

// App language → Google locale. Odia and Assamese have no Chirp 3 HD voice yet: the phone shows the words.
const LOCALES: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-IN',
};
const MAX_LINES = 60, MAX_CHARS = 400;

async function sha(text: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
const publicUrl = (path: string) => `${URL_}/storage/v1/object/public/${BUCKET}/${path}`;

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) await admin.storage.createBucket(BUCKET, { public: true, fileSizeLimit: '2MB', allowedMimeTypes: ['audio/mpeg'] });
  bucketReady = true;
}

async function make(locale: string, text: string): Promise<string | null> {
  const path = `${locale}/${VOICE}-${RATE}/${await sha(text)}.mp3`;
  const head = await fetch(publicUrl(path), { method: 'HEAD' }).catch(() => null);
  if (head?.ok) return publicUrl(path);
  const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ input: { text }, voice: { languageCode: locale, name: `${locale}-Chirp3-HD-${VOICE}` }, audioConfig: { audioEncoding: 'MP3', speakingRate: RATE } }),
  });
  if (!r.ok) { console.error('tts', locale, r.status, (await r.text()).slice(0, 300)); return null; }
  const { audioContent } = await r.json() as { audioContent?: string };
  if (!audioContent) return null;
  const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
  const up = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: 'audio/mpeg', upsert: true, cacheControl: '31536000' });
  if (up.error) { console.error('upload', up.error.message); return null; }
  return publicUrl(path);
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    if (!KEY) return Response.json({ error: 'Natural voice is not switched on yet (missing GOOGLE_TTS_KEY).' }, { status: 503 });
    let body: { lang?: string; lines?: unknown[] };
    try { body = await req.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
    const locale = LOCALES[String(body.lang ?? '')];
    if (!locale) return Response.json({ urls: [], unsupported: true });
    const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, MAX_LINES).map(l => String(l ?? '').trim().slice(0, MAX_CHARS));
    await ensureBucket();
    // A few at a time, so a whole session is ready in seconds without hitting Google's per-minute limit.
    const urls: (string | null)[] = new Array(lines.length).fill(null);
    let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < lines.length) { const k = next++; if (lines[k]) urls[k] = await make(locale, lines[k]).catch(() => null); }
    }));
    return Response.json({ urls });
  }),
};
