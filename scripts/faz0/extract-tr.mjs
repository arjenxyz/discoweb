import fs from 'fs';

const files = [
  'app/auth/callback/page.tsx',
  'app/auth/error/page.tsx',
  'app/auth/bot-invite/page.tsx',
  'components/DiscordAgreementButton.tsx',
  'app/auth/setup/page.tsx',
  'app/auth/setup/terminal/page.tsx',
];

const trRe = /[ğüşıöçĞÜŞİÖÇ]/;

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const hits = new Set();
  // double quotes
  for (const m of s.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    if (trRe.test(m[1]) || m[1].length > 20) hits.add(m[1]);
  }
  // single quotes
  for (const m of s.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)) {
    if (trRe.test(m[1])) hits.add(m[1]);
  }
  // template literals with TR
  for (const m of s.matchAll(/`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    if (trRe.test(m[1])) hits.add(m[1].replace(/\n/g, ' ').slice(0, 160));
  }
  console.log('\n===' + f + ' (' + hits.size + ')===');
  for (const h of hits) {
    if (/^(https?:|application\/|selected_|discord_|oauth|adminGuild|NEXT_|bg-|text-|from-|via-|to-|w-|h-|px-|py-|mt-|mb-|flex|grid|absolute|relative|fixed|rounded|border|shadow|animate|transition|hover:|sm:|md:|lg:)/.test(h)) continue;
    if (h.length < 4) continue;
    console.log('- ' + h);
  }
}
