// Spaces capture (founder, 10 Nov 2026; decisions 0055, 0056): a photo, or a short walk-round video, made ready for Myra
// on the phone. From build 14 the phone itself pulls a few still frames out of a video (the video never leaves the
// phone) and blurs any faces before anything is sent. Older builds: photos only, sent as before (hidden notes removed).

import * as ImagePicker from 'expo-image-picker';
import SpaceCamera from '../../modules/space-camera';
import { tr } from './i18n';
import { shrink } from './photo';

/** The phone can read videos and blur faces (build 14 and later). */
export const hasSpaceCamera = () => !!SpaceCamera;

export const FRAMES = 4;

export interface Prepared { data: string; type: string; local: string; ratio?: number } // local: blurred file on the phone
export interface Capture { images: Prepared[]; faces: number }

/** Blur faces (when the build can), then make it small for the AI. */
async function prepare(uri: string, base64: string | null | undefined, mime: string | null | undefined, ratio?: number): Promise<{ img: Prepared; faces: number }> {
  let local = uri, faces = 0;
  if (SpaceCamera) {
    try { const b = await SpaceCamera.blurFacesAsync(uri); faces = b.faces; if (b.faces > 0) local = b.uri; if (b.width && b.height) ratio = b.width / b.height; }
    catch { /* no blur on this photo: it is still sent clean of hidden notes */ }
  }
  const small = await shrink(local, local === uri ? base64 : null, local === uri ? mime : 'image/jpeg');
  return { img: { ...small, local, ratio }, faces };
}

/** Ask the person for a photo or video. `from`: the camera for a photo, the camera for a video, or their library. */
export async function captureSpace(from: 'photo' | 'video' | 'library'): Promise<Capture | null | { error: string }> {
  const video = hasSpaceCamera();
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: from === 'video' ? ['videos'] : from === 'library' && video ? ['images', 'videos'] : ['images'],
    quality: 0.7, base64: from === 'photo' || (from === 'library' && !video), videoMaxDuration: 30,
  };
  if (from !== 'library') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: tr('Camera permission is needed. You can choose a photo instead.') };
  }
  const res = from === 'library' ? await ImagePicker.launchImageLibraryAsync(opts) : await ImagePicker.launchCameraAsync(opts);
  if (res.canceled) return null;
  const a = res.assets[0];
  if (a.type === 'video') {
    if (!SpaceCamera) return { error: tr('Videos come with the next app version. A photo works now.') };
    const frames = await SpaceCamera.framesAsync(a.uri, FRAMES, 1280).catch(() => []);
    if (!frames.length) return { error: tr('Could not read that video. Try a photo instead.') };
    const out: Prepared[] = [];
    let faces = 0;
    for (const f of frames) {
      const p = await prepare(f.uri, null, 'image/jpeg', f.width && f.height ? f.width / f.height : undefined);
      out.push(p.img); faces += p.faces;
    }
    return { images: out, faces };
  }
  const p = await prepare(a.uri, a.base64, a.mimeType, a.width && a.height ? a.width / a.height : undefined);
  return { images: [p.img], faces: p.faces };
}

/** The small copy kept on the phone (the frame Myra chose), as a data URI. */
export async function keepCopy(img: Prepared): Promise<string | null> {
  const small = await shrink(img.local, null, null, 480).catch(() => null);
  return small ? `data:${small.type};base64,${small.data}` : null;
}
