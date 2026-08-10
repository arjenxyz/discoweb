-- quiz_question_bank.upsert(onConflict='source,source_external_id') için
-- partial unique index yetmiyor; PostgreSQL ON CONFLICT tam unique constraint istiyor.
-- NULL'lar zaten birbiriyle conflict etmez, custom sorular sorun çıkarmaz.

drop index if exists public.uniq_quiz_bank_source_external;

alter table public.quiz_question_bank
  drop constraint if exists quiz_question_bank_source_external_key;

alter table public.quiz_question_bank
  add constraint quiz_question_bank_source_external_key unique (source, source_external_id);
