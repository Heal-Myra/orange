// Paste a copied photo into Myra's chat (founder, 22 Nov 2026: "Not able to paste photo in Myra chatbox"). A phone's
// text box cannot take a pasted picture, so the app reads the copied photo itself: a "Paste photo" chip appears when a
// photo is on the clipboard, and the + menu always offers it.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { optional } from './native';
import { tr } from './i18n';

const Clip = optional(['ExpoClipboard'], () => require('expo-clipboard') as typeof import('expo-clipboard'));
export const canPaste = !!Clip;

/** True when a photo is waiting on the clipboard; checked on open and each time the app comes back. Never reads it. */
export function useCopiedPhoto(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    if (!Clip) return;
    const check = () => { Clip.hasImageAsync().then(setHas).catch(() => setHas(false)); };
    check();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check(); });
    const t = setInterval(check, 4000);
    return () => { sub.remove(); clearInterval(t); };
  }, []);
  return has;
}

/** The copied photo as plain base64 JPEG with a data address for showing it, or a reason it could not be read. */
export async function readCopiedPhoto(): Promise<{ uri: string; base64: string } | { error: string }> {
  if (!Clip) return { error: tr('Pasting photos comes with the next app update. Use Photos for now.') };
  try {
    const img = await Clip.getImageAsync({ format: 'jpeg', jpegQuality: 0.8 });
    if (!img?.data) return { error: tr('No photo is copied. Copy a photo first, then tap Paste photo.') };
    const base64 = img.data.replace(/^data:image\/[a-z]+;base64,/, '');
    return { uri: img.data.startsWith('data:') ? img.data : `data:image/jpeg;base64,${base64}`, base64 };
  } catch {
    return { error: tr('Could not read the copied photo. Try Photos instead.') };
  }
}
