// Myra's 1-minute cooking guide (founder, 23 Oct 2026: videos must be our own IP). Built from the recipe itself:
// the dish, the ingredients, then each step with Myra's voice, about one minute in all. It plays in the app, and on
// the website from a link (app.happyorange.in/cook?r=…) so a cook can open it from WhatsApp without the app.
// The whole recipe travels inside the link; nothing is stored on a server.

export interface Guide {
  d: string;                 // dish
  p?: string;                // portion
  n?: number;                // people the quantities are for
  i: [string, string][];     // ingredients: item, quantity
  s: string[];               // steps
  l: string;                 // language code (en, hi, ta, …)
  t?: [string, string, string, string]; // labels in that language: Ingredients, Step, of, Ready
}

export const SITE = 'https://app.happyorange.in';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// UTF-8 + base64url by hand, so it works the same on every phone and browser.
function utf8(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    let c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else { out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); c = 0; }
  }
  return out;
}
function fromUtf8(b: number[]): string {
  let s = '', i = 0;
  while (i < b.length) {
    const x = b[i++];
    if (x < 0x80) s += String.fromCodePoint(x);
    else if (x < 0xe0) s += String.fromCodePoint(((x & 31) << 6) | (b[i++] & 63));
    else if (x < 0xf0) s += String.fromCodePoint(((x & 15) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63));
    else s += String.fromCodePoint(((x & 7) << 18) | ((b[i++] & 63) << 12) | ((b[i++] & 63) << 6) | (b[i++] & 63));
  }
  return s;
}
export function encodeGuide(g: Guide): string {
  const b = utf8(JSON.stringify(g));
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '') + (i + 2 < b.length ? B64[n & 63] : '');
  }
  return out;
}
export function decodeGuide(r: string): Guide | null {
  try {
    const b: number[] = [];
    for (let i = 0; i < r.length; i += 4) {
      const v = [0, 1, 2, 3].map(k => (i + k < r.length ? B64.indexOf(r[i + k]) : -1));
      if (v[0] < 0 || v[1] < 0) return null;
      const n = (v[0] << 18) | (v[1] << 12) | ((v[2] < 0 ? 0 : v[2]) << 6) | (v[3] < 0 ? 0 : v[3]);
      b.push((n >> 16) & 255); if (v[2] >= 0) b.push((n >> 8) & 255); if (v[3] >= 0) b.push(n & 255);
    }
    const g = JSON.parse(fromUtf8(b));
    if (!g || typeof g.d !== 'string' || !Array.isArray(g.s)) return null;
    return { d: g.d, p: g.p, n: g.n, i: Array.isArray(g.i) ? g.i : [], s: g.s.filter((x: unknown) => typeof x === 'string'), l: g.l || 'en', t: g.t };
  } catch { return null; }
}
export const guideLink = (g: Guide) => `${SITE}/cook?r=${encodeGuide(g)}`;

export const VOICE_LANG: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', ml: 'ml-IN', or: 'or-IN', ur: 'ur-IN', as: 'as-IN',
};

export interface Scene { kind: 'title' | 'ingredients' | 'step' | 'end'; text: string; say: string; seconds: number; step?: number }

/** The guide as scenes of about one minute in all (silent timing; with the voice, a scene lasts until it is read). */
export function scenes(g: Guide): Scene[] {
  const [ING, , , READY] = g.t ?? ['Ingredients', 'Step', 'of', 'Ready. Enjoy your meal!'];
  const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
  const steps = g.s.slice(0, 8);
  const stepBudget = Math.max(4 * steps.length, 60 - 5 - 10 - 4);
  const totalWords = steps.reduce((t, s) => t + words(s), 0) || 1;
  return [
    { kind: 'title', text: g.d, say: [g.d, g.p].filter(Boolean).join('. '), seconds: 5 },
    { kind: 'ingredients', text: ING, say: `${ING}: ${g.i.map(([a, b]) => `${a}${b ? `, ${b}` : ''}`).join('; ')}`, seconds: 10 },
    ...steps.map((s, k): Scene => ({ kind: 'step', text: s, say: s, step: k + 1, seconds: Math.max(4, Math.round((words(s) / totalWords) * stepBudget)) })),
    { kind: 'end', text: READY, say: READY, seconds: 4 },
  ];
}

/** A simple picture for each step, from what it says (fire, water, knife, mixing, waiting, serving). */
export function iconFor(step: string): string {
  const s = step.toLowerCase();
  if (/(fry|heat|tawa|pan|kadai|cook|roast|toast|tadka|temper|saute|sauté|boil|simmer|steam|bake|pressure|सेंक|तल|पका|उबाल|गरम)/.test(s)) return 'flame-outline';
  if (/(mix|stir|whisk|knead|blend|grind|batter|मिला|पीस|गूँध)/.test(s)) return 'sync-outline';
  if (/(soak|wash|rinse|water|पानी|भिगो|धो)/.test(s)) return 'water-outline';
  if (/(chop|cut|slice|dice|grate|peel|काट|कद्दूकस)/.test(s)) return 'cut-outline';
  if (/(rest|wait|minute|cover|मिनट|ढक)/.test(s)) return 'timer-outline';
  if (/(serve|garnish|plate|enjoy|परोस|सजा)/.test(s)) return 'restaurant-outline';
  return 'leaf-outline';
}
