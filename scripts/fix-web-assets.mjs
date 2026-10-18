// Cloudflare Pages does not upload folders named "node_modules", but Expo's web export
// puts fonts and images in dist/assets/node_modules/… (e.g. the Ionicons tab icons).
// Rename that folder to "vendor" and rewrite every reference to it.
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const from = join(dist, 'assets', 'node_modules');
if (!existsSync(from)) { console.log('fix-web-assets: nothing to move'); process.exit(0); }
renameSync(from, join(dist, 'assets', 'vendor'));

let changed = 0;
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(js|html|css|json|map)$/.test(name)) continue;
    const text = readFileSync(p, 'utf8');
    if (!text.includes('assets/node_modules/')) continue;
    writeFileSync(p, text.split('assets/node_modules/').join('assets/vendor/'));
    changed++;
  }
};
walk(dist);
console.log(`fix-web-assets: moved assets/node_modules → assets/vendor, updated ${changed} file(s)`);
