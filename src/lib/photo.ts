// Make a photo small enough to send to the AI (JPEG, base64). Shared by meal photos, Myra and the "+" in text boxes.
import * as ImageManipulator from 'expo-image-manipulator';
import { tr } from './i18n';

export async function shrink(uri: string, fallback: string | null | undefined, mime: string | null | undefined, width = 1024) {
  try {
    const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
    ctx.resize({ width, height: null });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, base64: true, compress: 0.8 });
    if (out.base64) return { data: out.base64, type: 'image/jpeg' };
  } catch { /* fall back to the picker's own copy */ }
  if (fallback) return { data: fallback, type: mime ?? 'image/jpeg' };
  throw new Error(tr('Could not read that photo. Try another one.'));
}
