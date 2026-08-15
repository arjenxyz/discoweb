/**
 * Build complete faz-e-all.json with all 11 languages.
 * Secondary langs from T0 + REST packs (native, no EN-copy).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tr } from './faz-e-tr.mjs';
import { en } from './faz-e-en.mjs';
import { T0 } from './faz-e-t0.mjs';
import { REST } from './faz-e-t-rest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const langs = ['pt', 'id', 'es', 'de', 'fr', 'hu', 'ja', 'ko', 'ru'];

function flat(o, p = '', a = {}) {
  for (const [k, v] of Object.entries(o || {})) {
    const nk = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, nk, a);
    else a[nk] = v;
  }
  return a;
}
function unflat(f) {
  const root = {};
  for (const [p, val] of Object.entries(f)) {
    const parts = p.split('.');
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return root;
}

function lookup(enVal, lang) {
  if (T0[enVal]?.[lang]) return T0[enVal][lang];
  const row = REST[enVal];
  if (!row) return null;
  if (Array.isArray(row)) {
    const idx = langs.indexOf(lang);
    return row[idx] ?? null;
  }
  return row[lang] ?? null;
}

const enFlat = flat(en);
const bundle = { tr, en };
for (const lang of langs) {
  const out = {};
  const missing = [];
  for (const [key, enVal] of Object.entries(enFlat)) {
    const v = lookup(enVal, lang);
    if (v == null || v === '') missing.push(key);
    else out[key] = v;
  }
  if (missing.length) {
    console.error(lang, 'missing', missing.length, missing.slice(0, 5));
    console.error('en sample', missing.slice(0, 3).map((k) => enFlat[k]));
    process.exit(1);
  }
  bundle[lang] = unflat(out);
}

fs.writeFileSync(path.join(__dirname, 'faz-e-all.json'), JSON.stringify(bundle, null, 2) + '\n');
console.log('OK', Object.keys(enFlat).length, 'keys', Object.keys(bundle).join(','));
