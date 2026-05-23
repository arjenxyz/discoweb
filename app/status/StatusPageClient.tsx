'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ComponentStatus,
  DayStatus,
  StatusDayIncidents,
  StatusGroup,
  StatusIncident,
  StatusPayload,
} from '@/lib/status/types';

const REFRESH_MS = 30_000;

const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage: 'Major Outage',
  maintenance: 'Maintenance',
};

const STATUS_LABEL_TR: Record<ComponentStatus, string> = {
  operational: 'Çalışıyor',
  degraded: 'Performans Düşük',
  partial_outage: 'Kısmi Kesinti',
  major_outage: 'Büyük Kesinti',
  maintenance: 'Bakım',
};

const OVERALL_HEADLINE: Record<ComponentStatus, string> = {
  operational: 'All Systems Operational',
  degraded: 'Degraded Performance',
  partial_outage: 'Partial System Outage',
  major_outage: 'Major System Outage',
  maintenance: 'Scheduled Maintenance',
};

const OVERALL_HEADLINE_TR: Record<ComponentStatus, string> = {
  operational: 'Tüm Sistemler Çalışıyor',
  degraded: 'Bazı Servislerde Performans Düşüklüğü',
  partial_outage: 'Kısmi Sistem Kesintisi',
  major_outage: 'Büyük Sistem Kesintisi',
  maintenance: 'Planlı Bakım',
};

const BANNER_BG: Record<ComponentStatus, string> = {
  operational: 'bg-[#23a559]',
  degraded: 'bg-[#f0b232]',
  partial_outage: 'bg-[#f26522]',
  major_outage: 'bg-[#e74c3c]',
  maintenance: 'bg-[#5865F2]',
};

const STATUS_TEXT: Record<ComponentStatus, string> = {
  operational: 'text-[#23a559]',
  degraded: 'text-[#c99200]',
  partial_outage: 'text-[#e67e22]',
  major_outage: 'text-[#e74c3c]',
  maintenance: 'text-[#5865F2]',
};

const BAR_COLOR: Record<DayStatus, string> = {
  operational: 'bg-[#23a559]',
  no_data: 'bg-[#e1e4e8]',
  degraded: 'bg-[#f0b232]',
  partial_outage: 'bg-[#f26522]',
  major_outage: 'bg-[#e74c3c]',
  maintenance: 'bg-[#5865F2]',
};

const PHASE_LABEL: Record<StatusIncident['status'], string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

function UptimeBar({ history }: { history: DayStatus[] }) {
  return (
    <div className="mt-3 flex h-[34px] w-full items-end gap-[2px]" role="img" aria-label="90 day uptime history">
      {history.map((day, index) => (
        <div
          key={`${index}-${day}`}
          className={`min-w-0 flex-1 rounded-sm ${BAR_COLOR[day]}`}
          style={{ height: day === 'no_data' ? '60%' : '100%' }}
          title={day}
        />
      ))}
    </div>
  );
}

function ComponentRow({
  name,
  status,
  uptime90,
  history,
}: {
  name: string;
  status: ComponentStatus;
  uptime90: number;
  history: DayStatus[];
}) {
  return (
    <div className="border-b border-[#e3e5e8] py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold text-[#2e3438]">{name}</h3>
        <span className={`text-sm font-medium ${STATUS_TEXT[status]}`}>
          {STATUS_LABEL_TR[status]}
        </span>
      </div>
      <UptimeBar history={history} />
      <div className="mt-2 flex items-center justify-between text-xs text-[#72767d]">
        <span>90 gün önce</span>
        <span>{uptime90.toFixed(2)} % uptime</span>
        <span>Bugün</span>
      </div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: StatusIncident }) {
  return (
    <div className="border-b border-[#e3e5e8] py-4 last:border-b-0">
      <h4 className="text-[15px] font-semibold text-[#2e3438]">{incident.title}</h4>
      <div className="mt-3 space-y-3">
        {incident.updates.map((update, idx) => (
          <div key={`${incident.id}-${idx}`} className="text-sm text-[#4f5660]">
            <p>
              <strong className="text-[#2e3438]">{PHASE_LABEL[update.phase]}</strong>
              {' — '}
              {update.body}
            </p>
            <p className="mt-1 text-xs text-[#72767d]">
              {new Date(update.at).toLocaleString('tr-TR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PastIncidentsSection({ days }: { days: StatusDayIncidents[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#2e3438]">Geçmiş Olaylar</h2>
      <div className="mt-4 divide-y divide-[#e3e5e8] rounded-lg border border-[#e3e5e8] bg-white">
        {days.map((day) => (
          <div key={day.date} className="px-5 py-4">
            <h3 className="text-sm font-semibold text-[#2e3438]">{day.label}</h3>
            {day.empty ? (
              <p className="mt-2 text-sm text-[#72767d]">Olay bildirilmedi.</p>
            ) : (
              <div className="mt-2">
                {day.incidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatusPageClient() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch_failed');
      const payload = (await res.json()) as StatusPayload;
      setData(payload);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError('Durum bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const overall = data?.overall ?? 'operational';
  const groups = data?.groups ?? [];

  const legend = useMemo(
    () => [
      { color: BAR_COLOR.operational, label: 'Operational' },
      { color: BAR_COLOR.degraded, label: 'Degraded Performance' },
      { color: BAR_COLOR.partial_outage, label: 'Partial Outage' },
      { color: BAR_COLOR.major_outage, label: 'Major Outage' },
      { color: BAR_COLOR.maintenance, label: 'Maintenance' },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#2e3438]">
      {/* Header — Discord Status style */}
      <header className="border-b border-[#e3e5e8] bg-white">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]">
              <span className="text-sm font-bold text-white">DW</span>
            </div>
            <span className="text-lg font-bold text-[#2e3438]">DiscoWeb Status</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden rounded-md border border-[#5865F2] px-4 py-2 text-sm font-medium text-[#5865F2] transition hover:bg-[#5865F2]/5 sm:inline-block"
            >
              Bildirim Al
            </Link>
            <Link href="/" className="text-sm font-medium text-[#5865F2] hover:underline">
              discoweb.app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-4 py-8 sm:px-6">
        {/* Overall banner */}
        <div className={`rounded-md px-6 py-5 text-center text-white ${BANNER_BG[overall]}`}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            {loading ? 'Durum yükleniyor…' : OVERALL_HEADLINE_TR[overall]}
          </h1>
          {!loading && overall !== 'operational' && (
            <p className="mt-1 text-sm text-white/90">{OVERALL_HEADLINE[overall]}</p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Uptime intro */}
        <p className="mt-8 text-sm text-[#72767d]">
          Son 90 günün çalışma süresi.{' '}
          <span className="text-[#5865F2]">Geçmiş uptime</span>
          {lastRefresh && (
            <span className="float-right text-xs text-[#72767d]">
              Güncellendi: {lastRefresh.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </p>

        {/* Component groups */}
        <div className="mt-4 space-y-6">
          {groups.map((group: StatusGroup) => (
            <section key={group.id} className="overflow-hidden rounded-lg border border-[#e3e5e8] bg-white">
              <div className="border-b border-[#e3e5e8] bg-[#fafbfc] px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#72767d]">
                  {group.name}
                </h2>
              </div>
              <div className="px-5">
                {group.components.map((component) => (
                  <ComponentRow
                    key={component.id}
                    name={component.name}
                    status={component.status}
                    uptime90={component.uptime90}
                    history={component.history}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#72767d]">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>

        {/* Active incidents */}
        {data && data.activeIncidents.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-[#2e3438]">Aktif Olaylar</h2>
            <div className="mt-4 rounded-lg border border-[#e3e5e8] bg-white px-5">
              {data.activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          </section>
        )}

        {/* Past incidents */}
        {data && <PastIncidentsSection days={data.pastIncidents} />}

        <footer className="mt-12 border-t border-[#e3e5e8] pt-8 text-center text-xs text-[#72767d]">
          <p>
            DiscoWeb sistem durumu sayfası{' '}
            <a
              href="https://discordstatus.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5865F2] hover:underline"
            >
              Discord Status
            </a>{' '}
            tasarımından esinlenilmiştir.
          </p>
          <p className="mt-2">
            Sorun bildirmek için{' '}
            <Link href="/contact" className="text-[#5865F2] hover:underline">
              iletişim
            </Link>{' '}
            sayfasını kullanın. Veriler {REFRESH_MS / 1000} saniyede bir güncellenir.
          </p>
        </footer>
      </main>
    </div>
  );
}
