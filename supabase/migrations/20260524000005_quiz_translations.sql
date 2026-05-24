-- Çok dilli quiz sistemi için refactor.
-- Önceki şemada quiz_question_bank'te question_en/options_en/question_tr/options_tr/is_ready
-- alanları vardı; bu tek bir hard-coded dile (TR+EN) bağlıydı.
-- Yeni mimaride bank tablosu dil-bağımsız (sadece canonical alanlar) ve
-- her dil için quiz_question_translations tablosunda ayrı bir kayıt tutulur.
--
-- quiz_events tablosuna ise `lang` alanı eklendi: o event hangi dilde oynanacak.
-- lockQuestions sadece event.lang'e ait is_ready=true çevirisi olan soruları seçer.

-- 1) quiz_question_bank'ten dil-bağımlı kolonları kaldır
alter table public.quiz_question_bank
  drop column if exists question_en,
  drop column if exists options_en,
  drop column if exists question_tr,
  drop column if exists options_tr,
  drop column if exists is_ready;

-- is_ready'ye özel partial index varsa drop et (artık yok)
drop index if exists public.idx_quiz_bank_ready;

-- 2) Çeviri tablosu: (question_id, lang) UNIQUE
create table if not exists public.quiz_question_translations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_question_bank(id) on delete cascade,
  lang text not null,                                       -- 'tr', 'en', 'pt-br', 'es', ...
  question text not null,
  options text[] not null check (array_length(options, 1) = 4),
  is_ready boolean not null default false,                  -- O dilde çeviri tam ise true
  translator_user_id text,                                  -- Discord ID
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, lang)
);

create index if not exists idx_quiz_translations_question
  on public.quiz_question_translations (question_id);

create index if not exists idx_quiz_translations_lang_ready
  on public.quiz_question_translations (lang, is_ready) where is_ready = true;

-- updated_at trigger
create or replace function public.quiz_question_translations_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quiz_question_translations_updated_at on public.quiz_question_translations;
create trigger trg_quiz_question_translations_updated_at
  before update on public.quiz_question_translations
  for each row execute function public.quiz_question_translations_set_updated_at();

-- 3) quiz_events.lang alanı (event hangi dilde oynanacak)
alter table public.quiz_events
  add column if not exists lang text not null default 'tr';

create index if not exists idx_quiz_events_lang
  on public.quiz_events (lang);
