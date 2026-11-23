// The sky's hour on Today, from local sunrise and sunset (decision 0066). Kept apart from sun.ts so that stays testable.

import { useEffect, useState } from 'react';
import { useHeal } from './store';
import { skyHour, sunTimes } from './sun';

/** The sky's hour for where the person is, from the place last used for the air reading; the plain clock until then.
 *  Updates every minute. */
export function useSkyHour(): number {
  const { days } = useHeal();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);
  const air = Object.keys(days).sort().reverse().map(d => days[d]?.air).find(a => a?.lat != null && a?.lon != null);
  const clock = now.getHours() + now.getMinutes() / 60;
  return air ? skyHour(clock, sunTimes(now, air.lat!, air.lon!)) : clock;
}
