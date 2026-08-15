import fs from 'fs';

const path = 'app/status/StatusPageClient.tsx';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("from '@/lib/i18nContext'")) {
  s = s.replace(
    "import type {\n  ComponentStatus,",
    "import { useTranslation } from '@/lib/i18nContext';\nimport type {\n  ComponentStatus,",
  );
}

// Remove hardcoded TR/EN label maps usage — keep maps removed and use t()
s = s.replace(
  /const STATUS_LABEL: Record<ComponentStatus, string> = \{[\s\S]*?\};\n\nconst STATUS_LABEL_TR: Record<ComponentStatus, string> = \{[\s\S]*?\};\n\nconst OVERALL_HEADLINE: Record<ComponentStatus, string> = \{[\s\S]*?\};\n\nconst OVERALL_HEADLINE_TR: Record<ComponentStatus, string> = \{[\s\S]*?\};\n\n/,
  '',
);

s = s.replace(
  /const PHASE_LABEL: Record<StatusIncident\['status'\], string> = \{[\s\S]*?\};\n\n/,
  '',
);

// UptimeBar needs t for aria - convert to component using hook
s = s.replace(
  `function UptimeBar({ history }: { history: DayStatus[] }) {
  return (
    <div className="mt-3 flex h-[34px] w-full items-end gap-[2px]" role="img" aria-label="90 day uptime history">`,
  `function UptimeBar({ history }: { history: DayStatus[] }) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 flex h-[34px] w-full items-end gap-[2px]" role="img" aria-label={t('status.uptime_aria')}>`,
);

s = s.replace(
  `function ComponentRow({
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
        <span className={\`text-sm font-medium \${STATUS_TEXT[status]}\`}>
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
}`,
  `function ComponentRow({
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
  const { t } = useTranslation();
  return (
    <div className="border-b border-[#e3e5e8] py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold text-[#2e3438]">{name}</h3>
        <span className={\`text-sm font-medium \${STATUS_TEXT[status]}\`}>
          {t(\`status.label.\${status}\`)}
        </span>
      </div>
      <UptimeBar history={history} />
      <div className="mt-2 flex items-center justify-between text-xs text-[#72767d]">
        <span>{t('status.days_ago')}</span>
        <span>{t('status.uptime_pct', { value: uptime90.toFixed(2) })}</span>
        <span>{t('status.today')}</span>
      </div>
    </div>
  );
}`,
);

s = s.replace(
  `function IncidentCard({ incident }: { incident: StatusIncident }) {
  return (
    <div className="border-b border-[#e3e5e8] py-4 last:border-b-0">
      <h4 className="text-[15px] font-semibold text-[#2e3438]">{incident.title}</h4>
      <div className="mt-3 space-y-3">
        {incident.updates.map((update, idx) => (
          <div key={\`\${incident.id}-\${idx}\`} className="text-sm text-[#4f5660]">
            <p>
              <strong className="text-[#2e3438]">{PHASE_LABEL[update.phase]}</strong>`,
  `function IncidentCard({ incident }: { incident: StatusIncident }) {
  const { t, language } = useTranslation();
  return (
    <div className="border-b border-[#e3e5e8] py-4 last:border-b-0">
      <h4 className="text-[15px] font-semibold text-[#2e3438]">{incident.title}</h4>
      <div className="mt-3 space-y-3">
        {incident.updates.map((update, idx) => (
          <div key={\`\${incident.id}-\${idx}\`} className="text-sm text-[#4f5660]">
            <p>
              <strong className="text-[#2e3438]">{t(\`status.phase.\${update.phase}\`)}</strong>`,
);

s = s.replace(
  "toLocaleString('tr-TR', {",
  'toLocaleString(language, {',
);

s = s.replace(
  `function PastIncidentsSection({ days }: { days: StatusDayIncidents[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#2e3438]">Geçmiş Olaylar</h2>`,
  `function PastIncidentsSection({ days }: { days: StatusDayIncidents[] }) {
  const { t } = useTranslation();
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#2e3438]">{t('status.history_title')}</h2>`,
);

s = s.replace(
  '<p className="mt-2 text-sm text-[#72767d]">Olay bildirilmedi.</p>',
  "<p className=\"mt-2 text-sm text-[#72767d]\">{t('status.no_incidents')}</p>",
);

s = s.replace(
  `export default function StatusPageClient() {
  const [data, setData] = useState<StatusPayload | null>(null);`,
  `export default function StatusPageClient() {
  const { t, language } = useTranslation();
  const [data, setData] = useState<StatusPayload | null>(null);`,
);

s = s.replace(
  "setError('Durum bilgileri yüklenemedi.');",
  "setError(t('status.load_error'));",
);

// refresh callback depends on t
s = s.replace(
  `  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);`,
  `  }, [t]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);`,
);

s = s.replace(
  `  const legend = useMemo(
    () => [
      { color: BAR_COLOR.operational, label: 'Operational' },
      { color: BAR_COLOR.degraded, label: 'Degraded Performance' },
      { color: BAR_COLOR.partial_outage, label: 'Partial Outage' },
      { color: BAR_COLOR.major_outage, label: 'Major Outage' },
      { color: BAR_COLOR.maintenance, label: 'Maintenance' },
    ],
    [],
  );`,
  `  const legend = useMemo(
    () => [
      { color: BAR_COLOR.operational, label: t('status.label.operational') },
      { color: BAR_COLOR.degraded, label: t('status.label.degraded') },
      { color: BAR_COLOR.partial_outage, label: t('status.label.partial_outage') },
      { color: BAR_COLOR.major_outage, label: t('status.label.major_outage') },
      { color: BAR_COLOR.maintenance, label: t('status.label.maintenance') },
    ],
    [t],
  );`,
);

s = s.replace(
  "{loading ? 'Durum yükleniyor…' : OVERALL_HEADLINE_TR[overall]}",
  "{loading ? t('status.loading') : t(`status.headline.${overall}`)}",
);

s = s.replace(
  `<p className="mt-1 text-sm text-white/90">{OVERALL_HEADLINE[overall]}</p>`,
  `<p className="mt-1 text-sm text-white/90">{t(\`status.label.\${overall}\`)}</p>`,
);

s = s.replace(
  `        <p className="mt-8 text-sm text-[#72767d]">
          Son 90 günün çalışma süresi.{' '}
          <span className="text-[#5865F2]">Geçmiş uptime</span>
          {lastRefresh && (
            <span className="float-right text-xs text-[#72767d]">
              Güncellendi: {lastRefresh.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </p>`,
  `        <p className="mt-8 text-sm text-[#72767d]">
          {t('status.uptime_intro')}{' '}
          <span className="text-[#5865F2]">{t('status.past_uptime')}</span>
          {lastRefresh && (
            <span className="float-right text-xs text-[#72767d]">
              {t('status.updated', { time: lastRefresh.toLocaleTimeString(language) })}
            </span>
          )}
        </p>`,
);

fs.writeFileSync(path, s);
console.log('status client patched');
const left = s.split('\n').filter((l) => /[ğüşıöçĞÜŞİÖÇ]/.test(l));
console.log('TR lines', left.length);
left.slice(0, 20).forEach((l) => console.log(l.trim().slice(0, 120)));
