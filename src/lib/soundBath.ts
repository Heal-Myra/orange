// Sound bath (founder, 13 Nov 2026): six calm sounds made in code (scripts/make-sounds.py; nothing to license), up to
// two mixed, for a set time or "until I sleep". Each fades in over 6 s and out over the last minute (3 minutes for
// "until I sleep", which stops after 45 minutes) so the ending never wakes anyone.

import { optional } from './native';

const Audio = optional(['ExpoAudio'], () => require('expo-audio') as typeof import('expo-audio'));

export type SoundId = 'bowls' | 'bells' | 'rain' | 'fan' | 'sea' | 'om';
export const SOUNDS: { id: SoundId; icon: string; name: string; file: number }[] = [
  { id: 'bowls', icon: '🥣', name: 'Singing bowls', file: require('../../assets/sounds/bowls.m4a') },
  { id: 'bells', icon: '🔔', name: 'Temple bells', file: require('../../assets/sounds/bells.m4a') },
  { id: 'rain', icon: '🌧', name: 'Rain on a tin roof', file: require('../../assets/sounds/rain.m4a') },
  { id: 'fan', icon: '🌀', name: 'Ceiling fan', file: require('../../assets/sounds/fan.m4a') },
  { id: 'sea', icon: '🌊', name: 'Sea at night', file: require('../../assets/sounds/sea.m4a') },
  { id: 'om', icon: '🕉', name: 'Om drone', file: require('../../assets/sounds/om.m4a') },
];
export const LENGTHS = [10, 20, 45, 0] as const; // 0 = until I sleep
export const SLEEP_MAX = 45;

type Player = ReturnType<NonNullable<typeof Audio>['createAudioPlayer']>;

/** The playing bath: start, change the mix, pause, stop. Volume ramps run on a 200 ms tick. */
export class Bath {
  private players = new Map<SoundId, Player>();
  private tick?: ReturnType<typeof setInterval>;
  private playedMs = 0;
  private last = Date.now();
  paused = false;
  constructor(public total: number, private onTick: (leftSec: number, playedMin: number) => void, private onEnd: (playedMin: number) => void) {}

  get available() { return !!Audio; }
  private target(sec: number) {
    const fadeIn = Math.min(1, sec / 6);
    const left = this.total * 60 - sec, fade = this.total >= SLEEP_MAX ? 180 : 60;
    return 0.85 * fadeIn * Math.max(0, Math.min(1, left / fade));
  }
  setSounds(ids: SoundId[]) {
    if (!Audio) return;
    Audio.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' } as never).catch(() => {});
    for (const [id, p] of this.players) if (!ids.includes(id)) { try { p.pause(); p.remove(); } catch { /* fine */ } this.players.delete(id); }
    for (const id of ids) if (!this.players.has(id)) {
      const p = Audio.createAudioPlayer(SOUNDS.find(s => s.id === id)!.file);
      p.loop = true; p.volume = 0;
      if (!this.paused) p.play();
      this.players.set(id, p);
    }
  }
  start(ids: SoundId[]) {
    this.setSounds(ids);
    this.last = Date.now();
    this.tick = setInterval(() => {
      const now = Date.now();
      if (!this.paused) this.playedMs += now - this.last;
      this.last = now;
      const sec = this.playedMs / 1000, mix = this.players.size > 1 ? 0.75 : 1;
      for (const p of this.players.values()) p.volume = this.target(sec) * mix;
      this.onTick(Math.max(0, Math.round(this.total * 60 - sec)), Math.floor(sec / 60));
      if (sec >= this.total * 60) this.stop();
    }, 200);
  }
  pause() { this.paused = true; for (const p of this.players.values()) p.pause(); }
  resume() { this.paused = false; this.last = Date.now(); for (const p of this.players.values()) p.play(); }
  private ended = false;
  stop() {
    if (this.ended) return;
    this.ended = true;
    if (this.tick) clearInterval(this.tick);
    this.tick = undefined;
    for (const p of this.players.values()) { try { p.pause(); p.remove(); } catch { /* fine */ } }
    this.players.clear();
    this.onEnd(Math.floor(this.playedMs / 60000));
  }
}
