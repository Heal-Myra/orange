// Sign-in with a 6-digit email code (no passwords), plus the person's privacy consent.

import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tr } from './i18n';
import { supabase } from './supabase';
import type { Tradition } from './wisdom';

export const CONSENT_VERSION = '2026-10-17';
const GUEST_KEY = 'heal.guest';
/** Apple's app reviewer signs in with this email and a fixed code kept in Supabase secrets (supabase/functions/review-login). */
export const REVIEW_EMAIL = 'review@happyorange.in';
const TRADITION_KEY = 'heal.tradition'; // Daily Wisdom tradition; also kept in the account's private metadata

interface AuthState {
  ready: boolean;
  online: boolean; // Supabase is configured in this build
  session: Session | null;
  guest: boolean; // chose to use the app on this device only
  consented: boolean;
  admin: boolean; // listed in app_admins (sees Account → Admin)
  tradition: Tradition | null; // Daily Wisdom tradition; null = not asked yet
  traditionReady: boolean;
  setTradition: (t: Tradition) => Promise<void>;
  sendCode: (email: string) => Promise<string | null>;
  verifyCode: (email: string, code: string) => Promise<string | null>;
  giveConsent: () => Promise<string | null>;
  continueAsGuest: () => void;
  leaveGuest: () => Promise<void>; // guest decides to sign in after all
  signOut: () => Promise<void>;
  deleteMyData: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Friendly words for the errors people are most likely to meet. */
function explain(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('expired') || m.includes('invalid')) return tr('That code is wrong or has expired. Check the latest email, or ask for a new code.');
  if (m.includes('email rate limit')) return tr('Too many sign-in emails were sent in the last hour. Please check your inbox for the last one, or try again in about an hour.');
  if (m.includes('rate') || m.includes('seconds')) return tr('Please wait a minute before asking for another code.');
  if (m.includes('network') || m.includes('fetch')) return tr('Could not reach the internet. Check your connection and try again.');
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [consented, setConsented] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [tradition, setTraditionState] = useState<Tradition | null>(null);
  const [traditionReady, setTraditionReady] = useState(false);

  const loadConsent = useCallback(async (s: Session | null) => {
    if (!s || !supabase) { setConsented(false); setAdmin(false); return; }
    const { data } = await supabase.from('profiles').select('consent_at').eq('user_id', s.user.id).maybeSingle();
    setConsented(!!data?.consent_at);
    // Admin? (table app_admins, migration 0004; quietly false if not set up)
    const adm = await supabase.from('app_admins').select('email').maybeSingle();
    setAdmin(!adm.error && !!adm.data);
    // Ask for AI access automatically the first time someone signs in (an admin approves it in the app).
    const acc = await supabase.from('ai_access').select('status').maybeSingle();
    if (!acc.error && !acc.data) await supabase.from('ai_access').insert({ email: (s.user.email ?? '').toLowerCase() });
  }, []);

  // Daily Wisdom tradition: the account's copy wins; otherwise what this device remembers.
  useEffect(() => {
    const fromAccount = session?.user.user_metadata?.tradition as Tradition | undefined;
    if (fromAccount) { setTraditionState(fromAccount); setTraditionReady(true); AsyncStorage.setItem(TRADITION_KEY, fromAccount).catch(() => {}); return; }
    AsyncStorage.getItem(TRADITION_KEY).then(v => {
      if (v) { setTraditionState(v as Tradition); if (session && supabase) supabase.auth.updateUser({ data: { tradition: v } }).catch(() => {}); }
    }).catch(() => {}).finally(() => setTraditionReady(true));
  }, [session]);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_KEY).then(v => setGuest(v === '1')).catch(() => {});
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadConsent(data.session).catch(() => {});
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadConsent(s).catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, [loadConsent]);

  const value = useMemo<AuthState>(() => ({
    ready, session, guest, consented, admin, online: !!supabase, traditionReady,
    // The account's copy is read straight from the session, so it is never missed for a moment after sign-in.
    tradition: tradition ?? (session?.user.user_metadata?.tradition as Tradition | undefined) ?? null,

    setTradition: async t => {
      setTraditionState(t);
      await AsyncStorage.setItem(TRADITION_KEY, t).catch(() => {});
      if (session && supabase) await supabase.auth.updateUser({ data: { tradition: t } }).catch(() => {});
    },

    sendCode: async email => {
      if (!supabase) return tr('Online accounts are not set up in this version.');
      const redirect = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirect } });
      return error ? explain(error.message) : null;
    },

    verifyCode: async (email, code) => {
      if (!supabase) return tr('Online accounts are not set up in this version.');
      const e = email.trim().toLowerCase();
      if (e === REVIEW_EMAIL) {
        // Apple's reviewer: the server checks the fixed code and hands back a one-time sign-in token.
        const { data, error: fe } = await supabase.functions.invoke('review-login', { body: { email: e, code: code.trim() } });
        if (fe || !data?.token_hash) return tr('That code is wrong or has expired. Check the latest email, or ask for a new code.');
        const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
        if (error) return explain(error.message);
      } else {
        const { error } = await supabase.auth.verifyOtp({ email: e, token: code.trim(), type: 'email' });
        if (error) return explain(error.message);
      }
      await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      setGuest(false);
      return null;
    },

    giveConsent: async () => {
      if (!supabase || !session) return tr('Please sign in first.');
      const { error } = await supabase.from('profiles').upsert({
        user_id: session.user.id, consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION, updated_at: new Date().toISOString(),
      });
      if (error) return explain(error.message);
      setConsented(true);
      return null;
    },

    continueAsGuest: () => {
      setGuest(true);
      AsyncStorage.setItem(GUEST_KEY, '1').catch(() => {});
    },

    leaveGuest: async () => {
      await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      setGuest(false);
    },

    signOut: async () => {
      await supabase?.auth.signOut();
      setConsented(false);
    },

    // Right to erasure (DPDP Act, 2023): removes every row this person owns.
    // Removing the sign-in record itself needs a server function (planned with the AI features).
    deleteMyData: async () => {
      if (!supabase || !session) return tr('Please sign in first.');
      const uid = session.user.id;
      const a = await supabase.from('day_logs').delete().eq('user_id', uid);
      if (a.error) return explain(a.error.message);
      await supabase.from('feedback').delete().eq('user_id', uid); // ignore if the table is not set up yet
      await supabase.from('ai_access').delete().eq('user_id', uid);
      await supabase.from('tasks').delete().eq('user_id', uid); // to-do list (migration 0005)
      await AsyncStorage.removeItem('heal.tasks.v1').catch(() => {});
      await supabase.auth.updateUser({ data: { tradition: null } }).catch(() => {});
      await AsyncStorage.removeItem(TRADITION_KEY).catch(() => {});
      const b = await supabase.from('profiles').delete().eq('user_id', uid);
      if (b.error) return explain(b.error.message);
      await supabase.auth.signOut();
      setConsented(false);
      return null;
    },
  }), [ready, session, guest, consented, admin, tradition, traditionReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
