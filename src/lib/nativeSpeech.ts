// Speech to text in the iPhone app, using Apple's own recognition through expo-speech-recognition.
// Wrapped in the same small shape as the browser's SpeechRecognition, so the meal card uses one code path.
// Errors carry a reason so the card can say exactly what to fix (founder, 20 Oct 2026: Speak "was not able to listen").

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { lang } from './i18n';

type Listener = { remove: () => void };
export type SpeechProblem = 'permission' | 'dictation-off' | 'no-speech' | 'busy' | 'other';

export class NativeSpeech {
  lang = lang() === 'hi' ? 'hi-IN' : 'en-IN';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((problem: SpeechProblem) => void) | null = null;
  onend: (() => void) | null = null;
  private subs: Listener[] = [];
  private heard = '';

  async start() {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return this.fail('permission');
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return this.fail('dictation-off');
      this.heard = '';
      this.subs = [
        ExpoSpeechRecognitionModule.addListener('result', e => {
          const t = e.results?.[0]?.transcript ?? '';
          if (t) this.heard = t;
          if (e.isFinal && t) { this.heard = ''; this.onresult?.({ results: [[{ transcript: t }]] }); }
        }),
        ExpoSpeechRecognitionModule.addListener('error', e => {
          const code = String(e.error);
          this.fail(code === 'not-allowed' ? 'permission'
            : code === 'service-not-allowed' || code === 'language-not-supported' ? 'dictation-off'
            : code === 'no-speech' || code === 'speech-timeout' ? 'no-speech'
            : code === 'busy' || code === 'audio-capture' ? 'busy' : 'other');
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => {
          // Some phones end without a "final" result; use the last words heard.
          if (this.heard) { const t = this.heard; this.heard = ''; this.onresult?.({ results: [[{ transcript: t }]] }); }
          this.cleanup(); this.onend?.();
        }),
      ];
      // Interim results on, so words heard before a pause are never lost.
      ExpoSpeechRecognitionModule.start({ lang: this.lang, interimResults: true, continuous: false, addsPunctuation: true });
    } catch {
      this.fail('other');
    }
  }

  /** Stop listening but keep what was heard (it arrives as a result, then end). */
  stop() { try { ExpoSpeechRecognitionModule.stop(); } catch { this.cleanup(); this.onend?.(); } }

  abort() { try { ExpoSpeechRecognitionModule.abort(); } catch { /* not running */ } this.cleanup(); }

  private fail(p: SpeechProblem) { this.cleanup(); this.onerror?.(p); this.onend?.(); }
  private cleanup() { this.subs.forEach(s => s.remove()); this.subs = []; }
}
