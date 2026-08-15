/** Merge all Faz 0 packs into secondary locale JSON files and verify parity. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../../lib/locales');

function deepMerge(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? a[k] : {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, p));
    else out[p] = v;
  }
  return out;
}

await import(pathToFileURL(path.join(__dirname, 'backfill.mjs')).href);
await import(pathToFileURL(path.join(__dirname, 'packs-de-fr.mjs')).href);
await import(pathToFileURL(path.join(__dirname, 'packs-hu-ja-ko-ru.mjs')).href);

const packs = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'packs-pt-id-es.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'packs-de-fr.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'packs-hu-ja-ko-ru.json'), 'utf8')),
};

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const scopeKeys = Object.keys({
  ...flatten({ sidebar: en.sidebar }),
  ...flatten({ promo: en.promo }),
  ...flatten({ admin: en.admin }),
});

for (const [lang, pack] of Object.entries(packs)) {
  const file = path.join(localesDir, `${lang}.json`);
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  const merged = deepMerge(current, pack);
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');

  const flat = flatten(merged);
  const missing = scopeKeys.filter((k) => !(k in flat));
  const enFlat = flatten({ sidebar: en.sidebar, promo: en.promo, admin: en.admin });
  const enCopy = scopeKeys.filter(
    (k) => k in flat && flat[k] === enFlat[k] && !['admin.wallet.user_id_placeholder', 'admin.wallet.amount_placeholder', 'admin.wallet.image_placeholder'].includes(k),
  );
  // Allow intentional product-term overlap (Booster, Admin, Quiz, Whitelist/Blacklist, Papel amounts)
  const allowedSame = new Set([
    'admin.dashboard.booster',
    'admin.wallet.eyebrow',
    'admin.shell.admin_fallback',
    'admin.shell.role',
    'admin.earn.mode_whitelist_label',
    'admin.earn.mode_blacklist_label',
    'admin.wallet.mail.amount_value',
    'admin.menu.tag_booster',
    'sidebar.quiz_events',
  ]);
  const suspect = enCopy.filter((k) => !allowedSame.has(k) && !String(enFlat[k]).includes('Papel') && !/^\d/.test(String(enFlat[k])) && !String(enFlat[k]).startsWith('http') && enFlat[k] !== '{amount} Papel added to your balance!');
  console.log(`${lang}: missing=${missing.length} enCopySuspect=${suspect.length}`);
  if (missing.length) console.log('  missing sample', missing.slice(0, 10));
  if (suspect.length) console.log('  suspect sample', suspect.slice(0, 15));
}

console.log('Faz 0 merge complete');
