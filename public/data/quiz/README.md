# Quiz Soru Bankası (Multi-language)

Bu klasör DiscoWeb Quiz Event sisteminin yerel soru havuzunu içerir.
Yapı dil-bağımsız tasarlandı — her yeni dil için yalnızca bir `lang-XX.json` dosyası eklemek yeterli.

## Dosyalar

| Dosya | İçerik | Düzenlenebilir mi? |
|---|---|---|
| `bank.json` | **Canonical** soru kayıtları (dil-bağımsız): id, kategori, zorluk, correct_index | Hayır — `scripts/fetch-trivia-bank.ts` üretir |
| `lang-en.json` | İngilizce çeviriler (Open Trivia DB kaynağından otomatik gelir, `is_ready=true`) | Hayır — script üretir |
| `lang-tr.json` | Türkçe çeviriler **template** (boş gelir, çevrilecek; `is_ready=false`) | Evet — elle veya developer panel'den |
| `lang-pt-br.json` | Portekizce (BR) çeviriler — *opsiyonel, yoksa elle yarat* | Evet |
| `lang-es.json`, `lang-de.json`, ... | Diğer diller | Evet |

## Şema

### `bank.json`
```json
[
  {
    "id": "opentdb_xxxxx",
    "source": "opentdb",
    "source_external_id": "opentdb_xxxxx",
    "category": "Science: Computers",
    "difficulty": "medium",
    "correct_index": 2
  }
]
```
> Bu dosyada **soru metni veya şıklar yoktur**. Sadece canonical alanlar.

### `lang-XX.json`
```json
{
  "lang": "tr",
  "name": "Türkçe",
  "questions": [
    {
      "id": "opentdb_xxxxx",
      "question": "... ne demektir?",
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "is_ready": true
    }
  ]
}
```
> `id` alanı `bank.json`'daki id ile aynı olmalıdır. `options[0..3]` sırası `bank.json`'daki `correct_index` ile eşleşmek zorundadır (çeviri yaparken şık sırasını koru).

## Akış

1. **Sorubankası üretimi** (geliştirici makinesinde):
   ```bash
   npx tsx scripts/fetch-trivia-bank.ts --count=500
   ```
   Bu komut `bank.json` + `lang-en.json` üretir. `lang-tr.json` yoksa boş template oluşturur, varsa mevcut çevirileri korur.

2. **Database'e yükleme** (developer panelinden):
   - `/developer/quiz/questions` → **"Ana Banka Yükle (bank.json)"** → `bank.json`'ı seç
   - Aynı sayfada **"Çeviri Yükle (lang-XX.json)"** → `lang-en.json` (zaten hazır)
   - Aynı butonla `lang-tr.json` → soruları yükler ama `is_ready=false` ise quiz'de kullanılmaz
   - Editor'de her satırı aç → Türkçe çeviriyi yap → **"is_ready"** işaretle → Kaydet

3. **Yeni dil eklemek**:
   - `lang-tr.json`'ı kopyala → `lang-pt-br.json` olarak adlandır
   - `"lang": "pt-br"`, `"name": "Português (BR)"` yap
   - `questions[].question` ve `questions[].options`'ı çevir
   - Developer panel → "Çeviri Yükle" → bu dosyayı seç
   - Event oluştururken "Dil: pt-br" seçmek artık mümkün

## Per-Guild Custom Sorular

Admin panel (`/admin/quiz` → "Sunucuya Özel Sorular") üzerinden eklenen sorular:
- Doğrudan database'e yazılır, JSON dosyalarına yansımaz
- `quiz_question_bank.is_custom_for_guild_id` alanı dolu olur
- Admin tek bir dilde yazar; isteğe göre başka dilleri de ekleyebilir (translations tablosu üzerinden)
- Per-guild event'lerde önce custom sorular, sonra ortak banka kullanılır
