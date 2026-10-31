// Air quality (founder, 31 Oct 2026; decision 0036): picked up by itself from the phone's location, never typed.
// The air data comes from Open-Meteo's free air-quality service (no account, no key); the app works out the Indian AQI
// (CPCB, the scale people in India know) from the last 24 hours of PM2.5 and PM10, like the official daily AQI.
// Only a rounded location (about 1 km) leaves the phone, and only to fetch the air; it is not saved.

export type AirCat = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'veryPoor' | 'severe';
export interface AirReading { aqi: number; cat: AirCat; pm25: number; pm10: number; place?: string; at: string }

export const AIR_CATS: { id: AirCat; label: string; upTo: number }[] = [
  { id: 'good', label: 'Good', upTo: 50 },
  { id: 'satisfactory', label: 'Satisfactory', upTo: 100 },
  { id: 'moderate', label: 'Moderate', upTo: 200 },
  { id: 'poor', label: 'Poor', upTo: 300 },
  { id: 'veryPoor', label: 'Very poor', upTo: 400 },
  { id: 'severe', label: 'Severe', upTo: 500 },
];

// CPCB breakpoints, 24-hour averages in µg/m³: [concentration low, high, AQI low, high].
const PM25: [number, number, number, number][] = [[0, 30, 0, 50], [31, 60, 51, 100], [61, 90, 101, 200], [91, 120, 201, 300], [121, 250, 301, 400], [251, 380, 401, 500]];
const PM10: [number, number, number, number][] = [[0, 50, 0, 50], [51, 100, 51, 100], [101, 250, 101, 200], [251, 350, 201, 300], [351, 430, 301, 400], [431, 510, 401, 500]];

function subIndex(c: number, table: [number, number, number, number][]): number {
  const x = Math.max(0, Math.round(c));
  for (const [cl, ch, il, ih] of table) if (x <= ch) return Math.round(il + ((ih - il) / (ch - cl)) * (Math.max(x, cl) - cl));
  return 500; // beyond the scale
}

/** The Indian AQI: the higher of the PM2.5 and PM10 sub-indices. */
export function indianAqi(pm25: number, pm10: number): number {
  return Math.min(500, Math.max(subIndex(pm25, PM25), subIndex(pm10, PM10)));
}

export const airCat = (aqi: number): AirCat => (AIR_CATS.find(c => aqi <= c.upTo) ?? AIR_CATS[AIR_CATS.length - 1]).id;
export const airLabel = (c: AirCat) => AIR_CATS.find(x => x.id === c)!.label;

/** Average the last 24 hourly values up to now (skipping gaps). */
export function last24(times: string[], values: (number | null)[], now = Date.now()): number | null {
  const v: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]);
    if (t <= now && t > now - 24 * 3600_000 && values[i] != null) v.push(values[i]!);
  }
  return v.length >= 6 ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** Fetch the air at a place (latitude and longitude rounded to about 1 km first). */
export async function fetchAir(lat: number, lon: number, place?: string): Promise<AirReading> {
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${r2(lat)}&longitude=${r2(lon)}&hourly=pm10,pm2_5&past_days=1&forecast_days=1&timezone=GMT`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not get the air quality just now.');
  const j = await res.json() as { hourly?: { time: string[]; pm10: (number | null)[]; pm2_5: (number | null)[] } };
  const h = j.hourly;
  if (!h) throw new Error('Could not get the air quality just now.');
  const times = h.time.map(t => `${t}Z`);
  const pm25 = last24(times, h.pm2_5), pm10 = last24(times, h.pm10);
  if (pm25 == null || pm10 == null) throw new Error('No air quality data for this place yet.');
  const aqi = indianAqi(pm25, pm10);
  return { aqi, cat: airCat(aqi), pm25: Math.round(pm25), pm10: Math.round(pm10), place, at: new Date().toISOString() };
}

/** What a poor-air day means for Myra's suggestions. */
const ADVICE: Record<AirCat, string> = {
  good: '',
  satisfactory: '',
  moderate: 'sensitive people (asthma, heart, elderly, children) keep long or hard outdoor exercise short',
  poor: 'move indoors (indoor walk, yoga, stairs) instead of outdoor running; strong breathing practices (Kapalbhati, Bhastrika) indoors only with windows closed; warm fluids, tulsi-ginger tea, jaggery, vitamin C fruit (amla, orange, guava); wash the face after being outside',
  veryPoor: 'exercise indoors only; gentle breathing (Anulom Vilom, Bhramari) indoors; keep windows closed at peak hours; a mask (N95) outside; warm fluids, tulsi-ginger tea, amla, jaggery; wash the face after being outside',
  severe: 'stay indoors as much as possible; indoor gentle movement only; gentle breathing only, no Kapalbhati or Bhastrika; N95 mask outside; warm fluids, amla, tulsi; see a doctor if breathless or chest feels tight',
};

/** One line for Myra. */
export function airLine(a?: AirReading): string {
  if (!a) return '';
  const adv = ADVICE[a.cat];
  return `Air quality${a.place ? ` in ${a.place}` : ''}: Indian AQI ${a.aqi} (${airLabel(a.cat)}; PM2.5 ${a.pm25}, PM10 ${a.pm10} µg/m³, 24-hour average).${adv ? ` Fit suggestions to it: ${adv}.` : ''}`;
}
