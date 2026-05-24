/**
 * Open Trivia DB'den toplu multiple-choice soru çeker ve
 * public/data/quiz/raw-en.json içine yazar.
 *
 * Kullanım:
 *   npx tsx scripts/fetch-trivia-bank.ts
 *   npx tsx scripts/fetch-trivia-bank.ts --count=500 --difficulty=medium
 *
 * Open Trivia DB rate-limit: ~5 saniye bekleme tavsiye edilir, biz batch başına 6sn bekliyoruz.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

type OpenTriviaResult = {
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

type OpenTriviaResponse = {
  response_code: number;
  results: OpenTriviaResult[];
};

type RawQuestion = {
  id: string;
  source: 'opentdb';
  source_external_id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_en: string;
  options_en: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
};

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&eacute;': 'é',
  '&Eacute;': 'É',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&ouml;': 'ö',
  '&uuml;': 'ü',
  '&auml;': 'ä',
  '&Auml;': 'Ä',
  '&ntilde;': 'ñ',
  '&aacute;': 'á',
  '&uacute;': 'ú',
  '&hellip;': '…',
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&deg;': '°',
};

function decodeHTML(s: string): string {
  let out = s;
  for (const [k, v] of Object.entries(HTML_ENTITIES)) {
    out = out.split(k).join(v);
  }
  out = out.replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16)));
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashId(question: string): string {
  let h = 0;
  for (let i = 0; i < question.length; i++) {
    h = ((h << 5) - h + question.charCodeAt(i)) | 0;
  }
  return `opentdb_${Math.abs(h).toString(36)}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBatch(amount: number, difficulty?: string): Promise<OpenTriviaResult[]> {
  const url = new URL('https://opentdb.com/api.php');
  url.searchParams.set('amount', String(amount));
  url.searchParams.set('type', 'multiple');
  if (difficulty) url.searchParams.set('difficulty', difficulty);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open Trivia DB HTTP ${res.status}`);
  const data = (await res.json()) as OpenTriviaResponse;
  if (data.response_code !== 0) {
    throw new Error(`Open Trivia DB response_code=${data.response_code}`);
  }
  return data.results;
}

function transform(r: OpenTriviaResult): RawQuestion {
  const question_en = decodeHTML(r.question);
  const correct = decodeHTML(r.correct_answer);
  const incorrect = r.incorrect_answers.map(decodeHTML);
  const shuffled = shuffle([correct, ...incorrect]);
  const correct_index = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;
  return {
    id: hashId(question_en),
    source: 'opentdb',
    source_external_id: question_en.slice(0, 64),
    category: decodeHTML(r.category),
    difficulty: r.difficulty,
    question_en,
    options_en: [shuffled[0], shuffled[1], shuffled[2], shuffled[3]],
    correct_index,
  };
}

function parseArgs(): { count: number; difficulty?: string; out?: string } {
  const args = process.argv.slice(2);
  let count = 500;
  let difficulty: string | undefined;
  let out: string | undefined;
  for (const a of args) {
    if (a.startsWith('--count=')) count = parseInt(a.slice(8), 10);
    else if (a.startsWith('--difficulty=')) difficulty = a.slice(13);
    else if (a.startsWith('--out=')) out = a.slice(6);
  }
  return { count, difficulty, out };
}

async function main() {
  const { count, difficulty, out } = parseArgs();
  const batchSize = 50;
  const batches = Math.ceil(count / batchSize);
  const collected: RawQuestion[] = [];
  const seen = new Set<string>();

  console.log(`[trivia] Fetching ${count} questions in ${batches} batches of ${batchSize}...`);

  for (let i = 0; i < batches; i++) {
    const take = Math.min(batchSize, count - collected.length);
    if (take <= 0) break;
    try {
      const results = await fetchBatch(take, difficulty);
      for (const r of results) {
        const q = transform(r);
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        collected.push(q);
      }
      console.log(`[trivia] batch ${i + 1}/${batches} -> collected=${collected.length}`);
    } catch (err) {
      console.warn(`[trivia] batch ${i + 1} failed:`, err);
    }
    if (i < batches - 1) await sleep(6000); // rate limit ~5s
  }

  const repoRoot = path.resolve(__dirname, '..');
  const outPath = out
    ? path.resolve(process.cwd(), out)
    : path.join(repoRoot, 'public', 'data', 'quiz', 'raw-en.json');

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(collected, null, 2), 'utf8');

  console.log(`[trivia] wrote ${collected.length} unique questions -> ${outPath}`);

  // tr.json şablonu (sadece yoksa oluştur)
  const trPath = path.join(path.dirname(outPath), 'tr.json');
  try {
    await fs.access(trPath);
    console.log(`[trivia] tr.json already exists, skipping template generation`);
  } catch {
    const trTemplate = collected.map((q) => ({
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      question_en: q.question_en,
      options_en: q.options_en,
      correct_index: q.correct_index,
      question_tr: '', // çevrilecek
      options_tr: ['', '', '', ''], // çevrilecek
      is_ready: false, // çeviri tamamlanınca true yap
    }));
    await fs.writeFile(trPath, JSON.stringify(trTemplate, null, 2), 'utf8');
    console.log(`[trivia] tr.json template created -> ${trPath}`);
  }
}

main().catch((e) => {
  console.error('[trivia] fatal:', e);
  process.exit(1);
});
