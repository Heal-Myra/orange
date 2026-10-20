// Talks to the "heal-ai" server function in Supabase. The AI key never lives in the app.
// Every AI feature needs the person to be signed in, so the daily cap and privacy rules apply.

import { FunctionsHttpError } from '@supabase/supabase-js';
import { lang } from './i18n';
import { supabase } from './supabase';
import type { ContentCategoryId } from './types';

export interface MealItem { name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; basis: 'IFCT' | 'estimate' }
export interface MealResult { items: MealItem[]; confidence: string; note: string; insight: string }
export interface Guidance { headline: string; body: string[]; mind: string[]; soul: string[]; focus?: string[] }
export interface Reflection { principle: string; alignment: number; reflection: string }

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('AI features need the online version of the app.');
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Please sign in to use AI features.');
  const { data, error } = await supabase.functions.invoke('heal-ai', { body: { action, payload, uiLang: lang() } });
  if (error) {
    // The function sends a friendly message in its JSON body; show that when we can.
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw new Error('Could not reach the AI just now. Check your connection and try again.');
  }
  if (data?.error) throw new Error(data.error);
  return data.result as T;
}

export const analyseMeal = (image_base64: string, media_type: string, hint: string) =>
  call<MealResult>('meal_photo', { image_base64, media_type, hint });

export const analyseMealText = (text: string) => call<MealResult>('meal_text', { text });

export interface ScreenTimeResult { sessions: { platform: string; app: string; minutes: number; category: ContentCategoryId }[]; period: string; note: string }
export const readScreenTime = (image_base64: string, media_type: string) => call<ScreenTimeResult>('screen_time', { image_base64, media_type });

export interface GoalReading { goal: 'lose' | 'keep' | 'gain'; kg: number | null; weeks: number | null; aims: string; verdict: string; message: string }
/** Myra reads a goal written in plain words (About you). */
export const understandGoal = (goal: string, me: { age: number; sex: string; heightCm: number; weightKg: number }, today: string) =>
  call<GoalReading>('goal_plan', { goal, ...me, today });

export const dailyGuidance = (context: string) => call<Guidance>('guidance', { context });

/** Explain a Daily Wisdom passage from any tradition (meaning in the AI's own words, never a copyrighted translation). */
export const explainPassage = (p: { ref: string; original?: string; translit?: string; english?: string }, tradition: string, lang: 'en' | 'hi') =>
  call<{ text: string }>('explain_wisdom', { ref: p.ref, original: p.original ?? '', translit: p.translit ?? '', english: p.english ?? '', tradition, lang });

export const explainVerse = (v: { chapter: number; verse: number; sanskrit: string; transliteration: string }, lang: 'en' | 'hi') =>
  call<{ text: string }>('explain_verse', { ...v, lang });

export const classifyMedia = (text: string) => call<{ category: ContentCategoryId; reason: string }>('classify_media', { text });

export const reflectOnAction = (text: string) => call<Reflection>('reflect_action', { text });

export interface ChatMessage { role: 'user' | 'myra'; text: string }

/** Myra, the in-app assistant: answers using the person's own summary and the screen they are on. */
export const askMyra = (messages: ChatMessage[], context: string, page: string) =>
  call<{ text: string }>('myra', { messages: messages.slice(-12), context, page });

/** Founder's rule (19 Oct 2026): every suggestion shown to the person is one line of at most 10 words. */
export const oneLine = (text: string, max = 10): string => {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return words.length <= max ? words.join(' ') : words.slice(0, max).join(' ').replace(/[,;:]$/, '') + '…';
};
