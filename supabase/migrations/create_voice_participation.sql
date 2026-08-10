-- Migration: create_voice_participation
create table if not exists public.voice_participation (
  id uuid default gen_random_uuid() primary key,
  guild_id text not null,
  user_id text not null,
  channel_id text null,
  join_at timestamptz not null,
  join_ms bigint not null,
  leave_at timestamptz null,
  duration_seconds integer null,
  awarded boolean default false,
  award_amount numeric(12,2) null,
  metadata jsonb null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_voice_participation_user on public.voice_participation(user_id);
create index if not exists idx_voice_participation_guild on public.voice_participation(guild_id);
create index if not exists idx_voice_participation_active on public.voice_participation(guild_id, user_id) where leave_at is null;
