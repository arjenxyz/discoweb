/**
 * Open Trivia DB'den toplu multiple-choice soru çeker ve
 * public/data/quiz/ klasörüne 3 dosya yazar:
 *
 *   - bank.json        Canonical soru bankası (dil-bağımsız: id, kategori, zorluk, correct_index)
 *   - lang-en.json     İngilizce çeviri (Open Trivia kaynağından otomatik gelir, is_ready=true)
 *   - lang-tr.json     Türkçe çeviri TEMPLATE (boş, çevrilecek; is_ready=false)
 *
 * Yeni bir dil eklemek için elle `lang-pt-br.json`, `lang-es.json` vb. yarat;
 * şablon olarak `lang-tr.json`'ı kopyalayıp lang alanını değiştir.
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

type BankEntry = {
  id: string;
  source: 'opentdb';
  source_external_id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correct_index: 0 | 1 | 2 | 3;
};

type TranslationEntry = {
  id: string;             // question id (bank.json'daki id ile aynı)
  question: string;
  options: [string, string, string, string];
  is_ready: boolean;
};

type TranslationFile = {
  lang: string;           // 'tr', 'en', 'pt-br', ...
  name: string;           // "Türkçe", "English", ...
  questions: TranslationEntry[];
};

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&quot;': '"', '&#039;': "'", '&apos;': "'",
  '&lt;': '<', '&gt;': '>',
  '&eacute;': 'é', '&Eacute;': 'É', '&iacute;': 'í',
  '&oacute;': 'ó', '&ouml;': 'ö', '&uuml;': 'ü', '&auml;': 'ä',
  '&Auml;': 'Ä', '&ntilde;': 'ñ', '&aacute;': 'á', '&uacute;': 'ú',
  '&hellip;': '…', '&ldquo;': '"', '&rdquo;': '"',
  '&lsquo;': "'", '&rsquo;': "'",
  '&mdash;': '—', '&ndash;': '–', '&deg;': '°',
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

type Transformed = { bank: BankEntry; en: TranslationEntry };

function transform(r: OpenTriviaResult): Transformed {
  const question_en = decodeHTML(r.question);
  const correct = decodeHTML(r.correct_answer);
  const incorrect = r.incorrect_answers.map(decodeHTML);
  const shuffled = shuffle([correct, ...incorrect]);
  const correct_index = shuffled.indexOf(correct) as 0 | 1 | 2 | 3;
  const id = hashId(question_en);
  return {
    bank: {
      id,
      source: 'opentdb',
      source_external_id: id,
      category: decodeHTML(r.category),
      difficulty: r.difficulty,
      correct_index,
    },
    en: {
      id,
      question: question_en,
      options: [shuffled[0], shuffled[1], shuffled[2], shuffled[3]],
      is_ready: true, // İngilizce kaynak otomatik tam
    },
  };
}

function parseArgs(): { count: number; difficulty?: string; outDir?: string } {
  const args = process.argv.slice(2);
  let count = 500;
  let difficulty: string | undefined;
  let outDir: string | undefined;
  for (const a of args) {
    if (a.startsWith('--count=')) count = parseInt(a.slice(8), 10);
    else if (a.startsWith('--difficulty=')) difficulty = a.slice(13);
    else if (a.startsWith('--out=')) outDir = a.slice(6);
  }
  return { count, difficulty, outDir };
}

async function main() {
  const { count, difficulty, outDir } = parseArgs();
  const batchSize = 50;
  const batches = Math.ceil(count / batchSize);

  const bank: BankEntry[] = [];
  const enTranslations: TranslationEntry[] = [];
  const seen = new Set<string>();

  console.log(`[trivia] Fetching ${count} questions in ${batches} batches of ${batchSize}...`);

  for (let i = 0; i < batches; i++) {
    const take = Math.min(batchSize, count - bank.length);
    if (take <= 0) break;
    try {
      const results = await fetchBatch(take, difficulty);
      for (const r of results) {
        const { bank: bEntry, en } = transform(r);
        if (seen.has(bEntry.id)) continue;
        seen.add(bEntry.id);
        bank.push(bEntry);
        enTranslations.push(en);
      }
      console.log(`[trivia] batch ${i + 1}/${batches} -> collected=${bank.length}`);
    } catch (err) {
      console.warn(`[trivia] batch ${i + 1} failed:`, err);
    }
    if (i < batches - 1) await sleep(6000);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const targetDir = outDir
    ? path.resolve(process.cwd(), outDir)
    : path.join(repoRoot, 'public', 'data', 'quiz');

  await fs.mkdir(targetDir, { recursive: true });

  // 1) bank.json - canonical
  const bankPath = path.join(targetDir, 'bank.json');
  await fs.writeFile(bankPath, JSON.stringify(bank, null, 2), 'utf8');
  console.log(`[trivia] wrote ${bank.length} canonical entries -> ${bankPath}`);

  // 2) lang-en.json - İngilizce hazır
  const enFile: TranslationFile = {
    lang: 'en',
    name: 'English',
    questions: enTranslations,
  };
  const enPath = path.join(targetDir, 'lang-en.json');
  await fs.writeFile(enPath, JSON.stringify(enFile, null, 2), 'utf8');
  console.log(`[trivia] wrote ${enTranslations.length} EN translations -> ${enPath}`);

  // 3) lang-tr.json - Türkçe TEMPLATE (sadece yoksa oluştur, var olanı koru)
  const trPath = path.join(targetDir, 'lang-tr.json');
  let existingTr: TranslationFile | null = null;
  try {
    const raw = await fs.readFile(trPath, 'utf8');
    existingTr = JSON.parse(raw) as TranslationFile;
  } catch {
    existingTr = null;
  }

  const existingById = new Map<string, TranslationEntry>();
  if (existingTr?.questions) {
    for (const q of existingTr.questions) existingById.set(q.id, q);
  }

  const trFile: TranslationFile = {
    lang: 'tr',
    name: 'Türkçe',
    questions: bank.map((b) => {
      const prev = existingById.get(b.id);
      if (prev) return prev; // var olan çeviriyi koru
      return {
        id: b.id,
        question: '',
        options: ['', '', '', ''] as [string, string, string, string],
        is_ready: false,
      };
    }),
  };
  await fs.writeFile(trPath, JSON.stringify(trFile, null, 2), 'utf8');
  console.log(`[trivia] wrote ${trFile.questions.length} TR template entries -> ${trPath}`);

  // Bilgi
  console.log('');
  console.log('[trivia] Sıradaki adım:');
  console.log(`  1. Developer panel → /developer/quiz/questions sayfasından önce 'Ana Banka Yükle (bank.json)' butonuna bas`);
  console.log(`  2. Aynı sayfada 'Çeviri Yükle' butonu ile lang-en.json'ı yükle`);
  console.log(`  3. lang-tr.json'daki Türkçe çevirileri elle/panel üzerinden tamamla → 'Çeviri Yükle' tekrar bas`);
  console.log(`  4. Yeni dil için: lang-pt-br.json gibi bir dosya yarat, importla`);
}

main().catch((e) => {
  console.error('[trivia] fatal:', e);
  process.exit(1);
});
