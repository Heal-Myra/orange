// How many AI access requests are waiting for an admin, so the Profile button on Today can show a dot
// (founder, 27 Oct 2026: "Any admin request once received shall get highlighted on the today page as profile with a dot").
// Only admins ever look; everyone else always gets 0. Checked on open, when the app comes back, and every minute.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { supabase } from './supabase';

const listeners = new Set<() => void>();
/** Ask every dot to check again now (the Admin screen calls this after approving or declining). */
export const pendingChanged = () => listeners.forEach(f => f());

export function usePendingRequests(): number {
  const { admin } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!admin || !supabase) { setCount(0); return; }
    let alive = true;
    const check = async () => {
      const { count: n, error } = await supabase!.from('ai_access').select('user_id', { count: 'exact', head: true }).eq('status', 'pending');
      if (alive && !error) setCount(n ?? 0);
    };
    check();
    listeners.add(check);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check(); });
    const timer = setInterval(check, 60_000);
    return () => { alive = false; listeners.delete(check); sub.remove(); clearInterval(timer); };
  }, [admin]);
  return count;
}
