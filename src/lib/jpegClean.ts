// Photos leave the phone clean (founder, 10 Nov 2026; decision 0056): before any photo is sent to Myra, the hidden details
// a phone stores inside it are removed: where it was taken (GPS), the phone's make and model, the time, and any other
// EXIF, XMP or IPTC notes. Only the picture itself goes. Works on the base64 text the app already sends, with no native code.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = (() => { const t = new Uint8Array(128); for (let i = 0; i < B64.length; i++) t[B64.charCodeAt(i)] = i; return t; })();

function decode(b64: string): Uint8Array {
  const s = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((s.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < s.length; i += 4) {
    const a = LOOKUP[s.charCodeAt(i)], b = LOOKUP[s.charCodeAt(i + 1)];
    const c = i + 2 < s.length ? LOOKUP[s.charCodeAt(i + 2)] : 0, d = i + 3 < s.length ? LOOKUP[s.charCodeAt(i + 3)] : 0;
    const n = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (i + 2 < s.length && o < out.length) out[o++] = (n >> 8) & 255;
    if (i + 3 < s.length && o < out.length) out[o++] = n & 255;
  }
  return out.subarray(0, o);
}

function encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return out;
}

/** Segments that carry hidden notes: APP1 (EXIF with GPS, and XMP) and APP13 (IPTC, which can hold a place). */
const DROP = new Set([0xe1, 0xed]);

/** The same JPEG without its hidden notes. Anything that is not a JPEG, or cannot be read, comes back unchanged. */
export function cleanJpeg(b64: string): string {
  try {
    const src = decode(b64);
    if (src.length < 4 || src[0] !== 0xff || src[1] !== 0xd8) return b64;
    const parts: Uint8Array[] = [src.subarray(0, 2)];
    let i = 2, dropped = false;
    while (i + 4 <= src.length) {
      if (src[i] !== 0xff) return b64; // not where a marker should be: leave the photo as it was
      const m = src[i + 1];
      if (m === 0xda) { parts.push(src.subarray(i)); i = src.length; break; } // the picture itself starts here
      if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) { parts.push(src.subarray(i, i + 2)); i += 2; continue; }
      const len = (src[i + 2] << 8) | src[i + 3];
      if (len < 2 || i + 2 + len > src.length) return b64;
      if (DROP.has(m)) dropped = true; else parts.push(src.subarray(i, i + 2 + len));
      i += 2 + len;
    }
    if (!dropped) return b64;
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return encode(out);
  } catch { return b64; }
}

/** The payload with every JPEG photo stripped of its hidden notes (GPS, phone, time). PDFs and text are untouched. */
export function cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const jpeg = (t: unknown) => typeof t !== 'string' || /jpe?g/i.test(t);
  const out = { ...payload };
  if (typeof out.image_base64 === 'string' && jpeg(out.media_type)) out.image_base64 = cleanJpeg(out.image_base64);
  const att = out.attachment as { kind?: string; media_type?: string; data?: string } | undefined;
  if (att?.kind === 'image' && typeof att.data === 'string' && jpeg(att.media_type)) out.attachment = { ...att, data: cleanJpeg(att.data) };
  return out;
}
