// Happy Orange AI — one server function for every AI feature. (Deployed by the EAS "Deploy AI server" workflow.)
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
const ADMIN_DAILY_LIMIT = Number(Deno.env.get('AI_ADMIN_DAILY_LIMIT') ?? 200);
// Comma-separated emails allowed to use the AI. While AI_PROVIDER is gemini (free tier), set this to the
// founder's email so no other person's data reaches a service that may train on it.
const ALLOWED = (Deno.env.get('AI_ALLOWED_EMAILS') ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const ORANGE_BOOK = `You are the Happy Orange guide. Principles: food is the foundation of health; every body is unique; understanding matters more than tracking, so briefly explain the why; nature first while staying evidence-aware; progress over perfection; truthfulness and fairness guide inner life. The app also teaches a weekly practice inspired by the Tao Te Ching: returning is the movement of the Tao and gentleness is its action; peace comes from stopping and letting go, not from chasing. You are not a doctor: make no medical claims, and suggest a qualified professional for health concerns. Be kind, specific and brief.`;

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

// When the person uses the app in Hindi, every word meant for them comes back in Hindi (founder, 20 Oct 2026).
const HINDI = `
LANGUAGE: The person uses the app in Hindi. Write every word meant for the person in simple, warm Hindi (Devanagari script), unless this request explicitly asks for English. Keep JSON keys, ids, numbers, units and category names exactly as specified, in English.`;
const askWith = (hindi: boolean) => (tier: 'smart' | 'quick', system: string, text: string, image?: Image) =>
  askAI(tier, hindi ? system + HINDI : system, text, image);

async function askAI(tier: 'smart' | 'quick', system: string, text: string, image?: Image): Promise<string> {
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
  // A photo, or a PDF the person attached in Myra's chat (21 Oct 2026).
  if (image) content.push(image.media_type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: image.data } }
    : { type: 'image', source: { type: 'base64', media_type: image.media_type, data: image.data } });
  content.push({ type: 'text', text });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
      ...(ANTHROPIC_WORKSPACE ? { 'anthropic-workspace-id': ANTHROPIC_WORKSPACE } : {}),
    },
    // Newer Claude models think before answering, and the thinking counts toward max_tokens. With the old
    // 2000-token limit a long meal reply was cut off mid-JSON (founder, 20 Oct 2026). Room to spare, short thinking.
    body: JSON.stringify({
      model: MODELS.anthropic[tier], max_tokens: 16000, system, messages: [{ role: 'user', content }],
      ...(tier === 'smart' ? { output_config: { effort: 'low' } } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) throw new Error('The AI key was not accepted by Anthropic (invalid x-api-key). Check ANTHROPIC_API_KEY in Supabase secrets.');
    throw new Error(data?.error?.message ?? `Claude error ${res.status}`);
  }
  if (data.stop_reason === 'max_tokens') throw new Error(BAD_FORMAT);
  return (data.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n').trim();
}

const BAD_FORMAT = 'The AI reply was not in the expected format. Please try again.';

/** Removes line comments and block comments outside strings, and trailing commas before } or ]. */
function stripSlips(src: string) {
  let out = '', inStr = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      out += ch;
      if (ch === '\\') { out += src[++i] ?? ''; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; out += '\n'; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); if (i < 0) break; i++; continue; }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, '$1');
}

/** Reads the JSON in an AI reply. Forgives the usual slips (code fences, comments, trailing commas, curly quotes). */
function parseJson(text: string) {
  const t = text.replace(/```(?:json)?/gi, '');
  const start = t.indexOf('{'), end = t.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(BAD_FORMAT);
  const body = t.slice(start, end + 1);
  try { return JSON.parse(body); } catch { /* try a cleaned copy */ }
  const cleaned = stripSlips(body.replace(/[\u201C\u201D]/g, '"'));
  try { return JSON.parse(cleaned); } catch { throw new Error(BAD_FORMAT); }
}

type Ask = (tier: 'smart' | 'quick', system: string, text: string, image?: Image) => Promise<string>;

/** Ask for JSON; if the reply cannot be read, ask once more, firmly (founder, 20 Oct 2026: a typed dinner failed on one bad reply). */
async function askJson(ask: Ask, tier: 'smart' | 'quick', system: string, text: string, image?: Image) {
  try { return parseJson(await ask(tier, system, text, image)); } catch (e) {
    if (e instanceof Error && e.message !== BAD_FORMAT) throw e;
    return parseJson(await ask(tier, system, `${text}

IMPORTANT: Reply with one valid JSON object only. No comments, no trailing commas, no text before or after it.`, image));
  }
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Meal photo in two steps, so the numbers come from IFCT 2017, not from the AI's memory:
 * 1. The AI names each dish, its ingredients and their grams.
 * 2. The server finds IFCT candidates for each ingredient; the AI picks the right one;
 *    the server does the arithmetic. Ingredients with no good IFCT match keep the AI's estimate.
 */
/** Meal to nutrition, from a photo or from words the person typed or spoke. Numbers come from IFCT 2017 where ingredients match. */
async function mealAnalyse(image: Image | null, hint: string, hindi = false) {
  const ask = askWith(hindi);
  const what = image
    ? `Identify every food or drink in this photo and estimate the portion on the plate. Assume Indian home cooking where dishes look Indian, with typical household oil or ghee.
${hint ? `The person adds: "${hint}"` : ''}`
    : `The person describes what they ate or drank (typed or spoken, so expect spelling mistakes and Hindi or regional words): "${hint}"
List each item. Use the quantities they give (e.g. "2 rotis", "1 katori dal"); otherwise assume typical Indian household portions and household oil or ghee.`;
  const step1 = (await askJson(ask, 'smart', `${ORANGE_BOOK} You are also a careful nutrition analyst.`,
`${what}
Break each item into its main raw ingredients with grams (include cooking oil or ghee). Also give your own estimate for the whole item.
Reply with JSON only:
{"items":[{"name":"short everyday name, at most 4 words, e.g. Roti, Moong dal, Aloo capsicum sabzi","grams":number,"ingredients":[{"ingredient":"plain raw name, e.g. wheat flour atta, bengal gram dal, ghee","grams":number}],
  "estimate":{"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fibre_g":number}}],
 "confidence":"low"|"medium"|"high","note":"one sentence on what was hardest to estimate",
 "insight":"one natural, food-first tweak as ONE direct instruction of at most 10 words, e.g. Add curd to the next meal."}
If there is no food: {"items":[],"confidence":"low","note":"${image ? 'No food found in the photo.' : 'No food found in the description.'}","insight":""}`, image ?? undefined));

  const items = Array.isArray(step1.items) ? step1.items : [];
  const ingredients: { item: number; ingredient: string; grams: number; candidates: ReturnType<typeof searchIfct> }[] = [];
  items.forEach((it: { ingredients?: { ingredient: string; grams: number }[] }, i: number) =>
    (it.ingredients ?? []).slice(0, 8).forEach(g => ingredients.push({ item: i, ingredient: String(g.ingredient), grams: Number(g.grams) || 0, candidates: searchIfct(String(g.ingredient), 4) })));

  let picks: Record<string, string | null> = {};
  if (ingredients.some(x => x.candidates.length)) {
    const list = ingredients.map((x, n) => `${n}. ${x.ingredient}: ${x.candidates.map(c => `${c.code} = ${c.name}`).join(' | ') || 'no candidates'}`).join('\n');
    const step2 = (await askJson(ask, 'quick', ORANGE_BOOK,
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
        return { name: it.name, grams: Math.round(it.grams || 0), kcal: Math.round(e.kcal || 0), protein_g: r1(e.protein_g || 0), carbs_g: r1(e.carbs_g || 0), fat_g: r1(e.fat_g || 0), fibre_g: r1(e.fibre_g || 0), basis: 'estimate' };
      }
      const t = matched.reduce((acc, x) => {
        const c = byCode.get(String(picks[String(x.n)]))!.per100g, k = x.grams / 100;
        return { kcal: acc.kcal + c.kcal * k, p: acc.p + c.protein_g * k, c: acc.c + c.carbs_g * k, f: acc.f + c.fat_g * k, fib: acc.fib + (c.fibre_g || 0) * k };
      }, { kcal: 0, p: 0, c: 0, f: 0, fib: 0 });
      return { name: it.name, grams: Math.round(it.grams || 0), kcal: Math.round(t.kcal), protein_g: r1(t.p), carbs_g: r1(t.c), fat_g: r1(t.f), fibre_g: r1(t.fib), basis: 'IFCT' };
    }),
    confidence: step1.confidence ?? 'low',
    note: step1.note ?? '',
    insight: step1.insight ?? '',
  };
}

// ---------- The AI features ----------
const CATEGORIES = 'learning, spiritual, inspiring, connect, news, fun, scrolling, negative';

async function run(action: string, p: Record<string, unknown>, hindi = false) {
  const ask = askWith(hindi);
  switch (action) {
    case 'meal_photo':
      return mealAnalyse({ media_type: String(p.media_type ?? 'image/jpeg'), data: String(p.image_base64 ?? '') }, String(p.hint ?? '').slice(0, 300), hindi);
    case 'meal_text': {
      const text = String(p.text ?? '').trim().slice(0, 600);
      if (!text) throw new Error('Tell me what you ate first.');
      return mealAnalyse(null, text, hindi);
    }
    case 'screen_time': {
      return (await askJson(ask, 'smart', ORANGE_BOOK,
`This is a screenshot of a phone's Screen Time (iPhone) or Digital Wellbeing (Android) screen. Read the time spent per app.
Include only social media, video, messaging and news apps (e.g. Instagram, YouTube, WhatsApp, Facebook, X/Twitter, LinkedIn, Snapchat, Telegram, Reddit, ShareChat, Moj, news apps). Skip tools such as Settings, Camera, Maps, Phone, banking.
For each, give the platform (one of Instagram, YouTube, WhatsApp, Facebook, X, LinkedIn, or Other), whole minutes, and the most likely kind of content from: ${CATEGORIES}
(typical defaults: Instagram scrolling, YouTube fun, WhatsApp connect, LinkedIn news, Facebook scrolling, X news; the person can change it).
If the screenshot shows a week, use the daily average if shown, otherwise divide by 7.
Reply with JSON only: {"sessions":[{"platform":"Instagram","app":"name as shown","minutes":number,"category":"one of the categories"}],"period":"today"|"daily average"|"unclear","note":"one short sentence"}
If this is not a Screen Time screenshot: {"sessions":[],"period":"unclear","note":"This does not look like a Screen Time screenshot."}`,
        { media_type: String(p.media_type ?? 'image/jpeg'), data: String(p.image_base64 ?? '') }));
    }
    case 'goal_plan': {
      // "About you": the person writes their goal in their own words (founder, 21 Oct 2026). Myra reads it into a
      // weight aim the app can plan with, keeps any other aims, and says plainly if it is too steep.
      const goal = String(p.goal ?? '').trim().slice(0, 400);
      const r = await askJson(ask, 'quick', ORANGE_BOOK,
`Today is ${String(p.today ?? '').slice(0, 10)}. A person (${Number(p.age) || '?'} years, ${String(p.sex ?? '?')}, ${Number(p.heightCm) || '?'} cm, ${Number(p.weightKg) || '?'} kg) wrote their health goal in their own words:
"${goal}"
Read it. If it includes a body-weight aim, give the kilograms to lose or gain and the weeks they want (convert months or a date to weeks from today; use 13 if no time is given).
Safe pace: lose at most 0.75 kg a week (about 1% of body weight), gain at most 0.5 kg a week; no weight loss below a healthy BMI of 18.5; under 18 years, no weight goal at all.
Reply with JSON only:
{"goal":"lose"|"keep"|"gain","kg":number or null,"weeks":number or null,"aims":"the other aims in a few plain words, or empty",
 "verdict":"ok"|"too_steep"|"not_advised"|"unclear",
 "message":"ONE direct line of at most 12 words for the person, e.g. 'Good goal: about 0.5 kg a week works.' or 'Too fast: plan 16 weeks, not 4.'"}`);
      return { goal: ['lose', 'keep', 'gain'].includes(r.goal) ? r.goal : 'keep', kg: Number(r.kg) || null, weeks: Number(r.weeks) || null,
        aims: String(r.aims ?? '').slice(0, 160), verdict: String(r.verdict ?? 'ok'), message: String(r.message ?? '').slice(0, 160) };
    }
    case 'guidance': {
      const g = (await askJson(ask, 'smart', ORANGE_BOOK,
`Here is today's data and the last 7 days for one person:
${String(p.context ?? '').slice(0, 6000)}
Tell the person what to do next, for the rest of today from the time shown (if it is night, for tonight and tomorrow morning).
Base it on the time of day, what they have already done or missed today, their pattern over the last 7 days, and any data from fitness apps. Never recommend something already done.
If the "About" line gives a weight goal, steer the body suggestion toward it gently (portion, protein, vegetables, a walk), staying within the daily targets; never crash dieting or skipping meals. If HRV is lower than usual, sleep was short or resting heart rate is up, favour rest, an easy walk and breathing over hard exercise.
Give exactly THREE very simple tasks: one for Body, one for Mind, one for Soul. Each is something the person can do right now or next, in a minute or two of effort to start.
Follow the moment of the day shown on the "Now:" line (founder's rules, in priority order):
- early morning: Soul = write today's four gratitudes (if not yet written).
- lunch (and dinner): Body = snap a photo of the plate in Food (if that meal is not logged yet), e.g. "Snap your lunch in Food before eating."
- office morning / office afternoon (weekdays): Mind = one Work task from the to-do list (if there is one).
- otherwise Mind rotates between: one to-do task (Family or Better me outside office hours), today's Tao practice, and the Screen Time screenshot in Phone activity (evening). Never two Mind tasks at once.
- Body otherwise: food (protein, fibre, portion toward their goal), a short walk, water or sleep; Soul otherwise: breathing and meditation (with minutes), Daily Wisdom, or gratitude if not done.
Reply with JSON only:
{"headline":"a short summary of the moment, at most 10 words",
 "body":["the one Body task"],
 "mind":["the one Mind task; if it is a to-do task, name it, e.g. 'Finish: Send the Q3 budget.'"],
 "soul":["the one Soul task"],
 "focus":["the id of the to-do task used in mind, or nothing"]}
For "focus": [] unless the Mind task is a to-do task; then exactly that one id (overdue or due today first; on a tired or low-sleep day pick a light one). Use only ids from the list.
STRICT: every line is ONE line of at most 10 words, written as a direct instruction that starts with a verb, with a number where it helps: e.g. "Walk 10 minutes after lunch.", "Write four things you are grateful for.", "Snap your lunch in Food before eating." Never use "try", "consider", "maybe", "you could" or "it may help". Exactly one item per list.`));
      // Founder's rule: every line at most 10 words. If the model ran long, ask once more to shorten.
      const words = (x: unknown) => String(x ?? '').trim().split(/\s+/).filter(Boolean).length;
      const lines = [g?.headline, g?.body?.[0], g?.mind?.[0], g?.soul?.[0]];
      if (lines.some(l => words(l) > 10)) {
        try {
          const short = (await askJson(ask, 'quick', ORANGE_BOOK,
`Shorten each line of this JSON to at most 10 words. Keep the meaning, start each with a verb, keep numbers. Reply with the same JSON shape only.
${JSON.stringify({ headline: g.headline, body: [g.body?.[0]], mind: [g.mind?.[0]], soul: [g.soul?.[0]] })}`));
          if (short?.headline) return { ...short, focus: g.focus ?? [] };
        } catch { /* keep the first answer */ }
      }
      return g;
    }
    case 'explain_verse': {
      const hindi = p.lang === 'hi';
      const text = await ask('smart', ORANGE_BOOK,
`Explain Bhagavad Gita chapter ${Number(p.chapter)}, verse ${Number(p.verse)} in simple ${hindi ? 'Hindi (Devanagari script)' : 'English'}.
Sanskrit: ${String(p.sanskrit ?? '').slice(0, 800)}
Transliteration: ${String(p.transliteration ?? '').slice(0, 800)}
First give the verse's meaning faithfully in your own words in 2–3 sentences (do not copy any published translation). Then, on its own last line, one way to live it today in at most 10 words. Plain text, no headings.`);
      return { text };
    }
    case 'explain_wisdom': {
      const hindi = p.lang === 'hi';
      const text = await ask('smart', ORANGE_BOOK,
`Explain this passage from the ${String(p.tradition ?? '').slice(0, 40)} tradition in simple ${hindi ? 'Hindi (Devanagari script)' : 'English'}.
Reference: ${String(p.ref ?? '').slice(0, 120)}
Original text: ${String(p.original ?? '').slice(0, 1500)}
Transliteration: ${String(p.translit ?? '').slice(0, 1500)}
English text (public domain): ${String(p.english ?? '').slice(0, 1500)}
First give its meaning faithfully and respectfully, as its own tradition mainstream understands it, in your own words in 2–3 sentences (never copy a published translation). Then, on its own last line, one way to live it today in at most 10 words. Plain text, no headings.`);
      return { text };
    }
    case 'classify_media': {
      return (await askJson(ask, 'quick', ORANGE_BOOK,
`Classify this social-media session into exactly one category by its effect on the mind: ${CATEGORIES}.
Session: "${String(p.text ?? '').slice(0, 600)}"
Reply with JSON only: {"category":"<one of the categories>","reason":"at most 10 words"}`));
    }
    case 'reflect_action': {
      return (await askJson(ask, 'smart', ORANGE_BOOK,
`Reflect on how this action aligns with dharma (duty, truth, fairness, non-harm, service, selflessness, self-discipline), drawing on the Gita and the yamas and niyamas.
Action: "${String(p.text ?? '').slice(0, 600)}"
Do not judge the person. Reply with JSON only:
{"principle":"the single most relevant principle, e.g. Satya, Nyaya, Ahimsa, Seva, Kartavya, Daana, Santosha",
 "alignment":integer from -2 (clearly against dharma) to 2 (clearly in line),
 "reflection":"ONE kind line of at most 10 words; if it fell short, one way to do better"}`));
    }
    case 'myra': {
      const page = String(p.page ?? 'today').slice(0, 40);
      const history = (Array.isArray(p.messages) ? p.messages : []).slice(-12)
        .map((m: { role?: string; text?: string; attach?: { name?: string } }) => `${m.role === 'myra' ? 'Myra' : 'Person'}: ${String(m.text ?? '').slice(0, 1200)}${m.attach?.name ? ` [attached: ${String(m.attach.name).slice(0, 80)}]` : ''}`).join('\n');
      // An attachment on the last message: a photo or PDF goes to the AI as is; a text file as text.
      const a = (p.attachment ?? null) as { kind?: string; name?: string; media_type?: string; data?: string; text?: string } | null;
      const file: Image | undefined = a && (a.kind === 'image' || a.kind === 'pdf') && a.data
        ? { media_type: a.kind === 'pdf' ? 'application/pdf' : String(a.media_type ?? 'image/jpeg'), data: String(a.data) } : undefined;
      const fileNote = a ? `\nThe person attached ${a.kind === 'image' ? 'a photo' : a.kind === 'pdf' ? 'a PDF document' : 'a text file'}${a.name ? ` ("${String(a.name).slice(0, 80)}")` : ''}. Look at it to answer.${a.kind === 'text' && a.text ? `\nIts text:\n${String(a.text).slice(0, 20000)}` : ''}\nIf it is a medical report or prescription, explain it in plain words and suggest discussing it with their doctor; never diagnose.` : '';
      const text = await ask('smart', `${ORANGE_BOOK}
You are Myra, the friendly assistant inside the Happy Orange app. You help the person find their way around the app, understand their scores and data, and answer questions about food, movement, sleep, mind and inner life.
The app has four tabs:
- Today: the well-being score out of 300 (Body + Mind + Soul, 100 each), "Myra recommends" (three very simple tasks, one each for Body, Mind and Soul, changing with the moment of the day: gratitude first thing, a work to-do in office hours, snap your lunch at lunchtime), and Profile (top right) for the account, sign-out and deleting data. During testing every tab has a feedback box at the top that goes straight to the team.
- Body: cards in this order, each reading one row. Food: Photo, Speak or Type what you ate (e.g. "2 rotis and dal"); numbers come from IFCT 2017; without AI, Type searches IFCT 2017 and asks for grams; calories and protein against the person's targets. Sleep: hours, sleep stages from Apple Watch, quality 1–5. Movement: steps, active minutes, active energy, workouts. Body: weight, body fat (e.g. a Withings scale via Apple Health), BMI. Heart & fitness: resting heart rate, HRV, VO2 max. With Apple Health connected these fill in by themselves.
- Mind: the "Clear your mind" to-do list, the day's Tao practice (every day), "Phone activity" (choose a Screen Time screenshot and the app reads social-media minutes), and social-media sessions can be added by hand inside Phone activity.
- Soul: in this order: Gratitude (four things), Breathing & meditation (a timer that records the minutes actually sat), Daily Wisdom (one passage a day from the person's chosen tradition: Hindu Bhagavad Gita, Sikh Japji Sahib, Buddhist Dhammapada, Christian Bible, Muslim Qur'an, or Universal wisdom; Jain coming soon. Read it, open its meaning in English or Hindi, write a line, tick studied. The tradition (religion) is chosen on the About you screen at sign-up and changed in Profile).
- To-do list ("Clear your mind", on the Mind tab): tasks in three groups, Family, Work and Better me. You (Myra) put ONE in front of the person at a time, as the Mind line of Myra recommends on Today (work tasks during office hours); ticking it there or on the list moves you to the next thing. The rest get dates automatically and can be moved.
- Library (open it from Profile, top right of Today): IFCT 2017 food lookup, all 18 Gita chapters, the Tao Te Ching week, the eight practices of inner life (kept for reference), and an exercise library.
- The floating Myra button on every tab opens this chat.
About you (Profile): name, age, sex, height, weight, religion and a goal in the person's own words; it sets the daily food, protein, steps and active-minute targets.
Scoring: Body = movement 40 + sleep 30 + food 30. Mind = to-do focus tasks done 15 each up to 30 + content quality 40 + content quantity 30, plus 10 for the day's Tao practice (max 100). Soul = gratitude 40 (10 each, up to four things) + breathing and meditation 30 (minutes ÷ target) + Daily Wisdom studied 30 (0 to 100).
When asked where to do something, name the tab and the card. When analysing, use only the data below; if something is not logged, say so and suggest logging it. Keep replies short: two to five sentences. Any suggestion or recommendation you give is ONE line of at most 10 words, as a direct instruction starting with a verb ("Walk 10 minutes after lunch."), never "try" or "consider". Plain text, no headings.
The person is on the ${page} tab.
Their data:
${String(p.context ?? '').slice(0, 6000)}`,
`Conversation so far:
${history}
Reply as Myra to the person's last message.${fileNote}`, file);
      return { text };
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
    // Access: on the AI_ALLOWED_EMAILS list, or approved by an admin in the app (table ai_access, migration 0004).
    if (ALLOWED.length && !ALLOWED.includes(email)) {
      const { data: access } = await ctx.supabase.from('ai_access').select('status').maybeSingle();
      if (access?.status !== 'approved') {
        return Response.json({ error: access?.status === 'declined'
          ? 'AI features are not open for your account during testing.'
          : 'Your request for AI features is waiting for approval by the Happy Orange team. You will be able to use them as soon as it is approved.' }, { status: 403 });
      }
    }
    let body: { action?: string; payload?: Record<string, unknown>; uiLang?: string };
    try { body = await req.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
    const action = String(body.action ?? '');

    // Daily cap per person.
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await ctx.supabase.from('ai_requests').select('id', { count: 'exact', head: true }).gte('created_at', since);
    // Admins (the founder, testing every feature) get a much higher cap (20 Oct 2026).
    const { data: admin } = await ctx.supabase.rpc('is_admin');
    const limit = admin === true ? ADMIN_DAILY_LIMIT : DAILY_LIMIT;
    if ((count ?? 0) >= limit) {
      return Response.json({ error: `You've used today's ${limit} AI requests. They refresh over the next 24 hours.` }, { status: 429 });
    }
    const { data: logged } = await ctx.supabase.from('ai_requests').insert({ kind: action }).select('id').maybeSingle();

    try {
      return Response.json({ result: await run(action, body.payload ?? {}, body.uiLang === 'hi'), provider: PROVIDER });
    } catch (e) {
      // A failed answer does not use up one of the person's daily requests.
      if (logged?.id) await ctx.supabase.from('ai_requests').delete().eq('id', logged.id);
      return Response.json({ error: e instanceof Error ? e.message : 'Something went wrong.' }, { status: 500 });
    }
  }),
};
