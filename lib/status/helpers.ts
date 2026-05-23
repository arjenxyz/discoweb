import type { ComponentStatus, DayStatus, IncidentPhase } from './types';

export const HISTORY_DAYS = 90;
export const INCIDENT_DAYS = 14;

export type ErrorLogRow = {
  id: string;
  code?: string | null;
  title?: string | null;
  severity?: string | null;
  category?: string | null;
  created_at: string;
};

export const COMPONENT_IDS = {
  WEB_API: 'web-api',
  DISCORD_BOT: 'discord-bot',
  DATABASE: 'database',
  STORE: 'store',
  WALLET: 'wallet',
  PROMOTIONS: 'promotions',
  ACTIVITY: 'activity',
} as const;

export type ComponentId = (typeof COMPONENT_IDS)[keyof typeof COMPONENT_IDS];

export function mapCategoryToComponent(category?: string | null): ComponentId {
  const c = (category || '').toUpperCase();
  if (c === 'DATA') return COMPONENT_IDS.DATABASE;
  if (c === 'NETWORK' || c === 'SYSTEM' || c === 'PERMISSION') return COMPONENT_IDS.DISCORD_BOT;
  if (c === 'STORE') return COMPONENT_IDS.STORE;
  if (c === 'WALLET') return COMPONENT_IDS.WALLET;
  return COMPONENT_IDS.WEB_API;
}

export function severityToDayStatus(severity?: string | null): DayStatus {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'major_outage';
  if (s === 'HIGH') return 'partial_outage';
  if (s === 'MEDIUM') return 'degraded';
  if (s === 'LOW') return 'degraded';
  return 'operational';
}

export function mergeDayStatus(current: DayStatus, next: DayStatus): DayStatus {
  const rank: Record<DayStatus, number> = {
    operational: 0,
    no_data: 0,
    maintenance: 1,
    degraded: 2,
    partial_outage: 3,
    major_outage: 4,
  };
  return rank[next] > rank[current] ? next : current;
}

export function dayStatusToComponentStatus(status: DayStatus): ComponentStatus {
  if (status === 'major_outage') return 'major_outage';
  if (status === 'partial_outage') return 'partial_outage';
  if (status === 'degraded') return 'degraded';
  if (status === 'maintenance') return 'maintenance';
  return 'operational';
}

export function calcUptimePercent(history: DayStatus[]): number {
  if (history.length === 0) return 100;
  let score = 0;
  for (const day of history) {
    switch (day) {
      case 'operational':
      case 'no_data':
        score += 1;
        break;
      case 'maintenance':
        score += 0.995;
        break;
      case 'degraded':
        score += 0.98;
        break;
      case 'partial_outage':
        score += 0.5;
        break;
      case 'major_outage':
        score += 0;
        break;
      default:
        score += 1;
    }
  }
  return Number(((score / history.length) * 100).toFixed(2));
}

export function buildDayKeys(days: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function buildHistoryFromErrors(
  componentId: ComponentId,
  dayKeys: string[],
  errors: ErrorLogRow[],
): DayStatus[] {
  const byDay = new Map<string, DayStatus>();
  for (const key of dayKeys) {
    byDay.set(key, 'operational');
  }

  for (const row of errors) {
    if (mapCategoryToComponent(row.category) !== componentId) continue;
    const day = row.created_at.slice(0, 10);
    if (!byDay.has(day)) continue;
    const next = severityToDayStatus(row.severity);
    byDay.set(day, mergeDayStatus(byDay.get(day)!, next));
  }

  return dayKeys.map((key) => byDay.get(key) ?? 'operational');
}

export function mapIncidentPhase(severity?: string | null): IncidentPhase {
  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'investigating';
  if (s === 'HIGH') return 'identified';
  if (s === 'MEDIUM') return 'monitoring';
  return 'resolved';
}

export function mapIncidentSeverity(severity?: string | null): 'low' | 'medium' | 'high' | 'critical' {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'medium') return 'medium';
  return 'low';
}

export function incidentTitle(category?: string | null) {
  const c = (category || '').toUpperCase();
  if (c === 'DATA') return 'Veritabanı gecikmesi veya bağlantı sorunu';
  if (c === 'NETWORK') return 'Discord bağlantı sorunu';
  if (c === 'PERMISSION') return 'Bot yetki sorunu';
  if (c === 'SYSTEM') return 'Bot servisinde beklenmeyen hata';
  if (c === 'STORE') return 'Mağaza işlemlerinde sorun';
  if (c === 'WALLET') return 'Cüzdan işlemlerinde sorun';
  return 'Web API servisinde sorun';
}

export function incidentBody(category?: string | null, severity?: string | null) {
  const critical = ['CRITICAL', 'HIGH'].includes((severity || '').toUpperCase());
  const c = (category || '').toUpperCase();
  if (c === 'DATA') {
    return critical
      ? 'Veritabanında kritik bir hata tespit edildi. Ekibimiz müdahale ediyor.'
      : 'Veritabanında performans dalgalanması gözlemlendi, izleniyor.';
  }
  if (c === 'NETWORK') {
    return critical
      ? 'Discord bağlantısında kesinti yaşanıyor.'
      : 'Discord bağlantısında geçici dalgalanma var.';
  }
  if (c === 'SYSTEM' || c === 'PERMISSION') {
    return critical
      ? 'Discord bot servisinde kritik bir sorun var.'
      : 'Discord bot servisinde geçici bir sorun tespit edildi.';
  }
  return critical
    ? 'Web servislerinde kritik bir sorun tespit edildi.'
    : 'Web servislerinde küçük bir sorun tespit edildi, izleniyor.';
}

export function resolveOverallStatus(statuses: ComponentStatus[]): ComponentStatus {
  if (statuses.some((s) => s === 'major_outage')) return 'major_outage';
  if (statuses.some((s) => s === 'partial_outage')) return 'partial_outage';
  if (statuses.some((s) => s === 'maintenance')) return 'maintenance';
  if (statuses.some((s) => s === 'degraded')) return 'degraded';
  return 'operational';
}

export function liveCheckToStatus(
  check: 'operational' | 'degraded' | 'down',
  maintenance: boolean,
): ComponentStatus {
  if (maintenance) return 'maintenance';
  if (check === 'down') return 'major_outage';
  if (check === 'degraded') return 'degraded';
  return 'operational';
}
