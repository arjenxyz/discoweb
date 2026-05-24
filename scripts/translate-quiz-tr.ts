/**
 * lang-en.json → lang-tr.json (Türkçe, UTF-8, is_ready=true)
 *
 * Kullanım:
 *   npx tsx scripts/translate-quiz-tr.ts
 *   npx tsx scripts/translate-quiz-tr.ts --limit=20
 *   npx tsx scripts/translate-quiz-tr.ts --resume
 */

import fs from 'node:fs/promises';
import path from 'node:path';

type TranslationEntry = {
  id: string;
  question: string;
  options: [string, string, string, string];
  is_ready: boolean;
};

type TranslationFile = {
  lang: string;
  name: string;
  questions: TranslationEntry[];
};

const QUIZ_DIR = path.resolve(__dirname, '../public/data/quiz');
const DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let resume = false;
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = parseInt(a.slice(8), 10);
    else if (a === '--resume') resume = true;
  }
  return { limit, resume };
}

/** Google Translate (gtx) — API key gerektirmez; makul hacim için yeterli */
async function translateEnToTr(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', 'tr');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', trimmed);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscoWebQuizTranslate/1.0)' },
  });
  if (!res.ok) throw new Error(`translate HTTP ${res.status}`);

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('unexpected translate response');
  }

  const translated = (data[0] as Array<[string, ...unknown[]]>)
    .map((chunk) => chunk[0])
    .join('')
    .trim();

  return fixTurkishText(translated || trimmed);
}

/** Yaygın bozuk karakter / noktalama düzeltmeleri */
function fixTurkishText(s: string): string {
  return s
    .replace(/\u00A0/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, (m) => (m.includes('\n') ? m : ' '))
    .trim();
}

function isComplete(entry: TranslationEntry): boolean {
  if (!entry.question.trim()) return false;
  return entry.options.every((o) => o.trim().length > 0);
}

async function main() {
  const { limit, resume } = parseArgs();

  const enRaw = await fs.readFile(path.join(QUIZ_DIR, 'lang-en.json'), 'utf8');
  const enFile = JSON.parse(enRaw) as TranslationFile;

  let trFile: TranslationFile;
  try {
    const trRaw = await fs.readFile(path.join(QUIZ_DIR, 'lang-tr.json'), 'utf8');
    trFile = JSON.parse(trRaw) as TranslationFile;
  } catch {
    trFile = { lang: 'tr', name: 'Türkçe', questions: [] };
  }

  const trById = new Map(trFile.questions.map((q) => [q.id, q]));
  const enById = new Map(enFile.questions.map((q) => [q.id, q]));

  let targets = enFile.questions;
  if (limit && limit > 0) targets = targets.slice(0, limit);

  let done = 0;
  let skipped = 0;

  for (let i = 0; i < targets.length; i++) {
    const en = targets[i];
    const prev = trById.get(en.id);

    if (resume && prev && isComplete(prev)) {
      skipped += 1;
      continue;
    }

    process.stdout.write(`[tr] ${i + 1}/${targets.length} ${en.id} ... `);

    try {
      const questionTr = await translateEnToTr(en.question);
      await sleep(DELAY_MS);
      const optionsTr: [string, string, string, string] = ['', '', '', ''];
      for (let o = 0; o < 4; o++) {
        optionsTr[o] = await translateEnToTr(en.options[o]);
        if (o < 3) await sleep(DELAY_MS);
      }

      trById.set(en.id, {
        id: en.id,
        question: questionTr,
        options: optionsTr,
        is_ready: true,
      });
      done += 1;
      console.log('ok');
    } catch (err) {
      console.log('fail', err instanceof Error ? err.message : err);
      trById.set(en.id, {
        id: en.id,
        question: prev?.question ?? '',
        options: prev?.options ?? ['', '', '', ''],
        is_ready: false,
      });
    }

    if ((i + 1) % 25 === 0) {
      await writeTrFile(enFile, trById);
      console.log(`[tr] checkpoint ${i + 1}/${targets.length}`);
    }
  }

  await writeTrFile(enFile, trById);

  const all = enFile.questions.map((q) => trById.get(q.id)!);
  const readyCount = all.filter((q) => q.is_ready).length;
  console.log(`[tr] finished: translated=${done}, skipped=${skipped}, ready=${readyCount}/${all.length}`);
}

async function writeTrFile(enFile: TranslationFile, trById: Map<string, TranslationEntry>) {
  const out: TranslationFile = {
    lang: 'tr',
    name: 'Türkçe',
    questions: enFile.questions.map((q) => {
      const t = trById.get(q.id);
      return (
        t ?? {
          id: q.id,
          question: '',
          options: ['', '', '', ''],
          is_ready: false,
        }
      );
    }),
  };
  await fs.writeFile(path.join(QUIZ_DIR, 'lang-tr.json'), JSON.stringify(out, null, 2), 'utf8');
}

main().catch((e) => {
  console.error('[tr] fatal:', e);
  process.exit(1);
});
