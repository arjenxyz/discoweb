import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BOT_STATUS_URL = process.env.BOT_STATUS_URL || 'https://discoweb-bot.onrender.com/api/test';
const BOT_STATUS_TIMEOUT_MS = Number(process.env.BOT_STATUS_TIMEOUT_MS || 4000);

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const mapIncidentStatus = (severity?: string) => {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'investigating';
  if (s === 'HIGH') return 'identified';
  if (s === 'MEDIUM') return 'monitoring';
  return 'monitoring';
};

const mapIncidentSeverity = (severity?: string) => {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
};

const mapAffectedService = (category?: string) => {
  const c = (category || '').toUpperCase();
  if (c === 'DATA') return 'Database';
  if (c === 'NETWORK' || c === 'SYSTEM' || c === 'PERMISSION') return 'Discord Bot';
  return 'Web API';
};

const friendlyIncidentTitle = (category?: string) => {
  const c = (category || '').toUpperCase();
  if (c === 'DATA') return 'Veritabanında gecikme veya hata';
  if (c === 'NETWORK') return 'Discord bağlantısında sorun';
  if (c === 'PERMISSION') return 'Bot yetkilerinde sorun';
  if (c === 'SYSTEM') return 'Botta beklenmeyen hata';
  return 'Web servisinde sorun';
};

const friendlyIncidentDescription = (category?: string, severity?: string) => {
  const c = (category || '').toUpperCase();
  const s = (severity || '').toUpperCase();
  const critical = s === 'CRITICAL' || s === 'HIGH';
  if (c === 'DATA') {
    return critical
      ? 'Veritabanında kritik hata var. Ekiplerimiz müdahale ediyor.'
      : 'Veritabanında performans sorunu tespit edildi, takipteyiz.';
  }
  if (c === 'NETWORK') {
    return critical
      ? 'Discord bağlantısında kritik kesinti var, ekiplerimiz inceliyor.'
      : 'Discord bağlantısında geçici dalgalanma var, izleniyor.';
  }
  if (c === 'PERMISSION') {
    return 'Bot yetkilerinde sorun var. Ekiplerimiz düzeltme üzerinde çalışıyor.';
  }
  if (c === 'SYSTEM') {
    return critical
      ? 'Botta kritik bir hata oluştu, ekiplerimiz inceliyor.'
      : 'Botta geçici bir hata oluştu, ekiplerimiz izliyor.';
  }
  return critical
    ? 'Web servisinde kritik hata var, ekiplerimiz inceliyor.'
    : 'Web servisinde küçük bir sorun tespit edildi, izleniyor.';
};

async function checkBotStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BOT_STATUS_TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(BOT_STATUS_URL, { signal: controller.signal, cache: 'no-store' });
    const elapsed = Date.now() - start;
    if (res.ok) {
      return { status: 'operational', responseTime: elapsed };
    }
    if (res.status >= 500) return { status: 'down', responseTime: elapsed };
    return { status: 'degraded', responseTime: elapsed };
  } catch {
    const elapsed = Date.now() - start;
    return { status: 'down', responseTime: elapsed };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkDbStatus(supabase: NonNullable<ReturnType<typeof getSupabase>>) {
  const start = Date.now();
  try {
    const { error } = await supabase
      .from('servers')
      .select('id')
      .limit(1);
    const elapsed = Date.now() - start;
    if (error) return { status: 'down', responseTime: elapsed };
    return { status: 'operational', responseTime: elapsed };
  } catch {
    const elapsed = Date.now() - start;
    return { status: 'down', responseTime: elapsed };
  }
}

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });

  const [bot, db] = await Promise.all([
    checkBotStatus(),
    checkDbStatus(supabase),
  ]);

  const nowIso = new Date().toISOString();
  const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentErrors } = await supabase
    .from('error_logs')
    .select('id,code,title,severity,category,created_at')
    .gte('created_at', dayAgoIso)
    .order('created_at', { ascending: false })
    .limit(10);

  const incidents = (recentErrors || []).map((e) => ({
    id: e.id,
    title: friendlyIncidentTitle(e.category),
    status: mapIncidentStatus(e.severity),
    severity: mapIncidentSeverity(e.severity),
    startedAt: e.created_at,
    updatedAt: e.created_at,
    description: friendlyIncidentDescription(e.category, e.severity),
    affectedServices: [mapAffectedService(e.category)],
  }));

  return NextResponse.json({
    generatedAt: nowIso,
    services: [
      {
        name: 'Discord Bot API',
        status: bot.status,
        description: 'Discord bot komutları ve olayları',
        lastChecked: nowIso,
        responseTime: bot.responseTime,
      },
      {
        name: 'Database',
        status: db.status,
        description: 'PostgreSQL veritabanı bağlantısı',
        lastChecked: nowIso,
        responseTime: db.responseTime,
      },
      {
        name: 'Web API',
        status: 'operational',
        description: 'REST API endpoint\'leri',
        lastChecked: nowIso,
        responseTime: 0,
      },
    ],
    incidents,
  });
}
