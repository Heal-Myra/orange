// @ts-nocheck: a Node-only check run by vitest (Buffer).
import { describe, expect, it } from 'vitest';
import { cleanJpeg, cleanPayload } from './jpegClean';

const seg = (m: number, body: number[]) => [0xff, m, (body.length + 2) >> 8, (body.length + 2) & 255, ...body];
const ascii = (s: string) => [...s].map(c => c.charCodeAt(0));
const jpeg = [0xff, 0xd8, ...seg(0xe0, ascii('JFIF\0')), ...seg(0xe1, ascii('Exif\0\0GPS 28.6N 77.2E iPhone 15 Pro')),
  ...seg(0xed, ascii('Photoshop 3.0 Delhi')), ...seg(0xdb, [0, 1, 2, 3]), 0xff, 0xda, 0, 2, 9, 9, 9, 0xff, 0xd9];
const b64 = (a: number[]) => Buffer.from(a).toString('base64');
const text = (s: string) => Buffer.from(s, 'base64').toString('latin1');

describe('Photos leave the phone clean', () => {
  it('removes the location, phone and other hidden notes', () => {
    const out = text(cleanJpeg(b64(jpeg)));
    expect(out).not.toContain('GPS');
    expect(out).not.toContain('iPhone');
    expect(out).not.toContain('Delhi');
    expect(out).toContain('JFIF');
    expect(out.endsWith('\x09\x09\x09\xff\xd9')).toBe(true);
  });
  it('leaves other files and a clean photo unchanged', () => {
    expect(cleanJpeg(b64([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]))).toBe(b64([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]));
    const clean = [0xff, 0xd8, ...seg(0xe0, ascii('JFIF\0')), 0xff, 0xda, 0, 2, 1, 0xff, 0xd9];
    expect(cleanJpeg(b64(clean))).toBe(b64(clean));
  });
  it('cleans every photo the app sends to Myra', () => {
    const p = cleanPayload({ image_base64: b64(jpeg), media_type: 'image/jpeg', hint: 'x' });
    expect(text(p.image_base64 as string)).not.toContain('GPS');
    const a = cleanPayload({ attachment: { kind: 'image', media_type: 'image/jpeg', data: b64(jpeg) } });
    expect(text((a.attachment as { data: string }).data)).not.toContain('GPS');
    const pdf = cleanPayload({ attachment: { kind: 'pdf', media_type: 'application/pdf', data: 'JVBERi0x' } });
    expect((pdf.attachment as { data: string }).data).toBe('JVBERi0x');
  });
});
