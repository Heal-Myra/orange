// "+" in a text box: attach a photo from the camera, the photo library or Files, and Myra reads it into the box
// (founder, 30 Oct 2026: "upload a picture from notebooks and it can auto populate the task list … a simple plus sign which
// when clicked asks attach from file or camera. Also in all chat/text boxes"). Like the + in Claude's chat box.
//
// useAttach(read) gives the + button and a status line (the picture with "Reading…" while Myra works, then any message).
// `read` gets the picture (JPEG, base64) and returns an optional message to show; throwing shows the error.

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { tr } from '../lib/i18n';
import { optional } from '../lib/native';
import { colors } from '../theme';
import { shrink } from '../lib/photo';

let DocumentPicker: typeof import('expo-document-picker') | null = null;
DocumentPicker = optional(['ExpoDocumentPicker'], () => require('expo-document-picker'));

export interface Picked { data: string; media_type: string; uri: string }

/** Handwriting needs more detail than a meal photo. */
const NOTE_WIDTH = 1600;

export function useAttach(read: (img: Picked) => Promise<string | null | void>, opts?: { size?: number }): { button: ReactNode; status: ReactNode; busy: boolean } {
  const { session } = useAuth();
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);

  const run = async (uri0: string, b64: string | null | undefined, mime: string | null | undefined) => {
    setUri(uri0); setBusy(true); setMsg(null);
    try {
      const img = await shrink(uri0, b64, mime, NOTE_WIDTH);
      const said = await read({ data: img.data, media_type: img.type, uri: uri0 });
      setMsg(said ? { text: said } : null);
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : tr('Could not read that photo. Try another one.'), bad: true });
    } finally { setBusy(false); setUri(null); }
  };

  const pick = async (from: 'camera' | 'photos' | 'files') => {
    setMenu(false); setMsg(null);
    // Let the sheet close before iPhone opens the picker.
    await new Promise(r => setTimeout(r, Platform.OS === 'ios' ? 350 : 0));
    if (from === 'files') {
      if (!DocumentPicker) { setMsg({ text: tr('Files come with the next app update. Camera and Photos work now.'), bad: true }); return; }
      const res = await DocumentPicker.getDocumentAsync({ type: ['image/*'], copyToCacheDirectory: true, multiple: false });
      if (res.canceled || !res.assets?.length) return;
      await run(res.assets[0].uri, null, res.assets[0].mimeType);
      return;
    }
    if (from === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setMsg({ text: tr('Camera permission is needed. You can choose a photo instead.'), bad: true }); return; }
    }
    const o: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, base64: true };
    const res = from === 'camera' ? await ImagePicker.launchCameraAsync(o) : await ImagePicker.launchImageLibraryAsync(o);
    if (res.canceled) return;
    const a = res.assets[0];
    await run(a.uri, a.base64, a.mimeType);
  };

  const size = opts?.size ?? 44;
  const row = (icon: React.ComponentProps<typeof Ionicons>['name'], label: string, on: () => void) => (
    <Pressable onPress={on} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: pressed ? colors.tint : 'transparent' })}>
      <Ionicons name={icon} size={22} color={colors.ink} />
      <Text style={{ fontSize: 16, color: colors.ink }}>{label}</Text>
    </Pressable>
  );

  const button = !session ? null : (
    <>
      <Pressable onPress={() => setMenu(true)} disabled={busy} accessibilityLabel={tr('Attach a photo')} hitSlop={6}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.5 : 1 }}>
        <Ionicons name="add" size={Math.round(size * 0.55)} color={colors.ink} />
      </Pressable>
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable onPress={() => setMenu(false)} style={{ flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, paddingBottom: 34 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 6 }} />
            <Text style={{ paddingHorizontal: 18, paddingVertical: 8, color: colors.muted, fontSize: 13 }}>{tr('Myra reads the photo and fills it in for you.')}</Text>
            {Platform.OS !== 'web' ? row('camera-outline', tr('Camera'), () => pick('camera')) : null}
            {row('images-outline', tr('Photos'), () => pick('photos'))}
            {Platform.OS !== 'web' ? row('folder-outline', tr('Files'), () => pick('files')) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );

  const status = busy && uri ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, backgroundColor: colors.tint }}>
      <Image source={{ uri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
      <ActivityIndicator color={colors.insight} />
      <Text style={{ color: colors.insight, fontWeight: '600', flex: 1 }}>{tr('Myra is reading your photo…')}</Text>
    </View>
  ) : msg ? <Text style={{ color: msg.bad ? colors.bad : colors.insight, fontSize: 13 }}>{msg.text}</Text> : null;

  return { button, status, busy };
}
