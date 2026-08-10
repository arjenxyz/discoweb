/**
 * Deep-merge i18n key trees into all locale JSON files.
 * Usage: node scripts/i18n-apply.mjs path/to/bundle.json
 * bundle.json shape: { tr: {...}, en: {...}, pt: {...}, ... }
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../lib/locales');
const LANGS = ['tr', 'en', 'pt', 'id', 'es', 'de', 'fr', 'hu', 'ja', 'ko', 'ru'];

function deepMerge(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(
        a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? a[k] : {},
        v,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('Usage: node scripts/i18n-apply.mjs <bundle.json>');
  process.exit(1);
}

const bundle = JSON.parse(fs.readFileSync(path.resolve(bundlePath), 'utf8'));
for (const lang of LANGS) {
  if (!bundle[lang]) {
    console.warn(`skip ${lang}: missing in bundle`);
    continue;
  }
  const file = path.join(localesDir, `${lang}.json`);
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  const merged = deepMerge(current, bundle[lang]);
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
  console.log('updated', lang);
}
