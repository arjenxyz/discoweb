-- Quiz Event sistemi için soru bankası tablosu.
-- Hem Open Trivia DB'den çekilmiş ortak sorular hem de per-guild custom sorular burada tutulur.

create table if not exists public.quiz_question_bank (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'opentdb',                  -- 'opentdb' | 'custom'
  source_external_id text,                                  -- Open Trivia'da varsa external id / hash
  category text,                                            -- "Science: Computers" gibi
  difficulty text check (difficulty in ('easy','medium','hard')),
  question_en text,
  options_en text[],                                        -- 4 eleman
  question_tr text,
  options_tr text[],                                        -- 4 eleman
  correct_index integer not null check (correct_index between 0 and 3),
  is_ready boolean not null default false,                  -- TR çeviri tamamlandığında true
  is_custom_for_guild_id text,                              -- Per-guild custom soru ise dolu, ortak banka ise null
  last_used_at timestamptz,                                 -- Rotasyon için
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quiz_bank_ready
  on public.quiz_question_bank (is_ready) where is_ready = true;

create index if not exists idx_quiz_bank_guild
  on public.quiz_question_bank (is_custom_for_guild_id) where is_custom_for_guild_id is not null;

create index if not exists idx_quiz_bank_difficulty
  on public.quiz_question_bank (difficulty);

create index if not exists idx_quiz_bank_source
  on public.quiz_question_bank (source);

-- updated_at trigger
create or replace function public.quiz_question_bank_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quiz_question_bank_updated_at on public.quiz_question_bank;
create trigger trg_quiz_question_bank_updated_at
  before update on public.quiz_question_bank
  for each row execute function public.quiz_question_bank_set_updated_at();

-- Aynı external_id'den iki kez çekim olmasın
create unique index if not exists uniq_quiz_bank_source_external
  on public.quiz_question_bank (source, source_external_id)
  where source_external_id is not null;
