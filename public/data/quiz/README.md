# Quiz Soru Bankası

Bu klasör DiscoWeb Quiz Event sisteminin yerel soru havuzunu içerir.

## Dosyalar

- `raw-en.json` — Open Trivia DB'den çekilmiş ham İngilizce sorular. **`scripts/fetch-trivia-bank.ts` ile üretilir.** Manuel düzenlenmemeli.
- `tr.json` — Türkçeye çevrilmiş aktif soru havuzu. Her satır `is_ready: true` olduğunda quiz event'lerinde kullanılır.

## Format (tr.json)

```jsonc
[
  {
    "id": "opentdb_xxxxx",
    "category": "Science: Computers",
    "difficulty": "medium",
    "question_en": "What is the meaning of...?",
    "options_en": ["A", "B", "C", "D"],
    "correct_index": 2,
    "question_tr": "... ne demektir?",
    "options_tr": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "is_ready": true
  }
]
```

`correct_index`, `options_tr` ile `options_en` aynı sırada olmalıdır. Yani `options_en[2]`'nin TR karşılığı `options_tr[2]` olmalı.

## Akış

1. `npx tsx scripts/fetch-trivia-bank.ts --count=500` çalıştır → `raw-en.json` + boş `tr.json` şablonu oluşur
2. Developer panelinden ya da elle `tr.json`'daki `question_tr` ve `options_tr` alanlarını doldur
3. Çevirisi tamamlanan satırın `is_ready: true` yap
4. `/developer/quiz/questions` sayfasındaki "Veri tabanına yükle" butonu ile `quiz_question_bank` tablosuna sync et

## Per-Guild Custom Sorular

Sunucu admin panelinden (`/admin/quiz`) eklenen özel sorular doğrudan `quiz_question_bank` tablosuna `is_custom_for_guild_id` alanı dolu olarak yazılır; bu JSON dosyalarına yansımaz.
