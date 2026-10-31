// Air quality on Today (one quiet line under the greeting) and in Body › Movement (a folded row with the details).
// Founder, 31 Oct 2026 (decision 0036): picked up by itself from the phone's location; Myra fits her suggestions to it.
// Needs build 13+ (expo-location); older builds simply show nothing. The web version uses the browser's location.

import { useEffect } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import { airLabel, fetchAir, type AirReading } from '../lib/air';
import { todayISO } from '../lib/dates';
import { tr } from '../lib/i18n';
import { optional } from '../lib/native';
import { useHeal } from '../lib/store';
import { colors } from '../theme';
import { Expandable, Note } from './ui';

let Location: typeof import('expo-location') | null = null;
Location = optional(['ExpoLocation'], () => require('expo-location'));

/** Soft colours, never red (founder, 31 Oct 2026): sage when good, sand when middling, a warm peach when poor. */
export const airTone = (a: AirReading) => (a.aqi <= 100 ? '#7FA86F' : a.aqi <= 200 ? '#D9A85B' : '#E08E6B');

const HOUR = 3600_000;

async function where(): Promise<{ lat: number; lon: number; place?: string } | null> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
    return new Promise(res => navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), () => res(null), { maximumAge: HOUR, timeout: 10000 }));
  }
  if (!Location) return null;
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = (await Location.getLastKnownPositionAsync({ maxAge: HOUR })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  let place: string | undefined;
  try {
    const g = (await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }))[0];
    place = g?.city ?? g?.district ?? g?.subregion ?? undefined;
  } catch { /* the name is optional */ }
  return { lat: pos.coords.latitude, lon: pos.coords.longitude, place };
}

/** Keeps today's air reading fresh: when the app opens or comes back, at most once an hour. */
export function useAirRefresh() {
  const { days, updateOn } = useHeal();
  const today = todayISO();
  const last = days[today]?.air?.at;
  useEffect(() => {
    let busy = false;
    const check = async () => {
      if (busy) return;
      const at = last ? Date.parse(last) : 0;
      if (Date.now() - at < HOUR) return;
      busy = true;
      try {
        const w = await where();
        if (w) { const a = await fetchAir(w.lat, w.lon, w.place); updateOn(todayISO(), d => { d.air = a; }); }
      } catch { /* try again next time */ } finally { busy = false; }
    };
    check();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check(); });
    return () => sub.remove();
  }, [last, updateOn]);
}

/** Today: one quiet line under the greeting, e.g. "AQI 182 · Moderate · Bengaluru". */
export function AirLine() {
  useAirRefresh();
  const { day } = useHeal();
  const a = day.air;
  // Only when the air is worse than Satisfactory (founder, 31 Oct 2026); good air needs no line.
  if (!a || a.aqi <= 100) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: airTone(a) }} />
      <Text style={{ fontSize: 13, color: colors.muted }}>{`AQI ${a.aqi} · ${tr(airLabel(a.cat))}${a.place ? ` · ${a.place}` : ''}`}</Text>
    </View>
  );
}

/** Body › Movement: a folded row with the details. */
export function AirRow() {
  const { day } = useHeal();
  const a = day.air;
  if (!a) return null;
  return (
    <Expandable icon="leaf-outline" color={airTone(a)} title={tr('Air quality')} status={`AQI ${a.aqi} · ${tr(airLabel(a.cat))}`}>
      <View style={{ gap: 6, paddingBottom: 10 }}>
        <Text style={{ color: colors.ink }}>{`PM2.5 ${a.pm25} · PM10 ${a.pm10} µg/m³`}</Text>
        <Note>{a.aqi > 200 ? tr('Poor air: Myra moves your exercise indoors today.') : a.aqi > 100 ? tr('Keep long, hard outdoor workouts short today.') : tr('Good air for moving outdoors today.')}</Note>
        <Note>{tr('Indian AQI from the last 24 hours, near {place}. Source: Open-Meteo.', { place: a.place ?? tr('you') })}</Note>
      </View>
    </Expandable>
  );
}
