-- Quiz Event sistemi: event takvimi, kilitlenmiş sorular, checkpoint ödülleri,
-- katılımcılar ve cevap denemeleri. Server-authoritative live state için
-- current_position + current_question_started_at alanları event row'unda tutulur.

create table if not exists public.quiz_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'guild')),
  guild_id text,                                  -- global ise null
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,                             -- start_at + (total_questions * (seconds_per_question + reveal)) hesaplanır
  total_questions integer not null default 25,
  seconds_per_question integer not null default 20,
  reveal_seconds integer not null default 2,      -- doğru cevap gösterimi
  wrong_allowed integer not null default 3,
  prize_pool_papel numeric not null default 50000,
  status text not null default 'scheduled' check (status in ('scheduled','live','finished','cancelled')),
  current_position integer not null default 0,    -- 0=henüz başlamadı, 1..25=aktif
  current_question_started_at timestamptz,        -- bu pozisyon ne zaman gösterilmeye başladı
  questions_locked_at timestamptz,                -- 25 soru lock'landığında
  paid_out_at timestamptz,                        -- prize dağıtımı tamamlandığında
  cancelled_at timestamptz,
  created_by text,                                -- developer/admin user_id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quiz_events_status_start
  on public.quiz_events (status, start_at);

create index if not exists idx_quiz_events_guild
  on public.quiz_events (guild_id) where guild_id is not null;

-- Global ve per-guild event'ler için ayrı kısıt
-- Global: aynı anda başlayan ikinci global event yok
-- Guild: aynı guild_id için aynı anda başlayan ikinci event yok
create unique index if not exists uniq_quiz_event_global_start
  on public.quiz_events (start_at) where scope = 'global';

create unique index if not exists uniq_quiz_event_guild_start
  on public.quiz_events (guild_id, start_at) where scope = 'guild';

-- Event'in 25 sorusu lock'lanır. Sonradan question_bank değişse bile event sabit kalır.
create table if not exists public.quiz_event_questions (
  event_id uuid not null references public.quiz_events(id) on delete cascade,
  position integer not null check (position between 1 and 100),
  question_bank_id uuid references public.quiz_question_bank(id) on delete set null,
  question_text text not null,
  options jsonb not null,                         -- ["A","B","C","D"]
  correct_index integer not null check (correct_index between 0 and 3),
  category text,
  difficulty text,
  primary key (event_id, position)
);

-- Checkpoint ödülleri: pozisyona ulaşan katılımcılar bu papel'i kazanır
create table if not exists public.quiz_event_checkpoints (
  event_id uuid not null references public.quiz_events(id) on delete cascade,
  position integer not null check (position > 0),
  papel_reward numeric not null default 0,
  label text,                                     -- "Checkpoint 1" gibi
  primary key (event_id, position)
);

-- Katılımcılar (event başına bir satır)
create table if not exists public.quiz_event_participants (
  event_id uuid not null references public.quiz_events(id) on delete cascade,
  user_id text not null,
  guild_id text,                                  -- kullanıcının hangi sunucudan katıldığı (global event için context)
  joined_at timestamptz not null default now(),
  wrong_count integer not null default 0,
  total_correct integer not null default 0,
  last_position integer not null default 0,
  eliminated_at timestamptz,
  perfect_score boolean not null default false,
  papel_earned numeric not null default 0,
  paid_out_at timestamptz,
  primary key (event_id, user_id)
);

create index if not exists idx_quiz_participants_user
  on public.quiz_event_participants (user_id, event_id);

create index if not exists idx_quiz_participants_perfect
  on public.quiz_event_participants (event_id, perfect_score) where perfect_score = true;

-- Cevap denemeleri (audit + replay için)
create table if not exists public.quiz_event_attempts (
  event_id uuid not null references public.quiz_events(id) on delete cascade,
  user_id text not null,
  position integer not null,
  selected_index integer check (selected_index between 0 and 3),
  is_correct boolean not null default false,
  ms_elapsed integer,                             -- soru başlangıcından cevaba kadar geçen ms
  answered_at timestamptz not null default now(),
  primary key (event_id, user_id, position),
  foreign key (event_id) references public.quiz_events(id) on delete cascade
);

create index if not exists idx_quiz_attempts_event_position
  on public.quiz_event_attempts (event_id, position);

-- updated_at trigger
create or replace function public.quiz_events_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quiz_events_updated_at on public.quiz_events;
create trigger trg_quiz_events_updated_at
  before update on public.quiz_events
  for each row execute function public.quiz_events_set_updated_at();

-- Realtime publication (Supabase Realtime için)
-- Bu publication zaten var olabilir; varsa hata vermez
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.quiz_events;
    alter publication supabase_realtime add table public.quiz_event_participants;
  end if;
exception
  when duplicate_object then null;
  when others then null;
end$$;
