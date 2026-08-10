import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMaintenanceFlags } from '@/lib/maintenance';
import {
  buildDayKeys,
  buildHistoryFromErrors,
  calcUptimePercent,
  COMPONENT_IDS,
  HISTORY_DAYS,
  INCIDENT_DAYS,
  incidentBody,
  incidentTitle,
  liveCheckToStatus,
  mapCategoryToComponent,
  mapIncidentPhase,
  mapIncidentSeverity,
  resolveOverallStatus,
  type ErrorLogRow,
} from '@/lib/status/helpers';
import type {
  ComponentStatus,
  StatusDayIncidents,
  StatusGroup,
  StatusIncident,
  StatusPayload,
} from '@/lib/status/types';

const BOT_STATUS_URL = process.env.BOT_STATUS_URL || 'https://discoweb-bot.onrender.com/api/test';
const BOT_STATUS_TIMEOUT_MS = Number(process.env.BOT_STATUS_TIMEOUT_MS || 4000);
const DEFAULT_GUILD_ID = process.env.DISCORD_GUILD_ID || '1465698764453838882';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

async function checkBotStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BOT_STATUS_TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(BOT_STATUS_URL, { signal: controller.signal, cache: 'no-store' });
    const elapsed = Date.now() - start;
    if (res.ok) return { status: 'operational' as const, responseTime: elapsed };
    if (res.status >= 500) return { status: 'down' as const, responseTime: elapsed };
    return { status: 'degraded' as const, responseTime: elapsed };
  } catch {
    return { status: 'down' as const, responseTime: Date.now() - start };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDbStatus(supabase: NonNullable<ReturnType<typeof getSupabase>>) {
  const start = Date.now();
  try {
    const { error } = await supabase.from('servers').select('id').limit(1);
    const elapsed = Date.now() - start;
    if (error) return { status: 'down' as const, responseTime: elapsed };
    return { status: 'operational' as const, responseTime: elapsed };
  } catch {
    return { status: 'down' as const, responseTime: Date.now() - start };
  }
}

function formatDayLabel(dateKey: string, locale = 'tr-TR') {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildPastIncidents(errors: ErrorLogRow[]): StatusDayIncidents[] {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (INCIDENT_DAYS - 1));

  const dayKeys: string[] = [];
  for (let i = 0; i < INCIDENT_DAYS; i += 1) {
    const d = new Date(cutoff);
    d.setDate(cutoff.getDate() + i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const byDay = new Map<string, StatusIncident[]>();
  for (const key of dayKeys) {
    byDay.set(key, []);
  }

  for (const row of errors) {
    const day = row.created_at.slice(0, 10);
    if (!byDay.has(day)) continue;
    const phase = mapIncidentPhase(row.severity);
    byDay.get(day)!.push({
      id: row.id,
      title: incidentTitle(row.category),
      status: phase,
      severity: mapIncidentSeverity(row.severity),
      startedAt: row.created_at,
      updatedAt: row.created_at,
      affectedComponents: [mapCategoryToComponent(row.category)],
      updates: [
        {
          phase,
          body: incidentBody(row.category, row.severity),
          at: row.created_at,
        },
        ...(phase !== 'resolved'
          ? [{
              phase: 'resolved' as const,
              body: 'Sorun giderildi ve servisler normal çalışmaya döndü.',
              at: row.created_at,
            }]
          : []),
      ],
    });
  }

  return [...dayKeys].reverse().map((date) => ({
    date,
    label: formatDayLabel(date),
    incidents: byDay.get(date) ?? [],
    empty: (byDay.get(date) ?? []).length === 0,
  }));
}

export async function GET() {
  const startApi = Date.now();
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const maintenanceData = await getMaintenanceFlags(DEFAULT_GUILD_ID);
  const flags = maintenanceData?.flags;

  const [bot, db] = await Promise.all([checkBotStatus(), checkDbStatus(supabase)]);
  const webApiTime = Date.now() - startApi;
  const nowIso = new Date().toISOString();

  const historySince = new Date();
  historySince.setHours(0, 0, 0, 0);
  historySince.setDate(historySince.getDate() - (HISTORY_DAYS - 1));

  const incidentSince = new Date();
  incidentSince.setHours(0, 0, 0, 0);
  incidentSince.setDate(incidentSince.getDate() - (INCIDENT_DAYS - 1));

  const { data: historyErrors } = await supabase
    .from('error_logs')
    .select('id,code,title,severity,category,created_at')
    .gte('created_at', historySince.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  const errors = (historyErrors ?? []) as ErrorLogRow[];
  const dayKeys = buildDayKeys(HISTORY_DAYS);

  const siteMaint = Boolean(flags?.site?.is_active);
  const botMaint = Boolean(flags?.bot?.is_active);
  const storeMaint = Boolean(flags?.store?.is_active);
  const transfersMaint = Boolean(flags?.transfers?.is_active);
  const promosMaint = Boolean(flags?.promotions?.is_active || flags?.discounts?.is_active);
  const activityMaint = Boolean(flags?.activity?.is_active);

  const componentDefs = [
    {
      id: COMPONENT_IDS.WEB_API,
      name: 'Web API',
      description: 'REST API uç noktaları ve panel istekleri',
      live: liveCheckToStatus('operational', siteMaint),
      responseTime: webApiTime,
      maintenance: siteMaint,
    },
    {
      id: COMPONENT_IDS.DISCORD_BOT,
      name: 'Discord Bot',
      description: 'Bot komutları, olay dinleyicileri ve rol işlemleri',
      live: liveCheckToStatus(bot.status, botMaint),
      responseTime: bot.responseTime,
      maintenance: botMaint,
    },
    {
      id: COMPONENT_IDS.DATABASE,
      name: 'Database',
      description: 'PostgreSQL veritabanı ve Supabase bağlantısı',
      live: liveCheckToStatus(db.status, false),
      responseTime: db.responseTime,
      maintenance: false,
    },
    {
      id: COMPONENT_IDS.STORE,
      name: 'Store',
      description: 'Mağaza, ürün satın alma ve sipariş akışı',
      live: storeMaint ? 'maintenance' as ComponentStatus : 'operational',
      maintenance: storeMaint,
    },
    {
      id: COMPONENT_IDS.WALLET,
      name: 'Wallet & Transfers',
      description: 'Papel bakiyesi, transferler ve cüzdan işlemleri',
      live: transfersMaint ? 'maintenance' as ComponentStatus : 'operational',
      maintenance: transfersMaint,
    },
    {
      id: COMPONENT_IDS.PROMOTIONS,
      name: 'Promotions & Discounts',
      description: 'Promosyon ve indirim kodu kullanımı',
      live: promosMaint ? 'maintenance' as ComponentStatus : 'operational',
      maintenance: promosMaint,
    },
    {
      id: COMPONENT_IDS.ACTIVITY,
      name: 'Activity Tracking',
      description: 'Mesaj/ses aktivitesi ve kazanç senkronizasyonu',
      live: activityMaint ? 'maintenance' as ComponentStatus : 'operational',
      maintenance: activityMaint,
    },
  ] as const;

  const components = componentDefs.map((def) => {
    const history = buildHistoryFromErrors(def.id, dayKeys, errors);
    const todayKey = dayKeys[dayKeys.length - 1];
    if (def.maintenance && history.length > 0) {
      history[history.length - 1] = 'maintenance';
    }
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      status: def.live,
      uptime90: calcUptimePercent(history),
      history,
      responseTime: 'responseTime' in def ? def.responseTime : undefined,
    };
  });

  const platformIds = new Set<string>([
    COMPONENT_IDS.WEB_API,
    COMPONENT_IDS.DISCORD_BOT,
    COMPONENT_IDS.DATABASE,
  ]);
  const economyIds = new Set<string>([
    COMPONENT_IDS.STORE,
    COMPONENT_IDS.WALLET,
    COMPONENT_IDS.PROMOTIONS,
  ]);

  const groups: StatusGroup[] = [
    {
      id: 'core',
      name: 'Platform',
      components: components.filter((c) => platformIds.has(c.id)),
    },
    {
      id: 'economy',
      name: 'Economy',
      components: components.filter((c) => economyIds.has(c.id)),
    },
    {
      id: 'features',
      name: 'Features',
      components: components.filter((c) => c.id === COMPONENT_IDS.ACTIVITY),
    },
  ];

  const activeIncidents: StatusIncident[] = errors
    .filter((e) => {
      const age = Date.now() - new Date(e.created_at).getTime();
      return age <= 24 * 60 * 60 * 1000;
    })
    .slice(0, 8)
    .map((row) => {
      const phase = mapIncidentPhase(row.severity);
      return {
        id: row.id,
        title: incidentTitle(row.category),
        status: phase,
        severity: mapIncidentSeverity(row.severity),
        startedAt: row.created_at,
        updatedAt: row.created_at,
        affectedComponents: [mapCategoryToComponent(row.category)],
        updates: [
          { phase, body: incidentBody(row.category, row.severity), at: row.created_at },
        ],
      };
    });

  const payload: StatusPayload = {
    generatedAt: nowIso,
    overall: resolveOverallStatus(components.map((c) => c.status)),
    groups,
    activeIncidents,
    pastIncidents: buildPastIncidents(errors),
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
