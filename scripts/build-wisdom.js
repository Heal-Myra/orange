// Builds assets/data/wisdom.json for Daily Wisdom from free-to-use sources.
const fs = require('fs'); const path = require('path');
const g = require('gurmukhi-utils');
const out = {};
const DL = '/tmp/claude-0/dl';

// --- Christian: King James Version (public domain in India and the US). Curated passages.
const kjvText = fs.readFileSync(`${DL}/bible/package/json/verses-1769.js`, 'utf8').replace(/^export default\s*/, '').replace(/;?\s*$/, '');
const kjv = JSON.parse(kjvText);
const clean = t => t.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim();
const range = (book, ch, a, b) => { const v = []; for (let i = a; i <= b; i++) { const t = kjv[`${book} ${ch}:${i}`]; if (!t) throw new Error(`missing ${book} ${ch}:${i}`); v.push(clean(t)); } return v.join(' '); };
const C = [];
const add = (book, ch, a, b = a) => C.push({ ref: `${book} ${ch}:${a}${b > a ? '–' + b : ''}`, english: range(book, ch, a, b) });
for (let i = 3; i <= 12; i++) add('Matthew', 5, i);
add('Matthew', 5, 14, 16); add('Matthew', 5, 43, 45); add('Matthew', 6, 19, 21); add('Matthew', 6, 25, 27); add('Matthew', 6, 33, 34); add('Matthew', 7, 1, 2); add('Matthew', 7, 7, 8); add('Matthew', 7, 12); add('Matthew', 11, 28, 30);
add('Psalms', 23, 1, 6); add('Psalms', 46, 1, 3); add('Psalms', 46, 10); add('Psalms', 121, 1, 8); add('Psalms', 34, 18); add('Psalms', 37, 7, 8); add('Psalms', 118, 24); add('Psalms', 139, 14); add('Psalms', 90, 12); add('Psalms', 55, 22);
add('1 Corinthians', 13, 4, 7); add('Romans', 12, 9, 13); add('Romans', 12, 17, 21); add('Galatians', 5, 22, 23); add('Philippians', 4, 6, 8); add('James', 1, 19, 20); add('Micah', 6, 8); add('Ecclesiastes', 3, 1, 8); add('Isaiah', 40, 31); add('Lamentations', 3, 22, 23); add('1 John', 4, 18); add('Colossians', 3, 12, 14); add('Ephesians', 4, 31, 32); add('Hebrews', 13, 2); add('1 Peter', 5, 7);
for (const [ch, v] of [[3,5],[3,27],[4,23],[10,12],[11,25],[12,25],[13,20],[14,30],[15,1],[15,13],[15,16],[15,17],[16,3],[16,9],[16,24],[16,32],[17,17],[17,22],[18,21],[19,11],[19,17],[22,1],[25,21],[27,1],[27,17],[31,26]]) add('Proverbs', ch, v);
out.christian = { name: 'Christianity', source: 'Holy Bible, King James Version (public domain)', items: C };

// --- Islam: Qur'an, Arabic Uthmani text with English transliteration (Tanzil). Meaning is explained by the AI, not a copyrighted translation.
const Q = JSON.parse(fs.readFileSync(`${DL}/quran/package/dist/quran_transliteration.json`, 'utf8'));
const ayah = (s, a, b = a) => { const sura = Q[s - 1]; const vs = sura.verses.filter(v => v.id >= a && v.id <= b); if (vs.length !== b - a + 1) throw new Error(`missing ${s}:${a}`);
  return { ref: `Qur'an ${s}:${a}${b > a ? '–' + b : ''} (${sura.transliteration})`, original: vs.map(v => v.text).join(' ۝ '), translit: vs.map(v => v.transliteration).join(' / '), lang: 'ar' }; };
out.islam = { name: 'Islam', source: "The Holy Qur'an, Arabic text (Uthmani) and transliteration from Tanzil.net via quran-json (CC BY 4.0)", items: [
  ayah(1, 1, 7), ayah(2, 255), ayah(2, 286), ayah(93, 1, 11), ayah(94, 1, 8), ayah(103, 1, 3), ayah(112, 1, 4), ayah(2, 153), ayah(2, 186), ayah(13, 28),
  ayah(3, 139), ayah(39, 53), ayah(65, 2, 3), ayah(49, 13), ayah(17, 23, 24), ayah(31, 18, 19), ayah(25, 63), ayah(16, 90), ayah(4, 135), ayah(5, 8),
  ayah(2, 177), ayah(55, 13), ayah(2, 152), ayah(3, 134), ayah(41, 34), ayah(49, 12), ayah(57, 20), ayah(20, 114), ayah(29, 69), ayah(64, 16),
  ayah(8, 46), ayah(3, 159), ayah(2, 45), ayah(14, 7), ayah(50, 16), ayah(57, 4), ayah(24, 35), ayah(42, 40), ayah(9, 51), ayah(67, 2),
] };

// --- Sikh: Japji Sahib, Gurmukhi (public domain, Shabad OS), transliteration made by code (gurmukhi-utils, MIT).
const Database = require('better-sqlite3');
const db = new Database(`${DL}/sikh/package/build/database.sqlite`, { readonly: true });
const rows = db.prepare('select l.shabad_id s, l.gurmukhi t from bani_lines b join lines l on l.id=b.line_id where b.bani_id=1 order by b.line_group, l.order_id').all();
const groups = []; let cur = null;
for (const r of rows) { if (!cur || cur.s !== r.s) { cur = { s: r.s, lines: [] }; groups.push(cur); } cur.lines.push(g.toUnicode(r.t.replace(/[;.,]/g, ''))); }
out.sikh = { name: 'Sikhi', source: 'Japji Sahib, Sri Guru Granth Sahib (Gurmukhi: public domain, via Shabad OS)', items: groups.map((gr, i) => ({
  ref: i === 0 ? 'Japji Sahib · Mool Mantar and Pauri 1' : i === groups.length - 1 ? 'Japji Sahib · Salok' : `Japji Sahib · Pauri ${i + 1}`,
  original: gr.lines.join('\n'), translit: gr.lines.map(l => g.toEnglish(l)).join('\n'), lang: 'pa' })) };

// --- Buddhist: Dhammapada, Pali root and English by Bhikkhu Sujato (SuttaCentral, CC0).
const B = []; const files = fs.readdirSync(`${DL}/bud`).filter(f => f.includes('translation'));
const byVerse = {};
for (const f of files) {
  const tr = JSON.parse(fs.readFileSync(`${DL}/bud/${f}`, 'utf8'));
  const root = JSON.parse(fs.readFileSync(`${DL}/bud/${f.replace('_translation-en-sujato', '_root-pli-ms')}`, 'utf8'));
  for (const [k, v] of Object.entries(tr)) { const m = k.match(/^dhp(\d+):(\d+)$/); if (!m) continue; const n = +m[1]; (byVerse[n] ??= { en: [], pli: [] }).en.push(v.trim()); if (root[k]) byVerse[n].pli.push(root[k].trim()); }
}
for (const n of Object.keys(byVerse).map(Number).sort((a, b) => a - b)) B.push({ ref: `Dhammapada ${n}`, original: byVerse[n].pli.join('\n'), english: byVerse[n].en.join('\n'), lang: 'pi' });
out.buddhist = { name: 'Buddhism', source: 'Dhammapada, Pali text and English translation by Bhikkhu Sujato (SuttaCentral, CC0 public domain)', items: B };

// --- Universal: sayings across traditions that have plain English (Dhammapada and the Bible), alternating.
const U = []; const b2 = B.filter((_, i) => i % 6 === 0);
for (let i = 0; i < Math.max(b2.length, C.length); i++) { if (b2[i]) U.push({ ...b2[i] }); if (C[i]) U.push({ ...C[i] }); }
out.universal = { name: 'Universal wisdom', source: 'Sayings across traditions: Dhammapada (CC0) and the King James Bible (public domain)', items: U };

for (const k of Object.keys(out)) out[k].items.forEach((it, i) => it.id = `${k}-${i}`);
fs.writeFileSync('/home/claude/project-heal/assets/data/wisdom.json', JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.items.length])), (fs.statSync('/home/claude/project-heal/assets/data/wisdom.json').size / 1024).toFixed(0) + ' KB');
console.log(JSON.stringify(out.sikh.items[1]).slice(0, 400));
console.log(JSON.stringify(out.islam.items[1]).slice(0, 300));
console.log(JSON.stringify(out.christian.items[0]));
console.log(JSON.stringify(out.buddhist.items[0]));
