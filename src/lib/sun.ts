// Sunrise and sunset for a place (founder, 23 Nov 2026: "the theme shall get decided by sunrise of that location").
// The standard NOAA formula, worked out on the phone: no network, nothing leaves the device.

const rad = Math.PI / 180;

/** Sunrise and sunset as hours on the phone's clock (e.g. 6.62 = 6:37), or null near the poles in midsummer/midwinter. */
export function sunTimes(date: Date, lat: number, lon: number): { rise: number; set: number } | null {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const n = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const g = (2 * Math.PI / 365) * (n - 1);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl);
  if (cosH > 1 || cosH < -1) return null;
  const ha = Math.acos(cosH) / rad;
  const tz = -date.getTimezoneOffset(); // minutes east of UTC on this phone
  const rise = (720 - 4 * (lon + ha) - eqt + tz) / 60;
  const set = (720 - 4 * (lon - ha) - eqt + tz) / 60;
  return { rise: ((rise % 24) + 24) % 24, set: ((set % 24) + 24) % 24 };
}

/** The sky's hour: the clock bent so sunrise always looks like dawn (6.2) and sunset like dusk (18), wherever you are. */
export function skyHour(clock: number, sun: { rise: number; set: number } | null): number {
  if (!sun) return clock;
  const { rise, set } = sun;
  if (clock < rise) return (clock / rise) * 6.2;
  if (clock < set) return 6.2 + ((clock - rise) / (set - rise)) * (18 - 6.2);
  return 18 + ((clock - set) / (24 - set)) * 6;
}

import { useEffect, useState } from 'react';
import { useHeal } from './store';

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
