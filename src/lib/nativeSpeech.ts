// Speech to text in the iPhone app, using Apple's own recognition through expo-speech-recognition.
// Wrapped in the same small shape as the browser's SpeechRecognition, so the meal card uses one code path.

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { lang } from './i18n';

type Listener = { remove: () => void };

export class NativeSpeech {
  lang = lang() === 'hi' ? 'hi-IN' : 'en-IN';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  private subs: Listener[] = [];

  async start() {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) { this.onerror?.(); this.onend?.(); return; }
    this.subs = [
      ExpoSpeechRecognitionModule.addListener('result', e => {
        if (!e.isFinal) return;
        const t = e.results?.[0]?.transcript ?? '';
        if (t) this.onresult?.({ results: [[{ transcript: t }]] });
      }),
      ExpoSpeechRecognitionModule.addListener('error', () => this.onerror?.()),
      ExpoSpeechRecognitionModule.addListener('end', () => { this.cleanup(); this.onend?.(); }),
    ];
    ExpoSpeechRecognitionModule.start({ lang: this.lang, interimResults: false, continuous: false, addsPunctuation: true });
  }

  abort() { try { ExpoSpeechRecognitionModule.abort(); } catch { /* not running */ } this.cleanup(); }

  private cleanup() { this.subs.forEach(s => s.remove()); this.subs = []; }
}
