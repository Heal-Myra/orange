// @ts-nocheck: a Node-only check run by vitest (the app has no Node types).
// Every fixed text shown with tr('…') must have Hindi in src/lib/hi.ts.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HI } from './hi';

const walk = (d: string): string[] => fs.readdirSync(d).flatMap(f => {
  const p = path.join(d, f);
  return fs.statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.includes('.test.') && f !== 'hi.ts' && f !== 'i18n.tsx' ? [p] : [];
});

describe('Hindi', () => {
  it('has a translation for every tr() text', () => {
    const missing: string[] = [];
    for (const f of walk(path.join(__dirname, '..'))) {
      const s = fs.readFileSync(f, 'utf8');
      for (const m of s.matchAll(/\btr\('((?:[^'\\]|\\.)*)'/g)) {
        const key = m[1].replace(/\\'/g, "'");
        if (!(key in HI) && key !== 'English text') missing.push(`${path.basename(f)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
