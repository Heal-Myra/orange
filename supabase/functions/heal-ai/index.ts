// Project Heal AI — one server function for every AI feature.
// Runs in Supabase (Mumbai). Only signed-in people can call it; each person has a daily cap.
// The Claude API key lives in the ANTHROPIC_API_KEY secret, never in the app.
//
// Orange Book rules applied in every prompt: understanding over tracking, explain the why,
// nature first and evidence-aware, no medical claims, truthful about uncertainty, no judgement.

import { withSupabase } from 'npm:@supabase/server@1';
import ifct from './ifct2017.json' with { type: 'json' };

// Which AI company answers. Change the AI_PROVIDER secret to switch; no app update needed.
//   anthropic (default): Claude. Paid API; inputs are not used to train models.
//   gemini: Google Gemini. Its free tier may use inputs to improve Google's products,
//           so use it only for testing with the founder's own data, never real users.
const PROVIDER = (Deno.env.get('AI_PROVIDER') ?? 'anthropic').toLowerCase();
// Keys pasted into the dashboard sometimes carry spaces, line breaks or quote marks; strip them.
const clean = (v: string | undefined) => v?.trim().replace(/^["'`]+|["'`]+$/g, '').trim() || undefined;
const ANTHROPIC_KEY = clean(Deno.env.get('ANTHROPIC_API_KEY'));
const GEMINI_KEY = clean(Deno.env.get('GEMINI_API_KEY'));
// Needed when the Anthropic key is not tied to one workspace (the Console says which workspace to bill).
const ANTHROPIC_WORKSPACE = clean(Deno.env.get('ANTHROPIC_WORKSPACE_ID'));
const MODELS = {
  anthropic: { smart: Deno.env.get('ANTHROPIC_MODEL_SMART') ?? 'claude-sonnet-5-5', quick: Deno.env.get('ANTHROPIC_MODEL_QUICK') ?? 'claude-haiku-5-5' },
  gemini: { smart: Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash', quick: Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash' },
};
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 20);
// Comma-separated emails allowed to use the AI. While AI_PROVIDER is gemini (free tier), set this to the
// founder's email so no other person's data reaches a service that may train on it.
const ALLOWED = (Deno.env.get('AI_ALLOWED_EMAILS') ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const ORANGE_BOOK = `You are the Project Heal guide (Happy Orange). Principles: food is the foundation of health; every body is unique; understanding matters more than tracking, so briefly explain the why; nature first while staying evidence-aware; progress over perfection; truthfulness and fairness guide inner life. You are not a doctor: make no medical claims, and suggest a qualified professional for health concerns. Be kind, specific and brief.`;

// ---------- IFCT 2017 lookup (per 100 g; energy in kJ, other nutrients in grams) ----------
type Row = (string | number | null)[];
const table = ifct as unknown as { cols: [string, string][]; foods: Row[] };
const col: Record<string, number> = {};
table.cols.forEach(([k], i) => { col[k] = 6 + i; });
const num = (r: Row, k: string) => (typeof r[col[k]] === 'number' ? (r[col[k]] as number) : 0);

function searchIfct(query: string, limit = 5) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1);
  if (!words.length) return [];
  return table.foods
    .map(f => {
      const n = String(f[1]).toLowerCase(), l = String(f[3] ?? '').toLowerCase(), g = String(f[4] ?? '').toLowerCase();
      let score = 0, all = true;
      for (const w of words) { const m = n.includes(w) ? 3 : l.includes(w) ? 2 : g.includes(w) ? 1 : 0; if (!m) all = false; score += m; }
      return { f, score: score + (all ? 4 : 0) };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ f }) => {
      const p = num(f, 'protcnt'), c = num(f, 'choavldf'), fat = num(f, 'fatce'), kj = num(f, 'enerc');
      return {
        code: f[0], name: f[1], group: f[4],
        per100g: { kcal: Math.round(kj ? kj / 4.184 : p * 4 + c * 4 + fat * 9), protein_g: +p.toFixed(1), carbs_g: +c.toFixed(1), fat_g: +fat.toFixed(1), fibre_g: +num(f, 'fibtg').toFixed(1) },
      };
    });
}

// ---------- One way to ask either AI company ----------
interface Image { media_type: string; data: string }

async function ask(tier: 'smart' | 'quick', system: string, text: string, image?: Image): Promise<string> {
  if (PROVIDER === 'gemini') {
    const model = MODELS.gemini[tier];
    const parts: Record<string, unknown>[] = [{ text }];
    if (image) parts.push({ inline_data: { mime_type: image.media_type, data: image.data } });
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': GEMINI_KEY!, 'content-type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Gemini error ${res.status}`);
    return (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('\n').trim();
  }
  const content: Record<string, unknown>[] = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } });
  content.push({ type: 'text', text });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
      ...(ANTHROPIC_WORKSPACE ? { 'anthropic-workspace-id': ANTHROPIC_WORKSPACE } : {}),
    },
    body: JSON.stringify({ model: MODELS.anthropic[tier], max_tokens: 2000, system, messages: [{ role: 'user', content }] }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) throw new Error('The AI key was not accepted by Anthropic (invalid x-api-key). Check ANTHROPIC_API_KEY in Supabase secrets.');
    throw new Error(data?.error?.message ?? `Claude error ${res.status}`);
  }
  return (data.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n').trim();
}

function parseJson(text: string) {
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('The AI reply was not in the expected format. Please try again.');
  return JSON.parse(text.slice(start, end + 1));
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Meal photo in two steps, so the numbers come from IFCT 2017, not from the AI's memory:
 * 1. The AI names each dish, its ingredients and their grams.
 * 2. The server finds IFCT candidates for each ingredient; the AI picks the right one;
 *    the server does the arithmetic. Ingredients with no good IFCT match keep the AI's estimate.
 */
async function mealPhoto(image: Image, hint: string) {
  const step1 = parseJson(await ask('smart', `${ORANGE_BOOK} You are also a careful nutrition analyst.`,
`Identify every food or drink in this photo and estimate the portion on the plate. Assume Indian home cooking where dishes look Indian, with typical household oil or ghee.
${hint ? `The person adds: "${hint}"` : ''}
Break each item into its main raw ingredients with grams (include cooking oil or ghee). Also give your own estimate for the whole item.
Reply with JSON only:
{"items":[{"name":"short everyday name, at most 4 words, e.g. Roti, Moong dal, Aloo capsicum sabzi","grams":number,"ingredients":[{"ingredient":"plain raw name, e.g. wheat flour atta, bengal gram dal, ghee","grams":number}],
  "estimate":{"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}}],
 "confidence":"low"|"medium"|"high","note":"one sentence on what was hardest to estimate",
 "insight":"one or two kind sentences on what this meal gives the body and one natural, food-first tweak"}
If no food is visible: {"items":[],"confidence":"low","note":"No food found in the photo.","insight":""}`, image));

  const items = Array.isArray(step1.items) ? step1.items : [];
  const ingredients: { item: number; ingredient: string; grams: number; candidates: ReturnType<typeof searchIfct> }[] = [];
  items.forEach((it: { ingredients?: { ingredient: string; grams: number }[] }, i: number) =>
    (it.ingredients ?? []).slice(0, 8).forEach(g => ingredients.push({ item: i, ingredient: String(g.ingredient), grams: Number(g.grams) || 0, candidates: searchIfct(String(g.ingredient), 4) })));

  let picks: Record<string, string | null> = {};
  if (ingredients.some(x => x.candidates.length)) {
    const list = ingredients.map((x, n) => `${n}. ${x.ingredient}: ${x.candidates.map(c => `${c.code} = ${c.name}`).join(' | ') || 'no candidates'}`).join('\n');
    const step2 = parseJson(await ask('quick', ORANGE_BOOK,
`For each ingredient, choose the IFCT 2017 food code that matches it best, or null if none is a fair match (for example, raw versus cooked forms are usually fine; a different food is not).
${list}
Reply with JSON only: {"picks":{"0":"CODE or null","1":"CODE or null"}}`));
    picks = step2.picks ?? {};
  }

  const byCode = new Map(ingredients.flatMap(x => x.candidates).map(c => [String(c.code), c]));
  return {
    items: items.map((it: { name: string; grams: number; estimate?: Record<string, number> }, i: number) => {
      const mine = ingredients.map((x, n) => ({ ...x, n })).filter(x => x.item === i);
      const matched = mine.filter(x => picks[String(x.n)] && byCode.has(String(picks[String(x.n)])));
      const allMatched = mine.length > 0 && matched.length === mine.length;
      if (!allMatched) {
        const e = it.estimate ?? {};
        return { name: it.name, grams: Math.round(it.grams || 0), kcal: Math.round(e.kcal || 0), protein_g: r1(e.protein_g || 0), carbs_g: r1(e.carbs_g || 0), fat_g: r1(e.fat_g || 0), basis: 'estimate' };
      }
      const t = matched.reduce((acc, x) => {
        const c = byCode.get(String(picks[String(x.n)]))!.per100g, k = x.grams / 100;
        return { kcal: acc.kcal + c.kcal * k, p: acc.p + c.protein_g * k, c: acc.c + c.carbs_g * k, f: acc.f + c.fat_g * k };
      }, { kcal: 0, p: 0, c: 0, f: 0 });
      return { name: it.name, grams: Math.round(it.grams || 0), kcal: Math.round(t.kcal), protein_g: r1(t.p), carbs_g: r1(t.c), fat_g: r1(t.f), basis: 'IFCT' };
    }),
    confidence: step1.confidence ?? 'low',
    note: step1.note ?? '',
    insight: step1.insight ?? '',
  };
}

// ---------- The five AI features ----------
const CATEGORIES = 'learning, spiritual, inspiring, connect, news, fun, scrolling, negative';

async function run(action: string, p: Record<string, unknown>) {
  switch (action) {
    case 'meal_photo':
      return mealPhoto({ media_type: String(p.media_type ?? 'image/jpeg'), data: String(p.image_base64 ?? '') }, String(p.hint ?? '').slice(0, 300));
    case 'guidance': {
      return parseJson(await ask('smart', ORANGE_BOOK,
`Here is today's data and the last 7 days for one person:
${String(p.context ?? '').slice(0, 6000)}
Give practical guidance for the rest of today and tomorrow morning. Reply with JSON only:
{"headline":"one sentence naming the single most useful shift",
 "body":["food suggestion with a short why","movement or sleep suggestion"],
 "mind":["meditation or attention suggestion with a duration","learning or content-diet suggestion"],
 "soul":["truthfulness, fairness or service suggestion; name the verse of the day if it fits","suggestion"]}
Each suggestion under 28 words.`));
    }
    case 'explain_verse': {
      const hindi = p.lang === 'hi';
      const text = await ask('smart', ORANGE_BOOK,
`Explain Bhagavad Gita chapter ${Number(p.chapter)}, verse ${Number(p.verse)} in simple ${hindi ? 'Hindi (Devanagari script)' : 'English'}.
Sanskrit: ${String(p.sanskrit ?? '').slice(0, 800)}
Transliteration: ${String(p.transliteration ?? '').slice(0, 800)}
First give the verse's meaning faithfully in your own words in 2–3 sentences (do not copy any published translation). Then two sentences on how a person today can live this teaching, linked where natural to body, mind or inner life. Plain text, no headings.`);
      return { text };
    }
    case 'classify_media': {
      return parseJson(await ask('quick', ORANGE_BOOK,
`Classify this social-media session into exactly one category by its effect on the mind: ${CATEGORIES}.
Session: "${String(p.text ?? '').slice(0, 600)}"
Reply with JSON only: {"category":"<one of the categories>","reason":"one short sentence"}`));
    }
    case 'reflect_action': {
      return parseJson(await ask('smart', ORANGE_BOOK,
`Reflect on how this action aligns with dharma (duty, truth, fairness, non-harm, service, selflessness, self-discipline), drawing on the Gita and the yamas and niyamas.
Action: "${String(p.text ?? '').slice(0, 600)}"
Do not judge the person. Reply with JSON only:
{"principle":"the single most relevant principle, e.g. Satya, Nyaya, Ahimsa, Seva, Kartavya, Daana, Santosha",
 "alignment":integer from -2 (clearly against dharma) to 2 (clearly in line),
 "reflection":"two short, kind sentences; if the action fell short, one way to make amends or do better"}`));
    }
    default:
      throw new Error('Unknown request.');
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (PROVIDER === 'gemini' ? !GEMINI_KEY : !ANTHROPIC_KEY) {
      return Response.json({ error: `The AI is not switched on yet (missing ${PROVIDER === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'}).` }, { status: 503 });
    }
    const email = String((ctx.userClaims as { email?: string } | undefined)?.email ?? '').toLowerCase();
    if (PROVIDER === 'gemini' && !ALLOWED.length) {
      return Response.json({ error: 'The free AI is only for testing. Set AI_ALLOWED_EMAILS before using it.' }, { status: 403 });
    }
    if (ALLOWED.length && !ALLOWED.includes(email)) {
      return Response.json({ error: 'AI features are being tested and are not open to everyone yet.' }, { status: 403 });
    }
    let body: { action?: string; payload?: Record<string, unknown> };
    try { body = await req.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
    const action = String(body.action ?? '');

    // Daily cap per person.
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await ctx.supabase.from('ai_requests').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return Response.json({ error: `You've used today's ${DAILY_LIMIT} AI requests. They refresh over the next 24 hours.` }, { status: 429 });
    }
    await ctx.supabase.from('ai_requests').insert({ kind: action });

    try {
      return Response.json({ result: await run(action, body.payload ?? {}), provider: PROVIDER });
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, { status: 500 });
    }
  }),
};
