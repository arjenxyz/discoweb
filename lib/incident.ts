import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_INCIDENT_MESSAGE =
  'Şu anda büyük bir sorunu çözmek için çalışıyoruz, lütfen sabırlı olun.';

export const DEFAULT_INCIDENT_SCOPES = [
  'earn_message',
  'earn_voice',
  'claim',
  'store',
  'transfers',
  'promotions',
  'bonuses',
] as const;

export type IncidentScope = (typeof DEFAULT_INCIDENT_SCOPES)[number];

export type SystemIncident = {
  id: string;
  status: 'active' | 'resolved';
  title: string;
  public_message: string;
  scopes: string[];
  window_start: string;
  window_end: string | null;
  pre_state: Record<string, unknown>;
  started_by: string | null;
  resolved_by: string | null;
  started_at: string;
  ended_at: string | null;
};

export type AffectedUserRow = {
  id?: string;
  incident_id: string;
  guild_id: string;
  user_id: string;
  category: string;
  detected_amount: number;
  proposed_correction: number;
  applied_correction?: number | null;
  waived_amount?: number;
  status: string;
  meta?: Record<string, unknown>;
};

const MAINTENANCE_STOP_KEYS = [
  'site',
  'store',
  'transactions',
  'tracking',
  'promotions',
  'discounts',
  'transfers',
  'bot',
  'activity',
] as const;

let cachedActive: { at: number; value: SystemIncident | null } | null = null;
const ACTIVE_CACHE_MS = 5_000;

export function getIncidentSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

export function invalidateIncidentCache() {
  cachedActive = null;
}

function mapIncident(row: any): SystemIncident {
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    public_message: row.public_message,
    scopes: Array.isArray(row.scopes) ? row.scopes : DEFAULT_INCIDENT_SCOPES.slice(),
    window_start: row.window_start,
    window_end: row.window_end ?? null,
    pre_state: (row.pre_state && typeof row.pre_state === 'object' ? row.pre_state : {}) as Record<
      string,
      unknown
    >,
    started_by: row.started_by ?? null,
    resolved_by: row.resolved_by ?? null,
    started_at: row.started_at,
    ended_at: row.ended_at ?? null,
  };
}

export async function getActiveIncident(opts?: {
  bypassCache?: boolean;
}): Promise<SystemIncident | null> {
  if (!opts?.bypassCache && cachedActive && Date.now() - cachedActive.at < ACTIVE_CACHE_MS) {
    return cachedActive.value;
  }

  const supabase = getIncidentSupabase();
  if (!supabase) {
    cachedActive = { at: Date.now(), value: null };
    return null;
  }

  const { data, error } = await supabase
    .from('system_incident')
    .select('*')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const msg = error.message || '';
    const missingTable =
      /schema cache/i.test(msg) ||
      /could not find the table/i.test(msg) ||
      /relation .* does not exist/i.test(msg);
    if (!missingTable) {
      console.error('[incident] getActiveIncident', msg);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('[incident] system_incident table missing — run supabase migration 20260811180001_system_incident.sql');
    }
    cachedActive = { at: Date.now(), value: null };
    return null;
  }

  const value = data ? mapIncident(data) : null;
  cachedActive = { at: Date.now(), value };
  return value;
}

export async function assertNoActiveIncident(): Promise<
  | { blocked: false }
  | { blocked: true; incident: SystemIncident; reason: string }
> {
  const incident = await getActiveIncident();
  if (!incident) return { blocked: false };
  return {
    blocked: true,
    incident,
    reason: incident.public_message || DEFAULT_INCIDENT_MESSAGE,
  };
}

async function logAction(
  supabase: SupabaseClient,
  incidentId: string,
  action: string,
  actorId: string | null,
  payload: Record<string, unknown> = {},
) {
  await supabase.from('system_incident_actions').insert({
    incident_id: incidentId,
    action,
    actor_id: actorId,
    payload,
  });
}

async function notifyBotIncidentSync(active: boolean) {
  const botApiUrl = process.env.BOT_API_URL;
  if (!botApiUrl) return;
  try {
    await fetch(`${botApiUrl.replace(/\/$/, '')}/api/incident-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.BOT_API_KEY
          ? { Authorization: `Bearer ${process.env.BOT_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ active }),
    });
  } catch (err) {
    console.warn('[incident] bot incident-sync failed', err);
  }
}

async function invalidateAllServerConfigs(supabase: SupabaseClient) {
  const botApiUrl = process.env.BOT_API_URL;
  if (!botApiUrl) return;
  const { data: servers } = await supabase.from('servers').select('discord_id').eq('is_setup', true);
  const key = process.env.BOT_API_KEY;
  await Promise.allSettled(
    (servers ?? []).map((s) =>
      fetch(`${botApiUrl.replace(/\/$/, '')}/api/invalidate-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Bearer ${key}` } : {}),
        },
        body: JSON.stringify({ guildId: s.discord_id }),
      }),
    ),
  );
}

type ServerSnapshot = {
  discord_id: string;
  server_id: string;
  message_earn_enabled: boolean | null;
  voice_earn_enabled: boolean | null;
};

type IncidentPreState = {
  servers?: ServerSnapshot[];
  /** Global maintenance snapshot (preferred). */
  globalMaintenance?: Record<string, { is_active: boolean; reason: string | null }>;
  /** @deprecated legacy per-server maintenance inside servers[].maintenance */
};

export async function startIncident(params: {
  actorId: string;
  title?: string;
  publicMessage?: string;
  windowStartHours?: number;
  scopes?: string[];
}): Promise<{ incident: SystemIncident }> {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  const existing = await getActiveIncident({ bypassCache: true });
  if (existing) throw new Error('incident_already_active');

  const windowHours = Math.min(Math.max(params.windowStartHours ?? 6, 1), 72);
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const publicMessage = params.publicMessage?.trim() || DEFAULT_INCIDENT_MESSAGE;
  const scopes = params.scopes?.length ? params.scopes : [...DEFAULT_INCIDENT_SCOPES];

  const { data: servers, error: serversErr } = await supabase
    .from('servers')
    .select('id,discord_id,message_earn_enabled,voice_earn_enabled')
    .eq('is_setup', true);
  if (serversErr) throw new Error(serversErr.message);

  const snapshots: ServerSnapshot[] = [];
  for (const server of servers ?? []) {
    snapshots.push({
      discord_id: server.discord_id,
      server_id: server.id,
      message_earn_enabled: server.message_earn_enabled ?? null,
      voice_earn_enabled: server.voice_earn_enabled ?? null,
    });

    await supabase
      .from('servers')
      .update({
        message_earn_enabled: false,
        voice_earn_enabled: false,
        updated_at: now,
      })
      .eq('id', server.id);
  }

  const { data: globalRows } = await supabase
    .from('global_maintenance_flags')
    .select('key,is_active,reason');

  const globalMaintenance: Record<string, { is_active: boolean; reason: string | null }> = {};
  for (const f of globalRows ?? []) {
    globalMaintenance[f.key] = { is_active: Boolean(f.is_active), reason: f.reason ?? null };
  }

  for (const key of MAINTENANCE_STOP_KEYS) {
    await supabase.from('global_maintenance_flags').upsert(
      {
        key,
        is_active: true,
        reason: publicMessage,
        updated_by: params.actorId,
        updated_at: now,
      },
      { onConflict: 'key' },
    );
  }

  const { data: incidentRow, error: insErr } = await supabase
    .from('system_incident')
    .insert({
      status: 'active',
      title: params.title?.trim() || 'Emergency stop',
      public_message: publicMessage,
      scopes,
      window_start: windowStart,
      window_end: now,
      pre_state: { servers: snapshots, globalMaintenance },
      started_by: params.actorId,
      started_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (insErr || !incidentRow) {
    const msg = insErr?.message || 'insert_failed';
    if (/schema cache|could not find the table|does not exist/i.test(msg)) {
      throw new Error(
        'missing_system_incident_table: Supabase SQL Editor’da supabase/migrations/20260811180001_system_incident.sql dosyasını çalıştırın.',
      );
    }
    throw new Error(msg);
  }

  const incident = mapIncident(incidentRow);
  await logAction(supabase, incident.id, 'stop', params.actorId, {
    serverCount: snapshots.length,
    windowHours,
    scopes,
  });

  invalidateIncidentCache();
  await notifyBotIncidentSync(true);
  await invalidateAllServerConfigs(supabase);

  return { incident };
}

export async function resumeIncident(params: {
  actorId: string;
}): Promise<{ incident: SystemIncident }> {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  const active = await getActiveIncident({ bypassCache: true });
  if (!active) throw new Error('no_active_incident');

  const now = new Date().toISOString();
  const pre = active.pre_state as IncidentPreState;
  const snapshots = Array.isArray(pre.servers) ? pre.servers : [];

  for (const snap of snapshots) {
    await supabase
      .from('servers')
      .update({
        message_earn_enabled: snap.message_earn_enabled ?? true,
        voice_earn_enabled: snap.voice_earn_enabled ?? true,
        updated_at: now,
      })
      .eq('id', snap.server_id);
  }

  const globalPrev = pre.globalMaintenance ?? {};
  for (const key of MAINTENANCE_STOP_KEYS) {
    const prev = globalPrev[key];
    await supabase.from('global_maintenance_flags').upsert(
      {
        key,
        is_active: Boolean(prev?.is_active),
        reason: prev?.is_active ? prev.reason : null,
        updated_by: params.actorId,
        updated_at: now,
      },
      { onConflict: 'key' },
    );
  }

  const { data: updated, error } = await supabase
    .from('system_incident')
    .update({
      status: 'resolved',
      resolved_by: params.actorId,
      ended_at: now,
      window_end: active.window_end ?? now,
      updated_at: now,
    })
    .eq('id', active.id)
    .select('*')
    .single();

  if (error || !updated) throw new Error(error?.message || 'resume_failed');

  await logAction(supabase, active.id, 'resume', params.actorId, {
    restoredServers: snapshots.length,
  });

  invalidateIncidentCache();
  await notifyBotIncidentSync(false);
  await invalidateAllServerConfigs(supabase);

  return { incident: mapIncident(updated) };
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Scan unsettled daily_earnings + stats for anomalous amounts in the incident window day. */
export async function previewUnsettledAnomalies(incidentId: string, actorId: string | null) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  const { data: incident, error } = await supabase
    .from('system_incident')
    .select('*')
    .eq('id', incidentId)
    .maybeSingle();
  if (error || !incident) throw new Error(error?.message || 'incident_not_found');

  const day = (incident.window_end || incident.started_at || new Date().toISOString()).slice(0, 10);

  const { data: earnings } = await supabase
    .from('daily_earnings')
    .select('id,guild_id,user_id,source,amount,settled_at,earning_date,updated_at')
    .eq('earning_date', day)
    .is('settled_at', null);

  const byGuildSource = new Map<string, number[]>();
  for (const row of earnings ?? []) {
    const key = `${row.guild_id}:${row.source}`;
    const list = byGuildSource.get(key) ?? [];
    list.push(Number(row.amount || 0));
    byGuildSource.set(key, list);
  }

  const medians = new Map<string, number>();
  for (const [key, amounts] of byGuildSource) {
    medians.set(key, median(amounts));
  }

  const affected: AffectedUserRow[] = [];
  for (const row of earnings ?? []) {
    const amount = Number(row.amount || 0);
    if (!(amount > 0)) continue;
    const key = `${row.guild_id}:${row.source}`;
    const med = medians.get(key) ?? 0;
    const threshold = Math.max(med * 3, 50);
    // Also flag if amount looks like runaway buffer replay (very high for one day)
    if (amount < threshold && amount < 100) continue;

    const proposed = med > 0 ? Number(Math.min(amount, Math.max(med * 1.5, 0)).toFixed(2)) : 0;
    const correction = Number((amount - proposed).toFixed(2));
    if (!(correction > 0)) continue;

    affected.push({
      incident_id: incidentId,
      guild_id: String(row.guild_id),
      user_id: String(row.user_id),
      category: `unsettled_${row.source}`,
      detected_amount: amount,
      proposed_correction: correction,
      status: 'previewed',
      meta: {
        earning_id: row.id,
        source: row.source,
        median: med,
        proposed_remaining: proposed,
        earning_date: day,
      },
    });
  }

  // Replace previous unsettled preview rows for this incident
  await supabase
    .from('system_incident_affected_users')
    .delete()
    .eq('incident_id', incidentId)
    .like('category', 'unsettled_%')
    .in('status', ['detected', 'previewed']);

  if (affected.length) {
    await supabase.from('system_incident_affected_users').insert(affected);
  }

  await logAction(supabase, incidentId, 'preview', actorId, {
    kind: 'unsettled',
    count: affected.length,
    day,
  });

  return { count: affected.length, affected, day };
}

export async function applyUnsettledRollback(params: {
  incidentId: string;
  actorId: string;
  ids?: string[];
}) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  let query = supabase
    .from('system_incident_affected_users')
    .select('*')
    .eq('incident_id', params.incidentId)
    .like('category', 'unsettled_%')
    .in('status', ['previewed', 'detected']);

  if (params.ids?.length) {
    query = query.in('id', params.ids);
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  let applied = 0;
  for (const row of rows ?? []) {
    const earningId = (row.meta as any)?.earning_id as string | undefined;
    const remaining = Number((row.meta as any)?.proposed_remaining ?? 0);
    const correction = Number(row.proposed_correction || 0);
    if (!earningId || !(correction > 0)) {
      await supabase
        .from('system_incident_affected_users')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      continue;
    }

    const { error: updErr } = await supabase
      .from('daily_earnings')
      .update({
        amount: Number(Math.max(0, remaining).toFixed(2)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', earningId)
      .is('settled_at', null);

    if (updErr) {
      await supabase
        .from('system_incident_affected_users')
        .update({ status: 'skipped', updated_at: new Date().toISOString(), meta: { ...(row.meta || {}), error: updErr.message } })
        .eq('id', row.id);
      continue;
    }

    // Soft-correct daily message/voice stats proportionally when possible
    const source = (row.meta as any)?.source as string | undefined;
    const day = (row.meta as any)?.earning_date as string | undefined;
    if (day && source === 'message') {
      const { data: stats } = await supabase
        .from('member_daily_stats')
        .select('id,message_count')
        .eq('guild_id', row.guild_id)
        .eq('user_id', row.user_id)
        .eq('stat_date', day)
        .maybeSingle();
      if (stats?.id && Number(stats.message_count || 0) > 0 && Number(row.detected_amount) > 0) {
        const ratio = remaining / Number(row.detected_amount);
        const nextCount = Math.max(0, Math.round(Number(stats.message_count) * ratio));
        const removed = Number(stats.message_count) - nextCount;
        await supabase
          .from('member_daily_stats')
          .update({ message_count: nextCount, updated_at: new Date().toISOString() })
          .eq('id', stats.id);
        if (removed > 0) {
          const { data: overview } = await supabase
            .from('member_overview_stats')
            .select('id,total_messages')
            .eq('guild_id', row.guild_id)
            .eq('user_id', row.user_id)
            .maybeSingle();
          if (overview?.id) {
            await supabase
              .from('member_overview_stats')
              .update({
                total_messages: Math.max(0, Number(overview.total_messages || 0) - removed),
                updated_at: new Date().toISOString(),
              })
              .eq('id', overview.id);
          }
        }
      }
    }

    await supabase
      .from('system_incident_affected_users')
      .update({
        status: 'applied',
        applied_correction: correction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    applied += 1;
  }

  await logAction(supabase, params.incidentId, 'rollback_unsettled', params.actorId, {
    applied,
    total: rows?.length ?? 0,
  });

  return { applied, total: rows?.length ?? 0 };
}

export async function previewClaimedAnomalies(incidentId: string, actorId: string | null) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  const { data: incident, error } = await supabase
    .from('system_incident')
    .select('*')
    .eq('id', incidentId)
    .maybeSingle();
  if (error || !incident) throw new Error(error?.message || 'incident_not_found');

  const start = incident.window_start;
  const end = incident.window_end || new Date().toISOString();

  const earnTypes = ['earn_message', 'earn_voice', 'watch_earn_reward', 'promotion'];
  const { data: ledger } = await supabase
    .from('wallet_ledger')
    .select('id,guild_id,user_id,amount,type,created_at,metadata')
    .gte('created_at', start)
    .lte('created_at', end)
    .in('type', earnTypes)
    .gt('amount', 0);

  const byUser = new Map<string, { guild_id: string; user_id: string; amount: number; ids: string[] }>();
  for (const row of ledger ?? []) {
    const key = `${row.guild_id}:${row.user_id}`;
    const cur = byUser.get(key) ?? {
      guild_id: String(row.guild_id),
      user_id: String(row.user_id),
      amount: 0,
      ids: [],
    };
    cur.amount += Number(row.amount || 0);
    cur.ids.push(row.id);
    byUser.set(key, cur);
  }

  const amounts = [...byUser.values()].map((v) => v.amount);
  const med = median(amounts);
  const threshold = Math.max(med * 3, 50);

  const affected: AffectedUserRow[] = [];
  for (const v of byUser.values()) {
    if (v.amount < threshold) continue;
    const proposed = med > 0 ? Number(Math.min(v.amount, Math.max(med * 1.5, 0)).toFixed(2)) : 0;
    const correction = Number((v.amount - proposed).toFixed(2));
    if (!(correction > 0)) continue;
    affected.push({
      incident_id: incidentId,
      guild_id: v.guild_id,
      user_id: v.user_id,
      category: 'claimed_earn',
      detected_amount: Number(v.amount.toFixed(2)),
      proposed_correction: correction,
      status: 'previewed',
      meta: { ledger_ids: v.ids, proposed_remaining: proposed, window_start: start, window_end: end },
    });
  }

  await supabase
    .from('system_incident_affected_users')
    .delete()
    .eq('incident_id', incidentId)
    .eq('category', 'claimed_earn')
    .in('status', ['detected', 'previewed']);

  if (affected.length) {
    await supabase.from('system_incident_affected_users').insert(affected);
  }

  await logAction(supabase, incidentId, 'preview', actorId, {
    kind: 'claimed',
    count: affected.length,
  });

  return { count: affected.length, affected, median: med };
}

export async function applyClaimedRollback(params: {
  incidentId: string;
  actorId: string;
  ids?: string[];
}) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  let query = supabase
    .from('system_incident_affected_users')
    .select('*')
    .eq('incident_id', params.incidentId)
    .eq('category', 'claimed_earn')
    .in('status', ['previewed', 'detected']);

  if (params.ids?.length) query = query.in('id', params.ids);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  let applied = 0;
  let waivedTotal = 0;

  for (const row of rows ?? []) {
    const want = Number(row.proposed_correction || 0);
    if (!(want > 0)) {
      await supabase
        .from('system_incident_affected_users')
        .update({ status: 'skipped', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      continue;
    }

    const { data: wallet } = await supabase
      .from('member_wallets')
      .select('balance')
      .eq('guild_id', row.guild_id)
      .eq('user_id', row.user_id)
      .maybeSingle();

    const balance = Number(wallet?.balance || 0);
    const claw = Number(Math.min(want, Math.max(0, balance)).toFixed(2));
    const waived = Number((want - claw).toFixed(2));
    waivedTotal += waived;

    if (claw > 0) {
      const next = Number((balance - claw).toFixed(2));
      await supabase.from('member_wallets').upsert(
        {
          guild_id: row.guild_id,
          user_id: row.user_id,
          balance: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'guild_id,user_id' },
      );

      const { error: ledgerErr } = await supabase.from('wallet_ledger').insert({
        guild_id: row.guild_id,
        user_id: row.user_id,
        amount: -claw,
        type: 'incident_clawback',
        balance_after: next,
        metadata: {
          incident_id: params.incidentId,
          affected_id: row.id,
          requested: want,
          waived,
        },
      });
      if (ledgerErr) {
        await supabase.from('wallet_ledger').insert({
          guild_id: row.guild_id,
          user_id: row.user_id,
          amount: -claw,
          type: 'admin_adjust',
          balance_after: next,
          metadata: {
            incident_id: params.incidentId,
            affected_id: row.id,
            requested: want,
            waived,
            kind: 'incident_clawback',
          },
        });
      }
    }

    // Best-effort system mail
    try {
      await supabase.from('system_mails').insert({
        guild_id: row.guild_id,
        user_id: row.user_id,
        title: 'Hesap düzeltmesi',
        body: `Ekonomi acil müdahalesi kapsamında cüzdanınızdan ${claw} Papel düzeltildi.${
          waived > 0 ? ` (Kalan ${waived} Papel borç olarak yazılmadı.)` : ''
        } Anlayışınız için teşekkürler.`,
        category: 'system',
        metadata: { incident_id: params.incidentId, claw, waived },
      });
    } catch {
      /* optional table shape */
    }

    await supabase
      .from('system_incident_affected_users')
      .update({
        status: waived > 0 && claw <= 0 ? 'waived' : 'applied',
        applied_correction: claw,
        waived_amount: waived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    applied += 1;
  }

  await logAction(supabase, params.incidentId, 'rollback_claimed', params.actorId, {
    applied,
    waivedTotal,
    total: rows?.length ?? 0,
  });

  return { applied, waivedTotal, total: rows?.length ?? 0 };
}

export async function listStoreTransferActivity(incidentId: string) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');

  const { data: incident, error } = await supabase
    .from('system_incident')
    .select('*')
    .eq('id', incidentId)
    .maybeSingle();
  if (error || !incident) throw new Error(error?.message || 'incident_not_found');

  const start = incident.window_start;
  const end = incident.window_end || new Date().toISOString();

  const { data: orders } = await supabase
    .from('store_orders')
    .select('id,guild_id,user_id,amount,status,created_at,applied_at,item_id')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })
    .limit(500);

  const { data: transfers } = await supabase
    .from('wallet_ledger')
    .select('id,guild_id,user_id,amount,type,created_at,metadata')
    .gte('created_at', start)
    .lte('created_at', end)
    .in('type', ['transfer_in', 'transfer_out', 'transfer_tax', 'purchase', 'refund'])
    .order('created_at', { ascending: false })
    .limit(500);

  return {
    orders: orders ?? [],
    transfers: transfers ?? [],
    window_start: start,
    window_end: end,
  };
}

export async function listAffectedUsers(incidentId: string) {
  const supabase = getIncidentSupabase();
  if (!supabase) throw new Error('missing_service_role');
  const { data, error } = await supabase
    .from('system_incident_affected_users')
    .select('*')
    .eq('incident_id', incidentId)
    .order('detected_amount', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
