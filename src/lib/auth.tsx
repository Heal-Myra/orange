// Sign-in with a 6-digit email code (no passwords), plus the person's privacy consent.

import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

export const CONSENT_VERSION = '2026-10-17';
const GUEST_KEY = 'heal.guest';

interface AuthState {
  ready: boolean;
  online: boolean; // Supabase is configured in this build
  session: Session | null;
  guest: boolean; // chose to use the app on this device only
  consented: boolean;
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
  if (m.includes('expired') || m.includes('invalid')) return 'That code is wrong or has expired. Check the latest email, or ask for a new code.';
  if (m.includes('email rate limit')) return 'Too many sign-in emails were sent in the last hour. Please check your inbox for the last one, or try again in about an hour.';
  if (m.includes('rate') || m.includes('seconds')) return 'Please wait a minute before asking for another code.';
  if (m.includes('network') || m.includes('fetch')) return 'Could not reach the internet. Check your connection and try again.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [consented, setConsented] = useState(false);

  const loadConsent = useCallback(async (s: Session | null) => {
    if (!s || !supabase) { setConsented(false); return; }
    const { data } = await supabase.from('profiles').select('consent_at').eq('user_id', s.user.id).maybeSingle();
    setConsented(!!data?.consent_at);
  }, []);

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
    ready, session, guest, consented, online: !!supabase,

    sendCode: async email => {
      if (!supabase) return 'Online accounts are not set up in this version.';
      const redirect = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirect } });
      return error ? explain(error.message) : null;
    },

    verifyCode: async (email, code) => {
      if (!supabase) return 'Online accounts are not set up in this version.';
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
      if (error) return explain(error.message);
      await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      setGuest(false);
      return null;
    },

    giveConsent: async () => {
      if (!supabase || !session) return 'Please sign in first.';
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
      if (!supabase || !session) return 'Please sign in first.';
      const uid = session.user.id;
      const a = await supabase.from('day_logs').delete().eq('user_id', uid);
      if (a.error) return explain(a.error.message);
      await supabase.from('feedback').delete().eq('user_id', uid); // ignore if the table is not set up yet
      const b = await supabase.from('profiles').delete().eq('user_id', uid);
      if (b.error) return explain(b.error.message);
      await supabase.auth.signOut();
      setConsented(false);
      return null;
    },
  }), [ready, session, guest, consented]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
