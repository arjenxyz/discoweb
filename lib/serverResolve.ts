import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';
const DEFAULT_SLUG = 'default';

export async function getSelectedGuildId(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('selected_guild_id')?.value?.trim();
  if (fromCookie) return fromCookie;
  return DEFAULT_GUILD_ID;
}

export type ResolvedServer = {
  serverId: string;
  guildId: string;
  isSetup: boolean;
};

type ServerRow = {
  id: string;
  discord_id?: string | null;
  is_setup?: boolean | null;
};

function toResolved(row: ServerRow, fallbackGuildId: string): ResolvedServer {
  return {
    serverId: row.id,
    guildId: row.discord_id ?? fallbackGuildId,
    isSetup: Boolean(row.is_setup),
  };
}

async function fetchByDiscordId(supabase: SupabaseClient, guildId: string) {
  const { data } = await supabase
    .from('servers')
    .select('id, discord_id, is_setup')
    .eq('discord_id', guildId)
    .maybeSingle();
  return (data as ServerRow | null) ?? null;
}

export async function resolveServer(
  supabase: SupabaseClient,
  options?: { requireSetup?: boolean },
): Promise<ResolvedServer | null> {
  const guildId = await getSelectedGuildId();
  const requireSetup = options?.requireSetup ?? false;

  const candidates: ServerRow[] = [];

  const bySelected = await fetchByDiscordId(supabase, guildId);
  if (bySelected) candidates.push(bySelected);

  if (guildId !== DEFAULT_GUILD_ID) {
    const byEnv = await fetchByDiscordId(supabase, DEFAULT_GUILD_ID);
    if (byEnv && !candidates.some((c) => c.id === byEnv.id)) candidates.push(byEnv);
  }

  const { data: bySlug } = await supabase
    .from('servers')
    .select('id, discord_id, is_setup')
    .eq('slug', DEFAULT_SLUG)
    .maybeSingle();
  if (bySlug && !candidates.some((c) => c.id === (bySlug as ServerRow).id)) {
    candidates.push(bySlug as ServerRow);
  }

  const { data: firstServer } = await supabase
    .from('servers')
    .select('id, discord_id, is_setup')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstServer && !candidates.some((c) => c.id === (firstServer as ServerRow).id)) {
    candidates.push(firstServer as ServerRow);
  }

  if (requireSetup) {
    const setupMatch = candidates.find((row) => row.is_setup);
    if (setupMatch) return toResolved(setupMatch, guildId);
    return null;
  }

  const match = candidates[0];
  return match ? toResolved(match, guildId) : null;
}
